'use client';

import AdminLayout from '@/components/AdminLayout';
import { useRealtimeFirestore } from '@/lib/useRealtimeFirestore';
import { subscribeToPurchaseRequests, updatePurchaseRequest } from '@/lib/firebaseService';
import { exportCsv } from '@/lib/csvUtils';
import { useToast } from '@/components/Toast';
import DatePickerInput from '@/components/DatePickerInput';
import { ShoppingBag, Search, CheckCircle, XCircle, Download } from 'lucide-react';
import { useState } from 'react';

function purchaseDateTime(p) {
  const ts = p.createdAt?.seconds
    ? new Date(p.createdAt.seconds * 1000)
    : p.date ? new Date(p.date) : null;
  if (!ts || isNaN(ts)) return { date: '—', time: '—' };
  return {
    date: ts.toLocaleDateString('en-PH'),
    time: ts.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }),
  };
}

function purchaseDateKey(p) {
  const ts = p.createdAt?.seconds
    ? new Date(p.createdAt.seconds * 1000)
    : p.date ? new Date(p.date) : null;
  if (!ts || isNaN(ts)) return null;
  return `${ts.getFullYear()}-${String(ts.getMonth() + 1).padStart(2, '0')}-${String(ts.getDate()).padStart(2, '0')}`;
}

export function exportPurchasesToCsv(purchases) {
  const headers = ['ID', 'User', 'Truck', 'Price (PHP)', 'Payment Method', 'Date', 'Time', 'Status'];
  const rows = purchases.map(p => {
    const dt = purchaseDateTime(p);
    return [
      p.id,
      p.userEmail || p.userName || 'Guest',
      p.truckName || '',
      p.truckPrice || '',
      p.paymentMethod === 'stripe' ? 'Stripe' : 'COD',
      dt.date,
      dt.time,
      p.status || 'Pending',
    ];
  });
  exportCsv(`gclt-purchases-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
}

export default function AdminPurchasesPage() {
  const { data: purchases, loading } = useRealtimeFirestore(
    (cb) => subscribeToPurchaseRequests(cb)
  );
  const { addToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPayment, setFilterPayment] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const hasActiveFilters = searchQuery || filterPayment !== 'all' || filterDateFrom || filterDateTo;

  const filteredPurchases = (purchases || []).filter(p => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      p.id.toLowerCase().includes(q) ||
      (p.truckName || '').toLowerCase().includes(q) ||
      (p.userEmail || p.userName || '').toLowerCase().includes(q);
    const matchesPayment = filterPayment === 'all' ||
      (filterPayment === 'stripe' ? p.paymentMethod === 'stripe' : p.paymentMethod !== 'stripe');
    const recDate = purchaseDateKey(p);
    const matchesDateFrom = !filterDateFrom || (recDate && recDate >= filterDateFrom);
    const matchesDateTo = !filterDateTo || (recDate && recDate <= filterDateTo);
    return matchesSearch && matchesPayment && matchesDateFrom && matchesDateTo;
  });

  const clearFilters = () => {
    setSearchQuery('');
    setFilterPayment('all');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage);
  const currentPurchases = filteredPurchases.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleUpdateStatus = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      await updatePurchaseRequest(id, { status: newStatus });
      addToast(`Purchase marked as ${newStatus}`, 'success');
    } catch (error) {
      addToast('Failed to update status', 'error');
    }
    setUpdatingId(null);
  };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShoppingBag size={24} color="var(--primary)" /> Truck Purchases
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Manage all customer truck purchase and reservation requests.
          </p>
        </div>
        <button
          className="btn btn-outline btn-sm no-print"
          style={{ gap: '6px' }}
          onClick={() => exportPurchasesToCsv(filteredPurchases)}
          disabled={!filteredPurchases.length}
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      <div className="card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search by ID, truck name, or user email..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            style={{ paddingLeft: '36px', width: '100%' }}
          />
        </div>
        <select
          className="form-select"
          style={{ width: '170px' }}
          value={filterPayment}
          onChange={e => setFilterPayment(e.target.value)}
        >
          <option value="all">Payment: All</option>
          <option value="stripe">Stripe (Online)</option>
          <option value="cod">Cash on Delivery</option>
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Date:</span>
          <DatePickerInput
            value={filterDateFrom}
            onChange={v => { setFilterDateFrom(v); setCurrentPage(1); }}
            minDate=""
            maxDate={filterDateTo}
            style={{ width: '145px' }}
            placeholder="From"
            title="From date"
          />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>–</span>
          <DatePickerInput
            value={filterDateTo}
            onChange={v => { setFilterDateTo(v); setCurrentPage(1); }}
            minDate={filterDateFrom}
            maxDate=""
            style={{ width: '145px' }}
            placeholder="To"
            title="To date"
          />
        </div>
        {hasActiveFilters && (
          <button
            className="btn btn-outline btn-sm"
            onClick={clearFilters}
            style={{ color: 'var(--danger)', borderColor: 'var(--danger)', whiteSpace: 'nowrap' }}
          >
            Clear Filters
          </button>
        )}
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          {filteredPurchases.length} result{filteredPurchases.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>User Details</th>
                <th>Truck Details</th>
                <th>Payment</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '32px' }}>Loading purchase history...</td></tr>
              ) : !currentPurchases.length ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  {hasActiveFilters ? 'No purchases match your filters.' : 'No purchases found'}
                </td></tr>
              ) : currentPurchases.map((p) => {
                const dt = purchaseDateTime(p);
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{p.userEmail || p.userName || 'Guest'}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '500' }}>{p.truckName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        ₱{p.truckPrice ? p.truckPrice.toLocaleString() : '0'}
                      </div>
                    </td>
                    <td>
                      <span className="badge" style={{
                        background: p.paymentMethod === 'stripe' ? '#E8F5E9' : '#FFF8E1',
                        color: p.paymentMethod === 'stripe' ? '#2E7D32' : '#E65100'
                      }}>
                        {p.paymentMethod === 'stripe' ? 'Stripe' : 'COD'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{dt.date}</td>
                    <td style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{dt.time}</td>
                    <td>
                      <span className={`status ${p.status === 'Completed' || p.status === 'Sold' ? 'status-confirmed' : p.status === 'Cancelled' ? 'status-cancelled' : 'status-pending'}`}>
                        {p.status || 'Pending'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-sm btn-outline"
                          style={{ padding: '6px 10px', color: 'var(--success)', borderColor: 'var(--success)' }}
                          title="Mark Completed"
                          onClick={() => handleUpdateStatus(p.id, 'Completed')}
                          disabled={updatingId === p.id || p.status === 'Completed'}
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button
                          className="btn btn-sm btn-outline"
                          style={{ padding: '6px 10px', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                          title="Cancel Request"
                          onClick={() => handleUpdateStatus(p.id, 'Cancelled')}
                          disabled={updatingId === p.id || p.status === 'Cancelled'}
                        >
                          <XCircle size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredPurchases.length)} of {filteredPurchases.length}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-sm btn-outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                Previous
              </button>
              <button
                className="btn btn-sm btn-outline"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}