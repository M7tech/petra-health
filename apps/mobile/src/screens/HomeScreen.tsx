import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, ActivityIndicator } from 'react-native';
import { useAuth } from '../auth';
import { useI18n } from '../i18n';
import { colors } from '../ui';
import { api } from '../api';
import ProgressRing from '../components/ProgressRing';
import WeekStrip from '../components/WeekStrip';
import {
  isBiometricAvailable,
  isBiometricEnabled,
  setBiometricEnabled,
  authenticate,
} from '../biometrics';
import type { DoseLog, Hba1cEntry, Medication, UserMedication, WeightEntry } from '../types';

const dayKey = (iso: string) => iso.slice(0, 10);
const addDays = (date: Date, days: number) => {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(12, 0, 0, 0);
  return d;
};

type TabKey = 'home' | 'meds' | 'weight' | 'care' | 'profile';

interface ActivityItem {
  key: string;
  icon: string;
  title: string;
  detail: string;
  date: string;
}

export default function HomeScreen({
  refreshKey,
  onNavigate,
}: {
  refreshKey?: number;
  onNavigate: (tab: TabKey) => void;
}) {
  const { user, logout } = useAuth();
  const { t, isRTL } = useI18n();
  const align = { textAlign: isRTL ? 'right' : 'left' } as const;
  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioOn, setBioOn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [hba1c, setHba1c] = useState<Hba1cEntry[]>([]);
  const [catalog, setCatalog] = useState<Medication | null>(null);
  const [mine, setMine] = useState<UserMedication | null>(null);
  const [doses, setDoses] = useState<DoseLog[]>([]);

  const load = useCallback(async () => {
    try {
      const [w, h, cat, meds] = await Promise.all([
        api<WeightEntry[]>('/me/weights'),
        api<Hba1cEntry[]>('/me/hba1c'),
        api<Medication[]>('/medications'),
        api<UserMedication[]>('/me/medications'),
      ]);
      setWeights(w);
      setHba1c(h);
      const semetra = cat.find((m) => m.name === 'Semetra') ?? cat[0] ?? null;
      setCatalog(semetra);
      const enrolled = meds.find((m) => m.name === 'Semetra' && m.active) ?? null;
      setMine(enrolled);
      if (enrolled) {
        setDoses(await api<DoseLog[]>(`/me/doses?userMedicationId=${enrolled.id}`));
      } else {
        setDoses([]);
      }
    } catch {
      /* home tiles fall back to empty state below */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setBioAvailable(await isBiometricAvailable());
      setBioOn(await isBiometricEnabled());
    })();
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  async function toggleBio(next: boolean) {
    if (next) {
      const ok = await authenticate();
      if (!ok) return;
    }
    await setBiometricEnabled(next);
    setBioOn(next);
  }

  const sortedWeights = useMemo(
    () => [...weights].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()),
    [weights],
  );
  const latestWeight = sortedWeights.length ? sortedWeights[sortedWeights.length - 1].weightKg : null;
  const startWeight = sortedWeights.length ? sortedWeights[0].weightKg : null;
  const kgLost = startWeight != null && latestWeight != null ? startWeight - latestWeight : 0;
  const percentLost = startWeight ? (kgLost / startWeight) * 100 : 0;
  const ringProgress = Math.max(0, Math.min(1, percentLost / 10)); // milestone: 10% body-weight loss

  // Same schedule-flattening logic as MedicationScreen, so Home stats line up 1:1.
  const schedule = useMemo(() => {
    if (!catalog || !mine) return [];
    const start = new Date(mine.startDate);
    const pens = catalog.pens
      .filter((p) => p.sequence >= mine.startPenSequence)
      .sort((a, b) => a.sequence - b.sequence);
    let g = 0;
    const rows: { date: Date; doseMg: number }[] = [];
    pens.forEach((pen) => {
      pen.weeks.forEach((w) => {
        rows.push({ date: addDays(start, g * 7), doseMg: w.doseMg });
        g += 1;
      });
    });
    return rows;
  }, [catalog, mine]);

  const takenKeys = useMemo(() => new Set(doses.map((d) => dayKey(d.scheduledFor))), [doses]);
  const now = Date.now();

  const nextDose = schedule.find((r) => !takenKeys.has(dayKey(r.date.toISOString())));
  const dueSoFar = schedule.filter((r) => r.date.getTime() <= now);
  const takenSoFar = dueSoFar.filter((r) => takenKeys.has(dayKey(r.date.toISOString())));
  const adherencePct = dueSoFar.length ? Math.round((takenSoFar.length / dueSoFar.length) * 100) : null;
  const lastShot = [...doses].sort(
    (a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime(),
  )[0];

  // Adherence streak: walk due weeks most-recent-first, stop at the first miss.
  let streak = 0;
  for (let i = dueSoFar.length - 1; i >= 0; i--) {
    if (takenKeys.has(dayKey(dueSoFar[i].date.toISOString()))) streak += 1;
    else break;
  }

  const activeDays = useMemo(() => {
    const s = new Set<string>();
    weights.forEach((w) => s.add(dayKey(w.recordedAt)));
    hba1c.forEach((h) => s.add(dayKey(h.recordedAt)));
    doses.forEach((d) => s.add(dayKey(d.takenAt)));
    return s;
  }, [weights, hba1c, doses]);

  const weekLabels = useMemo(() => t('home.weekDayLetters').split(','), [t]);

  const feed = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [];
    weights.forEach((w) =>
      items.push({
        key: `w-${w.id}`,
        icon: '⚖️',
        title: t('home.feedWeight'),
        detail: `${w.weightKg.toFixed(1)} kg`,
        date: w.recordedAt,
      }),
    );
    hba1c.forEach((h) =>
      items.push({
        key: `a-${h.id}`,
        icon: '🩸',
        title: t('home.feedA1c'),
        detail: `${h.value.toFixed(1)}%`,
        date: h.recordedAt,
      }),
    );
    doses.forEach((d) =>
      items.push({
        key: `d-${d.id}`,
        icon: '💉',
        title: t('home.feedDose'),
        detail: d.doseMg != null ? `${d.doseMg.toFixed(2)} mg` : '',
        date: d.takenAt,
      }),
    );
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6);
  }, [weights, hba1c, doses, t]);

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
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
  const reminderSubtitle =
    daysUntilNextDose != null && daysUntilNextDose < 0 ? t('home.reminderGentle') : t('home.reminderEncourage');

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.petra} size="large" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={[styles.headerRow, isRTL && { flexDirection: 'row-reverse' }]}>
        <View>
          <Text style={[styles.hi, align]}>{t('home.hi')}, {user?.fullName?.split(' ')[0]} 👋</Text>
          <Text style={[styles.muted, align]}>{t('home.allSet')}</Text>
        </View>
        {streak > 0 && (
          <View style={styles.streakBadge}>
            <Text style={styles.streakIcon}>🔥</Text>
            <Text style={styles.streakNum}>{streak}</Text>
          </View>
        )}
      </View>

      {mine && daysUntilNextDose != null && (
        <View style={[styles.reminderBanner, isRTL && { flexDirection: 'row-reverse' }]}>
          <Text style={styles.reminderIcon}>{daysUntilNextDose <= 0 ? '💉' : '🎯'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.reminderTitle, align]}>{reminderTitle}</Text>
            <Text style={[styles.reminderSubtitle, align]}>{reminderSubtitle}</Text>
          </View>
        </View>
      )}

      <View style={styles.card}>
        <WeekStrip activeDays={activeDays} labels={weekLabels} isRTL={isRTL} />
      </View>

      {startWeight != null && latestWeight != null ? (
        <View style={[styles.heroCard, isRTL && { flexDirection: 'row-reverse' }]}>
          <ProgressRing progress={ringProgress} size={100} strokeWidth={9} color="#fff" trackColor="rgba(255,255,255,0.25)">
            <Text style={styles.ringValue}>{latestWeight.toFixed(1)}</Text>
            <Text style={styles.ringUnit}>kg</Text>
          </ProgressRing>
          <View style={{ flex: 1, paddingHorizontal: 16 }}>
            <Text style={[styles.heroTitle, align]}>{t('home.weightProgress')}</Text>
            <Text style={[styles.heroDelta, align]}>
              {kgLost >= 0 ? '-' : '+'}
              {Math.abs(kgLost).toFixed(1)} kg · {Math.abs(percentLost).toFixed(1)}% {t('home.sinceStart')}
            </Text>
            <Text style={[styles.heroGoal, align]}>{t('home.goalHint')}</Text>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.heroEmpty} onPress={() => onNavigate('weight')} activeOpacity={0.8}>
          <Text style={[styles.heroEmptyText, align]}>{t('home.logFirstWeight')}</Text>
        </TouchableOpacity>
      )}

      {mine ? (
        <View style={[styles.statsRow, isRTL && { flexDirection: 'row-reverse' }]}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⏰</Text>
            <Text style={styles.statLabel}>{t('home.nextDose')}</Text>
            <Text style={styles.statValue}>{nextDose ? fmtDays(nextDose.date) : '—'}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>💉</Text>
            <Text style={styles.statLabel}>{t('home.lastShot')}</Text>
            <Text style={styles.statValue}>{lastShot ? fmtDate(lastShot.takenAt) : '—'}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📊</Text>
            <Text style={styles.statLabel}>{t('home.adherence')}</Text>
            <Text style={styles.statValue}>{adherencePct != null ? `${adherencePct}%` : '—'}</Text>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.card} onPress={() => onNavigate('meds')} activeOpacity={0.8}>
          <Text style={[styles.cardTitle, align]}>{t('home.yourCourse')}</Text>
          <Text style={[styles.item, align]}>{t('home.semetraCard')}</Text>
        </TouchableOpacity>
      )}

      <View style={styles.card}>
        <Text style={[styles.cardTitle, align]}>{t('home.recentActivity')}</Text>
        {feed.length === 0 ? (
          <Text style={[styles.muted, align]}>{t('home.noActivity')}</Text>
        ) : (
          feed.map((it) => (
            <View key={it.key} style={[styles.feedRow, isRTL && { flexDirection: 'row-reverse' }]}>
              <View style={styles.feedIcon}>
                <Text style={{ fontSize: 16 }}>{it.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.feedTitle, align]}>{it.title}</Text>
                <Text style={[styles.feedDetail, align]}>{it.detail}</Text>
              </View>
              <Text style={styles.feedDate}>{fmtDate(it.date)}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={[styles.cardTitle, align]}>{t('home.security')}</Text>
        <View style={[styles.row, isRTL && { flexDirection: 'row-reverse' }]}>
          <View style={{ flex: 1, paddingHorizontal: 12 }}>
            <Text style={[styles.rowLabel, align]}>{t('home.biometric')}</Text>
            <Text style={[styles.item, align]}>
              {bioAvailable ? t('home.biometricDesc') : t('home.noBiometric')}
            </Text>
          </View>
          <Switch
            value={bioOn}
            disabled={!bioAvailable}
            onValueChange={toggleBio}
            trackColor={{ true: colors.petra }}
          />
        </View>
      </View>

      <TouchableOpacity onPress={logout} style={{ marginTop: 4 }}>
        <Text style={styles.link}>{t('common.signOut')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  container: { padding: 20, paddingTop: 64, paddingBottom: 140, backgroundColor: colors.bg, flexGrow: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  hi: { fontSize: 22, fontWeight: '700', color: colors.text },
  muted: { color: colors.muted },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  streakIcon: { fontSize: 15 },
  streakNum: { fontWeight: '800', color: '#c2410c', fontSize: 14 },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 14 },
  reminderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#fde8cd',
  },
  reminderIcon: { fontSize: 26 },
  reminderTitle: { fontWeight: '800', color: '#9a3412', fontSize: 15 },
  reminderSubtitle: { color: '#c2703d', fontSize: 12, marginTop: 2 },
  cardTitle: { fontWeight: '600', color: colors.text, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowLabel: { fontWeight: '600', color: colors.text, marginBottom: 4 },
  item: { color: colors.muted, marginBottom: 6 },
  link: { color: colors.petra, fontWeight: '600', textAlign: 'center' },

  heroCard: {
    backgroundColor: colors.petra,
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ringValue: { color: '#fff', fontWeight: '800', fontSize: 20 },
  ringUnit: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '600' },
  heroTitle: { color: '#fff', fontWeight: '700', fontSize: 15, marginBottom: 6 },
  heroDelta: { color: 'rgba(255,255,255,0.92)', fontWeight: '600', fontSize: 13, marginBottom: 6 },
  heroGoal: { color: 'rgba(255,255,255,0.75)', fontSize: 11 },
  heroEmpty: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
  heroEmptyText: { color: colors.muted, fontWeight: '600' },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 12, alignItems: 'center', gap: 4 },
  statIcon: { fontSize: 16 },
  statLabel: { fontSize: 11, color: colors.muted, fontWeight: '600', textAlign: 'center' },
  statValue: { fontSize: 13, fontWeight: '800', color: colors.text, textAlign: 'center' },

  feedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 12,
  },
  feedIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedTitle: { fontWeight: '600', color: colors.text, fontSize: 13 },
  feedDetail: { color: colors.muted, fontSize: 12, marginTop: 1 },
  feedDate: { color: colors.muted, fontSize: 11 },
});
