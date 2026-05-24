'use client';

import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { useRealtimeFirestore } from '@/lib/useRealtimeFirestore';
import { subscribeToBookings, updateBooking, addNotification } from '@/lib/firebaseService';
import { useToast } from '@/components/Toast';
import { useState, useMemo, useEffect } from 'react';
import { X, CreditCard, Banknote, CheckCircle, XCircle, Truck, MapPin, Clock, Package, Edit3, ArrowRight, Plus, Filter, Download, FileText, Receipt, FileImage, Upload } from 'lucide-react';
import { compressImage } from '@/lib/compressImage';

const STATUS_COLORS = {
  'Quote Requested': { bg: '#FFF8E1', text: '#E65100' },
  'Quoted': { bg: '#E3F2FD', text: '#1565C0' },
  'Pending': { bg: '#FFF8E1', text: '#E65100' },
  'Pending Payment': { bg: '#FFF8E1', text: '#E65100' },
  'Confirmed': { bg: '#E8F5E9', text: '#2E7D32' },
  'In Transit': { bg: '#E3F2FD', text: '#1565C0' },
  'Completed': { bg: '#EBF9F1', text: '#00522c' },
  'Cancelled': { bg: '#FFEBEE', text: '#C62828' },
  'Declined': { bg: '#FFEBEE', text: '#C62828' },
};

