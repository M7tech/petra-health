import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { useAuth } from '../auth';
import { colors } from '../ui';
import {
  isBiometricAvailable,
  isBiometricEnabled,
  setBiometricEnabled,
  authenticate,
} from '../biometrics';

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioOn, setBioOn] = useState(false);

  useEffect(() => {
    (async () => {
      setBioAvailable(await isBiometricAvailable());
      setBioOn(await isBiometricEnabled());
    })();
  }, []);

  async function toggleBio(next: boolean) {
    if (next) {
      // Verify the user can actually pass the check before turning it on.
      const ok = await authenticate();
      if (!ok) return;
    }
    await setBiometricEnabled(next);
    setBioOn(next);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.hi}>Hi, {user?.fullName} 👋</Text>
      <Text style={styles.muted}>You're all set up.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your Semetra course</Text>
        <Text style={styles.item}>
          Open the <Text style={{ fontWeight: '700' }}>Semetra</Text> tab below to start your
          titration and tick off each weekly dose. Log your weight in the{' '}
          <Text style={{ fontWeight: '700' }}>Weight</Text> tab.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Security</Text>
        <View style={styles.row}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.rowLabel}>Require biometric unlock</Text>
            <Text style={styles.item}>
              {bioAvailable
                ? 'Use Face ID / fingerprint each time you open the app.'
                : 'No enrolled biometrics on this device.'}
            </Text>
          </View>
          <Switch
            value={bioOn}
            disabled={!bioAvailable}
            onValueChange={toggleBio}
            trackColor={{ true: colors.petra }}
          />
        </View>
      </View>

      <TouchableOpacity onPress={logout} style={{ marginTop: 24 }}>
        <Text style={styles.link}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 80, backgroundColor: colors.bg, flexGrow: 1 },
  hi: { fontSize: 24, fontWeight: '700', color: colors.text },
  muted: { color: colors.muted, marginBottom: 24 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 14 },
  cardTitle: { fontWeight: '600', color: colors.text, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowLabel: { fontWeight: '600', color: colors.text, marginBottom: 4 },
  item: { color: colors.muted, marginBottom: 6 },
  link: { color: colors.petra, fontWeight: '600', textAlign: 'center' },
});
