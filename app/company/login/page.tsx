'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Google Sign-In Script loader
declare global {
  interface Window {
    google?: any;
  }
}

export default function CompanyLogin() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    company_name: '',
    license_number: '',
    company_registration_number: '',
    company_address: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin
        ? { email: formData.email, password: formData.password, twoFactorCode: requires2FA ? twoFactorCode : undefined }
        : { ...formData, user_type: 'company' };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      // Check if 2FA is required
      if (data.requires2FA) {
        setRequires2FA(true);
        setLoading(false);
        return;
      }

      if (isLogin) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        router.push('/company/dashboard');
      } else {
        setIsLogin(true);
        setSuccess(data.message || 'Registration successful! Your account is pending verification.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();
      setSuccess(data.message || 'If an account exists, a reset link has been sent.');
      
      // For development, show the reset URL
      if (data.devResetUrl) {
        console.log('DEV Reset URL:', data.devResetUrl);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    // Redirect to Google OAuth
    window.location.href = '/api/auth/google?user_type=company';
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #2BB2A9 0%, #659E85 50%, #1A8A82 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{ maxWidth: '28rem', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link href="/" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem',
            textDecoration: 'none'
          }}>
            <img
              src="/logo.jpg"
              alt="VayaZed Logo"
              style={{ width: '52px', height: '52px', objectFit: 'cover', objectPosition: 'center', borderRadius: '0.75rem', border: '2px solid white', boxShadow: '0 6px 14px rgba(0, 0, 0, 0.2)' }}
            />
            <span style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: 'white'
            }}>VayaZed Bus Booking</span>
          </Link>
          <h2 style={{
            fontSize: '1.875rem',
            fontWeight: 'bold',
            color: 'white',
            marginBottom: '0.5rem'
          }}>
            {isLogin ? 'Company Login' : 'Company Registration'}
          </h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            {isLogin ? 'Manage your buses and routes' : 'Register your bus company'}
          </p>
        </div>

        <div style={{
          backgroundColor: 'white',
          borderRadius: '1rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          padding: '2rem'
        }}>
          {error && (
            <div style={{
              marginBottom: '1rem',
              padding: '1rem',
              borderRadius: '0.5rem',
              backgroundColor: '#FEE2E2',
              color: '#991B1B'
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              marginBottom: '1rem',
              padding: '1rem',
              borderRadius: '0.5rem',
              backgroundColor: '#D1FAE5',
              color: '#065F46'
            }}>
              {success}
            </div>
          )}

          {/* Forgot Password Form */}
          {showForgotPassword ? (
            <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ color: '#6B7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                Enter your email address and we'll send you a link to reset your password.
              </p>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #D1D5DB', borderRadius: '0.5rem', fontSize: '1rem' }}
                  placeholder="company@example.com"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  background: loading ? '#9CA3AF' : '#2BB2A9',
                  color: 'white',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  fontWeight: '600',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '1rem'
                }}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForgotPassword(false); setError(''); setSuccess(''); }}
                style={{ color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}
              >
                Back to Login
              </button>
            </form>
          ) : requires2FA ? (
            /* 2FA Verification Form */
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ color: '#6B7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                Enter the 6-digit code from your authenticator app.
              </p>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                  Authentication Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                  style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #D1D5DB', borderRadius: '0.5rem', fontSize: '1.5rem', textAlign: 'center', letterSpacing: '0.5em' }}
                  placeholder="000000"
                />
              </div>
              <button
                type="submit"
                disabled={loading || twoFactorCode.length !== 6}
                style={{
                  width: '100%',
                  background: loading || twoFactorCode.length !== 6 ? '#9CA3AF' : '#2BB2A9',
                  color: 'white',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  fontWeight: '600',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '1rem'
                }}
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>
              <button
                type="button"
                onClick={() => { setRequires2FA(false); setTwoFactorCode(''); setError(''); }}
                style={{ color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}
              >
                Back to Login
              </button>
            </form>
          ) : (
          /* Main Login/Register Form */
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {!isLogin && (
              <>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Company Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid #D1D5DB',
                      borderRadius: '0.5rem',
                      fontSize: '1rem'
                    }}
                    placeholder="Mazhindu Bus Services"
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    RTSA License Number
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.license_number}
                    onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid #D1D5DB',
                      borderRadius: '0.5rem',
                      fontSize: '1rem'
                    }}
                    placeholder="RTSA-PSV-2024-001"
                  />
                  <p style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.25rem' }}>Road Transport and Safety Agency license</p>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    PACRA Registration Number
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.company_registration_number}
                    onChange={(e) => setFormData({ ...formData, company_registration_number: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid #D1D5DB',
                      borderRadius: '0.5rem',
                      fontSize: '1rem'
                    }}
                    placeholder="REG/2024/12345"
                  />
                  <p style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.25rem' }}>Patents and Companies Registration Agency number</p>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Company Address
                  </label>
                  <textarea
                    required
                    value={formData.company_address}
                    onChange={(e) => setFormData({ ...formData, company_address: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid #D1D5DB',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      minHeight: '80px',
                      resize: 'vertical'
                    }}
                    placeholder="Plot 123, Cairo Road, Lusaka, Zambia"
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Contact Person Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid #D1D5DB',
                      borderRadius: '0.5rem',
                      fontSize: '1rem'
                    }}
                    placeholder="John Banda"
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid #D1D5DB',
                      borderRadius: '0.5rem',
                      fontSize: '1rem'
                    }}
                    placeholder="+260977123456"
                  />
                </div>
              </>
            )}

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Email Address
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '1px solid #D1D5DB',
                  borderRadius: '0.5rem',
                  fontSize: '1rem'
                }}
                placeholder="company@example.com"
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Password
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '1px solid #D1D5DB',
                  borderRadius: '0.5rem',
                  fontSize: '1rem'
                }}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: loading ? '#9CA3AF' : 'linear-gradient(to right, #2BB2A9, #659E85)',
                color: 'white',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                fontWeight: '600',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1rem'
              }}
            >
              {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Register')}
            </button>

            {/* Forgot Password Link - Login only */}
            {isLogin && (
              <button
                type="button"
                onClick={() => { setShowForgotPassword(true); setError(''); setSuccess(''); }}
                style={{
                  color: '#6B7280',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  textAlign: 'center',
                  width: '100%'
                }}
              >
                Forgot your password?
              </button>
            )}
          </form>
          )}

          {/* Divider */}
          {!showForgotPassword && !requires2FA && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.5rem 0' }}>
              <div style={{ flex: 1, height: '1px', background: '#E5E7EB' }}></div>
              <span style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>or</span>
              <div style={{ flex: 1, height: '1px', background: '#E5E7EB' }}></div>
            </div>
          )}

          {/* Google Login Button */}
          {!showForgotPassword && !requires2FA && (
            <button
              type="button"
              onClick={handleGoogleLogin}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                padding: '0.75rem',
                border: '1px solid #D1D5DB',
                borderRadius: '0.5rem',
                background: 'white',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
                color: '#374151'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          )}

          {!showForgotPassword && !requires2FA && (
          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setSuccess('');
              }}
              style={{
                color: '#2BB2A9',
                fontWeight: '500',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
            </button>
          </div>
          )}

          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <Link href="/" style={{
              color: '#6B7280',
              fontSize: '0.875rem',
              textDecoration: 'none'
            }}>
              ← Back to Home
            </Link>
          </div>
        </div>

        {isLogin && !showForgotPassword && !requires2FA && (
          <div style={{
            marginTop: '1.5rem',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '2px solid #2BB2A9',
            borderRadius: '0.5rem',
            padding: '1rem'
          }}>
            <p style={{
              fontSize: '0.875rem',
              color: '#2BB2A9',
              fontWeight: '600',
              marginBottom: '0.5rem'
            }}>Demo Company Credentials:</p>
            <p style={{ fontSize: '0.875rem', color: '#374151' }}>Email: info@mazhindubuses.com</p>
            <p style={{ fontSize: '0.875rem', color: '#374151' }}>Password: password123</p>
          </div>
        )}

        {/* Pending Verification Notice */}
        {!isLogin && (
          <div style={{
            marginTop: '1rem',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '2px solid #659E85',
            borderRadius: '0.5rem',
            padding: '1rem'
          }}>
            <p style={{ fontSize: '0.875rem', color: '#92400E', fontWeight: '600', marginBottom: '0.5rem' }}>
              Verification Required
            </p>
            <p style={{ fontSize: '0.75rem', color: '#374151' }}>
              New company registrations require admin approval. Please ensure you provide valid RTSA and PACRA registration documents for verification.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}