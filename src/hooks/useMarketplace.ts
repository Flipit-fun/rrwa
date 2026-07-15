"use client";

import { useCallback } from "react";
import { useAccount } from "wagmi";
import {
  writeContract,
  waitForTransactionReceipt,
  readContract,
} from "wagmi/actions";
import type { Address } from "viem";
import { wagmiConfig } from "@/lib/wagmi";
import { marketplaceAbi, shareTokenAbi } from "@/lib/contracts/abis";
import { MARKETPLACE_ADDRESS } from "@/lib/contracts/addresses";
import { useToast } from "@/components/Toast";
import { txUrl } from "@/lib/explorer";
import { humanizeError } from "./useTxFlow";

/** Approve shares to the marketplace, then list them at a USDC price. */
export function useListShares() {
  const { address } = useAccount();
  const { push, update } = useToast();

  const listShares = useCallback(
    async (params: {
      raise: Address;
      shareToken: Address;
      shareAmount: bigint;
      price: bigint;
    }): Promise<boolean> => {
      if (!MARKETPLACE_ADDRESS || !address) return false;
      const toastId = push({
        kind: "pending",
        title: "Listing your shares",
        message: "Approve the marketplace to hold your shares.",
      });
      try {
        const current = (await readContract(wagmiConfig, {
          address: params.shareToken,
          abi: shareTokenAbi,
          functionName: "allowance",
          args: [address, MARKETPLACE_ADDRESS],
        })) as bigint;

        if (current < params.shareAmount) {
          const approveHash = await writeContract(wagmiConfig, {
            address: params.shareToken,
            abi: shareTokenAbi,
            functionName: "approve",
            args: [MARKETPLACE_ADDRESS, params.shareAmount],
          });
          await waitForTransactionReceipt(wagmiConfig, { hash: approveHash });
        }

        update(toastId, { message: "Posting the listing." });
        const listHash = await writeContract(wagmiConfig, {
          address: MARKETPLACE_ADDRESS,
          abi: marketplaceAbi,
          functionName: "list",
          args: [params.raise, params.shareAmount, params.price],
        });
        update(toastId, { href: txUrl(listHash) });
        await waitForTransactionReceipt(wagmiConfig, { hash: listHash });

        update(toastId, {
          kind: "success",
          title: "Shares listed",
          message: "Your position is on the marketplace.",
          href: txUrl(listHash),
        });
        return true;
      } catch (err) {
        update(toastId, {
          kind: "error",
          title: "Could not list shares",
          message: humanizeError(err),
        });
        return false;
      }
    },
    [address, push, update]
  );

  return { listShares };
}
