import React, { useEffect, useMemo, useState } from 'react';
import { Platform, View } from 'react-native';
import { router, Stack } from 'expo-router';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { useAuth } from '@/auth';
import { useI18n, currentLocale } from '@/i18n';
import { useMetrics, useSemetra } from '@/lib/hooks';
import { dayKey } from '@/lib/semetra';
import { confirmDose } from '@/lib/confirm-dose';
import { spacing, useTheme } from '@/theme';
import {
  AppText, Badge, Banner, Button, Card, Icon, IconButton, LoadingState, PressableScale, Row, Screen, Section, haptics,
} from '@/components/ui';
import ProgressRing from '@/components/ProgressRing';
import WeekStrip from '@/components/WeekStrip';
import StatTile from '@/components/StatTile';
import QuickAddFab, { useQuickActions } from '@/components/QuickAddFab';
import type { IconName } from '@/components/ui';

interface ActivityItem {
  key: string;
  icon: IconName;
  color: string;
  title: string;
  detail: string;
  date: string;
}

/** Shown in the dose card's badge right after a dose is logged: the check fades in and settles from 0.85 to 1 (160 ms, strong ease-out). Reduce Motion: a 120 ms fade only. */
function LoggedCheck({ color }: { color: string }) {
  const reduce = useReducedMotion();
  const p = useSharedValue(0);
  useEffect(() => {
    p.set(withTiming(1, { duration: reduce ? 120 : 160, easing: Easing.bezier(0.23, 1, 0.32, 1) }));
  }, [reduce, p]);
  const style = useAnimatedStyle(() => ({ opacity: p.get(), transform: [{ scale: reduce ? 1 : 0.85 + 0.15 * p.get() }] }));
  return (
    <Animated.View style={style}>
      <Icon name="check" size={24} color={color} weight="bold" />
    </Animated.View>
  );
}

