import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
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
import BiometricGate from './src/BiometricGate';
import FloatingTabBar, { TabDef } from './src/components/FloatingTabBar';
import QuickActionSheet from './src/components/QuickActionSheet';
import { useMessageNotifications } from './src/messageAlerts';
import { registerForPushNotificationsAsync } from './src/notifications';
import { api } from './src/api';
import { colors } from './src/ui';

type TabKey = 'home' | 'meds' | 'weight' | 'care' | 'profile';

// Floating pill nav + raised quick-add button (no nav library needed for the slice).
function MainTabs() {
  const { t, isRTL } = useI18n();
  const [tab, setTab] = useState<TabKey>('home');
  const [homeRefreshKey, setHomeRefreshKey] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);

  const TABS: TabDef<TabKey>[] = [
    { key: 'home', label: t('tabs.home'), icon: '🏠' },
    { key: 'meds', label: t('tabs.semetra'), icon: '💊' },
    { key: 'weight', label: t('tabs.weight'), icon: '⚖️' },
    { key: 'care', label: t('tabs.care'), icon: '🩺' },
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
        ) : (
          <ProfileScreen />
        )}
      </View>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setSheetOpen(true)}
        activeOpacity={0.85}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      <FloatingTabBar tabs={TABS} active={tab} onSelect={setTab} isRTL={isRTL} />

      <QuickActionSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onNavigate={(t) => setTab(t)}
        onLogged={bumpHome}
      />
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
  fab: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 78,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.petra,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.petra,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 12,
    borderWidth: 4,
    borderColor: colors.bg,
  },
  fabIcon: { color: '#fff', fontSize: 28, fontWeight: '700', marginTop: -2 },
});
