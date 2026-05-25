'use client';

import AdminLayout from '@/components/AdminLayout';
import { useRealtimeFirestore } from '@/lib/useRealtimeFirestore';
import { subscribeToPurchaseRequests, updatePurchaseRequest } from '@/lib/firebaseService';
import { useToast } from '@/components/Toast';
import { ShoppingBag, Search, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';

export default function AdminPurchasesPage() {
  const { data: purchases, loading } = useRealtimeFirestore(
    (cb) => subscribeToPurchaseRequests(cb)
  );
  const { addToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const filteredPurchases = (purchases || []).filter(p => {
    const q = searchQuery.toLowerCase();
    return !q || 
      p.id.toLowerCase().includes(q) ||
      (p.truckName || '').toLowerCase().includes(q) ||
      (p.userEmail || '').toLowerCase().includes(q);
  });

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
      </div>

      <div className="card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search by ID, truck name, or user email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '36px', width: '100%' }}
          />
        </div>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          {filteredPurchases.length} result{filteredPurchases.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>User Details</th>
                <th>Truck Details</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '32px' }}>Loading purchase history...</td></tr>
              ) : !filteredPurchases.length ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  {searchQuery ? 'No purchases match your search.' : 'No purchases found'}
                </td></tr>
              ) : filteredPurchases.map((p) => (
                <tr key={p.id}>
                  <td><strong style={{ color: 'var(--primary)' }}>{p.id.slice(-8)}</strong></td>
                  <td>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{p.userEmail || 'Guest'}</div>
                    {p.userId && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {p.userId.slice(-6)}</div>}
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
