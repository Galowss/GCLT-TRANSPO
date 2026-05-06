'use client';

import AdminLayout from '@/components/AdminLayout';
import { useState } from 'react';
import { useFirestore } from '@/lib/useFirestore';
import { getAllBookings, updateBooking, addNotification } from '@/lib/firebaseService';
import { compressImage } from '@/lib/compressImage';
import { useToast } from '@/components/Toast';
import { Download, Search, CheckCircle, XCircle, Clock, MoreHorizontal, Mail, DollarSign, Truck, Package, MapPin, Upload, FileImage } from 'lucide-react';

function exportToCsv(bookings) {
  const headers = ['ID', 'User', 'Vehicle Type', 'Pickup', 'Delivery', 'Date', 'Time', 'Weight', 'Size', 'Payment', 'Status', 'Quoted Amount'];
  const rows = bookings.map(b => [
    b.id,
    b.userName || (b.userId === 'anonymous' ? 'Guest' : b.userId.slice(0, 8)),
    b.truckRoute || b.truckConfig || '',
    b.pickup || '',
    b.delivery || '',
    b.date || '',
    b.time || '',
    b.weight || '',
    b.cargoSize || '',
    b.paymentMethod === 'stripe' ? 'Stripe' : 'COD',
    b.status || '',
    b.quotedAmount || '',
  ]);
  const csv = [headers, ...rows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `gclt-bookings-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const STATUS_COLORS = {
  'Quote Requested': '#F5A623',
  'Quoted': '#1565C0',
  'Pending': '#F5A623',
  'Pending Payment': '#F5A623',
  'Confirmed': '#2E7D32',
  'In Transit': '#1565C0',
  'Completed': '#27AE60',
  'Cancelled': '#E8451C',
  'Declined': '#E8451C',
};

export default function BookingManagement() {
  const { data: bookingsData, loading, refetch } = useFirestore(getAllBookings);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sendingNotif, setSendingNotif] = useState(false);
  const [quoteAmount, setQuoteAmount] = useState('');
  const [settingQuote, setSettingQuote] = useState(false);
  const [receiptUploading, setReceiptUploading] = useState(false);
  const { addToast } = useToast();

  // Send email notification helper
  const sendEmail = async (to, type, data) => {
    try {
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, type, data }),
      });
    } catch (err) {
      console.error('Email notification failed:', err);
    }
  };

  const filteredBookings = (bookingsData || []).filter(b => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      b.id.toLowerCase().includes(q) ||
      (b.truckRoute || '').toLowerCase().includes(q) ||
      (b.pickup || '').toLowerCase().includes(q) ||
      (b.delivery || '').toLowerCase().includes(q) ||
      (b.userName || '').toLowerCase().includes(q) ||
      (b.userId || '').toLowerCase().includes(q);
    const matchesStatus = filterStatus === 'all' || (b.status || '').toLowerCase() === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => STATUS_COLORS[status] || '#6B7280';
  const getStatusClass = (status) => {
    if (['Quote Requested', 'Quoted', 'Pending', 'Pending Payment'].includes(status)) return 'status-pending';
    if (['Confirmed', 'In Transit', 'Completed'].includes(status)) return 'status-confirmed';
    return 'status-declined';
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      const updates = { status: newStatus };
      if (newStatus === 'Completed') updates.completedAt = new Date().toISOString();
      await updateBooking(bookingId, updates);
      addToast(`Booking ${newStatus.toLowerCase()} successfully.`, 'success');
      refetch();
      setSelectedBooking(prev => prev ? { ...prev, status: newStatus } : null);

      // Send email notification for status change
      const booking = bookingsData?.find(b => b.id === bookingId);
      if (booking?.userEmail) {
        sendEmail(booking.userEmail, 'booking_status_update', {
          bookingId: bookingId.slice(-8),
          status: newStatus,
          truckRoute: booking.truckRoute,
          pickup: booking.pickup,
          delivery: booking.delivery,
        });
      }
    } catch (err) {
      addToast('Failed to update booking status.', 'error');
    }
  };

  const handleSetQuote = async () => {
    if (!selectedBooking || !quoteAmount || Number(quoteAmount) <= 0) {
      addToast('Please enter a valid quote amount.', 'error');
      return;
    }
    setSettingQuote(true);
    try {
      const amount = Number(quoteAmount);
      await updateBooking(selectedBooking.id, {
        status: 'Quoted',
        quotedAmount: amount,
        quotedAt: new Date().toISOString(),
      });

      const now = new Date();
      const timeString = now.toLocaleString('en-PH', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
      await addNotification({
        title: 'Quote Ready!',
        message: `Your transport quote for ${selectedBooking.truckRoute} (${selectedBooking.pickup} → ${selectedBooking.delivery}) is ready: PHP ${amount.toLocaleString()}. Go to My Bookings to accept and choose your payment method.`,
        type: 'booking',
        isNew: true,
        time: timeString,
        userId: selectedBooking.userId,
      });

      addToast(`Quote of PHP ${amount.toLocaleString()} sent to user.`, 'success');
      setSelectedBooking(prev => prev ? { ...prev, status: 'Quoted', quotedAmount: amount } : null);
      setQuoteAmount('');
      refetch();

      // Send email notification for quote
      if (selectedBooking.userEmail) {
        sendEmail(selectedBooking.userEmail, 'quote_sent', {
          userName: selectedBooking.userName || 'Customer',
          truckRoute: selectedBooking.truckRoute,
          pickup: selectedBooking.pickup,
          delivery: selectedBooking.delivery,
          amount: amount,
          bookingId: selectedBooking.id.slice(-8),
        });
      }
    } catch {
      addToast('Failed to set quote.', 'error');
    }
    setSettingQuote(false);
  };

  const handleSendNotification = async () => {
    if (!selectedBooking) return;
    setSendingNotif(true);
    try {
      const now = new Date();
      const timeString = now.toLocaleString('en-PH', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
      await addNotification({
        title: `Booking Update: ${selectedBooking.status}`,
        message: `Your booking (${selectedBooking.id.slice(-6)}) for ${selectedBooking.truckRoute} has been updated to: ${selectedBooking.status}.${selectedBooking.quotedAmount ? ' Amount: PHP ' + selectedBooking.quotedAmount.toLocaleString() : ''}`,
        type: 'booking',
        isNew: true,
        time: timeString,
        userId: selectedBooking.userId,
      });
      addToast('Notification sent to user.', 'success');
    } catch {
      addToast('Failed to send notification.', 'error');
    }
    setSendingNotif(false);
  };

  return (
    <AdminLayout>
      <div style={{ display: 'grid', gridTemplateColumns: selectedBooking ? '1fr 380px' : '1fr', gap: '24px', minHeight: 'calc(100vh - 150px)' }}>
        {/* Main Content */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <h1 style={{ marginBottom: '4px' }}>Booking Management</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Review, quote, and process logistics requests across the SBMA-Olongapo network.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn btn-outline btn-sm"
                style={{ gap: '6px' }}
                onClick={() => exportToCsv(filteredBookings)}
                disabled={!filteredBookings.length}
              >
                <Download size={14} /> Export CSV
              </button>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Search ID, user, truck, or route..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '36px', width: '100%' }}
              />
            </div>
            <select
              className="form-select"
              style={{ width: '170px' }}
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
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
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              {filteredBookings.length} of {bookingsData?.length || 0}
            </span>
          </div>

          {/* Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Vehicle Type</th>
                    <th>Route</th>
                    <th>Date &amp; Time</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="8" style={{ textAlign: 'center', padding: '32px' }}>Loading bookings...</td></tr>
                  ) : !filteredBookings.length ? (
                    <tr><td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      {searchQuery || filterStatus !== 'all' ? 'No bookings match your filter.' : 'No bookings found'}
                    </td></tr>
                  ) : filteredBookings.map((booking) => (
                    <tr
                      key={booking.id}
                      style={{
                        background: selectedBooking?.id === booking.id ? 'var(--primary-light)' : '',
                        cursor: 'pointer',
                      }}
                      onClick={() => { setSelectedBooking(booking); setQuoteAmount(booking.quotedAmount?.toString() || ''); }}
                    >
                      <td><strong style={{ color: 'var(--primary)' }}>{booking.id.slice(-6)}</strong></td>
                      <td>{booking.userName || (booking.userId === 'anonymous' ? 'Guest' : 'User: ' + booking.userId.slice(0, 6))}</td>
                      <td>{booking.truckRoute}</td>
                      <td style={{ fontSize: '0.8rem' }}>{booking.pickup} {booking.delivery}</td>
                      <td style={{ fontSize: '0.8rem' }}>{booking.date} {booking.time}</td>
                      <td>
                        {booking.quotedAmount ? (
                          <strong style={{ color: 'var(--primary)', fontSize: '0.85rem' }}>PHP {booking.quotedAmount?.toLocaleString()}</strong>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                        )}
                      </td>
                      <td>
                        <span className={`status ${getStatusClass(booking.status)}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-outline btn-sm" style={{ padding: '4px 8px' }}>
                          <MoreHorizontal size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Order Details Sidebar */}
        {selectedBooking && (
          <div className="card" style={{ padding: '0', height: 'fit-content', position: 'sticky', top: '88px' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="badge" style={{ background: getStatusColor(selectedBooking.status) + '20', color: getStatusColor(selectedBooking.status) }}>
                {selectedBooking.status}
              </span>
              <button style={{ background: 'none', fontSize: '1rem', color: 'var(--text-muted)' }} onClick={() => setSelectedBooking(null)}>
                <XCircle size={18} />
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              {/* Customer Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 700, fontSize: '1.1rem' }}>
                  {(selectedBooking.userName || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4>{selectedBooking.userName || (selectedBooking.userId === 'anonymous' ? 'Guest Booking' : 'User: ' + selectedBooking.userId.slice(0, 8))}</h4>
                  {selectedBooking.userEmail && (
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{selectedBooking.userEmail}</p>
                  )}
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{selectedBooking.id}</p>
                </div>
              </div>

              {/* Route Info */}
              <div style={{ marginBottom: '20px' }}>
                <h5 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  Route Information
                </h5>
                <div style={{ paddingLeft: '12px', borderLeft: '2px solid var(--primary)' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} /> Pickup Location</p>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '12px' }}>{selectedBooking.pickup}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} /> Delivery Location</p>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '12px' }}>{selectedBooking.delivery}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Notes: {selectedBooking.notes || 'None'}</p>
                </div>
              </div>

              {/* Vehicle, Timing & Cargo */}
              <div style={{ marginBottom: '20px' }}>
                <h5 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  Vehicle, Cargo &amp; Timing
                </h5>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem' }}>
                  <div><span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><Truck size={12} /> Vehicle</span><strong>{selectedBooking.truckRoute}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)', display: 'block' }}>Date</span><strong>{selectedBooking.date}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)', display: 'block' }}>Time Slot</span><strong>{selectedBooking.time}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)', display: 'block' }}>Weight</span><strong>{selectedBooking.weight ? selectedBooking.weight + ' KG' : 'N/A'}</strong></div>
                  {selectedBooking.cargoSize && (
                    <div style={{ gridColumn: '1 / -1' }}><span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><Package size={12} /> Dimensions</span><strong>{selectedBooking.cargoSize}</strong></div>
                  )}
                  {selectedBooking.routeType && (
                    <div><span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>Route</span><strong>{selectedBooking.routeType}</strong></div>
                  )}
                  <div><span style={{ color: 'var(--text-muted)', display: 'block' }}>Payment</span><strong>{selectedBooking.paymentMethod === 'stripe' ? 'Stripe' : selectedBooking.paymentMethod === 'cod' ? 'COD' : 'Not yet selected'}</strong></div>
                </div>
              </div>

              {/* Quote Amount Display or Input */}
              {selectedBooking.quotedAmount && selectedBooking.status !== 'Quote Requested' && (
                <div style={{ marginBottom: '20px', padding: '12px', background: 'var(--primary-light)', borderRadius: 'var(--border-radius)', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>QUOTED AMOUNT</p>
                  <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>PHP {selectedBooking.quotedAmount?.toLocaleString()}</p>
                </div>
              )}

              {/* Quote Input — for Quote Requested status */}
              {selectedBooking.status === 'Quote Requested' && (
                <div style={{ marginBottom: '20px', padding: '16px', background: '#FFF8E1', borderRadius: 'var(--border-radius)', border: '1px solid #F5A623' }}>
                  <h5 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: '#E65100' }}>
                    <DollarSign size={14} /> Set Quote for Customer
                  </h5>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>PHP</span>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="Enter amount"
                        value={quoteAmount}
                        onChange={e => setQuoteAmount(e.target.value)}
                        style={{ paddingLeft: '48px', width: '100%' }}
                        min="1"
                      />
                    </div>
                    <button
                      className="btn btn-accent"
                      onClick={handleSetQuote}
                      disabled={settingQuote || !quoteAmount}
                    >
                      {settingQuote ? '...' : 'Send Quote'}
                    </button>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                    The user will be notified and can accept/decline the quote.
                  </p>
                </div>
              )}

              {/* Status Actions */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                {selectedBooking.status === 'Confirmed' && (
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1, gap: '4px' }}
                    onClick={() => handleStatusChange(selectedBooking.id, 'In Transit')}
                  >
                    <Truck size={14} /> In Transit
                  </button>
                )}
                {(selectedBooking.status === 'Confirmed' || selectedBooking.status === 'In Transit') && (
                  <button
                    className="btn btn-success btn-sm"
                    style={{ flex: 1, gap: '4px' }}
                    onClick={() => handleStatusChange(selectedBooking.id, 'Completed')}
                  >
                    <CheckCircle size={14} /> Complete
                  </button>
                )}
                {!['Completed', 'Cancelled', 'Declined'].includes(selectedBooking.status) && (
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ gap: '4px', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                    onClick={() => handleStatusChange(selectedBooking.id, 'Cancelled')}
                  >
                    <XCircle size={14} /> Cancel
                  </button>
                )}
              </div>

              {/* Cash Receipt Upload — for COD payments */}
              {selectedBooking.paymentMethod === 'cod' && ['Confirmed', 'Completed', 'In Transit'].includes(selectedBooking.status) && (
                <div style={{ marginBottom: '16px', padding: '14px', background: 'var(--gray-50)', borderRadius: 'var(--border-radius)', border: '1px solid var(--gray-200)' }}>
                  <h5 style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                    <FileImage size={14} /> Proof of Payment / Receipt
                  </h5>
                  {selectedBooking.receiptUrl ? (
                    <div>
                      <img
                        src={selectedBooking.receiptUrl}
                        alt="Payment receipt"
                        style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--gray-200)', marginBottom: '8px' }}
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
                              addToast('Receipt updated.', 'success');
                              refetch();
                            } catch { addToast('Failed to upload receipt.', 'error'); }
                            setReceiptUploading(false);
                          }} />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <label style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                      padding: '20px', border: '2px dashed var(--gray-300)', borderRadius: 'var(--border-radius)',
                      cursor: 'pointer', textAlign: 'center',
                    }}>
                      <Upload size={20} color="var(--text-muted)" />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {receiptUploading ? 'Uploading...' : 'Click to attach receipt or proof of payment'}
                      </span>
                      <input type="file" accept="image/*" style={{ display: 'none' }} disabled={receiptUploading} onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        setReceiptUploading(true);
                        try {
                          const result = await compressImage(file, 800, 0.7);
                          await updateBooking(selectedBooking.id, { receiptUrl: result.dataUrl });
                          setSelectedBooking(prev => prev ? { ...prev, receiptUrl: result.dataUrl } : null);
                          addToast('Receipt attached successfully.', 'success');
                          refetch();
                        } catch { addToast('Failed to upload receipt.', 'error'); }
                        setReceiptUploading(false);
                      }} />
                    </label>
                  )}
                </div>
              )}

              {/* Notification Button */}
              <button
                className="btn btn-outline btn-full btn-sm"
                style={{ gap: '6px', marginTop: '4px' }}
                onClick={handleSendNotification}
                disabled={sendingNotif || selectedBooking.userId === 'anonymous'}
              >
                <Mail size={14} /> {sendingNotif ? 'Sending...' : 'Send Notification to User'}
              </button>
              {selectedBooking.userId === 'anonymous' && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '6px' }}>
                  Guest bookings cannot receive notifications.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
