'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Agent {
  id: number;
  business_name: string;
  business_type: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  commission_rate: number;
  can_sell_all_companies: boolean;
}

interface AgentLocation {
  id: number;
  location_name: string;
  address: string;
  city: string;
  is_main: boolean;
}

interface Route {
  id: number;
  origin: string;
  destination: string;
  date: string;
  departure_time: string;
  arrival_time: string;
  price: number;
  available_seats: number;
  company_name: string;
  bus_number: string;
}

interface Booking {
  id: number;
  booking_reference: string;
  route_id: number;
  origin: string;
  destination: string;
  date: string;
  departure_time: string;
  num_seats: number;
  total_price: number;
  status: string;
  created_at: string;
  agent_commission?: number;
}

export default function AgentDashboard() {
  const router = useRouter();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [locations, setLocations] = useState<AgentLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'book' | 'sales' | 'profile'>('book');
  
  // Search state
  const [searchOrigin, setSearchOrigin] = useState('');
  const [searchDestination, setSearchDestination] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [routes, setRoutes] = useState<Route[]>([]);
  const [searching, setSearching] = useState(false);
  
  // Booking state
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [numSeats, setNumSeats] = useState(1);
  const [boardingPoint, setBoardingPoint] = useState('');
  const [passengers, setPassengers] = useState<{ full_name: string; phone: string }[]>([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);
  
  // Sales history
  const [sales, setSales] = useState<Booking[]>([]);
  const [loadingSales, setLoadingSales] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('agent_token');
    const agentData = localStorage.getItem('agent');
    const locationsData = localStorage.getItem('agent_locations');
    
    if (!token || !agentData) {
      router.push('/agent/login');
      return;
    }

    setAgent(JSON.parse(agentData));
    const locs = locationsData ? JSON.parse(locationsData) : [];
    setLocations(locs);
    if (locs.length > 0) {
      setSelectedLocation(locs[0].id);
    }
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('agent_token');
    localStorage.removeItem('agent');
    localStorage.removeItem('agent_locations');
    router.push('/');
  };

  const searchRoutes = async () => {
    if (!searchOrigin && !searchDestination && !searchDate) {
      alert('Please enter at least a destination');
      return;
    }

    setSearching(true);
    try {
      const params = new URLSearchParams();
      if (searchOrigin) params.set('origin', searchOrigin);
      if (searchDestination) params.set('destination', searchDestination);
      if (searchDate) params.set('date', searchDate);

      const response = await fetch(`/api/routes?${params.toString()}`);
      const data = await response.json();
      
      if (response.ok) {
        setRoutes(data.routes || []);
      } else {
        alert(data.error || 'Failed to search routes');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to search routes');
    } finally {
      setSearching(false);
    }
  };

  const initializePassengers = (count: number) => {
    const newPassengers = [...passengers];
    while (newPassengers.length < count) {
      newPassengers.push({ full_name: '', phone: '' });
    }
    while (newPassengers.length > count) {
      newPassengers.pop();
    }
    setPassengers(newPassengers);
  };

  useEffect(() => {
    initializePassengers(numSeats);
  }, [numSeats]);

  const handleBook = async () => {
    if (!selectedRoute || !selectedLocation) {
      alert('Please select a route and location');
      return;
    }

    // Validate passengers
    for (let i = 0; i < passengers.length; i++) {
      if (!passengers[i].full_name || !passengers[i].phone) {
        alert(`Please fill in passenger ${i + 1} details`);
        return;
      }
    }

    setBookingLoading(true);
    try {
      const token = localStorage.getItem('agent_token');
      const response = await fetch('/api/agent/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          route_id: selectedRoute.id,
          num_seats: numSeats,
          luggage_count: 0,
          boarding_point: boardingPoint || selectedRoute.origin,
          passengers: passengers,
          location_id: selectedLocation
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setBookingResult(data);
        // Refresh sales
        loadSales();
      } else {
        alert(data.error || 'Booking failed');
      }
    } catch (err) {
      console.error(err);
      alert('Booking failed');
    } finally {
      setBookingLoading(false);
    }
  };

  const loadSales = async () => {
    setLoadingSales(true);
    try {
      const token = localStorage.getItem('agent_token');
      const response = await fetch('/api/agent/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (response.ok) {
        setSales(data.bookings || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSales(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'sales') {
      loadSales();
    }
  }, [activeTab]);

  const calculateTotalEarnings = () => {
    return sales.reduce((sum, booking) => sum + (booking.agent_commission || 0), 0);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner-zambian" style={{ margin: '0 auto 1rem' }}></div>
          <p style={{ color: '#6B7280' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F3F4F6' }}>
      {/* Header */}
      <header style={{ 
        background: 'linear-gradient(to right, #2BB2A9, #1F8A83)', 
        color: 'white',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Link href="/" style={{ textDecoration: 'none' }}>
                <img
                  src="/logo.jpg"
                  alt="VayaZed Logo"
                  style={{
                    width: '48px',
                    height: '48px',
                    objectFit: 'cover',
                    objectPosition: 'center',
                    borderRadius: '0.5rem',
                    border: '2px solid white'
                  }}
                />
              </Link>
              <div>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Agent Dashboard</h1>
                <p style={{ fontSize: '0.75rem', opacity: 0.9 }}>{agent?.business_name}</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* Location Selector */}
              {locations.length > 0 && (
                <select
                  value={selectedLocation || ''}
                  onChange={(e) => setSelectedLocation(Number(e.target.value))}
                  style={{
                    padding: '0.5rem',
                    borderRadius: '0.375rem',
                    border: '1px solid rgba(255,255,255,0.3)',
                    background: 'rgba(255,255,255,0.1)',
                    color: 'white',
                    fontSize: '0.875rem'
                  }}
                >
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id} style={{ color: 'black' }}>
                      {loc.location_name} ({loc.city})
                    </option>
                  ))}
                </select>
              )}
              
              <span style={{ fontSize: '0.875rem' }}>
                Commission: <strong>{agent?.commission_rate}%</strong>
              </span>
              
              <button
                onClick={handleLogout}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#1A8A82',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ background: 'white', borderBottom: '1px solid #E5E7EB' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1.5rem' }}>
          <div style={{ display: 'flex', gap: '0' }}>
            {[
              { id: 'book', label: 'Book Ticket', icon: '🎫' },
              { id: 'sales', label: 'Sales History', icon: '📊' },
              { id: 'profile', label: 'Profile', icon: '👤' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: '1rem 1.5rem',
                  background: activeTab === tab.id ? '#E6F7F6' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '3px solid #2BB2A9' : '3px solid transparent',
                  color: activeTab === tab.id ? '#2BB2A9' : '#6B7280',
                  fontWeight: activeTab === tab.id ? '600' : '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.5rem' }}>
        {/* Book Ticket Tab */}
        {activeTab === 'book' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* Search Section */}
            <div style={{ background: 'white', borderRadius: '0.75rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>🔍 Search Routes</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>From</label>
                  <input
                    type="text"
                    value={searchOrigin}
                    onChange={(e) => setSearchOrigin(e.target.value)}
                    placeholder="e.g., Lusaka"
                    style={{ width: '100%', padding: '0.625rem', border: '1px solid #D1D5DB', borderRadius: '0.5rem' }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>To</label>
                  <input
                    type="text"
                    value={searchDestination}
                    onChange={(e) => setSearchDestination(e.target.value)}
                    placeholder="e.g., Ndola"
                    style={{ width: '100%', padding: '0.625rem', border: '1px solid #D1D5DB', borderRadius: '0.5rem' }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Date</label>
                  <input
                    type="date"
                    value={searchDate}
                    onChange={(e) => setSearchDate(e.target.value)}
                    style={{ width: '100%', padding: '0.625rem', border: '1px solid #D1D5DB', borderRadius: '0.5rem' }}
                  />
                </div>
                
                <button
                  onClick={searchRoutes}
                  disabled={searching}
                  style={{
                    padding: '0.75rem',
                    background: searching ? '#9CA3AF' : '#2BB2A9',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: '600',
                    cursor: searching ? 'not-allowed' : 'pointer'
                  }}
                >
                  {searching ? 'Searching...' : 'Search Buses'}
                </button>
              </div>

              {/* Results */}
              <div style={{ marginTop: '1rem' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>Available Routes ({routes.length})</h3>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {routes.map(route => (
                    <div
                      key={route.id}
                      onClick={() => {
                        setSelectedRoute(route);
                        setBoardingPoint(route.origin);
                      }}
                      style={{
                        padding: '0.75rem',
                        border: selectedRoute?.id === route.id ? '2px solid #2BB2A9' : '1px solid #E5E7EB',
                        borderRadius: '0.5rem',
                        marginBottom: '0.5rem',
                        cursor: 'pointer',
                        background: selectedRoute?.id === route.id ? '#E6F7F6' : 'white'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ fontWeight: '600', fontSize: '0.875rem' }}>{route.origin} → {route.destination}</p>
                          <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>{route.date} at {route.departure_time}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontWeight: 'bold', color: '#2BB2A9' }}>K{route.price}</p>
                          <p style={{ fontSize: '0.75rem', color: route.available_seats > 5 ? '#2BB2A9' : '#1A8A82' }}>
                            {route.available_seats} seats
                          </p>
                        </div>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.25rem' }}>{route.company_name}</p>
                    </div>
                  ))}
                  {routes.length === 0 && !searching && (
                    <p style={{ textAlign: 'center', color: '#6B7280', padding: '1rem' }}>No routes found</p>
                  )}
                </div>
              </div>
            </div>

            {/* Booking Section */}
            <div style={{ background: 'white', borderRadius: '0.75rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>🎫 Booking Details</h2>
              
              {selectedRoute ? (
                <>
                  <div style={{ background: '#E6F7F6', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                    <p style={{ fontWeight: '600' }}>{selectedRoute.origin} → {selectedRoute.destination}</p>
                    <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>{selectedRoute.date} • {selectedRoute.departure_time}</p>
                    <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>{selectedRoute.company_name} • Bus: {selectedRoute.bus_number}</p>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Number of Seats</label>
                    <input
                      type="number"
                      min="1"
                      max={selectedRoute.available_seats}
                      value={numSeats}
                      onChange={(e) => setNumSeats(parseInt(e.target.value) || 1)}
                      style={{ width: '100%', padding: '0.625rem', border: '1px solid #D1D5DB', borderRadius: '0.5rem' }}
                    />
                    <p style={{ fontSize: '0.875rem', color: '#6B7280', marginTop: '0.25rem' }}>
                      Total: K{(selectedRoute.price * numSeats).toFixed(2)}
                    </p>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Boarding Point</label>
                    <select
                      value={boardingPoint}
                      onChange={(e) => setBoardingPoint(e.target.value)}
                      style={{ width: '100%', padding: '0.625rem', border: '1px solid #D1D5DB', borderRadius: '0.5rem' }}
                    >
                      <option value={selectedRoute.origin}>{selectedRoute.origin}</option>
                    </select>
                  </div>

                  {/* Passengers */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Passenger Details</label>
                    {passengers.map((passenger, index) => (
                      <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <input
                          type="text"
                          placeholder={`Passenger ${index + 1} Name`}
                          value={passenger.full_name}
                          onChange={(e) => {
                            const newPassengers = [...passengers];
                            newPassengers[index].full_name = e.target.value;
                            setPassengers(newPassengers);
                          }}
                          style={{ padding: '0.5rem', border: '1px solid #D1D5DB', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                        />
                        <input
                          type="tel"
                          placeholder="Phone"
                          value={passenger.phone}
                          onChange={(e) => {
                            const newPassengers = [...passengers];
                            newPassengers[index].phone = e.target.value;
                            setPassengers(newPassengers);
                          }}
                          style={{ padding: '0.5rem', border: '1px solid #D1D5DB', borderRadius: '0.375rem', fontSize: '0.875rem' }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Commission info */}
                  <div style={{ background: '#E8F3EC', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                    <p>Your Commission: <strong>K{((selectedRoute.price * numSeats) * (agent?.commission_rate || 7.5) / 100).toFixed(2)}</strong></p>
                    <p style={{ color: '#6B7280', fontSize: '0.75rem' }}>({agent?.commission_rate}% of booking value)</p>
                  </div>

                  <button
                    onClick={handleBook}
                    disabled={bookingLoading}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: bookingLoading ? '#9CA3AF' : '#659E85',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontWeight: '600',
                      cursor: bookingLoading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {bookingLoading ? 'Processing...' : 'Confirm Booking'}
                  </button>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                  <p>Select a route from the search results</p>
                </div>
              )}

              {/* Booking Result */}
              {bookingResult && (
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '1rem', 
                  background: '#E6F7F6', 
                  border: '1px solid #2BB2A9', 
                  borderRadius: '0.5rem' 
                }}>
                  <h3 style={{ fontWeight: '600', color: '#2BB2A9', marginBottom: '0.5rem' }}>✓ Booking Successful!</h3>
                  <p style={{ fontSize: '0.875rem' }}>Reference: <strong>{bookingResult.bookingRef}</strong></p>
                  <p style={{ fontSize: '0.875rem' }}>Total: K{bookingResult.total_price}</p>
                  <p style={{ fontSize: '0.875rem' }}>Your Commission: K{bookingResult.commission?.toFixed(2)}</p>
                  <button
                    onClick={() => {
                      setBookingResult(null);
                      setSelectedRoute(null);
                    }}
                    style={{
                      marginTop: '0.75rem',
                      padding: '0.5rem 1rem',
                      background: '#2BB2A9',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    New Booking
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sales History Tab */}
        {activeTab === 'sales' && (
          <div style={{ background: 'white', borderRadius: '0.75rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.125rem', fontWeight: '600' }}>📊 Sales History</h2>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>Total Earnings</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2BB2A9' }}>K{calculateTotalEarnings().toFixed(2)}</p>
              </div>
            </div>

            {loadingSales ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
            ) : sales.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem' }}>Reference</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem' }}>Route</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.875rem' }}>Date</th>
                    <th style={{ textAlign: 'right', padding: '0.75rem', fontSize: '0.875rem' }}>Seats</th>
                    <th style={{ textAlign: 'right', padding: '0.75rem', fontSize: '0.875rem' }}>Total</th>
                    <th style={{ textAlign: 'right', padding: '0.75rem', fontSize: '0.875rem' }}>Commission</th>
                    <th style={{ textAlign: 'center', padding: '0.75rem', fontSize: '0.875rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map(booking => (
                    <tr key={booking.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>{booking.booking_reference}</td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>{booking.origin} → {booking.destination}</td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>{booking.date}</td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem', textAlign: 'right' }}>{booking.num_seats}</td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem', textAlign: 'right' }}>K{booking.total_price}</td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem', textAlign: 'right', color: '#2BB2A9' }}>K{booking.agent_commission?.toFixed(2) || '0.00'}</td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem', textAlign: 'center' }}>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          background: booking.status === 'confirmed' ? '#E6F7F6' : booking.status === 'pending' ? '#E8F3EC' : '#E6F5F4',
                          color: booking.status === 'confirmed' ? '#2BB2A9' : booking.status === 'pending' ? '#659E85' : '#1A8A82'
                        }}>
                          {booking.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                <p>No bookings yet. Start selling tickets!</p>
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div style={{ background: 'white', borderRadius: '0.75rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>👤 Agent Profile</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>Business Name</p>
                <p style={{ fontWeight: '500' }}>{agent?.business_name}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>Business Type</p>
                <p style={{ fontWeight: '500', textTransform: 'capitalize' }}>{agent?.business_type?.replace('_', ' ')}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>Contact Name</p>
                <p style={{ fontWeight: '500' }}>{agent?.contact_name}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>Email</p>
                <p style={{ fontWeight: '500' }}>{agent?.contact_email}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>Phone</p>
                <p style={{ fontWeight: '500' }}>{agent?.contact_phone}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>Commission Rate</p>
                <p style={{ fontWeight: '500', color: '#2BB2A9' }}>{agent?.commission_rate}%</p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>Access</p>
                <p style={{ fontWeight: '500' }}>{agent?.can_sell_all_companies ? 'All Companies' : 'Restricted'}</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
