import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/auth';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import HomeScreen from './src/screens/HomeScreen';
import { colors } from './src/ui';

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

  return <HomeScreen />;
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
});
