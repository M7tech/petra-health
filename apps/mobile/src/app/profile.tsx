import Constants from 'expo-constants';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Switch, View } from 'react-native';
import { api } from '@/api';
import { useAuth } from '@/auth';
import { useI18n } from '@/i18n';
import { isBiometricAvailable, isBiometricEnabled, setBiometricEnabled, authenticate, loadCredentials, clearCredentials } from '@/biometrics';
import { notifyError } from '@/lib/errors';
import { parseLocaleNumber } from '@/lib/numbers';
import { spacing, useTheme } from '@/theme';
import {
  AppText, Badge, BadgeTone, Banner, Button, DateRow, FieldRow, LoadingState, Row, Screen, SegmentedControl, SelectRow, Section, haptics,
} from '@/components/ui';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import SheetDone from '@/components/SheetDone';
import { CHRONIC_CONDITIONS, Gender, PatientProfile, Country, City } from '@/types';

const GENDERS: Gender[] = ['MALE', 'FEMALE', 'UNSPECIFIED'];
const BMI_TONE: Record<string, BadgeTone> = { underweight: 'info', normal: 'success', overweight: 'warning', obese: 'danger' };

function bmiOf(heightCm: number, weightKg: number): number | null {
  if (!heightCm || !weightKg) return null;
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}
function categoryOf(bmi: number | null): 'underweight' | 'normal' | 'overweight' | 'obese' | null {
  if (bmi == null) return null;
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obese';
}

