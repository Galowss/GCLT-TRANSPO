'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AdminLayout from '@/components/AdminLayout';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useFirestore } from '@/lib/useFirestore';
import { getTruckById, addAppointment, addNotification } from '@/lib/firebaseService';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/Toast';
import { highlightAndFocusMissingFields } from '@/lib/validation';
import { loginHrefFor } from '@/lib/routing';
import DatePickerInput from '@/components/DatePickerInput';
import { ArrowLeft, Truck, User, Clock, Calendar } from 'lucide-react';
import styles from './viewing.module.css';

// Public site shell. Signed-in customers instead get the dashboard chrome so
// booking a viewing never ejects them from /dashboard/trucks.
function PublicShell({ children }) {
  return (
    <>
      <Navbar />
      <div style={{ paddingTop: '80px', minHeight: '100vh', background: 'var(--gray-50)' }}>
        {children}
      </div>
      <Footer />
    </>
  );
}

export default function ScheduleViewing() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  const { data: truck, loading: truckLoading } = useFirestore(
    () => getTruckById(params.id),
    [params.id]
  );

  // Wait for the persisted session to restore before deciding to bounce, so a
  // signed-in user reloading this page is not sent back to the login screen.
  useEffect(() => {
    if (!authLoading && !user) {
      router.push(loginHrefFor(`/trucks-for-sale/${params.id}/viewing`));
    }
  }, [authLoading, user, router, params.id]);

  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    locationStreet: '',
    locationBarangay: '',
    locationCity: '',
    date: '',
    time: '',
    message: '',
  });
  const [privacyConsent, setPrivacyConsent] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (highlightAndFocusMissingFields()) return;
    if (!privacyConsent) {
      addToast('You must agree to the Data Privacy Policy to proceed.', 'error');
      return;
    }
    setSubmitting(true);

    const locationFull = [formData.locationStreet, formData.locationBarangay, formData.locationCity].filter(Boolean).join(', ');

    await addAppointment({
      truck: truck?.name,
      location: truck?.location,
      date: formData.date,
      time: formData.time,
      customerName: formData.name,
      customerPhone: formData.phone,
      customerLocation: locationFull,
      message: formData.message,
      status: 'Pending',
      userId: user?.uid || 'anonymous',
      truckId: params.id,
    });

    await addNotification({
      title: 'New Viewing Appointment',
      message: `${formData.name} has scheduled a viewing for ${truck?.name}.`,
      type: 'appointment',
      isNew: true,
      userId: user?.uid || 'anonymous',
    });

    // Notify admin about the new viewing request
    const now = new Date();
    const timeString = now.toLocaleString('en-PH', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
    await addNotification({
      title: 'New Viewing Request',
      message: `${formData.name} (${formData.phone}) wants to view ${truck?.name} at ${truck?.location} on ${formData.date} at ${formData.time}.`,
      type: 'appointment',
      isNew: true,
      time: timeString,
      forAdmin: true,
      userId: 'admin',
      userEmail: user?.email || '',
    });

    // Send email notification (respect the user's notification preferences)
    if (user?.notificationPrefs?.appointmentReminders !== false) {
      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: user?.email,
            type: 'viewing_confirmation',
            data: {
              truck: truck?.name,
              location: truck?.location,
              date: formData.date,
              time: formData.time,
            },
          }),
        });
      } catch (err) {
        console.error('Email notification failed:', err);
      }
    }

    addToast(`Viewing appointment scheduled for ${truck?.name}. We will contact you to confirm.`, 'success');
    setSubmitting(false);
    router.push('/dashboard/appointments');
  };

  const Shell = user?.role === 'admin'
    ? AdminLayout
    : user
      ? DashboardLayout
      : PublicShell;

  if (authLoading || truckLoading) {
    return (
      <Shell>
        <div className="spinner-overlay" style={{ minHeight: '60vh' }}>
          <div className="spinner"></div>
        </div>
      </Shell>
    );
  }

  // The redirect above sends guests to login; render nothing until they land.
  if (!user) {
    return null;
  }

  if (!truck) {
    const browseHref = user.role === 'admin' ? '/admin/fleet' : '/dashboard/trucks';
    return (
      <Shell>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '16px' }}>
          <Truck size={48} color="var(--text-muted)" />
          <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>Truck not found</p>
          <Link href={browseHref} className="btn btn-primary">
            Browse All Trucks
          </Link>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className={styles.container}>
        <div className={styles.inner}>
          <Link href={`/trucks-for-sale/${truck.id}`} className={styles.backLink}>
            <ArrowLeft size={16} /> Return to Truck Details
          </Link>

            <form onSubmit={handleSubmit} className={styles.formCard} noValidate>
              {/* Header */}
              <div className={styles.header}>
                <span className={styles.headerIcon}><Calendar size={24} color="var(--primary)" /></span>
                <div>
                  <h1>Schedule a Viewing</h1>
                  <p>Inquire about our premium fleet at our SBMA / Olongapo inspection site.</p>
                </div>
              </div>

              {/* Vehicle Interest */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}><Truck size={16} /> VEHICLE INTEREST</h3>
                <div className="form-group">
                  <label className="form-label">Truck Model & Yard Location</label>
                  <div className={styles.vehicleField}>
                    {truck.name} &middot; {truck.location}
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}><User size={16} /> CUSTOMER INFORMATION</h3>
                <div className={styles.twoCol}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input type="text" name="name" className="form-input" placeholder="Juan Dela Cruz" value={formData.name} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contact Number</label>
                    <input type="tel" name="phone" className="form-input" placeholder="09XX XXX XXXX" value={formData.phone} onChange={handleChange} required />
                  </div>
                </div>
                <div style={{ marginTop: '16px' }}>
                  <label className="form-label">Current Office/Base Location</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <input type="text" name="locationStreet" className="form-input" placeholder="Street / Building" value={formData.locationStreet} onChange={handleChange} />
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>e.g. Bldg 23, Argonaut Hwy</span>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <input type="text" name="locationBarangay" className="form-input" placeholder="Barangay" value={formData.locationBarangay} onChange={handleChange} />
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>e.g. Brgy. Cubi</span>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <input type="text" name="locationCity" className="form-input" placeholder="City / Municipality" value={formData.locationCity} onChange={handleChange} />
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>e.g. Olongapo City</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preferred Appointment */}
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}><Clock size={16} /> PREFERRED APPOINTMENT</h3>
                <div className={styles.twoCol}>
                  <div className="form-group">
                    <label className="form-label">Preferred Date</label>
                    <DatePickerInput
                      value={formData.date}
                      onChange={(v) => setFormData(prev => ({ ...prev, date: v }))}
                      minDate={new Date().toISOString().slice(0, 10)}
                      className="form-input"
                      style={{ width: '100%' }}
                      placeholder="Select preferred date"
                      title="Preferred date"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Preferred Time</label>
                    <input type="time" name="time" className="form-input" value={formData.time} onChange={handleChange} required />
                  </div>
                </div>
              </div>

              {/* Message */}
              <div className={styles.section}>
                <div className="form-group">
                  <label className="form-label">Specific Requirements / Message</label>
                  <textarea
                    name="message"
                    className="form-input form-textarea"
                    placeholder="I would like to inquire about the engine maintenance history for the SBMA unit..."
                    value={formData.message}
                    onChange={handleChange}
                  ></textarea>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={privacyConsent} onChange={(e) => setPrivacyConsent(e.target.checked)} required style={{ marginTop: '4px' }} />
                  <span style={{ fontSize: '0.85rem', lineHeight: '1.4', color: 'var(--text-muted)' }}>
                    I consent to the collection and processing of my personal data in accordance with the <a href="/legal/privacy" style={{ color: 'var(--primary)', textDecoration: 'underline' }} target="_blank" rel="noopener noreferrer">Data Privacy Policy</a>.
                  </span>
                </label>
              </div>

              <button type="submit" className={`btn btn-accent btn-full btn-lg ${styles.submitBtn}`} disabled={submitting}>
                {submitting ? 'Scheduling...' : 'Schedule Appointment'}
              </button>

              <p className={styles.disclaimer}>
                By scheduling, you agree to be contacted by our SBMA fleet sales representative.
              </p>
            </form>
          </div>
        </div>
    </Shell>
  );
}
