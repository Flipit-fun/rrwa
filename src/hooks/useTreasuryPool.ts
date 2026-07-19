"use client";

import { useCallback, useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { writeContract, waitForTransactionReceipt } from "wagmi/actions";
import { useQuery } from "@tanstack/react-query";
import type { Address } from "viem";
import { wagmiConfig } from "@/lib/wagmi";
import { erc20Abi } from "@/lib/contracts/abis";
import { USDG_ADDRESS } from "@/lib/contracts/addresses";
import { useToast } from "@/components/Toast";
import { txUrl } from "@/lib/explorer";
import { humanizeError } from "./useTxFlow";
import { parseUsdg } from "@/lib/format";
import {
  recordDeposit,
  getDepositTotal,
  requestPayout,
} from "@/app/actions/pool";

/**
 * No pool contract. Each property has its own dedicated treasury wallet;
 * investing in a property means sending USDG directly to that property's
 * wallet, then recording the transfer in our database so the app can show a
 * running total. Withdrawals and yield are both handled the same way in
 * reverse: the user submits a request scoped to that property, and the
 * RRWA team pays out manually from the matching wallet — there is no
 * automated payout logic. A withdrawal can never exceed what was deposited
 * into that specific property (enforced server-side in actions/pool.ts).
 */

/** The connected wallet's USDG balance. */
export function useUsdgBalance() {
  const { address } = useAccount();
  return useReadContract({
    address: USDG_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!USDG_ADDRESS },
  });
}

/** Total USDG the connected wallet has deposited into one property. */
export function useDepositTotal(assetId?: string) {
  const { address } = useAccount();
  return useQuery({
    queryKey: ["pool-deposit-total", assetId, address],
    enabled: !!address && !!assetId,
    queryFn: () => getDepositTotal(assetId as string, address as string),
  });
}

/** Send USDG straight to a property's treasury wallet, then record it. */
export function useDepositToTreasury(
  assetId?: string,
  treasuryAddress?: Address | null
) {
  const { address } = useAccount();
  const { push, update } = useToast();
  const [pending, setPending] = useState(false);

  const deposit = useCallback(
    async (amountStr: string): Promise<boolean> => {
      if (!USDG_ADDRESS || !treasuryAddress || !address || !assetId) return false;
      const amount = parseUsdg(amountStr);
      if (amount <= 0n) return false;

      setPending(true);
      const toastId = push({
        kind: "pending",
        title: "Sending USDG to the property treasury",
        message: "Confirm in your wallet.",
      });
      try {
        const hash = await writeContract(wagmiConfig, {
          address: USDG_ADDRESS,
          abi: erc20Abi,
          functionName: "transfer",
          args: [treasuryAddress, amount],
        });
        update(toastId, {
          message: "Submitted. Waiting for confirmation.",
          href: txUrl(hash),
        });
        await waitForTransactionReceipt(wagmiConfig, { hash });

        const recorded = await recordDeposit({
          assetId,
          depositor: address,
          amountUsdc: amount.toString(),
          txHash: hash,
        });

        if (!recorded.ok) {
          update(toastId, {
            kind: "error",
            title: "Transfer sent, but we couldn't record it",
            message: `${recorded.error} Your funds were sent — contact us with tx ${hash}.`,
          });
          return false;
        }

        update(toastId, {
          kind: "success",
          title: "Investment received",
          message: "We've recorded your deposit for this property.",
          href: txUrl(hash),
        });
        return true;
      } catch (err) {
        update(toastId, {
          kind: "error",
          title: "Could not send the deposit",
          message: humanizeError(err),
        });
        return false;
      } finally {
        setPending(false);
      }
    },
    [address, assetId, treasuryAddress, push, update]
  );

  return { deposit, pending };
}

/** Submit a manual withdrawal or yield-payout request for one property. */
export function usePayoutRequest(assetId?: string) {
  const { address } = useAccount();
  const { push, update } = useToast();
  const [pending, setPending] = useState(false);

  const submit = useCallback(
    async (
      kind: "WITHDRAWAL" | "YIELD",
      amountStr: string,
      note?: string
    ): Promise<boolean> => {
      if (!address || !assetId) return false;
      const amount = parseUsdg(amountStr);
      if (amount <= 0n) return false;

      setPending(true);
      const toastId = push({
        kind: "pending",
        title:
          kind === "WITHDRAWAL"
            ? "Submitting withdrawal request"
            : "Submitting yield payout request",
      });
      try {
        const result = await requestPayout({
          assetId,
          requester: address,
          kind,
          amountUsdc: amount.toString(),
          note,
        });
        if (!result.ok) {
          update(toastId, {
            kind: "error",
            title: "Could not submit request",
            message: result.error,
          });
          return false;
        }
        update(toastId, {
          kind: "success",
          title: "Request submitted",
          message: "The RRWA team will review and pay out manually.",
        });
        return true;
      } finally {
        setPending(false);
      }
    },
    [address, assetId, push, update]
  );

  return { submit, pending };
}
