'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, LayoutDashboard, LogOut, User } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { label: 'Book a Truck',    href: '/dashboard/book',  isActive: pathname === '/dashboard/book' },
    { label: 'Trucks for Sale', href: '/trucks-for-sale', isActive: pathname.startsWith('/trucks-for-sale') },
    { label: 'About Us',        href: '/#about',          isActive: false },
    { label: 'Contact',         href: '/#contact',        isActive: false },
  ];

  const handleLogout = async () => {
    setMobileOpen(false);
    await logout();
    router.push('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">

        {/* Brand */}
        <Link href="/" className="navbar-brand">
          <Image
            src="/gclt-logo-new.png"
            alt="GCLT Transport & Trucking Services"
            width={40}
            height={40}
            style={{ borderRadius: '50%', objectFit: 'contain' }}
            priority
          />
          <span>GCLT Transport</span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="navbar-links">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`navbar-link${link.isActive ? ' active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="navbar-actions">
          {user ? (
            <>
              {/* Authenticated: Dashboard + Avatar + Logout */}
              <Link href="/dashboard" className="navbar-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
              <Link href="/dashboard/profile" className="navbar-avatar" aria-label="Profile">
                <User size={18} />
              </Link>
              <button
                className="navbar-logout-btn"
                onClick={handleLogout}
                aria-label="Logout"
                title="Sign out"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <>
              {/* Not authenticated: Login + Register */}
              <Link href="/login" className="navbar-link">
                Login
              </Link>
              <Link href="/login?tab=register" className="btn-pill">
                Register
              </Link>
            </>
          )}

          {/* Mobile hamburger */}
          <button
            className="navbar-mobile-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div className={`navbar-mobile-menu${mobileOpen ? ' open' : ''}`}>
        {navLinks.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className={`navbar-mobile-link${link.isActive ? ' active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            {link.label}
          </Link>
        ))}
        <div className="navbar-mobile-divider" />
        {user ? (
          <>
            <Link href="/dashboard" className="navbar-mobile-link" onClick={() => setMobileOpen(false)}>
              <LayoutDashboard size={16} style={{ marginRight: '8px' }} />
              Dashboard
            </Link>
            <Link href="/dashboard/profile" className="navbar-mobile-link" onClick={() => setMobileOpen(false)}>
              <User size={16} style={{ marginRight: '8px' }} />
              Profile
            </Link>
            <button
              className="navbar-mobile-link"
              onClick={handleLogout}
              style={{ width: '100%', textAlign: 'left', background: 'none', color: '#E8451C', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', borderBottom: 'none' }}
            >
              <LogOut size={16} style={{ marginRight: '8px' }} />
              Sign Out
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="navbar-mobile-link" onClick={() => setMobileOpen(false)}>
              Login
            </Link>
            <Link
              href="/login?tab=register"
              className="btn-pill"
              style={{ marginTop: '12px', textAlign: 'center' }}
              onClick={() => setMobileOpen(false)}
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
