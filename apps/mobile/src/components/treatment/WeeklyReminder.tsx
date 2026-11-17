import React, { useEffect, useState } from 'react';
import { Switch } from 'react-native';
import { useI18n, currentLocale } from '@/i18n';
import { cancelReminder, getReminder, scheduleWeeklyReminder, ReminderState } from '@/notifications';
import { useTheme } from '@/theme';
import { Banner, Button, DateRow, DayPicker, Row, Section, haptics } from '@/components/ui';

const timeOf = (h: number, m: number) => {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
};

export default function WeeklyReminder() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const letters = t('home.weekDayLetters').split(',');
  const [reminder, setReminder] = useState<ReminderState | null>(null);
  const [weekday, setWeekday] = useState(1);
  const [time, setTime] = useState(() => timeOf(9, 0));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    getReminder().then(setReminder);
  }, []);

  async function enable() {
    setBusy(true);
    setMsg(null);
    const state = await scheduleWeeklyReminder(weekday, time.getHours(), time.getMinutes());
    if (state) {
      setReminder(state);
      haptics.success();
    } else {
      setMsg(t('semetra.enableNotif'));
      haptics.warning();
    }
    setBusy(false);
  }

  async function disable() {
    setBusy(true);
    await cancelReminder();
    setReminder(null);
    setBusy(false);
  }

  const fmtTime = (h: number, m: number) => timeOf(h, m).toLocaleTimeString(currentLocale(), { hour: '2-digit', minute: '2-digit' });

  if (reminder) {
    return (
      <Section title={t('semetra.weeklyReminder')} footer={t('semetra.worksOffline')}>
        <Row
          icon="bell"
          title={t('semetra.reminderOn')}
          subtitle={`${letters[reminder.weekday - 1]} · ${fmtTime(reminder.hour, reminder.minute)}`}
          right={<Switch accessibilityLabel={t('semetra.weeklyReminder')} value onValueChange={disable} disabled={busy} trackColor={{ true: colors.tint }} />}
        />
      </Section>
    );
  }
  return (
    <>
      <Section title={t('semetra.weeklyReminder')} footer={t('semetra.worksOffline')}>
        <DayPicker value={weekday} onChange={setWeekday} labels={letters} />
        <DateRow title={t('semetra.time')} value={time} mode="time" onChange={setTime} />
      </Section>
      {msg ? <Banner message={msg} tone="info" /> : null}
      <Button title={t('semetra.turnOn')} icon="bell" variant="tinted" size="md" onPress={enable} loading={busy} />
    </>
  );
}
