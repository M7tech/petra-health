import React, { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { useI18n } from '@/i18n';
import { getMedReminders, removeMedReminder, MedReminder, TimeOfDay } from '@/notifications';
import { IconButton, Row, Section } from '@/components/ui';
import { useTheme } from '@/theme';

const fmtTime = (tm: TimeOfDay) => `${String(tm.hour).padStart(2, '0')}:${String(tm.minute).padStart(2, '0')}`;

export default function OtherMeds() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const letters = t('home.weekDayLetters').split(',');
  const [meds, setMeds] = useState<MedReminder[]>([]);

  useFocusEffect(
    useCallback(() => {
      getMedReminders().then(setMeds);
    }, []),
  );

  const describe = (m: MedReminder) => {
    const times = m.times.map(fmtTime).join(', ');
    if (m.freq === 'daily') return `${t('meds.daily')} · ${times}`;
    if (m.freq === 'weekly') return `${t('meds.weekly')} · ${letters[(m.weekday ?? 1) - 1]} ${t('meds.at')} ${times}`;
    return `${t('meds.monthly')} · ${t('meds.dayOfMonth')} ${m.dayOfMonth} ${t('meds.at')} ${times}`;
  };

  return (
    <Section title={t('meds.title')}>
      {meds.map((m, i) => (
        <Row
          key={`${m.name}-${i}`}
          icon="pill"
          iconColor={colors.violet}
          title={m.name}
          subtitle={describe(m)}
          right={<IconButton icon="trash" label={t('meds.remove')} tone="label" size={34} onPress={async () => setMeds(await removeMedReminder(m))} />}
        />
      ))}
      {meds.length === 0 ? <Row title={t('meds.none')} tone="secondary" /> : null}
      <Row icon="plus" iconColor={colors.success} title={t('meds.add')} chevron onPress={() => router.push('/add-reminder')} />
    </Section>
  );
}
