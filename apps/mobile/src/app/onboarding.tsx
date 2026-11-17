import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import * as Location from 'expo-location';
import { api } from '@/api';
import { useAuth } from '@/auth';
import { useConfig } from '@/config';
import { useI18n } from '@/i18n';
import { notifyError } from '@/lib/errors';
import { spacing } from '@/theme';
import { AppText, Banner, Button, Icon, Screen, SelectRow, Section, haptics } from '@/components/ui';
import { useTheme } from '@/theme';
import type { City, Country, Doctor } from '@/types';

export default function OnboardingScreen() {
  const { user, refresh, logout } = useAuth();
  const { t } = useI18n();
  const { doctorFeatures } = useConfig();
  const { colors } = useTheme();
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [countryId, setCountryId] = useState(user?.countryId ?? '');
  const [cityId, setCityId] = useState(user?.cityId ?? '');
  const [doctorId, setDoctorId] = useState(user?.doctorId ?? '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Each list auto-selects when it has exactly one option, so a single-country
  // programme skips a pointless choice.
  useEffect(() => {
    api<Country[]>('/directory/countries')
      .then((list) => {
        setCountries(list);
        if (list.length === 1) setCountryId(list[0].id);
      })
      .catch((e) => setError(notifyError(e, t('learn.loadFailed'))));
  }, [t]);

  useEffect(() => {
    setCities([]);
    if (!countryId) return;
    api<City[]>(`/directory/cities?countryId=${countryId}`)
      .then((list) => {
        setCities(list);
        setCityId((prev) => (list.some((c) => c.id === prev) ? prev : list.length === 1 ? list[0].id : ''));
      })
      .catch(() => {});
  }, [countryId]);

  useEffect(() => {
    setDoctors([]);
    if (!cityId || !doctorFeatures) return;
    api<Doctor[]>(`/directory/doctors?cityId=${cityId}`)
      .then((list) => {
        setDoctors(list);
        setDoctorId((prev) => (list.some((d) => d.id === prev) ? prev : list.length === 1 ? list[0].id : ''));
      })
      .catch(() => {});
  }, [cityId, doctorFeatures]);

  // Best-effort: captures the device's real location once, during this
  // first-time setup. A denied permission never blocks onboarding.
  async function captureLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      await api('/profile/location', { method: 'PUT', body: JSON.stringify({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }) });
    } catch {
      /* non-fatal */
    }
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await api('/profile', { method: 'PUT', body: JSON.stringify(doctorFeatures ? { countryId, cityId, doctorId } : { countryId, cityId }) });
      await captureLocation();
      haptics.success();
      await refresh();
    } catch (e) {
      setError(notifyError(e, t('ui.couldNotSave')));
      haptics.error();
      setBusy(false);
    }
  }

  return (
    <Screen contentContainerStyle={{ paddingTop: spacing.xxxl + spacing.xl }}>
      <View style={{ gap: spacing.sm }}>
        <AppText variant="largeTitle">{t('onboarding.title')}</AppText>
        <AppText variant="body" tone="secondary">
          {doctorFeatures ? t('onboarding.subtitle') : t('ui.chooseCityOnly')}
        </AppText>
      </View>
      {error ? <Banner message={error} /> : null}
      <Section footer={t('onboarding.locationNote')}>
        <SelectRow icon="globe" title={t('onboarding.country')} placeholder={t('onboarding.selectCountry')} value={countryId || null} options={countries.map((c) => ({ value: c.id, label: c.name }))} onChange={setCountryId} />
        <SelectRow icon="pin" title={t('onboarding.city')} placeholder={t('onboarding.selectCity')} value={cityId || null} options={cities.map((c) => ({ value: c.id, label: c.name }))} onChange={setCityId} disabled={!countryId} />
        {doctorFeatures ? (
        <SelectRow
          icon="stethoscope"
          title={t('onboarding.doctor')}
          placeholder={t('onboarding.selectDoctor')}
          value={doctorId || null}
          options={doctors.map((d) => ({ value: d.id, label: d.fullName, subtitle: d.specialty ?? undefined }))}
          onChange={setDoctorId}
          disabled={!cityId}
        />
        ) : null}
      </Section>
      <Button title={t('onboarding.finish')} onPress={save} loading={busy} disabled={!countryId || !cityId || (doctorFeatures && !doctorId)} />
      <Button title={t('common.signOut')} variant="plain" size="md" onPress={logout} />
    </Screen>
  );
}
