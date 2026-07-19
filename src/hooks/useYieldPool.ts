"use client";

import { useCallback } from "react";
import { useAccount, useReadContract } from "wagmi";
import { readContract } from "wagmi/actions";
import { wagmiConfig } from "@/lib/wagmi";
import { erc20Abi, allowlistAbi, yieldPoolAbi } from "@/lib/contracts/abis";
import {
  USDG_ADDRESS,
  YIELD_POOL_ADDRESS,
  ALLOWLIST_ADDRESS,
} from "@/lib/contracts/addresses";
import { useTxFlow } from "./useTxFlow";
import { parseUsdg } from "@/lib/format";

/** Fixed APY (basis points) the pool pays. Falls back to 1200 (12%) if unread. */
export function usePoolApyBps() {
  return useReadContract({
    address: YIELD_POOL_ADDRESS,
    abi: yieldPoolAbi,
    functionName: "apyBps",
    query: { enabled: !!YIELD_POOL_ADDRESS },
  });
}

/** Total USDG principal currently deposited across all pool depositors. */
export function usePoolTotalPrincipal() {
  return useReadContract({
    address: YIELD_POOL_ADDRESS,
    abi: yieldPoolAbi,
    functionName: "totalPrincipal",
    query: { enabled: !!YIELD_POOL_ADDRESS, refetchInterval: 30_000 },
  });
}

/** The connected wallet's pool principal, accrued yield, USDG balance, and
 *  whether they're currently allowed to invest. */
export function usePoolPosition() {
  const { address } = useAccount();

  const principal = useReadContract({
    address: YIELD_POOL_ADDRESS,
    abi: yieldPoolAbi,
    functionName: "principalOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!YIELD_POOL_ADDRESS },
  });

  const earned = useReadContract({
    address: YIELD_POOL_ADDRESS,
    abi: yieldPoolAbi,
    functionName: "earned",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!YIELD_POOL_ADDRESS, refetchInterval: 15_000 },
  });

  const balance = useReadContract({
    address: USDG_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!USDG_ADDRESS },
  });

  const isAllowed = useReadContract({
    address: ALLOWLIST_ADDRESS,
    abi: allowlistAbi,
    functionName: "isAllowed",
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!ALLOWLIST_ADDRESS },
  });

  return { principal, earned, balance, isAllowed };
}

/** Approve (if needed) then deposit a USDG amount string into the pool. */
export function usePoolDeposit() {
  const { address } = useAccount();
  const { run, pending } = useTxFlow();

  const deposit = useCallback(
    async (amountStr: string): Promise<boolean> => {
      if (!YIELD_POOL_ADDRESS || !USDG_ADDRESS || !address) return false;
      const amount = parseUsdg(amountStr);
      if (amount <= 0n) return false;

      const current = (await readContract(wagmiConfig, {
        address: USDG_ADDRESS,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address, YIELD_POOL_ADDRESS],
      })) as bigint;

      if (current < amount) {
        const approved = await run(
          {
            address: USDG_ADDRESS,
            abi: erc20Abi,
            functionName: "approve",
            args: [YIELD_POOL_ADDRESS, amount],
          },
          { pending: "Approving USDG", success: "USDG approved" }
        );
        if (!approved) return false;
      }

      return run(
        {
          address: YIELD_POOL_ADDRESS,
          abi: yieldPoolAbi,
          functionName: "deposit",
          args: [amount],
        },
        { pending: "Depositing into the pool", success: "You're earning yield" }
      );
    },
    [address, run]
  );

  return { deposit, pending };
}

/** Withdraw a USDG amount string of principal from the pool. */
export function usePoolWithdraw() {
  const { run, pending } = useTxFlow();

  const withdraw = useCallback(
    async (amountStr: string): Promise<boolean> => {
      if (!YIELD_POOL_ADDRESS) return false;
      const amount = parseUsdg(amountStr);
      if (amount <= 0n) return false;

      return run(
        {
          address: YIELD_POOL_ADDRESS,
          abi: yieldPoolAbi,
          functionName: "withdraw",
          args: [amount],
        },
        { pending: "Withdrawing principal", success: "Withdrawal complete" }
      );
    },
    [run]
  );

  return { withdraw, pending };
}

/** Claim all accrued pool yield. */
export function usePoolClaimYield() {
  const { run, pending } = useTxFlow();

  const claim = useCallback(async (): Promise<boolean> => {
    if (!YIELD_POOL_ADDRESS) return false;
    return run(
      {
        address: YIELD_POOL_ADDRESS,
        abi: yieldPoolAbi,
        functionName: "claimYield",
      },
      { pending: "Claiming yield", success: "Yield claimed" }
    );
  }, [run]);

  return { claim, pending };
}
