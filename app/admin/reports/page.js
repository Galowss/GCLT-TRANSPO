'use client';

import AdminLayout from '@/components/AdminLayout';
import { useRealtimeFirestore } from '@/lib/useRealtimeFirestore';
import { subscribeToAllBookings } from '@/lib/firebaseService';
import { useState, useMemo } from 'react';
import { Download, Printer, BarChart2, TrendingUp, Users, CheckCircle, XCircle, CreditCard, Truck } from 'lucide-react';

/* ── CSV Export ── */
function exportToCsv(bookings, rangeLabel) {
  const headers = ['Ref #', 'Customer', 'Vehicle Type', 'Pickup', 'Delivery', 'Date', 'Time', 'Qty', 'Weight', 'Route Type', 'Payment', 'Status', 'Amount (PHP)', 'Quoted At', 'Notes'];
  const rows = bookings.map(b => [
    b.refNumber || 'Legacy',
    b.userName || 'Guest',
    b.truckRoute || '',
    b.pickup || '',
    b.delivery || '',
    b.date || '',
    b.time && b.time !== 'undefined' ? b.time : '',
    b.truckQuantity || 1,
    b.weight || '',
    b.routeType || '',
    b.paymentMethod === 'stripe' ? 'Stripe' : 'COD',
    b.status || '',
    b.quotedAmount || '',
    b.quotedAt ? new Date(b.quotedAt).toLocaleDateString('en-PH') : '',
    b.notes || '',
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `gclt-report-${rangeLabel.replace(/\s/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── Helpers ── */
const STATUS_GROUPS = {
  active: ['Quote Requested', 'Quoted', 'Confirmed', 'Pending Payment', 'In Transit'],
  completed: ['Completed'],
  cancelled: ['Cancelled', 'Declined'],
};

function getMonthKey(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthKey(key) {
  if (!key) return '';
  const [y, m] = key.split('-');
  return new Date(Number(y), Number(m) - 1, 1).toLocaleString('en-PH', { month: 'short', year: 'numeric' });
}

export default function AdminReports() {
  const { data: allBookings, loading } = useRealtimeFirestore(cb => subscribeToAllBookings(cb));
  const [dateRange, setDateRange] = useState('30');

  /* ── Filter by date range ── */
  const bookings = useMemo(() => {
    if (!allBookings) return [];
    if (dateRange === 'all') return allBookings;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - Number(dateRange));
    return allBookings.filter(b => {
      if (!b.date) return false;
      return new Date(b.date) >= cutoff;
    });
  }, [allBookings, dateRange]);

  /* ── KPIs ── */
  const kpis = useMemo(() => {
    const total = bookings.length;
    const completed = bookings.filter(b => b.status === 'Completed').length;
    const active = bookings.filter(b => STATUS_GROUPS.active.includes(b.status)).length;
    const cancelled = bookings.filter(b => STATUS_GROUPS.cancelled.includes(b.status)).length;
    const revenue = bookings
      .filter(b => b.status === 'Completed' && b.quotedAmount)
      .reduce((sum, b) => sum + Number(b.quotedAmount), 0);
    const stripeCount = bookings.filter(b => b.paymentMethod === 'stripe').length;
    const codCount = bookings.filter(b => b.paymentMethod !== 'stripe' && b.paymentMethod).length;
    const avgQty = total > 0
      ? (bookings.reduce((s, b) => s + (Number(b.truckQuantity) || 1), 0) / total).toFixed(1)
      : 0;
    return { total, completed, active, cancelled, revenue, stripeCount, codCount, avgQty };
  }, [bookings]);

  /* ── Monthly breakdown ── */
  const monthlyData = useMemo(() => {
    const map = {};
    bookings.forEach(b => {
      const key = getMonthKey(b.date);
      if (!key) return;
      if (!map[key]) map[key] = { count: 0, revenue: 0 };
      map[key].count += 1;
      if (b.status === 'Completed' && b.quotedAmount) {
        map[key].revenue += Number(b.quotedAmount);
      }
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [bookings]);

  const maxCount = Math.max(...monthlyData.map(([, v]) => v.count), 1);

  /* ── Top routes ── */
  const topRoutes = useMemo(() => {
    const map = {};
    bookings.forEach(b => {
      if (!b.pickup || !b.delivery) return;
      const key = `${b.pickup} → ${b.delivery}`;
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).sort(([, a], [, b]) => b - a).slice(0, 5);
  }, [bookings]);

  /* ── Status breakdown ── */
  const statusBreakdown = useMemo(() => {
    const map = {};
    bookings.forEach(b => {
      const s = b.status || 'Unknown';
      map[s] = (map[s] || 0) + 1;
    });
    return Object.entries(map).sort(([, a], [, b]) => b - a);
  }, [bookings]);

  const rangeLabel = dateRange === '30' ? 'Last 30 Days' : dateRange === '90' ? 'Last 3 Months' : 'All Time';

  return (
    <AdminLayout>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .dashboard-topbar, aside, .sidebar-overlay { display: none !important; }
          .dashboard-main { margin: 0 !important; padding: 0 !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }} className="no-print">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <BarChart2 size={24} color="var(--primary)" /> Report Management
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Analytics, KPIs, and export tools for the GCLT booking platform.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            className="form-select"
            value={dateRange}
            onChange={e => setDateRange(e.target.value)}
            style={{ width: '170px' }}
          >
            <option value="30">Last 30 Days</option>
            <option value="90">Last 3 Months</option>
            <option value="all">All Time</option>
          </select>
          <button
            className="btn btn-outline btn-sm no-print"
            style={{ gap: '6px' }}
            onClick={() => exportToCsv(bookings, rangeLabel)}
            disabled={!bookings.length}
          >
            <Download size={14} /> Export CSV
          </button>
          <button
            className="btn btn-outline btn-sm no-print"
            style={{ gap: '6px' }}
            onClick={() => window.print()}
          >
            <Printer size={14} /> Print / PDF
          </button>
        </div>
      </div>

      {/* Period Badge */}
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontSize: '0.78rem', fontWeight: 700, padding: '4px 12px', borderRadius: '20px' }}>
          📅 {rangeLabel}
        </span>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {loading ? 'Loading...' : `${bookings.length} booking${bookings.length !== 1 ? 's' : ''} in this period`}
        </span>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Total Bookings', value: kpis.total, icon: <Truck size={18} />, color: 'var(--primary)', bg: 'var(--primary-light)' },
          { label: 'Completed', value: kpis.completed, icon: <CheckCircle size={18} />, color: '#2E7D32', bg: '#E8F5E9' },
          { label: 'Active / Pending', value: kpis.active, icon: <TrendingUp size={18} />, color: '#1565C0', bg: '#E3F2FD' },
          { label: 'Cancelled', value: kpis.cancelled, icon: <XCircle size={18} />, color: '#E8451C', bg: '#FFF0F0' },
          { label: 'Revenue (PHP)', value: `₱${kpis.revenue.toLocaleString()}`, icon: <CreditCard size={18} />, color: '#00522c', bg: '#f0f5ee', wide: true },
          { label: 'Avg. Trucks / Booking', value: kpis.avgQty, icon: <Truck size={18} />, color: '#6f7a70', bg: '#f6fbf3' },
        ].map((k, i) => (
          <div key={i} className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '14px', gridColumn: k.wide ? 'span 2' : undefined }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: k.bg, color: k.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {k.icon}
            </div>
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '3px' }}>{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Monthly Bookings Bar Chart */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart2 size={16} color="var(--primary)" /> Monthly Bookings
          </h3>
          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>Loading...</div>
          ) : monthlyData.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>No data in this period.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {monthlyData.map(([key, { count }]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem' }}>
                  <span style={{ width: '72px', flexShrink: 0, color: 'var(--text-muted)', fontWeight: 600 }}>{formatMonthKey(key)}</span>
                  <div style={{ flex: 1, height: '22px', background: 'var(--gray-100)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                    <div style={{
                      height: '100%',
                      width: `${(count / maxCount) * 100}%`,
                      background: 'var(--primary)',
                      borderRadius: '4px',
                      transition: 'width 0.4s ease',
                      display: 'flex', alignItems: 'center', paddingLeft: '8px',
                    }}>
                      <span style={{ color: '#fff', fontSize: '0.72rem', fontWeight: 700 }}>{count > 0 ? count : ''}</span>
                    </div>
                  </div>
                  <span style={{ width: '24px', flexShrink: 0, fontWeight: 700, color: 'var(--text-secondary)' }}>{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Revenue by Month */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={16} color="#2E7D32" /> Revenue by Month (Completed)
          </h3>
          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>Loading...</div>
          ) : monthlyData.every(([, v]) => v.revenue === 0) ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>No revenue data in this period.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(() => {
                const maxRev = Math.max(...monthlyData.map(([, v]) => v.revenue), 1);
                return monthlyData.map(([key, { revenue }]) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem' }}>
                    <span style={{ width: '72px', flexShrink: 0, color: 'var(--text-muted)', fontWeight: 600 }}>{formatMonthKey(key)}</span>
                    <div style={{ flex: 1, height: '22px', background: 'var(--gray-100)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${(revenue / maxRev) * 100}%`,
                        background: '#2E7D32',
                        borderRadius: '4px',
                        transition: 'width 0.4s ease',
                        display: 'flex', alignItems: 'center', paddingLeft: '8px',
                      }}>
                        <span style={{ color: '#fff', fontSize: '0.7rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                          {revenue > 0 ? `₱${(revenue / 1000).toFixed(0)}k` : ''}
                        </span>
                      </div>
                    </div>
                    <span style={{ width: '64px', flexShrink: 0, fontWeight: 700, color: '#2E7D32', fontSize: '0.75rem' }}>
                      {revenue > 0 ? `₱${revenue.toLocaleString()}` : '—'}
                    </span>
                  </div>
                ));
              })()}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Status Breakdown */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📊 Status Breakdown
          </h3>
          {statusBreakdown.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No bookings in this period.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {statusBreakdown.map(([status, count]) => {
                const pct = kpis.total > 0 ? Math.round((count / kpis.total) * 100) : 0;
                const isCompleted = status === 'Completed';
                const isCancelled = ['Cancelled', 'Declined'].includes(status);
                const color = isCompleted ? '#2E7D32' : isCancelled ? '#E8451C' : 'var(--primary)';
                return (
                  <div key={status}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.8rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{status}</span>
                      <span style={{ fontWeight: 700, color }}>{count} ({pct}%)</span>
                    </div>
                    <div style={{ height: '8px', background: 'var(--gray-100)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '4px', transition: 'width 0.4s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Payment Split + Top Routes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              💳 Payment Split
            </h3>
            <div style={{ display: 'flex', gap: '16px' }}>
              {[
                { label: 'Online (Stripe)', count: kpis.stripeCount, color: '#1565C0', bg: '#E3F2FD' },
                { label: 'Cash on Delivery', count: kpis.codCount, color: '#E65100', bg: '#FFF3E0' },
              ].map(({ label, count, color, bg }) => {
                const total = kpis.stripeCount + kpis.codCount;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={label} style={{ flex: 1, padding: '12px', background: bg, borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color }}>{count}</div>
                    <div style={{ fontSize: '0.72rem', color, fontWeight: 600 }}>{label}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>{pct}%</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card" style={{ padding: '20px', flex: 1 }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🗺️ Top Routes
            </h3>
            {topRoutes.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No route data in this period.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {topRoutes.map(([route, count], i) => (
                  <div key={route} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem' }}>
                    <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 700, fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {i + 1}
                    </span>
                    <span style={{ flex: 1, color: 'var(--text-secondary)', fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{route}</span>
                    <span style={{ fontWeight: 700, color: 'var(--primary)', flexShrink: 0 }}>{count}×</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer note */}
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '8px' }} className="no-print">
        Data shown for: <strong>{rangeLabel}</strong>. Use Export CSV or Print / PDF to save a report.
      </p>
    </AdminLayout>
  );
}
