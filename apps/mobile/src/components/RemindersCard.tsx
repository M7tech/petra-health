import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../ui';
import { useI18n } from '../i18n';
import TimePicker from './TimePicker';
import {
  cancelReminder,
  getReminder,
  scheduleWeeklyReminder,
  ReminderState,
} from '../notifications';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']; // index 0..6 -> weekday 1..7

export default function RemindersCard() {
  const { t, isRTL } = useI18n();
  const align = { textAlign: isRTL ? 'right' : 'left' } as const;
  const [reminder, setReminder] = useState<ReminderState | null>(null);
  const [weekday, setWeekday] = useState(1); // Sunday default
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    getReminder().then(setReminder);
  }, []);

  async function enable() {
    setBusy(true);
    setMsg(null);
    const state = await scheduleWeeklyReminder(weekday, hour, minute);
    if (state) {
      setReminder(state);
    } else {
      setMsg(t('semetra.enableNotif'));
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
      <Text style={[styles.title, align]}>{t('semetra.weeklyReminder')}</Text>
      {reminder ? (
        <>
          <Text style={[styles.on, align]}>
            {t('semetra.reminderOn')} — {DAYS[reminder.weekday - 1]}{' '}
            {fmtTime(reminder.hour, reminder.minute)}
          </Text>
          <Text style={[styles.note, align]}>{t('semetra.worksOffline')}</Text>
          <TouchableOpacity onPress={disable} disabled={busy} style={styles.disableBtn}>
            <Text style={styles.disableText}>{t('semetra.turnOff')}</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={[styles.label, align]}>{t('semetra.day')}</Text>
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

          <Text style={[styles.label, align]}>{t('semetra.time')}</Text>
          <TimePicker hour={hour} minute={minute} onChange={(h, m) => { setHour(h); setMinute(m); }} />

          {msg && <Text style={[styles.msg, align]}>{msg}</Text>}
          <TouchableOpacity onPress={enable} disabled={busy} style={styles.enableBtn}>
            <Text style={styles.enableText}>{t('semetra.turnOn')}</Text>
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
  msg: { color: colors.danger, fontSize: 12, marginTop: 10 },
  enableBtn: { marginTop: 14, backgroundColor: colors.petra, borderRadius: 10, padding: 13, alignItems: 'center' },
  enableText: { color: '#fff', fontWeight: '600' },
  disableBtn: { marginTop: 12, alignSelf: 'flex-start' },
  disableText: { color: colors.petra, fontWeight: '600' },
});
