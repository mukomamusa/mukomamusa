// app/driver/trips/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Trip {
  id: number;
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

export default function DriverTrips() {
  const router = useRouter();
  const [driver, setDriver] = useState<any>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'today'>('upcoming');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('driver_token');
    const driverData = localStorage.getItem('driver');

    if (!token || !driverData) {
      router.push('/driver/login');
      return;
    }

    setDriver(JSON.parse(driverData));
    fetchAllTrips(token);
  }, []);

  const fetchAllTrips = async (token: string) => {
    try {
      setLoading(true);
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
      setTrips(data.trips || []);
    } catch (error) {
      console.error('Error fetching trips:', error);
      setError('Failed to load trips. Please try again.');
    } finally {
      setLoading(false);
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
      month: 'short',
      year: 'numeric'
    });
  };

  const isToday = (date: string) => {
    return date === new Date().toISOString().split('T')[0];
  };

  const isPast = (date: string) => {
    return date < new Date().toISOString().split('T')[0];
  };

  const isUpcoming = (date: string) => {
    return date > new Date().toISOString().split('T')[0];
  };

  // Filter trips based on selected filter
  const filteredTrips = trips.filter(trip => {
    if (filter === 'all') return true;
    if (filter === 'today') return isToday(trip.date);
    if (filter === 'upcoming') return isUpcoming(trip.date);
    if (filter === 'past') return isPast(trip.date);
    return true;
  }).sort((a, b) => {
    // Sort by date ascending (closest first)
    return a.date.localeCompare(b.date);
  });

  // Group trips by month for better organization
  const groupedTrips = filteredTrips.reduce((groups: { [key: string]: Trip[] }, trip) => {
    const date = new Date(trip.date);
    const monthYear = date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    if (!groups[monthYear]) {
      groups[monthYear] = [];
    }
    groups[monthYear].push(trip);
    return groups;
  }, {});

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #E6F7F6, white, #E8F3EC)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              width: '3rem', 
              height: '3rem', 
              border: '3px solid #E6F7F6',
              borderTop: '3px solid #2BB2A9',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem'
            }}></div>
            <p style={{ color: '#666' }}>Loading your trips...</p>
          </div>
        </div>
        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #E6F7F6, white, #E8F3EC)' }}>
      {/* Header */}
      <header style={{ 
        background: 'white', 
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        borderBottom: '4px solid #2BB2A9',
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
                  width: '56px',
                  height: '56px',
                  objectFit: 'cover',
                  objectPosition: 'center',
                  borderRadius: '0.75rem',
                  background: 'linear-gradient(135deg, #E6F7F6, #E8F3EC)',
                  border: '2px solid #2BB2A9',
                  boxShadow: '0 5px 12px rgba(0, 0, 0, 0.18)'
                }}
              />
              <Link 
                href="/driver/dashboard"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  color: '#2BB2A9',
                  textDecoration: 'none'
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>←</span>
                <span>Dashboard</span>
              </Link>
              <div>
                <h1 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 'bold',
                  background: 'linear-gradient(to right, #2BB2A9, #659E85)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  All Trips
                </h1>
                <p style={{ fontSize: '0.875rem', color: '#666' }}>{driver?.name} • {driver?.company_name}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                padding: '0.5rem 1rem',
                background: '#1A8A82',
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
      </header>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Error Message */}
        {error && (
          <div style={{
            marginBottom: '1rem',
            padding: '1rem',
            background: '#E6F5F4',
            border: '1px solid #1A8A82',
            borderRadius: '0.5rem',
            color: '#1A8A82',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>❌</span>
            <span>{error}</span>
          </div>
        )}

        {/* Stats Summary */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '1.5rem',
          marginBottom: '2rem',
          border: '2px solid #E6F7F6',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>
            Trip Summary
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#666' }}>Total Trips</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2BB2A9' }}>{trips.length}</p>
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#666' }}>Upcoming</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#659E85' }}>
                {trips.filter(t => isUpcoming(t.date)).length}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#666' }}>Today</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#00A86B' }}>
                {trips.filter(t => isToday(t.date)).length}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#666' }}>Completed</p>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1A8A82' }}>
                {trips.filter(t => isPast(t.date)).length}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '1rem',
          marginBottom: '2rem',
          border: '2px solid #E6F7F6',
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <span style={{ fontWeight: '600', color: '#2BB2A9' }}>Filter:</span>
          <button
            onClick={() => setFilter('upcoming')}
            style={{
              padding: '0.5rem 1rem',
              background: filter === 'upcoming' ? '#2BB2A9' : '#E6F7F6',
              color: filter === 'upcoming' ? 'white' : '#2BB2A9',
              border: '2px solid #2BB2A9',
              borderRadius: '2rem',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '0.875rem'
            }}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilter('today')}
            style={{
              padding: '0.5rem 1rem',
              background: filter === 'today' ? '#00A86B' : '#E6F7F6',
              color: filter === 'today' ? 'white' : '#00A86B',
              border: '2px solid #00A86B',
              borderRadius: '2rem',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '0.875rem'
            }}
          >
            Today
          </button>
          <button
            onClick={() => setFilter('all')}
            style={{
              padding: '0.5rem 1rem',
              background: filter === 'all' ? '#659E85' : '#E8F3EC',
              color: filter === 'all' ? 'white' : '#659E85',
              border: '2px solid #659E85',
              borderRadius: '2rem',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '0.875rem'
            }}
          >
            All
          </button>
          <button
            onClick={() => setFilter('past')}
            style={{
              padding: '0.5rem 1rem',
              background: filter === 'past' ? '#1A8A82' : '#E6F5F4',
              color: filter === 'past' ? 'white' : '#1A8A82',
              border: '2px solid #1A8A82',
              borderRadius: '2rem',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '0.875rem'
            }}
          >
            Past
          </button>
        </div>

        {/* Trips List */}
        {filteredTrips.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '3rem',
            textAlign: 'center',
            border: '2px solid #E6F7F6'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.5 }}>🗓️</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
              No trips found
            </h3>
            <p style={{ color: '#666' }}>
              {filter === 'upcoming' ? 'No upcoming trips scheduled.' :
               filter === 'today' ? 'No trips scheduled for today.' :
               filter === 'past' ? 'No past trips found.' :
               'No trips available.'}
            </p>
          </div>
        ) : (
          Object.entries(groupedTrips).map(([monthYear, monthTrips]) => (
            <div key={monthYear} style={{ marginBottom: '2rem' }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: '#2BB2A9',
                marginBottom: '1rem',
                paddingBottom: '0.5rem',
                borderBottom: '2px solid #659E85'
              }}>
                {monthYear}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {monthTrips.map((trip) => {
                  const today = isToday(trip.date);
                  const past = isPast(trip.date);
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
                        background: 'white',
                        border: `2px solid ${today ? '#2BB2A9' : past ? '#1A8A82' : '#E6F7F6'}`,
                        borderRadius: '0.75rem',
                        textDecoration: 'none',
                        transition: 'all 0.2s',
                        opacity: past ? 0.8 : 1,
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        if (!past) {
                          e.currentTarget.style.borderColor = '#2BB2A9';
                          e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!past) {
                          e.currentTarget.style.borderColor = today ? '#2BB2A9' : '#E6F7F6';
                          e.currentTarget.style.boxShadow = 'none';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                              <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>
                                {trip.origin}
                              </span>
                              <span style={{ color: '#2BB2A9' }}>→</span>
                              <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>
                                {trip.destination}
                              </span>
                              {today && (
                                <span style={{
                                  padding: '0.25rem 0.75rem',
                                  background: '#2BB2A9',
                                  color: 'white',
                                  borderRadius: '9999px',
                                  fontSize: '0.75rem',
                                  fontWeight: '600'
                                }}>
                                  TODAY
                                </span>
                              )}
                              {past && (
                                <span style={{
                                  padding: '0.25rem 0.75rem',
                                  background: '#1A8A82',
                                  color: 'white',
                                  borderRadius: '9999px',
                                  fontSize: '0.75rem',
                                  fontWeight: '600'
                                }}>
                                  COMPLETED
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
                            background: past ? '#E6F5F4' : '#E6F7F6',
                            color: past ? '#1A8A82' : '#2BB2A9'
                          }}>
                            {trip.status}
                          </span>
                        </div>

                        {!past && trip.total_bookings > 0 && (
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                              <span style={{ color: '#666' }}>Boarding Progress</span>
                              <span style={{ color: '#2BB2A9', fontWeight: '600' }}>
                                {trip.boarded_count}/{trip.total_bookings}
                              </span>
                            </div>
                            <div style={{ height: '0.5rem', background: '#E6F7F6', borderRadius: '9999px', overflow: 'hidden' }}>
                              <div style={{
                                width: `${progress}%`,
                                height: '100%',
                                background: 'linear-gradient(to right, #2BB2A9, #659E85)',
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
            </div>
          ))
        )}
      </div>
    </div>
  );
}