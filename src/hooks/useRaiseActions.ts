"use client";

import { useCallback } from "react";
import { useAccount, useReadContract } from "wagmi";
import { readContract } from "wagmi/actions";
import type { Address } from "viem";
import { wagmiConfig } from "@/lib/wagmi";
import {
  erc20Abi,
  raiseAbi,
  rentVaultAbi,
  shareTokenAbi,
} from "@/lib/contracts/abis";
import { USDG_ADDRESS } from "@/lib/contracts/addresses";
import { useTxFlow } from "./useTxFlow";
import { parseUsdg } from "@/lib/format";

/** Read the connected wallet's USDG balance + allowance for a raise. */
export function useUsdgPosition(raiseAddress?: Address) {
  const { address } = useAccount();

  const balance = useReadContract({
    address: USDG_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!USDG_ADDRESS },
  });

  const allowance = useReadContract({
    address: USDG_ADDRESS,
    abi: erc20Abi,
    functionName: "allowance",
    args: address && raiseAddress ? [address, raiseAddress] : undefined,
    query: { enabled: !!address && !!raiseAddress && !!USDG_ADDRESS },
  });

  return { balance, allowance };
}

/** Read the connected wallet's share balance + accrued yield for a raise. */
export function useSharePosition(
  shareToken?: Address,
  rentVault?: Address
) {
  const { address } = useAccount();

  const shares = useReadContract({
    address: shareToken,
    abi: shareTokenAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!shareToken },
  });

  const earned = useReadContract({
    address: rentVault,
    abi: rentVaultAbi,
    functionName: "earned",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!rentVault, refetchInterval: 15_000 },
  });

  return { shares, earned };
}

/** Approve (if needed) then fund a raise with a USDG amount string. */
export function useFund(raiseAddress?: Address) {
  const { address } = useAccount();
  const { run, pending } = useTxFlow();

  const fund = useCallback(
    async (amountStr: string): Promise<boolean> => {
      if (!raiseAddress || !address || !USDG_ADDRESS) return false;
      const amount = parseUsdg(amountStr);
      if (amount <= 0n) return false;

      // check current allowance; approve only if short
      const current = (await readContract(wagmiConfig, {
        address: USDG_ADDRESS,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address, raiseAddress],
      })) as bigint;

      if (current < amount) {
        const approved = await run(
          {
            address: USDG_ADDRESS,
            abi: erc20Abi,
            functionName: "approve",
            args: [raiseAddress, amount],
          },
          { pending: "Approving USDG", success: "USDG approved" }
        );
        if (!approved) return false;
      }

      return run(
        {
          address: raiseAddress,
          abi: raiseAbi,
          functionName: "fund",
          args: [amount],
        },
        { pending: "Funding the raise", success: "You're in" }
      );
    },
    [raiseAddress, address, run]
  );

  return { fund, pending };
}

/** Lister withdraws the full raised amount once funded. */
export function useWithdraw(raiseAddress?: Address) {
  const { run, pending } = useTxFlow();
  const withdraw = useCallback(async () => {
    if (!raiseAddress) return false;
    return run(
      { address: raiseAddress, abi: raiseAbi, functionName: "withdraw" },
      { pending: "Withdrawing funds", success: "Funds withdrawn" }
    );
  }, [raiseAddress, run]);
  return { withdraw, pending };
}

/** Shareholder claims accrued yield from the rent vault. */
export function useClaimYield(rentVault?: Address) {
  const { run, pending } = useTxFlow();
  const claim = useCallback(async () => {
    if (!rentVault) return false;
    return run(
      { address: rentVault, abi: rentVaultAbi, functionName: "claimYield" },
      { pending: "Claiming yield", success: "Yield claimed" }
    );
  }, [rentVault, run]);
  return { claim, pending };
}
