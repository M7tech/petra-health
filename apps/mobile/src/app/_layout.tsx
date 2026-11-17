import React from 'react';
import { Platform, useColorScheme } from 'react-native';
import { Stack } from 'expo-router';
import { ThemeProvider, DarkTheme, DefaultTheme } from 'expo-router/react-navigation';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { AuthProvider, useAuth } from '@/auth';
import { LanguageProvider, useI18n } from '@/i18n';
import BiometricGate from '@/BiometricGate';
import { LoadingState } from '@/components/ui';
import { useMessageNotifications } from '@/messageAlerts';
import { registerForPushNotificationsAsync } from '@/notifications';
import { api } from '@/api';
import { darkPalette, lightPalette, useTheme } from '@/theme';

function NavTheme({ children }: { children: React.ReactNode }) {
  const dark = useColorScheme() === 'dark';
  const p = dark ? darkPalette : lightPalette;
  const base = dark ? DarkTheme : DefaultTheme;
  return (
    <ThemeProvider
      value={{
        ...base,
        colors: { ...base.colors, primary: p.tint, background: p.background, card: p.surface, text: p.label, border: p.separator, notification: p.tint },
      }}
    >
      {children}
    </ThemeProvider>
  );
}

// Sheets share one look: a grabber, a title, and a Done action on the trailing edge.
const sheet = (extra: { title: string; sheetAllowedDetents?: number[]; contentStyle?: object }) => ({
  presentation: 'formSheet' as const,
  sheetGrabberVisible: true,
  sheetAllowedDetents: [0.62, 1],
  sheetInitialDetentIndex: 0,
  headerShown: true,
  ...extra,
});

function Routes() {
  const { user, loading } = useAuth();
  const { ready, t } = useI18n();
  const { colors } = useTheme();
  useMessageNotifications(!!user?.doctorId);

  React.useEffect(() => {
    if (!user?.doctorId) return;
    // No-op in Expo Go; registers a real push token in an EAS build.
    (async () => {
      const token = await registerForPushNotificationsAsync();
      if (token) api('/me/push-token', { method: 'POST', body: JSON.stringify({ token }) }).catch(() => {});
    })();
  }, [user?.doctorId]);

  if (loading || !ready) return <LoadingState />;

  const sheetBg = Platform.OS === 'ios' ? { contentStyle: { backgroundColor: 'transparent' } } : { contentStyle: { backgroundColor: colors.background } };

  return (
    <BiometricGate>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Protected guard={!user}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={!!user && !user.doctorId}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>
        <Stack.Protected guard={!!user && !!user.doctorId}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="profile" options={sheet({ title: t('ui.profile'), sheetAllowedDetents: [1], ...sheetBg })} />
          <Stack.Screen name="guide" options={sheet({ title: t('guide.title'), sheetAllowedDetents: [1], ...sheetBg })} />
          <Stack.Screen name="select" options={sheet({ title: '', sheetAllowedDetents: [0.7, 1], ...sheetBg })} />
          <Stack.Screen name="log-weight" options={sheet({ title: t('quickAdd.logWeight'), sheetAllowedDetents: [0.5], ...sheetBg })} />
          <Stack.Screen name="log-a1c" options={sheet({ title: t('quickAdd.logA1c'), sheetAllowedDetents: [0.5], ...sheetBg })} />
          <Stack.Screen name="add-reminder" options={sheet({ title: t('meds.add'), sheetAllowedDetents: [0.85, 1], ...sheetBg })} />
          <Stack.Screen name="add-event" options={sheet({ title: t('care.log'), sheetAllowedDetents: [0.75, 1], ...sheetBg })} />
        </Stack.Protected>
      </Stack>
    </BiometricGate>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <LanguageProvider>
          <AuthProvider>
            <NavTheme>
              <StatusBar style="auto" />
              <Routes />
            </NavTheme>
          </AuthProvider>
        </LanguageProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
