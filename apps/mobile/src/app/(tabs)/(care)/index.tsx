import React, { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import { router, Stack } from 'expo-router';
import { api } from '@/api';
import { useI18n, currentLocale } from '@/i18n';
import { useFocusLoad } from '@/lib/hooks';
import { notifyError } from '@/lib/errors';
import { useTheme } from '@/theme';
import {
  Badge, BadgeTone, Banner, Button, EmptyState, FieldRow, IconButton, LoadingState, Row, Screen, Section, haptics,
} from '@/components/ui';
import type { AdverseEvent, AdverseSeverity, ClinicalAssessment, PatientComment, SupportMessage } from '@/types';

const SEV_TONE: Record<AdverseSeverity, BadgeTone> = { MILD: 'success', MODERATE: 'warning', SEVERE: 'danger' };

export default function CareScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const [comments, setComments] = useState<PatientComment[]>([]);
  const [events, setEvents] = useState<AdverseEvent[]>([]);
  const [assessment, setAssessment] = useState<ClinicalAssessment | null>(null);
  const [lastMessage, setLastMessage] = useState<SupportMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ending, setEnding] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [c, e, a, m] = await Promise.all([
        api<PatientComment[]>('/me/comments'),
        api<AdverseEvent[]>('/me/adverse-events'),
        api<ClinicalAssessment | null>('/me/assessment'),
        api<SupportMessage[]>('/me/messages'),
      ]);
      setComments(c);
      setEvents(e);
      setAssessment(a);
      setLastMessage(m[m.length - 1] ?? null);
    } catch (err) {
      setError(notifyError(err, t('learn.loadFailed')));
    }
  }, [t]);
  const state = useFocusLoad(load);

  async function endTreatment() {
    setBusy(true);
    try {
      await api('/me/treatment', { method: 'PUT', body: JSON.stringify({ treatmentStatus: 'DISCONTINUED', discontinuationReason: reason.trim() }) });
      haptics.success();
      setEnding(false);
      setReason('');
      await load();
    } catch (e) {
      setError(notifyError(e, t('ui.couldNotSave')));
    } finally {
      setBusy(false);
    }
  }

  if (state.loading) return <LoadingState />;

  const status = assessment?.treatmentStatus ?? 'ONGOING';
  const statusTone: BadgeTone = status === 'DISCONTINUED' ? 'danger' : status === 'COMPLETED' ? 'neutral' : 'success';
  const statusLabel = status === 'ONGOING' ? t('care.statusOngoing') : status === 'COMPLETED' ? t('care.statusCompleted') : t('care.statusDiscontinued');

  const add =
    Platform.OS === 'ios' ? (
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button icon="plus" onPress={() => router.push('/add-event')} />
      </Stack.Toolbar>
    ) : (
      <Stack.Screen options={{ headerRight: () => <IconButton icon="plus" label={t('care.log')} onPress={() => router.push('/add-event')} size={40} /> }} />
    );

  return (
    <Screen keyboard={ending} refreshing={state.refreshing} onRefresh={state.refresh}>
      {add}
      {error ? <Banner message={error} onRetry={state.reload} retryLabel={t('ui.retry')} /> : null}

      <Section title={t('contact.title')} footer={t('contact.desc')}>
        <Row
          icon="message"
          iconColor={colors.info}
          title={t('contact.title')}
          subtitle={lastMessage ? lastMessage.body : t('contact.none')}
          chevron
          onPress={() => router.push('/(tabs)/(care)/messages')}
        />
      </Section>

      <Section title={t('care.treatment')}>
        <Row icon="heart" iconColor={colors.success} title={t('care.treatment')} right={<Badge tone={statusTone} label={statusLabel} />} />
        {assessment?.discontinuationReason ? <Row title={t('care.reasonLabel')} subtitle={assessment.discontinuationReason} /> : null}
        {status === 'ONGOING' && !ending ? <Row title={t('care.endTreatment')} tone="danger" onPress={() => setEnding(true)} /> : null}
        {ending ? <FieldRow label={t('care.reasonLabel')} value={reason} onChangeText={setReason} placeholder={t('care.reasonPlaceholder')} autoFocus /> : null}
      </Section>
      {ending ? (
        <>
          <Button title={t('care.confirmEnd')} variant="destructive" onPress={endTreatment} loading={busy} />
          <Button title={t('common.cancel')} variant="plain" size="md" onPress={() => setEnding(false)} />
        </>
      ) : null}

      {assessment?.physicianComments ? (
        <Section title={t('care.physicianNotes')}>
          <Row icon="stethoscope" title={assessment.physicianComments} />
        </Section>
      ) : null}

      <Section title={t('care.comments')}>
        {comments.length === 0 ? (
          <Row title={t('care.noComments')} tone="secondary" />
        ) : (
          comments.map((c) => <Row key={c.id} icon="message" iconColor={colors.violet} title={c.body} subtitle={`${c.doctorName ?? 'Doctor'} · ${new Date(c.createdAt).toLocaleDateString()}`} />)
        )}
      </Section>

      <Section title={t('care.adverseEvents')}>
        {events.length === 0 ? (
          <EmptyState icon="shield" title={t('care.noEvents')} />
        ) : (
          events.map((e) => (
            <Row
              key={e.id}
              title={e.description}
              subtitle={new Date(e.onsetDate).toLocaleDateString(currentLocale(), { month: 'short', day: 'numeric', year: 'numeric' })}
              right={<Badge tone={SEV_TONE[e.severity]} label={t(`severity.${e.severity}`)} />}
            />
          ))
        )}
      </Section>
    </Screen>
  );
}
