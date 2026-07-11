import React, { useState } from 'react';
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
import BiometricGate from './src/BiometricGate';
import { colors } from './src/ui';

type TabKey = 'home' | 'meds' | 'weight' | 'profile';

// Lightweight bottom-tab navigation (no nav library needed for the slice).
function MainTabs() {
  const { t, isRTL } = useI18n();
  const [tab, setTab] = useState<TabKey>('home');

  const TABS: { key: TabKey; label: string; icon: string }[] = [
    { key: 'home', label: t('tabs.home'), icon: '🏠' },
    { key: 'meds', label: t('tabs.semetra'), icon: '💊' },
    { key: 'weight', label: t('tabs.weight'), icon: '⚖️' },
    { key: 'profile', label: t('tabs.profile'), icon: '👤' },
  ];

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {tab === 'home' ? (
          <HomeScreen />
        ) : tab === 'meds' ? (
          <MedicationScreen />
        ) : tab === 'weight' ? (
          <WeightScreen />
        ) : (
          <ProfileScreen />
        )}
      </View>
      <View style={[styles.tabBar, isRTL && { flexDirection: 'row-reverse' }]}>
        {TABS.map((tb) => (
          <TouchableOpacity key={tb.key} style={styles.tab} onPress={() => setTab(tb.key)}>
            <Text style={styles.tabIcon}>{tb.icon}</Text>
            <Text style={[styles.tabLabel, tab === tb.key && styles.tabLabelActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
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
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#fff',
    paddingBottom: 24,
    paddingTop: 8,
  },
  tab: { flex: 1, alignItems: 'center' },
  tabIcon: { fontSize: 20 },
  tabLabel: { fontSize: 12, color: colors.muted, marginTop: 2 },
  tabLabelActive: { color: colors.petra, fontWeight: '700' },
});
