'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="navbar-brand">
          <Image
            src="/gclt-logo.png"
            alt="GCLT Transport & Trucking Services"
            width={40}
            height={40}
            style={{ borderRadius: '50%', objectFit: 'contain' }}
            priority
          />
          <span>GCLT Transport &amp; Trucking Services</span>
        </Link>

        <div className="navbar-links">
          <Link
            href="/dashboard/book"
            className={`navbar-link ${pathname === '/dashboard/book' ? 'active' : ''}`}
          >
            Book a Truck
          </Link>
          <Link
            href="/trucks-for-sale"
            className={`navbar-link ${pathname.startsWith('/trucks-for-sale') ? 'active' : ''}`}
          >
            Trucks for Sale
          </Link>
        </div>

        <div className="navbar-actions">
          <Link href="/login" className="navbar-link">Login</Link>
          <Link href="/login?tab=register" className="btn btn-accent btn-sm">Register</Link>
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
      <div className={`navbar-mobile-menu ${mobileOpen ? 'open' : ''}`}>
        <Link
          href="/dashboard/book"
          className="navbar-mobile-link"
          onClick={() => setMobileOpen(false)}
        >
          Book a Truck
        </Link>
        <Link
          href="/trucks-for-sale"
          className="navbar-mobile-link"
          onClick={() => setMobileOpen(false)}
        >
          Trucks for Sale
        </Link>
        <div className="navbar-mobile-divider"></div>
        <Link
          href="/login"
          className="navbar-mobile-link"
          onClick={() => setMobileOpen(false)}
        >
          Login
        </Link>
        <Link
          href="/login?tab=register"
          className="btn btn-accent"
          style={{ marginTop: '12px', textAlign: 'center' }}
          onClick={() => setMobileOpen(false)}
        >
          Register
        </Link>
      </div>
    </nav>
  );
}

