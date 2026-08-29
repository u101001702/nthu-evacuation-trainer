/**
 * 極簡 SVG 圖表元件。
 * 刻意不引入圖表函式庫 —— 專案維持零額外相依，投影時文字也永遠清晰。
 */

export const PALETTE = ['#3d8bfd', '#35a97a', '#e0a63c', '#e05a3c', '#8e6ee0', '#4bb3c4'];

const AXIS = '#41505f';
const TICK = '#8c99a6';

function niceMax(v: number): number {
  if (v <= 5) return 5;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  return Math.ceil(v / (mag / 2)) * (mag / 2);
}

/* ── 直方圖 ─────────────────────────────────────────────── */

interface HistogramProps {
  values: number[];
  binCount?: number;
  unit?: string;
  color?: string;
}

export function Histogram({ values, binCount = 8, unit = '', color = PALETTE[0] }: HistogramProps) {
  const W = 480;
  const H = 250;
  const L = 40;
  const R = 12;
  const T = 14;
  const B = 40;

  if (values.length === 0) return <EmptyChart />;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = span / binCount;
  const bins = new Array<number>(binCount).fill(0);
  for (const v of values) {
    const idx = Math.min(binCount - 1, Math.floor((v - min) / step));
    bins[idx] = (bins[idx] ?? 0) + 1;
  }

  const peak = niceMax(Math.max(...bins));
  const plotW = W - L - R;
  const plotH = H - T - B;
  const barW = plotW / binCount;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img">
      <YAxis x={L} top={T} height={plotH} max={peak} width={plotW} />
      {bins.map((count, i) => {
        const h = peak === 0 ? 0 : (count / peak) * plotH;
        return (
          <g key={i}>
            <rect
              x={L + i * barW + 2}
              y={T + plotH - h}
              width={Math.max(1, barW - 4)}
              height={h}
              fill={color}
              opacity={0.85}
              rx={2}
            />
            {count > 0 && (
              <text x={L + i * barW + barW / 2} y={T + plotH - h - 5} className="chart-value" textAnchor="middle">
                {count}
              </text>
            )}
          </g>
        );
      })}
      <line x1={L} y1={T + plotH} x2={W - R} y2={T + plotH} stroke={AXIS} />
      <text x={L} y={H - 14} className="chart-tick" textAnchor="start">
        {fmt(min)}{unit}
      </text>
      <text x={W - R} y={H - 14} className="chart-tick" textAnchor="end">
        {fmt(max)}{unit}
      </text>
    </svg>
  );
}

/* ── 橫向長條（類別比例） ───────────────────────────────── */

export interface BarItem {
  label: string;
  value: number;
}

export function BarList({ items }: { items: BarItem[] }) {
  const total = items.reduce((s, i) => s + i.value, 0);
  if (total === 0) return <EmptyChart />;

  const rowH = 40;
  const W = 480;
  const H = items.length * rowH + 12;
  const labelW = 156;
  const barMax = W - labelW - 96;
  const peak = Math.max(...items.map((i) => i.value));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img">
      {items.map((it, i) => {
        const y = i * rowH + 8;
        const w = peak === 0 ? 0 : (it.value / peak) * barMax;
        const pct = Math.round((it.value / total) * 100);
        return (
          <g key={it.label}>
            <text x={labelW - 10} y={y + 17} className="chart-label" textAnchor="end">
              {it.label}
            </text>
            <rect x={labelW} y={y + 4} width={barMax} height={18} fill="#1c242d" rx={3} />
            <rect
              x={labelW}
              y={y + 4}
              width={Math.max(it.value > 0 ? 3 : 0, w)}
              height={18}
              fill={PALETTE[i % PALETTE.length]}
              rx={3}
            />
            <text x={labelW + barMax + 8} y={y + 17} className="chart-value" textAnchor="start">
              {it.value} 人 · {pct}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── 散布圖 ─────────────────────────────────────────────── */

export interface Point {
  x: number;
  y: number;
  label: string;
}

interface ScatterProps {
  points: Point[];
  xLabel: string;
  yLabel: string;
}

export function Scatter({ points, xLabel, yLabel }: ScatterProps) {
  const W = 480;
  const H = 250;
  const L = 44;
  const R = 14;
  const T = 14;
  const B = 40;

  if (points.length === 0) return <EmptyChart />;

  const xMax = niceMax(Math.max(...points.map((p) => p.x)));
  const yMax = niceMax(Math.max(...points.map((p) => p.y)));
  const plotW = W - L - R;
  const plotH = H - T - B;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img">
      <YAxis x={L} top={T} height={plotH} max={yMax} width={plotW} />
      {points.map((p, i) => (
        <circle
          key={`${p.label}-${i}`}
          cx={L + (p.x / (xMax || 1)) * plotW}
          cy={T + plotH - (p.y / (yMax || 1)) * plotH}
          r={5}
          fill={PALETTE[0]}
          opacity={0.65}
        >
          <title>{`${p.label}：${fmt(p.x)} ${xLabel} / ${fmt(p.y)} ${yLabel}`}</title>
        </circle>
      ))}
      <line x1={L} y1={T + plotH} x2={W - R} y2={T + plotH} stroke={AXIS} />
      <text x={W - R} y={H - 14} className="chart-tick" textAnchor="end">
        {xLabel} → {fmt(xMax)}
      </text>
      <text x={L} y={H - 14} className="chart-tick" textAnchor="start">
        0
      </text>
    </svg>
  );
}

/* ── 共用 ───────────────────────────────────────────────── */

function YAxis({ x, top, height, max, width }: { x: number; top: number; height: number; max: number; width: number }) {
  const lines = [0, 0.5, 1];
  return (
    <g>
      {lines.map((f) => {
        const y = top + height - f * height;
        return (
          <g key={f}>
            <line x1={x} y1={y} x2={x + width} y2={y} stroke={AXIS} strokeDasharray={f === 0 ? '' : '3 4'} opacity={0.6} />
            <text x={x - 6} y={y + 4} className="chart-tick" textAnchor="end">
              {fmt(max * f)}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function EmptyChart() {
  return (
    <svg viewBox="0 0 480 200" className="chart" role="img">
      <text x={240} y={104} className="chart-empty" textAnchor="middle">
        尚無資料
      </text>
    </svg>
  );
}

function fmt(v: number): string {
  if (Number.isInteger(v)) return String(v);
  return v.toFixed(1);
}

export { TICK };
