import React, { useCallback, useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/auth';
import { LanguageProvider, useI18n } from './src/i18n';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import HomeScreen from './src/screens/HomeScreen';
import MedicationScreen from './src/screens/MedicationScreen';
import WeightScreen from './src/screens/WeightScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import CareScreen from './src/screens/CareScreen';
import LearnScreen from './src/screens/LearnScreen';
import PharmacyScreen from './src/screens/PharmacyScreen';
import BiometricGate from './src/BiometricGate';
import FloatingTabBar, { TabDef } from './src/components/FloatingTabBar';
import QuickAddFab from './src/components/QuickAddFab';
import { useMessageNotifications } from './src/messageAlerts';
import { registerForPushNotificationsAsync } from './src/notifications';
import { api } from './src/api';
import { colors } from './src/ui';

type TabKey = 'home' | 'meds' | 'weight' | 'care' | 'learn' | 'pharmacy' | 'profile';

// Floating pill nav + raised quick-add button (no nav library needed for the slice).
function MainTabs() {
  const { t, isRTL } = useI18n();
  const [tab, setTab] = useState<TabKey>('home');
  const [homeRefreshKey, setHomeRefreshKey] = useState(0);

  const TABS: TabDef<TabKey>[] = [
    { key: 'home', label: t('tabs.home'), icon: '🏠' },
    { key: 'meds', label: t('tabs.semetra'), icon: '💊' },
    { key: 'weight', label: t('tabs.weight'), icon: '⚖️' },
    { key: 'care', label: t('tabs.care'), icon: '🩺' },
    { key: 'learn', label: t('tabs.learn'), icon: '🎓' },
    { key: 'pharmacy', label: t('tabs.pharmacy'), icon: '🏥' },
    { key: 'profile', label: t('tabs.profile'), icon: '👤' },
  ];

  const bumpHome = useCallback(() => setHomeRefreshKey((k) => k + 1), []);

  useMessageNotifications(true);

  // No-op in Expo Go (returns null there); registers a real deliverable
  // push token once running from an EAS dev/prod build.
  useEffect(() => {
    (async () => {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        try {
          await api('/me/push-token', { method: 'POST', body: JSON.stringify({ token }) });
        } catch {
          /* non-fatal: will retry next app launch */
        }
      }
    })();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {tab === 'home' ? (
          <HomeScreen refreshKey={homeRefreshKey} onNavigate={setTab} />
        ) : tab === 'meds' ? (
          <MedicationScreen />
        ) : tab === 'weight' ? (
          <WeightScreen />
        ) : tab === 'care' ? (
          <CareScreen />
        ) : tab === 'learn' ? (
          <LearnScreen />
        ) : tab === 'pharmacy' ? (
          <PharmacyScreen />
        ) : (
          <ProfileScreen />
        )}
      </View>

      <FloatingTabBar tabs={TABS} active={tab} onSelect={setTab} isRTL={isRTL} />

      <QuickAddFab onNavigate={(t) => setTab(t)} onLogged={bumpHome} />
    </View>
  );
}

// Minimal auth-driven routing without a nav library.
function Router() {
  const { user, loading } = useAuth();
  const { ready } = useI18n();
  const [showSignup, setShowSignup] = useState(false);

  if (loading || !ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.petra} size="large" />
      </View>
    );
  }

  if (!user) {
    return showSignup ? (
      <SignupScreen onGoLogin={() => setShowSignup(false)} />
    ) : (
      <LoginScreen onGoSignup={() => setShowSignup(true)} />
    );
  }

  if (!user.doctorId) {
    return <OnboardingScreen />;
  }

  return (
    <BiometricGate>
      <MainTabs />
    </BiometricGate>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Router />
      </AuthProvider>
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
});
