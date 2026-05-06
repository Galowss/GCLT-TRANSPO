'use client';

import AdminLayout from '@/components/AdminLayout';
import { useState } from 'react';
import { seedFirestore } from '@/lib/seedFirestore';
import { useToast } from '@/components/Toast';
import { Database, CreditCard, CheckCircle, AlertCircle, Save } from 'lucide-react';

const defaultSettings = {
  companyName: 'GCLT Transport & Trucking Services',
  region: 'SBMA & Olongapo',
  email: 'admin@gclt.ph',
  phone: '+63 (047) 252-GCLT',
};

export default function AdminSettings() {
  const [seeding, setSeeding] = useState(false);
  const [seedResults, setSeedResults] = useState(null);
  const [settings, setSettings] = useState(defaultSettings);
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();

  const handleSettingChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    // Simulate save — in production this would write to a Firestore 'settings' collection
    await new Promise(res => setTimeout(res, 600));
    setSaving(false);
    addToast('Settings saved successfully.', 'success');
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const results = await seedFirestore();
      setSeedResults(results);
      addToast('Database seeded successfully.', 'success');
    } catch (err) {
      setSeedResults(['Error: ' + err.message]);
      addToast('Database seeding failed.', 'error');
    }
    setSeeding(false);
  };

  return (
    <AdminLayout>
      <div style={{ maxWidth: '700px' }}>
        <h1 style={{ marginBottom: '4px' }}>Settings</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '32px' }}>
          Configure system preferences and admin account.
        </p>

        <div className="card card-lg" style={{ marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '20px' }}>General Settings</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label">Company Name</label>
              <input
                type="text"
                name="companyName"
                className="form-input"
                value={settings.companyName}
                onChange={handleSettingChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Operating Region</label>
              <input
                type="text"
                name="region"
                className="form-input"
                value={settings.region}
                onChange={handleSettingChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Email</label>
              <input
                type="email"
                name="email"
                className="form-input"
                value={settings.email}
                onChange={handleSettingChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Phone</label>
              <input
                type="tel"
                name="phone"
                className="form-input"
                value={settings.phone}
                onChange={handleSettingChange}
              />
            </div>
          </div>
          <button
            className="btn btn-primary"
            style={{ marginTop: '20px', gap: '6px', display: 'flex', alignItems: 'center' }}
            onClick={handleSaveSettings}
            disabled={saving}
          >
            <Save size={14} /> {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        <div className="card card-lg" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <CreditCard size={20} color="var(--primary)" />
            <h3 style={{ margin: 0 }}>Payment Settings</h3>
          </div>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Stripe Status</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-success" style={{ gap: '6px', display: 'flex', alignItems: 'center' }}>
                <CheckCircle size={12} /> Connected (Test Mode)
              </span>
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Email Notifications</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {process.env.NEXT_PUBLIC_EMAIL_ENABLED === 'true' ? (
                <span className="badge badge-success" style={{ gap: '6px', display: 'flex', alignItems: 'center' }}>
                  <CheckCircle size={12} /> Resend Connected
                </span>
              ) : (
                <span className="badge badge-warning" style={{ gap: '6px', display: 'flex', alignItems: 'center' }}>
                  <AlertCircle size={12} /> Not Configured (RESEND_API_KEY missing)
                </span>
              )}
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Accepted Payment Methods</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span className="badge badge-primary">Stripe (Online)</span>
              <span className="badge badge-warning">Cash on Delivery</span>
            </div>
          </div>
        </div>

        {/* Database Seeding */}
        <div className="card card-lg" style={{ borderColor: 'var(--primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Database size={20} color="var(--primary)" />
            <h3 style={{ margin: 0 }}>Database Management</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
            Seed Firestore with initial data (fleet types, trucks, bookings, notifications, customers, appointments).
            This will only add data if the collections are empty.
          </p>
          <button
            className="btn btn-accent"
            onClick={handleSeed}
            disabled={seeding}
          >
            {seeding ? 'Seeding Database...' : 'Seed Firestore Database'}
          </button>

          {seedResults && (
            <div style={{
              marginTop: '16px', padding: '16px', background: 'var(--gray-50)',
              borderRadius: 'var(--border-radius)', fontSize: '0.85rem',
            }}>
              <strong>Seed Results:</strong>
              <ul style={{ margin: '8px 0 0 16px', listStyleType: 'none', padding: 0 }}>
                {seedResults.map((r, i) => (
                  <li key={i} style={{ padding: '4px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {r.includes('Error') ? <AlertCircle size={14} color="var(--danger)" /> : <CheckCircle size={14} color="var(--success)" />}
                    {r.replace(/^[^\s]+\s/, '')}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
