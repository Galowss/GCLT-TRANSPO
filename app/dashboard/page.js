'use client';

import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { useRealtimeFirestore } from '@/lib/useRealtimeFirestore';
import { subscribeToRecentBookings, subscribeToAppointments } from '@/lib/firebaseService';
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

const STAT_CONFIGS = [
  {
    title: 'Active Bookings',
    icon: Truck,
    accent: '#006d37',
    iconBg: 'rgba(0,109,55,0.12)',
    bgFrom: 'rgba(0,109,55,0.05)',
    filter: (b) => b.status !== 'Completed' && b.status !== 'Cancelled',
    meta: 'Current transport requests',
    source: 'bookings',
  },
  {
    title: 'Viewings',
    icon: Calendar,
    accent: '#0ea5e9',
    iconBg: 'rgba(14,165,233,0.12)',
    bgFrom: 'rgba(14,165,233,0.04)',
    filter: (a) => a.status !== 'Cancelled',
    meta: 'Fleet sales appointments',
    source: 'appointments',
  },
  {
    title: 'Pending',
    icon: Clock,
    accent: '#f59e0b',
    iconBg: 'rgba(245,158,11,0.12)',
    bgFrom: 'rgba(245,158,11,0.04)',
    filter: (b) => ['Pending', 'Pending Payment', 'Quote Requested', 'Quoted'].includes(b.status),
    meta: 'Awaiting confirmation',
    source: 'bookings',
  },
  {
    title: 'Completed',
    icon: TrendingUp,
    accent: '#27ae60',
    iconBg: 'rgba(39,174,96,0.12)',
    bgFrom: 'rgba(39,174,96,0.05)',
    filter: (b) => b.status === 'Completed',
    meta: 'Successfully delivered',
    source: 'bookings',
  },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { data: recentBookings, loading: bookingsLoading } = useRealtimeFirestore(
    (cb) => subscribeToRecentBookings(user?.uid, 5, cb),
    [user?.uid]
  );
  const { data: appointments } = useRealtimeFirestore(
    (cb) => subscribeToAppointments(user?.uid, cb),
    [user?.uid]
  );

  const getCount = (cfg) => {
    const src = cfg.source === 'appointments' ? appointments : recentBookings;
    return src?.filter(cfg.filter).length || 0;
  };

  return (
    <DashboardLayout>
      <div className={styles.pageEnter}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.welcome}>Welcome back, {user?.displayName?.split(' ')[0] || 'User'} 👋</h1>
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
          {STAT_CONFIGS.map((cfg) => {
            const Icon = cfg.icon;
            return (
              <div
                key={cfg.title}
                className={`card ${styles.statCard}`}
                style={{
                  '--stat-accent': cfg.accent,
                  '--stat-icon-bg': cfg.iconBg,
                  '--stat-bg-from': cfg.bgFrom,
                }}
              >
                <div className={styles.statCardInner}>
                  <div className={styles.statHeader}>
                    <span className={styles.statTitle}>{cfg.title}</span>
                    <span className={styles.statIcon}><Icon size={18} /></span>
                  </div>
                  <span className={styles.statValue}>{getCount(cfg)}</span>
                  <span className={styles.statMeta}>{cfg.meta}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className={styles.mainGrid}>
          {/* Bookings Table */}
          <div className={`card ${styles.bookingsCard}`}>
            <div className={styles.cardHeader}>
              <h3>Recent Booking Activity</h3>
              <Link href="/dashboard/bookings" className={styles.viewAll}>
                View All <ArrowRight size={13} />
              </Link>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Truck &amp; Route</th>
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
                        <div style={{ fontSize: '0.84rem' }}><span style={{ fontWeight: 600 }}>Pick-up:</span> {booking.pickup}</div>
                        <div style={{ fontSize: '0.79rem', color: 'var(--text-muted)' }}><span style={{ fontWeight: 600 }}>Drop-off:</span> {booking.delivery}</div>
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
                <MapPin size={14} /> From: SBMA Pier 15, Olongapo City
              </div>
              <Link href="/dashboard/book" className={styles.fastBookingBtn}>
                Book New Transfer
              </Link>
            </div>

            {/* Marketplace Quick Link */}
            <div className="card" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{
                  width: '38px', height: '38px',
                  background: 'linear-gradient(135deg, rgba(0,109,55,0.12), rgba(0,109,55,0.06))',
                  borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--primary)',
                }}>
                  <ShoppingBag size={18} />
                </div>
                <div>
                  <strong style={{ fontSize: '0.9rem' }}>Truck Marketplace</strong>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Browse available trucks for sale</div>
                </div>
              </div>
              <Link href="/trucks-for-sale" className="btn btn-outline btn-sm btn-full">
                View Marketplace
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
