'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle } from 'lucide-react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

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
          width: '80px', height: '80px', borderRadius: '50%', background: 'var(--success-light, #E8F5E9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px', color: 'var(--success)',
        }}>
          <CheckCircle size={40} />
        </div>
        <h1 style={{ marginBottom: '8px', color: 'var(--success)' }}>Payment Successful</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
          Your payment has been processed successfully. A GCLT representative will contact you
          shortly to confirm the details.
        </p>
        {sessionId && (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
            Session ID: {sessionId.slice(0, 20)}...
          </p>
        )}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Link href="/dashboard" className="btn btn-primary">Go to Dashboard</Link>
          <Link href="/" className="btn btn-outline">Return Home</Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccess() {
  return (
    <Suspense fallback={<div className="spinner-overlay"><div className="spinner"></div></div>}>
      <SuccessContent />
    </Suspense>
  );
}
