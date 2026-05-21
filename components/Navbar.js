'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, Bell } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { label: 'Book a Truck',     href: '/dashboard/book',   isActive: pathname === '/dashboard/book' },
    { label: 'Trucks for Sale',  href: '/trucks-for-sale',  isActive: pathname.startsWith('/trucks-for-sale') },
    { label: 'Fleet Inventory',  href: '/trucks-for-sale',  isActive: false },
    { label: 'About Us',         href: '#about',            isActive: pathname === '/#about' },
    { label: 'Contact',          href: '#contact',          isActive: pathname === '/#contact' },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-inner">

        {/* Brand */}
        <Link href="/" className="navbar-brand">
          <Image
            src="/gclt-logo.png"
            alt="GCLT Transport"
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
          {/* Notification Bell */}
          <button className="navbar-bell" aria-label="Notifications">
            <Bell size={20} />
          </button>

          {/* Login (text link) */}
          <Link href="/login" className="navbar-link">
            Login
          </Link>

          {/* Register pill button */}
          <Link href="/login?tab=register" className="btn-pill">
            Register
          </Link>

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
      </div>
    </nav>
  );
}

