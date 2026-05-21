'use client';

import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useRealtimeFirestore } from '@/lib/useRealtimeFirestore';
import { subscribeToFleetTypes, addBooking, addNotification } from '@/lib/firebaseService';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/Toast';
import { MapPin, Truck, Info, Package, Route, Navigation, Map, X, ArrowLeft, ArrowRight, Check, Star, Scale, Ruler, Fuel, Settings } from 'lucide-react';
import styles from './book.module.css';

function determineRouteType(weight, cargoSize) {
  const w = Number(weight) || 0;
  const sizeStr = (cargoSize || '').toLowerCase();
  const isHeavy = w >= 3000;
  const isLarge = sizeStr.includes('40ft') || sizeStr.includes('container') ||
    sizeStr.includes('oversiz') || sizeStr.includes('heavy') ||
    sizeStr.includes('pallet') || sizeStr.includes('full load');
  if (isHeavy || isLarge) {
    return { route: 'Old Road', reason: 'Heavy/large cargo routed via Old Road for safety and load compliance.' };
  }
  return { route: 'Expressway', reason: 'Light/standard cargo routed via Expressway for faster delivery.' };
}

const BOOKING_TYPES = [
  { value: 'standard', label: 'Standard Delivery' },
  { value: 'express', label: 'Express Delivery' },
  { value: 'port_transfer', label: 'Port Transfer' },
  { value: 'warehouse', label: 'Warehouse to Warehouse' },
];

const CARGO_TYPES = [
  { value: 'general', label: 'General', icon: '📦' },
  { value: 'refrigerated', label: 'Refrigerated', icon: '❄️' },
  { value: 'hazardous', label: 'Hazardous', icon: '⚠️' },
  { value: 'oversized', label: 'Oversized', icon: '🏗️' },
];

const FLEET_CATALOG = [
  { key: 'Small Trucks', label: 'Small Trucks', description: 'Ideal for light cargo up to 2 tons', placeholder: { name: 'Small Truck (e.g. L300, AUV)', capacity: 'Up to 2 tons', icon: '🛻' } },
  { key: 'Medium Trucks', label: 'Medium Trucks', description: 'For moderate loads, 2–5 tons', placeholder: { name: 'Medium Truck (e.g. Elf, Canter)', capacity: '2 – 5 tons', icon: '🚛' } },
  { key: 'Large Trucks', label: 'Large Trucks', description: 'Heavy-duty freight, 5–15 tons', placeholder: { name: 'Large Truck (e.g. 10-Wheeler)', capacity: '5 – 15 tons', icon: '🚚' } },
  { key: 'Specialized', label: 'Specialized Vehicles', description: 'Refrigerated, flatbed, tanker, etc.', placeholder: { name: 'Specialized Vehicle', capacity: 'Varies', icon: '🏗️' } },
];

