import React from 'react';
import { Stack } from 'expo-router/stack';
import { useStackOptions } from '@/lib/stack-options';
import { useI18n } from '@/i18n';

export default function StackLayout() {
  const options = useStackOptions();
  const { t } = useI18n();
  return (
    <Stack screenOptions={options}>
      <Stack.Screen name="treatment" options={{ title: t('ui.tabTreatment') }} />
    </Stack>
  );
}
