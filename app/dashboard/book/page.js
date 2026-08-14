'use client';

import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useRealtimeFirestore } from '@/lib/useRealtimeFirestore';
import { subscribeToFleetTypes, addBooking, addNotification } from '@/lib/firebaseService';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/Toast';
import { MapPin, Navigation, Check, ArrowRight, ArrowLeft, Star, AlertTriangle, Snowflake, Package, Wrench, Truck } from 'lucide-react';
import LeafletMapModal from '@/components/LeafletMapModalDynamic';
import LeafletInlineMap from '@/components/LeafletInlineMapDynamic';
import { FLEET_CATEGORIES } from '@/lib/constants';
import { highlightAndFocusMissingFields } from '@/lib/validation';
import styles from './book.module.css';

/* ── Auto-route logic ── */
function determineRouteType(weight, cargoSize, pickupCity, deliveryCity) {
  const pCity = (pickupCity || '').trim().toLowerCase();
  const dCity = (deliveryCity || '').trim().toLowerCase();
  
  if (pCity && dCity && pCity === dCity) {
    return { route: 'Local Route', reason: 'Pickup and delivery are in the same area. Routed via local city roads.' };
  }

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

/* ── Constants ── */
const CARGO_TYPES = [
  { value: 'Trailer', label: 'Trailer', Icon: Truck },
  { value: 'Flatbed', label: 'Flatbed', Icon: Truck },
  { value: 'Skeletal', label: 'Skeletal', Icon: Truck },
  { value: '20 footer', label: '20 footer', Icon: Truck },
  { value: '40 footer', label: '40 footer', Icon: Truck },
];



const STEPS = [
  { number: 1, label: 'Route' },
  { number: 2, label: 'Vehicle' },
  { number: 3, label: 'Confirm' },
];

/* ══════════════════════════════════════════════════════════════
   Component
   ══════════════════════════════════════════════════════════════ */
export default function BookTransport() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const { data: fleetTypes, loading: fleetLoading } = useRealtimeFirestore(
    (cb) => subscribeToFleetTypes(cb)
  );

  /* ── UI state ── */
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFleet, setSelectedFleet] = useState('');
  const [fleetFilter, setFleetFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locatingTarget, setLocatingTarget] = useState('pickup');
  const [showMapsModal, setShowMapsModal] = useState(false);
  const [mapsTarget, setMapsTarget] = useState('pickup');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [estimatedDistance, setEstimatedDistance] = useState(null);
  const [privacyConsent, setPrivacyConsent] = useState(false);

  /* ── Form data ── */
  const [formData, setFormData] = useState({
    cargoType: 'Trailer',
    pickupStreet: '', pickupBarangay: '', pickupCity: '',
    deliveryStreet: '', deliveryBarangay: '', deliveryCity: '',
    date: '', time: '',
    weight: '', cargoLength: '', cargoWidth: '', cargoHeight: '',
    notes: '',
    truckQuantity: 1,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  /* ── Derived values ── */
  const pickupFull = [formData.pickupStreet, formData.pickupBarangay, formData.pickupCity].filter(Boolean).join(', ');
  const deliveryFull = [formData.deliveryStreet, formData.deliveryBarangay, formData.deliveryCity].filter(Boolean).join(', ');
  const cargoSizeFull = (formData.cargoLength || formData.cargoWidth || formData.cargoHeight)
    ? `${formData.cargoLength || 0}m × ${formData.cargoWidth || 0}m × ${formData.cargoHeight || 0}m`
    : '';
  const routeInfo = useMemo(() => determineRouteType(formData.weight, cargoSizeFull, formData.pickupCity, formData.deliveryCity), [formData.weight, cargoSizeFull, formData.pickupCity, formData.deliveryCity]);

  /* ── Fleet data ── */
  const allFleets = useMemo(() => (fleetTypes || []).filter(f => f.available !== false), [fleetTypes]);
  const filteredFleets = useMemo(() => {
    if (fleetFilter === 'all') return allFleets;
    const cat = FLEET_CATEGORIES.find(c => c.value.toLowerCase() === fleetFilter.toLowerCase());
    return cat ? allFleets.filter(f => (f.category || 'Trailer') === cat.value) : allFleets;
  }, [allFleets, fleetFilter]);

  /* ── Geolocation ── */
  const handleUseLocation = (target = 'pickup') => {
    if (!navigator.geolocation) { addToast('Geolocation is not supported by your browser.', 'error'); return; }
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
        } catch { addToast('Could not determine your address. Please enter manually.', 'error'); }
        setLocating(false);
      },
      () => { addToast('Location access denied. Please enter your address manually.', 'error'); setLocating(false); },
      { timeout: 10000 }
    );
  };

  /* ── Map modal callback ── */
  const handleApplyMapsAddress = (rawAddress) => {
    const parts = rawAddress.split(',').map(s => s.trim());
    if (mapsTarget === 'delivery') {
      setFormData(prev => ({ ...prev, deliveryStreet: parts[0] || rawAddress, deliveryBarangay: parts[1] || '', deliveryCity: parts[2] || '' }));
    } else {
      setFormData(prev => ({ ...prev, pickupStreet: parts[0] || rawAddress, pickupBarangay: parts[1] || '', pickupCity: parts[2] || '' }));
    }
    setShowMapsModal(false);
    addToast(`${mapsTarget === 'delivery' ? 'Delivery' : 'Pickup'} location set from map!`, 'success');
  };

  /* ── Email helper ── */
  const sendEmailNotification = async (bookingData) => {
    try {
      await fetch('/api/send-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: user?.email, type: 'booking_confirmation', data: bookingData }),
      });
    } catch (err) { console.error('Email notification failed:', err); }
  };

  /* ── Submission ── */
  const handleSubmit = async () => {
    if (highlightAndFocusMissingFields()) return;
    if (!privacyConsent) {
      addToast('You must agree to the Data Privacy Policy to submit a quote request.', 'error');
      return;
    }
    setLoading(true); 
    const fleet = fleetTypes?.find(f => f.id === selectedFleet);
    if (!fleet) { addToast('Please select a fleet type.', 'error'); setLoading(false); return; }
    if (!formData.time) { addToast('Please select a specific time.', 'error'); setLoading(false); return; }

    const now = new Date();
    const timeString = now.toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const bookingData = {
      bookingType: formData.cargoType,
      truckRoute: fleet.name,
      pickup: pickupFull, pickupStreet: formData.pickupStreet, pickupBarangay: formData.pickupBarangay, pickupCity: formData.pickupCity,
      delivery: deliveryFull, deliveryStreet: formData.deliveryStreet, deliveryBarangay: formData.deliveryBarangay, deliveryCity: formData.deliveryCity,
      date: formData.date, time: formData.time, weight: formData.weight,
      cargoSize: cargoSizeFull, cargoLength: formData.cargoLength, cargoWidth: formData.cargoWidth, cargoHeight: formData.cargoHeight,
      routeType: routeInfo.route, notes: specialInstructions, fleetType: selectedFleet,
      estimatedDistance: estimatedDistance,
      truckQuantity: Number(formData.truckQuantity) || 1,
      status: 'Quote Requested', requestedAt: now.toISOString(),
      userId: user?.uid || 'anonymous', userEmail: user?.email || '', userName: user?.displayName || 'Guest',
    };

    const userNotif = {
      title: 'Quote Request Submitted',
      message: `Your ${formData.cargoType} truck quote request for ${fleet.name} (${pickupFull} to ${deliveryFull}) has been received. Route: ${routeInfo.route}. Our team will calculate the cost and get back to you shortly.`,
      type: 'booking', isNew: true, time: timeString, userId: user?.uid || 'anonymous',
    };

    const adminNotif = {
      title: 'New Quote Request',
      message: `${user?.displayName || 'A user'} submitted a ${formData.cargoType} truck quote request for ${fleet.name} -- ${pickupFull} to ${deliveryFull}. Weight: ${formData.weight || 'N/A'} KG, Size: ${cargoSizeFull || 'N/A'}. Auto-route: ${routeInfo.route}.`,
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

  /* ── Validation ── */
  const isSameDestination = !!(formData.pickupCity && formData.deliveryCity &&
    formData.pickupStreet && formData.deliveryStreet &&
    formData.pickupStreet.trim().toLowerCase() === formData.deliveryStreet.trim().toLowerCase() &&
    formData.pickupCity.trim().toLowerCase() === formData.deliveryCity.trim().toLowerCase() &&
    (formData.pickupBarangay || '').trim().toLowerCase() === (formData.deliveryBarangay || '').trim().toLowerCase());
  const canProceedStep1 = formData.pickupStreet && formData.deliveryStreet && formData.date && formData.time && formData.weight && formData.cargoLength && formData.cargoWidth && formData.cargoHeight && !isSameDestination;
  const canProceedStep2 = !!selectedFleet;
  const today = new Date().toISOString().split('T')[0];
  const selectedFleetData = fleetTypes?.find(f => f.id === selectedFleet);

  /* ── Inline map pin callback ── */
  const handleMapPin = (target, { street, barangay, city }) => {
    if (target === 'delivery') {
      setFormData(prev => ({ ...prev, deliveryStreet: street, deliveryBarangay: barangay, deliveryCity: city }));
    } else {
      setFormData(prev => ({ ...prev, pickupStreet: street, pickupBarangay: barangay, pickupCity: city }));
    }
    addToast(`${target === 'delivery' ? 'Drop-off' : 'Pickup'} pinned on map!`, 'success');
  };

  /* ═══════════════ RENDER ═══════════════ */
  return (
    <DashboardLayout>
      {/* ── Leaflet Map Modal (client-only via next/dynamic) ── */}
      {showMapsModal && (
        <LeafletMapModal
          target={mapsTarget}
          onApply={handleApplyMapsAddress}
          onClose={() => setShowMapsModal(false)}
        />
      )}

      {/* ── Page Wrapper ── */}
      <div className={styles.wizardPage}>

        {/* ════════════════════════════════════════════════════
            STEP 1 — Route & Schedule
            ════════════════════════════════════════════════════ */}
        {currentStep === 1 && (
          <>
            {/* Stepper — spans full width above the two columns */}
            <div className={styles.stepper}>
              {STEPS.map((step, i) => {
                const isDone = currentStep > step.number;
                const isActive = currentStep === step.number;
                return (
                  <div key={step.number} className={styles.stepperGroup}>
                    <div className={styles.stepperItem}>
                      <div className={`${styles.stepperDot} ${isDone ? styles.stepperDotDone : ''} ${isActive ? styles.stepperDotActive : ''}`}>
                        {isDone ? <Check size={14} /> : step.number}
                      </div>
                      <span className={`${styles.stepperLabel} ${isActive ? styles.stepperLabelActive : ''} ${isDone ? styles.stepperLabelDone : ''}`}>
                        {step.label}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`${styles.stepperLine} ${currentStep > step.number ? styles.stepperLineDone : ''}`} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Step Header — sits ABOVE the two-column layout so map aligns with form card */}
            <div className={styles.stepHeader}>
              <h1 className={styles.stepTitle}>Plan Your Route</h1>
              <p className={styles.stepSubtitle}>Enter pickup and drop-off details to begin.</p>
            </div>

            {/* Two-column layout: form (left) + map (right) — both start at same level */}
            <div className={styles.stepLayout}>
              {/* ── Left column ── */}
              <div className={styles.formColumn}>
                <div className={styles.formCard}>
                  {/* Location Group */}
                  <div className={styles.locationGroup}>
                    <div className={styles.locationConnector} />

                    {/* Pickup */}
                    <div className={styles.locationRow}>
                      <div className={styles.locationIconWrap}>
                        <span className={styles.locationDotPickup} />
                      </div>
                      <div className={styles.locationFields}>
                        <label className={styles.fieldLabel}>PICKUP LOCATION</label>
                        <input className={styles.fieldInput} type="text" name="pickupStreet" placeholder="Street / Building / Landmark *" value={formData.pickupStreet} onChange={handleChange} required />
                        <div className={styles.locationSubFields}>
                          <input className={styles.fieldInput} type="text" name="pickupBarangay" placeholder="Barangay (optional)" value={formData.pickupBarangay} onChange={handleChange} />
                          <input className={styles.fieldInput} type="text" name="pickupCity" placeholder="City / Municipality (optional)" value={formData.pickupCity} onChange={handleChange} />
                        </div>
                        <div className={styles.locationActions}>
                          <button type="button" className={styles.locBtn} onClick={() => handleUseLocation('pickup')} disabled={locating && locatingTarget === 'pickup'}>
                            <Navigation size={12} /> {locating && locatingTarget === 'pickup' ? 'Detecting...' : 'Use My Location'}
                          </button>
                          <button type="button" className={styles.locBtn} onClick={() => { setMapsTarget('pickup'); setShowMapsModal(true); }}>
                            <MapPin size={12} /> Pin on Map
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Drop-off */}
                    <div className={styles.locationRow}>
                      <div className={styles.locationIconWrap}>
                        <span className={styles.locationDotDropoff} />
                      </div>
                      <div className={styles.locationFields}>
                        <label className={styles.fieldLabel}>DROP-OFF LOCATION</label>
                        <input className={styles.fieldInput} type="text" name="deliveryStreet" placeholder="Street / Building / Landmark *" value={formData.deliveryStreet} onChange={handleChange} required />
                        <div className={styles.locationSubFields}>
                          <input className={styles.fieldInput} type="text" name="deliveryBarangay" placeholder="Barangay (optional)" value={formData.deliveryBarangay} onChange={handleChange} />
                          <input className={styles.fieldInput} type="text" name="deliveryCity" placeholder="City / Municipality (optional)" value={formData.deliveryCity} onChange={handleChange} />
                        </div>
                        <div className={styles.locationActions}>
                          <button type="button" className={styles.locBtn} onClick={() => handleUseLocation('delivery')} disabled={locating && locatingTarget === 'delivery'}>
                            <Navigation size={12} /> {locating && locatingTarget === 'delivery' ? 'Detecting...' : 'Use My Location'}
                          </button>
                          <button type="button" className={styles.locBtn} onClick={() => { setMapsTarget('delivery'); setShowMapsModal(true); }}>
                            <MapPin size={12} /> Pin on Map
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.divider} />

                  {/* Date & Time */}
                  <div className={styles.scheduleGrid}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel}>DATE</label>
                      <input className={styles.fieldInput} type="date" name="date" value={formData.date} onChange={handleChange} min={today} required />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel}>TIME</label>
                      <input
                        className={styles.fieldInput}
                        type="time"
                        name="time"
                        value={formData.time}
                        onChange={handleChange}
                        min="08:00"
                        max="18:00"
                        required
                      />
                      <span style={{ fontSize: '0.72rem', color: '#6f7a70', marginTop: '4px', display: 'block' }}>
                        📅 Bookings available 8:00 AM–6:00 PM
                      </span>
                    </div>
                  </div>

                  <div className={styles.divider} />

                  {/* Type of Truck */}
                  <div>
                    <label className={styles.fieldLabel}>TYPE OF TRUCK</label>
                    <div className={styles.cargoTypeGrid}>
                      {CARGO_TYPES.map(({ value, label, Icon }) => (
                        <label key={value} className={`${styles.cargoTypeBtn} ${formData.cargoType === value ? styles.cargoTypeBtnActive : ''}`}>
                          <input type="radio" name="cargoType" value={value} checked={formData.cargoType === value} onChange={handleChange} style={{ display: 'none' }} />
                          <Icon size={18} />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className={styles.divider} />

                  {/* Cargo Weight & Dimensions */}
                  <div>
                    <label className={styles.fieldLabel}>
                      CARGO WEIGHT &amp; DIMENSIONS{' '}
                      <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#6f7a70' }}>(for route &amp; truck matching)</span>
                    </label>
                    <div className={styles.scheduleGrid} style={{ marginTop: '10px' }}>
                      <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>Weight (KG)</label>
                        <input className={styles.fieldInput} type="number" name="weight" placeholder="e.g. 5000" value={formData.weight} onChange={handleChange} min="0" required />
                      </div>
                      <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>Length (m)</label>
                        <input className={styles.fieldInput} type="number" name="cargoLength" placeholder="e.g. 6" value={formData.cargoLength} onChange={handleChange} min="0" step="0.1" required />
                      </div>
                      <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>Width (m)</label>
                        <input className={styles.fieldInput} type="number" name="cargoWidth" placeholder="e.g. 2.5" value={formData.cargoWidth} onChange={handleChange} min="0" step="0.1" required />
                      </div>
                      <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>Height (m)</label>
                        <input className={styles.fieldInput} type="number" name="cargoHeight" placeholder="e.g. 2" value={formData.cargoHeight} onChange={handleChange} min="0" step="0.1" required />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Same Destination Warning */}
                {isSameDestination && (
                  <div className={styles.sameDestWarning}>
                    <span>⚠️</span>
                    <div>
                      <p style={{ fontWeight: 700, margin: '0 0 2px' }}>Pickup and drop-off are the same</p>
                      <p style={{ margin: 0 }}>Please enter a different delivery location.</p>
                    </div>
                  </div>
                )}

                {/* Auto Route Alert & Distance */}
                {!isSameDestination && (formData.weight || cargoSizeFull) && (
                  <div className={`${styles.routeAlert} ${routeInfo.route === 'Old Road' ? styles.routeAlertOldRoad : styles.routeAlertExpress}`}>
                    <div className={styles.routeAlertIcon}>
                      {routeInfo.route === 'Old Road' ? '🛣️' : '🚀'}
                    </div>
                    <div>
                      <p className={styles.routeAlertTitle}>Auto-assigned Route: <strong>{routeInfo.route}</strong></p>
                      <p className={styles.routeAlertDesc}>{routeInfo.reason}</p>
                    </div>
                  </div>
                )}
                
                {estimatedDistance && (
                  <div style={{
                    marginTop: '16px', padding: '16px', background: '#f6fbf3', border: '1px solid #bec9be', 
                    borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px'
                  }}>
                    <div style={{ fontSize: '1.5rem' }}>📏</div>
                    <div>
                      <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: '#6f7a70', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estimated Travel Distance</p>
                      <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#00522c' }}>{estimatedDistance} km</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className={styles.stepActions}>
                  <Link href="/dashboard" className={styles.btnGhost}>Cancel</Link>
                  <button
                    className={styles.btnPrimary}
                    disabled={isSameDestination}
                    onClick={() => {
                      if (isSameDestination) { addToast('Pickup and drop-off cannot be the same location.', 'error'); return; }
                      if (highlightAndFocusMissingFields()) { addToast('Please fill in all required fields.', 'error'); return; }
                      setCurrentStep(2);
                    }}
                  >
                    Continue to Vehicle <ArrowRight size={18} />
                  </button>
                </div>
              </div>

              {/* ── Right column: REAL Leaflet map ── */}
              <div className={styles.mapPanel}>
                <LeafletInlineMap
                  pickupCity={formData.pickupCity}
                  deliveryCity={formData.deliveryCity}
                  pickupFull={pickupFull}
                  deliveryFull={deliveryFull}
                  onPinLocation={handleMapPin}
                  onRouteCalculated={setEstimatedDistance}
                  routeType={routeInfo.route}
                />
                {/* Route chip at bottom of map panel */}
                {pickupFull && deliveryFull && (
                  <div className={styles.routeChip}>
                    <span className={styles.routeChipDot} style={{ background: '#00522c' }} />
                    <span style={{ fontWeight: 700 }}>{formData.pickupCity || 'Pickup'}</span>
                    <ArrowRight size={12} color="#6f7a70" />
                    <span className={styles.routeChipDot} style={{ background: '#ba1a1a' }} />
                    <span style={{ fontWeight: 700 }}>{formData.deliveryCity || 'Drop-off'}</span>
                    {(formData.weight || cargoSizeFull) && (
                      <>
                        <span style={{ margin: '0 4px', color: '#bec9be' }}>|</span>
                        <span style={{ fontWeight: 700, color: routeInfo.route === 'Old Road' ? '#E65100' : '#00522c' }}>
                          {routeInfo.route === 'Old Road' ? '🛣️' : '🚀'} {routeInfo.route}
                        </span>
                      </>
                    )}
                    {estimatedDistance && (
                      <>
                        <span style={{ margin: '0 4px', color: '#bec9be' }}>|</span>
                        <span style={{ fontWeight: 700, color: '#3f4941' }}>
                          📏 {estimatedDistance} km
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ════════════════════════════════════════════════════
            STEP 2 — Choose Vehicle
            ════════════════════════════════════════════════════ */}
        {currentStep === 2 && (
          <div className={styles.fullColumn}>
            <div className={styles.stepper}>
              {STEPS.map((step, i) => {
                const isDone = currentStep > step.number;
                const isActive = currentStep === step.number;
                return (
                  <div key={step.number} className={styles.stepperGroup}>
                    <div className={styles.stepperItem}>
                      <div className={`${styles.stepperDot} ${isDone ? styles.stepperDotDone : ''} ${isActive ? styles.stepperDotActive : ''}`}>
                        {isDone ? <Check size={14} /> : step.number}
                      </div>
                      <span className={`${styles.stepperLabel} ${isActive ? styles.stepperLabelActive : ''} ${isDone ? styles.stepperLabelDone : ''}`}>
                        {step.label}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`${styles.stepperLine} ${currentStep > step.number ? styles.stepperLineDone : ''}`} />
                    )}
                  </div>
                );
              })}
            </div>

            <div className={styles.stepHeader}>
              <h1 className={styles.stepTitle}>Select Your Vehicle</h1>
              <p className={styles.stepSubtitle}>Showing fleet options based on your {formData.cargoType || 'Trailer'} truck requirements.</p>
            </div>

            {/* Filter tabs */}
            <div className={styles.filterTabs}>
              {['all', ...FLEET_CATEGORIES.map(c => c.value.toLowerCase())].map(tab => (
                <button
                  key={tab}
                  className={`${styles.filterTab} ${fleetFilter === tab ? styles.filterTabActive : ''}`}
                  onClick={() => setFleetFilter(tab)}
                >
                  {tab === 'all' ? 'All Vehicles' : FLEET_CATEGORIES.find(c => c.value.toLowerCase() === tab)?.label || tab}
                </button>
              ))}
            </div>

            {/* Fleet grid */}
            <div className={styles.fleetGrid}>
              {fleetLoading ? (
                <div className={styles.loadingState}>Loading fleet...</div>
              ) : filteredFleets.length === 0 ? (
                <div className={styles.emptyState}>No vehicles found in this category.</div>
              ) : (
                filteredFleets.map((fleet, idx) => {
                  const isSelected = selectedFleet === fleet.id;
                  const isRecommended = idx === 0;
                  /* Check if truck can handle the user's cargo weight */
                  const userWeight = Number(formData.weight) || 0;
                  // Prefer the numeric loadCapacity field; fall back to parsing the legacy capacity string
                  const fleetCapKg = fleet.loadCapacity
                    ? Number(fleet.loadCapacity)
                    : (parseFloat((fleet.capacity || '').replace(/[^0-9.]/g, '')) || 0) * 1000;
                  const isInsufficient = userWeight > 0 && fleetCapKg > 0 && userWeight > fleetCapKg;
                  return (
                    <div
                      key={fleet.id}
                      className={`${styles.truckCard} ${isSelected ? styles.truckCardSelected : ''} ${isRecommended && !isInsufficient ? styles.truckCardRecommended : ''} ${isInsufficient ? styles.truckCardDisabled : ''}`}
                      onClick={() => { if (!isInsufficient) setSelectedFleet(fleet.id); }}
                    >
                      {isRecommended && !isInsufficient && (
                        <div className={styles.recommendedBadge}><Star size={12} /> Recommended for your cargo</div>
                      )}
                      <div className={styles.truckImageWrap}>
                        {fleet.imageUrl ? (
                          <Image src={fleet.imageUrl} alt={fleet.name} fill sizes="(max-width: 768px) 100vw, 33vw" className={styles.truckImage} />
                        ) : (
                          <div className={styles.truckImagePlaceholder}>
                            <span className={styles.truckEmoji}>🚛</span>
                          </div>
                        )}
                        <div className={styles.truckImageOverlay} />
                        <div className={styles.truckImageLabel}>
                          <p className={styles.truckName}>{fleet.name}</p>
                          <p className={styles.truckSubtype}>{fleet.category || 'General'}</p>
                        </div>
                      </div>
                      <div className={styles.truckSpecs}>
                        <div className={styles.specGrid}>
                          {/* PAYLOAD */}
                          {(fleet.loadCapacity || fleet.capacity) && (
                            <div className={styles.specItem}>
                              <span className={styles.specLabel}>⚖ Payload</span>
                              <span className={`${styles.specValue} ${isInsufficient ? styles.specValueDanger : ''}`}>
                                {fleet.loadCapacity
                                  ? `${Number(fleet.loadCapacity).toLocaleString()} kg`
                                  : fleet.capacity}
                              </span>
                            </div>
                          )}
                          {/* CREW CAPACITY */}
                          {fleet.passengerCapacity && (
                            <div className={styles.specItem}>
                              <span className={styles.specLabel}>👥 Crew</span>
                              <span className={styles.specValue}>{fleet.passengerCapacity} persons</span>
                            </div>
                          )}
                          {/* DIMENSIONS */}
                          {fleet.dimensions && (
                            <div className={styles.specItem}>
                              <span className={styles.specLabel}>📐 Dimensions</span>
                              <span className={`${styles.specValue} ${isInsufficient ? styles.specValueDanger : ''}`}>{fleet.dimensions}</span>
                            </div>
                          )}
                          {/* PRICE (replaces Mileage) */}
                          <div className={styles.specItem}>
                            <span className={styles.specLabel}>💰 Price</span>
                            <span className={styles.specValue} style={{ color: '#006d3c', fontWeight: 700 }}>
                              {fleet.ratePerKm ? `₱${fleet.ratePerKm} / km` : fleet.price ? `₱${fleet.price}` : 'Request Quote'}
                            </span>
                          </div>
                          {/* TRUCK NAME (replaces Engine) */}
                          <div className={styles.specItem}>
                            {isInsufficient ? (
                              <>
                                <span className={styles.specLabel}>⚠ Warning</span>
                                <span className={`${styles.specValue} ${styles.specValueDanger}`}>Insufficient Capacity</span>
                              </>
                            ) : (
                              <>
                                <span className={styles.specLabel}>🚛 Truck Name</span>
                                <span className={styles.specValue}>{fleet.name}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className={styles.truckCardFooter}>
                          {isInsufficient ? (
                            <button className={styles.btnUnavailable} disabled>Unavailable for Cargo</button>
                          ) : isSelected ? (
                            <div className={styles.truckCardActions}>
                              <button className={styles.btnSelected}><Check size={16} /> Selected</button>
                            </div>
                          ) : (
                            <div className={styles.truckCardActions}>
                              <button className={styles.btnSelectVehicle}>Select Vehicle</button>
                              <button className={styles.btnCompare} title="Compare">⇄</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Truck Quantity Stepper */}
            {selectedFleet && (
              <div style={{ margin: '24px 0', padding: '20px', background: '#f6fbf3', borderRadius: '10px', border: '1px solid #bec9be' }}>
                <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#3f4941', display: 'block', marginBottom: '12px' }}>
                  NUMBER OF TRUCKS
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, truckQuantity: Math.max(1, (Number(prev.truckQuantity) || 1) - 1) }))}
                    style={{ width: '40px', height: '40px', borderRadius: '8px', border: '1.5px solid #bec9be', background: '#fff', fontSize: '1.25rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3f4941' }}
                  >−</button>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#00522c', display: 'block', lineHeight: 1 }}>{formData.truckQuantity || 1}</span>
                    <span style={{ fontSize: '0.72rem', color: '#6f7a70' }}>{formData.truckQuantity === 1 ? 'truck' : 'trucks'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, truckQuantity: Math.min(10, (Number(prev.truckQuantity) || 1) + 1) }))}
                    style={{ width: '40px', height: '40px', borderRadius: '8px', border: '1.5px solid #bec9be', background: '#fff', fontSize: '1.25rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3f4941' }}
                  >+</button>
                  <span style={{ fontSize: '0.8rem', color: '#6f7a70', marginLeft: '8px' }}>Max 10 trucks per booking. The final price will be quoted by our team.</span>
                </div>
              </div>
            )}

            <div className={styles.stepActions}>
              <button className={styles.btnGhost} onClick={() => setCurrentStep(1)}>
                <ArrowLeft size={18} /> Back to Cargo
              </button>
              <button
                className={styles.btnPrimary}
                onClick={() => {
                  if (!canProceedStep2) { addToast('Please select a vehicle.', 'error'); return; }
                  setCurrentStep(3);
                }}
              >
                Continue to Review <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════
            STEP 3 — Review & Confirm
            ════════════════════════════════════════════════════ */}
        {currentStep === 3 && (
          <div className={styles.fullColumn}>
            <div className={styles.stepper}>
              {STEPS.map((step, i) => {
                const isDone = currentStep > step.number;
                const isActive = currentStep === step.number;
                return (
                  <div key={step.number} className={styles.stepperGroup}>
                    <div className={styles.stepperItem}>
                      <div className={`${styles.stepperDot} ${isDone ? styles.stepperDotDone : ''} ${isActive ? styles.stepperDotActive : ''}`}>
                        {isDone ? <Check size={14} /> : step.number}
                      </div>
                      <span className={`${styles.stepperLabel} ${isActive ? styles.stepperLabelActive : ''} ${isDone ? styles.stepperLabelDone : ''}`}>
                        {step.label}
                      </span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`${styles.stepperLine} ${currentStep > step.number ? styles.stepperLineDone : ''}`} />
                    )}
                  </div>
                );
              })}
            </div>

            <div className={styles.stepHeader}>
              <h1 className={styles.stepTitle}>Review &amp; Confirm</h1>
              <p className={styles.stepSubtitle}>Double-check everything before submitting your quote request.</p>
            </div>

            <div className={styles.reviewLayout}>
              {/* Left: details */}
              <div className={styles.reviewDetails}>
                {/* Route summary */}
                <div className={styles.reviewCard}>
                  <h3 className={styles.reviewCardTitle}>Route Summary</h3>
                  <div className={styles.reviewRouteVisual}>
                    <div className={styles.reviewRoutePoint}>
                      <span className={styles.locationDotPickup} />
                      <div>
                        <p className={styles.reviewRouteLabel}>Pickup</p>
                        <p className={styles.reviewRouteValue}>{pickupFull || '—'}</p>
                      </div>
                    </div>
                    <div className={styles.reviewRouteLine} />
                    <div className={styles.reviewRoutePoint}>
                      <span className={styles.locationDotDropoff} />
                      <div>
                        <p className={styles.reviewRouteLabel}>Drop-off</p>
                        <p className={styles.reviewRouteValue}>{deliveryFull || '—'}</p>
                      </div>
                    </div>
                  </div>
                  <div className={styles.reviewMeta}>
                    <div><span className={styles.reviewMetaLabel}>Date</span><span className={styles.reviewMetaValue}>{formData.date || '—'}</span></div>
                    <div><span className={styles.reviewMetaLabel}>Time</span><span className={styles.reviewMetaValue}>{formData.time || '—'}</span></div>
                    <div><span className={styles.reviewMetaLabel}>Type of Truck</span><span className={styles.reviewMetaValue} style={{ textTransform: 'capitalize' }}>{formData.cargoType}</span></div>
                    <div><span className={styles.reviewMetaLabel}>Route</span><span className={styles.reviewMetaValue} style={{ color: routeInfo.route === 'Old Road' ? '#E65100' : '#00522c', fontWeight: 700 }}>{routeInfo.route}</span></div>
                    {formData.weight && <div><span className={styles.reviewMetaLabel}>Weight</span><span className={styles.reviewMetaValue}>{formData.weight} KG</span></div>}
                    {cargoSizeFull && <div><span className={styles.reviewMetaLabel}>Dimensions</span><span className={styles.reviewMetaValue}>{cargoSizeFull}</span></div>}
                  </div>
                </div>

                {/* Vehicle */}
                <div className={styles.reviewCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 className={styles.reviewCardTitle}>Selected Vehicle</h3>
                    <button className={styles.locBtn} onClick={() => setCurrentStep(2)}>Change</button>
                  </div>
                  {selectedFleetData ? (
                    <div className={styles.reviewVehicle}>
                      {selectedFleetData.imageUrl ? (
                        <Image src={selectedFleetData.imageUrl} alt={selectedFleetData.name} width={72} height={56} className={styles.reviewVehicleImg} />
                      ) : (
                        <div className={styles.reviewVehicleImgPlaceholder}>🚛</div>
                      )}
                      <div>
                        <p className={styles.reviewVehicleName}>{selectedFleetData.name}</p>
                        <p className={styles.reviewVehicleMeta}>{selectedFleetData.category || 'General'}{selectedFleetData.capacity ? ` • ${selectedFleetData.capacity}` : ''}</p>
                        <p className={styles.reviewVehicleMeta} style={{ marginTop: '4px', fontWeight: 700, color: '#00522c' }}>
                          🚛 × {formData.truckQuantity || 1} {formData.truckQuantity === 1 ? 'truck' : 'trucks'} requested
                        </p>
                      </div>
                    </div>
                  ) : <p style={{ color: '#6f7a70' }}>No vehicle selected.</p>}
                </div>

                {/* Special instructions */}
                <div className={styles.reviewCard}>
                  <h3 className={styles.reviewCardTitle}>Special Instructions</h3>
                  <textarea
                    className={styles.reviewTextarea}
                    placeholder="Gate pass requirements, fragile handling, contact persons at drop-off..."
                    value={specialInstructions}
                    onChange={e => setSpecialInstructions(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>

              {/* Right: cost summary */}
              <div className={styles.reviewSidebar}>
                <div className={styles.reviewSidebarCard}>
                  <h3 className={styles.reviewSidebarTitle}>Cost Summary</h3>
                  <div className={styles.reviewSidebarAmount}>
                    <p className={styles.reviewSidebarLabel}>Estimated Total</p>
                    <p className={styles.reviewSidebarPrice}>Awaiting Quote</p>
                    <p className={styles.reviewSidebarNote}>Our team will review your details and send a quotation. You'll be notified via the dashboard and email.</p>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={privacyConsent} onChange={(e) => setPrivacyConsent(e.target.checked)} required style={{ marginTop: '4px' }} />
                      <span style={{ fontSize: '0.85rem', lineHeight: '1.4', color: 'var(--text-muted)' }}>
                        I consent to the collection and processing of my personal data in accordance with the <a href="/privacy" style={{ color: 'var(--primary)', textDecoration: 'underline' }} target="_blank">Data Privacy Policy</a>.
                      </span>
                    </label>
                  </div>
                  <button
                    className={styles.btnPrimary}
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? 'Submitting...' : 'Request a Quote'} {!loading && <ArrowRight size={18} />}
                  </button>
                  <div className={styles.reviewTrust}>
                    <p>✓ No payment required until quote accepted</p>
                    <p>✓ Cancel anytime before confirmation</p>
                    <p>✓ Admin response within 2–4 hours</p>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.stepActions}>
              <button className={styles.btnGhost} onClick={() => setCurrentStep(2)}>
                <ArrowLeft size={18} /> Back to Vehicle
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