function StatusPill({ status }) {
  const colors = STATUS_COLORS[status] || { bg: '#f0f0f0', text: '#666' };
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      padding: '4px 12px',
      borderRadius: '100px',
      background: colors.bg,
      color: colors.text,
      fontSize: '0.72rem',
      fontFamily: 'Inter, sans-serif',
      fontWeight: 700,
      letterSpacing: '0.03em',
      whiteSpace: 'nowrap',
    }}>
      {status}
    </span>
  );
}

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

  useEffect(() => {
    if (selectedBooking) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [selectedBooking]);
  const [processing, setProcessing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editMessage, setEditMessage] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [receiptUploading, setReceiptUploading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const sendEmail = async (type, data) => {
    try {
      await fetch('/api/send-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: user?.email, type, data }) });
    } catch (err) { console.error('Email notification failed:', err); }
  };

  const filtered = useMemo(() => (bookings || []).filter(b => {
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
  }), [bookings, searchQuery, filterStatus, filterDate]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Stats derived from actual data
  const stats = useMemo(() => {
    const all = bookings || [];
    return {
      inTransit: all.filter(b => b.status === 'In Transit').length,
      pending: all.filter(b => ['Quote Requested', 'Quoted', 'Pending', 'Pending Payment'].includes(b.status)).length,
      completed: all.filter(b => b.status === 'Completed').length,
    };
  }, [bookings]);

  // Active shipments = in transit + confirmed + pending payment
  const activeShipments = useMemo(() =>
    (bookings || []).filter(b => ['In Transit', 'Confirmed', 'Pending Payment', 'Pending', 'Quoted'].includes(b.status)).slice(0, 5),
    [bookings]
  );

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
      await updateBooking(selectedBooking.id, { editRequest: { message: editMessage, requestedAt: now.toISOString(), status: 'Pending' } });
      await addNotification({ title: 'Edit Request Received', message: `${user?.displayName || 'User'} requested an edit for booking ${selectedBooking.id.slice(-8)}: "${editMessage}"`, type: 'booking', isNew: true, time: timeString, forAdmin: true, userId: 'admin', userEmail: user?.email || '' });
      addToast('Edit request submitted! Our team will review and contact you.', 'success');
      setShowEditModal(false);
      setEditMessage('');
    } catch { addToast('Failed to submit edit request.', 'error'); }
    setEditSubmitting(false);
  };

  const handleAcceptQuote = (booking) => { setShowPaymentModal(booking); setPaymentMethod('cod'); };

  const handleConfirmPayment = async () => {
    if (!showPaymentModal) return;
    setProcessing(true);
    const booking = showPaymentModal;
    const now = new Date();
    const timeString = now.toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    if (paymentMethod === 'stripe') {
      try {
        await updateBooking(booking.id, { status: 'Pending Payment', paymentMethod: 'stripe', acceptedAt: now.toISOString() });
        const res = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'booking', fleetName: booking.truckRoute, amount: booking.quotedAmount, pickup: booking.pickup, delivery: booking.delivery, date: booking.date, bookingId: booking.id, userId: user?.uid || '' }) });
        const { url, error } = await res.json();
        if (error || !url) throw new Error(error || 'No checkout URL returned');
        await addNotification({ title: 'Quote Accepted — Online Payment', message: `${user?.displayName || 'User'} accepted the quote for ${booking.truckRoute} and is paying PHP ${booking.quotedAmount?.toLocaleString()} via Stripe.`, type: 'booking', isNew: true, time: timeString, forAdmin: true, userId: 'admin' });
        sendEmail('quote_accepted', { bookingId: booking.id.slice(-8), truckRoute: booking.truckRoute, pickup: booking.pickup, delivery: booking.delivery, date: booking.date, amount: booking.quotedAmount, paymentMethod: 'stripe' });
        window.location.href = url; return;
      } catch { addToast('Payment failed. Please try again.', 'error'); }
    } else {
      try {
        await updateBooking(booking.id, { status: 'Confirmed', paymentMethod: 'cod', acceptedAt: now.toISOString(), paidAt: now.toISOString() });
        await addNotification({ title: 'Booking Confirmed', message: `Your booking for ${booking.truckRoute} has been confirmed. Amount: PHP ${booking.quotedAmount?.toLocaleString()}. Payment: Cash on Delivery.`, type: 'booking', isNew: true, time: timeString, userId: user?.uid });
        await addNotification({ title: 'Quote Accepted — Cash on Delivery', message: `${user?.displayName || 'User'} accepted the quote for ${booking.truckRoute}. Amount: PHP ${booking.quotedAmount?.toLocaleString()}. Payment method: COD.`, type: 'booking', isNew: true, time: timeString, forAdmin: true, userId: 'admin' });
        addToast('Booking confirmed! Payment will be collected on delivery.', 'success');
        sendEmail('quote_accepted', { bookingId: booking.id.slice(-8), truckRoute: booking.truckRoute, pickup: booking.pickup, delivery: booking.delivery, date: booking.date, amount: booking.quotedAmount, paymentMethod: 'cod' });
        sendEmail('booking_invoice', { bookingId: booking.id.slice(-8), userName: user?.displayName || 'Customer', userEmail: user?.email || '', truckRoute: booking.truckRoute, pickup: booking.pickup, delivery: booking.delivery, date: booking.date, amount: booking.quotedAmount, paymentMethod: 'cod' });
        setSelectedBooking(null);
      } catch { addToast('Failed to confirm booking.', 'error'); }
    }
    setProcessing(false);
    setShowPaymentModal(null);
  };

  const canRequestEdit = (status) => !['Completed', 'Cancelled', 'Declined'].includes(status);

  return (
    <DashboardLayout>
      {/* ── Request Edit Modal ── */}
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
              <textarea className="form-input form-textarea" placeholder="e.g. Change pickup date to May 15, update delivery address to Rizal Ave. Olongapo..." value={editMessage} onChange={e => setEditMessage(e.target.value)} rows={4} />
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button className="btn btn-outline btn-full" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="btn btn-accent btn-full" onClick={handleRequestEdit} disabled={editSubmitting}>{editSubmitting ? 'Submitting...' : 'Submit Edit Request'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Payment Modal ── */}
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
                <div className="payment-option-radio" />
                <div className="payment-option-icon"><Banknote size={22} color="var(--success)" /></div>
                <div className="payment-option-info"><h4>Cash on Delivery</h4><p>Pay in cash upon service completion</p></div>
              </div>
              <div className={`payment-option ${paymentMethod === 'stripe' ? 'selected' : ''}`} onClick={() => setPaymentMethod('stripe')}>
                <div className="payment-option-radio" />
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

      {/* ── Page Header ── */}
      <div className="animate-slide-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '2.25rem', fontWeight: 800, color: '#181d19', margin: '0 0 6px', letterSpacing: '-0.01em' }}>My Bookings</h1>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '1rem', color: '#3f4941', margin: 0 }}>Manage your active shipments and review past deliveries.</p>
        </div>
        <Link
          href="/dashboard/book"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: '#00522c', color: '#ffffff',
            padding: '12px 24px', borderRadius: '8px',
            fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '0.875rem',
            textDecoration: 'none',
            boxShadow: '0 2px 8px rgba(0,82,44,0.2)',
            transition: 'all 0.2s ease',
          }}
        >
          <Plus size={18} /> Book New Truck
        </Link>
      </div>

      {/* ── Bento Grid — Active Shipments + Fleet Status ── */}
      <div className="animate-slide-up delay-100" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', marginBottom: '24px' }}>

        {/* Active Shipments card */}
        <div style={{ background: '#ffffff', border: '1px solid #bec9be', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: '#181d19', margin: 0 }}>Active Shipments</h2>
            <button
              onClick={() => setFilterStatus('all')}
              style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.825rem', fontWeight: 700, color: '#00522c', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              View All
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '32px', color: '#6f7a70', fontFamily: 'Inter, sans-serif', fontSize: '0.875rem' }}>Loading shipments...</div>
            ) : activeShipments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: '#6f7a70', fontFamily: 'Inter, sans-serif', fontSize: '0.875rem' }}>
                No active shipments.{' '}
                <Link href="/dashboard/book" style={{ color: '#00522c', fontWeight: 700 }}>Book your first truck →</Link>
              </div>
            ) : activeShipments.map(booking => {
              const isInTransit = booking.status === 'In Transit';
              const isPending = ['Quote Requested', 'Quoted', 'Pending'].includes(booking.status);
              const iconBg = isInTransit ? '#E3F2FD' : isPending ? '#FFF8E1' : '#EBF9F1';
              const iconColor = isInTransit ? '#1565C0' : isPending ? '#E65100' : '#00522c';
              return (
                <div
                  key={booking.id}
                  onClick={() => setSelectedBooking(booking)}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '14px 16px', border: '1px solid #bec9be', borderRadius: '10px',
                    background: selectedBooking?.id === booking.id ? '#EBF9F1' : '#f6fbf3',
                    cursor: 'pointer', transition: 'all 0.15s ease',
                    borderColor: selectedBooking?.id === booking.id ? '#00522c' : '#bec9be',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Truck size={20} color={iconColor} />
                    </div>
                    <div>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem', fontWeight: 700, color: '#5f5e5e', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 2px' }}>
                        {booking.id.slice(-8)}
                      </p>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', fontWeight: 700, color: '#181d19', margin: '0 0 4px' }}>{booking.truckRoute}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'Inter, sans-serif', fontSize: '0.78rem', color: '#5f5e5e' }}>
                        <MapPin size={11} />
                        <span>{(booking.pickupCity || booking.pickup || '—').slice(0, 16)}</span>
                        <ArrowRight size={11} />
                        <MapPin size={11} />
                        <span>{(booking.deliveryCity || booking.delivery || '—').slice(0, 16)}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                    <StatusPill status={booking.status} />
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', color: '#6f7a70', margin: 0 }}>
                      {booking.date || '—'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column: Fleet Status + Recent Docs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Fleet Status */}
          <div style={{ background: '#00522c', borderRadius: '12px', padding: '24px', color: '#ffffff', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: '-16px', top: '-16px', opacity: 0.08, fontSize: '7rem', lineHeight: 1 }}>📦</div>
            <h3 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1.1rem', fontWeight: 700, margin: '0 0 6px', position: 'relative', zIndex: 1 }}>Fleet Status</h3>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.8rem', color: '#80d99d', margin: '0 0 20px', position: 'relative', zIndex: 1 }}>Real-time overview of your booked vehicles.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', position: 'relative', zIndex: 1 }}>
              <div>
                <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '2rem', fontWeight: 800, margin: '0 0 2px' }}>{stats.inTransit}</p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9bf6b7', margin: 0 }}>IN TRANSIT</p>
              </div>
              <div>
                <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '2rem', fontWeight: 800, margin: '0 0 2px' }}>{stats.pending}</p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9bf6b7', margin: 0 }}>PENDING</p>
              </div>
              <div style={{ gridColumn: '1 / -1', paddingTop: '16px', borderTop: '1px solid rgba(155, 246, 183, 0.3)' }}>
                <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '2rem', fontWeight: 800, margin: '0 0 2px' }}>{stats.completed}</p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9bf6b7', margin: 0 }}>COMPLETED ALL TIME</p>
              </div>
            </div>
          </div>

          {/* Recent Documents placeholder */}
          <div style={{ background: '#ffffff', border: '1px solid #bec9be', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', flex: 1 }}>
            <h3 style={{ fontFamily: 'Inter, sans-serif', fontSize: '1rem', fontWeight: 700, color: '#181d19', margin: '0 0 16px' }}>Recent Documents</h3>
            {(bookings || []).filter(b => b.status === 'Completed').slice(0, 2).length > 0 ? (
              (bookings || []).filter(b => b.status === 'Completed').slice(0, 2).map(b => (
                <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: '6px', cursor: 'pointer', transition: 'background 0.15s' }}>
                  <Receipt size={18} color="#6f7a70" />
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.825rem', color: '#181d19', flex: 1 }}>Invoice #{b.id.slice(-6)}</span>
                  <Download size={16} color="#00522c" />
                </div>
              ))
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { icon: FileText, label: 'BOL - Latest booking' },
                  { icon: Receipt, label: 'Invoice summary' },
                ].map((doc, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: '6px', opacity: 0.45 }}>
                    <doc.icon size={18} color="#6f7a70" />
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.825rem', color: '#3f4941', flex: 1 }}>{doc.label}</span>
                    <Download size={16} color="#bec9be" />
                  </div>
                ))}
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', color: '#6f7a70', marginTop: '4px' }}>Documents appear when bookings are completed.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Booking History Table ── */}
      <div className="animate-slide-up delay-200" style={{ background: '#ffffff', border: '1px solid #bec9be', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
        {/* Table header with filters */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #bec9be', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: '#181d19', margin: 0 }}>Booking History</h2>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search */}
            <input
              type="text"
              placeholder="Search bookings…"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              style={{
                height: '36px', padding: '0 12px', border: '1.5px solid #bec9be', borderRadius: '8px',
                fontFamily: 'Inter, sans-serif', fontSize: '0.825rem', color: '#181d19', background: '#f6fbf3',
                width: '200px', outline: 'none',
              }}
            />
            {/* Status filter */}
            <select
              value={filterStatus}
              onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              style={{
                height: '36px', padding: '0 12px', border: '1.5px solid #bec9be', borderRadius: '8px',
                fontFamily: 'Inter, sans-serif', fontSize: '0.825rem', color: '#181d19', background: '#f6fbf3',
                cursor: 'pointer', outline: 'none',
              }}
            >
              <option value="all">All Statuses</option>
              {['quote requested', 'quoted', 'confirmed', 'pending payment', 'in transit', 'completed', 'cancelled', 'declined'].map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
            {/* Date filter */}
            <input
              type="date"
              value={filterDate}
              onChange={e => { setFilterDate(e.target.value); setCurrentPage(1); }}
              style={{
                height: '36px', padding: '0 12px', border: '1.5px solid #bec9be', borderRadius: '8px',
                fontFamily: 'Inter, sans-serif', fontSize: '0.825rem', color: '#181d19', background: '#f6fbf3',
                outline: 'none',
              }}
            />
            {filterDate && (
              <button style={{ background: 'none', color: '#6f7a70', cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => { setFilterDate(''); setCurrentPage(1); }}>
                <X size={14} />
              </button>
            )}
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', color: '#6f7a70', whiteSpace: 'nowrap' }}>
              {filtered.length} record{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="table-container">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f0f5ee' }}>
                {['BOOKING ID', 'DATE', 'ROUTE', 'TRUCK TYPE', 'STATUS', 'AMOUNT', 'ACTION'].map(col => (
                  <th key={col} style={{
                    textAlign: 'left', padding: '12px 20px',
                    fontFamily: 'Inter, sans-serif', fontSize: '0.68rem', fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: '0.05em', color: '#5f5e5e',
                    borderBottom: '1px solid #bec9be',
                    whiteSpace: 'nowrap',
                  }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px', fontFamily: 'Inter, sans-serif', color: '#6f7a70' }}>Loading bookings…</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '48px', fontFamily: 'Inter, sans-serif', color: '#6f7a70' }}>
                    {searchQuery || filterStatus !== 'all' || filterDate
                      ? 'No bookings match your filters.'
                      : <>No bookings yet. <Link href="/dashboard/book" style={{ color: '#00522c', fontWeight: 700 }}>Start by requesting a quote →</Link></>}
                  </td>
                </tr>
              ) : paginated.map((booking, idx) => (
                <tr
                  key={booking.id}
                  className="hoverable animate-fade-in"
                  style={{
                    borderBottom: '1px solid #ebefe8',
                    background: selectedBooking?.id === booking.id ? '#EBF9F1' : 'transparent',
                    animationDelay: `${idx * 50}ms`
                  }}
                  onClick={() => setSelectedBooking(selectedBooking?.id === booking.id ? null : booking)}
                >
                  <td style={{ padding: '16px 20px' }}>
                    <strong style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem', color: '#00522c', letterSpacing: '0.02em' }}>
                      #{booking.id.slice(-8)}
                    </strong>
                  </td>
                  <td style={{ padding: '16px 20px', fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: '#5f5e5e' }}>
                    {booking.date || '—'}
                  </td>
                  <td style={{ padding: '16px 20px', fontFamily: 'Inter, sans-serif', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#181d19' }}>
                      <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{booking.pickupCity || booking.pickup || '—'}</span>
                      <ArrowRight size={12} color="#6f7a70" style={{ flexShrink: 0 }} />
                      <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{booking.deliveryCity || booking.delivery || '—'}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: '#5f5e5e' }}>
                    {booking.truckRoute || '—'}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <StatusPill status={booking.status} />
                  </td>
                  <td style={{ padding: '16px 20px', fontFamily: 'Inter, sans-serif', fontSize: '0.875rem' }}>
                    {booking.quotedAmount
                      ? <strong style={{ color: '#00522c' }}>PHP {booking.quotedAmount?.toLocaleString()}</strong>
                      : <span style={{ color: '#9aaa9b', fontSize: '0.8rem' }}>Awaiting</span>}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <button
                      style={{
                        fontFamily: 'Inter, sans-serif', fontSize: '0.825rem', fontWeight: 700,
                        color: '#00522c', background: 'none', border: 'none', cursor: 'pointer',
                      }}
                      onClick={e => { e.stopPropagation(); setSelectedBooking(selectedBooking?.id === booking.id ? null : booking); }}
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', padding: '16px', borderTop: '1px solid #bec9be', background: '#f6fbf3' }}>
            <button 
              className="btn btn-outline btn-sm" 
              style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #bec9be', background: currentPage === 1 ? '#e0e6e0' : '#fff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span style={{ fontSize: '0.85rem', color: '#5f5e5e', fontFamily: 'Inter, sans-serif' }}>
              Page {currentPage} of {totalPages}
            </span>
            <button 
              className="btn btn-outline btn-sm" 
              style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #bec9be', background: currentPage === totalPages ? '#e0e6e0' : '#fff', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* ── Booking Detail Drawer ── */}
      {selectedBooking && (
        <>
          <div 
            className="animate-fade-in"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.2)', zIndex: 499, backdropFilter: 'blur(2px)' }} 
            onClick={() => setSelectedBooking(null)} 
          />
          <div className="animate-slide-right" style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '380px', background: '#ffffff', borderLeft: '1px solid #bec9be', boxShadow: '-4px 0 20px rgba(0,0,0,0.1)', zIndex: 500, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          {/* Drawer header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #ebefe8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f6fbf3', position: 'sticky', top: 0, zIndex: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <StatusPill status={selectedBooking.status} />
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', color: '#6f7a70' }}>#{selectedBooking.id.slice(-8)}</span>
            </div>
            <button style={{ background: 'none', color: '#6f7a70', display: 'flex', alignItems: 'center' }} onClick={() => setSelectedBooking(null)}>
              <X size={18} />
            </button>
          </div>

          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
            {/* Route */}
            <div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#5f5e5e', marginBottom: '10px' }}>Route Information</p>
              <div style={{ paddingLeft: '12px', borderLeft: '3px solid #00522c', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', color: '#6f7a70', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}><MapPin size={11} /> Pickup</p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', fontWeight: 600, color: '#181d19', margin: 0 }}>{selectedBooking.pickup || '—'}</p>
                </div>
                <div>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', color: '#6f7a70', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}><MapPin size={11} /> Delivery</p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', fontWeight: 600, color: '#181d19', margin: 0 }}>{selectedBooking.delivery || '—'}</p>
                </div>
              </div>
            </div>

            {/* Details */}
            <div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#5f5e5e', marginBottom: '10px' }}>Cargo &amp; Schedule</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[
                  { label: 'Vehicle', value: selectedBooking.truckRoute, icon: <Truck size={11} /> },
                  { label: 'Date', value: selectedBooking.date, icon: <Clock size={11} /> },
                  { label: 'Time', value: selectedBooking.time },
                  { label: 'Weight', value: selectedBooking.weight ? selectedBooking.weight + ' KG' : 'N/A', icon: <Package size={11} /> },
                  ...(selectedBooking.routeType ? [{ label: 'Route', value: selectedBooking.routeType }] : []),
                  ...(selectedBooking.cargoSize ? [{ label: 'Cargo Size', value: selectedBooking.cargoSize, span: true }] : []),
                ].map((item, i) => (
                  <div key={i} style={{ gridColumn: item.span ? '1 / -1' : undefined }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem', color: '#6f7a70', display: 'flex', alignItems: 'center', gap: '3px' }}>{item.icon} {item.label}</span>
                    <strong style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: '#181d19' }}>{item.value || '—'}</strong>
                  </div>
                ))}
              </div>
              {selectedBooking.notes && (
                <div style={{ marginTop: '12px', padding: '10px 12px', background: '#f0f5ee', borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '0.825rem', color: '#3f4941' }}>
                  <strong>Notes: </strong>{selectedBooking.notes}
                </div>
              )}
              {selectedBooking.editRequest && (
                <div style={{ marginTop: '12px', padding: '10px 12px', background: '#FFF8E1', borderRadius: '8px', border: '1px solid #F5A623' }}>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.72rem', fontWeight: 700, color: '#E65100', marginBottom: '4px' }}>EDIT REQUESTED</p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.825rem', color: '#795548' }}>{selectedBooking.editRequest.message}</p>
                </div>
              )}
            </div>

            {/* Quote Amount Display / Invoice Receipt */}
            {selectedBooking.quotedAmount && (
              <div style={{ marginBottom: '20px', padding: '16px', background: '#eaf4eb', borderRadius: '12px', border: '1px dashed #00522c' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#00522c', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                    <FileText size={16} /> INVOICE / RECEIPT
                  </h5>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#00522c', background: '#fff', padding: '2px 6px', borderRadius: '4px' }}>
                    SENT
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#3f4941', marginBottom: '12px', fontFamily: 'Inter, sans-serif' }}>
                  Invoice #{selectedBooking.id.slice(-6)} <br/>
                  Generated: {selectedBooking.quotedAt ? new Date(selectedBooking.quotedAt).toLocaleDateString() : 'N/A'}
                </p>
                <div style={{ textAlign: 'center', background: '#fff', padding: '12px', borderRadius: '6px' }}>
                  <p style={{ fontSize: '0.75rem', color: '#6f7a70', marginBottom: '2px', fontFamily: 'Inter, sans-serif' }}>TOTAL QUOTED AMOUNT</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#00522c', margin: 0, fontFamily: 'Manrope, sans-serif' }}>PHP {selectedBooking.quotedAmount?.toLocaleString()}</p>
                  {selectedBooking.paymentMethod && (
                    <span style={{
                      display: 'inline-block', marginTop: '8px', padding: '4px 12px', borderRadius: '100px',
                      background: selectedBooking.paymentMethod === 'stripe' ? '#E8F5E9' : '#FFF8E1',
                      color: selectedBooking.paymentMethod === 'stripe' ? '#2E7D32' : '#E65100',
                      fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', fontWeight: 700,
                    }}>
                      {selectedBooking.paymentMethod === 'stripe' ? 'Paid (Stripe)' : 'Cash on Delivery'}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Cash Receipt Upload — for COD payments */}
            {selectedBooking.paymentMethod === 'cod' && ['Confirmed', 'Completed', 'In Transit'].includes(selectedBooking.status) && (
              <div style={{ marginBottom: '16px', padding: '14px', background: '#f6fbf3', borderRadius: '12px', border: '1px solid #ebefe8' }}>
                <h5 style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', color: '#3f4941', fontFamily: 'Inter, sans-serif' }}>
                  <FileImage size={14} /> Proof of Payment / Receipt
                </h5>
                {selectedBooking.receiptUrl ? (
                  <div>
                    <img
                      src={selectedBooking.receiptUrl}
                      alt="Payment receipt"
                      style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #ebefe8', marginBottom: '8px' }}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <a href={selectedBooking.receiptUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm" style={{ flex: 1, fontSize: '0.75rem' }}>View Full</a>
                      <label className="btn btn-outline btn-sm" style={{ flex: 1, fontSize: '0.75rem', cursor: 'pointer', gap: '4px' }}>
                        <Upload size={12} /> Replace
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => {
                          const file = e.target.files[0];
                          if (!file) return;
                          setReceiptUploading(true);
                          try {
                            const result = await compressImage(file, 800, 0.7);
                            await updateBooking(selectedBooking.id, { receiptUrl: result.dataUrl });
                            setSelectedBooking(prev => prev ? { ...prev, receiptUrl: result.dataUrl } : null);
                            addToast('Receipt updated successfully.', 'success');
                            addNotification({
                              title: 'Payment Receipt Uploaded',
                              message: `User uploaded a receipt for booking ${selectedBooking.id.slice(-6)}`,
                              type: 'booking',
                              isNew: true,
                              time: new Date().toLocaleString('en-PH'),
                              role: 'admin'
                            });
                          } catch { addToast('Failed to upload receipt.', 'error'); }
                          setReceiptUploading(false);
                        }} />
                      </label>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px 10px', background: '#fff', borderRadius: '8px', border: '1px dashed #bec9be' }}>
                    <p style={{ fontSize: '0.75rem', color: '#6f7a70', marginBottom: '12px', fontFamily: 'Inter, sans-serif' }}>Please upload your proof of payment or bank deposit slip.</p>
                    <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      {receiptUploading ? <span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></span> : <Upload size={14} />}
                      {receiptUploading ? 'Uploading...' : 'Upload Receipt'}
                      <input type="file" accept="image/*" style={{ display: 'none' }} disabled={receiptUploading} onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        setReceiptUploading(true);
                        try {
                          const result = await compressImage(file, 800, 0.7);
                          await updateBooking(selectedBooking.id, { receiptUrl: result.dataUrl });
                          setSelectedBooking(prev => prev ? { ...prev, receiptUrl: result.dataUrl } : null);
                          addToast('Receipt uploaded successfully.', 'success');
                          addNotification({
                            title: 'Payment Receipt Uploaded',
                            message: `User uploaded a receipt for booking ${selectedBooking.id.slice(-6)}`,
                            type: 'booking',
                            isNew: true,
                            time: new Date().toLocaleString('en-PH'),
                            role: 'admin'
                          });
                        } catch { addToast('Failed to upload receipt.', 'error'); }
                        setReceiptUploading(false);
                      }} />
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            {selectedBooking.status === 'Quoted' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button className="btn btn-accent btn-full" style={{ gap: '6px' }} onClick={() => handleAcceptQuote(selectedBooking)} disabled={processing}>
                  <CheckCircle size={14} /> Accept Quote &amp; Choose Payment
                </button>
                <button className="btn btn-outline btn-full" style={{ gap: '6px', color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => handleDeclineQuote(selectedBooking)} disabled={processing}>
                  <XCircle size={14} /> Decline Quote
                </button>
              </div>
            )}

            {selectedBooking.status === 'Quote Requested' && (
              <div style={{ padding: '14px', background: '#FFF8E1', borderRadius: '8px', textAlign: 'center', fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: '#E65100', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <Clock size={16} />
                <p style={{ margin: 0 }}>Awaiting admin quote. You will be notified once the price is calculated.</p>
              </div>
            )}

            {canRequestEdit(selectedBooking.status) && (
              <button className="btn btn-outline btn-full" style={{ gap: '6px', fontSize: '0.85rem' }} onClick={() => setShowEditModal(true)}>
                <Edit3 size={14} /> Request a Booking Edit
              </button>
            )}
          </div>
        </div>
        </>
      )}
    </DashboardLayout>
  );
}
