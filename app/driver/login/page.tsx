// app/driver/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DriverLogin() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const deviceId = localStorage.getItem('driver_device_id') || 
        `web-${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem('driver_device_id', deviceId);

      const response = await fetch('/api/driver/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, deviceId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      localStorage.setItem('driver_token', data.token);
      localStorage.setItem('driver', JSON.stringify(data.driver));
      
      router.push('/driver/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleInputMode = () => {
    setLoginMethod(loginMethod === 'email' ? 'phone' : 'email');
    setUsername('');
  };

  const validateInput = () => {
    if (!username) return false;
    
    if (loginMethod === 'email') {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username);
    } else {
      const phoneRegex = /^(\+260|0)[97][0-9]{8}$/;
      return phoneRegex.test(username.replace(/\s+/g, ''));
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #E6F7F6, white, #E8F3EC)' }}>
      {/* Header with VayaZed branding */}
      <header style={{ 
        background: 'white', 
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        borderBottom: '4px solid #2BB2A9'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none' }}>
              <img
                src="/logo.jpg"
                alt="VayaZed Logo"
                style={{
                  width: '60px',
                  height: '60px',
                  objectFit: 'cover',
                  objectPosition: 'center',
                  borderRadius: '0.75rem',
                  background: 'linear-gradient(135deg, #E6F7F6, #E8F3EC)',
                  border: '2px solid #2BB2A9',
                  boxShadow: '0 6px 14px rgba(0, 0, 0, 0.2)'
                }}
              />
              <div>
                <h1 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 'bold',
                  background: 'linear-gradient(to right, #2BB2A9, #659E85)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  VayaZed Driver Portal
                </h1>
                <p style={{ fontSize: '0.875rem', color: '#666' }}>Powered by Moov Company</p>
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* Login Form */}
      <div style={{ maxWidth: '28rem', margin: '3rem auto', padding: '0 1rem' }}>
        <div style={{ 
          background: 'white',
          borderRadius: '1rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          padding: '2rem',
          border: '2px solid #E6F7F6'
        }}>
          {/* Zambian flag indicator */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: '#D1E8DA',
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            marginBottom: '1.5rem'
          }}>
            <span style={{ fontSize: '1.25rem' }}>🇿🇲</span>
            <span style={{ color: '#BD6200', fontWeight: '500', fontSize: '0.875rem' }}>Driver Access</span>
          </div>

          <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
            Welcome Back
          </h2>
          <p style={{ color: '#6B7280', marginBottom: '2rem' }}>
            Sign in with your email or phone number
          </p>

          {error && (
            <div style={{
              marginBottom: '1rem',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              backgroundColor: '#E6F5F4',
              border: '1px solid #1A8A82',
              color: '#1A8A82'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                fontWeight: '600', 
                color: '#2BB2A9', 
                marginBottom: '0.5rem' 
              }}>
                {loginMethod === 'email' ? 'Email Address' : 'Phone Number'}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={loginMethod === 'email' ? 'email' : 'tel'}
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    paddingRight: '6rem',
                    border: username && !validateInput() 
                      ? '2px solid #1A8A82' 
                      : '2px solid #2BB2A9',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    outline: 'none',
                    backgroundColor: username && !validateInput() ? '#E6F5F4' : 'white'
                  }}
                  placeholder={loginMethod === 'email' 
                    ? 'driver@company.com' 
                    : '0977XXXXXX'
                  }
                />
                <button
                  type="button"
                  onClick={toggleInputMode}
                  style={{
                    position: 'absolute',
                    right: '0.5rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    padding: '0.25rem 0.75rem',
                    background: '#E6F7F6',
                    color: '#2BB2A9',
                    border: '1px solid #2BB2A9',
                    borderRadius: '0.375rem',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {loginMethod === 'email' ? 'Use phone →' : 'Use email →'}
                </button>
              </div>
              {username && !validateInput() && (
                <p style={{ fontSize: '0.75rem', color: '#1A8A82', marginTop: '0.25rem' }}>
                  {loginMethod === 'email' 
                    ? 'Please enter a valid email address' 
                    : 'Please enter a valid Zambian phone number'}
                </p>
              )}
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                fontWeight: '600', 
                color: '#2BB2A9', 
                marginBottom: '0.5rem' 
              }}>
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '2px solid #2BB2A9',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  outline: 'none'
                }}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !validateInput()}
              style={{
                width: '100%',
                padding: '0.875rem',
                background: loading || !validateInput() 
                  ? '#9CA3AF' 
                  : 'linear-gradient(to right, #2BB2A9, #659E85)',
                color: 'white',
                fontSize: '1rem',
                fontWeight: '600',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: loading || !validateInput() ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials with VayaZed styling */}
          <div style={{
            marginTop: '2rem',
            padding: '1rem',
            background: '#E6F7F6',
            borderRadius: '0.5rem',
            border: '2px dashed #2BB2A9'
          }}>
            <p style={{ 
              fontSize: '0.875rem', 
              fontWeight: '600', 
              color: '#2BB2A9', 
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span>🚌</span> Demo Driver Credentials
            </p>
            <div style={{ fontSize: '0.875rem', color: '#374151', space: '0.25rem 0' }}>
              <p><span style={{ color: '#659E85', fontWeight: '600' }}>Email:</span> john.kabuya@mazhindubusservices.vayazed.com</p>
              <p><span style={{ color: '#659E85', fontWeight: '600' }}>Phone:</span> +260713098977</p>
              <p><span style={{ color: '#659E85', fontWeight: '600' }}>Password:</span> driver123</p>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <Link 
              href="/" 
              style={{ 
                color: '#6B7280', 
                fontSize: '0.875rem',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              ← Back to Home
            </Link>
          </div>
        </div>

        {/* Footer with Zambian colors */}
        <div style={{
          marginTop: '1.5rem',
          display: 'flex',
          justifyContent: 'center',
          gap: '0.5rem'
        }}>
          <div style={{ width: '2rem', height: '0.25rem', background: '#2BB2A9', borderRadius: '9999px' }}></div>
          <div style={{ width: '2rem', height: '0.25rem', background: '#659E85', borderRadius: '9999px' }}></div>
          <div style={{ width: '2rem', height: '0.25rem', background: '#1A8A82', borderRadius: '9999px' }}></div>
        </div>
      </div>
    </div>
  );
}