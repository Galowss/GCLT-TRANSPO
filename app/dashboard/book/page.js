'use client';

import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useRealtimeFirestore } from '@/lib/useRealtimeFirestore';
import { subscribeToFleetTypes, addBooking, addNotification } from '@/lib/firebaseService';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/Toast';
import { MapPin, Truck, Info, Package, Route, Navigation, Map, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
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

// Hardcoded categories — always visible as placeholders
const FLEET_CATALOG = [
  {
    key: 'Small Trucks',
    label: 'Small Trucks',
    description: 'Ideal for light cargo up to 2 tons',
    placeholder: { name: 'Small Truck (e.g. L300, AUV)', capacity: 'Up to 2 tons', icon: '🛻' },
  },
  {
    key: 'Medium Trucks',
    label: 'Medium Trucks',
    description: 'For moderate loads, 2–5 tons',
    placeholder: { name: 'Medium Truck (e.g. Elf, Canter)', capacity: '2 – 5 tons', icon: '🚛' },
  },
  {
    key: 'Large Trucks',
    label: 'Large Trucks',
    description: 'Heavy-duty freight, 5–15 tons',
    placeholder: { name: 'Large Truck (e.g. 10-Wheeler)', capacity: '5 – 15 tons', icon: '🚚' },
  },
  {
    key: 'Specialized',
    label: 'Specialized Vehicles',
    description: 'Refrigerated, flatbed, tanker, etc.',
    placeholder: { name: 'Specialized Vehicle', capacity: 'Varies', icon: '🏗️' },
  },
];

export default function BookTransport() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const { data: fleetTypes, loading: fleetLoading } = useRealtimeFirestore(
    (cb) => subscribeToFleetTypes(cb)
  );
  const [selectedFleet, setSelectedFleet] = useState('');
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locatingTarget, setLocatingTarget] = useState('pickup');
  const [showMapsModal, setShowMapsModal] = useState(false);
  const [mapsTarget, setMapsTarget] = useState('pickup');
  const [mapsAddress, setMapsAddress] = useState('');
  const [formData, setFormData] = useState({
    bookingType: 'standard',
    pickupStreet: '',
    pickupBarangay: '',
    pickupCity: '',
    deliveryStreet: '',
    deliveryBarangay: '',
    deliveryCity: '',
    date: '',
    time: '',
    weight: '',
    cargoLength: '',
    cargoWidth: '',
    cargoHeight: '',
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

  // Use current location with nearest landmark detection
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

          const landmark =
            addr.amenity || addr.tourism || addr.building ||
            addr.office || addr.shop || addr.road ||
            addr.house_number || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

          if (target === 'delivery') {
            setFormData(prev => ({
              ...prev,
              deliveryStreet: landmark,
              deliveryBarangay: addr.suburb || addr.neighbourhood || addr.village || '',
              deliveryCity: addr.city || addr.town || addr.municipality || addr.county || '',
            }));
          } else {
            setFormData(prev => ({
              ...prev,
              pickupStreet: landmark,
              pickupBarangay: addr.suburb || addr.neighbourhood || addr.village || '',
              pickupCity: addr.city || addr.town || addr.municipality || addr.county || '',
            }));
          }
          addToast('Location detected! Nearest landmark filled in.', 'success');
        } catch {
          addToast('Could not determine your address. Please enter manually.', 'error');
        }
        setLocating(false);
      },
      () => {
        addToast('Location access denied. Please enter your address manually.', 'error');
        setLocating(false);
      },
      { timeout: 10000 }
    );
  };

  // Apply the address from the Maps modal to pickup or delivery
  const handleApplyMapsAddress = () => {
    if (!mapsAddress.trim()) {
      addToast('Please click on the map or type an address.', 'error');
      return;
    }
    const parts = mapsAddress.split(',').map(s => s.trim());
    if (mapsTarget === 'delivery') {
      setFormData(prev => ({
        ...prev,
        deliveryStreet: parts[0] || mapsAddress,
        deliveryBarangay: parts[1] || '',
        deliveryCity: parts[2] || '',
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        pickupStreet: parts[0] || mapsAddress,
        pickupBarangay: parts[1] || '',
        pickupCity: parts[2] || '',
      }));
    }
    setShowMapsModal(false);
    setMapsAddress('');
    addToast(`${mapsTarget === 'delivery' ? 'Delivery' : 'Pickup'} location set from map!`, 'success');
  };

  const sendEmailNotification = async (bookingData) => {
    try {
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: user?.email, type: 'booking_confirmation', data: bookingData }),
      });
    } catch (err) {
      console.error('Email notification failed:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const fleet = fleetTypes?.find(f => f.id === selectedFleet);
    if (!fleet) { addToast('Please select a fleet type.', 'error'); setLoading(false); return; }
    if (!formData.time) { addToast('Please select a specific time.', 'error'); setLoading(false); return; }

    const now = new Date();
    const timeString = now.toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const bookingData = {
      bookingType: formData.bookingType,
      truckRoute: fleet.name,
      pickup: pickupFull, pickupStreet: formData.pickupStreet, pickupBarangay: formData.pickupBarangay, pickupCity: formData.pickupCity,
      delivery: deliveryFull, deliveryStreet: formData.deliveryStreet, deliveryBarangay: formData.deliveryBarangay, deliveryCity: formData.deliveryCity,
      date: formData.date, time: formData.time, weight: formData.weight,
      cargoSize: cargoSizeFull, cargoLength: formData.cargoLength, cargoWidth: formData.cargoWidth, cargoHeight: formData.cargoHeight,
      routeType: routeInfo.route, notes: formData.notes, fleetType: selectedFleet,
      status: 'Quote Requested', requestedAt: now.toISOString(),
      userId: user?.uid || 'anonymous', userEmail: user?.email || '', userName: user?.displayName || 'Guest',
    };

    const bookingTypeLabel = BOOKING_TYPES.find(t => t.value === formData.bookingType)?.label || formData.bookingType;

    const userNotif = {
      title: 'Quote Request Submitted',
      message: `Your ${bookingTypeLabel} quote request for ${fleet.name} (${pickupFull} to ${deliveryFull}) has been received. Route: ${routeInfo.route}. Our team will calculate the cost and get back to you shortly.`,
      type: 'booking', isNew: true, time: timeString, userId: user?.uid || 'anonymous',
    };

    const adminNotif = {
      title: 'New Quote Request',
      message: `${user?.displayName || 'A user'} submitted a ${bookingTypeLabel} quote request for ${fleet.name} -- ${pickupFull} to ${deliveryFull}. Weight: ${formData.weight || 'N/A'} KG, Size: ${cargoSizeFull || 'N/A'}. Auto-route: ${routeInfo.route}.`,
      type: 'booking', isNew: true, time: timeString, forAdmin: true, userId: 'admin', userEmail: user?.email || '',
    };

    try {
      await addBooking(bookingData);
      await addNotification(userNotif);
      await addNotification(adminNotif);
      await sendEmailNotification(bookingData);
      addToast('Quote request submitted! Redirecting to your bookings...', 'success');
      router.push('/dashboard/bookings');
    } catch (err) {
      addToast('Failed to submit quote request. Please try again.', 'error');
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  // Map fleet types from Firestore into their categories
  const fleetByCategory = useMemo(() => {
    if (!fleetTypes) return {};
    const available = fleetTypes.filter(f => f.available !== false);
    return available.reduce((acc, fleet) => {
      const cat = fleet.category || 'Small Trucks'; // default to first category
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(fleet);
      return acc;
    }, {});
  }, [fleetTypes]);

  // Leaflet map ref
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!showMapsModal) return;
    // Load Leaflet CSS + JS from CDN dynamically
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
      // Small delay to ensure DOM is mounted
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
          // Drop/move marker
          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          } else {
            markerRef.current = L.marker([lat, lng]).addTo(map);
          }
          // Reverse geocode with Nominatim
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`);
            const data = await res.json();
            setMapsAddress(data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
          } catch {
            setMapsAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
          }
        });
      }, 300);
    };
    loadLeaflet();
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [showMapsModal]);

  return (
    <DashboardLayout>
      {/* Maps Modal — Leaflet click-to-select */}
      {showMapsModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 10000,
        }}>
          <div style={{ background: 'var(--white)', borderRadius: '16px', width: '92%', maxWidth: '640px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--gray-200)' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><Map size={18} color={mapsTarget === 'delivery' ? 'var(--danger)' : 'var(--primary)'} /> Pin {mapsTarget === 'delivery' ? 'Delivery Destination' : 'Pickup Location'}</h3>
              <button style={{ background: 'none', color: 'var(--text-muted)' }} onClick={() => setShowMapsModal(false)}><X size={20} /></button>
            </div>
            <div style={{ padding: '12px 20px 4px' }}>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                🖱️ Click anywhere on the map — the address will be auto-detected below.
              </p>
            </div>
            {/* Leaflet map container */}
            <div ref={mapRef} style={{ width: '100%', height: '300px' }} />
            <div style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Detected address will appear here, or type manually..."
                  value={mapsAddress}
                  onChange={e => setMapsAddress(e.target.value)}
                  style={{ flex: 1 }}
                  onKeyDown={e => e.key === 'Enter' && handleApplyMapsAddress()}
                />
                <button className="btn btn-accent" onClick={handleApplyMapsAddress}>
                  Use This Location
                </button>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                Tip: You can also type a landmark or address (e.g. "Gate 1, Brgy. Cubi, SBFZ")
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <Link href="/dashboard">Dashboard</Link>
        <span>&rsaquo;</span>
        <span>Request a Quote</span>
      </div>

      <h1 className={styles.title}>Request a Transport Quote</h1>
      <p className={styles.subtitle}>Fill in your cargo details below. Our team will calculate and send you a quotation.</p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formCard}>
          {/* Form Header */}
          <div className={styles.formHeader}>
            <div className={styles.formHeaderIcon}><Truck size={24} /></div>
            <div>
              <h3>Logistics Detail Form</h3>
              <p>Verified PH Routes: SBMA - Olongapo Metropolitan Area</p>
            </div>
          </div>

          {/* How It Works */}
          <div className={styles.section}>
            <h4 className={styles.sectionLabel}>
              <span className={styles.sectionLine}></span>
              How It Works
            </h4>
            <div className={styles.stepsGrid}>
              {[
                { step: '1', title: 'Submit Details', desc: 'Fill in your cargo and route info' },
                { step: '2', title: 'Receive Quote', desc: 'Our team calculates the cost' },
                { step: '3', title: 'Confirm & Pay', desc: 'Accept the quote and choose payment' },
                { step: '4', title: 'Get Moving', desc: 'Your transport is scheduled' },
              ].map((item) => (
                <div key={item.step} className={styles.stepCard}>
                  <div className={styles.stepNumber}>{item.step}</div>
                  <div className={styles.stepTitle}>{item.title}</div>
                  <div className={styles.stepDesc}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 1: Route Info */}
          <div className={styles.section}>
            <h4 className={styles.sectionLabel}>
              <span className={styles.sectionLine}></span>
              1. Route Information
            </h4>

            {/* Pickup Location */}
            <div className={styles.locationSection}>
              <div className={styles.locationHeader}>
                <label className={styles.locationLabel}>
                  <MapPin size={14} color="var(--primary)" /> Pickup Location *
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{ gap: '6px' }}
                    onClick={() => handleUseLocation('pickup')}
                    disabled={locating && locatingTarget === 'pickup'}
                  >
                    <Navigation size={14} /> {locating && locatingTarget === 'pickup' ? 'Detecting...' : 'Use My Location'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{ gap: '6px' }}
                    onClick={() => { setMapsTarget('pickup'); setShowMapsModal(true); }}
                  >
                    <Map size={14} /> Pin on Maps
                  </button>
                </div>
              </div>
              <div className={styles.inputGrid}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <input type="text" name="pickupStreet" className="form-input" placeholder="Street / Building / Landmark" value={formData.pickupStreet} onChange={handleChange} required />
                  <span className={styles.inputHint}>e.g. Gate 1 SBFZ or Bldg 23, Argonaut Hwy</span>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <input type="text" name="pickupBarangay" className="form-input" placeholder="Barangay" value={formData.pickupBarangay} onChange={handleChange} />
                  <span className={styles.inputHint}>e.g. Brgy. Cubi</span>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <input type="text" name="pickupCity" className="form-input" placeholder="City / Municipality" value={formData.pickupCity} onChange={handleChange} required />
                  <span className={styles.inputHint}>e.g. Subic Bay Freeport Zone</span>
                </div>
              </div>
            </div>

            {/* Delivery Destination */}
            <div className={styles.locationSection} style={{ marginBottom: 0, background: 'var(--white)' }}>
              <div className={styles.locationHeader}>
                <label className={styles.locationLabel}>
                  <MapPin size={14} color="var(--danger)" /> Delivery Destination *
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{ gap: '6px' }}
                    onClick={() => handleUseLocation('delivery')}
                    disabled={locating && locatingTarget === 'delivery'}
                  >
                    <Navigation size={14} /> {locating && locatingTarget === 'delivery' ? 'Detecting...' : 'Use My Location'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{ gap: '6px' }}
                    onClick={() => { setMapsTarget('delivery'); setShowMapsModal(true); }}
                  >
                    <Map size={14} /> Pin on Maps
                  </button>
                </div>
              </div>
              <div className={styles.inputGrid}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <input type="text" name="deliveryStreet" className="form-input" placeholder="Street / Building" value={formData.deliveryStreet} onChange={handleChange} required />
                  <span className={styles.inputHint}>e.g. Rizal Avenue</span>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <input type="text" name="deliveryBarangay" className="form-input" placeholder="Barangay" value={formData.deliveryBarangay} onChange={handleChange} />
                  <span className={styles.inputHint}>e.g. Brgy. East Bajac-Bajac</span>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <input type="text" name="deliveryCity" className="form-input" placeholder="City / Municipality" value={formData.deliveryCity} onChange={handleChange} required />
                  <span className={styles.inputHint}>e.g. Olongapo City</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Fleet Selection */}
          <div className={styles.section}>
            <h4 className={styles.sectionLabel}>
              <span className={styles.sectionLine}></span>
              2. Fleet Selection
            </h4>
            <div className="form-group">
              <label className="form-label">Select Truck / Vehicle Type *</label>
              <select
                className="form-input"
                value={selectedFleet}
                onChange={e => setSelectedFleet(e.target.value)}
                required
                style={{ cursor: 'pointer' }}
              >
                <option value="">— Choose a vehicle category and type —</option>
                {FLEET_CATALOG.map(cat => {
                  const realFleets = fleetByCategory[cat.key] || [];
                  return (
                    <optgroup key={cat.key} label={`${cat.placeholder.icon} ${cat.label} — ${cat.description}`}>
                      {realFleets.length > 0 ? (
                        realFleets.map(fleet => (
                          <option key={fleet.id} value={fleet.id}>
                            {fleet.name}{fleet.capacity ? ` (${fleet.capacity})` : ''}
                          </option>
                        ))
                      ) : (
                        <option disabled value="">
                          {cat.placeholder.name} — Not yet available
                        </option>
                      )}
                    </optgroup>
                  );
                })}
              </select>
              {selectedFleet && (() => {
                const fleet = fleetTypes?.find(f => f.id === selectedFleet);
                return fleet ? (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    marginTop: '10px', padding: '10px 14px',
                    background: 'var(--primary-light)', borderRadius: 'var(--border-radius)',
                    border: '1px solid var(--primary)',
                  }}>
                    {fleet.imageUrl && (
                      <img src={fleet.imageUrl} alt={fleet.name}
                        style={{ width: '48px', height: '48px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} />
                    )}
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem' }}>✓ {fleet.name}</div>
                      {fleet.capacity && <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Capacity: {fleet.capacity}</div>}
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
          </div>


          {/* Section 3: Cargo & Schedule */}
          <div className={styles.section}>
            <h4 className={styles.sectionLabel}>
              <span className={styles.sectionLine}></span>
              3. Cargo &amp; Schedule Details
            </h4>
            <div className={styles.scheduleGrid}>
              <div className="form-group">
                <label className="form-label">Preferred Date *</label>
                <input type="date" name="date" className="form-input" value={formData.date} onChange={handleChange} required min={today} />
              </div>
              <div className="form-group">
                <label className="form-label">Preferred Time *</label>
                <input type="time" name="time" className="form-input" value={formData.time} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Estimated Cargo Weight *</label>
                <div className={styles.inputWithSuffix}>
                  <input type="number" name="weight" className="form-input" placeholder="In Kilograms" value={formData.weight} onChange={handleChange} required min="1" />
                  <span className={styles.suffix}>KG</span>
                </div>
              </div>
            </div>

            {/* Cargo Dimensions */}
            <div>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                <Package size={14} /> Cargo Dimensions (L × W × H) *
              </label>
              <div className={styles.inputGrid}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <div className={styles.inputWithSuffix}>
                    <input type="number" name="cargoLength" className="form-input" placeholder="Length" value={formData.cargoLength} onChange={handleChange} required min="0.01" step="0.01" />
                    <span className={styles.suffix}>m</span>
                  </div>
                  <span className={styles.inputHint}>Length</span>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <div className={styles.inputWithSuffix}>
                    <input type="number" name="cargoWidth" className="form-input" placeholder="Width" value={formData.cargoWidth} onChange={handleChange} required min="0.01" step="0.01" />
                    <span className={styles.suffix}>m</span>
                  </div>
                  <span className={styles.inputHint}>Width</span>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <div className={styles.inputWithSuffix}>
                    <input type="number" name="cargoHeight" className="form-input" placeholder="Height" value={formData.cargoHeight} onChange={handleChange} required min="0.01" step="0.01" />
                    <span className={styles.suffix}>m</span>
                  </div>
                  <span className={styles.inputHint}>Height</span>
                </div>
              </div>
            </div>

            {/* Auto-Route Display */}
            {(formData.weight || cargoSizeFull) && (
              <div className={styles.routeAlert} style={{
                background: routeInfo.route === 'Old Road' ? '#FFF8E1' : 'var(--primary-light)',
                border: `1px solid ${routeInfo.route === 'Old Road' ? '#F5A623' : 'var(--primary-light)'}`,
              }}>
                <div className={styles.routeAlertIcon} style={{ background: routeInfo.route === 'Old Road' ? '#FFE0B2' : 'var(--primary)' }}>
                  <Route size={16} color={routeInfo.route === 'Old Road' ? '#E65100' : 'var(--white)'} />
                </div>
                <div>
                  <h5 className={styles.routeAlertTitle} style={{ color: routeInfo.route === 'Old Road' ? '#E65100' : 'var(--primary-dark)' }}>
                    Travelling Route: {routeInfo.route}
                  </h5>
                  <p className={styles.routeAlertDesc} style={{ color: routeInfo.route === 'Old Road' ? '#E65100' : 'var(--primary-dark)' }}>
                    {routeInfo.reason}
                  </p>
                </div>
              </div>
            )}

            <div className="form-group" style={{ marginTop: '24px' }}>
              <label className="form-label">Special Instructions / Notes</label>
              <textarea
                name="notes"
                className="form-input form-textarea"
                placeholder="Please provide any additional information such as gate pass requirements in SBMA, fragile handling, or specific contact persons at Olongapo drop off."
                value={formData.notes}
                onChange={handleChange}
              ></textarea>
            </div>
          </div>

          {/* Terms */}
          <div className={styles.terms}>
            <Info size={16} />
            <div>
              By submitting this request, you agree to our Transport Terms of Service. A GCLT representative will review your cargo details and send you a quotation via notifications. You can then confirm and choose your payment method (Cash or Stripe).
            </div>
          </div>
        </div>

        <div className={styles.bottomBar}>
          <div className={styles.bottomActions}>
            <Link href="/dashboard" className="btn btn-outline btn-lg">
              Cancel &amp; Return
            </Link>
            <button type="submit" className="btn btn-accent btn-lg" disabled={loading}>
              {loading ? 'Submitting...' : 'Request a Quote'}
            </button>
          </div>
        </div>
      </form>
    </DashboardLayout>
  );
}
