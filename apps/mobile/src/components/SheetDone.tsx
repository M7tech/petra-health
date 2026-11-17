import React from 'react';
import { router, Stack } from 'expo-router';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui';

/** Trailing "Done" for sheets — registers itself as the screen's headerRight. */
export default function SheetDone() {
  const { t } = useI18n();
  return (
    <Stack.Screen
      options={{ headerRight: () => <Button title={t('ui.done')} variant="plain" size="sm" fullWidth={false} onPress={() => router.back()} /> }}
    />
  );
}
