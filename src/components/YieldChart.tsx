"use client";

/**
 * Hand-rolled SVG line chart comparing typical stablecoin yield against
 * RRWA's top currently-listed property APY, both compounding on a $10,000
 * principal over 12 months. No charting library needed for two lines —
 * keeps the bundle light and matches the site's existing hand-built visual
 * style (see FlowField).
 */
const MONTHS = 13; // month 0 (start) through month 12
const PRINCIPAL = 10_000;
const STABLECOIN_APY = 0.04; // typical stablecoin lending yield, for comparison

function growthSeries(apy: number): number[] {
  return Array.from({ length: MONTHS }, (_, m) => {
    const years = m / 12;
    return PRINCIPAL * (1 + apy * years);
  });
}

const WIDTH = 720;
const HEIGHT = 320;
const PAD_LEFT = 56;
const PAD_RIGHT = 24;
const PAD_TOP = 24;
const PAD_BOTTOM = 40;

function buildPath(values: number[], maxY: number): string {
  const plotW = WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotH = HEIGHT - PAD_TOP - PAD_BOTTOM;
  return values
    .map((v, i) => {
      const x = PAD_LEFT + (i / (values.length - 1)) * plotW;
      const y = PAD_TOP + plotH - (v / maxY) * plotH;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export default function YieldChart({ topApyBps }: { topApyBps: number }) {
  const rrwaApy = topApyBps / 10000;
  const stable = growthSeries(STABLECOIN_APY);
  const rrwa = growthSeries(rrwaApy);
  const maxY = Math.max(...rrwa) * 1.08;

  const stablePath = buildPath(stable, maxY);
  const rrwaPath = buildPath(rrwa, maxY);

  const plotW = WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotH = HEIGHT - PAD_TOP - PAD_BOTTOM;

  // gridlines at 0%, 25%, 50%, 75%, 100% of maxY
  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="yield-chart">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`Line chart comparing a $10,000 deposit growing at 4% stablecoin yield versus RRWA's top listed property APY of ${(rrwaApy * 100).toFixed(1)}% over 12 months. The RRWA line ends noticeably higher.`}
      >
        {/* gridlines */}
        {gridLines.map((g) => {
          const y = PAD_TOP + plotH - g * plotH;
          return (
            <line
              key={g}
              x1={PAD_LEFT}
              x2={WIDTH - PAD_RIGHT}
              y1={y}
              y2={y}
              stroke="var(--hairline)"
              strokeWidth={1}
            />
          );
        })}

        {/* axis labels (month 0, 6, 12) */}
        {[0, 6, 12].map((m) => {
          const x = PAD_LEFT + (m / 12) * plotW;
          return (
            <text
              key={m}
              x={x}
              y={HEIGHT - 14}
              fontSize={12}
              fill="var(--faint)"
              textAnchor="middle"
            >
              {m === 0 ? "Start" : `Mo. ${m}`}
            </text>
          );
        })}

        {/* stablecoin line */}
        <path
          d={stablePath}
          fill="none"
          stroke="var(--faint)"
          strokeWidth={2.5}
          strokeDasharray="5 5"
        />

        {/* RRWA line */}
        <path d={rrwaPath} fill="none" stroke="var(--blue)" strokeWidth={3} />

        {/* end-point markers + value labels */}
        <circle
          cx={WIDTH - PAD_RIGHT}
          cy={PAD_TOP + plotH - (stable[stable.length - 1] / maxY) * plotH}
          r={4}
          fill="var(--faint)"
        />
        <circle
          cx={WIDTH - PAD_RIGHT}
          cy={PAD_TOP + plotH - (rrwa[rrwa.length - 1] / maxY) * plotH}
          r={5}
          fill="var(--blue)"
        />
      </svg>

      <div className="yield-chart-legend">
        <div className="ycl-item">
          <span className="ycl-dot rrwa" />
          <span>
            RRWA top property — <b>{(rrwaApy * 100).toFixed(1)}% APY</b> ·
            $10,000 → ${Math.round(rrwa[rrwa.length - 1]).toLocaleString()}
          </span>
        </div>
        <div className="ycl-item">
          <span className="ycl-dot stable" />
          <span>
            Typical stablecoin yield — <b>~4% APY</b> · $10,000 → $
            {Math.round(stable[stable.length - 1]).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