export default function TodayScreen() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { colors } = useTheme();
  const semetra = useSemetra();
  const metrics = useMetrics();
  const actions = useQuickActions();
  const [logging, setLogging] = useState(false);
  const [justLogged, setJustLogged] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);

  const sortedWeights = useMemo(
    () => [...metrics.weights].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()),
    [metrics.weights],
  );
  const latestWeight = sortedWeights.length ? sortedWeights[sortedWeights.length - 1].weightKg : null;
  const startWeight = sortedWeights.length ? sortedWeights[0].weightKg : null;
  const kgLost = startWeight != null && latestWeight != null ? startWeight - latestWeight : 0;
  const percentLost = startWeight ? (kgLost / startWeight) * 100 : 0;
  const ringProgress = Math.max(0, Math.min(1, percentLost / 10)); // milestone: 10% body-weight loss

  const now = Date.now();
  const { flat, takenKeys, doses } = semetra;
  const nextDose = flat.find((r) => !takenKeys.has(dayKey(r.date.toISOString())));
  const dueSoFar = flat.filter((r) => r.date.getTime() <= now);
  const takenSoFar = dueSoFar.filter((r) => takenKeys.has(dayKey(r.date.toISOString())));
  const adherencePct = dueSoFar.length ? Math.round((takenSoFar.length / dueSoFar.length) * 100) : null;
  const lastShot = [...doses].sort((a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime())[0];

  // Adherence streak: walk due weeks most-recent-first, stop at the first miss.
  let streak = 0;
  for (let i = dueSoFar.length - 1; i >= 0; i--) {
    if (takenKeys.has(dayKey(dueSoFar[i].date.toISOString()))) streak += 1;
    else break;
  }

  const activeDays = useMemo(() => {
    const s = new Set<string>();
    metrics.weights.forEach((w) => s.add(dayKey(w.recordedAt)));
    metrics.hba1c.forEach((h) => s.add(dayKey(h.recordedAt)));
    doses.forEach((d) => s.add(dayKey(d.takenAt)));
    return s;
  }, [metrics.weights, metrics.hba1c, doses]);

  const feed = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [];
    metrics.weights.forEach((w) =>
      items.push({ key: `w-${w.id}`, icon: 'scale', color: colors.info, title: t('home.feedWeight'), detail: `${w.weightKg.toFixed(1)} kg`, date: w.recordedAt }),
    );
    metrics.hba1c.forEach((h) =>
      items.push({ key: `a-${h.id}`, icon: 'drop', color: colors.danger, title: t('home.feedA1c'), detail: `${h.value.toFixed(1)}%`, date: h.recordedAt }),
    );
    doses.forEach((d) =>
      items.push({ key: `d-${d.id}`, icon: 'syringe', color: colors.tint, title: t('home.feedDose'), detail: d.doseMg != null ? `${d.doseMg.toFixed(2)} mg` : '', date: d.takenAt }),
    );
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6);
  }, [metrics.weights, metrics.hba1c, doses, t, colors]);

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(currentLocale(), { month: 'short', day: 'numeric' });
  const fmtDays = (d: Date) => {
    const diff = Math.round((d.getTime() - now) / 86400000);
    if (diff <= 0) return t('home.dueToday');
    if (diff === 1) return t('home.dueTomorrow');
    return `${t('home.dueIn')} ${diff} ${t('home.days')}`;
  };

  const daysUntilNextDose = nextDose ? Math.round((nextDose.date.getTime() - now) / 86400000) : null;
  const reminderTitle =
    daysUntilNextDose == null
      ? ''
      : daysUntilNextDose < 0
        ? t('home.reminderOverdue')
        : daysUntilNextDose === 0
          ? t('home.reminderToday')
          : daysUntilNextDose === 1
            ? t('home.reminderTomorrow')
            : `${daysUntilNextDose} ${t('home.reminderDaysUntil')}`;
  const reminderSubtitle = daysUntilNextDose != null && daysUntilNextDose < 0 ? t('home.reminderGentle') : t('home.reminderEncourage');
  const dueNow = daysUntilNextDose != null && daysUntilNextDose <= 0;
  // The check is a confirmation for the dose just logged; it clears once the next dose is due again.
  useEffect(() => {
    if (dueNow) setJustLogged(false);
  }, [dueNow]);

  async function logNextDose() {
    if (!nextDose) return;
    setLogging(true);
    setLogError(null);
    try {
      await semetra.logDose(nextDose.date, nextDose.week.doseMg);
      haptics.success();
      setJustLogged(true);
    } catch (e) {
      haptics.error();
      setLogError(e instanceof Error ? e.message : t('ui.couldNotSave'));
    } finally {
      setLogging(false);
    }
  }

  if (semetra.loading || metrics.loading) return <LoadingState />;

  const firstName = user?.fullName?.split(' ')[0];

  const content = (
    <Screen
      refreshing={semetra.refreshing || metrics.refreshing}
      onRefresh={() => {
        semetra.refresh();
        metrics.refresh();
      }}
    >
      {Platform.OS === 'ios' ? (
        <>
          <Stack.Toolbar placement="right">
            <Stack.Toolbar.Menu icon="plus" title={t('quickAdd.title')}>
              {actions.map((a) => (
                <Stack.Toolbar.MenuAction
                  key={a.key}
                  icon={{ dose: 'syringe', weight: 'scalemass', a1c: 'drop', other: 'pills' }[a.key] as 'syringe'}
                  onPress={a.onPress}
                >
                  {a.label}
                </Stack.Toolbar.MenuAction>
              ))}
            </Stack.Toolbar.Menu>
            <Stack.Toolbar.Button icon="person.crop.circle" onPress={() => router.push('/profile')} />
          </Stack.Toolbar>
        </>
      ) : (
        <Stack.Screen
          options={{ headerRight: () => <IconButton icon="person" label={t('ui.profile')} onPress={() => router.push('/profile')} size={40} /> }}
        />
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md }}>
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="title2" numberOfLines={1}>
            {t('home.hi')}, {firstName}
          </AppText>
          <AppText variant="subhead" tone="secondary">
            {t('home.allSet')}
          </AppText>
        </View>
        {streak > 0 ? <Badge tone="warning" icon="flame" label={`${streak}`} /> : null}
      </View>

      {semetra.error || metrics.error ? (
        <Banner message={semetra.error ?? metrics.error ?? ''} onRetry={() => { semetra.reload(); metrics.reload(); }} retryLabel={t('ui.retry')} />
      ) : null}
      {logError ? <Banner message={logError} /> : null}

      {semetra.mine && daysUntilNextDose != null ? (
        <Card tone="tinted" style={{ gap: spacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.tint, alignItems: 'center', justifyContent: 'center' }}>
              {justLogged && !dueNow ? <LoggedCheck color={colors.onTint} /> : <Icon name={dueNow ? 'syringe' : 'target'} size={24} color={colors.onTint} />}
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="headline">{reminderTitle}</AppText>
              <AppText variant="subhead" tone="secondary">
                {reminderSubtitle}
              </AppText>
            </View>
          </View>
          {dueNow ? (
            <Button title={t('ui.logDoseNow')} icon="check" onPress={() => confirmDose(t, logNextDose)} loading={logging} />
          ) : (
            <Button title={t('ui.openSchedule')} variant="tinted" onPress={() => router.navigate('/treatment')} />
          )}
        </Card>
      ) : !semetra.mine && !semetra.error ? (
        <Card style={{ gap: spacing.md }}>
          <AppText variant="headline">{t('home.yourCourse')}</AppText>
          <AppText variant="subhead" tone="secondary">
            {t('home.semetraCard')}
          </AppText>
          <Button title={t('ui.startCourse')} onPress={() => router.navigate('/treatment')} size="md" />
        </Card>
      ) : null}

      <Card>
        <WeekStrip activeDays={activeDays} labels={t('home.weekDayLetters').split(',')} />
      </Card>

      {startWeight != null && latestWeight != null ? (
        <PressableScale accessibilityRole="button" scaleTo={0.98} pressedOpacity={0.7} haptic={false} onPress={() => router.navigate('/progress')}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
            <ProgressRing progress={ringProgress} size={96} strokeWidth={9}>
              <AppText variant="title3" numeric>
                {latestWeight.toFixed(1)}
              </AppText>
              <AppText variant="caption" tone="secondary">
                kg
              </AppText>
            </ProgressRing>
            <View style={{ flex: 1, gap: spacing.xs }}>
              <AppText variant="headline">{t('home.weightProgress')}</AppText>
              <AppText variant="title3" tone={kgLost >= 0 ? 'success' : 'warning'} numeric>
                {kgLost >= 0 ? '−' : '+'}
                {Math.abs(kgLost).toFixed(1)} kg
              </AppText>
              <AppText variant="footnote" tone="secondary" numeric>
                {Math.abs(percentLost).toFixed(1)}% {t('home.sinceStart')}
              </AppText>
            </View>
          </Card>
        </PressableScale>
      ) : (
        <Card tone="tinted" style={{ gap: spacing.md }}>
          <AppText variant="headline">{t('home.logFirstWeight')}</AppText>
          <Button title={t('quickAdd.logWeight')} icon="scale" variant="tinted" size="md" onPress={() => router.push('/log-weight')} />
        </Card>
      )}

      {semetra.mine ? (
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <StatTile icon="alarm" label={t('home.nextDose')} value={nextDose ? fmtDays(nextDose.date) : '—'} />
          <StatTile icon="syringe" label={t('home.lastShot')} value={lastShot ? fmtDate(lastShot.takenAt) : '—'} tone={colors.violet} />
          <StatTile icon="bars" label={t('home.adherence')} value={adherencePct != null ? `${adherencePct}%` : '—'} tone={colors.success} />
        </View>
      ) : null}

      <Section title={t('home.recentActivity')}>
        {feed.length === 0 ? (
          <Row title={t('home.noActivity')} tone="secondary" />
        ) : (
          feed.map((it) => <Row key={it.key} icon={it.icon} iconColor={it.color} title={it.title} subtitle={fmtDate(it.date)} value={it.detail} />)
        )}
      </Section>
    </Screen>
  );

  if (Platform.OS === 'android') {
    return (
      <View style={{ flex: 1 }}>
        {content}
        <QuickAddFab />
      </View>
    );
  }
  return content;
}
