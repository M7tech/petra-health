import React, { useState } from 'react';
import { currentLocale } from '@/i18n';
import { View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';
import { useTheme } from '@/theme';

interface Point {
  value: number;
  recordedAt: string;
}

// Catmull-Rom → cubic Bézier, so the trend reads as a smooth curve rather than
// a jagged polyline. Tension 0.18 keeps it from overshooting between readings.
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const t = 0.18;
    d += ` C ${p1.x + (p2.x - p0.x) * t} ${p1.y + (p2.y - p0.y) * t}, ${p2.x - (p3.x - p1.x) * t} ${p2.y - (p3.y - p1.y) * t}, ${p2.x} ${p2.y}`;
  }
  return d;
}

// Single-series trend chart: soft gradient area, smooth line, min/max guides,
// and a haloed latest reading. Sized by its container, not the screen.
export default function MetricTrend({ data, color, decimals = 1, height = 200 }: { data: Point[]; color?: string; decimals?: number; height?: number }) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const stroke = color ?? colors.tint;
  const pts = [...data].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());

  if (pts.length === 0) return <View style={{ height }} />;

  const pad = { l: 38, r: 12, t: 18, b: 26 };
  const innerW = Math.max(1, width - pad.l - pad.r);
  const innerH = height - pad.t - pad.b;
  const vals = pts.map((p) => p.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const times = pts.map((p) => new Date(p.recordedAt).getTime());
  const tMin = Math.min(...times);
  const tSpan = Math.max(...times) - tMin || 1;
  const x = (t: number) => (pts.length === 1 ? pad.l + innerW / 2 : pad.l + ((t - tMin) / tSpan) * innerW);
  const y = (v: number) => pad.t + innerH - ((v - min) / span) * innerH;
  const coords = pts.map((p) => ({ x: x(new Date(p.recordedAt).getTime()), y: y(p.value) }));
  const line = smoothPath(coords);
  const last = coords[coords.length - 1];
  const area = pts.length > 1 ? `${line} L ${last.x} ${pad.t + innerH} L ${coords[0].x} ${pad.t + innerH} Z` : '';
  const fmt = (iso: string) => new Date(iso).toLocaleDateString(currentLocale(), { month: 'short', day: 'numeric' });

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ height }}>
      {width > 0 ? (
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="area" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={stroke} stopOpacity={0.28} />
              <Stop offset="1" stopColor={stroke} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          {[min, max].map((v) => (
            <React.Fragment key={v}>
              <Line x1={pad.l} x2={width - pad.r} y1={y(v)} y2={y(v)} stroke={colors.separator} strokeWidth={0.5} strokeDasharray="3 4" />
              <SvgText x={pad.l - 8} y={y(v) + 4} fontSize={11} fill={colors.secondaryLabel} textAnchor="end">
                {v.toFixed(decimals)}
              </SvgText>
            </React.Fragment>
          ))}
          {area ? <Path d={area} fill="url(#area)" /> : null}
          {pts.length > 1 ? <Path d={line} fill="none" stroke={stroke} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" /> : null}
          <Circle cx={last.x} cy={last.y} r={9} fill={stroke} opacity={0.18} />
          <Circle cx={last.x} cy={last.y} r={5} fill={stroke} stroke={colors.surface} strokeWidth={2.5} />
          <SvgText x={coords[0].x} y={height - 6} fontSize={11} fill={colors.secondaryLabel} textAnchor="start">
            {fmt(pts[0].recordedAt)}
          </SvgText>
          {pts.length > 1 ? (
            <SvgText x={last.x} y={height - 6} fontSize={11} fill={colors.secondaryLabel} textAnchor="end">
              {fmt(pts[pts.length - 1].recordedAt)}
            </SvgText>
          ) : null}
        </Svg>
      ) : null}
    </View>
  );
}
