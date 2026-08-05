import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native';
import * as Location from 'expo-location';
import { api } from '../api';
import { useI18n } from '../i18n';
import { colors } from '../ui';
import type { Pharmacy } from '../types';

// Haversine distance in km between two lat/lng points.
function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function PharmacyScreen() {
  const { t, isRTL } = useI18n();
  const align = { textAlign: isRTL ? 'right' : 'left' } as const;
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setPharmacies(await api<Pharmacy[]>('/pharmacies'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationDenied(true);
        return;
      }
      try {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      } catch {
        setLocationDenied(true);
      }
    })();
  }, [load]);

  const withDistance = pharmacies.map((p) => ({
    ...p,
    distance: coords ? distanceKm(coords.lat, coords.lng, p.latitude, p.longitude) : null,
  }));
  const sorted = coords
    ? [...withDistance].sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
    : withDistance;

  function call(phone: string) {
    Linking.openURL(`tel:${phone}`).catch(() => {});
  }

  function openInMaps(p: Pharmacy) {
    Linking.openURL(`https://www.openstreetmap.org/?mlat=${p.latitude}&mlon=${p.longitude}#map=17/${p.latitude}/${p.longitude}`).catch(() => {});
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.petra} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
    >
      <Text style={[styles.title, align]}>{t('pharmacy.title')}</Text>
      <Text style={[styles.subtitle, align]}>{t('pharmacy.subtitle')}</Text>

      {error && <Text style={[styles.error, align]}>{error}</Text>}
      {locationDenied && (
        <Text style={[styles.note, align]}>{t('pharmacy.locationDenied')}</Text>
      )}

      {sorted.length === 0 ? (
        <Text style={[styles.muted, align]}>{t('pharmacy.none')}</Text>
      ) : (
        sorted.map((p) => (
          <View key={p.id} style={styles.card}>
            <View style={[styles.row, isRTL && { flexDirection: 'row-reverse' }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, align]}>💊 {p.name}</Text>
                {p.address && <Text style={[styles.address, align]}>{p.address}</Text>}
              </View>
              {p.distance != null && (
                <View style={styles.distanceBadge}>
                  <Text style={styles.distanceText}>
                    {p.distance < 1 ? `${Math.round(p.distance * 1000)} m` : `${p.distance.toFixed(1)} km`}
                  </Text>
                </View>
              )}
            </View>
            <View style={[styles.actions, isRTL && { flexDirection: 'row-reverse' }]}>
              {p.phone && (
                <TouchableOpacity style={styles.actionBtn} onPress={() => call(p.phone!)}>
                  <Text style={styles.actionText}>📞 {t('pharmacy.call')}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.actionBtn} onPress={() => openInMaps(p)}>
                <Text style={styles.actionText}>🗺️ {t('pharmacy.directions')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  container: { padding: 20, paddingTop: 60, paddingBottom: 140, backgroundColor: colors.bg, flexGrow: 1 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text },
  subtitle: { color: colors.muted, marginBottom: 16, marginTop: 2 },
  muted: { color: colors.muted },
  note: {
    backgroundColor: '#fffbeb',
    color: '#92400e',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 13,
  },
  error: {
    backgroundColor: '#fef2f2',
    color: colors.danger,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  name: { fontWeight: '700', color: colors.text, fontSize: 15 },
  address: { color: colors.muted, fontSize: 13, marginTop: 2 },
  distanceBadge: {
    backgroundColor: '#f1e2ea',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  distanceText: { color: colors.petra, fontWeight: '700', fontSize: 12 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionBtn: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
  },
  actionText: { color: colors.text, fontWeight: '600', fontSize: 13 },
});
