// app/driver/forgot-password/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/driver/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: data.message
        });
        setEmail('');
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Something went wrong'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Network error. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #E8F5E6, white, #FFF3E6)' }}>
      <div style={{ maxWidth: '400px', margin: '0 auto', padding: '4rem 1rem' }}>
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          border: '2px solid #E8F5E6'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔐</div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937' }}>
              Forgot Password?
            </h1>
            <p style={{ color: '#666', marginTop: '0.5rem' }}>
              Enter your email and we'll send you a reset link
            </p>
          </div>

          {/* Message */}
          {message && (
            <div style={{
              padding: '1rem',
              borderRadius: '0.5rem',
              marginBottom: '1rem',
              background: message.type === 'success' ? '#E8F5E6' : '#FEE9E7',
              border: `1px solid ${message.type === 'success' ? '#198A00' : '#DE2010'}`,
              color: message.type === 'success' ? '#198A00' : '#DE2010'
            }}>
              {message.text}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#198A00',
                marginBottom: '0.5rem'
              }}>
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '2px solid #198A00',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  outline: 'none'
                }}
                placeholder="driver@company.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.875rem',
                background: loading ? '#9CA3AF' : 'linear-gradient(to right, #198A00, #EF7D00)',
                color: 'white',
                fontSize: '1rem',
                fontWeight: '600',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          {/* Links */}
          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <Link 
              href="/driver/login"
              style={{ 
                color: '#198A00', 
                fontSize: '0.875rem',
                textDecoration: 'none',
                fontWeight: '500'
              }}
            >
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}