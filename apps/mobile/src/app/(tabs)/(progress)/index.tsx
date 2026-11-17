import React, { useState } from 'react';
import { Platform, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { useI18n } from '@/i18n';
import { useMetrics } from '@/lib/hooks';
import { spacing, useTheme } from '@/theme';
import { AppText, Banner, Card, EmptyState, IconButton, LoadingState, Row, Screen, SegmentedControl, Section } from '@/components/ui';
import MetricTrend from '@/components/charts/MetricTrend';

type Metric = 'weight' | 'a1c';

export default function ProgressScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const m = useMetrics();
  const [metric, setMetric] = useState<Metric>('weight');

  if (m.loading) return <LoadingState />;

  const isWeight = metric === 'weight';
  const data = isWeight
    ? m.weights.map((w) => ({ id: w.id, value: w.weightKg, recordedAt: w.recordedAt }))
    : m.hba1c.map((h) => ({ id: h.id, value: h.value, recordedAt: h.recordedAt }));
  const sorted = [...data].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
  const latest = sorted[sorted.length - 1];
  const first = sorted[0];
  const change = latest && first ? latest.value - first.value : 0;
  const unit = isWeight ? 'kg' : '%';
  const add = () => router.push(isWeight ? '/log-weight' : '/log-a1c');
  const accent = isWeight ? colors.tint : colors.info;

  const addButton =
    Platform.OS === 'ios' ? (
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button icon="plus" onPress={add} />
      </Stack.Toolbar>
    ) : (
      <Stack.Screen options={{ headerRight: () => <IconButton icon="plus" label={isWeight ? t('quickAdd.logWeight') : t('quickAdd.logA1c')} onPress={add} size={40} /> }} />
    );

  return (
    <Screen refreshing={m.refreshing} onRefresh={m.refresh}>
      {addButton}
      <SegmentedControl
        value={metric}
        onChange={setMetric}
        options={[
          { key: 'weight', label: t('weight.title') },
          { key: 'a1c', label: 'HbA1c' },
        ]}
      />
      {m.error ? <Banner message={m.error} onRetry={m.reload} retryLabel={t('ui.retry')} /> : null}

      {sorted.length === 0 ? (
        <EmptyState
          icon={isWeight ? 'scale' : 'drop'}
          title={isWeight ? t('weight.noEntries') : t('health.noA1c')}
          actionLabel={isWeight ? t('quickAdd.logWeight') : t('quickAdd.logA1c')}
          onAction={add}
        />
      ) : (
        <>
          <Card style={{ gap: spacing.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <View style={{ gap: 2 }}>
                <AppText variant="footnote" tone="secondary" weight="600" style={{ textTransform: 'uppercase', letterSpacing: 0.3 }}>
                  {t('weight.latest')}
                </AppText>
                <AppText variant="largeTitle" numeric>
                  {latest.value.toFixed(1)}
                  <AppText variant="title3" tone="secondary">
                    {' '}
                    {unit}
                  </AppText>
                </AppText>
              </View>
              {sorted.length > 1 ? (
                <AppText variant="headline" numeric tone={change <= 0 ? 'success' : 'warning'}>
                  {change <= 0 ? '−' : '+'}
                  {Math.abs(change).toFixed(1)} {unit}
                </AppText>
              ) : null}
            </View>
            <MetricTrend data={sorted} color={accent} />
          </Card>

          <Section title={t('ui.history')}>
            {[...sorted]
              .reverse()
              .slice(0, 12)
              .map((e, i, arr) => {
                const prev = arr[i + 1];
                const delta = prev ? e.value - prev.value : null;
                return (
                  <Row
                    key={e.id}
                    title={new Date(e.recordedAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    subtitle={delta != null ? `${delta <= 0 ? '−' : '+'}${Math.abs(delta).toFixed(1)} ${unit}` : undefined}
                    value={`${e.value.toFixed(1)} ${unit}`}
                  />
                );
              })}
          </Section>
        </>
      )}
    </Screen>
  );
}
