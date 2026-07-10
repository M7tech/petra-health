import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../auth';
import { Field, PrimaryButton, colors } from '../ui';

export default function LoginScreen({ onGoSignup }: { onGoSignup: () => void }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('patient@example.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await login(email.trim(), password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.logo}>
        <Text style={styles.logoText}>8</Text>
      </View>
      <Text style={styles.title}>Petra Health</Text>
      <Text style={styles.subtitle}>Track your Semetra titration & weight</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <PrimaryButton title="Sign in" onPress={submit} loading={busy} />

      <TouchableOpacity onPress={onGoSignup} style={{ marginTop: 18 }}>
        <Text style={styles.link}>New here? Create an account</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 80, backgroundColor: colors.bg, flexGrow: 1 },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.petra,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoText: { color: '#fff', fontSize: 24, fontWeight: '700' },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center', color: colors.text },
  subtitle: { textAlign: 'center', color: colors.muted, marginBottom: 28 },
  error: {
    backgroundColor: '#fef2f2',
    color: colors.danger,
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  link: { color: colors.petra, textAlign: 'center', fontWeight: '500' },
});
