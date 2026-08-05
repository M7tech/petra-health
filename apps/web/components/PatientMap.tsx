'use client';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import type { PatientLocation } from '@petra/shared';

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

export default function PatientMap({ locations }: { locations: PatientLocation[] }) {
  const center: [number, number] =
    locations.length > 0 ? [locations[0].latitude, locations[0].longitude] : [33.3152, 44.3661]; // Baghdad fallback

  return (
    <MapContainer center={center} zoom={locations.length ? 6 : 5} style={{ height: '600px', width: '100%' }}>
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
    </MapContainer>
  );
}
