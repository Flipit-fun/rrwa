"use client";

/**
 * Hand-rolled SVG area chart of APY *rate* over a full financial year (Jan
 * through Dec) — not compounding dollar growth. The stablecoin line wobbles
 * up and down the way real lending rates do (e.g. Aave/Compound USDC
 * supply APY), capped around 8%. The RRWA line climbs to the platform's top
 * listed rate and is called out with a marker once it gets there.
 *
 * Both series are fixed, hand-tuned arrays (not Math.random) so the chart
 * renders identically on server and client and looks the same on every load.
 */
const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// Realistic-looking stablecoin lending APY over a year: drifts and wobbles,
// touching a high of 8% but mostly sitting well below it.
const STABLE_SERIES = [4.6, 5.3, 6.8, 5.9, 4.2, 5.1, 6.4, 8.0, 7.1, 5.6, 4.8, 5.4];

/** Builds the RRWA series: rises from a base rate up to `topApy`, then holds. */
function buildRrwaSeries(topApy: number): number[] {
  const base = Math.max(topApy - 4.5, 6);
  const climbMonths = 7; // reaches the top rate by ~month 8, then plateaus
  return MONTH_LABELS.map((_, i) => {
    if (i >= climbMonths) return topApy;
    const t = i / climbMonths;
    // ease-out curve so it climbs fast then levels into the plateau smoothly
    const eased = 1 - Math.pow(1 - t, 2);
    return base + (topApy - base) * eased;
  });
}

const WIDTH = 720;
const HEIGHT = 340;
const PAD_LEFT = 48;
const PAD_RIGHT = 24;
const PAD_TOP = 44;
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
  const rrwaApy = topApyBps / 100; // bps -> percent
  const rrwaSeries = buildRrwaSeries(rrwaApy);
  const maxY = Math.max(...rrwaSeries, ...STABLE_SERIES) * 1.12;

  const rrwaPoints = toPoints(rrwaSeries, maxY);
  const stablePoints = toPoints(STABLE_SERIES, maxY);
  const rrwaLine = smoothPath(rrwaPoints);
  const stableLine = smoothPath(stablePoints);

  const plotW = WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotH = HEIGHT - PAD_TOP - PAD_BOTTOM;

  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  // Mark the point where RRWA first reaches its top rate (plateau start).
  const peakIndex = rrwaSeries.findIndex((v) => v >= rrwaApy - 0.01);
  const peakPoint = rrwaPoints[peakIndex === -1 ? rrwaPoints.length - 1 : peakIndex];

  return (
    <div className="yield-chart">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`Chart of APY over a full financial year. Stablecoin lending rates fluctuate between roughly 4% and 8%. RRWA's top listed property rate climbs to ${rrwaApy.toFixed(1)}% and holds there, marked on the chart.`}
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

        {/* gridlines + % labels */}
        {gridLines.map((g) => {
          const y = PAD_TOP + plotH - g * plotH;
          const val = (g * maxY).toFixed(0);
          return (
            <g key={g}>
              <line
                x1={PAD_LEFT}
                x2={WIDTH - PAD_RIGHT}
                y1={y}
                y2={y}
                stroke="var(--hairline)"
                strokeWidth={1}
              />
              <text x={PAD_LEFT - 10} y={y + 4} fontSize={11} fill="var(--faint)" textAnchor="end">
                {val}%
              </text>
            </g>
          );
        })}

        {/* month labels */}
        {MONTH_LABELS.map((label, i) => {
          if (i % 2 !== 0) return null; // every other month to avoid crowding
          const x = PAD_LEFT + (i / (MONTH_LABELS.length - 1)) * plotW;
          return (
            <text
              key={label}
              x={x}
              y={HEIGHT - 14}
              fontSize={12}
              fill="var(--faint)"
              textAnchor="middle"
            >
              {label}
            </text>
          );
        })}

        {/* stablecoin area + wobbling line */}
        <path d={areaPath(stableLine, stablePoints)} fill="url(#stableFill)" stroke="none" />
        <path
          d={stableLine}
          fill="none"
          stroke="var(--faint)"
          strokeWidth={2.5}
          strokeDasharray="5 5"
          strokeLinecap="round"
        />

        {/* RRWA area + climbing line */}
        <path d={areaPath(rrwaLine, rrwaPoints)} fill="url(#rrwaFill)" stroke="none" />
        <path
          d={rrwaLine}
          fill="none"
          stroke="var(--blue)"
          strokeWidth={3}
          strokeLinecap="round"
        />

        {/* peak marker + callout label on the RRWA line */}
        <line
          x1={peakPoint.x}
          x2={peakPoint.x}
          y1={peakPoint.y}
          y2={PAD_TOP - 6}
          stroke="var(--blue)"
          strokeWidth={1}
          strokeDasharray="3 3"
          opacity={0.5}
        />
        <circle cx={peakPoint.x} cy={peakPoint.y} r={5.5} fill="var(--paper)" stroke="var(--blue)" strokeWidth={2.5} />
        <text
          x={peakPoint.x}
          y={PAD_TOP - 14}
          fontSize={13}
          fontWeight={600}
          fill="var(--blue-deep)"
          textAnchor="middle"
        >
          Up to {rrwaApy.toFixed(1)}%
        </text>

        {/* end-point marker for stablecoin */}
        <circle
          cx={stablePoints[stablePoints.length - 1].x}
          cy={stablePoints[stablePoints.length - 1].y}
          r={4}
          fill="var(--paper)"
          stroke="var(--faint)"
          strokeWidth={2}
        />
      </svg>

      <div className="yield-chart-legend">
        <div className="ycl-item">
          <span className="ycl-dot rrwa" />
          <span>
            RRWA top property — climbs to <b>{rrwaApy.toFixed(1)}% APY</b> and holds
          </span>
        </div>
        <div className="ycl-item">
          <span className="ycl-dot stable" />
          <span>
            Typical stablecoin yield — fluctuates <b>4%–8% APY</b> over the year
          </span>
        </div>
      </div>
    </div>
  );
}
