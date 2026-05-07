'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/lib/AuthContext';
import { useRealtimeFirestore } from '@/lib/useRealtimeFirestore';
import { subscribeToAppointments } from '@/lib/firebaseService';
import { useToast } from '@/components/Toast';
import { Calendar, MapPin, Clock, Phone } from 'lucide-react';

export default function Appointments() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const { data: appointments, loading } = useRealtimeFirestore(
    (cb) => subscribeToAppointments(user?.uid, cb),
    [user?.uid]
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {loading ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
          </div>
        ) : !appointments?.length ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <Calendar size={28} style={{ display: 'block', margin: '0 auto 12px' }} />
            <p>No appointments scheduled yet</p>
            <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>
              Browse our <a href="/trucks-for-sale" style={{ color: 'var(--primary)', fontWeight: 600 }}>Trucks for Sale</a> to schedule a viewing.
            </p>
          </div>
        ) : appointments.map((apt) => (
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
              <span className={`badge ${apt.status === 'Confirmed' ? 'badge-success' : 'badge-warning'}`}>
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

      {appointments?.length > 0 && (
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
