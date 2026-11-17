import React, { useCallback, useEffect, useState } from 'react';
import { Linking, View } from 'react-native';
import * as Location from 'expo-location';
import { api } from '@/api';
import { useI18n } from '@/i18n';
import { useFocusLoad } from '@/lib/hooks';
import { notifyError } from '@/lib/errors';
import { spacing, useTheme } from '@/theme';
import { Badge, Banner, EmptyState, IconButton, LoadingState, Row, Screen, Section } from '@/components/ui';
import PharmacyMapView from '@/components/PharmacyMapView';
import type { Pharmacy } from '@/types';

// Haversine distance in km between two lat/lng points.
function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function PharmaciesScreen() {
  const { t } = useI18n();
  const { colors } = useTheme();
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setPharmacies(await api<Pharmacy[]>('/pharmacies'));
    } catch (e) {
      setError(notifyError(e, t('learn.loadFailed')));
    }
  }, [t]);
  const state = useFocusLoad(load);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return setLocationDenied(true);
      try {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      } catch {
        setLocationDenied(true);
      }
    })();
  }, []);

  if (state.loading) return <LoadingState />;

  const withDistance = pharmacies.map((p) => ({ ...p, distance: coords ? distanceKm(coords.lat, coords.lng, p.latitude, p.longitude) : null }));
  const sorted = coords ? [...withDistance].sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity)) : withDistance;

  // Google's universal maps link opens the Google Maps app, or the browser
  // as a fallback — no API key and no react-native-maps needed.
  const directions = (p: Pharmacy) => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${p.latitude},${p.longitude}`).catch(() => {});

  return (
    <Screen refreshing={state.refreshing} onRefresh={state.refresh}>
      {error ? <Banner message={error} onRetry={state.reload} retryLabel={t('ui.retry')} /> : null}
      {locationDenied ? <Banner tone="info" message={t('pharmacy.locationDenied')} /> : null}
      {sorted.length > 0 ? <PharmacyMapView pharmacies={sorted} userCoords={coords} /> : null}
      {sorted.length === 0 && !error ? (
        <EmptyState icon="map" title={t('pharmacy.none')} />
      ) : (
        <Section footer={t('pharmacy.subtitle')}>
          {sorted.map((p, i) => (
            <Row
              key={p.id}
              icon="pin"
              iconColor={i === 0 && coords ? colors.success : colors.tint}
              title={p.name}
              subtitle={[p.address, p.distance != null ? (p.distance < 1 ? `${Math.round(p.distance * 1000)} m` : `${p.distance.toFixed(1)} km`) : null].filter(Boolean).join(' · ')}
              right={
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                  {i === 0 && coords ? <Badge tone="success" label={t('pharmacy.nearest')} /> : null}
                  {p.phone ? <IconButton icon="phone" label={t('pharmacy.call')} onPress={() => Linking.openURL(`tel:${p.phone}`).catch(() => {})} size={40} /> : null}
                  <IconButton icon="directions" label={t('pharmacy.directions')} onPress={() => directions(p)} size={40} />
                </View>
              }
            />
          ))}
        </Section>
      )}
    </Screen>
  );
}
