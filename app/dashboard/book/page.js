'use client';

import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { useFirestore } from '@/lib/useFirestore';
import { getFleetTypes, addBooking, addNotification } from '@/lib/firebaseService';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/Toast';
import { MapPin, Truck, Info, Package, Route, Navigation } from 'lucide-react';
import styles from './book.module.css';

// Route classification logic:
// heavy/large cargo → Old Road (safer for heavy loads)
// light/small cargo → Expressway (faster route)
function determineRouteType(weight, cargoSize) {
  const w = Number(weight) || 0;
  const sizeStr = (cargoSize || '').toLowerCase();

  const isHeavy = w >= 3000; // 3 tons+
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

export default function BookTransport() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const { data: fleetTypes, loading: fleetLoading } = useFirestore(getFleetTypes);
  const [selectedFleet, setSelectedFleet] = useState('');
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
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

  // Concatenate location sub-fields for storage
  const pickupFull = [formData.pickupStreet, formData.pickupBarangay, formData.pickupCity].filter(Boolean).join(', ');
  const deliveryFull = [formData.deliveryStreet, formData.deliveryBarangay, formData.deliveryCity].filter(Boolean).join(', ');

  // Concatenate cargo dimensions
  const cargoSizeFull = (formData.cargoLength || formData.cargoWidth || formData.cargoHeight)
    ? `${formData.cargoLength || 0}m × ${formData.cargoWidth || 0}m × ${formData.cargoHeight || 0}m`
    : '';

  // Auto-compute route type based on weight and cargo size
  const routeInfo = useMemo(
    () => determineRouteType(formData.weight, cargoSizeFull),
    [formData.weight, cargoSizeFull]
  );

  // Use current location for pickup
  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      addToast('Geolocation is not supported by your browser.', 'error');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Use reverse geocoding via Nominatim (free, no API key required)
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`);
          const data = await res.json();
          const addr = data.address || {};
          setFormData(prev => ({
            ...prev,
            pickupStreet: addr.road || addr.building || addr.house_number || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
            pickupBarangay: addr.suburb || addr.neighbourhood || addr.village || '',
            pickupCity: addr.city || addr.town || addr.municipality || addr.county || '',
          }));
          addToast('Location detected successfully!', 'success');
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

  const sendEmailNotification = async (bookingData) => {
    try {
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: user?.email,
          type: 'booking_confirmation',
          data: bookingData,
        }),
      });
    } catch (err) {
      console.error('Email notification failed:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const fleet = fleetTypes?.find(f => f.id === selectedFleet);
    if (!fleet) {
      addToast('Please select a fleet type.', 'error');
      setLoading(false);
      return;
    }

    if (!formData.time) {
      addToast('Please select a specific time.', 'error');
      setLoading(false);
      return;
    }

    const now = new Date();
    const timeString = now.toLocaleString('en-PH', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

    const bookingData = {
      bookingType: formData.bookingType,
      truckRoute: fleet.name,
      pickup: pickupFull,
      pickupStreet: formData.pickupStreet,
      pickupBarangay: formData.pickupBarangay,
      pickupCity: formData.pickupCity,
      delivery: deliveryFull,
      deliveryStreet: formData.deliveryStreet,
      deliveryBarangay: formData.deliveryBarangay,
      deliveryCity: formData.deliveryCity,
      date: formData.date,
      time: formData.time,
      weight: formData.weight,
      cargoSize: cargoSizeFull,
      cargoLength: formData.cargoLength,
      cargoWidth: formData.cargoWidth,
      cargoHeight: formData.cargoHeight,
      routeType: routeInfo.route,
      notes: formData.notes,
      fleetType: selectedFleet,
      status: 'Quote Requested',
      requestedAt: now.toISOString(),
      userId: user?.uid || 'anonymous',
      userEmail: user?.email || '',
      userName: user?.displayName || 'Guest',
    };

    const bookingTypeLabel = BOOKING_TYPES.find(t => t.value === formData.bookingType)?.label || formData.bookingType;

    const userNotif = {
      title: 'Quote Request Submitted',
      message: `Your ${bookingTypeLabel} quote request for ${fleet.name} (${pickupFull} to ${deliveryFull}) has been received. Route: ${routeInfo.route}. Our team will calculate the cost and get back to you shortly.`,
      type: 'booking',
      isNew: true,
      time: timeString,
      userId: user?.uid || 'anonymous',
    };

    const adminNotif = {
      title: 'New Quote Request',
      message: `${user?.displayName || 'A user'} submitted a ${bookingTypeLabel} quote request for ${fleet.name} -- ${pickupFull} to ${deliveryFull}. Weight: ${formData.weight || 'N/A'} KG, Size: ${cargoSizeFull || 'N/A'}. Auto-route: ${routeInfo.route}.`,
      type: 'booking',
      isNew: true,
      time: timeString,
      forAdmin: true,
      userId: 'admin',
      userEmail: user?.email || '',
    };

    try {
      await addBooking(bookingData);
      await addNotification(userNotif);
      await addNotification(adminNotif);
      await sendEmailNotification(bookingData);
      addToast('Quote request submitted! Our team will review and send you a quotation.', 'success');
      setFormData({
        bookingType: 'standard', pickupStreet: '', pickupBarangay: '', pickupCity: '',
        deliveryStreet: '', deliveryBarangay: '', deliveryCity: '',
        date: '', time: '', weight: '', cargoLength: '', cargoWidth: '', cargoHeight: '', notes: '',
      });
      setSelectedFleet('');
    } catch (err) {
      addToast('Failed to submit quote request. Please try again.', 'error');
    }
    setLoading(false);
  };

  // Get today's date for min attribute
  const today = new Date().toISOString().split('T')[0];

  return (
    <DashboardLayout>
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
            <div className={styles.formHeaderIcon}>
              <Truck size={24} />
            </div>
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
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ gap: '6px' }}
                  onClick={handleUseLocation}
                  disabled={locating}
                >
                  <Navigation size={14} /> {locating ? 'Detecting...' : 'Use My Location'}
                </button>
              </div>
              <div className={styles.inputGrid}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <input
                    type="text"
                    name="pickupStreet"
                    className="form-input"
                    placeholder="Street / Building"
                    value={formData.pickupStreet}
                    onChange={handleChange}
                    required
                  />
                  <span className={styles.inputHint}>e.g. Bldg 23, Argonaut Hwy</span>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <input
                    type="text"
                    name="pickupBarangay"
                    className="form-input"
                    placeholder="Barangay"
                    value={formData.pickupBarangay}
                    onChange={handleChange}
                  />
                  <span className={styles.inputHint}>e.g. Brgy. Cubi</span>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <input
                    type="text"
                    name="pickupCity"
                    className="form-input"
                    placeholder="City / Municipality"
                    value={formData.pickupCity}
                    onChange={handleChange}
                    required
                  />
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
              </div>
              <div className={styles.inputGrid}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <input
                    type="text"
                    name="deliveryStreet"
                    className="form-input"
                    placeholder="Street / Building"
                    value={formData.deliveryStreet}
                    onChange={handleChange}
                    required
                  />
                  <span className={styles.inputHint}>e.g. Rizal Avenue</span>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <input
                    type="text"
                    name="deliveryBarangay"
                    className="form-input"
                    placeholder="Barangay"
                    value={formData.deliveryBarangay}
                    onChange={handleChange}
                  />
                  <span className={styles.inputHint}>e.g. Brgy. East Bajac-Bajac</span>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <input
                    type="text"
                    name="deliveryCity"
                    className="form-input"
                    placeholder="City / Municipality"
                    value={formData.deliveryCity}
                    onChange={handleChange}
                    required
                  />
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
            <div className={styles.fleetGrid}>
              {fleetLoading ? (
                <p style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>Loading fleet types...</p>
              ) : !fleetTypes?.filter(f => f.available !== false).length ? (
                <p style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No trucks available for booking at this time.</p>
              ) : fleetTypes?.filter(f => f.available !== false).map((fleet) => (
                <button
                  key={fleet.id}
                  type="button"
                  className={`${styles.fleetCard} ${selectedFleet === fleet.id ? styles.fleetCardActive : ''}`}
                  onClick={() => setSelectedFleet(fleet.id)}
                >
                  {selectedFleet === fleet.id && <span className={styles.fleetCheck}>&#10003;</span>}
                  {fleet.imageUrl ? (
                    <img src={fleet.imageUrl} alt={fleet.name} style={{ width: '64px', height: '64px', borderRadius: '8px', objectFit: 'cover' }} />
                  ) : (
                    <span className={styles.fleetIcon}><Truck size={28} /></span>
                  )}
                  <span className={styles.fleetName}>{fleet.name}</span>
                  <span className={styles.fleetCapacity}>{fleet.capacity}</span>
                </button>
              ))}
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
