import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/auth';
import { useI18n } from '@/i18n';
import { notifyError } from '@/lib/errors';
import { spacing } from '@/theme';
import { AppText, Banner, Button, FieldRow, Screen, Section, haptics } from '@/components/ui';

export default function SignupScreen() {
  const { signup } = useAuth();
  const { t } = useI18n();
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
      // On success auth state flips and the root layout routes to onboarding.
    } catch (e) {
      haptics.error();
      setError(notifyError(e, t('ui.signupFailed')));
      setBusy(false);
    }
  }

  return (
    <Screen keyboard contentContainerStyle={{ paddingTop: spacing.xxxl + spacing.xl }}>
      <View style={{ gap: spacing.sm }}>
        <AppText variant="largeTitle">{t('auth.signupCta')}</AppText>
        <AppText variant="body" tone="secondary">
          {t('auth.subtitle')}
        </AppText>
      </View>
      {error ? <Banner message={error} /> : null}
      <Section>
        <FieldRow label={t('auth.fullName')} value={fullName} onChangeText={setFullName} textContentType="name" autoComplete="name" returnKeyType="next" />
        <FieldRow label={t('auth.email')} value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" autoComplete="email" returnKeyType="next" />
        <FieldRow label={t('auth.password')} value={password} onChangeText={setPassword} secureTextEntry textContentType="newPassword" autoComplete="new-password" returnKeyType="go" onSubmitEditing={submit} />
      </Section>
      <Button title={t('auth.signupCta')} onPress={submit} loading={busy} disabled={!fullName || !email || !password} />
      <Button title={t('auth.haveAccount')} variant="plain" size="md" onPress={() => router.back()} />
    </Screen>
  );
}
