'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { LayoutDashboard, Truck, Calendar, Users, Bell, Settings, Receipt, LogOut, ShoppingBag, X, BarChart2 } from 'lucide-react';

const adminLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/bookings', label: 'Bookings', icon: Truck },
  { href: '/admin/fleet', label: 'Available Fleet', icon: Truck },
  { href: '/admin/trucks', label: 'Truck Listings', icon: ShoppingBag },
  { href: '/admin/purchases', label: 'Truck Purchases', icon: ShoppingBag },
  { href: '/admin/appointments', label: 'Appointments', icon: Calendar },
  { href: '/admin/transactions', label: 'Transactions', icon: Receipt },
  { href: '/admin/reports', label: 'Reports', icon: BarChart2 },
  { href: '/admin/customers', label: 'User Management', icon: Users },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminSidebar({ isOpen, setIsOpen }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Staff cannot see or access User Management (promote/demote is admin-only)
  const links = user?.role === 'admin'
    ? adminLinks
    : adminLinks.filter(link => link.href !== '/admin/customers');

  return (
    <>
      <div 
        className={`sidebar-overlay ${isOpen ? 'open' : ''}`} 
        onClick={() => setIsOpen && setIsOpen(false)}
      />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-mobile-header">
          <span className="sidebar-mobile-title">Admin Menu</span>
          <button 
            className="sidebar-close-btn" 
            onClick={() => setIsOpen && setIsOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="sidebar-nav">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`sidebar-link ${pathname === link.href ? 'active' : ''}`}
              onClick={() => setIsOpen && setIsOpen(false)}
            >
              <span className="sidebar-link-icon"><Icon size={18} /></span>
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="sidebar-logout">
        <button
          className="sidebar-logout-btn"
          onClick={async () => {
            if (setIsOpen) setIsOpen(false);
            await logout();
            window.location.href = '/login';
          }}
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
    </aside>
    </>
  );
}
