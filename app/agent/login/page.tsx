'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { validateZambiaCellphone, validateZambiaNRC } from '@/app/lib/validations';

export default function AgentLogin() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Registration form
  const [regData, setRegData] = useState({
    business_name: '',
    business_type: 'independent',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    password: '',
    confirmPassword: '',
    nrc_number: '',
    address: '',
    city: '',
    province: '',
    physical_address: '',
    registration_number: '',
    tax_id: ''
  });

  const [errors, setErrors] = useState<{
    contact_phone?: string;
    nrc_number?: string;
  }>({});

  const validatePhone = (phone: string): boolean => {
    const result = validateZambiaCellphone(phone);
    if (!result.isValid) {
      setErrors(prev => ({ ...prev, contact_phone: result.error }));
      return false;
    }
    setErrors(prev => ({ ...prev, contact_phone: undefined }));
    return true;
  };

  const validateNRC = (nrc: string): boolean => {
    const result = validateZambiaNRC(nrc);
    if (!result.isValid) {
      setErrors(prev => ({ ...prev, nrc_number: result.error }));
      return false;
    }
    setErrors(prev => ({ ...prev, nrc_number: undefined }));
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/agent/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store token and redirect
      localStorage.setItem('agent_token', data.token);
      localStorage.setItem('agent', JSON.stringify(data.agent));
      localStorage.setItem('agent_locations', JSON.stringify(data.locations));
      
      router.push('/agent/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (regData.password !== regData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate phone and NRC before submitting
    if (!validatePhone(regData.contact_phone)) {
      setLoading(false);
      return;
    }
    if (!validateNRC(regData.nrc_number)) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/agent/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: regData.business_name,
          business_type: regData.business_type,
          contact_name: regData.contact_name,
          contact_email: regData.contact_email,
          contact_phone: regData.contact_phone,
          password: regData.password,
          nrc_number: regData.nrc_number,
          address: regData.address,
          city: regData.city,
          province: regData.province,
          physical_address: regData.physical_address || regData.address,
          registration_number: regData.registration_number || null,
          tax_id: regData.tax_id || null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setSuccess(data.message);
      // Switch to login after successful registration
      setTimeout(() => {
        setIsLogin(true);
        setLoginEmail(regData.contact_email);
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #13625D 0%, #197670 50%, #2BB2A9 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '28rem',
        background: 'white',
        borderRadius: '1rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ 
          background: 'linear-gradient(to right, #2BB2A9, #1F8A83)',
          padding: '2rem',
          textAlign: 'center',
          color: 'white'
        }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <img
                src="/logo.jpg"
                alt="VayaZed Logo"
                style={{
                  width: '52px',
                  height: '52px',
                  objectFit: 'cover',
                  objectPosition: 'center',
                  borderRadius: '0.75rem',
                  border: '2px solid white',
                  boxShadow: '0 6px 14px rgba(0, 0, 0, 0.2)'
                }}
              />
            </div>
          </Link>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>
            {isLogin ? 'Agent Login' : 'Agent Registration'}
          </h2>
          <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>
            {isLogin 
              ? 'Sell bus tickets on behalf of bus operators' 
              : 'Apply to become a ticket selling agent'}
          </p>
        </div>

        {/* Form */}
        <div style={{ padding: '2rem' }}>
          {error && (
            <div style={{ 
              background: '#E6F5F4', 
              border: '1px solid #1A8A82',
              color: '#1A8A82',
              padding: '0.75rem', 
              borderRadius: '0.5rem',
              marginBottom: '1rem',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ 
              background: '#E6F7F6', 
              border: '1px solid #2BB2A9',
              color: '#2BB2A9',
              padding: '0.75rem', 
              borderRadius: '0.5rem',
              marginBottom: '1rem',
              fontSize: '0.875rem'
            }}>
              {success}
            </div>
          )}

          {isLogin ? (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="agent@example.com"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '0.5rem',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '0.5rem',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: loading ? '#9CA3AF' : '#2BB2A9',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginTop: '0.5rem'
                }}
              >
                {loading ? 'Please wait...' : 'Login'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem', color: '#374151' }}>
                  Business Name *
                </label>
                <input
                  type="text"
                  required
                  value={regData.business_name}
                  onChange={(e) => setRegData({...regData, business_name: e.target.value})}
                  placeholder="e.g., Zambian Travel Agents"
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem', color: '#374151' }}>
                  Business Type *
                </label>
                <select
                  required
                  value={regData.business_type}
                  onChange={(e) => setRegData({...regData, business_type: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="independent">Independent Agent</option>
                  <option value="travel_agency">Travel Agency</option>
                  <option value="retail_chain">Retail Chain (Shoprite, Pick n Pay)</option>
                  <option value="station_kiosk">Station Kiosk</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem', color: '#374151' }}>
                  Contact Name *
                </label>
                <input
                  type="text"
                  required
                  value={regData.contact_name}
                  onChange={(e) => setRegData({...regData, contact_name: e.target.value})}
                  placeholder="Full name"
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem', color: '#374151' }}>
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={regData.contact_email}
                  onChange={(e) => setRegData({...regData, contact_email: e.target.value})}
                  placeholder="agent@example.com"
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem', color: '#374151' }}>
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={regData.contact_phone}
                  onChange={(e) => {
                    setRegData({...regData, contact_phone: e.target.value});
                    if (errors.contact_phone) validatePhone(e.target.value);
                  }}
                  onBlur={(e) => validatePhone(e.target.value)}
                  placeholder="e.g., 0976123456 or +260976123456"
                  maxLength={12}
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    border: errors.contact_phone ? '1px solid #1A8A82' : '1px solid #D1D5DB',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    backgroundColor: errors.contact_phone ? '#FEF2F2' : 'white'
                  }}
                />
                {errors.contact_phone && (
                  <p style={{ color: '#1A8A82', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.contact_phone}</p>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem', color: '#374151' }}>
                  NRC Number *
                </label>
                <input
                  type="text"
                  required
                  value={regData.nrc_number}
                  onChange={(e) => {
                    setRegData({...regData, nrc_number: e.target.value});
                    if (errors.nrc_number) validateNRC(e.target.value);
                  }}
                  onBlur={(e) => validateNRC(e.target.value)}
                  placeholder="e.g., 123456/78/1"
                  maxLength={12}
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    border: errors.nrc_number ? '1px solid #1A8A82' : '1px solid #D1D5DB',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    backgroundColor: errors.nrc_number ? '#FEF2F2' : 'white'
                  }}
                />
                {errors.nrc_number && (
                  <p style={{ color: '#1A8A82', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.nrc_number}</p>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem', color: '#374151' }}>
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={regData.city}
                    onChange={(e) => setRegData({...regData, city: e.target.value})}
                    placeholder="Lusaka"
                    style={{
                      width: '100%',
                      padding: '0.625rem',
                      border: '1px solid #D1D5DB',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem', color: '#374151' }}>
                    Province *
                  </label>
                  <select
                    required
                    value={regData.province}
                    onChange={(e) => setRegData({...regData, province: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.625rem',
                      border: '1px solid #D1D5DB',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      backgroundColor: 'white'
                    }}
                  >
                    <option value="">Select Province</option>
                    <option value="Lusaka">Lusaka</option>
                    <option value="Copperbelt">Copperbelt</option>
                    <option value="Central">Central</option>
                    <option value="Eastern">Eastern</option>
                    <option value="Southern">Southern</option>
                    <option value="Western">Western</option>
                    <option value="Northern">Northern</option>
                    <option value="North-Western">North-Western</option>
                    <option value="Muchinga">Muchinga</option>
                    <option value="Luapula">Luapula</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem', color: '#374151' }}>
                  Physical Address *
                </label>
                <input
                  type="text"
                  required
                  value={regData.physical_address}
                  onChange={(e) => setRegData({...regData, physical_address: e.target.value})}
                  placeholder="Full physical address"
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem', color: '#374151' }}>
                  Address
                </label>
                <input
                  type="text"
                  value={regData.address}
                  onChange={(e) => setRegData({...regData, address: e.target.value})}
                  placeholder="Street address"
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem', color: '#374151' }}>
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={regData.password}
                  onChange={(e) => setRegData({...regData, password: e.target.value})}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem', color: '#374151' }}>
                  Confirm Password *
                </label>
                <input
                  type="password"
                  required
                  value={regData.confirmPassword}
                  onChange={(e) => setRegData({...regData, confirmPassword: e.target.value})}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: loading ? '#9CA3AF' : '#659E85',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginTop: '0.5rem'
                }}
              >
                {loading ? 'Please wait...' : 'Register'}
              </button>
            </form>
          )}

          {/* Toggle */}
          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setSuccess('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#2BB2A9',
                fontSize: '0.875rem',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              {isLogin 
                ? "Don't have an account? Register as an agent" 
                : 'Already have an account? Login'}
            </button>
          </div>

          {/* Back to Home */}
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <Link href="/" style={{ color: '#6B7280', fontSize: '0.875rem', textDecoration: 'none' }}>
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
