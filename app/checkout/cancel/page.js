'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export default function CheckoutCancel() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--gray-50)',
      padding: '24px',
    }}>
      <div className="card card-lg" style={{ maxWidth: '500px', textAlign: 'center' }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%', background: 'var(--warning-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px', color: '#F5A623',
        }}>
          <AlertTriangle size={40} />
        </div>
        <h1 style={{ marginBottom: '8px' }}>Payment Cancelled</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
          Your payment was not completed. No charges were made to your account.
          You can try again or choose Cash on Delivery instead.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Link href="/dashboard/book" className="btn btn-accent">Try Again</Link>
          <Link href="/" className="btn btn-outline">Return Home</Link>
        </div>
      </div>
    </div>
  );
}
