// app/driver/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Trip {
  id: number;
  bus_id: number;
  origin: string;
  destination: string;
  departure_time: string;
  arrival_time: string;
  date: string;
  bus_name: string;
  bus_number: string;
  status: string;
  total_bookings: number;
  boarded_count: number;
}

export default function DriverDashboard() {
  const router = useRouter();
  const [driver, setDriver] = useState<any>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    today: 0,
    upcoming: 0,
    completed: 0
  });
  const [activeTripId, setActiveTripId] = useState<number | null>(null);
  const [tripActionLoading, setTripActionLoading] = useState<'start' | 'end' | null>(null);
  const [tripActionMessage, setTripActionMessage] = useState('');
  const [tripActionError, setTripActionError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('driver_token');
    const driverData = localStorage.getItem('driver');

    if (!token || !driverData) {
      router.push('/driver/login');
      return;
    }

    setDriver(JSON.parse(driverData));
    fetchTrips(token);
  }, []);

  const fetchTrips = async (token: string) => {
    try {
      const response = await fetch('/api/driver/trips', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('driver_token');
          localStorage.removeItem('driver');
          router.push('/driver/login');
          return;
        }
        throw new Error('Failed to fetch trips');
      }

      const data = await response.json();
      const loadedTrips = data.trips || [];
      setTrips(loadedTrips);

      const controlTrip = getControlTrip(loadedTrips);
      if (controlTrip) {
        await fetchActiveTrip(token, controlTrip.bus_id);
      }
      
      const today = new Date().toISOString().split('T')[0];
      setStats({
        today: data.trips.filter((t: Trip) => t.date === today).length,
        upcoming: data.trips.filter((t: Trip) => t.date > today).length,
        completed: data.trips.filter((t: Trip) => t.status === 'completed').length
      });
    } catch (error) {
      console.error('Error fetching trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const getControlTrip = (sourceTrips: Trip[]) => {
    const today = new Date().toISOString().split('T')[0];
    const todaysTrips = sourceTrips
      .filter((trip) => trip.date === today)
      .sort((a, b) => a.departure_time.localeCompare(b.departure_time));

    if (todaysTrips.length > 0) {
      return todaysTrips[0];
    }

    const nextTrip = sourceTrips
      .filter((trip) => trip.date > today)
      .sort((a, b) => `${a.date}-${a.departure_time}`.localeCompare(`${b.date}-${b.departure_time}`))[0];

    return nextTrip || null;
  };

  const fetchActiveTrip = async (token: string, busId: number) => {
    try {
      const response = await fetch(`/api/tracking/bus?bus_id=${busId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      setActiveTripId(data.current_trip?.id || null);
    } catch (error) {
      console.error('Error loading active trip:', error);
    }
  };

  const handleStartTrip = async (trip: Trip) => {
    const token = localStorage.getItem('driver_token');
    if (!token || !driver) return;

    setTripActionLoading('start');
    setTripActionError('');
    setTripActionMessage('');

    try {
      const response = await fetch('/api/tracking/trip/start', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route_id: trip.id,
          bus_id: trip.bus_id,
          driver_name: driver.name,
          driver_phone: driver.phone,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to start trip');
      }

      setActiveTripId(data.trip_id);
      setTripActionMessage(`Trip started. Tracking Trip ID: ${data.trip_id}`);
    } catch (error: any) {
      setTripActionError(error.message || 'Failed to start trip');
    } finally {
      setTripActionLoading(null);
    }
  };

  const handleEndTrip = async () => {
    const token = localStorage.getItem('driver_token');
    if (!token || !activeTripId) return;

    setTripActionLoading('end');
    setTripActionError('');
    setTripActionMessage('');

    try {
      const response = await fetch('/api/tracking/trip/end', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trip_id: activeTripId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to end trip');
      }

      setTripActionMessage(`Trip ${activeTripId} ended successfully.`);
      setActiveTripId(null);
    } catch (error: any) {
      setTripActionError(error.message || 'Failed to end trip');
    } finally {
      setTripActionLoading(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('driver_token');
    localStorage.removeItem('driver');
    router.push('/driver/login');
  };

  const formatTime = (time: string) => time.substring(0, 5);
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const controlTrip = getControlTrip(trips);

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
            <p style={{ color: '#666' }}>Loading your schedule...</p>
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
      {/* Header with VayaZed branding */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <img
                src="/logo.jpg"
                alt="VayaZed Logo"
                style={{
                  width: '60px',
                  height: '60px',
                  objectFit: 'cover',
                  objectPosition: 'center',
                  borderRadius: '0.75rem',
                  background: 'linear-gradient(135deg, #E8F5E6, #FFF3E6)',
                  border: '2px solid #198A00',
                  boxShadow: '0 6px 14px rgba(0, 0, 0, 0.2)'
                }}
              />
              <div>
                <h1 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 'bold',
                  background: 'linear-gradient(to right, #198A00, #EF7D00)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  VayaZed Driver Portal
                </h1>
                <p style={{ fontSize: '0.875rem', color: '#666' }}>{driver?.company_name}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontWeight: '500', color: '#1f2937' }}>{driver?.name}</p>
                <p style={{ fontSize: '0.75rem', color: '#666' }}>{driver?.phone}</p>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#DE2010',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Stats Cards with Zambian colors */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem', 
          marginBottom: '2rem' 
        }}>
          <div style={{ 
            background: 'white', 
            padding: '1.5rem', 
            borderRadius: '1rem', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            borderLeft: '4px solid #198A00'
          }}>
            <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>Today's Trips</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#198A00' }}>{stats.today}</p>
          </div>
          <div style={{ 
            background: 'white', 
            padding: '1.5rem', 
            borderRadius: '1rem', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            borderLeft: '4px solid #EF7D00'
          }}>
            <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>Upcoming</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#EF7D00' }}>{stats.upcoming}</p>
          </div>
          <div style={{ 
            background: 'white', 
            padding: '1.5rem', 
            borderRadius: '1rem', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            borderLeft: '4px solid #DE2010'
          }}>
            <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>Completed</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#DE2010' }}>{stats.completed}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '1rem', 
          marginBottom: '2rem' 
        }}>
          <Link
            href="/driver/scan"
            style={{
              background: 'linear-gradient(135deg, #198A00, #116600)',
              padding: '1.5rem',
              borderRadius: '1rem',
              color: 'white',
              textDecoration: 'none',
              textAlign: 'center',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📷</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Scan QR Code</h3>
            <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>Quickly board passengers</p>
          </Link>

          <Link
            href="/driver/trips"
            style={{
              background: 'linear-gradient(135deg, #EF7D00, #BD6200)',
              padding: '1.5rem',
              borderRadius: '1rem',
              color: 'white',
              textDecoration: 'none',
              textAlign: 'center',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📋</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>All Trips</h3>
            <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>View full schedule</p>
          </Link>

          <Link
            href="/driver/tracking"
            style={{
              background: 'linear-gradient(135deg, #1565C0, #0D47A1)',
              padding: '1.5rem',
              borderRadius: '1rem',
              color: 'white',
              textDecoration: 'none',
              textAlign: 'center',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📍</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>Share Location</h3>
            <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>Live GPS tracking</p>
          </Link>
        </div>

        {/* Trip Controls - Web & Mobile Friendly */}
        <div
          style={{
            background: 'white',
            borderRadius: '1rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            border: '2px solid #E8F5E6',
            padding: '1.5rem',
            marginBottom: '2rem',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
            Trip Controls
          </h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Start or end your currently assigned trip from here.
          </p>

          {controlTrip ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Route Info Card */}
              <div style={{
                background: 'linear-gradient(135deg, #E8F5E6, #FFF3E6)',
                padding: '1rem',
                borderRadius: '0.75rem',
                borderLeft: '4px solid #198A00',
              }}>
                <div style={{ color: '#1f2937', fontSize: '1.05rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  {controlTrip.origin} <span style={{ color: '#198A00', margin: '0 0.5rem' }}>→</span> {controlTrip.destination}
                </div>
                <div style={{ color: '#64748b', fontSize: '0.85rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <span>📅 {formatDate(controlTrip.date)}</span>
                  <span>🕒 {formatTime(controlTrip.departure_time)} - {formatTime(controlTrip.arrival_time)}</span>
                  <span>🚌 {controlTrip.bus_number}</span>
                </div>
              </div>

              {/* Action Buttons - Responsive Grid */}
              <div className="trip-controls-buttons">
                <button
                  onClick={() => handleStartTrip(controlTrip)}
                  disabled={Boolean(activeTripId) || tripActionLoading !== null}
                  className="trip-control-btn trip-control-btn-start"
                  style={{
                    background: Boolean(activeTripId) || tripActionLoading !== null ? '#cbd5e1' : '#198A00',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.85rem 1.25rem',
                    fontWeight: 600,
                    cursor: Boolean(activeTripId) || tripActionLoading !== null ? 'not-allowed' : 'pointer',
                    fontSize: '0.95rem',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {'🚀 ' + (tripActionLoading === 'start' ? 'Starting...' : 'Start Trip')}
                </button>

                <button
                  onClick={handleEndTrip}
                  disabled={!activeTripId || tripActionLoading !== null}
                  className="trip-control-btn trip-control-btn-end"
                  style={{
                    background: !activeTripId || tripActionLoading !== null ? '#cbd5e1' : '#DE2010',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.85rem 1.25rem',
                    fontWeight: 600,
                    cursor: !activeTripId || tripActionLoading !== null ? 'not-allowed' : 'pointer',
                    fontSize: '0.95rem',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {'🏁 ' + (tripActionLoading === 'end' ? 'Ending...' : 'End Trip')}
                </button>

                <Link
                  href="/driver/tracking"
                  className="trip-control-btn trip-control-link"
                  style={{
                    background: '#1565C0',
                    color: 'white',
                    textDecoration: 'none',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.85rem 1.25rem',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                  }}
                >
                  📍 Open Tracking
                </Link>
              </div>

              {/* Active Trip ID Display */}
              <div style={{
                padding: '0.75rem 1rem',
                background: '#F1F5F9',
                borderRadius: '0.5rem',
                fontSize: '0.9rem',
                color: '#334155',
                border: '1px solid #E2E8F0',
              }}>
                <strong>Active Trip ID:</strong>
                <span style={{ marginLeft: '0.5rem', fontFamily: 'monospace', color: activeTripId ? '#198A00' : '#94a3b8' }}>
                  {activeTripId ? `#${activeTripId}` : 'Not started'}
                </span>
              </div>
            </div>
          ) : (
            <div style={{
              padding: '2rem 1rem',
              textAlign: 'center',
              background: '#F8FAFC',
              borderRadius: '0.5rem',
              color: '#64748b'
            }}>
              <p style={{ fontSize: '1rem' }}>📭 No current or upcoming assigned trip found.</p>
              <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Check back later or contact your company.</p>
            </div>
          )}

          {/* Status Messages */}
          {tripActionMessage && (
            <div style={{
              marginTop: '1rem',
              color: '#166534',
              background: '#dcfce7',
              padding: '0.875rem 1rem',
              borderRadius: '0.5rem',
              border: '1px solid #bbf7d0',
              fontSize: '0.9rem',
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'flex-start'
            }}>
              <span style={{ fontSize: '1.1rem' }}>✅</span>
              <span>{tripActionMessage}</span>
            </div>
          )}
          {tripActionError && (
            <div style={{
              marginTop: '1rem',
              color: '#991b1b',
              background: '#fee2e2',
              padding: '0.875rem 1rem',
              borderRadius: '0.5rem',
              border: '1px solid #fecaca',
              fontSize: '0.9rem',
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'flex-start'
            }}>
              <span style={{ fontSize: '1.1rem' }}>❌</span>
              <span>{tripActionError}</span>
            </div>
          )}
        </div>

        <style>{`
          .trip-controls-buttons {
            display: flex;
            gap: 0.75rem;
            flex-wrap: wrap;
            justify-content: flex-start;
          }

          .trip-control-btn {
            flex: 1 1 auto;
            min-width: 120px;
          }

          .trip-control-btn:hover:not(:disabled),
          .trip-control-link:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }

          .trip-control-btn:active:not(:disabled),
          .trip-control-link:active {
            transform: translateY(0);
          }

          /* Tablet and Desktop View */
          @media (min-width: 768px) {
            .trip-controls-buttons {
              flex-wrap: nowrap;
              gap: 1rem;
            }

            .trip-control-btn {
              flex: 1;
              min-width: 140px;
            }
          }

          /* Large Desktop */
          @media (min-width: 1024px) {
            .trip-control-btn {
              min-width: 160px;
            }
          }
        `}</style>

        {/* Trips List */}
        <div style={{ 
          background: 'white', 
          borderRadius: '1rem', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <div style={{ 
            padding: '1.5rem', 
            borderBottom: '1px solid #e5e7eb',
            background: 'linear-gradient(to right, #E8F5E6, #FFF3E6)'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>
              Your Assigned Trips
            </h2>
          </div>

          {trips.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.5 }}>🚌</div>
              <p style={{ color: '#666', fontSize: '1.125rem' }}>No trips assigned</p>
              <p style={{ color: '#999', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                You don't have any upcoming trips scheduled
              </p>
            </div>
          ) : (
            <div style={{ padding: '1rem' }}>
              {trips.map((trip) => {
                const isToday = trip.date === new Date().toISOString().split('T')[0];
                const progress = trip.total_bookings > 0 
                  ? Math.round((trip.boarded_count / trip.total_bookings) * 100) 
                  : 0;

                return (
                  <Link
                    key={trip.id}
                    href={`/driver/trip/${trip.id}`}
                    style={{
                      display: 'block',
                      padding: '1.5rem',
                      marginBottom: '1rem',
                      background: 'white',
                      border: '2px solid #E8F5E6',
                      borderRadius: '0.75rem',
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#198A00';
                      e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#E8F5E6';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>
                              {trip.origin}
                            </span>
                            <span style={{ color: '#198A00' }}>→</span>
                            <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>
                              {trip.destination}
                            </span>
                            {isToday && (
                              <span style={{
                                padding: '0.25rem 0.75rem',
                                background: '#198A00',
                                color: 'white',
                                borderRadius: '9999px',
                                fontSize: '0.75rem',
                                fontWeight: '600'
                              }}>
                                TODAY
                              </span>
                            )}
                          </div>
                          
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.875rem', color: '#666' }}>
                            <span>📅 {formatDate(trip.date)}</span>
                            <span>🕒 {formatTime(trip.departure_time)} - {formatTime(trip.arrival_time)}</span>
                            <span>🚌 {trip.bus_name} ({trip.bus_number})</span>
                          </div>
                        </div>
                        
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          background: trip.status === 'active' ? '#E8F5E6' : '#FFF3E6',
                          color: trip.status === 'active' ? '#198A00' : '#EF7D00'
                        }}>
                          {trip.status}
                        </span>
                      </div>

                      {trip.total_bookings > 0 && (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                            <span style={{ color: '#666' }}>Boarding Progress</span>
                            <span style={{ color: '#198A00', fontWeight: '600' }}>
                              {trip.boarded_count}/{trip.total_bookings}
                            </span>
                          </div>
                          <div style={{ height: '0.5rem', background: '#E8F5E6', borderRadius: '9999px', overflow: 'hidden' }}>
                            <div style={{
                              width: `${progress}%`,
                              height: '100%',
                              background: 'linear-gradient(to right, #198A00, #EF7D00)',
                              borderRadius: '9999px'
                            }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}