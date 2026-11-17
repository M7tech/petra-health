import React from 'react';
import { Stack } from 'expo-router/stack';
import { useStackOptions } from '@/lib/stack-options';
import { useI18n } from '@/i18n';

export default function StackLayout() {
  const options = useStackOptions();
  const { t } = useI18n();
  return (
    <Stack screenOptions={options}>
      <Stack.Screen name="discover" options={{ title: t('ui.tabDiscover') }} />
      <Stack.Screen name="pharmacies" options={{ title: t('pharmacy.title'), headerLargeTitleEnabled: false }} />
      <Stack.Screen name="learn" options={{ title: t('learn.title'), headerLargeTitleEnabled: false }} />
    </Stack>
  );
}
