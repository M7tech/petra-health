import Constants from 'expo-constants';
import React, { useEffect, useState } from 'react';
import { Alert, Image, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/auth';
import { useI18n } from '@/i18n';
import { notifyError } from '@/lib/errors';
import { spacing } from '@/theme';
import { AppText, Banner, Button, FieldRow, Screen, Section, haptics } from '@/components/ui';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { authenticate, clearCredentials, isBiometricAvailable, loadCredentials, saveCredentials } from '@/biometrics';

export default function LoginScreen() {
  const { login } = useAuth();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    loadCredentials().then((c) => setHasSaved(!!c));
  }, []);

  async function fingerprintSignIn() {
    const saved = await loadCredentials();
    if (!saved || !(await authenticate())) return;
    setBusy(true);
    setError(null);
    try {
      await login(saved.email, saved.password);
    } catch {
      // Password changed elsewhere — drop the stale saved login.
      await clearCredentials();
      setHasSaved(false);
      haptics.error();
      setError(t('ui.fpFailed'));
      setBusy(false);
    }
  }

  // Offered once, right after a successful password sign-in.
  async function offerFingerprint(e: string, p: string) {
    if ((await loadCredentials()) || !(await isBiometricAvailable())) return;
    Alert.alert(t('ui.fpOfferTitle'), t('ui.fpOfferBody'), [
      { text: t('ui.fpNotNow'), style: 'cancel' },
      { text: t('ui.fpYes'), onPress: () => saveCredentials(e, p) },
    ]);
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await login(email.trim(), password);
      offerFingerprint(email.trim(), password);
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
      {hasSaved ? <Button title={t('ui.fpSignIn')} icon="lock" variant="tinted" onPress={fingerprintSignIn} disabled={busy} /> : null}
      <Button title={t('auth.noAccount')} variant="plain" size="md" onPress={() => router.push('/signup')} />

      <View style={{ marginTop: 'auto', paddingTop: spacing.xl }}>
        <LanguageSwitcher />
        <AppText variant="footnote" tone="tertiary" style={{ textAlign: 'center', marginTop: spacing.lg }}>
          Sematra {Constants.expoConfig?.version ?? ''}
        </AppText>
      </View>
    </Screen>
  );
}
