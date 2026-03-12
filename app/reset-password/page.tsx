'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!token || !email) {
      setError('Invalid or missing reset token. Please request a new password reset link.');
    }
  }, [token, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, newPassword: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #198A00 0%, #EF7D00 50%, #DE2010 100%)',
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
            <svg style={{ width: '2.25rem', height: '2.25rem', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8m-8 4h8m-4 4v3m-6-3h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7a2 2 0 002 2zm0 0v3a1 1 0 001 1h2m8-4v3a1 1 0 01-1 1h-2" />
            </svg>
            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>VayaZed Bus Booking</span>
          </Link>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>
            Reset Password
          </h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            Enter your new password below
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

          {success ? (
            <div>
              <div style={{
                marginBottom: '1.5rem',
                padding: '1rem',
                borderRadius: '0.5rem',
                backgroundColor: '#D1FAE5',
                color: '#065F46',
                textAlign: 'center'
              }}>
                <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Password Reset Successful!</p>
                <p style={{ fontSize: '0.875rem' }}>You can now login with your new password.</p>
              </div>
              <Link href="/customer/login" style={{
                display: 'block',
                width: '100%',
                background: 'linear-gradient(to right, #198A00, #EF7D00)',
                color: 'white',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                fontWeight: '600',
                textAlign: 'center',
                textDecoration: 'none'
              }}>
                Go to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '0.5rem',
                    fontSize: '1rem'
                  }}
                  placeholder="••••••••"
                  minLength={8}
                />
                <p style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.25rem' }}>
                  Minimum 8 characters
                </p>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                disabled={loading || !token || !email}
                style={{
                  width: '100%',
                  background: loading || !token ? '#9CA3AF' : 'linear-gradient(to right, #198A00, #EF7D00)',
                  color: 'white',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  fontWeight: '600',
                  border: 'none',
                  cursor: loading || !token ? 'not-allowed' : 'pointer',
                  fontSize: '1rem'
                }}
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <Link href="/customer/login" style={{
              color: '#6B7280',
              fontSize: '0.875rem',
              textDecoration: 'none'
            }}>
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #198A00 0%, #EF7D00 50%, #DE2010 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <p style={{ color: 'white' }}>Loading...</p>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
