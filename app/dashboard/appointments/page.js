'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/lib/AuthContext';
import { useRealtimeFirestore } from '@/lib/useRealtimeFirestore';
import { subscribeToAppointments } from '@/lib/firebaseService';
import { useToast } from '@/components/Toast';
import { Calendar, MapPin, Clock, Phone } from 'lucide-react';
import { useState } from 'react';

// Status pill style consistent with the rest of the dashboard card system
const STATUS_STYLES = {
  Pending:   { bg: '#FFF8E1', text: '#E65100', border: '#F5A623' },
  Confirmed: { bg: '#E8F5E9', text: '#2E7D32', border: '#2E7D32' },
  Cancelled: { bg: '#FFEBEE', text: '#C62828', border: '#C62828' },
};

const FILTER_OPTIONS = ['All', 'Pending', 'Confirmed', 'Cancelled'];

export default function Appointments() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const { data: appointments, loading } = useRealtimeFirestore(
    (cb) => subscribeToAppointments(user?.uid, cb),
    [user?.uid]
  );
  const [filterStatus, setFilterStatus] = useState('All');

  const filteredAppointments = (appointments || []).filter(apt =>
    filterStatus === 'All' || (apt.status || '') === filterStatus
  );

  const handleReschedule = (apt) => {
    addToast(
      `To reschedule your ${apt.truck} viewing, please call us at +63 (047) 252-GCLT or email support@gclt.ph`,
      'info',
      7000
    );
  };

  return (
    <DashboardLayout>
      <div style={{ marginBottom: '24px' }}>
        <h1>My Appointments</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Scheduled viewings for fleet sales inventory.
        </p>
      </div>

      {/* Status Filter Pills — card-layout appropriate, not table dropdown */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {FILTER_OPTIONS.map(opt => {
          const isActive = filterStatus === opt;
          const style = opt !== 'All' ? STATUS_STYLES[opt] : null;
          return (
            <button
              key={opt}
              onClick={() => setFilterStatus(opt)}
              style={{
                padding: '6px 16px',
                borderRadius: '100px',
                border: isActive
                  ? `1.5px solid ${style?.border || 'var(--primary)'}`
                  : '1.5px solid var(--gray-300)',
                background: isActive
                  ? (style?.bg || 'var(--primary-light)')
                  : 'transparent',
                color: isActive
                  ? (style?.text || 'var(--primary)')
                  : 'var(--text-muted)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              {opt}
              {opt !== 'All' && (
                <span style={{
                  fontSize: '0.7rem',
                  background: isActive ? (style?.text || 'var(--primary)') : 'var(--gray-300)',
                  color: isActive ? (style?.bg || 'var(--primary-light)') : 'var(--text-muted)',
                  borderRadius: '100px',
                  padding: '1px 6px',
                  fontWeight: 700,
                }}>
                  {(appointments || []).filter(a => (a.status || '') === opt).length}
                </span>
              )}
            </button>
          );
        })}
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', alignSelf: 'center', marginLeft: '4px' }}>
          {filteredAppointments.length} of {(appointments || []).length}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {loading ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
          </div>
        ) : !filteredAppointments.length ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <Calendar size={28} style={{ display: 'block', margin: '0 auto 12px' }} />
            {filterStatus !== 'All'
              ? `No ${filterStatus.toLowerCase()} appointments.`
              : (
                <>
                  <p>No appointments scheduled yet</p>
                  <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>
                    Browse our <a href="/dashboard/trucks" style={{ color: 'var(--primary)', fontWeight: 600 }}>Trucks for Sale</a> to schedule a viewing.
                  </p>
                </>
              )
            }
          </div>
        ) : filteredAppointments.map((apt) => (
          <div key={apt.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '48px', height: '48px', background: 'var(--primary-light)',
                borderRadius: 'var(--border-radius)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: 'var(--primary)'
              }}>
                <Calendar size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', marginBottom: '2px' }}>{apt.truck}</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={12} /> {apt.location}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Date</div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{apt.date}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Time</div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{apt.time}</div>
              </div>
              <span className={`badge ${apt.status === 'Confirmed' ? 'badge-success' : apt.status === 'Cancelled' ? 'badge-danger' : 'badge-warning'}`}>
                {apt.status}
              </span>
              <button
                className="btn btn-outline btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={() => handleReschedule(apt)}
              >
                <Phone size={12} /> Reschedule
              </button>
            </div>
          </div>
        ))}
      </div>

      {(appointments || []).length > 0 && (
        <div className="card" style={{ marginTop: '24px', padding: '16px 20px', background: 'var(--primary-light)', border: '1px solid var(--primary)', borderRadius: 'var(--border-radius)' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={14} />
            Need to reschedule? Call us at <strong>+63 (047) 252-GCLT</strong> or email <strong>support@gclt.ph</strong> at least 24 hours before your appointment.
          </p>
        </div>
      )}
    </DashboardLayout>
  );
}
