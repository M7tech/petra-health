import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../ui';
import { useI18n } from '../i18n';
import TimePicker from './TimePicker';
import {
  addMedReminder,
  getMedReminders,
  removeMedReminder,
  MedReminder,
  MedFrequency,
  TimeOfDay,
} from '../notifications';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_DAYS = Array.from({ length: 28 }, (_, i) => i + 1);
const MAX_DAILY_TIMES = 3;

export default function OtherMedsCard() {
  const { t, isRTL } = useI18n();
  const align = { textAlign: isRTL ? 'right' : 'left' } as const;

  const [meds, setMeds] = useState<MedReminder[]>([]);
  const [name, setName] = useState('');
  const [freq, setFreq] = useState<MedFrequency>('daily');
  const [weekday, setWeekday] = useState(1);
  const [dayOfMonth, setDayOfMonth] = useState(1);
  // Weekly/monthly: one time. Daily: a picker to build up to 3 times.
  const [hour, setHour] = useState(8);
  const [minute, setMinute] = useState(0);
  const [dailyTimes, setDailyTimes] = useState<TimeOfDay[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getMedReminders().then(setMeds);
  }, []);

  function changeFreq(f: MedFrequency) {
    setFreq(f);
    setDailyTimes([]);
  }

  function addDailyTime() {
    if (dailyTimes.length >= MAX_DAILY_TIMES) return;
    if (dailyTimes.some((t) => t.hour === hour && t.minute === minute)) return;
    setDailyTimes((prev) => [...prev, { hour, minute }]);
  }

  function removeDailyTime(i: number) {
    setDailyTimes((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function add() {
    const times: TimeOfDay[] = freq === 'daily' ? dailyTimes : [{ hour, minute }];
    if (name.trim().length < 2 || times.length === 0) return;
    setBusy(true);
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
      setDailyTimes([]);
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

      {freq === 'daily' && dailyTimes.length > 0 && (
        <View style={[styles.chipsRow, isRTL && { flexDirection: 'row-reverse' }]}>
          {dailyTimes.map((tm, i) => (
            <View key={i} style={styles.timeChip}>
              <Text style={styles.timeChipText}>{fmtTime(tm)}</Text>
              <TouchableOpacity onPress={() => removeDailyTime(i)}>
                <Text style={styles.timeChipRemove}> ✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <Text style={[styles.label, align]}>
        {freq === 'daily' ? t('meds.timesPerDay') : t('meds.time')}
      </Text>
      <TimePicker hour={hour} minute={minute} onChange={(h, m) => { setHour(h); setMinute(m); }} />

      {freq === 'daily' && (
        <TouchableOpacity
          style={[styles.addTimeBtn, dailyTimes.length >= MAX_DAILY_TIMES && { opacity: 0.5 }]}
          onPress={addDailyTime}
          disabled={dailyTimes.length >= MAX_DAILY_TIMES}
        >
          <Text style={styles.addTimeText}>
            {t('meds.addTime')} ({dailyTimes.length}/{MAX_DAILY_TIMES})
          </Text>
        </TouchableOpacity>
      )}

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
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fdf2f8',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  timeChipText: { color: colors.petra, fontWeight: '700', fontSize: 13 },
  timeChipRemove: { color: colors.petra, fontWeight: '700', fontSize: 13 },
  addTimeBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.petra,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  addTimeText: { color: colors.petra, fontWeight: '600', fontSize: 13 },
  addBtn: { marginTop: 14, backgroundColor: colors.petra, borderRadius: 10, padding: 13, alignItems: 'center' },
  addText: { color: '#fff', fontWeight: '600' },
});
