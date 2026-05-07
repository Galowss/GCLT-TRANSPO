'use client';

import AdminLayout from '@/components/AdminLayout';
import { useRealtimeFirestore } from '@/lib/useRealtimeFirestore';
import { subscribeToAllBookings } from '@/lib/firebaseService';
import { Receipt, Download, Search } from 'lucide-react';
import { useState } from 'react';

function exportToCsv(transactions) {
  const headers = ['Transaction ID', 'Service', 'Pickup', 'Delivery', 'Payment Method', 'Date', 'Status'];
  const rows = transactions.map(b => [
    b.id,
    b.truckRoute || 'Transport Service',
    b.pickup || '',
    b.delivery || '',
    b.paymentMethod === 'stripe' ? 'Stripe' : 'Cash on Delivery',
    b.date || '',
    b.status || '',
  ]);
  const csv = [headers, ...rows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `gclt-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function TransactionsPage() {
  const { data: bookings, loading } = useRealtimeFirestore(
    (cb) => subscribeToAllBookings(cb)
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');

  const completedBookings = (bookings || []).filter(b =>
    b.status === 'Completed' || b.paymentMethod === 'stripe'
  );

  const getDateCutoff = () => {
    const now = new Date();
    if (filterDate === '7') { now.setDate(now.getDate() - 7); return now; }
    if (filterDate === '30') { now.setDate(now.getDate() - 30); return now; }
    if (filterDate === '90') { now.setDate(now.getDate() - 90); return now; }
    return null;
  };

  const filtered = completedBookings.filter(b => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      b.id.toLowerCase().includes(q) ||
      (b.truckRoute || '').toLowerCase().includes(q) ||
      (b.pickup || '').toLowerCase().includes(q);
    const matchesPayment = filterPayment === 'all' || b.paymentMethod === filterPayment;
    const cutoff = getDateCutoff();
    const matchesDate = !cutoff || !b.date || new Date(b.date) >= cutoff;
    return matchesSearch && matchesPayment && matchesDate;
  });

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Receipt size={24} color="var(--primary)" /> Transactions
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            View past completed bookings and payment history.
          </p>
        </div>
        <button
          className="btn btn-outline btn-sm"
          style={{ gap: '6px' }}
          onClick={() => exportToCsv(filtered)}
          disabled={!filtered.length}
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Filter */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search by ID, service, or route..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '36px', width: '100%' }}
          />
        </div>
        <select className="form-select" style={{ width: '160px' }} value={filterDate} onChange={e => setFilterDate(e.target.value)}>
          <option value="all">All Time</option>
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
        </select>
        <select className="form-select" style={{ width: '160px' }} value={filterPayment} onChange={e => setFilterPayment(e.target.value)}>
          <option value="all">All Payments</option>
          <option value="stripe">Stripe</option>
          <option value="cod">Cash on Delivery</option>
        </select>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Service</th>
                <th>Route</th>
                <th>Payment Method</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '32px' }}>Loading transactions...</td></tr>
              ) : !filtered.length ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  {searchQuery || filterDate !== 'all' || filterPayment !== 'all' ? 'No transactions match your filters.' : 'No transactions found'}
                </td></tr>
              ) : filtered.map((b) => (
                <tr key={b.id}>
                  <td><strong style={{ color: 'var(--primary)' }}>{b.id.slice(-8)}</strong></td>
                  <td>{b.truckRoute || 'Transport Service'}</td>
                  <td>
                    <div style={{ fontSize: '0.85rem' }}>{b.pickup}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{b.delivery}</div>
                  </td>
                  <td>
                    <span className="badge" style={{
                      background: b.paymentMethod === 'stripe' ? '#E8F5E9' : '#FFF8E1',
                      color: b.paymentMethod === 'stripe' ? '#2E7D32' : '#E65100'
                    }}>
                      {b.paymentMethod === 'stripe' ? 'Stripe' : 'COD'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{b.date}</td>
                  <td>
                    <span className={`status ${b.status === 'Completed' ? 'status-confirmed' : 'status-pending'}`}>
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
