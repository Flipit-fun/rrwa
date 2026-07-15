/**
 * Shared money formatting/parsing. On-chain USDC uses 6 decimals.
 * Every USD value in the app flows through these helpers so display and
 * on-chain parsing never drift apart.
 */

export const USDC_DECIMALS = 6;

/** Parse a human string like "10,000" or "10000.50" into USDC base units (bigint). */
export function parseUsdc(value: string): bigint {
  const cleaned = value.replace(/[,\s$]/g, "").trim();
  if (cleaned === "" || cleaned === ".") return 0n;
  if (!/^\d*\.?\d*$/.test(cleaned)) {
    throw new Error(`Invalid USDC amount: "${value}"`);
  }
  const [whole, fraction = ""] = cleaned.split(".");
  const paddedFraction = (fraction + "0".repeat(USDC_DECIMALS)).slice(
    0,
    USDC_DECIMALS
  );
  const wholePart = whole === "" ? 0n : BigInt(whole);
  const base = wholePart * 10n ** BigInt(USDC_DECIMALS);
  const frac = paddedFraction === "" ? 0n : BigInt(paddedFraction);
  return base + frac;
}

/** Convert USDC base units (bigint) into a plain decimal number of dollars. */
export function usdcToNumber(base: bigint): number {
  return Number(base) / 10 ** USDC_DECIMALS;
}

/** Format USDC base units as a USD currency string, e.g. "$10,000". */
export function formatUsd(
  base: bigint,
  opts: { cents?: boolean } = {}
): string {
  const value = usdcToNumber(base);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: opts.cents ? 2 : 0,
    maximumFractionDigits: opts.cents ? 2 : 0,
  }).format(value);
}

/** Format a plain dollar number as USD currency, e.g. 2400000 -> "$2,400,000". */
export function formatUsdNumber(
  value: number,
  opts: { cents?: boolean } = {}
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: opts.cents ? 2 : 0,
    maximumFractionDigits: opts.cents ? 2 : 0,
  }).format(value);
}

/** APY basis points (e.g. 950) -> percent string ("9.5%"). */
export function formatApyBps(bps: number | bigint): string {
  const n = typeof bps === "bigint" ? Number(bps) : bps;
  const pct = n / 100;
  const str = Number.isInteger(pct) ? pct.toString() : pct.toFixed(1);
  return `${str}%`;
}

/** Parse a percent string ("9.5") into basis points (950). */
export function parseApyToBps(value: string): number {
  const cleaned = value.replace(/[%\s]/g, "").trim();
  const pct = Number(cleaned);
  if (Number.isNaN(pct)) throw new Error(`Invalid APY: "${value}"`);
  return Math.round(pct * 100);
}

/** Funding progress as an integer percentage 0..100. */
export function progressPct(raised: bigint, target: bigint): number {
  if (target === 0n) return 0;
  const pct = Number((raised * 10000n) / target) / 100;
  return Math.min(100, Math.max(0, pct));
}

/**
 * Required upfront rent deposit for a raise:
 *   target * apyBps/10000 * 3 years
 * Returned in USDC base units.
 */
export function requiredRentDeposit(target: bigint, apyBps: number): bigint {
  return (target * BigInt(apyBps) * 3n) / 10000n;
}
