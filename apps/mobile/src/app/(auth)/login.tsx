import React, { useState } from 'react';
import { Image, View } from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '@/auth';
import { useI18n } from '@/i18n';
import { notifyError } from '@/lib/errors';
import { spacing } from '@/theme';
import { AppText, Banner, Button, FieldRow, Screen, Section, haptics } from '@/components/ui';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function LoginScreen() {
  const { login } = useAuth();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await login(email.trim(), password);
    } catch (e) {
      haptics.error();
      setError(notifyError(e, t('ui.loginFailed')));
      setBusy(false);
    }
  }

  return (
    <Screen keyboard contentContainerStyle={{ paddingTop: spacing.xxxl + spacing.xl, flexGrow: 1 }}>
      <View style={{ alignItems: 'center', gap: spacing.sm }}>
        <Image source={require('../../../assets/logo-mark.png')} style={{ width: 72, height: 72, marginBottom: spacing.sm }} />
        <AppText variant="title1" style={{ textAlign: 'center' }}>
          {t('auth.welcome')}
        </AppText>
        <AppText variant="body" tone="secondary" style={{ textAlign: 'center' }}>
          {t('auth.subtitle')}
        </AppText>
      </View>

      {error ? <Banner message={error} /> : null}

      <Section>
        <FieldRow label={t('auth.email')} value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" autoComplete="email" returnKeyType="next" />
        <FieldRow label={t('auth.password')} value={password} onChangeText={setPassword} secureTextEntry textContentType="password" autoComplete="password" returnKeyType="go" onSubmitEditing={submit} />
      </Section>

      <Button title={t('auth.loginCta')} onPress={submit} loading={busy} disabled={!email || !password} />
      <Link href="/signup" asChild>
        <Button title={t('auth.noAccount')} variant="plain" size="md" />
      </Link>

      <View style={{ marginTop: 'auto', paddingTop: spacing.xl }}>
        <LanguageSwitcher />
      </View>
    </Screen>
  );
}
