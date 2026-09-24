'use client';

import { useState, Suspense, lazy } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import Navbar from '@/components/Navbar';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Calendar } from 'lucide-react';
import styles from './login.module.css';

// Heavy / non-critical pieces load lazily: the legal text modal and the
// Cloudflare Turnstile widget only download when the login tab needs them.
const Turnstile = dynamic(() => import('@/components/Turnstile'), {
  ssr: false,
  loading: () => <div className="spinner" />,
});
const LegalDocsModal = dynamic(() => import('@/components/LegalDocsModal'), {
  loading: () => null,
});

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login, register, loginWithGoogle, resetPassword } = useAuth();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') === 'register' ? 'register' : 'login');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    remember: false,
    dateOfBirth: '',
    agreedToTerms: false,
  });

  // Logged-in users always land on the dashboard (or admin) first,
  // regardless of the page they came from. Deep links are not restored here.
  const homeFor = (user) => (['admin', 'staff'].includes(user?.role) ? '/admin' : '/dashboard');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setError('');
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail) { setError('Please enter your email address.'); return; }
    setResetLoading(true);
    setError('');
    try {
      await resetPassword(resetEmail);
      setResetSent(true);
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        setError('No account found with that email address.');
      } else {
        setError(err.message || 'Failed to send reset email. Please try again.');
      }
    }
    setResetLoading(false);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setTurnstileToken('');
    setError('');
    setTurnstileResetKey(prev => prev + 1);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!turnstileToken) {
      setError('Please complete the security challenge.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // 1. Verify Turnstile token on the backend
      const verifyRes = await fetch('/api/verify-turnstile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: turnstileToken }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        throw new Error(verifyData.error || 'Bot verification failed.');
      }

      // 2. Proceed with login
      const user = await login(formData.email, formData.password);
      if (!user.emailVerified) {
        router.push('/verify-email');
      } else {
        router.push(homeFor(user));
      }
    } catch (err) {
      // Reset security widget on error
      setTurnstileToken('');
      setTurnstileResetKey(prev => prev + 1);

      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password. Please try again.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (!turnstileToken) {
      setError('Please complete the security challenge.');
      return;
    }
    // Validate date of birth (must be 18+)
    if (!formData.dateOfBirth) {
      setError('Please enter your date of birth.');
      return;
    }
    const dob = new Date(formData.dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear() -
      (today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);
    if (age < 18) {
      setError('You must be at least 18 years old to register.');
      return;
    }
    // Validate Terms & Conditions
    if (!formData.agreedToTerms) {
      setError('Please agree to the Terms & Conditions and Privacy Policy to continue.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // 1. Verify Turnstile token on the backend
      const verifyRes = await fetch('/api/verify-turnstile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: turnstileToken }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        throw new Error(verifyData.error || 'Bot verification failed.');
      }

      // 2. Proceed with registration
      await register(formData.name, formData.email, formData.password, formData.dateOfBirth);
      router.push('/verify-email');
    } catch (err) {
      // Reset security widget on error
      setTurnstileToken('');
      setTurnstileResetKey(prev => prev + 1);

      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please log in instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please use at least 6 characters.');
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const user = await loginWithGoogle();
      router.push(homeFor(user));
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') {
        // User closed popup, do nothing
      } else {
        setError(err.message || 'Google sign-in failed. Please try again.');
      }
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.bgImage}>
        <div className={styles.logoContainer}>
          <img src="/gclt-logo-new.png" alt="GCLT Logo" className={styles.heroLogo} />
        </div>
        <div className={styles.bgOverlay}>
          <div className={styles.hqInfo}>
            <h3>Olongapo Main HQ</h3>
            <p>Rizal Highway, SBMA,<br />Subic Bay Freeport Zone,<br />2222 Philippines</p>
            <a href="tel:+630472526258" className={styles.phone}>+63 (047) 252-GCLT</a>
          </div>
        </div>
      </div>
      <div className={styles.formSide}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h2>Access Portal</h2>
          </div>
          <p className={styles.formSubtitle}>
            Welcome to GCLT. Manage your fleet and bookings with ease.
          </p>

          <div className={styles.tabRow}>
            <button
              className={`${styles.tab} ${activeTab === 'login' ? styles.tabActive : ''}`}
              onClick={() => handleTabChange('login')}
            >
              Login
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'register' ? styles.tabActive : ''}`}
              onClick={() => handleTabChange('register')}
            >
              Register
            </button>
          </div>

          <div className={styles.servingBadge}>
            Serving SBMA and Olongapo
          </div>

          {error && (
            <div style={{ padding: '12px 16px', background: '#FFF0F0', border: '1px solid #E8451C', borderRadius: 'var(--border-radius)', color: '#E8451C', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {activeTab === 'login' && showReset ? (
            <div className={styles.form} style={{ paddingTop: '8px' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '4px', color: 'var(--text-primary)' }}>Reset Your Password</h3>
              <p className={styles.formSubtitle} style={{ margin: '0 0 16px' }}>
                Enter your account email and we'll send you a link to reset your password.
              </p>
              {resetSent ? (
                <>
                  <div style={{ display: 'flex', gap: '12px' }} className="alert alert-success" role="alert">
                    <div style={{ fontSize: '0.9rem', padding: '12px 16px', background: '#EEF7EB', border: '1px solid #2E7D32', borderRadius: 'var(--border-radius)', color: '#24551F', marginBottom: '16px', lineHeight: '1.5' }}>
                      If an account exists for <strong>{resetEmail}</strong>, a password reset link has been sent. Check your inbox (and spam folder), then return here to sign in.
                    </div>
                  </div>
                  <button type="button" className="btn btn-primary btn-full btn-lg" onClick={() => { setResetSent(false); setShowReset(false); }}>
                    Back to Login
                  </button>
                </>
              ) : (
                <form onSubmit={handleResetPassword}>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="name@company.com"
                      value={resetEmail}
                      onChange={(e) => { setResetEmail(e.target.value); setError(''); }}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-accent btn-full btn-lg" disabled={resetLoading}>
                    {resetLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </form>
              )}
              <p style={{ textAlign: 'center', marginTop: '16px' }}>
                <a href="#" className={styles.forgotLink} onClick={(e) => { e.preventDefault(); setShowReset(false); setError(''); }}>Back to Login</a>
              </p>
            </div>
          ) : activeTab === 'login' ? (
            <form onSubmit={handleLogin} className={styles.form}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className={styles.inputWithIcon}>
                  <span className={styles.inputIcon}><Mail size={16} color="#9E9E9E" /></span>
                  <input
                    type="email"
                    name="email"
                    className="form-input"
                    placeholder="name@company.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    style={{ paddingLeft: '40px' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">Password</label>
                  <a href="#" className={styles.forgotLink} onClick={(e) => { e.preventDefault(); setShowReset(true); setError(''); }}>Forgot password?</a>
                </div>
                <div className={styles.inputWithIcon}>
                  <span className={styles.inputIcon}><Lock size={16} color="#9E9E9E" /></span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    className="form-input"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                    required
                    style={{ paddingLeft: '40px' }}
                  />
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <label className={styles.checkbox}>
                <input type="checkbox" name="remember" checked={formData.remember} onChange={handleChange} />
                <span>Remember me for 30 days</span>
              </label>

              <Turnstile
                key={`login-${turnstileResetKey}`}
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                onSuccess={(token) => setTurnstileToken(token)}
                onError={() => setError('Bot detection failed to load. Please reload.')}
                onExpire={() => setTurnstileToken('')}
              />

              <button type="submit" className="btn btn-accent btn-full btn-lg" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>

              <div className={styles.divider}>
                <span>OR CONTINUE WITH</span>
              </div>

              <button
                type="button"
                className="btn btn-outline btn-full btn-lg"
                onClick={handleGoogleLogin}
                disabled={loading}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  fontWeight: 600, borderColor: 'var(--gray-300)',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" /><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" /><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" /><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" /></svg>
                Continue with Google
              </button>

              <p className={styles.supportText}>
                Trouble accessing your account? <a href="tel:+630472526258">Contact Support</a>
              </p>

              <p className={styles.privacyText}>
                Your data is protected under GCLT Privacy Standards.
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister} className={styles.form}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  name="name"
                  className="form-input"
                  placeholder="Juan Dela Cruz"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Date of Birth *</label>
                <div className={styles.inputWithIcon}>
                  <span className={styles.inputIcon}><Calendar size={16} color="#9E9E9E" /></span>
                  <input
                    type="date"
                    name="dateOfBirth"
                    className="form-input"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                    required
                    style={{ paddingLeft: '40px' }}
                  />
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>You must be at least 18 years old to register.</span>
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  name="password"
                  className="form-input"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  className="form-input"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  <input
                    type="checkbox"
                    name="agreedToTerms"
                    checked={formData.agreedToTerms}
                    onChange={handleChange}
                    style={{ marginTop: '2px', width: '16px', height: '16px', flexShrink: 0, accentColor: 'var(--primary)' }}
                  />
                  <span>
                    I have read and agree to the{' '}
                    <button
                      type="button"
                      onClick={() => setShowLegalModal(true)}
                      style={{ color: 'var(--primary)', fontWeight: 600, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline', fontSize: '0.85rem' }}
                    >
                      Terms &amp; Conditions
                    </button>{' '}and{' '}
                    <button
                      type="button"
                      onClick={() => setShowLegalModal(true)}
                      style={{ color: 'var(--primary)', fontWeight: 600, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline', fontSize: '0.85rem' }}
                    >
                      Privacy Policy
                    </button>.
                  </span>
                </label>
              </div>

              <Turnstile
                key={`register-${turnstileResetKey}`}
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                onSuccess={(token) => setTurnstileToken(token)}
                onError={() => setError('Bot detection failed to load. Please reload.')}
                onExpire={() => setTurnstileToken('')}
              />

              <button type="submit" className="btn btn-accent btn-full btn-lg" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>

              <div className={styles.divider}>
                <span>OR CONTINUE WITH</span>
              </div>

              <button
                type="button"
                className="btn btn-outline btn-full btn-lg"
                onClick={handleGoogleLogin}
                disabled={loading}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  fontWeight: 600, borderColor: 'var(--gray-300)',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" /><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" /><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" /><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" /></svg>
                Sign up with Google
              </button>
            </form>
          )}

          <div className={styles.formBottom}>
            <a href="/">Return to Homepage</a>
            <a href="/trucks-for-sale">Browse Fleet</a>
          </div>
        </div>

        <LegalDocsModal
          open={showLegalModal}
          onClose={() => setShowLegalModal(false)}
          onAgree={() => setFormData(prev => ({ ...prev, agreedToTerms: true }))}
        />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<div className="spinner-overlay"><div className="spinner"></div></div>}>
        <LoginForm />
      </Suspense>
    </>
  );
}
