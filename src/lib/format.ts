/**
 * Shared money formatting/parsing. On-chain USDG (Global Dollar, the stablecoin
 * on Robinhood Chain) uses 6 decimals. Every USD value in the app flows through
 * these helpers so display and on-chain parsing never drift apart.
 */

export const USDG_DECIMALS = 6;

/** Parse a human string like "10,000" or "10000.50" into USDG base units (bigint). */
export function parseUsdg(value: string): bigint {
  const cleaned = value.replace(/[,\s$]/g, "").trim();
  if (cleaned === "" || cleaned === ".") return 0n;
  if (!/^\d*\.?\d*$/.test(cleaned)) {
    throw new Error(`Invalid USDG amount: "${value}"`);
  }
  const [whole, fraction = ""] = cleaned.split(".");
  const paddedFraction = (fraction + "0".repeat(USDG_DECIMALS)).slice(
    0,
    USDG_DECIMALS
  );
  const wholePart = whole === "" ? 0n : BigInt(whole);
  const base = wholePart * 10n ** BigInt(USDG_DECIMALS);
  const frac = paddedFraction === "" ? 0n : BigInt(paddedFraction);
  return base + frac;
}

/** Convert USDG base units (bigint) into a plain decimal number of dollars. */
export function usdgToNumber(base: bigint): number {
  return Number(base) / 10 ** USDG_DECIMALS;
}

/** Format USDG base units as a USD currency string, e.g. "$10,000". */
export function formatUsd(
  base: bigint,
  opts: { cents?: boolean } = {}
): string {
  const value = usdgToNumber(base);
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

/**
 * Weekly-accrued yield on a manually-tracked deposit: apyBps of the
 * deposited amount, divided into 52 weekly increments, counting only full
 * weeks elapsed since the deposit. This mirrors "APY is added every week"
 * rather than continuous per-second accrual (there's no contract streaming
 * it — RRWA credits it manually on this cadence).
 */
export function weeklyAccruedYield(
  principal: bigint,
  apyBps: number,
  depositedAt: Date,
  now: Date = new Date()
): bigint {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weeksElapsed = Math.floor((now.getTime() - depositedAt.getTime()) / msPerWeek);
  if (weeksElapsed <= 0) return 0n;
  const cappedWeeks = Math.min(weeksElapsed, 52 * 3); // cap accrual display at 3 years
  return (principal * BigInt(apyBps) * BigInt(cappedWeeks)) / (10000n * 52n);
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
 * Returned in USDG base units.
 */
export function requiredRentDeposit(target: bigint, apyBps: number): bigint {
  return (target * BigInt(apyBps) * 3n) / 10000n;
}
