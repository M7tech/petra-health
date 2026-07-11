import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { api } from '../api';
import { useAuth } from '../auth';
import { useI18n } from '../i18n';
import { PrimaryButton, colors } from '../ui';
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

  // Load countries once.
  useEffect(() => {
    api<Country[]>('/directory/countries').then(setCountries).catch(() => {});
  }, []);

  // When country changes, fetch its cities and reset downstream selections.
  useEffect(() => {
    setCityId('');
    setDoctorId('');
    setCities([]);
    setDoctors([]);
    if (!countryId) return;
    api<City[]>(`/directory/cities?countryId=${countryId}`).then(setCities).catch(() => {});
  }, [countryId]);

  // When city changes, fetch doctors in that city and reset doctor.
  useEffect(() => {
    setDoctorId('');
    setDoctors([]);
    if (!cityId) return;
    api<Doctor[]>(`/directory/doctors?cityId=${cityId}`).then(setDoctors).catch(() => {});
  }, [cityId]);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await api('/profile', {
        method: 'PUT',
        body: JSON.stringify({ countryId, cityId, doctorId }),
      });
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
      <View style={styles.pickerWrap}>
        <Picker selectedValue={countryId} onValueChange={(v) => setCountryId(String(v))}>
          <Picker.Item label={t('onboarding.selectCountry')} value="" />
          {countries.map((c) => (
            <Picker.Item key={c.id} label={c.name} value={c.id} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>{t('onboarding.city')}</Text>
      <View style={[styles.pickerWrap, !countryId && styles.disabled]}>
        <Picker
          enabled={!!countryId}
          selectedValue={cityId}
          onValueChange={(v) => setCityId(String(v))}
        >
          <Picker.Item label={countryId ? t('onboarding.selectCity') : t('onboarding.selectCountry')} value="" />
          {cities.map((c) => (
            <Picker.Item key={c.id} label={c.name} value={c.id} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>{t('onboarding.doctor')}</Text>
      <View style={[styles.pickerWrap, !cityId && styles.disabled]}>
        <Picker
          enabled={!!cityId}
          selectedValue={doctorId}
          onValueChange={(v) => setDoctorId(String(v))}
        >
          <Picker.Item label={cityId ? t('onboarding.selectDoctor') : t('onboarding.selectCity')} value="" />
          {doctors.map((d) => (
            <Picker.Item
              key={d.id}
              label={d.specialty ? `${d.fullName} — ${d.specialty}` : d.fullName}
              value={d.id}
            />
          ))}
        </Picker>
      </View>

      <View style={{ marginTop: 20 }}>
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
  pickerWrap: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    marginBottom: 16,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  disabled: { backgroundColor: '#f1f5f9' },
  error: {
    backgroundColor: '#fef2f2',
    color: colors.danger,
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
});
