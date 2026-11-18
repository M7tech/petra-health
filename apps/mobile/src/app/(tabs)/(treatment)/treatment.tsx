import React, { useState } from 'react';
import { Platform } from 'react-native';
import { router, Stack } from 'expo-router';
import { api } from '@/api';
import { useI18n, currentLocale } from '@/i18n';
import { useSemetra } from '@/lib/hooks';
import { dayKey } from '@/lib/semetra';
import { notifyError } from '@/lib/errors';
import { confirmDose } from '@/lib/confirm-dose';
import { scheduleStorageTip, scheduleWeeklyReminder } from '@/notifications';
import { useTheme } from '@/theme';
import {
  Badge, Banner, Button, Card, DateRow, EmptyState, Icon, IconButton, LoadingState, Row, Screen, SegmentedControl, Section, haptics, AppText,
} from '@/components/ui';
import WeeklyReminder from '@/components/treatment/WeeklyReminder';
import OtherMeds from '@/components/treatment/OtherMeds';

const atHour = (h: number, m: number) => {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
};

export default function TreatmentScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const s = useSemetra();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-enrolment choices.
  const [startPen, setStartPen] = useState<'1' | '2'>('1');
  const [startDate, setStartDate] = useState(() => new Date());
  const [reminderTime, setReminderTime] = useState(() => atHour(9, 0));

  async function enroll() {
    if (!s.catalog) return;
    setBusy(true);
    setError(null);
    try {
      const ymd = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
      const start = new Date(`${ymd}T12:00:00.000Z`); // noon UTC avoids tz date-shift
      await api('/me/medications', {
        method: 'POST',
        body: JSON.stringify({
          medicationId: s.catalog.id,
          name: s.catalog.name,
          frequency: 'weekly',
          startDate: start.toISOString(),
          startPenSequence: Number(startPen),
        }),
      });
      // expo weekday convention: 1=Sunday..7=Saturday.
      await scheduleWeeklyReminder(start.getUTCDay() + 1, reminderTime.getHours(), reminderTime.getMinutes());
      await scheduleStorageTip();
      haptics.success();
      await s.reload();
    } catch (e) {
      setError(notifyError(e, t('ui.couldNotSave')));
    } finally {
      setBusy(false);
    }
  }

  async function log(date: Date, mg: number) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await s.logDose(date, mg);
      haptics.success();
    } catch (e) {
      setError(notifyError(e, t('ui.couldNotSave')));
    } finally {
      setBusy(false);
    }
  }

  if (s.loading) return <LoadingState />;

  const guideButton =
    Platform.OS === 'ios' ? (
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button icon="book" onPress={() => router.push('/guide')} />
      </Stack.Toolbar>
    ) : (
      <Stack.Screen options={{ headerRight: () => <IconButton icon="book" label={t('guide.guideLink')} onPress={() => router.push('/guide')} size={40} /> }} />
    );

  if (!s.catalog && s.error) {
    return (
      <Screen>
        {guideButton}
        <Banner message={s.error} onRetry={s.reload} retryLabel={t('ui.retry')} />
      </Screen>
    );
  }

  const logged = s.takenKeys.size;
  const total = s.flat.length;

  return (
    <Screen keyboard={!s.mine} onRefresh={s.refresh} refreshing={s.refreshing}>
      {guideButton}
      {error ? <Banner message={error} /> : null}

      {!s.mine ? (
        <>
          <EmptyState icon="syringe" title={t('semetra.welcome')} message={t('semetra.welcomeDesc')} />
          <SegmentedControl
            value={startPen}
            onChange={setStartPen}
            options={[
              { key: '1', label: t('semetra.firstPen') },
              { key: '2', label: t('semetra.secondPen') },
            ]}
          />
          <Section title={t('semetra.whichPen')}>
            <DateRow title={t('semetra.startDayLabel')} value={startDate} onChange={setStartDate} icon="calendar" />
            <DateRow title={t('semetra.reminderTimeLabel')} value={reminderTime} onChange={setReminderTime} mode="time" icon="alarm" />
          </Section>
          <Button title={t('semetra.startCourse')} onPress={enroll} loading={busy} />
        </>
      ) : (
        <>
          <Card tone="violet" style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Icon name="syringe" size={26} color={colors.violet} />
            <AppText variant="subhead" style={{ flex: 1 }}>
              {t('semetra.tapToLog')}
            </AppText>
            <Badge tone="tint" label={`${logged}/${total}`} />
          </Card>

          {s.blocks.map(({ pen, weeks }) => (
            <React.Fragment key={pen.id}>
              <Section title={pen.label}>
                {weeks.map(({ week, date, courseWeek }) => {
                  const taken = s.takenKeys.has(dayKey(date.toISOString()));
                  // A week can't be logged before it's due (a day's grace for early injections).
                  const future = date.getTime() > Date.now() + 86400000;
                  return (
                    <Row
                      key={week.id}
                      leading={<Icon name={taken ? 'checkCircle' : 'circle'} size={26} color={taken ? colors.success : colors.tertiaryLabel} weight="regular" />}
                      title={`${t('semetra.week')} ${courseWeek}`}
                      subtitle={`${date.toLocaleDateString(currentLocale(), { weekday: 'short', month: 'short', day: 'numeric' })}${future ? ` · ${t('ui.futureWeek')}` : ''}`}
                      value={`${week.doseMg.toFixed(2)} mg`}
                      onPress={taken || busy || future ? undefined : () => confirmDose(t, () => log(date, week.doseMg))}
                    />
                  );
                })}
              </Section>

              {pen.sequence === 2 && s.hasStepUpPen ? (
                <Section title={t('guide.forkTitle')} footer={t('guide.forkSub')}>
                  {(['0.5', '1'] as const).map((opt) => (
                    <Row
                      key={opt}
                      icon={opt === '1' ? 'target' : 'syringe'}
                      iconColor={opt === '1' ? colors.violet : colors.tint}
                      title={opt === '0.5' ? t('guide.forkContinue') : t('guide.forkStepUp')}
                      right={s.after8 === opt ? <Icon name="check" size={18} color={colors.tint} weight="bold" /> : undefined}
                      onPress={() => {
                        haptics.select();
                        s.setAfter8(opt);
                      }}
                    />
                  ))}
                </Section>
              ) : null}
            </React.Fragment>
          ))}

          <WeeklyReminder />
        </>
      )}

      <OtherMeds />
    </Screen>
  );
}
