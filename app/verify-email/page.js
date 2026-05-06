'use client';

import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Mail, RefreshCw, ArrowRight } from 'lucide-react';

export default function VerifyEmail() {
  const { user, loading, resendVerification, refreshUser } = useAuth();
  const router = useRouter();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.emailVerified) {
      router.push('/dashboard');
    }
  }, [user, router]);

  // Poll for verification status every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const updated = await refreshUser();
      if (updated?.emailVerified) {
        router.push('/dashboard');
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [refreshUser, router]);

  const handleResend = async () => {
    setResending(true);
    try {
      await resendVerification();
      setResent(true);
      setTimeout(() => setResent(false), 5000);
    } catch (err) {
      console.error('Resend failed:', err);
    }
    setResending(false);
  };

  const handleCheckNow = async () => {
    setChecking(true);
    const updated = await refreshUser();
    if (updated?.emailVerified) {
      router.push('/dashboard');
    }
    setChecking(false);
  };

  if (loading) {
    return (
      <div className="spinner-overlay">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--gray-50)',
      padding: '24px',
    }}>
      <div className="card card-lg" style={{ maxWidth: '480px', textAlign: 'center' }}>
        <div style={{
          width: '72px', height: '72px', borderRadius: '50%',
          background: 'var(--primary-light)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px', color: 'var(--primary)',
        }}>
          <Mail size={32} />
        </div>

        <h2 style={{ marginBottom: '8px' }}>Verify Your Email</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: 1.6 }}>
          We sent a verification link to:
        </p>
        <p style={{ fontWeight: 600, marginBottom: '24px', color: 'var(--primary)' }}>
          {user?.email}
        </p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '32px', lineHeight: 1.6 }}>
          Please check your inbox and click the verification link to activate your account.
          This page will automatically redirect once verified.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            className="btn btn-primary btn-full"
            onClick={handleCheckNow}
            disabled={checking}
            style={{ gap: '8px' }}
          >
            {checking ? <><RefreshCw size={16} className="spin" /> Checking...</> : <><ArrowRight size={16} /> I have verified my email</>}
          </button>

          <button
            className="btn btn-outline btn-full"
            onClick={handleResend}
            disabled={resending || resent}
          >
            {resent ? 'Verification email sent!' : resending ? 'Sending...' : 'Resend verification email'}
          </button>
        </div>

        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '24px' }}>
          Did not receive the email? Check your spam folder or try resending.
        </p>
      </div>
    </div>
  );
}
