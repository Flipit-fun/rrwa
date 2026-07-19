"use client";

/**
 * Hand-rolled SVG area chart comparing typical stablecoin yield against
 * RRWA's top currently-listed property APY, both compounding on a $10,000
 * principal over 12 months. Smoothed curves + gradient fills instead of
 * plain straight lines, matching the site's hand-built visual style (see
 * FlowField) without pulling in a charting library for two curves.
 */
const MONTHS = 13; // month 0 (start) through month 12
const PRINCIPAL = 10_000;
const STABLECOIN_APY = 0.08; // typical stablecoin lending yield, for comparison

function growthSeries(apy: number): number[] {
  return Array.from({ length: MONTHS }, (_, m) => {
    const years = m / 12;
    return PRINCIPAL * (1 + apy * years);
  });
}

const WIDTH = 720;
const HEIGHT = 340;
const PAD_LEFT = 56;
const PAD_RIGHT = 24;
const PAD_TOP = 32;
const PAD_BOTTOM = 40;

type Point = { x: number; y: number };

function toPoints(values: number[], maxY: number): Point[] {
  const plotW = WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotH = HEIGHT - PAD_TOP - PAD_BOTTOM;
  return values.map((v, i) => ({
    x: PAD_LEFT + (i / (values.length - 1)) * plotW,
    y: PAD_TOP + plotH - (v / maxY) * plotH,
  }));
}

/** Catmull-Rom -> smooth cubic Bezier path through the given points. */
function smoothPath(points: Point[]): string {
  if (points.length < 2) return "";
  let d = `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}

function areaPath(linePath: string, points: Point[]): string {
  const baseline = HEIGHT - PAD_BOTTOM;
  const first = points[0];
  const last = points[points.length - 1];
  return `${linePath} L${last.x.toFixed(1)},${baseline} L${first.x.toFixed(1)},${baseline} Z`;
}

export default function YieldChart({ topApyBps }: { topApyBps: number }) {
  const rrwaApy = topApyBps / 10000;
  const stable = growthSeries(STABLECOIN_APY);
  const rrwa = growthSeries(rrwaApy);
  const maxY = Math.max(...rrwa) * 1.1;

  const rrwaPoints = toPoints(rrwa, maxY);
  const stablePoints = toPoints(stable, maxY);
  const rrwaLine = smoothPath(rrwaPoints);
  const stableLine = smoothPath(stablePoints);

  const plotW = WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotH = HEIGHT - PAD_TOP - PAD_BOTTOM;

  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="yield-chart">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`Area chart comparing a $10,000 deposit growing at 8% stablecoin yield versus RRWA's top listed property APY of ${(rrwaApy * 100).toFixed(1)}% over 12 months. The RRWA line ends noticeably higher.`}
      >
        <defs>
          <linearGradient id="rrwaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--blue)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--blue)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="stableFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--faint)" stopOpacity="0.14" />
            <stop offset="100%" stopColor="var(--faint)" stopOpacity="0" />
          </linearGradient>
        </defs>

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

        {/* stablecoin area + line */}
        <path d={areaPath(stableLine, stablePoints)} fill="url(#stableFill)" stroke="none" />
        <path
          d={stableLine}
          fill="none"
          stroke="var(--faint)"
          strokeWidth={2.5}
          strokeDasharray="5 5"
          strokeLinecap="round"
        />

        {/* RRWA area + line */}
        <path d={areaPath(rrwaLine, rrwaPoints)} fill="url(#rrwaFill)" stroke="none" />
        <path
          d={rrwaLine}
          fill="none"
          stroke="var(--blue)"
          strokeWidth={3}
          strokeLinecap="round"
        />

        {/* end-point markers */}
        <circle
          cx={stablePoints[stablePoints.length - 1].x}
          cy={stablePoints[stablePoints.length - 1].y}
          r={4}
          fill="var(--paper)"
          stroke="var(--faint)"
          strokeWidth={2}
        />
        <circle
          cx={rrwaPoints[rrwaPoints.length - 1].x}
          cy={rrwaPoints[rrwaPoints.length - 1].y}
          r={5.5}
          fill="var(--paper)"
          stroke="var(--blue)"
          strokeWidth={2.5}
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
            Typical stablecoin yield — <b>~8% APY</b> · $10,000 → $
            {Math.round(stable[stable.length - 1]).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
