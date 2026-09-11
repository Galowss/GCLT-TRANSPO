'use client';

import AdminLayout from '@/components/AdminLayout';
import { useState } from 'react';
import { useToast } from '@/components/Toast';
import { CreditCard, CheckCircle, AlertCircle, Save } from 'lucide-react';

const defaultSettings = {
  companyName: 'GCLT Transport & Trucking Services',
  region: 'SBMA & Olongapo',
  email: 'admin@gclt.ph',
  phone: '+63 (047) 252-GCLT',
};

export default function AdminSettings() {
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
      </div>
    </AdminLayout>
  );
}
