import React from 'react';
import { Stack } from 'expo-router/stack';
import { useStackOptions } from '@/lib/stack-options';
import { useI18n } from '@/i18n';

export const unstable_settings = { initialRouteName: 'care' };

export default function StackLayout() {
  const options = useStackOptions();
  const { t } = useI18n();
  return (
    <Stack screenOptions={options}>
      <Stack.Screen name="care" options={{ title: t('ui.tabCare') }} />
      <Stack.Screen name="messages" options={{ title: t('contact.title'), headerLargeTitleEnabled: false }} />
    </Stack>
  );
}
