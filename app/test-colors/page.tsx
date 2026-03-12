'use client';

export default function TestColors() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #E8F5E6, white, #FFF3E6)' }}>
      {/* Header */}
      <header style={{ 
        background: 'white', 
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        borderBottom: '4px solid #198A00'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontSize: '2rem' }}>🚌</div>
              <div>
                <h1 style={{ 
                  fontSize: '2rem', 
                  fontWeight: 'bold',
                  background: 'linear-gradient(to right, #198A00, #EF7D00)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  VayaZed Bus Booking
                </h1>
                <p style={{ fontSize: '0.875rem', color: '#666' }}>Travel Across Zambia</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <a href="/customer/login" style={{
                padding: '0.625rem 1.25rem',
                color: '#198A00',
                border: '2px solid #198A00',
                borderRadius: '0.5rem',
                fontWeight: '600',
                textDecoration: 'none'
              }}>
                Customer Login
              </a>
              <a href="/company/login" style={{
                padding: '0.625rem 1.25rem',
                background: 'linear-gradient(to right, #198A00, #116600)',
                color: 'white',
                borderRadius: '0.5rem',
                fontWeight: '600',
                textDecoration: 'none'
              }}>
                Company Login
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 1rem', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: '#FFE0BF',
          padding: '0.5rem 1rem',
          borderRadius: '9999px',
          marginBottom: '1rem'
        }}>
          <span style={{ fontSize: '1.5rem' }}>🇿🇲</span>
          <span style={{ color: '#BD6200', fontWeight: '600' }}>Proudly Zambian</span>
        </div>
        
        <h2 style={{ fontSize: '3rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>
          Travel Across <span style={{ color: '#198A00' }}>Zambia</span> with Ease
        </h2>
        
        <p style={{ fontSize: '1.25rem', color: '#4b5563', maxWidth: '48rem', margin: '0 auto 2rem' }}>
          Book intercity bus tickets to over <span style={{ fontWeight: 'bold', color: '#EF7D00' }}>40+ destinations</span> across all 10 provinces
        </p>

        {/* Search Form */}
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '1rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          maxWidth: '56rem',
          margin: '0 auto'
        }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#198A00', marginBottom: '1.5rem' }}>
            🔍 Search for Buses
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '600', color: '#198A00', marginBottom: '0.5rem' }}>From</label>
              <select style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #198A00',
                borderRadius: '0.5rem',
                fontSize: '1rem'
              }}>
                <option>Lusaka</option>
                <option>Ndola</option>
                <option>Kitwe</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', fontWeight: '600', color: '#198A00', marginBottom: '0.5rem' }}>To</label>
              <select style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #198A00',
                borderRadius: '0.5rem',
                fontSize: '1rem'
              }}>
                <option value="">Select destination</option>
                <option>Ndola</option>
                <option>Kitwe</option>
                <option>Livingstone</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', fontWeight: '600', color: '#198A00', marginBottom: '0.5rem' }}>Date</label>
              <input type="date" style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #198A00',
                borderRadius: '0.5rem',
                fontSize: '1rem'
              }} />
            </div>
          </div>
          
          <button style={{
            width: '100%',
            padding: '1rem',
            background: 'linear-gradient(to right, #198A00, #EF7D00)',
            color: 'white',
            fontSize: '1.125rem',
            fontWeight: 'bold',
            borderRadius: '0.5rem',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            🔍 Search Buses
          </button>
        </div>
      </section>

      {/* Features */}
      <section style={{ background: 'white', padding: '3rem 1rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '2rem', fontWeight: 'bold', textAlign: 'center', color: '#198A00', marginBottom: '2rem' }}>
            Why Choose Us?
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #E8F5E6, white)',
              padding: '2rem',
              borderRadius: '1rem',
              border: '2px solid #198A00',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🗺️</div>
              <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#198A00', marginBottom: '0.5rem' }}>
                40+ Cities
              </h4>
              <p style={{ color: '#4b5563' }}>
                Travel to any destination across all 10 provinces of Zambia
              </p>
            </div>
            
            <div style={{ 
              background: 'linear-gradient(135deg, #FFF3E6, white)',
              padding: '2rem',
              borderRadius: '1rem',
              border: '2px solid #EF7D00',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💳</div>
              <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#EF7D00', marginBottom: '0.5rem' }}>
                Easy Payment
              </h4>
              <p style={{ color: '#4b5563' }}>
                Pay with MTN, Airtel, Zamtel Mobile Money or Cards
              </p>
            </div>
            
            <div style={{ 
              background: 'linear-gradient(135deg, #FEE9E7, white)',
              padding: '2rem',
              borderRadius: '1rem',
              border: '2px solid #DE2010',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
              <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#DE2010', marginBottom: '0.5rem' }}>
                Instant Booking
              </h4>
              <p style={{ color: '#4b5563' }}>
                Get your ticket instantly with real-time seat availability
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}