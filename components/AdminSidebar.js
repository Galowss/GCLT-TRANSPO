'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { LayoutDashboard, Truck, Calendar, Users, Bell, Settings, Receipt, LogOut, ShoppingBag, X } from 'lucide-react';

const adminLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/bookings', label: 'Bookings', icon: Truck },
  { href: '/admin/fleet', label: 'Available Fleet', icon: Truck },
  { href: '/admin/trucks', label: 'Truck Listings', icon: ShoppingBag },
  { href: '/admin/appointments', label: 'Appointments', icon: Calendar },
  { href: '/admin/transactions', label: 'Transactions', icon: Receipt },
  { href: '/admin/customers', label: 'User Management', icon: Users },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminSidebar({ isOpen, setIsOpen }) {
  const pathname = usePathname();
  const { logout } = useAuth();

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
        {adminLinks.map((link) => {
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
        <button className="sidebar-logout-btn" onClick={() => {
          if(setIsOpen) setIsOpen(false);
          logout();
        }}>
          <LogOut size={18} /> Logout
        </button>
      </div>
    </aside>
    </>
  );
}
