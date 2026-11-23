import React from 'react';
import { Stack } from 'expo-router/stack';
import { useI18n } from '@/i18n';
import { useStackOptions } from '@/lib/stack-options';

export const unstable_settings = { initialRouteName: 'index' };

// The nutrition guide is open to everyone: no account, no sign-in guard.
export default function NutritionLayout() {
  const options = useStackOptions();
  const { t } = useI18n();
  return (
    <Stack screenOptions={options}>
      <Stack.Screen name="index" options={{ title: t('nutri.hub.open') }} />
      <Stack.Screen name="plate" options={{ title: t('nutri.pages.plate.t'), headerLargeTitleEnabled: false }} />
      <Stack.Screen name="foods" options={{ title: t('nutri.pages.foods.t'), headerLargeTitleEnabled: false }} />
      <Stack.Screen name="daily" options={{ title: t('nutri.pages.daily.t'), headerLargeTitleEnabled: false }} />
      <Stack.Screen name="comfort" options={{ title: t('nutri.pages.comfort.t'), headerLargeTitleEnabled: false }} />
      <Stack.Screen name="week" options={{ title: t('nutri.pages.week.t'), headerLargeTitleEnabled: false }} />
      <Stack.Screen name="sources" options={{ title: t('nutri.pages.sources.t'), headerLargeTitleEnabled: false }} />
    </Stack>
  );
}
