"use client";

import type { Address } from "viem";
import { useRaise } from "@/hooks/useRaises";
import PropertyStatsChart from "./PropertyStatsChart";

export default function PropertyStatsChartClient({
  raiseAddress,
  targetUsdc,
}: {
  raiseAddress: Address | null;
  targetUsdc: string;
}) {
  const { data: raise, isLoading } = useRaise(raiseAddress ?? undefined);

  if (!raiseAddress) {
    return (
      <p style={{ color: "var(--faint)", fontSize: 14 }}>
        This listing isn&apos;t open for investment on chain yet, so there&apos;s
        no funding progress to show.
      </p>
    );
  }

  if (isLoading || !raise) {
    return <div className="skeleton" style={{ height: 160, width: 160 }} />;
  }

  return <PropertyStatsChart raised={raise.raised} target={raise.target || BigInt(targetUsdc)} />;
}
