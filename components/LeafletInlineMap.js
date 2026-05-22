'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Inline Leaflet map with:
 *  - Real OpenStreetMap tiles
 *  - Auto-geocoded markers for pickup / delivery
 *  - Click-to-pin: user clicks map → reverse-geocode → fills form
 *  - Pickup / Delivery toggle for pin target
 */
export default function LeafletInlineMap({
  pickupCity, deliveryCity, pickupFull, deliveryFull,
  onPinLocation,   // (target, addressParts) => void
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const pickupMarkerRef = useRef(null);
  const deliveryMarkerRef = useRef(null);
  const routeLineRef = useRef(null);
  const leafletRef = useRef(null);
  const pinTargetRef = useRef('pickup');

  const [pinTarget, setPinTarget] = useState('pickup');
  const [pinFeedback, setPinFeedback] = useState('');

  // Keep the ref in sync with state so the map click handler sees the latest
  useEffect(() => { pinTargetRef.current = pinTarget; }, [pinTarget]);

  // Stable reverse-geocode helper
  const reverseGeocode = useCallback(async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`
      );
      return await res.json();
    } catch {
      return null;
    }
  }, []);

  // ── Initialise map once ──
  useEffect(() => {
    if (!containerRef.current) return;

    const init = async () => {
      try {
        const L = (await import('leaflet')).default;
        leafletRef.current = L;

        // Fix webpack icon paths
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        if (mapRef.current) return;

        const map = L.map(containerRef.current, {
          zoomControl: false,
          attributionControl: false,
        }).setView([14.82, 120.28], 12);

        mapRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap',
          maxZoom: 18,
        }).addTo(map);

        L.control.zoom({ position: 'topright' }).addTo(map);
        L.control.attribution({ position: 'bottomright', prefix: false }).addTo(map);

        // ── Click-to-pin ──
        map.on('click', async (e) => {
          const { lat, lng } = e.latlng;
          const target = pinTargetRef.current;
          setPinFeedback('Detecting address…');

          const data = await reverseGeocode(lat, lng);
          if (data && onPinLocation) {
            const addr = data.address || {};
            const street =
              addr.road || addr.amenity || addr.tourism || addr.building ||
              addr.office || addr.shop || addr.house_number ||
              `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
            const barangay = addr.suburb || addr.neighbourhood || addr.village || '';
            const city = addr.city || addr.town || addr.municipality || addr.county || '';

            onPinLocation(target, { street, barangay, city });
            setPinFeedback(`${target === 'pickup' ? 'Pickup' : 'Drop-off'} pinned to ${street}`);
          } else {
            setPinFeedback('Could not detect address. Try another spot.');
          }

          // Clear feedback after 3s
          setTimeout(() => setPinFeedback(''), 3000);
        });
      } catch (err) {
        console.error('Leaflet inline map error:', err);
      }
    };

    init();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        pickupMarkerRef.current = null;
        deliveryMarkerRef.current = null;
        routeLineRef.current = null;
        leafletRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Update markers when addresses change ──
  useEffect(() => {
    if (!mapRef.current || !leafletRef.current) return;

    const updateMarkers = async () => {
      try {
        const L = leafletRef.current;
        const map = mapRef.current;
        if (!map || !L) return;

        const greenIcon = L.divIcon({
          className: '',
          html: `<div style="width:20px;height:20px;border-radius:50%;background:#00522c;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
          iconSize: [20, 20], iconAnchor: [10, 10],
        });

        const redIcon = L.divIcon({
          className: '',
          html: `<div style="width:20px;height:20px;border-radius:50%;background:#ba1a1a;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
          iconSize: [20, 20], iconAnchor: [10, 10],
        });

        const geocode = async (query) => {
          if (!query) return null;
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
            );
            const data = await res.json();
            if (data.length > 0) return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
          } catch { /* ignore */ }
          return null;
        };

        const bounds = [];

        // Pickup
        if (pickupFull) {
          const coords = await geocode(pickupFull);
          if (coords) {
            if (pickupMarkerRef.current) {
              pickupMarkerRef.current.setLatLng(coords);
            } else {
              pickupMarkerRef.current = L.marker(coords, { icon: greenIcon })
                .bindTooltip(pickupCity || 'Pickup', {
                  permanent: true, direction: 'top', offset: [0, -12],
                  className: 'leaflet-tooltip-custom',
                }).addTo(map);
            }
            pickupMarkerRef.current.setTooltipContent(pickupCity || 'Pickup');
            bounds.push(coords);
          }
        } else if (pickupMarkerRef.current) {
          map.removeLayer(pickupMarkerRef.current);
          pickupMarkerRef.current = null;
        }

        // Delivery
        if (deliveryFull) {
          const coords = await geocode(deliveryFull);
          if (coords) {
            if (deliveryMarkerRef.current) {
              deliveryMarkerRef.current.setLatLng(coords);
            } else {
              deliveryMarkerRef.current = L.marker(coords, { icon: redIcon })
                .bindTooltip(deliveryCity || 'Drop-off', {
                  permanent: true, direction: 'top', offset: [0, -12],
                  className: 'leaflet-tooltip-custom',
                }).addTo(map);
            }
            deliveryMarkerRef.current.setTooltipContent(deliveryCity || 'Drop-off');
            bounds.push(coords);
          }
        } else if (deliveryMarkerRef.current) {
          map.removeLayer(deliveryMarkerRef.current);
          deliveryMarkerRef.current = null;
        }

        // Route polyline
        if (routeLineRef.current) { map.removeLayer(routeLineRef.current); routeLineRef.current = null; }
        if (bounds.length === 2) {
          routeLineRef.current = L.polyline(bounds, {
            color: '#00522c', weight: 3, dashArray: '8 6', opacity: 0.7,
          }).addTo(map);
        }

        // Fit bounds
        if (bounds.length === 2) map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
        else if (bounds.length === 1) map.setView(bounds[0], 14);
      } catch (err) {
        console.error('Marker update error:', err);
      }
    };

    const timer = setTimeout(updateMarkers, 800);
    return () => clearTimeout(timer);
  }, [pickupFull, deliveryFull, pickupCity, deliveryCity]);

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>{`
        .leaflet-tooltip-custom {
          background: #ffffff !important;
          border: 1px solid #bec9be !important;
          border-radius: 6px !important;
          padding: 3px 8px !important;
          font-family: 'Inter', sans-serif !important;
          font-size: 0.72rem !important;
          font-weight: 700 !important;
          color: #181d19 !important;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1) !important;
        }
        .leaflet-tooltip-custom::before {
          border-top-color: #bec9be !important;
        }
      `}</style>

      <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 'inherit' }}>
        {/* Map container */}
        <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: 'inherit' }} />

        {/* Pin target toggle — overlaid on the map */}
        <div style={{
          position: 'absolute', top: '12px', left: '12px', zIndex: 1000,
          display: 'flex', flexDirection: 'column', gap: '6px',
        }}>
          <div style={{
            background: '#fff', borderRadius: '10px', padding: '6px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
            display: 'flex', gap: '4px',
            fontFamily: 'Inter, sans-serif',
          }}>
            <button
              onClick={() => setPinTarget('pickup')}
              style={{
                padding: '6px 14px', borderRadius: '7px', border: 'none',
                fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: pinTarget === 'pickup' ? '#00522c' : 'transparent',
                color: pinTarget === 'pickup' ? '#fff' : '#3f4941',
              }}
            >
              🟢 Pin Pickup
            </button>
            <button
              onClick={() => setPinTarget('delivery')}
              style={{
                padding: '6px 14px', borderRadius: '7px', border: 'none',
                fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: pinTarget === 'delivery' ? '#ba1a1a' : 'transparent',
                color: pinTarget === 'delivery' ? '#fff' : '#3f4941',
              }}
            >
              📍 Pin Drop-off
            </button>
          </div>

          {/* Hint text */}
          <div style={{
            background: 'rgba(255,255,255,0.92)', borderRadius: '8px',
            padding: '5px 10px', fontSize: '0.7rem', fontWeight: 600,
            color: '#5f5e5e', fontFamily: 'Inter, sans-serif',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            maxWidth: '220px',
          }}>
            🖱️ Click the map to pin {pinTarget === 'pickup' ? 'pickup' : 'drop-off'} location
          </div>

          {/* Feedback after pin */}
          {pinFeedback && (
            <div style={{
              background: '#00522c', color: '#fff', borderRadius: '8px',
              padding: '6px 12px', fontSize: '0.72rem', fontWeight: 600,
              fontFamily: 'Inter, sans-serif', maxWidth: '260px',
              boxShadow: '0 2px 8px rgba(0,82,44,0.3)',
              animation: 'fadeSlideIn 0.2s ease',
            }}>
              ✓ {pinFeedback}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
