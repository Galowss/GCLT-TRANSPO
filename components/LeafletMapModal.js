'use client';

import { useEffect, useRef, useState } from 'react';

// This component is ONLY rendered client-side (never on the server).
// It safely imports leaflet after mounting.
export default function LeafletMapModal({ target, onApply, onClose }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [address, setAddress] = useState('');
  const [mapError, setMapError] = useState(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    let map;

    const init = async () => {
      try {
        // Import leaflet only on the client
        const L = (await import('leaflet')).default;

        // Fix default marker icon paths broken by webpack
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        if (mapInstanceRef.current) return; // already initialized

        map = L.map(mapContainerRef.current).setView([14.82, 120.28], 13);
        mapInstanceRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);

        map.on('click', async (e) => {
          const { lat, lng } = e.latlng;
          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          } else {
            markerRef.current = L.marker([lat, lng]).addTo(map);
          }
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
            );
            const data = await res.json();
            setAddress(data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
          } catch {
            setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
          }
        });
      } catch (err) {
        console.error('Leaflet init error:', err);
        setMapError('Map failed to load. Please enter your address manually below.');
      }
    };

    init();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  const handleApply = () => {
    if (!address.trim()) return;
    onApply(address);
  };

  const isDrop = target === 'delivery';

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 10000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff', borderRadius: '16px',
          width: '92%', maxWidth: '680px',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 20px', borderBottom: '1px solid #bec9be',
        }}>
          <h3 style={{ margin: 0, fontFamily: 'Manrope, sans-serif', fontSize: '1rem', fontWeight: 700, color: '#181d19', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.1rem' }}>{isDrop ? '📍' : '🟢'}</span>
            Pin {isDrop ? 'Delivery Destination' : 'Pickup Location'}
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#6f7a70', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
          >
            ✕
          </button>
        </div>

        {/* Hint */}
        <div style={{ padding: '10px 20px 4px' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', color: '#5f5e5e', margin: 0 }}>
            🖱️ Click anywhere on the map — the address fills in automatically.
          </p>
        </div>

        {/* Map */}
        {mapError ? (
          <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f5ee', color: '#5f5e5e', fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', padding: '24px', textAlign: 'center' }}>
            {mapError}
          </div>
        ) : (
          <>
            {/* Leaflet CSS — inject once */}
            <link
              rel="stylesheet"
              href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
            />
            <div
              ref={mapContainerRef}
              style={{ width: '100%', height: '320px' }}
            />
          </>
        )}

        {/* Address input + apply */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid #bec9be', display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
            placeholder="Detected address appears here, or type manually…"
            style={{
              flex: 1, height: '42px', padding: '0 14px',
              border: '1.5px solid #bec9be', borderRadius: '8px',
              fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: '#181d19',
              background: '#f6fbf3', outline: 'none',
            }}
          />
          <button
            onClick={handleApply}
            disabled={!address.trim()}
            style={{
              height: '42px', padding: '0 20px',
              background: address.trim() ? '#00522c' : '#bec9be',
              color: '#fff', border: 'none', borderRadius: '8px',
              fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', fontWeight: 700,
              cursor: address.trim() ? 'pointer' : 'not-allowed',
              whiteSpace: 'nowrap',
            }}
          >
            Use This Location
          </button>
        </div>
      </div>
    </div>
  );
}
