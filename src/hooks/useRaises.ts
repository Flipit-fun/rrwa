"use client";

import { useQuery } from "@tanstack/react-query";
import { useReadContract } from "wagmi";
import { readContract } from "wagmi/actions";
import type { Address } from "viem";
import { wagmiConfig } from "@/lib/wagmi";
import { factoryAbi, raiseAbi, shareTokenAbi } from "@/lib/contracts/abis";
import { FACTORY_ADDRESS } from "@/lib/contracts/addresses";
import type { AssetMetadata } from "@/lib/assets";

export type RaiseSummary = {
  address: Address;
  state: number;
  target: bigint;
  raised: bigint;
  apyBps: number;
  funderCount: number;
  shareToken: Address;
  rentVault: Address;
  lister: Address;
};

export type RaiseWithMeta = RaiseSummary & {
  meta: AssetMetadata | null;
};

/** Read the full raise registry from the factory. */
export function useRaiseAddresses() {
  return useReadContract({
    address: FACTORY_ADDRESS,
    abi: factoryAbi,
    functionName: "allRaises",
    query: {
      enabled: !!FACTORY_ADDRESS,
    },
  });
}

async function fetchRaiseSummary(address: Address): Promise<RaiseSummary> {
  const res = await readContract(wagmiConfig, {
    address,
    abi: raiseAbi,
    functionName: "summary",
  });
  const [
    state,
    target,
    raised,
    apyBps,
    funderCount,
    shareToken,
    rentVault,
    lister,
  ] = res as unknown as [
    number,
    bigint,
    bigint,
    bigint,
    bigint,
    Address,
    Address,
    Address,
  ];
  return {
    address,
    state: Number(state),
    target,
    raised,
    apyBps: Number(apyBps),
    funderCount: Number(funderCount),
    shareToken,
    rentVault,
    lister,
  };
}

async function fetchMetadata(
  addresses: Address[]
): Promise<Record<string, AssetMetadata>> {
  if (addresses.length === 0) return {};
  try {
    const res = await fetch(`/api/metadata?addresses=${addresses.join(",")}`);
    if (!res.ok) return {};
    return (await res.json()) as Record<string, AssetMetadata>;
  } catch {
    // DB unreachable (e.g. no Postgres locally) — fall back to on-chain names.
    return {};
  }
}

/**
 * When a raise has no off-chain metadata (no DB row yet, or DB unavailable),
 * synthesize a minimal record from the on-chain ShareToken name so the UI
 * still shows a real asset name instead of "Untitled asset".
 */
async function onChainFallbackMeta(
  summary: RaiseSummary
): Promise<AssetMetadata | null> {
  try {
    const name = (await readContract(wagmiConfig, {
      address: summary.shareToken,
      abi: shareTokenAbi,
      functionName: "name",
    })) as string;
    return {
      id: summary.address,
      raiseAddress: summary.address,
      lister: summary.lister,
      name: name || "Untitled asset",
      city: "",
      region: "On chain",
      description: "",
      assetType: "OTHER",
      targetUsdc: summary.target.toString(),
      apyBps: summary.apyBps,
      kybStatus: "PENDING",
      coverImageUrl: null,
    };
  } catch {
    return null;
  }
}

async function mergeMeta(
  summaries: RaiseSummary[]
): Promise<RaiseWithMeta[]> {
  const meta = await fetchMetadata(summaries.map((s) => s.address));
  return Promise.all(
    summaries.map(async (s) => {
      const dbMeta = meta[s.address.toLowerCase()] ?? null;
      const resolved = dbMeta ?? (await onChainFallbackMeta(s));
      return { ...s, meta: resolved };
    })
  );
}

/**
 * Merge the on-chain registry with off-chain metadata. On-chain is the source
 * of truth for money/state; DB supplies descriptive fields.
 */
export function useRaisesWithMeta() {
  const { data: addresses, isLoading: addrLoading } = useRaiseAddresses();

  return useQuery({
    queryKey: ["raises", addresses],
    enabled: !!addresses,
    queryFn: async (): Promise<RaiseWithMeta[]> => {
      const list = (addresses ?? []) as Address[];
      const summaries = await Promise.all(list.map(fetchRaiseSummary));
      return mergeMeta(summaries);
    },
    // surface the initial factory read state through isLoading too
    placeholderData: addrLoading ? undefined : [],
  });
}

/** Read a single raise + its metadata by address. */
export function useRaise(address?: Address) {
  return useQuery({
    queryKey: ["raise", address],
    enabled: !!address,
    queryFn: async (): Promise<RaiseWithMeta> => {
      const summary = await fetchRaiseSummary(address as Address);
      const [merged] = await mergeMeta([summary]);
      return merged;
    },
  });
}
