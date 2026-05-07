'use client';

import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { useRealtimeFirestore } from '@/lib/useRealtimeFirestore';
import { subscribeToBookings, updateBooking, addNotification } from '@/lib/firebaseService';
import { useToast } from '@/components/Toast';
import { useState } from 'react';
import { X, CreditCard, Banknote, CheckCircle, XCircle, Truck, MapPin, Clock, Package, Edit3 } from 'lucide-react';

const STATUS_COLORS = {
  'Quote Requested': '#F5A623', 'Quoted': '#1565C0', 'Pending': '#F5A623',
  'Pending Payment': '#F5A623', 'Confirmed': '#2E7D32', 'In Transit': '#1565C0',
  'Completed': '#27AE60', 'Cancelled': '#E8451C', 'Declined': '#E8451C',
};

export default function MyBookings() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const { data: bookings, loading } = useRealtimeFirestore(
    (cb) => subscribeToBookings(user?.uid, cb),
    [user?.uid]
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [processing, setProcessing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editMessage, setEditMessage] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  const sendEmail = async (type, data) => {
    try {
      await fetch('/api/send-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: user?.email, type, data }) });
    } catch (err) { console.error('Email notification failed:', err); }
  };

  const filtered = (bookings || []).filter(b => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      b.id.toLowerCase().includes(q) ||
      (b.truckRoute || '').toLowerCase().includes(q) ||
      (b.pickup || '').toLowerCase().includes(q) ||
      (b.delivery || '').toLowerCase().includes(q) ||
      (b.quotedAmount?.toString() || '').includes(q) ||
      (b.date || '').includes(q);
    const matchesStatus = filterStatus === 'all' || (b.status || '').toLowerCase() === filterStatus;
    const matchesDate = !filterDate || b.date === filterDate;
    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusColor = (status) => STATUS_COLORS[status] || '#6B7280';

  const handleAcceptQuote = (booking) => { setShowPaymentModal(booking); setPaymentMethod('cod'); };

  const handleDeclineQuote = async (booking) => {
    if (!confirm('Are you sure you want to decline this quote?')) return;
    setProcessing(true);
    try {
      await updateBooking(booking.id, { status: 'Declined' });
      const now = new Date();
      const timeString = now.toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      await addNotification({ title: 'Quote Declined', message: `${user?.displayName || 'User'} has declined the quote for ${booking.truckRoute} (${booking.pickup} → ${booking.delivery}).`, type: 'booking', isNew: true, time: timeString, forAdmin: true, userId: 'admin' });
      addToast('Quote declined.', 'info');
      setSelectedBooking(null);
    } catch { addToast('Failed to decline quote.', 'error'); }
    setProcessing(false);
  };

  const handleRequestEdit = async () => {
    if (!editMessage.trim()) { addToast('Please describe what you want to change.', 'error'); return; }
    setEditSubmitting(true);
    try {
      const now = new Date();
      const timeString = now.toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      await updateBooking(selectedBooking.id, {
        editRequest: { message: editMessage, requestedAt: now.toISOString(), status: 'Pending' }
      });
      await addNotification({
        title: 'Edit Request Received',
        message: `${user?.displayName || 'User'} requested an edit for booking ${selectedBooking.id.slice(-8)}: "${editMessage}"`,
        type: 'booking', isNew: true, time: timeString, forAdmin: true, userId: 'admin', userEmail: user?.email || '',
      });
      addToast('Edit request submitted! Our team will review and contact you.', 'success');
      setShowEditModal(false); setEditMessage(''); refetch();
    } catch { addToast('Failed to submit edit request.', 'error'); }
    setEditSubmitting(false);
  };

  const handleConfirmPayment = async () => {
    if (!showPaymentModal) return;
    setProcessing(true);
    const booking = showPaymentModal;
    const now = new Date();
    const timeString = now.toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    if (paymentMethod === 'stripe') {
      try {
        await updateBooking(booking.id, { status: 'Pending Payment', paymentMethod: 'stripe', acceptedAt: new Date().toISOString() });
        const res = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'booking', fleetName: booking.truckRoute, amount: booking.quotedAmount, pickup: booking.pickup, delivery: booking.delivery, date: booking.date, bookingId: booking.id, userId: user?.uid || '' }) });
        const { url, error } = await res.json();
        if (error || !url) throw new Error(error || 'No checkout URL returned');
        await addNotification({ title: 'Quote Accepted — Online Payment', message: `${user?.displayName || 'User'} accepted the quote for ${booking.truckRoute} and is paying PHP ${booking.quotedAmount?.toLocaleString()} via Stripe.`, type: 'booking', isNew: true, time: timeString, forAdmin: true, userId: 'admin' });
        sendEmail('quote_accepted', { bookingId: booking.id.slice(-8), truckRoute: booking.truckRoute, pickup: booking.pickup, delivery: booking.delivery, date: booking.date, amount: booking.quotedAmount, paymentMethod: 'stripe' });
        window.location.href = url; return;
      } catch { addToast('Payment failed. Please try again.', 'error'); }
    } else {
      try {
        await updateBooking(booking.id, { status: 'Confirmed', paymentMethod: 'cod', acceptedAt: new Date().toISOString(), paidAt: new Date().toISOString() });
        await addNotification({ title: 'Booking Confirmed', message: `Your booking for ${booking.truckRoute} has been confirmed. Amount: PHP ${booking.quotedAmount?.toLocaleString()}. Payment: Cash on Delivery.`, type: 'booking', isNew: true, time: timeString, userId: user?.uid });
        await addNotification({ title: 'Quote Accepted — Cash on Delivery', message: `${user?.displayName || 'User'} accepted the quote for ${booking.truckRoute}. Amount: PHP ${booking.quotedAmount?.toLocaleString()}. Payment method: COD.`, type: 'booking', isNew: true, time: timeString, forAdmin: true, userId: 'admin' });
        addToast('Booking confirmed! Payment will be collected on delivery.', 'success');
        sendEmail('quote_accepted', { bookingId: booking.id.slice(-8), truckRoute: booking.truckRoute, pickup: booking.pickup, delivery: booking.delivery, date: booking.date, amount: booking.quotedAmount, paymentMethod: 'cod' });
        sendEmail('booking_invoice', { bookingId: booking.id.slice(-8), userName: user?.displayName || 'Customer', userEmail: user?.email || '', truckRoute: booking.truckRoute, pickup: booking.pickup, delivery: booking.delivery, date: booking.date, amount: booking.quotedAmount, paymentMethod: 'cod' });
        setSelectedBooking(null);
      } catch { addToast('Failed to confirm booking.', 'error'); }

    }
    setProcessing(false); setShowPaymentModal(null);
  };

  const canRequestEdit = (status) => !['Completed', 'Cancelled', 'Declined'].includes(status);

  return (
    <DashboardLayout>
      {/* Request Edit Modal */}
      {showEditModal && selectedBooking && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }} onClick={() => setShowEditModal(false)}>
          <div className="card card-lg" style={{ maxWidth: '480px', width: '100%', animation: 'fadeIn 0.2s ease' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Edit3 size={18} color="var(--primary)" /> Request a Booking Edit</h3>
              <button style={{ background: 'none', color: 'var(--text-muted)' }} onClick={() => setShowEditModal(false)}><X size={20} /></button>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Booking ID: <strong>{selectedBooking.id.slice(-8)}</strong> — {selectedBooking.truckRoute}</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>{selectedBooking.pickup} → {selectedBooking.delivery}</p>
            <div className="form-group">
              <label className="form-label">Describe the changes you need *</label>
              <textarea
                className="form-input form-textarea"
                placeholder="e.g. Change pickup date to May 15, update delivery address to Rizal Ave. Olongapo..."
                value={editMessage}
                onChange={e => setEditMessage(e.target.value)}
                rows={4}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button className="btn btn-outline btn-full" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="btn btn-accent btn-full" onClick={handleRequestEdit} disabled={editSubmitting}>
                {editSubmitting ? 'Submitting...' : 'Submit Edit Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1>My Bookings</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Track and manage all your transport bookings.</p>
        </div>
        <Link href="/dashboard/book" className="btn btn-accent">+ Request Quote</Link>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '14px 16px', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <input type="text" className="form-input" placeholder="Search by ID, route, date, or amount..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ flex: 1, minWidth: '180px' }} />
        <select className="form-select" style={{ minWidth: '150px', flex: '0 0 auto' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">Status: All</option>
          <option value="quote requested">Quote Requested</option>
          <option value="quoted">Quoted</option>
          <option value="confirmed">Confirmed</option>
          <option value="pending payment">Pending Payment</option>
          <option value="in transit">In Transit</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="declined">Declined</option>
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: '0 0 auto' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Date:</label>
          <input type="date" className="form-input" style={{ width: '145px', fontSize: '0.85rem' }} value={filterDate} onChange={e => setFilterDate(e.target.value)} />
          {filterDate && <button style={{ background: 'none', color: 'var(--text-muted)', padding: '2px 4px' }} onClick={() => setFilterDate('')}><X size={14} /></button>}
        </div>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          {filtered.length} booking{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Main Grid — stack on mobile */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedBooking ? '1fr 380px' : '1fr', gap: '24px' }} className="admin-booking-grid">
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Truck &amp; Route</th>
                  <th>Pickup / Delivery</th>
                  <th>Scheduled Date</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '32px' }}>Loading bookings...</td></tr>
                ) : !filtered.length ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    {searchQuery || filterStatus !== 'all' || filterDate
                      ? 'No bookings match your filters.' : 'No bookings yet. Start by requesting a quote.'}
                  </td></tr>
                ) : filtered.map((booking) => (
                  <tr key={booking.id} style={{ background: selectedBooking?.id === booking.id ? 'var(--primary-light)' : '', cursor: 'pointer' }} onClick={() => setSelectedBooking(booking)}>
                    <td><strong style={{ color: 'var(--primary)' }}>{booking.id.slice(-8)}</strong></td>
                    <td>{booking.truckRoute}</td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}><span style={{ fontWeight: 600 }}>Pick-up:</span> {booking.pickup}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}><span style={{ fontWeight: 600 }}>Drop-off:</span> {booking.delivery}</div>
                    </td>
                    <td>{booking.date}</td>
                    <td>
                      <span className="badge" style={{ background: getStatusColor(booking.status) + '20', color: getStatusColor(booking.status) }}>{booking.status}</span>
                    </td>
                    <td>
                      {booking.quotedAmount ? <strong style={{ color: 'var(--primary)' }}>PHP {booking.quotedAmount?.toLocaleString()}</strong> : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Awaiting quote</span>}
                    </td>
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); setSelectedBooking(booking); }}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Sidebar */}
        {selectedBooking && (
          <div className="card" style={{ padding: '0', height: 'fit-content', position: 'sticky', top: '88px' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="badge" style={{ background: getStatusColor(selectedBooking.status) + '20', color: getStatusColor(selectedBooking.status) }}>{selectedBooking.status}</span>
              <button style={{ background: 'none', fontSize: '1rem', color: 'var(--text-muted)' }} onClick={() => setSelectedBooking(null)}><X size={18} /></button>
            </div>

            <div style={{ padding: '20px' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '16px' }}>ID: {selectedBooking.id}</p>

              <div style={{ marginBottom: '20px' }}>
                <h5 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', marginBottom: '12px' }}>Route Information</h5>
                <div style={{ paddingLeft: '12px', borderLeft: '2px solid var(--primary)' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} /> Pickup</p>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '12px' }}>{selectedBooking.pickup}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} /> Delivery</p>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '12px' }}>{selectedBooking.delivery}</p>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h5 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', marginBottom: '12px' }}>Cargo &amp; Schedule</h5>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem' }}>
                  <div><span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><Truck size={12} /> Vehicle</span><strong>{selectedBooking.truckRoute}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> Date</span><strong>{selectedBooking.date}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)', display: 'block' }}>Time</span><strong>{selectedBooking.time}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)', display: 'block' }}>Weight</span><strong>{selectedBooking.weight ? selectedBooking.weight + ' KG' : 'N/A'}</strong></div>
                  {selectedBooking.routeType && <div><span style={{ color: 'var(--text-muted)', display: 'block' }}>Route</span><strong>{selectedBooking.routeType}</strong></div>}
                  {selectedBooking.cargoSize && <div style={{ gridColumn: '1 / -1' }}><span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><Package size={12} /> Size</span><strong>{selectedBooking.cargoSize}</strong></div>}
                </div>
                {selectedBooking.notes && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '12px', padding: '8px 12px', background: 'var(--gray-50)', borderRadius: 'var(--border-radius)' }}>Notes: {selectedBooking.notes}</p>}
                {selectedBooking.editRequest && (
                  <div style={{ marginTop: '12px', padding: '10px 12px', background: '#FFF8E1', borderRadius: 'var(--border-radius)', border: '1px solid #F5A623' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#E65100', marginBottom: '4px' }}>EDIT REQUESTED</p>
                    <p style={{ fontSize: '0.8rem', color: '#795548' }}>{selectedBooking.editRequest.message}</p>
                  </div>
                )}
              </div>

              {selectedBooking.quotedAmount && (
                <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--primary-light)', borderRadius: 'var(--border-radius)', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>QUOTED AMOUNT</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>PHP {selectedBooking.quotedAmount?.toLocaleString()}</p>
                  {selectedBooking.paymentMethod && (
                    <span className="badge" style={{ marginTop: '8px', background: selectedBooking.paymentMethod === 'stripe' ? '#E8F5E9' : '#FFF8E1', color: selectedBooking.paymentMethod === 'stripe' ? '#2E7D32' : '#E65100' }}>
                      {selectedBooking.paymentMethod === 'stripe' ? 'Paid (Stripe)' : 'Cash on Delivery'}
                    </span>
                  )}
                </div>
              )}

              {selectedBooking.status === 'Quoted' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button className="btn btn-accent btn-full" style={{ gap: '6px' }} onClick={() => handleAcceptQuote(selectedBooking)} disabled={processing}><CheckCircle size={14} /> Accept Quote &amp; Choose Payment</button>
                  <button className="btn btn-outline btn-full" style={{ gap: '6px', color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => handleDeclineQuote(selectedBooking)} disabled={processing}><XCircle size={14} /> Decline Quote</button>
                </div>
              )}

              {selectedBooking.status === 'Quote Requested' && (
                <div style={{ padding: '12px', background: 'var(--warning-light)', borderRadius: 'var(--border-radius)', textAlign: 'center', fontSize: '0.85rem', color: '#E65100' }}>
                  <Clock size={14} style={{ marginBottom: '4px' }} />
                  <p>Awaiting admin quote. You will be notified once the price is calculated.</p>
                </div>
              )}

              {/* Request Edit Button */}
              {canRequestEdit(selectedBooking.status) && (
                <button
                  className="btn btn-outline btn-full"
                  style={{ marginTop: '12px', gap: '6px', fontSize: '0.85rem' }}
                  onClick={() => setShowEditModal(true)}
                >
                  <Edit3 size={14} /> Request a Booking Edit
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }} onClick={() => setShowPaymentModal(null)}>
          <div className="card card-lg" style={{ maxWidth: '480px', width: '100%', animation: 'fadeIn 0.2s ease' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3>Choose Payment Method</h3>
              <button style={{ background: 'none', color: 'var(--text-muted)' }} onClick={() => setShowPaymentModal(null)}><X size={20} /></button>
            </div>
            <div style={{ padding: '16px', background: 'var(--primary-light)', borderRadius: 'var(--border-radius)', textAlign: 'center', marginBottom: '20px' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Amount to Pay</p>
              <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>PHP {showPaymentModal.quotedAmount?.toLocaleString()}</p>
            </div>
            <div className="payment-methods" style={{ marginBottom: '20px' }}>
              <div className={`payment-option ${paymentMethod === 'cod' ? 'selected' : ''}`} onClick={() => setPaymentMethod('cod')}>
                <div className="payment-option-radio"></div>
                <div className="payment-option-icon"><Banknote size={22} color="var(--success)" /></div>
                <div className="payment-option-info"><h4>Cash on Delivery</h4><p>Pay in cash upon service completion</p></div>
              </div>
              <div className={`payment-option ${paymentMethod === 'stripe' ? 'selected' : ''}`} onClick={() => setPaymentMethod('stripe')}>
                <div className="payment-option-radio"></div>
                <div className="payment-option-icon"><CreditCard size={22} color="var(--primary)" /></div>
                <div className="payment-option-info"><h4>Pay Online (Stripe)</h4><p>Pay securely with credit/debit card</p></div>
              </div>
            </div>
            <button className="btn btn-accent btn-full btn-lg" onClick={handleConfirmPayment} disabled={processing}>
              {processing ? 'Processing...' : paymentMethod === 'stripe' ? 'Proceed to Payment' : 'Confirm Booking (COD)'}
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
