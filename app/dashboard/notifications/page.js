'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useFirestore } from '@/lib/useFirestore';
import { getNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification, deleteAllUserNotifications } from '@/lib/firebaseService';
import { useToast } from '@/components/Toast';
import { Bell, Check, Clock, MapPin, MoreHorizontal, Trash2 } from 'lucide-react';

const tabs = ['All', 'Bookings', 'Appointments', 'Payments', 'System'];

export default function NotificationsPage() {
  const { user } = useAuth();
  const { data: notifications, loading, refetch } = useFirestore(
    () => getNotifications(user?.uid),
    [user?.uid]
  );
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('All');
  const [deleting, setDeleting] = useState(null);

  const filtered = activeTab === 'All'
    ? notifications
    : notifications?.filter(n => n.type === activeTab.toLowerCase().slice(0, -1));

  const handleMarkRead = async (notifId) => {
    await markNotificationRead(notifId);
    refetch();
  };

  const handleMarkAllRead = async () => {
    if (!user?.uid) return;
    try {
      await markAllNotificationsRead(user.uid);
      refetch();
      addToast('All notifications marked as read.', 'success');
    } catch {
      addToast('Failed to mark all as read.', 'error');
    }
  };

  const handleDelete = async (notifId) => {
    setDeleting(notifId);
    try {
      await deleteNotification(notifId);
      refetch();
    } catch {
      addToast('Failed to delete notification.', 'error');
    }
    setDeleting(null);
  };

  const handleDeleteAll = async () => {
    if (!user?.uid) return;
    if (!confirm('Delete all your notifications? This cannot be undone.')) return;
    try {
      await deleteAllUserNotifications(user.uid);
      refetch();
      addToast('All notifications deleted.', 'success');
    } catch {
      addToast('Failed to delete notifications.', 'error');
    }
  };

  const unreadCount = notifications?.filter(n => n.isNew).length || 0;

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            Notifications
            {unreadCount > 0 && (
              <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                {unreadCount} New
              </span>
            )}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Stay updated with your logistics activities in SBMA and Olongapo.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {unreadCount > 0 && (
            <button className="btn btn-outline btn-sm" style={{ gap: '4px' }} onClick={handleMarkAllRead}>
              <Check size={14} /> Mark all as read
            </button>
          )}
          <button
            className="btn btn-outline btn-sm"
            style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
            onClick={handleDeleteAll}
            title="Delete all notifications"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid var(--gray-200)', marginBottom: '24px' }}>
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 20px',
              fontSize: '0.85rem',
              fontWeight: activeTab === tab ? '600' : '500',
              color: activeTab === tab ? 'var(--primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
              background: 'none',
              cursor: 'pointer',
              transition: 'var(--transition)',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {loading ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
          </div>
        ) : !filtered?.length ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            <Bell size={28} style={{ display: 'block', margin: '0 auto 12px' }} />
            No notifications found
          </div>
        ) : filtered.map((notif) => (
          <div
            key={notif.id}
            className="card"
            style={{
              borderColor: notif.isNew ? 'var(--primary)' : 'var(--gray-200)',
              borderWidth: notif.isNew ? '2px' : '1px',
              animation: 'fadeIn 0.3s ease',
            }}
          >
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <span style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: 'var(--primary-light)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: 'var(--primary)',
                flexShrink: 0,
              }}>
                <Bell size={18} />
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <h4 style={{ fontSize: '0.95rem' }}>{notif.title}</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} /> {notif.time || '—'}
                  </span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '8px' }}>
                  {notif.message}
                </p>
                {notif.location && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '500', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={12} /> {notif.location}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '8px' }}>
                  {notif.isNew && (
                    <button
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '0.78rem' }}
                      onClick={() => handleMarkRead(notif.id)}
                    >
                      <Check size={12} /> Mark as Read
                    </button>
                  )}
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '0.78rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                    onClick={() => handleDelete(notif.id)}
                    disabled={deleting === notif.id}
                  >
                    <Trash2 size={12} /> {deleting === notif.id ? '...' : 'Delete'}
                  </button>
                </div>
              </div>
              <button style={{ background: 'none', color: 'var(--text-muted)', padding: '4px' }}>
                <MoreHorizontal size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
