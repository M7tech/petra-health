import React, { useCallback, useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { authenticate, isBiometricEnabled } from './biometrics';
import { useI18n } from './i18n';
import { AppText, Button } from '@/components/ui';
import { spacing, useTheme } from '@/theme';

// Overlays a lock screen over its children when the user has opted into a
// biometric check. Children stay mounted underneath, so navigation state is
// never lost.
export default function BiometricGate({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const [locked, setLocked] = useState(false);

  const attempt = useCallback(async () => {
    if (await authenticate()) setLocked(false);
  }, []);

  useEffect(() => {
    (async () => {
      if (await isBiometricEnabled()) {
        setLocked(true);
        await attempt(); // prompt immediately on open
      }
    })();
  }, [attempt]);

  return (
    <View style={{ flex: 1 }}>
      {children}
      {locked ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md }]}>
          <Image source={require('../assets/logo-mark.png')} style={{ width: 64, height: 64, marginBottom: spacing.sm }} />
          <AppText variant="title2">{t('ui.lockedTitle')}</AppText>
          <AppText variant="subhead" tone="secondary" style={{ textAlign: 'center', marginBottom: spacing.lg }}>
            {t('ui.lockedBody')}
          </AppText>
          <Button title={t('ui.unlock')} onPress={attempt} fullWidth={false} />
        </View>
      ) : null}
    </View>
  );
}
