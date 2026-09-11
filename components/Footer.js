'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Phone, Mail } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function Footer() {
  const { addToast } = useToast();
  const [newsletterEmail, setNewsletterEmail] = useState('');

  const handleNewsletterJoin = () => {
    const email = newsletterEmail.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      addToast('Please enter a valid email address to join the newsletter.', 'error');
      return;
    }
    setNewsletterEmail('');
    addToast('You are on the list! Keep an eye on your inbox for fleet updates.', 'success');
  };

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <div className="footer-brand">
            <Image
              src="/gclt-logo-new.png"
              alt="GCLT"
              width={32}
              height={32}
              style={{ borderRadius: '50%', objectFit: 'contain' }}
            />
            GCLT Transport
          </div>
          <p className="footer-desc">
            Incorporated in 2019, specializing in Domestic Freight Forwarding,
            Trucking, Logistics, Transhipment and Transportation.
          </p>
        </div>

        <div>
          <h4 className="footer-title">Services</h4>
          <div className="footer-links">
            <Link href="/dashboard/book" className="footer-link">Truck Booking</Link>
            <Link href="/trucks-for-sale" className="footer-link">Fleet Sales</Link>
            <Link href="/dashboard/ai-assistant" className="footer-link">AI Assistant</Link>
          </div>
        </div>

        <div>
          <h4 className="footer-title">Contact</h4>
          <div className="footer-links">
            <span className="footer-link" style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
              <MapPin size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
              #17 25th St. East Bajac-Bajac, Olongapo City
            </span>
            <span className="footer-link" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Phone size={14} style={{ flexShrink: 0 }} />
              (047) 222-4065
            </span>
            <a href="mailto:gclttruckingservices@yahoo.com" className="footer-link" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={14} style={{ flexShrink: 0 }} />
              gclttruckingservices@yahoo.com
            </a>
          </div>
        </div>

        <div>
          <h4 className="footer-title">Newsletter</h4>
          <div className="footer-newsletter">
            <input
              type="email"
              placeholder="Email address"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleNewsletterJoin(); }}
            />
            <button onClick={handleNewsletterJoin}>Join</button>
          </div>
        </div>
      </div>
      <div className="footer-bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <span>&copy; 2026 GCLT Transport & Trucking Services, Inc. All rights reserved.</span>
        <div style={{ display: 'flex', gap: '16px' }}>
          <a href="/legal/privacy" target="_blank" rel="noopener noreferrer" className="footer-link" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Data Privacy Policy</a>
          <a href="/legal/terms" target="_blank" rel="noopener noreferrer" className="footer-link" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}
