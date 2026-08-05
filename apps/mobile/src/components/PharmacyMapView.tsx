import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors } from '../ui';
import type { Pharmacy } from '../types';

// Free OpenStreetMap + Leaflet map rendered inside a WebView — same
// approach as the web admin's map, so no Google Maps API key/billing is
// needed just to *show* pins. Tapping a pin still opens Google Maps for
// actual navigation (see PharmacyScreen's openInMaps).
export default function PharmacyMapView({
  pharmacies,
  userCoords,
}: {
  pharmacies: Pharmacy[];
  userCoords: { lat: number; lng: number } | null;
}) {
  const html = useMemo(() => buildHtml(pharmacies, userCoords), [pharmacies, userCoords]);

  return (
    <View style={styles.wrap}>
      <WebView
        source={{ html }}
        style={styles.webview}
        scrollEnabled={false}
        originWhitelist={['*']}
      />
    </View>
  );
}

function buildHtml(pharmacies: Pharmacy[], userCoords: { lat: number; lng: number } | null): string {
  const points = pharmacies.map((p) => ({
    lat: p.latitude,
    lng: p.longitude,
    name: p.name.replace(/"/g, '&quot;'),
    address: (p.address ?? '').replace(/"/g, '&quot;'),
  }));
  const center = userCoords ?? points[0] ?? { lat: 33.3152, lng: 44.3661 };

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const map = L.map('map', { zoomControl: false }).setView([${center.lat}, ${center.lng}], ${userCoords ? 13 : 6});
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const pharmacyIcon = L.divIcon({
      html: '<div style="font-size:22px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.4))">💊</div>',
      className: '',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
    const userIcon = L.divIcon({
      html: '<div style="width:14px;height:14px;border-radius:7px;background:#2563eb;border:2px solid #fff;box-shadow:0 0 0 2px #2563eb"></div>',
      className: '',
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });

    const bounds = [];
    ${userCoords ? `
    L.marker([${userCoords.lat}, ${userCoords.lng}], { icon: userIcon }).addTo(map);
    bounds.push([${userCoords.lat}, ${userCoords.lng}]);
    ` : ''}
    const points = ${JSON.stringify(points)};
    points.forEach(function(p) {
      L.marker([p.lat, p.lng], { icon: pharmacyIcon })
        .addTo(map)
        .bindPopup('<b>' + p.name + '</b>' + (p.address ? '<br>' + p.address : ''));
      bounds.push([p.lat, p.lng]);
    });
    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  </script>
</body>
</html>`;
}

const styles = StyleSheet.create({
  wrap: {
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  webview: { flex: 1 },
});
