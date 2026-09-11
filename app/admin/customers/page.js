'use client';

import AdminLayout from '@/components/AdminLayout';
import { useRealtimeFirestore } from '@/lib/useRealtimeFirestore';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { subscribeToAllUsers, updateUserRole } from '@/lib/firebaseService';
import { useToast } from '@/components/Toast';
import { useState } from 'react';
import { Users, Shield, ShieldOff, Search, User } from 'lucide-react';

export default function UserManagement() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { data: users, loading } = useRealtimeFirestore(
    (cb) => subscribeToAllUsers(cb)
  );
  const { addToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [promoting, setPromoting] = useState(null);

  // Staff must never access user management — admin only
  useEffect(() => {
    if (!authLoading && (!currentUser || currentUser.role !== 'admin')) {
      router.replace('/admin');
    }
  }, [currentUser, authLoading, router]);

  const hasActiveFilters = searchQuery || filterRole !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setFilterRole('all');
  };

  const filteredUsers = (users || []).filter(u =>
    (u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (filterRole === 'all' || u.role === filterRole)
  );

  const handlePromote = async (uid, newRole) => {
    setPromoting(uid);
    try {
      await updateUserRole(uid, newRole);
      addToast(`User role set to ${newRole}.`, 'success');
      // listener auto-updates the list
    } catch (err) {
      addToast('Failed to update user role.', 'error');
    }
    setPromoting(null);
  };

  const adminCount = (users || []).filter(u => u.role === 'admin').length;
  const staffCount = (users || []).filter(u => u.role === 'staff').length;
  const userCount = (users || []).filter(u => u.role !== 'admin' && u.role !== 'staff').length;

  if (authLoading || !currentUser || currentUser.role !== 'admin') {
    return (
      <div className="spinner-overlay">
        <div className="spinner"></div>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading...</span>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Users size={24} color="var(--primary)" /> User Management
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            View all registered users and manage roles.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
          <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>{(users || []).length}</span>
          <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Total Users</span>
        </div>
        <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
          <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--success)' }}>{adminCount}</span>
          <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Admins</span>
        </div>
        <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
          <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#F5A623' }}>{staffCount}</span>
          <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Staff</span>
        </div>
        <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
          <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent)' }}>{userCount}</span>
          <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Regular Users</span>
        </div>
      </div>

      {/* Search + Role filter */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '36px', width: '100%' }}
          />
        </div>
        <select
          className="form-select"
          style={{ width: '150px' }}
          value={filterRole}
          onChange={e => setFilterRole(e.target.value)}
        >
          <option value="all">Role: All</option>
          <option value="admin">Admin</option>
          <option value="staff">Staff</option>
          <option value="user">User</option>
        </select>
        {hasActiveFilters && (
          <button
            className="btn btn-outline btn-sm"
            onClick={clearFilters}
            style={{ color: 'var(--danger)', borderColor: 'var(--danger)', whiteSpace: 'nowrap' }}
          >
            Clear Filters
          </button>
        )}
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Users Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Location</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '32px' }}>Loading users...</td></tr>
              ) : !filteredUsers.length ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No users found</td></tr>
              ) : filteredUsers.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: u.role === 'admin' ? 'var(--primary)' : u.role === 'staff' ? '#F5A623' : 'var(--gray-200)',
                        color: u.role === 'admin' || u.role === 'staff' ? 'var(--white)' : 'var(--text-secondary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '0.8rem',
                      }}>
                        {u.role !== 'user' ? <Shield size={16} /> : <User size={16} />}
                      </div>
                      <div>
                        <strong style={{ fontSize: '0.9rem' }}>{u.displayName || 'Unnamed'}</strong>
                        {u.company && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.company}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{u.email}</td>
                  <td style={{ fontSize: '0.85rem' }}>{u.phone || '--'}</td>
                  <td style={{ fontSize: '0.85rem' }}>{u.location || '--'}</td>
                  <td>
                    <span className={`badge ${u.role === 'admin' ? 'badge-primary' : u.role === 'staff' ? 'badge-warning' : 'badge-success'}`} style={{ gap: '4px', display: 'inline-flex', alignItems: 'center' }}>
                      {u.role !== 'user' ? <><Shield size={12} /> {u.role === 'admin' ? 'Admin' : 'Staff'}</> : 'User'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {u.role === 'user' && (
                        <>
                          <button
                            className="btn btn-sm btn-outline"
                            style={{ gap: '4px', fontSize: '0.8rem' }}
                            onClick={() => handlePromote(u.id, 'staff')}
                            disabled={promoting === u.id}
                          >
                            {promoting === u.id ? 'Updating...' : <><Shield size={14} /> Staff</>}
                          </button>
                          <button
                            className="btn btn-sm btn-primary"
                            style={{ gap: '4px', fontSize: '0.8rem' }}
                            onClick={() => handlePromote(u.id, 'admin')}
                            disabled={promoting === u.id}
                          >
                            {promoting === u.id ? 'Updating...' : <><Shield size={14} /> Admin</>}
                          </button>
                        </>
                      )}
                      {u.role === 'staff' && (
                        <>
                          <button
                            className="btn btn-sm btn-outline"
                            style={{ gap: '4px', fontSize: '0.8rem' }}
                            onClick={() => handlePromote(u.id, 'user')}
                            disabled={promoting === u.id}
                          >
                            {promoting === u.id ? 'Updating...' : <><ShieldOff size={14} /> Demote</>}
                          </button>
                          <button
                            className="btn btn-sm btn-primary"
                            style={{ gap: '4px', fontSize: '0.8rem' }}
                            onClick={() => handlePromote(u.id, 'admin')}
                            disabled={promoting === u.id}
                          >
                            {promoting === u.id ? 'Updating...' : <><Shield size={14} /> Admin</>}
                          </button>
                        </>
                      )}
                      {u.role === 'admin' && (
                        <button
                          className="btn btn-sm btn-outline"
                          style={{ gap: '4px', fontSize: '0.8rem' }}
                          onClick={() => handlePromote(u.id, 'user')}
                          disabled={promoting === u.id}
                        >
                          {promoting === u.id ? 'Updating...' : <><ShieldOff size={14} /> Demote</>}
                        </button>
                      )}
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
