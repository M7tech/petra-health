import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../ui';
import { useI18n } from '../i18n';
import {
  addMedReminder,
  getMedReminders,
  removeMedReminder,
  MedReminder,
  MedFrequency,
  TimeOfDay,
} from '../notifications';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIMES = [
  { label: '08:00', hour: 8, minute: 0 },
  { label: '14:00', hour: 14, minute: 0 },
  { label: '20:00', hour: 20, minute: 0 },
];
const MONTH_DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

export default function OtherMedsCard() {
  const { t, isRTL } = useI18n();
  const align = { textAlign: isRTL ? 'right' : 'left' } as const;

  const [meds, setMeds] = useState<MedReminder[]>([]);
  const [name, setName] = useState('');
  const [freq, setFreq] = useState<MedFrequency>('daily');
  const [weekday, setWeekday] = useState(1);
  const [dayOfMonth, setDayOfMonth] = useState(1);
  // Daily: select 1-3 time slots (that count IS "how many times a day").
  // Weekly/monthly: exactly one slot selected.
  const [timeIdxs, setTimeIdxs] = useState<number[]>([2]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getMedReminders().then(setMeds);
  }, []);

  function toggleTime(i: number) {
    if (freq !== 'daily') {
      setTimeIdxs([i]);
      return;
    }
    setTimeIdxs((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i].sort()));
  }

  function changeFreq(f: MedFrequency) {
    setFreq(f);
    setTimeIdxs((prev) => (f === 'daily' ? prev : [prev[0] ?? 2]));
  }

  async function add() {
    if (name.trim().length < 2 || timeIdxs.length === 0) return;
    setBusy(true);
    const times: TimeOfDay[] = timeIdxs.map((i) => ({ hour: TIMES[i].hour, minute: TIMES[i].minute }));
    const next = await addMedReminder({
      name: name.trim(),
      freq,
      times,
      weekday: freq === 'weekly' ? weekday : undefined,
      dayOfMonth: freq === 'monthly' ? dayOfMonth : undefined,
    });
    if (next) {
      setMeds(next);
      setName('');
    }
    setBusy(false);
  }

  async function remove(m: MedReminder) {
    setMeds(await removeMedReminder(m));
  }

  const fmtTime = (tm: TimeOfDay) => `${String(tm.hour).padStart(2, '0')}:${String(tm.minute).padStart(2, '0')}`;

  const fmt = (m: MedReminder) => {
    const times = m.times.map(fmtTime).join(', ');
    if (m.freq === 'daily') return `${t('meds.daily')} · ${times}`;
    if (m.freq === 'weekly') return `${t('meds.weekly')} · ${DAYS[(m.weekday ?? 1) - 1]} ${t('meds.at')} ${times}`;
    return `${t('meds.monthly')} · ${t('meds.dayOfMonth')} ${m.dayOfMonth} ${t('meds.at')} ${times}`;
  };

  return (
    <View style={styles.card}>
      <Text style={[styles.title, align]}>{t('meds.title')}</Text>

      {meds.map((m, i) => (
        <View key={i} style={[styles.row, isRTL && { flexDirection: 'row-reverse' }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, align]}>💊 {m.name}</Text>
            <Text style={[styles.meta, align]}>{fmt(m)}</Text>
          </View>
          <TouchableOpacity onPress={() => remove(m)}>
            <Text style={styles.remove}>{t('meds.remove')}</Text>
          </TouchableOpacity>
        </View>
      ))}
      {meds.length === 0 && <Text style={[styles.muted, align]}>{t('meds.none')}</Text>}

      <TextInput
        style={[styles.input, align]}
        value={name}
        onChangeText={setName}
        placeholder={t('meds.name')}
        placeholderTextColor="#94a3b8"
      />
      <View style={styles.segRow}>
        {(['daily', 'weekly', 'monthly'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.seg, freq === f && styles.segActive]}
            onPress={() => changeFreq(f)}
          >
            <Text style={[styles.segText, freq === f && styles.segTextActive]}>{t(`meds.${f}`)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {freq === 'weekly' && (
        <View style={styles.dayRow}>
          {DAYS.map((d, i) => (
            <TouchableOpacity
              key={d}
              onPress={() => setWeekday(i + 1)}
              style={[styles.dayBtn, weekday === i + 1 && styles.dayBtnActive]}
            >
              <Text style={[styles.dayText, weekday === i + 1 && { color: '#fff' }]}>{d[0]}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {freq === 'monthly' && (
        <>
          <Text style={[styles.label, align]}>{t('meds.dayOfMonth')}</Text>
          <View style={styles.monthGrid}>
            {MONTH_DAYS.map((d) => (
              <TouchableOpacity
                key={d}
                onPress={() => setDayOfMonth(d)}
                style={[styles.monthDayBtn, dayOfMonth === d && styles.dayBtnActive]}
              >
                <Text style={[styles.monthDayText, dayOfMonth === d && { color: '#fff' }]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {freq === 'daily' && <Text style={[styles.label, align]}>{t('meds.timesPerDay')}</Text>}
      <View style={styles.segRow}>
        {TIMES.map((tm, i) => {
          const on = timeIdxs.includes(i);
          return (
            <TouchableOpacity
              key={tm.label}
              style={[styles.seg, on && styles.segActive]}
              onPress={() => toggleTime(i)}
            >
              <Text style={[styles.segText, on && styles.segTextActive]}>{tm.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={styles.addBtn} onPress={add} disabled={busy}>
        <Text style={styles.addText}>{t('meds.add')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16 },
  title: { fontWeight: '700', color: colors.text, marginBottom: 10, fontSize: 15 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  name: { color: colors.text, fontWeight: '600' },
  meta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  remove: { color: colors.danger, fontWeight: '600', fontSize: 13 },
  muted: { color: colors.muted, marginBottom: 4 },
  label: { color: colors.muted, fontSize: 12, marginTop: 10, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    marginTop: 12,
  },
  segRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  seg: { flex: 1, borderRadius: 10, paddingVertical: 9, backgroundColor: '#f1f5f9', alignItems: 'center' },
  segActive: { backgroundColor: colors.petra },
  segText: { color: colors.muted, fontWeight: '600', fontSize: 13 },
  segTextActive: { color: '#fff' },
  dayRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  dayBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  dayBtnActive: { backgroundColor: colors.petra },
  dayText: { color: colors.muted, fontWeight: '600' },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  monthDayBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  monthDayText: { color: colors.muted, fontWeight: '600', fontSize: 12 },
  addBtn: { marginTop: 14, backgroundColor: colors.petra, borderRadius: 10, padding: 13, alignItems: 'center' },
  addText: { color: '#fff', fontWeight: '600' },
});
