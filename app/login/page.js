'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import Navbar from '@/components/Navbar';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import styles from './login.module.css';

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login, register, loginWithGoogle } = useAuth();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') === 'register' ? 'register' : 'login');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    remember: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await login(formData.email, formData.password);
      if (!user.emailVerified) {
        router.push('/verify-email');
      } else if (user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
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
    setLoading(true);
    setError('');
    try {
      await register(formData.name, formData.email, formData.password);
      router.push('/verify-email');
    } catch (err) {
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
      if (user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
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
          <img src="/gclt-logo.png" alt="GCLT Logo" className={styles.heroLogo} />
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
              onClick={() => setActiveTab('login')}
            >
              Login
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'register' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('register')}
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

          {activeTab === 'login' ? (
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
                  <a href="#" className={styles.forgotLink}>Forgot password?</a>
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
                <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                Continue with Google
              </button>

              <p className={styles.supportText}>
                Trouble accessing your account? <a href="#">Contact Support</a>
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
                <label className="form-label">Password</label>
                <input
                  type="password"
                  name="password"
                  className="form-input"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
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
                  required
                />
              </div>

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
                <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                Sign up with Google
              </button>
            </form>
          )}

          <div className={styles.formBottom}>
            <a href="/">Return to Homepage</a>
            <a href="/trucks-for-sale">Browse Fleet</a>
          </div>
        </div>
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
