import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { api } from '../api';
import { useAuth } from '../auth';
import { useI18n } from '../i18n';
import { PrimaryButton, colors } from '../ui';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { CHRONIC_CONDITIONS, Gender, PatientProfile } from '../types';

const GENDERS: Gender[] = ['MALE', 'FEMALE', 'UNSPECIFIED'];

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
const BMI_COLOR: Record<string, string> = {
  underweight: '#0284c7',
  normal: '#16a34a',
  overweight: '#d97706',
  obese: '#dc2626',
};

export default function ProfileScreen() {
  const { t, isRTL } = useI18n();
  const { logout, refresh } = useAuth();
  const align = { textAlign: isRTL ? 'right' : 'left', writingDirection: isRTL ? 'rtl' : 'ltr' } as const;

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<Gender>('UNSPECIFIED');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [conditions, setConditions] = useState<string[]>([]);
  const [otherConditions, setOtherConditions] = useState('');

  useEffect(() => {
    api<PatientProfile>('/profile/me')
      .then((p) => {
        setEmail(p.email);
        setFullName(p.fullName ?? '');
        setPhone(p.phone ?? '');
        setBirthDate(p.birthDate ? p.birthDate.slice(0, 10) : '');
        setGender(p.gender ?? 'UNSPECIFIED');
        setHeight(p.heightCm ? String(p.heightCm) : '');
        setWeight(p.latestWeightKg ? String(p.latestWeightKg) : '');
        setConditions(p.chronicConditions ?? []);
        setOtherConditions(p.otherConditions ?? '');
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const bmi = useMemo(
    () => bmiOf(parseFloat(height.replace(',', '.')), parseFloat(weight.replace(',', '.'))),
    [height, weight],
  );
  const category = categoryOf(bmi);

  function toggleCondition(key: string) {
    setConditions((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  async function save() {
    setBusy(true);
    setMsg(null);
    setError(null);
    const body: Record<string, unknown> = {
      fullName: fullName.trim() || undefined,
      phone: phone.trim() || undefined,
      birthDate: /^\d{4}-\d{2}-\d{2}$/.test(birthDate) ? `${birthDate}T00:00:00.000Z` : undefined,
      gender,
      chronicConditions: conditions,
      otherConditions: otherConditions.trim() || undefined,
    };
    const h = parseFloat(height.replace(',', '.'));
    const w = parseFloat(weight.replace(',', '.'));
    if (!Number.isNaN(h)) body.heightCm = h;
    if (!Number.isNaN(w)) body.currentWeightKg = w;
    try {
      await api('/profile', { method: 'PUT', body: JSON.stringify(body) });
      await refresh();
      setMsg(t('profile.saved'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.petra} size="large" />
      </View>
    );
  }

  const labeled = (label: string, node: React.ReactNode) => (
    <View style={{ marginBottom: 14 }}>
      <Text style={[styles.label, align]}>{label}</Text>
      {node}
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <LanguageSwitcher />
      <Text style={[styles.title, align]}>{t('profile.title')}</Text>

      {error && <Text style={[styles.error, align]}>{error}</Text>}
      {msg && <Text style={[styles.ok, align]}>{msg}</Text>}

      {/* BMI summary */}
      <View style={styles.bmiCard}>
        <Text style={[styles.bmiLabel, align]}>{t('profile.bmi')}</Text>
        {bmi != null && category ? (
          <View style={[styles.bmiRow, isRTL && { flexDirection: 'row-reverse' }]}>
            <Text style={[styles.bmiValue, { color: BMI_COLOR[category] }]}>{bmi.toFixed(1)}</Text>
            <View style={[styles.badge, { backgroundColor: BMI_COLOR[category] }]}>
              <Text style={styles.badgeText}>{t(`bmi.${category}`)}</Text>
            </View>
          </View>
        ) : (
          <Text style={[styles.muted, align]}>{t('profile.enterBmiHint')}</Text>
        )}
      </View>

      {/* Personal info */}
      <View style={styles.card}>
        <Text style={[styles.cardTitle, align]}>{t('profile.personalInfo')}</Text>
        {labeled(
          t('profile.name'),
          <TextInput style={[styles.input, align]} value={fullName} onChangeText={setFullName} />,
        )}
        {labeled(
          t('profile.email'),
          <TextInput style={[styles.input, styles.disabled, align]} value={email} editable={false} />,
        )}
        {labeled(
          t('profile.phone'),
          <TextInput
            style={[styles.input, align]}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />,
        )}
        {labeled(
          `${t('profile.birthday')} (${t('profile.birthdayHint')})`,
          <TextInput
            style={[styles.input, align]}
            value={birthDate}
            onChangeText={setBirthDate}
            placeholder="1990-05-15"
            placeholderTextColor="#94a3b8"
          />,
        )}
        {labeled(
          t('profile.gender'),
          <View style={[styles.segment, isRTL && { flexDirection: 'row-reverse' }]}>
            {GENDERS.map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.segBtn, gender === g && styles.segBtnActive]}
                onPress={() => setGender(g)}
              >
                <Text style={[styles.segText, gender === g && styles.segTextActive]}>
                  {t(`gender.${g}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>,
        )}
        <View style={[styles.two, isRTL && { flexDirection: 'row-reverse' }]}>
          <View style={{ flex: 1 }}>
            {labeled(
              t('profile.height'),
              <TextInput
                style={[styles.input, align]}
                value={height}
                onChangeText={setHeight}
                keyboardType="decimal-pad"
                placeholder="168"
                placeholderTextColor="#94a3b8"
              />,
            )}
          </View>
          <View style={{ flex: 1 }}>
            {labeled(
              t('profile.weight'),
              <TextInput
                style={[styles.input, align]}
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
                placeholder="82.5"
                placeholderTextColor="#94a3b8"
              />,
            )}
          </View>
        </View>
      </View>

      {/* Health info */}
      <View style={styles.card}>
        <Text style={[styles.cardTitle, align]}>{t('profile.healthInfo')}</Text>
        <Text style={[styles.label, align]}>{t('profile.chronicConditions')}</Text>
        {CHRONIC_CONDITIONS.map((key) => {
          const on = conditions.includes(key);
          return (
            <TouchableOpacity
              key={key}
              style={[styles.condRow, isRTL && { flexDirection: 'row-reverse' }]}
              onPress={() => toggleCondition(key)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, on && styles.checkboxOn]}>
                {on && <Text style={styles.check}>✓</Text>}
              </View>
              <Text style={[styles.condLabel, align]}>{t(`conditions.${key}`)}</Text>
            </TouchableOpacity>
          );
        })}
        <View style={{ marginTop: 10 }}>
          {labeled(
            t('profile.otherConditions'),
            <TextInput
              style={[styles.input, align]}
              value={otherConditions}
              onChangeText={setOtherConditions}
            />,
          )}
        </View>
      </View>

      <PrimaryButton title={t('profile.save')} onPress={save} loading={busy} />

      <TouchableOpacity onPress={logout} style={{ marginTop: 20 }}>
        <Text style={styles.signOut}>{t('common.signOut')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  container: { padding: 20, paddingTop: 56, paddingBottom: 40, backgroundColor: colors.bg, flexGrow: 1 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginTop: 16, marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14 },
  cardTitle: { fontWeight: '700', color: colors.text, marginBottom: 12, fontSize: 15 },
  label: { fontSize: 13, color: colors.muted, marginBottom: 6, fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    backgroundColor: '#fff',
  },
  disabled: { backgroundColor: '#f1f5f9', color: colors.muted },
  two: { flexDirection: 'row', gap: 12 },
  segment: { flexDirection: 'row', gap: 8 },
  segBtn: { flex: 1, borderRadius: 10, paddingVertical: 10, backgroundColor: '#f1f5f9', alignItems: 'center' },
  segBtnActive: { backgroundColor: colors.petra },
  segText: { color: colors.muted, fontWeight: '600', fontSize: 13 },
  segTextActive: { color: '#fff' },
  condRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    marginHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.petra, borderColor: colors.petra },
  check: { color: '#fff', fontWeight: '900', fontSize: 14 },
  condLabel: { color: colors.text, fontSize: 15, flex: 1 },
  bmiCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14 },
  bmiLabel: { color: colors.muted, fontWeight: '600', marginBottom: 8 },
  bmiRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bmiValue: { fontSize: 34, fontWeight: '800' },
  badge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  muted: { color: colors.muted },
  error: { backgroundColor: '#fef2f2', color: colors.danger, padding: 10, borderRadius: 8, marginBottom: 12 },
  ok: { backgroundColor: '#f0fdf4', color: '#16a34a', padding: 10, borderRadius: 8, marginBottom: 12 },
  signOut: { color: colors.petra, fontWeight: '600', textAlign: 'center' },
});
