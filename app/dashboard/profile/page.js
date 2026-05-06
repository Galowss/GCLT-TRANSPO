'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/Toast';
import { useState, useEffect } from 'react';
import { getUserProfile, updateUserProfile } from '@/lib/firebaseService';
import { User, MapPin } from 'lucide-react';
import styles from './profile.module.css';

export default function Profile() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phone: '',
    company: '',
    locationStreet: '',
    locationBarangay: '',
    locationCity: '',
  });

  useEffect(() => {
    if (user?.uid) {
      getUserProfile(user.uid).then(profile => {
        setFormData({
          displayName: profile?.displayName || user?.displayName || '',
          email: profile?.email || user?.email || '',
          phone: profile?.phone || '',
          company: profile?.company || '',
          locationStreet: profile?.locationStreet || '',
          locationBarangay: profile?.locationBarangay || '',
          locationCity: profile?.locationCity || profile?.location || profile?.address || '',
        });
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!user?.uid) return;
    setSaving(true);
    try {
      const locationFull = [formData.locationStreet, formData.locationBarangay, formData.locationCity].filter(Boolean).join(', ');
      await updateUserProfile(user.uid, {
        ...formData,
        location: locationFull,
      });
      addToast('Profile updated successfully.', 'success');
    } catch (err) {
      addToast('Failed to update profile. Please try again.', 'error');
    }
    setSaving(false);
  };

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          <span style={{ cursor: 'pointer' }}>Dashboard</span>
          <span>&rsaquo;</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Profile Settings</span>
        </div>

        <h1 className="title" style={{ fontSize: '2rem', marginBottom: '8px' }}>Profile Settings</h1>
        <p className="subtitle" style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '32px' }}>
          Manage your account information and notification preferences.
        </p>

        <div className="card card-lg" style={{ marginBottom: '24px', padding: '32px' }}>
          <div className={styles.profileHeader}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%', background: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--white)', flexShrink: 0,
              boxShadow: 'var(--shadow-sm)'
            }}>
              <User size={36} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{formData.displayName || 'User'}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '12px' }}>{formData.email}</p>
              <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '6px 12px' }}>
                <MapPin size={14} /> {user?.location || 'SBMA / Olongapo'}
              </span>
            </div>
          </div>

          <h4 style={{ fontSize: '1.1rem', marginBottom: '20px', color: 'var(--text-primary)' }}>Personal Information</h4>
          <div className={styles.profileGrid}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Display Name</label>
              <input type="text" name="displayName" className="form-input" value={formData.displayName} onChange={handleChange} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Email Address</label>
              <input type="email" name="email" className="form-input" value={formData.email} onChange={handleChange} readOnly style={{ background: 'var(--gray-50)', color: 'var(--text-muted)' }} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Phone Number</label>
              <input type="tel" name="phone" className="form-input" value={formData.phone} onChange={handleChange} placeholder="+63 917 123 4567" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Company</label>
              <input type="text" name="company" className="form-input" value={formData.company} onChange={handleChange} placeholder="Company name" />
            </div>
            
            <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
              <label className="form-label">Business Address</label>
              <div className={styles.locationGrid}>
                <div>
                  <input type="text" name="locationStreet" className="form-input" value={formData.locationStreet} onChange={handleChange} placeholder="Street / Building" />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>e.g. Bldg 23, Argonaut Hwy</span>
                </div>
                <div>
                  <input type="text" name="locationBarangay" className="form-input" value={formData.locationBarangay} onChange={handleChange} placeholder="Barangay" />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>e.g. Brgy. Cubi</span>
                </div>
                <div>
                  <input type="text" name="locationCity" className="form-input" value={formData.locationCity} onChange={handleChange} placeholder="City / Municipality" />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>e.g. Olongapo City</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            <button className="btn btn-outline btn-lg" style={{ minWidth: '120px' }}>Cancel</button>
            <button className="btn btn-primary btn-lg" style={{ minWidth: '160px' }} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className="card card-lg" style={{ padding: '32px' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Notification Preferences</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>Control what emails and alerts you receive from GCLT.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { id: 'notif1', title: 'Booking Confirmations', desc: 'Receive emails when your transport is scheduled' },
              { id: 'notif2', title: 'Delivery Status Updates', desc: 'Live tracking and waypoint updates' },
              { id: 'notif3', title: 'Payment Receipts', desc: 'Invoices and confirmation of payment' },
              { id: 'notif4', title: 'Port Area Alerts', desc: 'Important SBMA port advisories or delays' },
              { id: 'notif5', title: 'Fleet Sales Promotions', desc: 'Special offers on new truck arrivals' }
            ].map(pref => (
              <label key={pref.id} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '16px', background: 'var(--gray-50)', borderRadius: 'var(--border-radius)', cursor: 'pointer', border: '1px solid var(--gray-200)', transition: 'var(--transition)' }} className="hover:border-primary">
                <div>
                  <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>{pref.title}</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{pref.desc}</span>
                </div>
                <div style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                  <input type="checkbox" defaultChecked style={{ opacity: 0, width: 0, height: 0 }} id={pref.id} />
                  <span style={{
                    position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'var(--primary)', transition: '.4s', borderRadius: '34px'
                  }}>
                    <span style={{
                      position: 'absolute', content: '""', height: '18px', width: '18px',
                      left: '22px', bottom: '3px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%'
                    }}></span>
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
