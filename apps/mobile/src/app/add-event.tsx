import React, { useState } from 'react';
import { router } from 'expo-router';
import { api } from '@/api';
import { useI18n } from '@/i18n';
import { notifyError } from '@/lib/errors';
import { Banner, Button, FieldRow, Screen, SegmentedControl, Section, haptics } from '@/components/ui';
import { SEVERITIES, AdverseSeverity } from '@/types';

export default function AddEventSheet() {
  const { t } = useI18n();
  const [desc, setDesc] = useState('');
  const [severity, setSeverity] = useState<AdverseSeverity>('MILD');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (desc.trim().length < 2) {
      setError(t('ui.describeFirst'));
      haptics.warning();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api('/me/adverse-events', { method: 'POST', body: JSON.stringify({ description: desc.trim(), severity }) });
      haptics.success();
      router.back();
    } catch (e) {
      setError(notifyError(e, t('ui.couldNotSave')));
      haptics.error();
      setBusy(false);
    }
  }

  return (
    <Screen keyboard>
      {error ? <Banner message={error} /> : null}
      <Section>
        <FieldRow label={t('care.adverseEvents')} value={desc} onChangeText={setDesc} placeholder={t('care.eventDesc')} multiline autoFocus />
      </Section>
      <SegmentedControl value={severity} onChange={setSeverity} options={SEVERITIES.map((s) => ({ key: s, label: t(`severity.${s}`) }))} />
      <Button title={t('care.log')} onPress={save} loading={busy} />
    </Screen>
  );
}
