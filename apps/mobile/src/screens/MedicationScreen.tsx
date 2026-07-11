import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
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
import type { DoseLog, Medication, UserMedication } from '../types';

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
    setBusy(true);
    try {
      await api('/me/medications', {
        method: 'POST',
        body: JSON.stringify({
          medicationId: catalog.id,
          name: catalog.name,
          frequency: 'weekly',
        }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start course');
    } finally {
      setBusy(false);
    }
  }

  // Flatten pens -> weeks with a global index → scheduled date from start date.
  const schedule = useMemo(() => {
    if (!catalog || !mine) return [];
    const start = new Date(mine.startDate);
    let g = 0;
    return catalog.pens.map((pen) => ({
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
          <Text style={[styles.cardText, align]}>{t('semetra.startDesc')}</Text>
          <View style={{ marginTop: 14 }}>
            <PrimaryButton title={t('semetra.start')} onPress={enroll} loading={busy} />
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
