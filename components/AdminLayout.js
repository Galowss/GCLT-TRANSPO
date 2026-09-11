'use client';

import AdminSidebar from './AdminSidebar';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Truck, Bell, User, Menu } from 'lucide-react';

export default function AdminLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (!loading && user && !['admin', 'staff'].includes(user.role)) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="spinner-overlay">
        <div className="spinner"></div>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading...</span>
      </div>
    );
  }

  if (!user || !['admin', 'staff'].includes(user.role)) return null;

  return (
    <div className="dashboard-layout">
      <div className="dashboard-topbar">
        <div className="dashboard-topbar-brand">
          <button
            className="sidebar-mobile-toggle"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open Sidebar"
          >
            <Menu size={22} />
          </button>
          <Link href="/admin" className="dashboard-topbar-brand-link">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/gclt-logo.png" alt="GCLT" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
            <span>GCLT Admin Panel</span>
          </Link>
        </div>
        <div className="dashboard-topbar-actions">
          <Link href="/admin/notifications" className="dashboard-topbar-notification" aria-label="Notifications">
            <Bell size={20} />
            <span className="notif-badge"></span>
          </Link>
          <Link href="/admin/settings" className="dashboard-topbar-avatar">
            <User size={18} />
          </Link>
        </div>
      </div>
      <AdminSidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <main className="dashboard-main animate-slide-up">
        <div style={{ flex: 1 }}>
          {children}
        </div>
        <div style={{ padding: '32px 0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', fontSize: '0.8rem', color: 'var(--gray-500)', borderTop: '1px solid var(--gray-200)', marginTop: '24px' }}>
          <span>&copy; {new Date().getFullYear()} GCLT Transport & Trucking Services. All rights reserved.</span>
          <div style={{ display: 'flex', gap: '16px' }}>
            <a href="/legal/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)' }}>Data Privacy Policy</a>
          </div>
        </div>
      </main>
    </div>
  );
}
