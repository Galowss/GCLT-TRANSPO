'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Bell, Calendar, Clock, Truck } from 'lucide-react';
import { useRealtimeFirestore } from '@/lib/useRealtimeFirestore';
import {
  subscribeToNotifications,
  subscribeToAdminNotifications,
  markNotificationRead,
} from '@/lib/firebaseService';
import { useToast } from '@/components/Toast';

const typeIcon = {
  booking: Truck,
  appointment: Calendar,
  system: Bell,
};

export default function NotificationBell({ userId, admin = false, href, className = 'dash-icon-btn' }) {
  const { addToast } = useToast();
  const subscriptionKey = admin ? 'admin' : userId;
  const { data: notifications, loading } = useRealtimeFirestore(
    (cb) => (admin ? subscribeToAdminNotifications(cb) : subscribeToNotifications(userId, cb)),
    [subscriptionKey, admin]
  );

  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const closeTimer = useRef(null);
  const initializedRef = useRef(false);
  const seenRef = useRef(new Set());

  useEffect(() => {
    initializedRef.current = false;
    seenRef.current = new Set();
    setOpen(false);
  }, [userId, admin]);

  useEffect(() => {
    if (!notifications) return;

    if (!initializedRef.current) {
      notifications.forEach((n) => seenRef.current.add(n.id));
      initializedRef.current = true;
      return;
    }

    const fresh = notifications.filter((n) => n.isNew && !seenRef.current.has(n.id));
    notifications.forEach((n) => seenRef.current.add(n.id));

    fresh.slice(0, 3).forEach((n) => {
      const message = n.title
        ? `${n.title}${n.message ? ` — ${n.message}` : ''}`
        : n.message || 'You have a new notification.';
      addToast(message.length > 120 ? `${message.slice(0, 117)}...` : message, 'info', 6000);
    });
  }, [notifications, addToast]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  const openMenu = () => {
    clearTimeout(closeTimer.current);
    setOpen(true);
  };

  const scheduleClose = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 180);
  };

  const closeNow = () => {
    clearTimeout(closeTimer.current);
    setOpen(false);
  };

  const handleRead = async (id) => {
    try {
      await markNotificationRead(id);
    } catch {
      addToast('Failed to mark notification as read.', 'error');
    }
  };

  const items = notifications || [];
  const unreadCount = items.filter((n) => n.isNew).length;
  const recent = items.slice(0, 6);

  return (
    <div
      className="notification-bell"
      ref={wrapRef}
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        className={className}
        aria-label="Notifications"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Bell size={18} />
        {unreadCount > 0 && <span className="dash-notif-dot" />}
      </button>

      {open && (
        <div className="notif-dropdown" role="menu">
          <div className="notif-dropdown-head">
            <span>Notifications</span>
            {unreadCount > 0 && <span className="notif-dropdown-count">{unreadCount} new</span>}
          </div>

          <div className="notif-dropdown-list">
            {loading ? (
              <div className="notif-dropdown-empty">Loading...</div>
            ) : recent.length === 0 ? (
              <div className="notif-dropdown-empty">
                <Bell size={22} />
                <span>No notifications yet</span>
              </div>
            ) : (
              recent.map((n) => {
                const Icon = typeIcon[n.type] || Bell;
                return (
                  <button
                    type="button"
                    key={n.id}
                    className={`notif-item${n.isNew ? ' unread' : ''}`}
                    role="menuitem"
                    onClick={() => n.isNew && handleRead(n.id)}
                  >
                    <span className="notif-item-icon">
                      <Icon size={15} />
                    </span>
                    <span className="notif-item-body">
                      <span className="notif-item-title">{n.title || 'Notification'}</span>
                      {n.message && <span className="notif-item-message">{n.message}</span>}
                      <span className="notif-item-time">
                        <Clock size={11} /> {n.time || 'Just now'}
                      </span>
                    </span>
                    {n.isNew && <span className="notif-item-unread-dot" />}
                  </button>
                );
              })
            )}
          </div>

          {href && (
            <Link href={href} className="notif-dropdown-footer" onClick={closeNow}>
              View all notifications
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
