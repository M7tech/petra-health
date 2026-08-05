import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import * as Location from 'expo-location';
import { api } from '../api';
import { useAuth } from '../auth';
import { useI18n } from '../i18n';
import { PrimaryButton, colors } from '../ui';
import WheelPicker from '../components/WheelPicker';
import type { City, Country, Doctor } from '../types';

export default function OnboardingScreen() {
  const { user, refresh } = useAuth();
  const { t } = useI18n();
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  const [countryId, setCountryId] = useState(user?.countryId ?? '');
  const [cityId, setCityId] = useState(user?.cityId ?? '');
  const [doctorId, setDoctorId] = useState(user?.doctorId ?? '');

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Load countries once; a rolling wheel always shows a value, so default
  // to the first option once loaded rather than an empty placeholder.
  useEffect(() => {
    api<Country[]>('/directory/countries')
      .then((list) => {
        setCountries(list);
        setCountryId((prev) => prev || list[0]?.id || '');
      })
      .catch(() => {});
  }, []);

  // When country changes, fetch its cities and default to the first one.
  useEffect(() => {
    setCities([]);
    if (!countryId) return;
    api<City[]>(`/directory/cities?countryId=${countryId}`)
      .then((list) => {
        setCities(list);
        setCityId((prev) => (list.some((c) => c.id === prev) ? prev : list[0]?.id ?? ''));
      })
      .catch(() => {});
  }, [countryId]);

  // When city changes, fetch doctors in that city and default to the first one.
  useEffect(() => {
    setDoctors([]);
    if (!cityId) return;
    api<Doctor[]>(`/directory/doctors?cityId=${cityId}`)
      .then((list) => {
        setDoctors(list);
        setDoctorId((prev) => (list.some((d) => d.id === prev) ? prev : list[0]?.id ?? ''));
      })
      .catch(() => {});
  }, [cityId]);

  // Best-effort: captures the device's real location once, during this
  // first-time setup. Never blocks onboarding — a denied/failed permission
  // just means this patient won't show up on the admin map.
  async function captureLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      await api('/profile/location', {
        method: 'PUT',
        body: JSON.stringify({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      });
    } catch {
      /* non-fatal */
    }
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await api('/profile', {
        method: 'PUT',
        body: JSON.stringify({ countryId, cityId, doctorId }),
      });
      await captureLocation();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t('onboarding.title')}</Text>
      <Text style={styles.subtitle}>{t('onboarding.subtitle')}</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      <Text style={styles.label}>{t('onboarding.country')}</Text>
      {countries.length === 0 ? (
        <Text style={styles.placeholder}>{t('onboarding.selectCountry')}</Text>
      ) : (
        <View style={styles.wheelWrap}>
          <WheelPicker
            options={countries.map((c) => ({ label: c.name, value: c.id }))}
            selectedValue={countryId}
            onChange={setCountryId}
          />
        </View>
      )}

      <Text style={styles.label}>{t('onboarding.city')}</Text>
      {cities.length === 0 ? (
        <Text style={styles.placeholder}>
          {countryId ? t('onboarding.selectCity') : t('onboarding.selectCountry')}
        </Text>
      ) : (
        <View style={styles.wheelWrap}>
          <WheelPicker
            options={cities.map((c) => ({ label: c.name, value: c.id }))}
            selectedValue={cityId}
            onChange={setCityId}
          />
        </View>
      )}

      <Text style={styles.label}>{t('onboarding.doctor')}</Text>
      {doctors.length === 0 ? (
        <Text style={styles.placeholder}>
          {cityId ? t('onboarding.selectDoctor') : t('onboarding.selectCity')}
        </Text>
      ) : (
        <View style={styles.wheelWrap}>
          <WheelPicker
            options={doctors.map((d) => ({
              label: d.specialty ? `${d.fullName} — ${d.specialty}` : d.fullName,
              value: d.id,
            }))}
            selectedValue={doctorId}
            onChange={setDoctorId}
          />
        </View>
      )}

      <Text style={styles.locationNote}>{t('onboarding.locationNote')}</Text>

      <View style={{ marginTop: 12 }}>
        <PrimaryButton
          title={t('onboarding.finish')}
          onPress={save}
          loading={busy}
          disabled={!countryId || !cityId || !doctorId}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 70, backgroundColor: colors.bg, flexGrow: 1 },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  subtitle: { color: colors.muted, marginBottom: 24, marginTop: 4 },
  label: { fontSize: 13, color: colors.muted, marginBottom: 6, fontWeight: '500' },
  wheelWrap: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    marginBottom: 16,
    backgroundColor: '#fff',
    overflow: 'hidden',
    paddingHorizontal: 8,
  },
  placeholder: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    marginBottom: 16,
    backgroundColor: '#f1f5f9',
    color: colors.muted,
    padding: 12,
    fontSize: 14,
  },
  locationNote: { fontSize: 12, color: colors.muted, marginTop: 16, lineHeight: 17 },
  error: {
    backgroundColor: '#fef2f2',
    color: colors.danger,
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
});
