import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { useAuth } from '../auth';
import { useI18n } from '../i18n';
import { colors } from '../ui';
import {
  isBiometricAvailable,
  isBiometricEnabled,
  setBiometricEnabled,
  authenticate,
} from '../biometrics';

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const { t, isRTL } = useI18n();
  const align = { textAlign: isRTL ? 'right' : 'left' } as const;
  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioOn, setBioOn] = useState(false);

  useEffect(() => {
    (async () => {
      setBioAvailable(await isBiometricAvailable());
      setBioOn(await isBiometricEnabled());
    })();
  }, []);

  async function toggleBio(next: boolean) {
    if (next) {
      // Verify the user can actually pass the check before turning it on.
      const ok = await authenticate();
      if (!ok) return;
    }
    await setBiometricEnabled(next);
    setBioOn(next);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={[styles.hi, align]}>{t('home.hi')}, {user?.fullName} 👋</Text>
      <Text style={[styles.muted, align]}>{t('home.allSet')}</Text>

      <View style={styles.card}>
        <Text style={[styles.cardTitle, align]}>{t('home.yourCourse')}</Text>
        <Text style={[styles.item, align]}>{t('home.semetraCard')}</Text>
      </View>

      <View style={styles.card}>
        <Text style={[styles.cardTitle, align]}>{t('home.security')}</Text>
        <View style={[styles.row, isRTL && { flexDirection: 'row-reverse' }]}>
          <View style={{ flex: 1, paddingHorizontal: 12 }}>
            <Text style={[styles.rowLabel, align]}>{t('home.biometric')}</Text>
            <Text style={[styles.item, align]}>
              {bioAvailable ? t('home.biometricDesc') : t('home.noBiometric')}
            </Text>
          </View>
          <Switch
            value={bioOn}
            disabled={!bioAvailable}
            onValueChange={toggleBio}
            trackColor={{ true: colors.petra }}
          />
        </View>
      </View>

      <TouchableOpacity onPress={logout} style={{ marginTop: 24 }}>
        <Text style={styles.link}>{t('common.signOut')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 80, backgroundColor: colors.bg, flexGrow: 1 },
  hi: { fontSize: 24, fontWeight: '700', color: colors.text },
  muted: { color: colors.muted, marginBottom: 24 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 14 },
  cardTitle: { fontWeight: '600', color: colors.text, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowLabel: { fontWeight: '600', color: colors.text, marginBottom: 4 },
  item: { color: colors.muted, marginBottom: 6 },
  link: { color: colors.petra, fontWeight: '600', textAlign: 'center' },
});
