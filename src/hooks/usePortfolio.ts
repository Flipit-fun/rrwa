"use client";

import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { readContract } from "wagmi/actions";
import type { Address } from "viem";
import { wagmiConfig } from "@/lib/wagmi";
import { shareTokenAbi, rentVaultAbi } from "@/lib/contracts/abis";
import { useRaisesWithMeta, type RaiseWithMeta } from "./useRaises";

export type Position = RaiseWithMeta & {
  shares: bigint;
  earned: bigint;
  matured: boolean;
};

/**
 * The connected wallet's positions: every raise where it holds shares, with
 * live share balance and accrued yield.
 */
export function usePortfolio() {
  const { address } = useAccount();
  const { data: raises, isLoading: raisesLoading } = useRaisesWithMeta();

  const query = useQuery({
    queryKey: ["portfolio", address, raises?.map((r) => r.address)],
    enabled: !!address && !!raises,
    refetchInterval: 20_000,
    queryFn: async (): Promise<Position[]> => {
      if (!address || !raises) return [];
      const results = await Promise.all(
        raises.map(async (r): Promise<Position | null> => {
          const shares = (await readContract(wagmiConfig, {
            address: r.shareToken,
            abi: shareTokenAbi,
            functionName: "balanceOf",
            args: [address],
          })) as bigint;

          if (shares === 0n) return null;

          let earned = 0n;
          let matured = false;
          try {
            earned = (await readContract(wagmiConfig, {
              address: r.rentVault,
              abi: rentVaultAbi,
              functionName: "earned",
              args: [address],
            })) as bigint;
          } catch {
            earned = 0n;
          }
          try {
            const end = (await readContract(wagmiConfig, {
              address: r.rentVault,
              abi: rentVaultAbi,
              functionName: "endTime",
            })) as bigint;
            matured = end > 0n && BigInt(Math.floor(Date.now() / 1000)) >= end;
          } catch {
            matured = false;
          }

          return { ...r, shares, earned, matured };
        })
      );
      return results.filter((p): p is Position => p !== null);
    },
  });

  return { ...query, isLoading: raisesLoading || query.isLoading };
}
