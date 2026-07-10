import React, { useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/auth';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import HomeScreen from './src/screens/HomeScreen';
import MedicationScreen from './src/screens/MedicationScreen';
import WeightScreen from './src/screens/WeightScreen';
import { colors } from './src/ui';

// Lightweight bottom-tab navigation (no nav library needed for the slice).
function MainTabs() {
  const [tab, setTab] = useState<'home' | 'meds' | 'weight'>('home');
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {tab === 'home' ? <HomeScreen /> : tab === 'meds' ? <MedicationScreen /> : <WeightScreen />}
      </View>
      <View style={styles.tabBar}>
        {(
          [
            { key: 'home', label: 'Home', icon: '🏠' },
            { key: 'meds', label: 'Semetra', icon: '💊' },
            { key: 'weight', label: 'Weight', icon: '⚖️' },
          ] as const
        ).map((t) => (
          <TouchableOpacity key={t.key} style={styles.tab} onPress={() => setTab(t.key)}>
            <Text style={styles.tabIcon}>{t.icon}</Text>
            <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// Minimal auth-driven routing without a nav library:
//  - not authed  -> Login / Signup
//  - authed, no doctor selected -> Onboarding (hierarchical dropdowns)
//  - authed, onboarded -> Home
function Router() {
  const { user, loading } = useAuth();
  const [showSignup, setShowSignup] = useState(false);

  if (loading) {
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

  return <MainTabs />;
}

export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Router />
    </AuthProvider>
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
