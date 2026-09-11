'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/lib/AuthContext';
import { useRealtimeFirestore } from '@/lib/useRealtimeFirestore';
import { subscribeToUserPurchaseRequests } from '@/lib/firebaseService';
import { Package, Truck } from 'lucide-react';
import { useState } from 'react';

export default function UserPurchases() {
  const { user } = useAuth();
  const { data: purchases, loading } = useRealtimeFirestore(
    (cb) => subscribeToUserPurchaseRequests(user?.uid, cb),
    [user?.uid]
  );

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const purchasesList = purchases || [];
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

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Truck Details</th>
                <th>Price</th>
                <th>Payment Method</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '32px' }}>Loading your purchases...</td>
                </tr>
              ) : !currentPurchases.length ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    <Truck size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                    <p>You haven't purchased any trucks yet.</p>
                  </td>
                </tr>
              ) : (
                currentPurchases.map((purchase) => (
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
                    <td style={{ fontSize: '0.85rem' }}>
                      {purchase.createdAt?.seconds
                        ? new Date(purchase.createdAt.seconds * 1000).toLocaleDateString()
                        : purchase.date || '--'}
                    </td>
                    <td>
                      <span className={`status ${purchase.status === 'Completed' || purchase.status === 'Sold' ? 'status-confirmed' : 'status-pending'}`}>
                        {purchase.status || 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))
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
