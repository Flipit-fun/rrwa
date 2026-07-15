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
export const USDC_ADDRESS = asAddress(process.env.NEXT_PUBLIC_USDC_ADDRESS);
export const TREASURY_ADDRESS = asAddress(
  process.env.NEXT_PUBLIC_TREASURY_ADDRESS
);

/** True when the core contract addresses needed for reads are present. */
export function areContractsConfigured(): boolean {
  return !!FACTORY_ADDRESS && !!USDC_ADDRESS;
}
