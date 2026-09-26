'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Truck, Bell, User, Menu, X, LogOut, LayoutDashboard, ShoppingBag, Calendar, MessageCircle } from 'lucide-react';

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/book', label: 'Book', icon: Truck },
  { href: '/dashboard/bookings', label: 'Bookings', icon: Calendar },
  { href: '/dashboard/trucks', label: 'Trucks', icon: ShoppingBag },
  { href: '/dashboard/purchases', label: 'Purchases', icon: ShoppingBag },
  { href: '/dashboard/appointments', label: 'Viewings', icon: Calendar },
];

// These live in the phone menu only — Alerts has the bell icon,
// AI Assistant has its own floating button.
const MENU_ONLY_LINKS = [
  { href: '/dashboard/notifications', label: 'Alerts', icon: Bell },
  { href: '/dashboard/ai-assistant', label: 'AI Assistant', icon: MessageCircle },
];

function initials(name) {
  return (name || 'U')
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function DashboardLayout({ children }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (!loading && user && ['admin', 'staff'].includes(user.role)) {
      router.push('/admin');
    }
  }, [user, loading, router]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const isActive = (href) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname === href || pathname.startsWith(href + '/');
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="spinner-overlay">
        <div className="spinner"></div>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading...</span>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="dash-shell">
      <header className="dash-nav">
        <div className="dash-nav-inner">
          <Link href="/dashboard" className="dash-brand">
            <span className="dash-brand-logo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/gclt-logo.png" alt="GCLT" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
            </span>
            <span className="dash-brand-text">
              <span className="dash-brand-name">GCLT Transport</span>
              <span className="dash-brand-sub">Book · Truck · Deliver</span>
            </span>
          </Link>

          <nav className="dash-nav-links">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`dash-nav-item ${isActive(href) ? 'active' : ''}`}
              >
                <Icon size={15} className="dash-ic" />
                {label}
              </Link>
            ))}
          </nav>

          <div className="dash-nav-right">
            <Link href="/dashboard/notifications" className="dash-icon-btn" aria-label="Notifications">
              <Bell size={18} />
              <span className="dash-notif-dot"></span>
            </Link>
            <Link href="/dashboard/profile" className="dash-user-chip" title={user.displayName || 'Profile'}>
              <span className="dash-avatar">
                {user.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.photoURL} alt="" />
                ) : (
                  initials(user.displayName)
                )}
              </span>
              <span className="dash-user-name">{user.displayName?.split(' ')[0] || 'Profile'}</span>
            </Link>
            <button className="dash-logout" onClick={handleLogout}>
              <LogOut size={15} /> <span className="dash-logout-label">Logout</span>
            </button>
            <button className="dash-burger" onClick={() => setMenuOpen((v) => !v)} aria-label="Menu">
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        <div className={`dash-mmenu ${menuOpen ? 'open' : ''}`}>
          {[...NAV_LINKS, ...MENU_ONLY_LINKS].map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={`dash-mmenu-item ${isActive(href) ? 'active' : ''}`}>
              <Icon size={16} /> {label}
            </Link>
          ))}
          <button className="dash-mmenu-item" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ba1a1a' }} onClick={handleLogout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      <div className="dash-content">
        <main className="dashboard-main">
          <div style={{ flex: 1 }}>
            {children}
          </div>
          <div className="dash-footer">
            <span>&copy; {new Date().getFullYear()} GCLT Transport &amp; Trucking Services. All rights reserved.</span>
            &nbsp;·&nbsp;
            <a href="/legal/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)' }}>Data Privacy Policy</a>
          </div>
        </main>
      </div>
    </div>
  );
}