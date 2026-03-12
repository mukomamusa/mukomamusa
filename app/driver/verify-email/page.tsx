// app/driver/verify-email/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function VerifyEmail() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (!token) {
      setMessage({
        type: 'error',
        text: 'No verification token provided'
      });
      setLoading(false);
      return;
    }

    verifyEmail();
  }, [token]);

  const verifyEmail = async () => {
    try {
      const response = await fetch(`/api/driver/verify-email?token=${token}`);
      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: data.message
        });
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Verification failed'
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
          border: '2px solid #E8F5E6',
          textAlign: 'center'
        }}>
          {/* Header */}
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
            {loading ? '⏳' : message?.type === 'success' ? '✅' : '❌'}
          </div>

          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>
            {loading ? 'Verifying...' : message?.type === 'success' ? 'Email Verified!' : 'Verification Failed'}
          </h1>

          {loading ? (
            <div style={{ margin: '2rem 0' }}>
              <div style={{ 
                width: '3rem', 
                height: '3rem', 
                border: '3px solid #E8F5E6',
                borderTop: '3px solid #198A00',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto'
              }}></div>
            </div>
          ) : (
            <>
              <p style={{ color: '#666', marginBottom: '2rem', whiteSpace: 'pre-line' }}>
                {message?.text}
              </p>

              <Link
                href="/driver/login"
                style={{
                  display: 'inline-block',
                  padding: '0.75rem 2rem',
                  background: 'linear-gradient(to right, #198A00, #EF7D00)',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '600',
                  borderRadius: '0.5rem',
                  textDecoration: 'none',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
              >
                Go to Login
              </Link>
            </>
          )}
        </div>
      </div>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}