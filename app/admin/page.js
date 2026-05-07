'use client';

import AdminLayout from '@/components/AdminLayout';
import Link from 'next/link';
import { useState } from 'react';
import { useRealtimeFirestore } from '@/lib/useRealtimeFirestore';
import { subscribeToAllBookings } from '@/lib/firebaseService';
import { Truck, Clock, CheckCircle, ClipboardList, TrendingUp, TrendingDown, ArrowRight, BarChart3 } from 'lucide-react';

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

export default function AdminDashboard() {
  const { data: adminBookings, loading: bookingsLoading } = useRealtimeFirestore(
    (cb) => subscribeToAllBookings(cb)
  );
  const [statsPeriod, setStatsPeriod] = useState('monthly');

  const totalBookings = adminBookings?.length || 0;
  const pendingBookings = adminBookings?.filter(b => b.status === 'Pending' || b.status === 'Pending Payment' || b.status === 'Quote Requested' || b.status === 'Quoted').length || 0;
  const confirmedBookings = adminBookings?.filter(b => b.status === 'Confirmed' || b.status === 'In Transit').length || 0;
  const completedBookings = adminBookings?.filter(b => b.status === 'Completed').length || 0;

  return (
    <AdminLayout>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ color: 'var(--primary)', marginBottom: '4px' }}>Admin Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Regional Operations: SBMA & Olongapo Hub
          </p>
        </div>

      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        {[
          { title: 'Total Bookings', value: totalBookings, icon: Truck, color: 'var(--primary)', trend: '+12.5%', up: true },
          { title: 'Pending Requests', value: pendingBookings, icon: Clock, color: '#F5A623', trend: '+4.2%', up: true },
          { title: 'Active / Confirmed', value: confirmedBookings, icon: CheckCircle, color: 'var(--success)', trend: '-8.1%', up: false },
          { title: 'Completed', value: completedBookings, icon: ClipboardList, color: 'var(--primary-dark)', trend: '+15.3%', up: true },
        ].map((stat) => {
          const Icon = stat.icon;
          const TrendIcon = stat.up ? TrendingUp : TrendingDown;
          return (
            <div key={stat.title} className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{stat.title}</span>
                <span style={{ color: stat.color, background: `${stat.color}15`, padding: '8px', borderRadius: '8px' }}>
                  <Icon size={20} />
                </span>
              </div>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>{stat.value}</span>
              <span style={{ fontSize: '0.8rem', color: stat.up ? 'var(--success)' : 'var(--danger)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                <TrendIcon size={14} /> {stat.trend} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>vs last 30 days</span>
              </span>
            </div>
          );
        })}
      </div>

      {/* Statistics Period Toggle */}
      <div className="card" style={{ marginBottom: '32px', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'var(--primary-light)', padding: '10px', borderRadius: '12px', display: 'flex', color: 'var(--primary-dark)' }}>
              <BarChart3 size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '2px', color: 'var(--text-primary)' }}>Performance Overview</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>Revenue and booking conversion metrics</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '4px', background: 'var(--gray-100)', borderRadius: 'var(--border-radius)', padding: '4px' }}>
            {['weekly', 'monthly', 'yearly'].map(period => (
              <button
                key={period}
                onClick={() => setStatsPeriod(period)}
                style={{
                  padding: '8px 20px',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: statsPeriod === period ? 600 : 500,
                  background: statsPeriod === period ? 'var(--white)' : 'transparent',
                  color: statsPeriod === period ? 'var(--primary)' : 'var(--text-secondary)',
                  boxShadow: statsPeriod === period ? 'var(--shadow-sm)' : 'none',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                  textTransform: 'capitalize',
                }}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {/* Stats bars */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', background: 'var(--gray-50)', padding: '24px', borderRadius: 'var(--border-radius-lg)' }}>
          {[
            { label: 'Bookings Created', value: statsPeriod === 'weekly' ? 12 : statsPeriod === 'monthly' ? 48 : 576, color: 'var(--primary)' },
            { label: 'Revenue Generated', value: statsPeriod === 'weekly' ? '42.5K' : statsPeriod === 'monthly' ? '185K' : '2.2M', color: 'var(--success)', prefix: 'PHP ' },
            { label: 'Completion Rate', value: statsPeriod === 'weekly' ? '94%' : statsPeriod === 'monthly' ? '96%' : '97%', color: 'var(--accent)' },
          ].map(item => (
            <div key={item.label} style={{ textAlign: 'center', padding: '16px 0', borderRight: item.label !== 'Completion Rate' ? '1px solid var(--gray-200)' : 'none' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 800, color: item.color, display: 'block', lineHeight: 1.1, marginBottom: '8px' }}>
                <span style={{ fontSize: '1.25rem', opacity: 0.8, verticalAlign: 'middle', marginRight: '4px' }}>{item.prefix || ''}</span>
                {item.value}
              </span>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Booking Requests */}
      <div className="card" style={{ marginBottom: '32px', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '4px', color: 'var(--text-primary)' }}>Recent Booking Requests</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Latest activities in SBMA and Olongapo sectors.</p>
          </div>
          <Link href="/admin/bookings" className="btn btn-outline" style={{ fontSize: '0.85rem', padding: '8px 16px', gap: '6px' }}>
            View Full Registry <ArrowRight size={14} />
          </Link>
        </div>
        <div className="table-container">
          <table className="table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)' }}>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, borderBottom: '2px solid var(--gray-200)', borderRadius: '8px 0 0 0' }}>Customer</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, borderBottom: '2px solid var(--gray-200)' }}>Truck Type</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, borderBottom: '2px solid var(--gray-200)' }}>Route Details</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, borderBottom: '2px solid var(--gray-200)' }}>Preferred Date</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, borderBottom: '2px solid var(--gray-200)' }}>Payment</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, borderBottom: '2px solid var(--gray-200)', borderRadius: '0 8px 0 0' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {bookingsLoading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading bookings...</td></tr>
              ) : !adminBookings?.length ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>No recent bookings found</td></tr>
              ) : adminBookings.slice(0, 5).map((b) => (
                <tr key={b.id} style={{ transition: 'var(--transition)', ':hover': { background: 'var(--gray-50)' } }}>
                  <td style={{ padding: '16px', borderBottom: '1px solid var(--gray-100)' }}><strong>{b.userName || 'Guest'}</strong></td>
                  <td style={{ padding: '16px', borderBottom: '1px solid var(--gray-100)' }}><span className="badge" style={{ background: 'var(--gray-100)', color: 'var(--text-primary)' }}>{b.truckRoute || b.truckConfig}</span></td>
                  <td style={{ padding: '16px', borderBottom: '1px solid var(--gray-100)', fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Pick-up: {b.pickup}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>Drop-off: {b.delivery}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px', borderBottom: '1px solid var(--gray-100)', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{formatBookingDate(b.date, b.time)}</td>
                  <td style={{ padding: '16px', borderBottom: '1px solid var(--gray-100)' }}>
                    <span className="badge" style={{
                      background: b.paymentMethod === 'stripe' ? 'var(--success-light)' : 'var(--orange-light)',
                      color: b.paymentMethod === 'stripe' ? 'var(--success)' : 'var(--orange-dark)'
                    }}>
                      {b.paymentMethod === 'stripe' ? 'Stripe' : 'COD'}
                    </span>
                  </td>
                  <td style={{ padding: '16px', borderBottom: '1px solid var(--gray-100)' }}>
                    <span className={`status ${b.status === 'Pending' || b.status === 'Pending Payment' || b.status === 'Quote Requested' || b.status === 'Quoted' ? 'status-pending' : b.status === 'Confirmed' || b.status === 'In Transit' || b.status === 'Completed' ? 'status-confirmed' : 'status-declined'}`}>
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>


    </AdminLayout>
  );
}
