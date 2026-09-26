'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/lib/AuthContext';
import { useRealtimeFirestore } from '@/lib/useRealtimeFirestore';
import { subscribeToUserPurchaseRequests } from '@/lib/firebaseService';
import DatePickerInput from '@/components/DatePickerInput';
import { Package, Truck, Search } from 'lucide-react';
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

export default function UserPurchases() {
  const { user } = useAuth();
  const { data: purchases, loading } = useRealtimeFirestore(
    (cb) => subscribeToUserPurchaseRequests(user?.uid, cb),
    [user?.uid]
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [filterPayment, setFilterPayment] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const hasActiveFilters = searchQuery || filterPayment !== 'all' || filterDateFrom || filterDateTo;

  const purchasesList = (purchases || []).filter(p => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      (p.truckName || '').toLowerCase().includes(q) ||
      (p.id || '').toLowerCase().includes(q);
    const matchesPayment = filterPayment === 'all' ||
      (filterPayment === 'stripe' ? p.paymentMethod === 'stripe' : p.paymentMethod !== 'stripe');
    const recDate = purchaseDateKey(p);
    const matchesDateFrom = !filterDateFrom || (recDate && recDate >= filterDateFrom);
    const matchesDateTo = !filterDateTo || (recDate && recDate <= filterDateTo);
    return matchesSearch && matchesPayment && matchesDateFrom && matchesDateTo;
  });

  const totalPages = Math.ceil(purchasesList.length / itemsPerPage);
  const currentPurchases = purchasesList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Package size={24} color="var(--primary)" /> My Truck Purchases
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            View the history of trucks you have purchased or reserved.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search by truck name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
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
            onChange={v => setFilterDateFrom(v)}
            maxDate={filterDateTo}
            style={{ width: '145px' }}
            placeholder="From"
            title="From date"
          />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>–</span>
          <DatePickerInput
            value={filterDateTo}
            onChange={v => setFilterDateTo(v)}
            minDate={filterDateFrom}
            style={{ width: '145px' }}
            placeholder="To"
            title="To date"
          />
        </div>
        {hasActiveFilters && (
          <button
            className="btn btn-outline btn-sm"
            onClick={() => {
              setSearchQuery('');
              setFilterPayment('all');
              setFilterDateFrom('');
              setFilterDateTo('');
            }}
            style={{ color: 'var(--danger)', borderColor: 'var(--danger)', whiteSpace: 'nowrap' }}
          >
            Clear Filters
          </button>
        )}
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          {purchasesList.length} result{purchasesList.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Truck Details</th>
                <th>Price</th>
                <th>Payment Method</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '32px' }}>Loading your purchases...</td>
                </tr>
              ) : !currentPurchases.length ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    <Truck size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                    <p>{hasActiveFilters ? 'No purchases match your filters.' : "You haven't purchased any trucks yet."}</p>
                  </td>
                </tr>
              ) : (
                currentPurchases.map((purchase) => {
                  const dt = purchaseDateTime(purchase);
                  return (
                    <tr key={purchase.id}>
                      <td>
                        <div style={{ fontWeight: '600' }}>{purchase.truckName}</div>
                      </td>
                      <td>
                        {purchase.truckPrice ? `₱${purchase.truckPrice.toLocaleString()}` : '--'}
                      </td>
                      <td>
                        <span className="badge" style={{
                          background: purchase.paymentMethod === 'stripe' ? '#E8F5E9' : '#FFF8E1',
                          color: purchase.paymentMethod === 'stripe' ? '#2E7D32' : '#E65100'
                        }}>
                          {purchase.paymentMethod === 'stripe' ? 'Stripe' : 'COD'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{dt.date}</td>
                      <td style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{dt.time}</td>
                      <td>
                        <span className={`status ${purchase.status === 'Completed' || purchase.status === 'Sold' ? 'status-confirmed' : purchase.status === 'Cancelled' ? 'status-cancelled' : 'status-pending'}`}>
                          {purchase.status || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, purchasesList.length)} of {purchasesList.length}
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
    </DashboardLayout>
  );
}