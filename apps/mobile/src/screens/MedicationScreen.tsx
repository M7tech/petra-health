import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { api } from '../api';
import { useI18n } from '../i18n';
import { PrimaryButton, colors } from '../ui';
import RemindersCard from '../components/RemindersCard';
import OtherMedsCard from '../components/OtherMedsCard';
import { scheduleWeeklyReminder } from '../notifications';
import type { DoseLog, Medication, UserMedication } from '../types';

const todayStr = () => new Date().toISOString().slice(0, 10);

const dayKey = (iso: string) => iso.slice(0, 10);
const addDays = (date: Date, days: number) => {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(12, 0, 0, 0); // noon UTC to avoid tz date-shift
  return d;
};

export default function MedicationScreen() {
  const { t, isRTL } = useI18n();
  const align = { textAlign: isRTL ? 'right' : 'left' } as const;
  const [catalog, setCatalog] = useState<Medication | null>(null);
  const [mine, setMine] = useState<UserMedication | null>(null);
  const [doses, setDoses] = useState<DoseLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-enrollment choices: which pen, which day, which reminder time.
  const [startPen, setStartPen] = useState<1 | 2>(1);
  const [startDayStr, setStartDayStr] = useState(todayStr());
  const [timeIdx, setTimeIdx] = useState(0);
  const TIME_PRESETS = [
    { label: t('semetra.morning'), hour: 9, minute: 0 },
    { label: t('semetra.evening'), hour: 20, minute: 0 },
  ];

  const load = useCallback(async () => {
    setError(null);
    try {
      const [cat, meds] = await Promise.all([
        api<Medication[]>('/medications'),
        api<UserMedication[]>('/me/medications'),
      ]);
      const semetra = cat.find((m) => m.name === 'Semetra') ?? cat[0] ?? null;
      setCatalog(semetra);
      const enrolled = meds.find((m) => m.name === 'Semetra' && m.active) ?? null;
      setMine(enrolled);
      if (enrolled) {
        setDoses(await api<DoseLog[]>(`/me/doses?userMedicationId=${enrolled.id}`));
      } else {
        setDoses([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function enroll() {
    if (!catalog) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDayStr)) {
      setError(t('semetra.invalidDate'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const startDate = new Date(`${startDayStr}T12:00:00.000Z`); // noon UTC avoids tz date-shift
      await api('/me/medications', {
        method: 'POST',
        body: JSON.stringify({
          medicationId: catalog.id,
          name: catalog.name,
          frequency: 'weekly',
          startDate: startDate.toISOString(),
          startPenSequence: startPen,
        }),
      });
      const time = TIME_PRESETS[timeIdx];
      // expo weekday convention: 1=Sunday..7=Saturday.
      await scheduleWeeklyReminder(startDate.getUTCDay() + 1, time.hour, time.minute);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start course');
    } finally {
      setBusy(false);
    }
  }

  // Flatten pens (from the chosen starting pen onward) -> weeks, with a
  // global index → scheduled date computed from the chosen start day.
  const schedule = useMemo(() => {
    if (!catalog || !mine) return [];
    const start = new Date(mine.startDate);
    const pens = catalog.pens
      .filter((p) => p.sequence >= mine.startPenSequence)
      .sort((a, b) => a.sequence - b.sequence);
    let g = 0;
    return pens.map((pen) => ({
      pen,
      weeks: pen.weeks.map((w) => {
        const date = addDays(start, g * 7);
        g += 1;
        return { week: w, date };
      }),
    }));
  }, [catalog, mine]);

  const takenKeys = useMemo(() => new Set(doses.map((d) => dayKey(d.scheduledFor))), [doses]);

  async function logWeek(date: Date, doseMg: number) {
    if (!mine) return;
    const key = dayKey(date.toISOString());
    if (takenKeys.has(key)) return; // already logged
    setBusy(true);
    try {
      await api('/me/doses', {
        method: 'POST',
        body: JSON.stringify({
          userMedicationId: mine.id,
          scheduledFor: date.toISOString(),
          doseMg,
        }),
      });
      setDoses((prev) => [
        ...prev,
        { id: key, userMedicationId: mine.id, scheduledFor: date.toISOString(), takenAt: new Date().toISOString(), doseMg },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not log dose');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.petra} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
    >
      <Text style={[styles.title, align]}>{catalog?.name ?? t('semetra.title')}</Text>
      <Text style={[styles.subtitle, align]}>
        {catalog?.genericName} · {catalog?.manufacturer}
      </Text>

      {error && <Text style={[styles.error, align]}>{error}</Text>}

      {!mine ? (
        <View style={styles.card}>
          <Text style={[styles.welcomeTitle, align]}>{t('semetra.welcome')}</Text>
          <Text style={[styles.cardText, align]}>{t('semetra.welcomeDesc')}</Text>

          <Text style={[styles.label, align]}>{t('semetra.whichPen')}</Text>
          <View style={[styles.segRow, isRTL && { flexDirection: 'row-reverse' }]}>
            {([1, 2] as const).map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.seg, startPen === p && styles.segActive]}
                onPress={() => setStartPen(p)}
              >
                <Text style={[styles.segText, startPen === p && styles.segTextActive]}>
                  {p === 1 ? t('semetra.firstPen') : t('semetra.secondPen')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, align]}>{t('semetra.startDayLabel')}</Text>
          <TextInput
            style={[styles.input, align]}
            value={startDayStr}
            onChangeText={setStartDayStr}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#94a3b8"
          />

          <Text style={[styles.label, align]}>{t('semetra.reminderTimeLabel')}</Text>
          <View style={[styles.segRow, isRTL && { flexDirection: 'row-reverse' }]}>
            {TIME_PRESETS.map((tp, i) => (
              <TouchableOpacity
                key={tp.label}
                style={[styles.seg, timeIdx === i && styles.segActive]}
                onPress={() => setTimeIdx(i)}
              >
                <Text style={[styles.segText, timeIdx === i && styles.segTextActive]}>{tp.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ marginTop: 16 }}>
            <PrimaryButton title={t('semetra.startCourse')} onPress={enroll} loading={busy} />
          </View>
        </View>
      ) : (
        <>
          <RemindersCard />
          <Text style={[styles.hint, align]}>
            {t('semetra.tapToLog')} {takenKeys.size} {t('semetra.loggedSuffix')}.
          </Text>
          {schedule.map(({ pen, weeks }) => (
            <View key={pen.id} style={styles.penBlock}>
              <Text style={[styles.penTitle, align]}>{pen.label}</Text>
              {weeks.map(({ week, date }) => {
                const key = dayKey(date.toISOString());
                const taken = takenKeys.has(key);
                return (
                  <TouchableOpacity
                    key={week.id}
                    style={[styles.weekRow, taken && styles.weekRowDone]}
                    disabled={taken || busy}
                    onPress={() => logWeek(date, week.doseMg)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, taken && styles.checkboxDone]}>
                      {taken && <Text style={styles.check}>✓</Text>}
                    </View>
                    <Text style={styles.weekLabel}>
                      {t('semetra.week')} {week.weekNumber}
                    </Text>
                    <Text style={styles.dose}>{week.doseMg.toFixed(2)} mg</Text>
                    <Text style={styles.date}>
                      {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </>
      )}

      <OtherMedsCard />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  container: { padding: 20, paddingTop: 60, backgroundColor: colors.bg, flexGrow: 1 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text },
  subtitle: { color: colors.muted, marginBottom: 16, marginTop: 2 },
  hint: { color: colors.muted, marginBottom: 12, fontSize: 13 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 18 },
  cardText: { color: colors.text, lineHeight: 20 },
  welcomeTitle: { fontWeight: '700', fontSize: 17, color: colors.text, marginBottom: 6 },
  label: { color: colors.muted, fontSize: 12, marginTop: 14, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    backgroundColor: '#fff',
  },
  segRow: { flexDirection: 'row', gap: 8 },
  seg: { flex: 1, borderRadius: 10, paddingVertical: 10, backgroundColor: '#f1f5f9', alignItems: 'center' },
  segActive: { backgroundColor: colors.petra },
  segText: { color: colors.muted, fontWeight: '600', fontSize: 13 },
  segTextActive: { color: '#fff' },
  error: {
    backgroundColor: '#fef2f2',
    color: colors.danger,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  penBlock: { marginBottom: 18 },
  penTitle: { fontWeight: '700', color: colors.petra, marginBottom: 8, fontSize: 15 },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  weekRowDone: { backgroundColor: '#f0fdf4' },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  check: { color: '#fff', fontWeight: '900', fontSize: 14 },
  weekLabel: { flex: 1, color: colors.text, fontWeight: '600' },
  dose: { color: colors.text, marginRight: 14, fontWeight: '600' },
  date: { color: colors.muted, width: 56, textAlign: 'right' },
});
