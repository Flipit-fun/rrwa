"use client";

import { formatUsd, progressPct } from "@/lib/format";

/**
 * Small donut chart showing raised vs. remaining for a single property,
 * built as plain SVG to match the site's hand-built chart style (see
 * YieldChart) rather than pulling in a charting library for one shape.
 */
export default function PropertyStatsChart({
  raised,
  target,
}: {
  raised: bigint;
  target: bigint;
}) {
  const pct = progressPct(raised, target);
  const remaining = target - raised;

  const radius = 70;
  const stroke = 16;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct / 100);

  return (
    <div className="prop-stats-chart">
      <svg viewBox="0 0 180 180" width={160} height={160}>
        <circle
          cx={90}
          cy={90}
          r={radius}
          fill="none"
          stroke="var(--hairline)"
          strokeWidth={stroke}
        />
        <circle
          cx={90}
          cy={90}
          r={radius}
          fill="none"
          stroke="var(--blue)"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 90 90)"
        />
        <text
          x={90}
          y={86}
          textAnchor="middle"
          fontSize={28}
          fontFamily="var(--serif)"
          fill="var(--ink)"
        >
          {pct.toFixed(0)}%
        </text>
        <text
          x={90}
          y={108}
          textAnchor="middle"
          fontSize={11}
          fill="var(--faint)"
        >
          funded
        </text>
      </svg>
      <div className="prop-stats-legend">
        <div className="ycl-item">
          <span className="ycl-dot rrwa" />
          <span>
            Invested — <b>{formatUsd(raised)}</b>
          </span>
        </div>
        <div className="ycl-item">
          <span className="ycl-dot stable" />
          <span>
            Remaining — <b>{formatUsd(remaining > 0n ? remaining : 0n)}</b>
          </span>
        </div>
      </div>
    </div>
  );
}
