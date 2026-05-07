'use client';

import AdminLayout from '@/components/AdminLayout';
import { useRealtimeFirestore } from '@/lib/useRealtimeFirestore';
import { subscribeToAdminNotifications, markNotificationRead } from '@/lib/firebaseService';
import { useToast } from '@/components/Toast';
import { Bell, Check, Clock, Truck, Calendar, Search } from 'lucide-react';
import { useState } from 'react';


const typeIcon = {
  booking: Truck,
  appointment: Calendar,
  system: Bell,
};

export default function AdminNotifications() {
  const { data: notifications, loading } = useRealtimeFirestore(
    (cb) => subscribeToAdminNotifications(cb)
  );
  const { addToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');

  const handleMarkRead = async (notifId) => {
    try {
      await markNotificationRead(notifId);
      // listener auto-updates
    } catch {
      addToast('Failed to mark as read.', 'error');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const unread = (notifications || []).filter(n => n.isNew);
      await Promise.all(unread.map(n => markNotificationRead(n.id)));
      refetch();
      addToast('All notifications marked as read.', 'success');
    } catch {
      addToast('Failed to mark all as read.', 'error');
    }
  };

  const unreadCount = (notifications || []).filter(n => n.isNew).length;

  const filteredNotifications = (notifications || []).filter(n => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (n.title || '').toLowerCase().includes(q) ||
      (n.message || '').toLowerCase().includes(q) ||
      (n.userEmail || '').toLowerCase().includes(q) ||
      (n.type || '').toLowerCase().includes(q) ||
      (n.time || '').toLowerCase().includes(q)
    );
  });

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            Notifications
            {unreadCount > 0 && (
              <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                {unreadCount} New
              </span>
            )}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Booking requests and system alerts.
          </p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-outline btn-sm" style={{ gap: '6px' }} onClick={handleMarkAllRead}>
            <Check size={14} /> Mark All as Read
          </button>
        )}
      </div>

      {/* Search bar */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          type="text"
          className="form-input"
          placeholder="Search notifications by title, message, user, or type..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ paddingLeft: '36px', width: '100%' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {loading ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
          </div>
        ) : !filteredNotifications.length ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
            <Bell size={36} color="var(--text-muted)" style={{ display: 'block', margin: '0 auto' }} />
            <h3 style={{ marginTop: '16px' }}>{searchQuery ? 'No notifications match your search.' : 'No new notifications'}</h3>
            <p style={{ color: 'var(--text-muted)' }}>{searchQuery ? 'Try a different keyword.' : 'All caught up! Booking submissions will appear here.'}</p>
          </div>
        ) : filteredNotifications.map((notif) => {
          const Icon = typeIcon[notif.type] || Bell;
          return (
            <div
              key={notif.id}
              className="card"
              style={{
                borderLeft: notif.isNew ? '3px solid var(--primary)' : '3px solid transparent',
                opacity: notif.isNew ? 1 : 0.75,
              }}
            >
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <span style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: notif.isNew ? 'var(--primary-light)' : 'var(--gray-100)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: notif.isNew ? 'var(--primary)' : 'var(--text-muted)', flexShrink: 0,
                }}>
                  <Icon size={18} />
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', flexWrap: 'wrap', gap: '8px' }}>
                    <h4 style={{ fontSize: '0.95rem' }}>{notif.title}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> {notif.time || '—'}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '8px' }}>
                    {notif.message}
                  </p>
                  {notif.userEmail && (
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      From: {notif.userEmail}
                    </p>
                  )}
                  {notif.isNew && (
                    <button
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '0.78rem' }}
                      onClick={() => handleMarkRead(notif.id)}
                    >
                      <Check size={12} /> Mark as Read
                    </button>
                  )}
                </div>
                {notif.isNew && (
                  <span style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: 'var(--primary)', flexShrink: 0, marginTop: '6px',
                  }} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </AdminLayout>
  );
}
