import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from 'react-native';
import Svg, { Path, Circle, Line as SvgLine, Text as SvgText } from 'react-native-svg';
import { api } from '../api';
import { useI18n } from '../i18n';
import { Field, PrimaryButton, colors } from '../ui';
import KeyboardScreen from '../components/KeyboardScreen';
import type { Hba1cEntry, WeightEntry } from '../types';

// Generic single-series trend chart over {value, recordedAt}.
function MetricTrend({
  data,
  color = colors.petra,
  decimals = 1,
}: {
  data: { value: number; recordedAt: string }[];
  color?: string;
  decimals?: number;
}) {
  const W = Dimensions.get('window').width - 40;
  const H = 190;
  const pad = { l: 40, r: 14, t: 16, b: 26 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;

  const pts = [...data].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
  );
  const vals = pts.map((p) => p.value);
  const times = pts.map((p) => new Date(p.recordedAt).getTime());
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals);
  const vSpan = maxV - minV || 1;
  const tMin = Math.min(...times);
  const tSpan = Math.max(...times) - tMin || 1;

  const x = (t: number) =>
    pts.length === 1 ? pad.l + innerW / 2 : pad.l + ((t - tMin) / tSpan) * innerW;
  const y = (v: number) => pad.t + innerH - ((v - minV) / vSpan) * innerH;

  const coords = pts.map((p) => ({ px: x(new Date(p.recordedAt).getTime()), py: y(p.value) }));
  const path = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.px} ${c.py}`).join(' ');
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return (
    <Svg width={W} height={H}>
      {[minV, maxV].map((v) => (
        <React.Fragment key={v}>
          <SvgLine x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="#e2e8f0" strokeWidth={1} />
          <SvgText x={pad.l - 6} y={y(v) + 4} fontSize={10} fill="#94a3b8" textAnchor="end">
            {v.toFixed(decimals)}
          </SvgText>
        </React.Fragment>
      ))}
      {pts.length > 1 && <Path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />}
      {coords.map((c, i) => (
        <Circle key={i} cx={c.px} cy={c.py} r={4} fill={color} stroke="#fff" strokeWidth={2} />
      ))}
      <SvgText x={coords[0].px} y={H - 6} fontSize={10} fill="#94a3b8" textAnchor="start">
        {fmt(pts[0].recordedAt)}
      </SvgText>
      {pts.length > 1 && (
        <SvgText x={coords[coords.length - 1].px} y={H - 6} fontSize={10} fill="#94a3b8" textAnchor="end">
          {fmt(pts[pts.length - 1].recordedAt)}
        </SvgText>
      )}
    </Svg>
  );
}

export default function WeightScreen() {
  const { t, isRTL } = useI18n();
  const align = { textAlign: isRTL ? 'right' : 'left' } as const;
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hba1c, setHba1c] = useState<Hba1cEntry[]>([]);
  const [a1cValue, setA1cValue] = useState('');
  const [a1cBusy, setA1cBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [w, h] = await Promise.all([
        api<WeightEntry[]>('/me/weights'),
        api<Hba1cEntry[]>('/me/hba1c'),
      ]);
      setEntries(w);
      setHba1c(h);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  async function saveA1c() {
    const v = parseFloat(a1cValue.replace(',', '.'));
    if (Number.isNaN(v) || v < 3 || v > 20) {
      setError(t('health.a1cInvalid'));
      return;
    }
    setA1cBusy(true);
    setError(null);
    try {
      await api('/me/hba1c', { method: 'POST', body: JSON.stringify({ value: v }) });
      setA1cValue('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setA1cBusy(false);
    }
  }

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    const kg = parseFloat(value.replace(',', '.'));
    if (Number.isNaN(kg) || kg < 20 || kg > 500) {
      setError(t('weight.invalid'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api('/me/weights', { method: 'POST', body: JSON.stringify({ weightKg: kg }) });
      setValue('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  }

  const latest = entries.length ? entries[entries.length - 1].weightKg : null;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.petra} size="large" />
      </View>
    );
  }

  return (
    <KeyboardScreen
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
    >
      <Text style={[styles.title, align]}>{t('weight.title')}</Text>
      {latest != null && (
        <Text style={[styles.latest, align]}>
          {t('weight.latest')}: {latest.toFixed(1)} kg
        </Text>
      )}

      {error && <Text style={[styles.error, align]}>{error}</Text>}

      <View style={styles.card}>
        <Field
          label={t('weight.todaysWeight')}
          value={value}
          onChangeText={setValue}
          keyboardType="decimal-pad"
          placeholder="82.5"
          textAlign={isRTL ? 'right' : 'left'}
        />
        <PrimaryButton title={t('weight.log')} onPress={save} loading={busy} />
      </View>

      <View style={styles.card}>
        <Text style={[styles.cardTitle, align]}>{t('weight.trend')}</Text>
        {entries.length === 0 ? (
          <Text style={[styles.muted, align]}>{t('weight.noEntries')}</Text>
        ) : (
          <MetricTrend data={entries.map((e) => ({ value: e.weightKg, recordedAt: e.recordedAt }))} />
        )}
      </View>

      {/* HbA1c */}
      <View style={styles.card}>
        <Field
          label={t('health.a1cLabel')}
          value={a1cValue}
          onChangeText={setA1cValue}
          keyboardType="decimal-pad"
          placeholder="7.4"
          textAlign={isRTL ? 'right' : 'left'}
        />
        <PrimaryButton title={t('health.logA1c')} onPress={saveA1c} loading={a1cBusy} />
      </View>
      <View style={styles.card}>
        <Text style={[styles.cardTitle, align]}>{t('health.a1cTrend')}</Text>
        {hba1c.length === 0 ? (
          <Text style={[styles.muted, align]}>{t('health.noA1c')}</Text>
        ) : (
          <MetricTrend data={hba1c} color="#0284c7" />
        )}
      </View>
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  container: { padding: 20, paddingTop: 60, paddingBottom: 140, backgroundColor: colors.bg, flexGrow: 1 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text },
  latest: { color: colors.muted, marginBottom: 16, marginTop: 2 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14 },
  cardTitle: { fontWeight: '600', color: colors.text, marginBottom: 10 },
  muted: { color: colors.muted },
  error: {
    backgroundColor: '#fef2f2',
    color: colors.danger,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
});
