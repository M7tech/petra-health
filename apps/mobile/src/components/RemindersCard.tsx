import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../ui';
import {
  cancelReminder,
  getReminder,
  scheduleWeeklyReminder,
  ReminderState,
} from '../notifications';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']; // index 0..6 -> weekday 1..7
const TIMES = [
  { label: 'Morning · 9:00', hour: 9, minute: 0 },
  { label: 'Evening · 20:00', hour: 20, minute: 0 },
];

export default function RemindersCard() {
  const [reminder, setReminder] = useState<ReminderState | null>(null);
  const [weekday, setWeekday] = useState(1); // Sunday default
  const [timeIdx, setTimeIdx] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    getReminder().then(setReminder);
  }, []);

  async function enable() {
    setBusy(true);
    setMsg(null);
    const t = TIMES[timeIdx];
    const state = await scheduleWeeklyReminder(weekday, t.hour, t.minute);
    if (state) {
      setReminder(state);
    } else {
      setMsg('Enable notifications in your device settings to use reminders.');
    }
    setBusy(false);
  }

  async function disable() {
    setBusy(true);
    await cancelReminder();
    setReminder(null);
    setBusy(false);
  }

  const fmtTime = (h: number, m: number) =>
    `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Weekly reminder</Text>
      {reminder ? (
        <>
          <Text style={styles.on}>
            ✓ On — every {DAYS[reminder.weekday - 1]} at {fmtTime(reminder.hour, reminder.minute)}
          </Text>
          <Text style={styles.note}>Works offline; fires even without a connection.</Text>
          <TouchableOpacity onPress={disable} disabled={busy} style={styles.disableBtn}>
            <Text style={styles.disableText}>Turn off</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.label}>Day</Text>
          <View style={styles.dayRow}>
            {DAYS.map((d, i) => {
              const wd = i + 1;
              const active = wd === weekday;
              return (
                <TouchableOpacity
                  key={d}
                  onPress={() => setWeekday(wd)}
                  style={[styles.dayBtn, active && styles.dayBtnActive]}
                >
                  <Text style={[styles.dayText, active && styles.dayTextActive]}>{d[0]}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>Time</Text>
          <View style={styles.timeRow}>
            {TIMES.map((t, i) => {
              const active = i === timeIdx;
              return (
                <TouchableOpacity
                  key={t.label}
                  onPress={() => setTimeIdx(i)}
                  style={[styles.timeBtn, active && styles.timeBtnActive]}
                >
                  <Text style={[styles.timeText, active && styles.timeTextActive]}>{t.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {msg && <Text style={styles.msg}>{msg}</Text>}
          <TouchableOpacity onPress={enable} disabled={busy} style={styles.enableBtn}>
            <Text style={styles.enableText}>Turn on weekly reminder</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16 },
  title: { fontWeight: '700', color: colors.text, marginBottom: 10, fontSize: 15 },
  on: { color: '#16a34a', fontWeight: '600' },
  note: { color: colors.muted, fontSize: 12, marginTop: 4 },
  label: { color: colors.muted, fontSize: 12, marginTop: 10, marginBottom: 6 },
  dayRow: { flexDirection: 'row', justifyContent: 'space-between' },
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
  dayTextActive: { color: '#fff' },
  timeRow: { flexDirection: 'row', gap: 10 },
  timeBtn: { flex: 1, borderRadius: 10, padding: 12, backgroundColor: '#f1f5f9', alignItems: 'center' },
  timeBtnActive: { backgroundColor: colors.petra },
  timeText: { color: colors.muted, fontWeight: '600', fontSize: 13 },
  timeTextActive: { color: '#fff' },
  msg: { color: colors.danger, fontSize: 12, marginTop: 10 },
  enableBtn: { marginTop: 14, backgroundColor: colors.petra, borderRadius: 10, padding: 13, alignItems: 'center' },
  enableText: { color: '#fff', fontWeight: '600' },
  disableBtn: { marginTop: 12, alignSelf: 'flex-start' },
  disableText: { color: colors.petra, fontWeight: '600' },
});
