import React, { useState } from 'react';
import { router } from 'expo-router';
import { View } from 'react-native';
import { api } from '@/api';
import { useI18n } from '@/i18n';
import { notifyError } from '@/lib/errors';
import { spacing } from '@/theme';
import { AppText, Banner, Button, InputField, Screen, haptics } from '@/components/ui';

// Shared body for the "log a single number" sheets (weight, HbA1c).
export default function LogValueSheet({
  label,
  unit,
  placeholder,
  path,
  field,
  min,
  max,
  invalidMessage,
}: {
  label: string;
  unit: string;
  placeholder: string;
  path: string;
  field: string;
  min: number;
  max: number;
  invalidMessage: string;
}) {
  const { t } = useI18n();
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    const v = parseFloat(value.replace(',', '.'));
    if (Number.isNaN(v) || v < min || v > max) {
      setError(invalidMessage);
      haptics.warning();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api(path, { method: 'POST', body: JSON.stringify({ [field]: v }) });
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
      <View style={{ gap: spacing.sm }}>
        <AppText variant="footnote" tone="secondary" weight="600" style={{ textTransform: 'uppercase', letterSpacing: 0.3 }}>
          {label}
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <InputField
            value={value}
            onChangeText={setValue}
            keyboardType="decimal-pad"
            placeholder={placeholder}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={save}
            style={{ flex: 1, fontSize: 28, lineHeight: 34, fontWeight: '700', paddingVertical: spacing.md }}
          />
          <AppText variant="title3" tone="secondary">
            {unit}
          </AppText>
        </View>
      </View>
      <Button title={t('common.save')} onPress={save} loading={busy} />
    </Screen>
  );
}