export default function ProfileSheet() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const { logout, refresh } = useAuth();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [birth, setBirth] = useState(() => new Date(2000, 0, 1));
  const [gender, setGender] = useState<Gender>('UNSPECIFIED');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [conditions, setConditions] = useState<string[]>([]);
  const [otherConditions, setOtherConditions] = useState('');
  const [countryId, setCountryId] = useState('');
  const [cityId, setCityId] = useState('');
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioOn, setBioOn] = useState(false);
  const [fpSaved, setFpSaved] = useState(false);

  useEffect(() => {
    api<PatientProfile>('/profile/me')
      .then((p) => {
        setEmail(p.email);
        setFullName(p.fullName ?? '');
        setPhone(p.phone ?? '');
        if (p.birthDate) {
          const d = new Date(p.birthDate);
          setBirth(new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
        }
        setGender(p.gender ?? 'UNSPECIFIED');
        setHeight(p.heightCm ? String(p.heightCm) : '');
        setWeight(p.latestWeightKg ? String(p.latestWeightKg) : '');
        setConditions(p.chronicConditions ?? []);
        setOtherConditions(p.otherConditions ?? '');
        setCountryId(p.countryId ?? '');
        setCityId(p.cityId ?? '');
      })
      .catch((e) => setError(notifyError(e, t('learn.loadFailed'))))
      .finally(() => setLoading(false));
    api<Country[]>('/directory/countries').then(setCountries).catch(() => {});
    (async () => {
      setBioAvailable(await isBiometricAvailable());
      setBioOn(await isBiometricEnabled());
      setFpSaved(!!(await loadCredentials()));
    })();
  }, [t]);

  // Cities follow the chosen country; keep the current city if it's still valid.
  useEffect(() => {
    if (!countryId) return setCities([]);
    api<City[]>(`/directory/cities?countryId=${countryId}`)
      .then((list) => {
        setCities(list);
        setCityId((prev) => (list.some((c) => c.id === prev) ? prev : list[0]?.id ?? ''));
      })
      .catch(() => {});
  }, [countryId]);

  const bmi = useMemo(() => bmiOf(parseLocaleNumber(height), parseLocaleNumber(weight)), [height, weight]);
  const category = categoryOf(bmi);

  async function save() {
    setBusy(true);
    setSaved(false);
    setError(null);
    const body: Record<string, unknown> = {
      fullName: fullName.trim() || undefined,
      phone: phone.trim() || undefined,
      birthDate: new Date(Date.UTC(birth.getFullYear(), birth.getMonth(), birth.getDate())).toISOString(),
      gender,
      chronicConditions: conditions,
      otherConditions: otherConditions.trim() || undefined,
      countryId: countryId || undefined,
      cityId: cityId || undefined,
    };
    const h = parseLocaleNumber(height);
    const w = parseLocaleNumber(weight);
    if (!Number.isNaN(h)) body.heightCm = h;
    if (!Number.isNaN(w)) body.currentWeightKg = w;
    try {
      await api('/profile', { method: 'PUT', body: JSON.stringify(body) });
      await refresh();
      haptics.success();
      setSaved(true);
    } catch (e) {
      haptics.error();
      setError(notifyError(e, t('ui.couldNotSave')));
    } finally {
      setBusy(false);
    }
  }

  async function toggleBio(next: boolean) {
    if (next && !(await authenticate())) return;
    await setBiometricEnabled(next);
    setBioOn(next);
  }

  function confirmSignOut() {
    Alert.alert(t('common.signOut'), t('ui.signOutConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.signOut'), style: 'destructive', onPress: logout },
    ]);
  }

  if (loading) return <LoadingState />;

  return (
    <Screen keyboard>
      <SheetDone />
      {error ? <Banner message={error} /> : null}
      {saved ? <Banner tone="success" message={t('profile.saved')} /> : null}

      <Section title={t('profile.bmi')}>
        <Row
          icon="heart"
          iconColor={category ? colors[BMI_TONE[category] === 'info' ? 'info' : BMI_TONE[category] === 'success' ? 'success' : BMI_TONE[category] === 'warning' ? 'warning' : 'danger'] : colors.tint}
          title={bmi != null ? bmi.toFixed(1) : '—'}
          subtitle={bmi == null ? t('profile.enterBmiHint') : undefined}
          right={category ? <Badge tone={BMI_TONE[category]} label={t(`bmi.${category}`)} /> : undefined}
        />
      </Section>

      <Section title={t('profile.personalInfo')}>
        <FieldRow label={t('profile.name')} value={fullName} onChangeText={setFullName} textContentType="name" />
        <Row title={t('profile.email')} value={email} />
        <FieldRow label={t('profile.phone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" textContentType="telephoneNumber" />
        <SelectRow title={t('profile.country')} placeholder={t('onboarding.selectCountry')} value={countryId || null} options={countries.map((c) => ({ value: c.id, label: c.name }))} onChange={setCountryId} />
        <SelectRow title={t('profile.city')} placeholder={t('onboarding.selectCity')} value={cityId || null} options={cities.map((c) => ({ value: c.id, label: c.name }))} onChange={setCityId} disabled={!countryId} />
        <DateRow title={t('profile.birthday')} value={birth} onChange={setBirth} maximumDate={new Date()} />
        <FieldRow label={t('profile.height')} value={height} onChangeText={setHeight} keyboardType="decimal-pad" />
        <FieldRow label={t('profile.weight')} value={weight} onChangeText={setWeight} keyboardType="decimal-pad" />
      </Section>
      <View style={{ gap: spacing.sm }}>
        <AppText variant="footnote" tone="secondary" weight="600" style={{ textTransform: 'uppercase', letterSpacing: 0.3, paddingHorizontal: spacing.lg }}>
          {t('profile.gender')}
        </AppText>
        <SegmentedControl value={gender} onChange={setGender} options={GENDERS.map((g) => ({ key: g, label: t(`gender.${g}`) }))} />
      </View>

      <Section title={t('profile.chronicConditions')}>
        {CHRONIC_CONDITIONS.map((key) => (
          <Row
            key={key}
            title={t(`conditions.${key}`)}
            right={
              <Switch
                accessibilityLabel={t(`conditions.${key}`)}
                value={conditions.includes(key)}
                onValueChange={(on) => {
                  setConditions((p) => (on ? [...p, key] : p.filter((k) => k !== key)));
                }}
                trackColor={{ true: colors.tint }}
              />
            }
          />
        ))}
        <FieldRow label={t('profile.otherConditions')} value={otherConditions} onChangeText={setOtherConditions} multiline />
      </Section>

      <Section title={t('home.security')} footer={bioAvailable ? t('home.biometricDesc') : t('home.noBiometric')}>
        <Row icon="lock" iconColor={colors.violet} title={t('home.biometric')} right={<Switch accessibilityLabel={t('home.biometric')} value={bioOn} disabled={!bioAvailable} onValueChange={toggleBio} trackColor={{ true: colors.tint }} />} />
        {fpSaved ? (
          <Row icon="lock" iconColor={colors.violet} title={t('ui.fpSaved')} subtitle={t('ui.fpSavedHint')} right={<Switch accessibilityLabel={t('ui.fpSaved')} value={fpSaved} onValueChange={async (v) => { if (!v) { await clearCredentials(); setFpSaved(false); } }} trackColor={{ true: colors.tint }} />} />
        ) : null}
      </Section>

      <Section title={t('lang.language')}>
        <View style={{ padding: spacing.md }}>
          <LanguageSwitcher />
        </View>
      </Section>

      <Button title={t('profile.save')} onPress={save} loading={busy} />
      <Button title={t('common.signOut')} variant="destructive" icon="logout" onPress={confirmSignOut} />
      <AppText variant="footnote" tone="tertiary" style={{ textAlign: 'center' }}>
        Sematra {Constants.expoConfig?.version ?? ''}
      </AppText>
    </Screen>
  );
}
