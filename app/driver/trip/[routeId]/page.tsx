// app/driver/trip/[routeId]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Passenger {
  passenger_id: number;
  full_name: string;
  phone_number: string;
  seat_number: number;
  boarding_status: 'not_boarded' | 'boarded' | 'missed';
  ticket_number: string;
  special_needs?: string;
  booking_reference: string;
  luggage_count?: number;
}

interface TripInfo {
  id: number;
  origin: string;
  destination: string;
  departure_time: string;
  arrival_time: string;
  date: string;
  bus_name: string;
  bus_number: string;
}

export default function TripManifest() {
  const router = useRouter();
  const params = useParams();
  const routeId = params.routeId;

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [trip, setTrip] = useState<TripInfo | null>(null);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [summary, setSummary] = useState({
    total_passengers: 0,
    boarded: 0,
    not_boarded: 0,
    missed: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchManifest();
  }, [routeId]);

// In your TripManifest component, update the fetchManifest function:

const fetchManifest = async () => {
  const token = localStorage.getItem('driver_token');
  if (!token) {
    router.push('/driver/login');
    return;
  }

  setLoading(true);
  setError('');

  try {
    console.log('🔍 Fetching manifest for route:', routeId);
    
    const response = await fetch(`/api/driver/manifest/${routeId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await response.json();
    console.log('📦 Manifest response:', data);

    if (!response.ok) {
      throw new Error(data.error || `Failed to fetch manifest (${response.status})`);
    }

    setTrip(data.route);
    setPassengers(data.passengers);
    setSummary(data.summary);
  } catch (error: any) {
    console.error('❌ Error fetching manifest:', error);
    setError(error.message || 'Failed to load passenger manifest');
  } finally {
    setLoading(false);
  }
};

  const handleBoarding = async (passengerId: number, ticketNumber: string) => {
    setProcessing(passengerId);
    const token = localStorage.getItem('driver_token');

    try {
      const response = await fetch('/api/driver/boarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          passengerId,
          ticketNumber,
          method: 'manual'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to mark boarding');
      }

      // Update local state
      setPassengers(prev => 
        prev.map(p => 
          p.passenger_id === passengerId 
            ? { ...p, boarding_status: 'boarded' } 
            : p
        )
      );
      
      setSummary(prev => ({
        ...prev,
        boarded: prev.boarded + 1,
        not_boarded: prev.not_boarded - 1
      }));

    } catch (error) {
      console.error('Error marking boarding:', error);
      alert('Failed to mark passenger as boarded');
    } finally {
      setProcessing(null);
    }
  };

  const filteredPassengers = passengers.filter(p => {
    const matchesSearch = 
      p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ticket_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(p.seat_number).includes(searchTerm) ||
      p.booking_reference?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || p.boarding_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  
  const formatTime = (time: string) => time.substring(0, 5);
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #E8F5E6, white, #FFF3E6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              width: '3rem', 
              height: '3rem', 
              border: '3px solid #E8F5E6',
              borderTop: '3px solid #198A00',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem'
            }}></div>
            <p style={{ color: '#666' }}>Loading passenger manifest...</p>
          </div>
        </div>
        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
      </div>

    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #E8F5E6, white, #FFF3E6)' }}>
      {/* Header */}
      <header style={{ 
        background: 'white', 
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        borderBottom: '4px solid #198A00',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link 
              href="/driver/dashboard"
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                color: '#198A00',
                textDecoration: 'none'
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>←</span>
              <span>Back to Dashboard</span>
            </Link>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Link
                href={`/driver/scan?routeId=${routeId}`}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'linear-gradient(to right, #198A00, #116600)',
                  color: 'white',
                  borderRadius: '0.5rem',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <span>📷</span>
                Scan QR
              </Link>
            </div>
          </div>
        </div>
      </header>
{error && (
  <div style={{
    maxWidth: '1200px',
    margin: '1rem auto',
    padding: '1rem',
    background: '#FEE9E7',
    border: '2px solid #DE2010',
    borderRadius: '0.5rem',
    color: '#DE2010',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  }}>
    <span>❌</span>
    <span>{error}</span>
  </div>
)}

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Trip Info Card */}
        {trip && (
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '1.5rem',
            marginBottom: '2rem',
            border: '2px solid #E8F5E6',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
                  {trip.origin} → {trip.destination}
                </h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', color: '#666', fontSize: '0.875rem' }}>
                  <span>📅 {formatDate(trip.date)}</span>
                  <span>🕒 {formatTime(trip.departure_time)} - {formatTime(trip.arrival_time)}</span>
                  <span>🚌 {trip.bus_name} ({trip.bus_number})</span>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(4, 1fr)', 
              gap: '1rem',
              marginTop: '1rem',
              paddingTop: '1rem',
              borderTop: '1px solid #e5e7eb'
            }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: '#666' }}>Total</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#198A00' }}>{summary.total_passengers}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: '#666' }}>Boarded</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#00A86B' }}>{summary.boarded}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: '#666' }}>Not Boarded</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#EF7D00' }}>{summary.not_boarded}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: '#666' }}>Missed</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#DE2010' }}>{summary.missed}</p>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '1rem',
          marginBottom: '1rem',
          border: '2px solid #E8F5E6'
        }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '2', minWidth: '200px' }}>
              <input
                type="text"
                placeholder="Search by name, ticket, seat, or booking ref..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #198A00',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
            </div>
            <div style={{ flex: '1', minWidth: '150px' }}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #198A00',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  background: 'white'
                }}
              >
                <option value="all">All Passengers</option>
                <option value="not_boarded">Not Boarded</option>
                <option value="boarded">Boarded</option>
                <option value="missed">Missed</option>
              </select>
            </div>
          </div>
        </div>
        
{/* Group by Booking */}
{filteredPassengers.length > 0 && (
  <div style={{ marginBottom: '1rem' }}>
    {Array.from(new Set(filteredPassengers.map(p => p.booking_reference))).map(bookingRef => {
      const bookingPassengers = filteredPassengers.filter(p => p.booking_reference === bookingRef);
      const boardedInBooking = bookingPassengers.filter(p => p.boarding_status === 'boarded').length;
      
      return (
        <div key={bookingRef} style={{
          background: '#E8F5E6',
          borderRadius: '0.5rem',
          padding: '0.75rem',
          marginBottom: '0.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontWeight: '600', color: '#198A00' }}>Booking: {bookingRef}</span>
              <span style={{ marginLeft: '1rem', fontSize: '0.875rem', color: '#666' }}>
                {boardedInBooking}/{bookingPassengers.length} boarded
              </span>
            </div>
            {boardedInBooking === bookingPassengers.length ? (
              <span style={{ color: '#198A00', fontSize: '0.875rem' }}>✅ Complete</span>
            ) : (
              <span style={{ color: '#EF7D00', fontSize: '0.875rem' }}>⏳ Pending</span>
            )}
          </div>
        </div>
      );
    })}
  </div>
)}
        {/* Passenger List */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          border: '2px solid #E8F5E6',
          overflow: 'hidden'
        }}>
          {filteredPassengers.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>👥</div>
              <p style={{ color: '#666' }}>No passengers found</p>
            </div>
          ) : (
            <div>
              {filteredPassengers.map((passenger) => (
                <div
                  key={passenger.passenger_id}
                  style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid #e5e7eb',
                    background: passenger.boarding_status === 'boarded' ? '#E8F5E6' : 'white'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ flex: '1' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: '600', color: '#1f2937' }}>{passenger.full_name}</span>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          background: '#E8F5E6',
                          color: '#198A00',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}>
                          Seat {passenger.seat_number}
                        </span>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          background: passenger.boarding_status === 'boarded' ? '#00A86B20' :
                                     passenger.boarding_status === 'missed' ? '#DE201020' : '#EF7D0020',
                          color: passenger.boarding_status === 'boarded' ? '#00A86B' :
                                 passenger.boarding_status === 'missed' ? '#DE2010' : '#EF7D00'
                        }}>
                          {passenger.boarding_status}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.875rem', color: '#666' }}>
                        <span>📱 {passenger.phone_number}</span>
                        <span>🎫 {passenger.ticket_number || 'N/A'}</span>
                        <span>📋 Ref: {passenger.booking_reference}</span>
                        {passenger.luggage_count ? <span>🧳 {passenger.luggage_count}</span> : null}
                      </div>
                      
                      {passenger.special_needs && (
                        <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#DE2010' }}>
                          ⚠️ {passenger.special_needs}
                        </div>
                      )}
                    </div>

                    {passenger.boarding_status === 'not_boarded' && (
                      <button
                        onClick={() => handleBoarding(passenger.passenger_id, passenger.ticket_number)}
                        disabled={processing === passenger.passenger_id}
                        style={{
                          padding: '0.75rem 1.5rem',
                          background: processing === passenger.passenger_id ? '#ccc' : '#198A00',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.5rem',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          cursor: processing === passenger.passenger_id ? 'wait' : 'pointer',
                          minWidth: '120px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        {processing === passenger.passenger_id ? (
                          <>
                            <span style={{ 
                              display: 'inline-block', 
                              width: '1rem', 
                              height: '1rem', 
                              border: '2px solid white',
                              borderTopColor: 'transparent',
                              borderRadius: '50%',
                              animation: 'spin 1s linear infinite'
                            }}></span>
                            Processing...
                          </>
                        ) : (
                          '✓ Board Passenger'
                        )}
                      </button>
                    )}

                    {passenger.boarding_status === 'boarded' && (
                      <div style={{
                        padding: '0.75rem 1.5rem',
                        background: '#E8F5E6',
                        color: '#198A00',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <span>✅</span>
                        Boarded
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}