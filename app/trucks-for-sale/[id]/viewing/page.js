'use client';

import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useFirestore } from '@/lib/useFirestore';
import { getTruckById, addAppointment, addNotification } from '@/lib/firebaseService';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/Toast';
import { ArrowLeft, Truck, User, Clock, Calendar } from 'lucide-react';
import styles from './viewing.module.css';

export default function ScheduleViewing() {
  const params = useParams();
  const { user } = useAuth();
  const { addToast } = useToast();
  const { data: truck, loading: truckLoading } = useFirestore(
    () => getTruckById(params.id),
    [params.id]
  );
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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

    // Send email notification
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

    addToast(`Viewing appointment scheduled for ${truck?.name}. We will contact you to confirm.`, 'success');
    setSubmitting(false);
  };

  if (truckLoading || !truck) {
    return (
      <DashboardLayout>
        <div className="spinner-overlay" style={{ height: '60vh' }}>
          <div className="spinner"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <div className={styles.inner}>
          <Link href={`/trucks-for-sale/${truck.id}`} className={styles.backLink}>
            <ArrowLeft size={16} /> Return to Truck Details
          </Link>

          <form onSubmit={handleSubmit} className={styles.formCard}>
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
                  <input type="date" name="date" className="form-input" value={formData.date} onChange={handleChange} required />
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

            <button type="submit" className={`btn btn-accent btn-full btn-lg ${styles.submitBtn}`} disabled={submitting}>
              {submitting ? 'Scheduling...' : 'Schedule Appointment'}
            </button>

            <p className={styles.disclaimer}>
              By scheduling, you agree to be contacted by our SBMA fleet sales representative.
            </p>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
