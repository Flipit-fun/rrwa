import type { Address } from "viem";

function asAddress(value: string | undefined): Address | undefined {
  if (!value || !/^0x[a-fA-F0-9]{40}$/.test(value)) return undefined;
  return value as Address;
}

export const FACTORY_ADDRESS = asAddress(
  process.env.NEXT_PUBLIC_FACTORY_ADDRESS
);
export const MARKETPLACE_ADDRESS = asAddress(
  process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS
);
// The main product: pooled 12% APY on USDG deposits.
export const YIELD_POOL_ADDRESS = asAddress(
  process.env.NEXT_PUBLIC_YIELD_POOL_ADDRESS
);
// Gates who may invest (in the pool or a property raise). No KYC provider
// wired up yet — the platform owner approves wallets manually for now.
export const ALLOWLIST_ADDRESS = asAddress(
  process.env.NEXT_PUBLIC_ALLOWLIST_ADDRESS
);
// USDG (Global Dollar) is the stablecoin on Robinhood Chain. Reads the new
// NEXT_PUBLIC_USDG_ADDRESS, falling back to the legacy NEXT_PUBLIC_USDC_ADDRESS
// so existing deployments keep working during the env rename.
export const USDG_ADDRESS = asAddress(
  process.env.NEXT_PUBLIC_USDG_ADDRESS ?? process.env.NEXT_PUBLIC_USDC_ADDRESS
);
export const TREASURY_ADDRESS = asAddress(
  process.env.NEXT_PUBLIC_TREASURY_ADDRESS
);

/** True when the core contract addresses needed for reads are present. */
export function areContractsConfigured(): boolean {
  return !!FACTORY_ADDRESS && !!USDG_ADDRESS;
}

/** True when the pooled YieldPool product's addresses are present. */
export function isPoolConfigured(): boolean {
  return !!YIELD_POOL_ADDRESS && !!USDG_ADDRESS;
}
