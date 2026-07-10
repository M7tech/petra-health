'use client';

import type { WeightEntry } from '@petra/shared';

// Single-series line chart (weight over time). One hue, 2px line, recessive
// axes, direct min/max labels, no legend (the card title names the series).
export function WeightChart({ data }: { data: WeightEntry[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-400">No weight entries yet.</p>;
  }

  const points = [...data].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
  );

  const W = 560;
  const H = 200;
  const pad = { l: 40, r: 16, t: 16, b: 28 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;

  const weights = points.map((p) => p.weightKg);
  const times = points.map((p) => new Date(p.recordedAt).getTime());
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const wSpan = maxW - minW || 1;
  const tMin = Math.min(...times);
  const tMax = Math.max(...times);
  const tSpan = tMax - tMin || 1;

  const x = (t: number) => pad.l + ((t - tMin) / tSpan) * innerW;
  const y = (w: number) => pad.t + innerH - ((w - minW) / wSpan) * innerH;

  const coords = points.map((p) => ({
    px: points.length === 1 ? pad.l + innerW / 2 : x(new Date(p.recordedAt).getTime()),
    py: y(p.weightKg),
    p,
  }));
  const path = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.px} ${c.py}`).join(' ');
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Weight over time">
      {/* recessive gridlines + y labels (min / max) */}
      {[minW, maxW].map((wv) => (
        <g key={wv}>
          <line x1={pad.l} x2={W - pad.r} y1={y(wv)} y2={y(wv)} stroke="#e2e8f0" strokeWidth={1} />
          <text x={pad.l - 8} y={y(wv) + 4} textAnchor="end" fontSize={11} fill="#94a3b8">
            {wv.toFixed(1)}
          </text>
        </g>
      ))}

      {/* the series line */}
      {points.length > 1 && (
        <path d={path} fill="none" stroke="#a4225f" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      )}

      {/* points with native tooltips */}
      {coords.map((c) => (
        <circle key={c.p.id} cx={c.px} cy={c.py} r={4} fill="#a4225f" stroke="#fff" strokeWidth={2}>
          <title>{`${fmtDate(c.p.recordedAt)}: ${c.p.weightKg} kg`}</title>
        </circle>
      ))}

      {/* x labels: first & last date (ink token, not series color) */}
      <text x={coords[0].px} y={H - 8} textAnchor="start" fontSize={11} fill="#94a3b8">
        {fmtDate(points[0].recordedAt)}
      </text>
      {points.length > 1 && (
        <text x={coords[coords.length - 1].px} y={H - 8} textAnchor="end" fontSize={11} fill="#94a3b8">
          {fmtDate(points[points.length - 1].recordedAt)}
        </text>
      )}
    </svg>
  );
}
