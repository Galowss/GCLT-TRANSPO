import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Phone, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <div className="footer-brand">
            <Image
              src="/gclt-logo.png"
              alt="GCLT"
              width={32}
              height={32}
              style={{ borderRadius: '50%', objectFit: 'contain' }}
            />
            GCLT
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
            <input type="email" placeholder="Email address" />
            <button>Join</button>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        &copy; 2026 GCLT Transport & Trucking Services, Inc. All rights reserved.
      </div>
    </footer>
  );
}
