const EXPLORER = process.env.NEXT_PUBLIC_EXPLORER_URL ?? "";

/** Build a block-explorer transaction URL, or undefined if not configured. */
export function txUrl(hash?: string): string | undefined {
  if (!EXPLORER || !hash) return undefined;
  return `${EXPLORER.replace(/\/$/, "")}/tx/${hash}`;
}

/** Build a block-explorer address URL, or undefined if not configured. */
export function addressUrl(address?: string): string | undefined {
  if (!EXPLORER || !address) return undefined;
  return `${EXPLORER.replace(/\/$/, "")}/address/${address}`;
}
