import React, { useState } from 'react';
import { router } from 'expo-router';
import { View } from 'react-native';
import { useI18n } from '@/i18n';
import { addMedReminder, MedFrequency, TimeOfDay } from '@/notifications';
import { spacing, useTheme } from '@/theme';
import {
  AppText, Banner, Button, DateRow, DayPicker, FieldRow, PressableScale, Screen, SegmentedControl, Section, haptics, Icon,
} from '@/components/ui';

const MONTH_DAYS = Array.from({ length: 28 }, (_, i) => i + 1);
const MAX_DAILY_TIMES = 3;
const at = (h: number, m: number) => {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
};
const fmt = (tm: TimeOfDay) => at(tm.hour, tm.minute).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

export default function AddReminderSheet() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const letters = t('home.weekDayLetters').split(',');
  const [name, setName] = useState('');
  const [freq, setFreq] = useState<MedFrequency>('daily');
  const [weekday, setWeekday] = useState(1);
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [time, setTime] = useState(() => at(8, 0));
  const [dailyTimes, setDailyTimes] = useState<TimeOfDay[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = { hour: time.getHours(), minute: time.getMinutes() };

  function addDailyTime() {
    if (dailyTimes.length >= MAX_DAILY_TIMES) return;
    if (dailyTimes.some((x) => x.hour === current.hour && x.minute === current.minute)) return;
    haptics.select();
    setDailyTimes((p) => [...p, current]);
  }

  async function save() {
    const times: TimeOfDay[] = freq === 'daily' ? dailyTimes : [current];
    if (name.trim().length < 2 || times.length === 0) {
      setError(t('ui.reminderIncomplete'));
      haptics.warning();
      return;
    }
    setBusy(true);
    setError(null);
    const next = await addMedReminder({
      name: name.trim(),
      freq,
      times,
      weekday: freq === 'weekly' ? weekday : undefined,
      dayOfMonth: freq === 'monthly' ? dayOfMonth : undefined,
    });
    setBusy(false);
    if (next) {
      haptics.success();
      router.back();
    } else {
      setError(t('semetra.enableNotif'));
    }
  }

  return (
    <Screen keyboard>
      {error ? <Banner message={error} /> : null}
      <Section>
        <FieldRow label={t('ui.medName')} value={name} onChangeText={setName} placeholder={t('meds.name')} autoFocus />
      </Section>
      <SegmentedControl
        value={freq}
        onChange={(f) => {
          setFreq(f);
          setDailyTimes([]);
        }}
        options={[
          { key: 'daily', label: t('meds.daily') },
          { key: 'weekly', label: t('meds.weekly') },
          { key: 'monthly', label: t('meds.monthly') },
        ]}
      />

      {freq === 'weekly' ? (
        <Section>
          <DayPicker value={weekday} onChange={setWeekday} labels={letters} />
        </Section>
      ) : null}

      {freq === 'monthly' ? (
        <Section title={t('meds.dayOfMonth')}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, padding: spacing.lg }}>
            {MONTH_DAYS.map((d) => (
              <PressableScale
                key={d}
                haptic={false}
                onPress={() => {
                  haptics.select();
                  setDayOfMonth(d);
                }}
                innerStyle={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: dayOfMonth === d ? colors.tint : colors.fill }}
              >
                <AppText variant="subhead" weight="600" numeric tone={dayOfMonth === d ? 'onTint' : 'label'}>
                  {d}
                </AppText>
              </PressableScale>
            ))}
          </View>
        </Section>
      ) : null}

      <Section title={freq === 'daily' ? t('meds.timesPerDay') : t('meds.time')}>
        <DateRow title={t('semetra.time')} value={time} mode="time" onChange={setTime} />
        {freq === 'daily' && dailyTimes.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, padding: spacing.lg }}>
            {dailyTimes.map((tm, i) => (
              <PressableScale
                key={i}
                accessibilityLabel={`${fmt(tm)} ✕`}
                onPress={() => setDailyTimes((p) => p.filter((_, idx) => idx !== i))}
                innerStyle={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.tintSoft, borderRadius: 999, paddingHorizontal: spacing.md, paddingVertical: 6 }}
              >
                <AppText variant="subhead" weight="600" tone="tint" numeric>
                  {fmt(tm)}
                </AppText>
                <Icon name="close" size={12} color={colors.tint} weight="bold" />
              </PressableScale>
            ))}
          </View>
        ) : null}
      </Section>
      {freq === 'daily' ? (
        <Button
          title={`${t('meds.addTime')} (${dailyTimes.length}/${MAX_DAILY_TIMES})`}
          icon="plus"
          variant="tinted"
          size="md"
          onPress={addDailyTime}
          disabled={dailyTimes.length >= MAX_DAILY_TIMES}
        />
      ) : null}

      <Button title={t('meds.add')} onPress={save} loading={busy} />
    </Screen>
  );
}
