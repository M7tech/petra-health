'use client';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import type { PatientLocation, Pharmacy } from '@petra/shared';

// Leaflet's default marker icons reference relative image paths that don't
// resolve under Next.js's bundler — point them at the CDN copies instead.
const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Emoji divIcon so pharmacies read as visually distinct from patient pins.
const pharmacyIcon = L.divIcon({
  html: '<div style="font-size:22px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.4))">💊</div>',
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

export default function PatientMap({
  locations,
  pharmacies = [],
}: {
  locations: PatientLocation[];
  pharmacies?: Pharmacy[];
}) {
  const first = locations[0] ?? pharmacies[0];
  const center: [number, number] = first ? [first.latitude, first.longitude] : [33.3152, 44.3661]; // Baghdad fallback

  return (
    <MapContainer center={center} zoom={first ? 6 : 5} style={{ height: '600px', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {locations.map((loc) => (
        <Marker key={loc.id} position={[loc.latitude, loc.longitude]} icon={markerIcon}>
          <Popup>
            <b>{loc.fullName}</b>
            <br />
            {[loc.cityName, loc.countryName].filter(Boolean).join(', ') || '—'}
            <br />
            <span style={{ color: '#94a3b8', fontSize: 12 }}>
              {new Date(loc.capturedAt).toLocaleDateString()}
            </span>
          </Popup>
        </Marker>
      ))}
      {pharmacies.map((p) => (
        <Marker key={p.id} position={[p.latitude, p.longitude]} icon={pharmacyIcon}>
          <Popup>
            <b>💊 {p.name}</b>
            {p.address && (
              <>
                <br />
                {p.address}
              </>
            )}
            {p.phone && (
              <>
                <br />
                {p.phone}
              </>
            )}
            {!p.active && (
              <>
                <br />
                <span style={{ color: '#dc2626', fontSize: 12 }}>Disabled — hidden from patients</span>
              </>
            )}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
