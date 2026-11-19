import React from 'react';
import { Stack } from 'expo-router/stack';
import { useI18n } from '@/i18n';
import { useStackOptions } from '@/lib/stack-options';

export const unstable_settings = { initialRouteName: 'index' };

// Training is open to everyone: it sits outside the sign-in guards, needs no account,
// and keeps its own progress on the device.
export default function TrainingLayout() {
  const options = useStackOptions();
  const { t } = useI18n();
  return (
    <Stack screenOptions={options}>
      <Stack.Screen name="index" options={{ title: t('train.hub.title') }} />
      <Stack.Screen name="dose" options={{ title: t('train.modules.dose.t'), headerLargeTitleEnabled: false }} />
      <Stack.Screen name="sites" options={{ title: t('train.modules.sites.t'), headerLargeTitleEnabled: false }} />
      <Stack.Screen name="inject" options={{ title: t('train.modules.inject.t'), headerLargeTitleEnabled: false }} />
      <Stack.Screen name="missed" options={{ title: t('train.modules.missed.t'), headerLargeTitleEnabled: false }} />
      <Stack.Screen name="storage" options={{ title: t('train.modules.storage.t'), headerLargeTitleEnabled: false }} />
    </Stack>
  );
}
