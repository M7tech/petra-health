import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../auth';
import { Field, PrimaryButton, colors } from '../ui';

export default function SignupScreen({ onGoLogin }: { onGoLogin: () => void }) {
  const { signup } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await signup(email.trim(), password, fullName.trim());
      // On success the auth state flips and App routes to onboarding.
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Signup failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create account</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      <Field label="Full name" value={fullName} onChangeText={setFullName} />
      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <Field
        label="Password (min 8 chars)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <PrimaryButton title="Sign up" onPress={submit} loading={busy} />
      <TouchableOpacity onPress={onGoLogin} style={{ marginTop: 18 }}>
        <Text style={styles.link}>Already have an account? Sign in</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 80, backgroundColor: colors.bg, flexGrow: 1 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 24 },
  error: {
    backgroundColor: '#fef2f2',
    color: colors.danger,
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  link: { color: colors.petra, textAlign: 'center', fontWeight: '500' },
});