export default function BookTransport() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const { data: fleetTypes, loading: fleetLoading } = useRealtimeFirestore(
    (cb) => subscribeToFleetTypes(cb)
  );

  // === Wizard State ===
  const [step, setStep] = useState(1);
  const [selectedFleet, setSelectedFleet] = useState('');
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locatingTarget, setLocatingTarget] = useState('pickup');
  const [cargoType, setCargoType] = useState('general');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [fleetFilter, setFleetFilter] = useState('all');

  const [formData, setFormData] = useState({
    bookingType: 'standard',
    pickupStreet: '', pickupBarangay: '', pickupCity: '',
    deliveryStreet: '', deliveryBarangay: '', deliveryCity: '',
    date: '', time: '', weight: '',
    cargoLength: '', cargoWidth: '', cargoHeight: '',
    notes: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const pickupFull = [formData.pickupStreet, formData.pickupBarangay, formData.pickupCity].filter(Boolean).join(', ');
  const deliveryFull = [formData.deliveryStreet, formData.deliveryBarangay, formData.deliveryCity].filter(Boolean).join(', ');
  const cargoSizeFull = (formData.cargoLength || formData.cargoWidth || formData.cargoHeight)
    ? `${formData.cargoLength || 0}m × ${formData.cargoWidth || 0}m × ${formData.cargoHeight || 0}m`
    : '';

  const routeInfo = useMemo(
    () => determineRouteType(formData.weight, cargoSizeFull),
    [formData.weight, cargoSizeFull]
  );

  // Fleet categorization
  const fleetByCategory = useMemo(() => {
    if (!fleetTypes) return {};
    const available = fleetTypes.filter(f => f.available !== false);
    return available.reduce((acc, fleet) => {
      const cat = fleet.category || 'Small Trucks';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(fleet);
      return acc;
    }, {});
  }, [fleetTypes]);

  const allFleets = useMemo(() => {
    if (!fleetTypes) return [];
    return fleetTypes.filter(f => f.available !== false);
  }, [fleetTypes]);

  const filteredFleets = useMemo(() => {
    if (fleetFilter === 'all') return allFleets;
    return allFleets.filter(f => (f.category || 'Small Trucks') === fleetFilter);
  }, [allFleets, fleetFilter]);

  // === Geolocation ===
  const handleUseLocation = (target = 'pickup') => {
    if (!navigator.geolocation) {
      addToast('Geolocation is not supported by your browser.', 'error');
      return;
    }
    setLocatingTarget(target);
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`);
          const data = await res.json();
          const addr = data.address || {};
          const landmark = addr.amenity || addr.tourism || addr.building || addr.office || addr.shop || addr.road || addr.house_number || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
          if (target === 'delivery') {
            setFormData(prev => ({ ...prev, deliveryStreet: landmark, deliveryBarangay: addr.suburb || addr.neighbourhood || addr.village || '', deliveryCity: addr.city || addr.town || addr.municipality || addr.county || '' }));
          } else {
            setFormData(prev => ({ ...prev, pickupStreet: landmark, pickupBarangay: addr.suburb || addr.neighbourhood || addr.village || '', pickupCity: addr.city || addr.town || addr.municipality || addr.county || '' }));
          }
          addToast('Location detected! Nearest landmark filled in.', 'success');
        } catch {
          addToast('Could not determine your address. Please enter manually.', 'error');
        }
        setLocating(false);
      },
      () => { addToast('Location access denied.', 'error'); setLocating(false); },
      { timeout: 10000 }
    );
  };

  // === Leaflet Map (Step 1 side panel) ===
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const pickupMarkerRef = useRef(null);
  const deliveryMarkerRef = useRef(null);

  useEffect(() => {
    if (step !== 1) return;
    const loadLeaflet = async () => {
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
      if (!window.L) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
      setTimeout(() => {
        if (!mapRef.current || mapInstanceRef.current) return;
        const L = window.L;
        const map = L.map(mapRef.current).setView([14.82, 120.28], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        mapInstanceRef.current = map;

        map.on('click', async (e) => {
          const { lat, lng } = e.latlng;
          // Determine which marker to place based on what's missing
          const isPickupSet = pickupMarkerRef.current !== null;
          const target = isPickupSet ? 'delivery' : 'pickup';

          const markerColor = target === 'pickup' ? 'green' : 'red';
          const icon = L.divIcon({
            className: '',
            html: `<div style="width:24px;height:24px;border-radius:50%;background:${markerColor === 'green' ? '#006d37' : '#D32F2F'};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });

          if (target === 'pickup') {
            if (pickupMarkerRef.current) map.removeLayer(pickupMarkerRef.current);
            pickupMarkerRef.current = L.marker([lat, lng], { icon }).addTo(map);
          } else {
            if (deliveryMarkerRef.current) map.removeLayer(deliveryMarkerRef.current);
            deliveryMarkerRef.current = L.marker([lat, lng], { icon }).addTo(map);
          }

          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`);
            const data = await res.json();
            const addr = data.address || {};
            const landmark = addr.amenity || addr.tourism || addr.building || addr.office || addr.shop || addr.road || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
            if (target === 'delivery') {
              setFormData(prev => ({ ...prev, deliveryStreet: landmark, deliveryBarangay: addr.suburb || addr.neighbourhood || addr.village || '', deliveryCity: addr.city || addr.town || addr.municipality || addr.county || '' }));
            } else {
              setFormData(prev => ({ ...prev, pickupStreet: landmark, pickupBarangay: addr.suburb || addr.neighbourhood || addr.village || '', pickupCity: addr.city || addr.town || addr.municipality || addr.county || '' }));
            }
            addToast(`${target === 'delivery' ? 'Delivery' : 'Pickup'} location set from map!`, 'success');
          } catch {
            addToast('Could not resolve address.', 'error');
          }
        });
      }, 400);
    };
    loadLeaflet();
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        pickupMarkerRef.current = null;
        deliveryMarkerRef.current = null;
      }
    };
  }, [step]);

  // === Email notification ===
  const sendEmailNotification = async (bookingData) => {
    try {
      await fetch('/api/send-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: user?.email, type: 'booking_confirmation', data: bookingData }) });
    } catch (err) { console.error('Email notification failed:', err); }
  };

  // === Submit ===
  const handleSubmit = async () => {
    setLoading(true);
    const fleet = fleetTypes?.find(f => f.id === selectedFleet);
    if (!fleet) { addToast('Please select a fleet type.', 'error'); setLoading(false); return; }
    if (!formData.time) { addToast('Please select a specific time.', 'error'); setLoading(false); return; }

    const now = new Date();
    const timeString = now.toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const bookingData = {
      bookingType: formData.bookingType, truckRoute: fleet.name,
      pickup: pickupFull, pickupStreet: formData.pickupStreet, pickupBarangay: formData.pickupBarangay, pickupCity: formData.pickupCity,
      delivery: deliveryFull, deliveryStreet: formData.deliveryStreet, deliveryBarangay: formData.deliveryBarangay, deliveryCity: formData.deliveryCity,
      date: formData.date, time: formData.time, weight: formData.weight,
      cargoSize: cargoSizeFull, cargoLength: formData.cargoLength, cargoWidth: formData.cargoWidth, cargoHeight: formData.cargoHeight,
      routeType: routeInfo.route, notes: formData.notes, fleetType: selectedFleet, cargoType,
      status: 'Quote Requested', requestedAt: now.toISOString(),
      userId: user?.uid || 'anonymous', userEmail: user?.email || '', userName: user?.displayName || 'Guest',
    };

    const bookingTypeLabel = BOOKING_TYPES.find(t => t.value === formData.bookingType)?.label || formData.bookingType;

    try {
      await addBooking(bookingData);
      await addNotification({
        title: 'Quote Request Submitted',
        message: `Your ${bookingTypeLabel} quote request for ${fleet.name} (${pickupFull} to ${deliveryFull}) has been received. Route: ${routeInfo.route}. Our team will calculate the cost and get back to you shortly.`,
        type: 'booking', isNew: true, time: timeString, userId: user?.uid || 'anonymous',
      });
      await addNotification({
        title: 'New Quote Request',
        message: `${user?.displayName || 'A user'} submitted a ${bookingTypeLabel} quote request for ${fleet.name} -- ${pickupFull} to ${deliveryFull}. Weight: ${formData.weight || 'N/A'} KG, Size: ${cargoSizeFull || 'N/A'}. Auto-route: ${routeInfo.route}.`,
        type: 'booking', isNew: true, time: timeString, forAdmin: true, userId: 'admin', userEmail: user?.email || '',
      });
      await sendEmailNotification(bookingData);
      addToast('Quote request submitted! Redirecting to your bookings...', 'success');
      router.push('/dashboard/bookings');
    } catch (err) {
      addToast('Failed to submit quote request. Please try again.', 'error');
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const selectedFleetData = fleetTypes?.find(f => f.id === selectedFleet);

  // === Step validation ===
  const canProceedStep1 = formData.pickupStreet && formData.pickupCity && formData.deliveryStreet && formData.deliveryCity && formData.date && formData.time;
  const canProceedStep2 = !!selectedFleet;

  // === Progress Tracker Component ===
  const ProgressTracker = () => (
    <div className={styles.progressTracker}>
      <div className={styles.progressLine}></div>
      <div className={styles.progressLineFill} style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}></div>

      <div className={styles.progressStep}>
        <div className={`${styles.stepCircle} ${step > 1 ? styles.stepCircleCompleted : step === 1 ? styles.stepCircleActive : styles.stepCircleInactive}`}>
          {step > 1 ? <Check size={16} /> : '1'}
        </div>
        <span className={`${styles.stepLabel} ${step >= 1 ? styles.stepLabelActive : styles.stepLabelInactive}`}>Route & Cargo</span>
      </div>

      <div className={styles.progressStep}>
        <div className={`${styles.stepCircle} ${step > 2 ? styles.stepCircleCompleted : step === 2 ? styles.stepCircleActive : styles.stepCircleInactive}`}>
          {step > 2 ? <Check size={16} /> : '2'}
        </div>
        <span className={`${styles.stepLabel} ${step >= 2 ? styles.stepLabelActive : styles.stepLabelInactive}`}>Fleet Selection</span>
      </div>

      <div className={styles.progressStep}>
        <div className={`${styles.stepCircle} ${step === 3 ? styles.stepCircleActive : styles.stepCircleInactive}`}>
          3
        </div>
        <span className={`${styles.stepLabel} ${step === 3 ? styles.stepLabelActive : styles.stepLabelInactive}`}>Review & Confirm</span>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <ProgressTracker />

      {/* ============================== */}
      {/* STEP 1: Route & Schedule       */}
      {/* ============================== */}
      {step === 1 && (
        <>
          <div className={styles.stepOneLayout}>
            {/* Left: Form Column */}
            <div className={styles.formColumn}>
              <div>
                <h1 className={styles.pageTitle}>Plan Your Route</h1>
                <p className={styles.pageSubtitle}>Enter pickup and drop-off details to begin.</p>
              </div>

              <div className={styles.formCard}>
                {/* Pickup & Delivery with vertical connector */}
                <div className={styles.locationGroup}>
                  <div className={styles.locationConnector}></div>

                  {/* Pickup */}
                  <div className={styles.locationRow}>
                    <div className={styles.locationIcon}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#006d37', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }}></div>
                      </div>
                    </div>
                    <div className={styles.locationFields}>
                      <label className={styles.fieldLabel}>Pickup Location</label>
                      <input type="text" name="pickupStreet" className={styles.fieldInput} placeholder="e.g., SBMA Gate 1" value={formData.pickupStreet} onChange={handleChange} required />
                      <input type="text" name="pickupBarangay" className={styles.fieldInput} placeholder="Barangay" value={formData.pickupBarangay} onChange={handleChange} style={{ marginTop: 8 }} />
                      <input type="text" name="pickupCity" className={styles.fieldInput} placeholder="City / Municipality" value={formData.pickupCity} onChange={handleChange} required style={{ marginTop: 8 }} />
                      <div className={styles.locationActions}>
                        <button type="button" className={styles.locationBtn} onClick={() => handleUseLocation('pickup')} disabled={locating && locatingTarget === 'pickup'}>
                          <Navigation size={12} /> {locating && locatingTarget === 'pickup' ? 'Detecting...' : 'My Location'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Delivery */}
                  <div className={styles.locationRow}>
                    <div className={styles.locationIcon}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#D32F2F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <MapPin size={12} color="#fff" />
                      </div>
                    </div>
                    <div className={styles.locationFields}>
                      <label className={styles.fieldLabel}>Drop-off Location</label>
                      <input type="text" name="deliveryStreet" className={styles.fieldInput} placeholder="e.g., Olongapo City Mall" value={formData.deliveryStreet} onChange={handleChange} required />
                      <input type="text" name="deliveryBarangay" className={styles.fieldInput} placeholder="Barangay" value={formData.deliveryBarangay} onChange={handleChange} style={{ marginTop: 8 }} />
                      <input type="text" name="deliveryCity" className={styles.fieldInput} placeholder="City / Municipality" value={formData.deliveryCity} onChange={handleChange} required style={{ marginTop: 8 }} />
                      <div className={styles.locationActions}>
                        <button type="button" className={styles.locationBtn} onClick={() => handleUseLocation('delivery')} disabled={locating && locatingTarget === 'delivery'}>
                          <Navigation size={12} /> {locating && locatingTarget === 'delivery' ? 'Detecting...' : 'My Location'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.divider}></div>

                {/* Date & Time */}
                <div className={styles.scheduleGrid}>
                  <div className={styles.scheduleField}>
                    <label className={styles.fieldLabel}>Date</label>
                    <input type="date" name="date" className={styles.fieldInput} value={formData.date} onChange={handleChange} required min={today} />
                  </div>
                  <div className={styles.scheduleField}>
                    <label className={styles.fieldLabel}>Time</label>
                    <input type="time" name="time" className={styles.fieldInput} value={formData.time} onChange={handleChange} required />
                  </div>
                </div>

                <div className={styles.divider}></div>

                {/* Cargo Type */}
                <div>
                  <label className={styles.fieldLabel} style={{ marginBottom: 12 }}>Cargo Type</label>
                  <div className={styles.cargoTypeGrid}>
                    {CARGO_TYPES.map(ct => (
                      <label key={ct.value} className={styles.cargoTypeOption}>
                        <input type="radio" name="cargoType" value={ct.value} checked={cargoType === ct.value} onChange={() => setCargoType(ct.value)} />
                        <div className={styles.cargoTypeCard}>
                          <span>{ct.icon}</span>
                          <span>{ct.label}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className={styles.divider}></div>

                {/* Weight & Dimensions */}
                <div className={styles.weightField}>
                  <label className={styles.fieldLabel}>Estimated Weight</label>
                  <div className={styles.inputWithUnit}>
                    <input type="number" name="weight" className={styles.fieldInput} placeholder="In Kilograms" value={formData.weight} onChange={handleChange} required min="1" />
                    <span className={styles.inputUnit}>KG</span>
                  </div>
                </div>

                <div>
                  <label className={styles.fieldLabel} style={{ marginBottom: 8 }}>Cargo Dimensions (L × W × H)</label>
                  <div className={styles.dimensionsGrid}>
                    <div className={styles.dimensionField}>
                      <div className={styles.inputWithUnit}>
                        <input type="number" name="cargoLength" className={styles.fieldInput} placeholder="Length" value={formData.cargoLength} onChange={handleChange} required min="0.01" step="0.01" />
                        <span className={styles.inputUnit}>m</span>
                      </div>
                    </div>
                    <div className={styles.dimensionField}>
                      <div className={styles.inputWithUnit}>
                        <input type="number" name="cargoWidth" className={styles.fieldInput} placeholder="Width" value={formData.cargoWidth} onChange={handleChange} required min="0.01" step="0.01" />
                        <span className={styles.inputUnit}>m</span>
                      </div>
                    </div>
                    <div className={styles.dimensionField}>
                      <div className={styles.inputWithUnit}>
                        <input type="number" name="cargoHeight" className={styles.fieldInput} placeholder="Height" value={formData.cargoHeight} onChange={handleChange} required min="0.01" step="0.01" />
                        <span className={styles.inputUnit}>m</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className={styles.fieldLabel} style={{ marginBottom: 8 }}>Special Instructions</label>
                  <textarea name="notes" className={styles.notesField} placeholder="Gate pass requirements, fragile handling, contact persons..." value={formData.notes} onChange={handleChange}></textarea>
                </div>
              </div>
            </div>

            {/* Right: Map Column */}
            <div className={styles.mapColumn}>
              <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
            </div>
          </div>

          {/* Nav Footer */}
          <div className={styles.navFooter}>
            <Link href="/dashboard" className={`${styles.navBtn} ${styles.navBtnBack}`}>
              <ArrowLeft size={18} /> Cancel
            </Link>
            <button
              className={`${styles.navBtn} ${styles.navBtnNext}`}
              disabled={!canProceedStep1}
              onClick={() => { if (canProceedStep1) setStep(2); else addToast('Please fill in all required fields.', 'error'); }}
            >
              Continue to Vehicle <ArrowRight size={18} />
            </button>
          </div>
        </>
      )}

      {/* ============================== */}
      {/* STEP 2: Fleet Selection        */}
      {/* ============================== */}
      {step === 2 && (
        <>
          <div className={styles.fleetHeader}>
            <h1 className={styles.pageTitle}>Select Your Vehicle</h1>
            <p className={styles.pageSubtitle}>Showing fleet options based on your {cargoType} cargo requirements.</p>
          </div>

          {/* Filter Chips */}
          <div className={styles.filterChips}>
            <button className={`${styles.filterChip} ${fleetFilter === 'all' ? styles.filterChipActive : ''}`} onClick={() => setFleetFilter('all')}>All Vehicles</button>
            {FLEET_CATALOG.map(cat => (
              <button key={cat.key} className={`${styles.filterChip} ${fleetFilter === cat.key ? styles.filterChipActive : ''}`} onClick={() => setFleetFilter(cat.key)}>
                {cat.placeholder.icon} {cat.label}
              </button>
            ))}
          </div>

          {/* Fleet Grid */}
          <div className={styles.fleetGrid}>
            {fleetLoading ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px', color: 'var(--on-surface-variant)' }}>Loading fleet inventory...</div>
            ) : filteredFleets.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px', color: 'var(--on-surface-variant)' }}>No vehicles available in this category.</div>
            ) : filteredFleets.map((fleet, idx) => {
              const isSelected = selectedFleet === fleet.id;
              const isFirst = idx === 0 && fleetFilter === 'all';
              return (
                <div
                  key={fleet.id}
                  className={`${styles.fleetCard} ${isFirst ? styles.fleetCardRecommended : ''} ${isSelected ? styles.fleetCardSelected : ''}`}
                  onClick={() => setSelectedFleet(fleet.id)}
                >
                  {/* Badge */}
                  {isFirst && (
                    <div className={styles.fleetBadge}>
                      <Star size={12} /> Recommended
                    </div>
                  )}
                  {isSelected && !isFirst && (
                    <div className={styles.fleetBadge} style={{ background: '#27ae60' }}>
                      <Check size={12} /> Selected
                    </div>
                  )}

                  {/* Image */}
                  <div className={styles.fleetCardImage}>
                    {fleet.imageUrl ? (
                      <img src={fleet.imageUrl} alt={fleet.name} />
                    ) : (
                      <div className={styles.fleetCardPlaceholderImg}>
                        {FLEET_CATALOG.find(c => c.key === fleet.category)?.placeholder?.icon || '🚛'}
                      </div>
                    )}
                    <div className={styles.fleetCardGradient}></div>
                    <div className={styles.fleetCardImageText}>
                      <h3>{fleet.name}</h3>
                      <p>{fleet.category || 'Heavy Duty'}</p>
                    </div>
                  </div>

                  {/* Body */}
                  <div className={styles.fleetCardBody}>
                    <div className={styles.specGrid}>
                      <div className={styles.specItem}>
                        <span className={styles.specLabel}><Scale size={12} /> Payload</span>
                        <span className={styles.specValue}>{fleet.capacity || 'N/A'}</span>
                      </div>
                      <div className={styles.specItem}>
                        <span className={styles.specLabel}><Ruler size={12} /> Dimensions</span>
                        <span className={styles.specValue}>{fleet.dimensions || 'Standard'}</span>
                      </div>
                      <div className={styles.specItem}>
                        <span className={styles.specLabel}><Fuel size={12} /> Fuel</span>
                        <span className={styles.specValue}>{fleet.fuel || 'Diesel'}</span>
                      </div>
                      <div className={styles.specItem}>
                        <span className={styles.specLabel}><Settings size={12} /> Type</span>
                        <span className={styles.specValue}>{fleet.category || 'General'}</span>
                      </div>
                    </div>

                    <div className={styles.fleetCardFooter}>
                      <button className={`${styles.selectBtn} ${isSelected ? styles.selectBtnPrimary : styles.selectBtnOutline}`}>
                        {isSelected ? <><Check size={16} /> Selected</> : 'Select Vehicle'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Nav Footer */}
          <div className={styles.navFooter}>
            <button className={`${styles.navBtn} ${styles.navBtnBack}`} onClick={() => setStep(1)}>
              <ArrowLeft size={18} /> Back to Route
            </button>
            <button
              className={`${styles.navBtn} ${styles.navBtnNext}`}
              disabled={!canProceedStep2}
              onClick={() => { if (canProceedStep2) setStep(3); else addToast('Please select a vehicle.', 'error'); }}
            >
              Continue to Review <ArrowRight size={18} />
            </button>
          </div>
        </>
      )}

      {/* ============================== */}
      {/* STEP 3: Review & Confirm       */}
      {/* ============================== */}
      {step === 3 && (
        <>
          <div style={{ marginBottom: 32 }}>
            <h1 className={styles.pageTitle}>Review & Confirm</h1>
            <p className={styles.pageSubtitle}>Double-check your booking details before submitting your quote request.</p>
          </div>

          <div className={styles.reviewLayout}>
            {/* Route Card */}
            <div className={styles.reviewCard}>
              <div className={styles.reviewCardHeader}>
                <div className={styles.reviewCardHeaderIcon}><MapPin size={20} /></div>
                <span className={styles.reviewCardTitle}>Route Information</span>
              </div>
              <div className={styles.reviewCardBody}>
                <div className={styles.routeVisual}>
                  <div className={styles.routeVisualLine}>
                    <div className={`${styles.routeVisualDot} ${styles.routeVisualDotPickup}`}></div>
                    <div className={styles.routeVisualDash}></div>
                    <div className={styles.routeVisualDash}></div>
                    <div className={`${styles.routeVisualDot} ${styles.routeVisualDotDelivery}`}></div>
                  </div>
                  <div className={styles.routeVisualDetails}>
                    <div>
                      <div className={styles.routeVisualLabel}>Pickup</div>
                      <div className={styles.routeVisualAddress}>{pickupFull || 'Not specified'}</div>
                    </div>
                    <div>
                      <div className={styles.routeVisualLabel}>Drop-off</div>
                      <div className={styles.routeVisualAddress}>{deliveryFull || 'Not specified'}</div>
                    </div>
                  </div>
                </div>

                {/* Auto-route display */}
                {(formData.weight || cargoSizeFull) && (
                  <div className={styles.routeAlertBanner} style={{
                    background: routeInfo.route === 'Old Road' ? '#FFF8E1' : 'var(--primary-light, #e6f9e4)',
                    border: `1px solid ${routeInfo.route === 'Old Road' ? '#F5A623' : 'var(--primary)'}`,
                    marginTop: 16,
                  }}>
                    <div className={styles.routeAlertBannerIcon} style={{ background: routeInfo.route === 'Old Road' ? '#FFE0B2' : 'var(--primary)' }}>
                      <Route size={16} color={routeInfo.route === 'Old Road' ? '#E65100' : '#fff'} />
                    </div>
                    <div>
                      <strong style={{ color: routeInfo.route === 'Old Road' ? '#E65100' : 'var(--primary)' }}>Route: {routeInfo.route}</strong>
                      <p style={{ fontSize: '0.8rem', margin: 0, opacity: 0.85 }}>{routeInfo.reason}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Vehicle Card */}
            <div className={styles.reviewCard}>
              <div className={styles.reviewCardHeader}>
                <div className={styles.reviewCardHeaderIcon}><Truck size={20} /></div>
                <span className={styles.reviewCardTitle}>Selected Vehicle</span>
              </div>
              <div className={styles.reviewCardBody}>
                {selectedFleetData ? (
                  <div className={styles.fleetPreview}>
                    {selectedFleetData.imageUrl ? (
                      <img src={selectedFleetData.imageUrl} alt={selectedFleetData.name} className={styles.fleetPreviewImage} />
                    ) : (
                      <div className={styles.fleetPreviewImage} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                        {FLEET_CATALOG.find(c => c.key === selectedFleetData.category)?.placeholder?.icon || '🚛'}
                      </div>
                    )}
                    <div className={styles.fleetPreviewInfo}>
                      <h4>{selectedFleetData.name}</h4>
                      <p>{selectedFleetData.category} {selectedFleetData.capacity ? `• ${selectedFleetData.capacity}` : ''}</p>
                    </div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--on-surface-variant)' }}>No vehicle selected</p>
                )}
              </div>
            </div>

            {/* Cargo & Schedule Card */}
            <div className={styles.reviewCard}>
              <div className={styles.reviewCardHeader}>
                <div className={styles.reviewCardHeaderIcon}><Package size={20} /></div>
                <span className={styles.reviewCardTitle}>Cargo & Schedule</span>
              </div>
              <div className={styles.reviewCardBody}>
                <div className={styles.reviewGrid}>
                  <div className={styles.reviewItem}>
                    <span className={styles.reviewLabel}>Date</span>
                    <span className={styles.reviewValue}>{formData.date || 'Not set'}</span>
                  </div>
                  <div className={styles.reviewItem}>
                    <span className={styles.reviewLabel}>Time</span>
                    <span className={styles.reviewValue}>{formData.time || 'Not set'}</span>
                  </div>
                  <div className={styles.reviewItem}>
                    <span className={styles.reviewLabel}>Cargo Type</span>
                    <span className={styles.reviewValue} style={{ textTransform: 'capitalize' }}>{cargoType}</span>
                  </div>
                  <div className={styles.reviewItem}>
                    <span className={styles.reviewLabel}>Weight</span>
                    <span className={styles.reviewValue}>{formData.weight ? `${formData.weight} KG` : 'N/A'}</span>
                  </div>
                  <div className={styles.reviewItem}>
                    <span className={styles.reviewLabel}>Dimensions</span>
                    <span className={styles.reviewValue}>{cargoSizeFull || 'N/A'}</span>
                  </div>
                  {formData.notes && (
                    <div className={styles.reviewItem} style={{ gridColumn: '1 / -1' }}>
                      <span className={styles.reviewLabel}>Special Instructions</span>
                      <span className={styles.reviewValue} style={{ fontWeight: 400 }}>{formData.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className={styles.termsBox}>
              <input type="checkbox" className={styles.termsCheckbox} checked={agreedTerms} onChange={(e) => setAgreedTerms(e.target.checked)} />
              <div>
                By submitting this request, you agree to our Transport Terms of Service. A GCLT representative will review your cargo details and send you a quotation via notifications. You can then confirm and choose your payment method (Cash or Stripe).
              </div>
            </div>
          </div>

          {/* Nav Footer */}
          <div className={styles.navFooter}>
            <button className={`${styles.navBtn} ${styles.navBtnBack}`} onClick={() => setStep(2)}>
              <ArrowLeft size={18} /> Back to Vehicle
            </button>
            <button
              className={`${styles.navBtn} ${styles.navBtnNext}`}
              disabled={!agreedTerms || loading}
              onClick={handleSubmit}
            >
              {loading ? 'Submitting...' : 'Submit Quote Request'} <ArrowRight size={18} />
            </button>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
