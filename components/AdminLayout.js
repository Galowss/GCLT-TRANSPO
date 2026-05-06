'use client';

import AdminSidebar from './AdminSidebar';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Truck, Bell, User, Menu } from 'lucide-react';

export default function AdminLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (!loading && user && user.role !== 'admin') {
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

  if (!user || user.role !== 'admin') return null;

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
            <div className="dashboard-topbar-brand-icon">
              <Truck size={18} />
            </div>
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
      <main className="dashboard-main">
        {children}
        <div style={{ textAlign: 'center', padding: '32px 0 16px', fontSize: '0.8rem', color: 'var(--gray-500)' }}>
          &copy; 2026 GCLT Transport & Trucking Services. All rights reserved.
        </div>
      </main>
    </div>
  );
}
