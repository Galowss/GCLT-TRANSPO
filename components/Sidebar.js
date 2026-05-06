'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { LayoutDashboard, Truck, Calendar, ShoppingBag, User, LogOut, Bell, MessageCircle, X } from 'lucide-react';

const bookingLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/book', label: 'Book Transport', icon: Truck },
  { href: '/dashboard/bookings', label: 'My Bookings', icon: Calendar },
];

const marketplaceLinks = [
  { href: '/trucks-for-sale', label: 'Browse Trucks', icon: ShoppingBag },
  { href: '/dashboard/appointments', label: 'My Viewings', icon: Calendar },
];

const accountLinks = [
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { href: '/dashboard/ai-assistant', label: 'AI Assistant', icon: MessageCircle },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
];

export default function Sidebar({ isOpen, setIsOpen }) {
  const pathname = usePathname();
  const { logout } = useAuth();

  const isActive = (href) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname === href || pathname.startsWith(href + '/');
  };

  const renderLinks = (links) =>
    links.map((link) => {
      const Icon = link.icon;
      return (
        <Link
          key={link.href}
          href={link.href}
          className={`sidebar-link ${isActive(link.href) ? 'active' : ''}`}
          onClick={() => setIsOpen && setIsOpen(false)}
        >
          <span className="sidebar-link-icon"><Icon size={18} /></span>
          {link.label}
        </Link>
      );
    });

  return (
    <>
      <div 
        className={`sidebar-overlay ${isOpen ? 'open' : ''}`} 
        onClick={() => setIsOpen && setIsOpen(false)}
      />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-mobile-header">
          <span className="sidebar-mobile-title">Menu</span>
          <button 
            className="sidebar-close-btn" 
            onClick={() => setIsOpen && setIsOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Transport Services</div>
        {renderLinks(bookingLinks)}

        <div className="sidebar-section-label" style={{ marginTop: '20px' }}>Truck Marketplace</div>
        {renderLinks(marketplaceLinks)}

        <div className="sidebar-section-label" style={{ marginTop: '20px' }}>Account</div>
        {renderLinks(accountLinks)}
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
