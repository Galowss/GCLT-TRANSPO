'use client';

import AdminLayout from '@/components/AdminLayout';
import { useState } from 'react';
import { useRealtimeFirestore } from '@/lib/useRealtimeFirestore';
import { subscribeToAppointments, addNotification } from '@/lib/firebaseService';
import { useToast } from '@/components/Toast';
import { Calendar, CheckCircle, XCircle, X, MapPin, Clock, User, Phone, Truck } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function AdminAppointments() {
  const { data: appointments, loading } = useRealtimeFirestore(
    (cb) => subscribeToAppointments(null, cb)
  );
  const { addToast } = useToast();
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const handleStatusChange = async (aptId, newStatus) => {
    try {
      const docRef = doc(db, 'appointments', aptId);
      await updateDoc(docRef, { status: newStatus, updatedAt: serverTimestamp() });

      // Send notification to user
      if (selectedAppointment?.userId && selectedAppointment.userId !== 'anonymous') {
        const now = new Date();
        const timeString = now.toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        await addNotification({
          title: `Viewing ${newStatus}`,
          message: `Your viewing appointment for ${selectedAppointment.truck} has been ${newStatus.toLowerCase()}.${newStatus === 'Confirmed' ? ' Please arrive at ' + selectedAppointment.location + ' on ' + selectedAppointment.date + '.' : ''}`,
          type: 'appointment',
          isNew: true,
          time: timeString,
          userId: selectedAppointment.userId,
        });
      }

      addToast(`Appointment ${newStatus.toLowerCase()} successfully.`, 'success');
      setSelectedAppointment(prev => prev ? { ...prev, status: newStatus } : null);
      // listener auto-updates the table
    } catch (err) {
      addToast('Failed to update appointment.', 'error');
    }
  };

  return (
    <AdminLayout>
      <div style={{ display: 'grid', gridTemplateColumns: selectedAppointment ? '1fr 380px' : '1fr', gap: '24px', minHeight: 'calc(100vh - 150px)' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Calendar size={24} color="var(--primary)" /> Appointments
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Manage fleet viewing appointments from customers.</p>
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {(appointments || []).length} total appointment{(appointments || []).length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Customer</th>
                  <th>Truck</th>
                  <th>Location</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: '32px' }}>Loading appointments...</td></tr>
                ) : !appointments?.length ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    <Calendar size={28} style={{ display: 'block', margin: '0 auto 8px' }} />
                    No appointments found. They will appear here when users schedule viewings.
                  </td></tr>
                ) : appointments.map(a => (
                  <tr
                    key={a.id}
                    style={{
                      background: selectedAppointment?.id === a.id ? 'var(--primary-light)' : '',
                      cursor: 'pointer',
                    }}
                    onClick={() => setSelectedAppointment(a)}
                  >
                    <td><strong style={{ color: 'var(--primary)' }}>{a.id.slice(-6)}</strong></td>
                    <td>{a.customerName || a.customer || 'N/A'}</td>
                    <td>{a.truck}</td>
                    <td style={{ fontSize: '0.85rem' }}>{a.location}</td>
                    <td>{a.date}</td>
                    <td>{a.time}</td>
                    <td><span className={`status ${a.status === 'Confirmed' ? 'status-confirmed' : a.status === 'Cancelled' ? 'status-declined' : 'status-pending'}`}>{a.status}</span></td>
                    <td>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={(e) => { e.stopPropagation(); setSelectedAppointment(a); }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Sidebar */}
        {selectedAppointment && (
          <div className="card" style={{ padding: '0', height: 'fit-content', position: 'sticky', top: '88px' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className={`status ${selectedAppointment.status === 'Confirmed' ? 'status-confirmed' : selectedAppointment.status === 'Cancelled' ? 'status-declined' : 'status-pending'}`}>
                {selectedAppointment.status}
              </span>
              <button style={{ background: 'none', fontSize: '1rem', color: 'var(--text-muted)' }} onClick={() => setSelectedAppointment(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '16px' }}>ID: {selectedAppointment.id}</p>

              {/* Customer Info */}
              <div style={{ marginBottom: '20px' }}>
                <h5 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={12} /> Customer Information
                </h5>
                <div style={{ fontSize: '0.85rem' }}>
                  <p style={{ fontWeight: 600, marginBottom: '4px' }}>{selectedAppointment.customerName || selectedAppointment.customer || 'N/A'}</p>
                  {selectedAppointment.customerPhone && (
                    <p style={{ color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={12} /> {selectedAppointment.customerPhone}</p>
                  )}
                  {selectedAppointment.customerLocation && (
                    <p style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} /> {selectedAppointment.customerLocation}</p>
                  )}
                </div>
              </div>

              {/* Truck Info */}
              <div style={{ marginBottom: '20px' }}>
                <h5 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Truck size={12} /> Vehicle Interest
                </h5>
                <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>{selectedAppointment.truck}</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} /> {selectedAppointment.location}</p>
              </div>

              {/* Appointment Timing */}
              <div style={{ marginBottom: '20px' }}>
                <h5 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={12} /> Appointment Schedule
                </h5>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Date</span>
                    <strong>{selectedAppointment.date}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Time</span>
                    <strong>{selectedAppointment.time}</strong>
                  </div>
                </div>
              </div>

              {/* Message */}
              {selectedAppointment.message && (
                <div style={{ marginBottom: '20px', padding: '12px', background: 'var(--gray-50)', borderRadius: 'var(--border-radius)' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Customer Message:</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{selectedAppointment.message}</p>
                </div>
              )}

              {/* Actions */}
              {selectedAppointment.status !== 'Cancelled' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  {selectedAppointment.status !== 'Confirmed' && (
                    <button
                      className="btn btn-success btn-sm"
                      style={{ flex: 1, gap: '4px' }}
                      onClick={() => handleStatusChange(selectedAppointment.id, 'Confirmed')}
                    >
                      <CheckCircle size={14} /> Confirm
                    </button>
                  )}
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ flex: 1, gap: '4px', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                    onClick={() => handleStatusChange(selectedAppointment.id, 'Cancelled')}
                  >
                    <XCircle size={14} /> Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
