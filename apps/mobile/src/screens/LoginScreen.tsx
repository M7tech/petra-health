import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../auth';
import { useI18n } from '../i18n';
import { Field, PrimaryButton, colors } from '../ui';
import LanguageSwitcher from '../components/LanguageSwitcher';
import KeyboardScreen from '../components/KeyboardScreen';

export default function LoginScreen({ onGoSignup }: { onGoSignup: () => void }) {
  const { login } = useAuth();
  const { t } = useI18n();
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
    <KeyboardScreen contentContainerStyle={styles.container}>
      <Image source={require('../../assets/logo-mark.png')} style={styles.logo} />
      <Text style={styles.title}>{t('auth.welcome')}</Text>
      <Text style={styles.subtitle}>{t('auth.subtitle')}</Text>

      <View style={{ marginBottom: 24 }}>
        <LanguageSwitcher />
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <Field
        label={t('auth.email')}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <Field label={t('auth.password')} value={password} onChangeText={setPassword} secureTextEntry />
      <PrimaryButton title={t('auth.loginCta')} onPress={submit} loading={busy} />

      <TouchableOpacity onPress={onGoSignup} style={{ marginTop: 18 }}>
        <Text style={styles.link}>{t('auth.noAccount')}</Text>
      </TouchableOpacity>
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 80, backgroundColor: colors.bg, flexGrow: 1 },
  logo: {
    width: 64,
    height: 64,
    alignSelf: 'center',
    marginBottom: 12,
  },
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
