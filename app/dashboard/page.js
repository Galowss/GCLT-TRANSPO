'use client';

import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { useFirestore } from '@/lib/useFirestore';
import { getRecentBookings, getAppointments } from '@/lib/firebaseService';
import { Truck, Calendar, Clock, TrendingUp, MapPin, ArrowRight, ShoppingBag } from 'lucide-react';
import styles from './dashboard.module.css';

function formatBookingDate(dateStr, timeStr) {
  if (!dateStr) return '—';
  try {
    const cleanDate = String(dateStr).trim();
    const cleanTime = timeStr && timeStr !== 'undefined' && timeStr !== 'null' ? String(timeStr).trim() : '';
    const d = new Date(cleanDate + (cleanTime ? 'T' + cleanTime : ''));
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
      + (cleanTime ? ' — ' + d.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true }) : '');
  } catch { return dateStr; }
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: recentBookings, loading: bookingsLoading } = useFirestore(
    () => getRecentBookings(user?.uid, 5),
    [user?.uid]
  );
  const { data: appointments } = useFirestore(
    () => getAppointments(user?.uid),
    [user?.uid]
  );

  return (
    <DashboardLayout>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.welcome}>Welcome back, {user?.displayName || 'User'}</h1>
          <p className={styles.subtitle}>
            Managing logistics for <strong>SBMA / Olongapo Port Region</strong>
          </p>
        </div>
        <div className={styles.headerActions}>
          <Link href="/dashboard/bookings" className="btn btn-outline btn-sm">
            View History
          </Link>
          <Link href="/dashboard/book" className="btn btn-accent btn-sm">
            Request Quote
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={`card ${styles.statCard}`}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Active Bookings</span>
            <span className={styles.statIcon} style={{ color: 'var(--primary)' }}><Truck size={20} /></span>
          </div>
          <span className={styles.statValue}>{recentBookings?.filter(b => b.status !== 'Completed' && b.status !== 'Cancelled').length || 0}</span>
          <span className={styles.statMeta}>Current active transport requests</span>
        </div>

        <div className={`card ${styles.statCard}`}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Scheduled Viewings</span>
            <span className={styles.statIcon} style={{ color: 'var(--accent)' }}><Calendar size={20} /></span>
          </div>
          <span className={styles.statValue}>{appointments?.filter(a => a.status !== 'Cancelled').length || 0}</span>
          <span className={styles.statMeta}>Fleet sales appointments</span>
        </div>

        <div className={`card ${styles.statCard}`}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Pending</span>
            <span className={styles.statIcon} style={{ color: '#F5A623' }}><Clock size={20} /></span>
          </div>
          <span className={styles.statValue}>{recentBookings?.filter(b => b.status === 'Pending' || b.status === 'Pending Payment' || b.status === 'Quote Requested' || b.status === 'Quoted').length || 0}</span>
          <span className={styles.statMeta}>Awaiting confirmation</span>
        </div>

        <div className={`card ${styles.statCard}`}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Completed</span>
            <span className={styles.statIcon} style={{ color: 'var(--success)' }}><TrendingUp size={20} /></span>
          </div>
          <span className={styles.statValue}>{recentBookings?.filter(b => b.status === 'Completed').length || 0}</span>
          <span className={styles.statMeta}>Successfully delivered</span>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className={styles.mainGrid}>
        {/* Bookings Table */}
        <div className={`card ${styles.bookingsCard}`}>
          <div className={styles.cardHeader}>
            <h3>Recent Booking Activity</h3>
            <Link href="/dashboard/bookings" className={styles.viewAll}>
              View All <ArrowRight size={14} />
            </Link>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Truck & Route</th>
                  <th>Pickup / Delivery</th>
                  <th>Scheduled Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bookingsLoading ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '32px' }}>Loading bookings...</td></tr>
                ) : !recentBookings?.length ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No bookings yet</td></tr>
                ) : recentBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td><strong>{booking.truckRoute || 'Transport'}</strong></td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}><span style={{ fontWeight: 600 }}>Pick-up:</span> {booking.pickup}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}><span style={{ fontWeight: 600 }}>Drop-off:</span> {booking.delivery}</div>
                    </td>
                    <td>{formatBookingDate(booking.date, booking.time)}</td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: (booking.statusColor || '#6B7280') + '20',
                          color: booking.statusColor || '#6B7280',
                        }}
                      >
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column */}
        <div className={styles.rightCol}>
          {/* Fast Booking */}
          <div className={styles.fastBooking}>
            <h3>Quick Booking</h3>
            <p>Ready to move cargo from Subic Bay?</p>
            <div className={styles.fastBookingField}>
              <MapPin size={16} /> From: SBMA Pier 15, Olongapo City
            </div>
            <Link href="/dashboard/book" className={styles.fastBookingBtn}>
              Book New Transfer
            </Link>
          </div>

          {/* Marketplace Quick Link */}
          <div className={`card`} style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ width: '40px', height: '40px', background: 'var(--primary-light)', borderRadius: 'var(--border-radius)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                <ShoppingBag size={20} />
              </div>
              <div>
                <strong style={{ fontSize: '0.95rem' }}>Truck Marketplace</strong>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Browse available trucks for sale</div>
              </div>
            </div>
            <Link href="/trucks-for-sale" className="btn btn-outline btn-sm btn-full">
              View Marketplace
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
