'use client';

// Generic single-series line chart over {value, recordedAt}. One hue, 2px line,
// recessive axes, min/max + first/last date labels (per dataviz guidance).
export function MetricChart({
  data,
  color = '#a4225f',
  unit = '',
  decimals = 1,
  empty = 'No data yet.',
}: {
  data: { value: number; recordedAt: string }[];
  color?: string;
  unit?: string;
  decimals?: number;
  empty?: string;
}) {
  if (data.length === 0) return <p className="text-sm text-slate-400">{empty}</p>;

  const points = [...data].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
  );
  const W = 560;
  const H = 200;
  const pad = { l: 44, r: 16, t: 16, b: 28 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;

  const vals = points.map((p) => p.value);
  const times = points.map((p) => new Date(p.recordedAt).getTime());
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals);
  const vSpan = maxV - minV || 1;
  const tMin = Math.min(...times);
  const tSpan = Math.max(...times) - tMin || 1;

  const x = (t: number) =>
    points.length === 1 ? pad.l + innerW / 2 : pad.l + ((t - tMin) / tSpan) * innerW;
  const y = (v: number) => pad.t + innerH - ((v - minV) / vSpan) * innerH;

  const coords = points.map((p) => ({ px: x(new Date(p.recordedAt).getTime()), py: y(p.value), p }));
  const path = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.px} ${c.py}`).join(' ');
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Metric over time">
      {[minV, maxV].map((v) => (
        <g key={v}>
          <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="#e2e8f0" strokeWidth={1} />
          <text x={pad.l - 8} y={y(v) + 4} textAnchor="end" fontSize={11} fill="#94a3b8">
            {v.toFixed(decimals)}
          </text>
        </g>
      ))}
      {points.length > 1 && (
        <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      )}
      {coords.map((c, i) => (
        <circle key={i} cx={c.px} cy={c.py} r={4} fill={color} stroke="#fff" strokeWidth={2}>
          <title>{`${fmt(c.p.recordedAt)}: ${c.p.value}${unit}`}</title>
        </circle>
      ))}
      <text x={coords[0].px} y={H - 8} textAnchor="start" fontSize={11} fill="#94a3b8">
        {fmt(points[0].recordedAt)}
      </text>
      {points.length > 1 && (
        <text x={coords[coords.length - 1].px} y={H - 8} textAnchor="end" fontSize={11} fill="#94a3b8">
          {fmt(points[points.length - 1].recordedAt)}
        </text>
      )}
    </svg>
  );
}
