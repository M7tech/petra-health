import React from 'react';
import { Platform } from 'react-native';
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
import { ConfigProvider, useConfig } from '@/config';
import { TrainingProgressProvider } from '@/training/progress';
import { useGate } from '@/lib/gate';
import { ThemeModeProvider, darkPalette, lightPalette, useScheme, useTheme } from '@/theme';

function ThemedStatusBar() {
  return <StatusBar style={useScheme() === 'dark' ? 'light' : 'dark'} />;
}

function NavTheme({ children }: { children: React.ReactNode }) {
  const dark = useScheme() === 'dark';
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
  const { doctorFeatures } = useConfig();
  const hasDoctor = doctorFeatures && !!user?.doctorId;
  const gate = useGate();
  // First-run setup needs a city, and a doctor only while doctor features are on.
  const needsSetup = gate === 'setup';
  useMessageNotifications(hasDoctor);

  React.useEffect(() => {
    if (!hasDoctor) return;
    // No-op in Expo Go; registers a real push token in an EAS build.
    (async () => {
      const token = await registerForPushNotificationsAsync();
      if (token) api('/me/push-token', { method: 'POST', body: JSON.stringify({ token }) }).catch(() => {});
    })();
  }, [hasDoctor]);

  if (loading || !ready) return <LoadingState />;

  const sheetBg = Platform.OS === 'ios' ? { contentStyle: { backgroundColor: 'transparent' } } : { contentStyle: { backgroundColor: colors.background } };

  return (
    <BiometricGate>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Protected guard={!user}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={needsSetup}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>
        <Stack.Protected guard={!!user && !needsSetup}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="profile" options={sheet({ title: t('ui.profile'), sheetAllowedDetents: [1], ...sheetBg })} />
          <Stack.Screen name="guide" options={sheet({ title: t('guide.title'), sheetAllowedDetents: [1], ...sheetBg })} />
          <Stack.Screen name="log-weight" options={sheet({ title: t('quickAdd.logWeight'), sheetAllowedDetents: [0.5], ...sheetBg })} />
          <Stack.Screen name="log-a1c" options={sheet({ title: t('quickAdd.logA1c'), sheetAllowedDetents: [0.5], ...sheetBg })} />
          <Stack.Screen name="add-reminder" options={sheet({ title: t('meds.add'), sheetAllowedDetents: [0.85, 1], ...sheetBg })} />
          <Stack.Screen name="add-event" options={sheet({ title: t('care.log'), sheetAllowedDetents: [0.75, 1], ...sheetBg })} />
        </Stack.Protected>
        {/* The option picker must exist during first-run setup too. Keep it LAST: the first registered screen is the start screen (country/city/doctor pickers live on onboarding). */}
        <Stack.Protected guard={!!user}>
          <Stack.Screen name="select" options={sheet({ title: '', sheetAllowedDetents: [0.7, 1], ...sheetBg })} />
        </Stack.Protected>
        {/* Training needs no account: always available, and kept last so it never becomes the start screen. */}
        <Stack.Screen name="training" />
      </Stack>
    </BiometricGate>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <ThemeModeProvider>
        <LanguageProvider>
          <ConfigProvider>
          <AuthProvider>
            <TrainingProgressProvider>
            <NavTheme>
              <ThemedStatusBar />
              <Routes />
            </NavTheme>
            </TrainingProgressProvider>
          </AuthProvider>
          </ConfigProvider>
        </LanguageProvider>
        </ThemeModeProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
