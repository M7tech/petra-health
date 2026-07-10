import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { authenticate, isBiometricEnabled } from './biometrics';
import { colors } from './ui';

// Gates its children behind a device biometric check when the user has opted in.
export default function BiometricGate({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [locked, setLocked] = useState(false);

  const attempt = useCallback(async () => {
    const ok = await authenticate();
    if (ok) setLocked(false);
  }, []);

  useEffect(() => {
    (async () => {
      if (await isBiometricEnabled()) {
        setLocked(true);
        setChecking(false);
        await attempt(); // prompt immediately on open
      } else {
        setChecking(false);
      }
    })();
  }, [attempt]);

  if (checking) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.petra} size="large" />
      </View>
    );
  }

  if (locked) {
    return (
      <View style={styles.center}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>8</Text>
        </View>
        <Text style={styles.title}>Petra Health is locked</Text>
        <Text style={styles.subtitle}>Unlock with Face ID or fingerprint to continue.</Text>
        <TouchableOpacity style={styles.button} onPress={attempt}>
          <Text style={styles.buttonText}>Unlock</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    padding: 24,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.petra,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: { color: '#fff', fontSize: 24, fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  subtitle: { color: colors.muted, textAlign: 'center', marginTop: 6, marginBottom: 24 },
  button: { backgroundColor: colors.petra, borderRadius: 10, paddingVertical: 14, paddingHorizontal: 40 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
