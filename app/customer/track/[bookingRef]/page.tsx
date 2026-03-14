'use client';

import { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';

interface TrackingData {
  tracking_available: boolean;
  message?: string;
  booking?: {
    reference: string;
    origin: string;
    destination: string;
    date: string;
    departure_time: string;
    arrival_time: string;
    bus_name: string;
    bus_number: string;
    company_name: string;
    status: string;
    seat_numbers: string;
  };
  trip?: {
    id: number;
    status: string;
    origin: string;
    destination: string;
    bus_name: string;
    bus_number: string;
    company_name: string;
    driver_name: string | null;
    scheduled_departure: string;
    scheduled_arrival: string;
    actual_departure: string | null;
  };
  location?: {
    latitude: number;
    longitude: number;
    speed_kmh: number;
    heading: number | null;
    last_updated: string;
  } | null;
  eta?: {
    estimated_arrival: string | null;
    formatted: string | null;
    delay_minutes: number;
    is_delayed: boolean;
    delay_reason: string | null;
  };
  progress?: {
    percent: number;
    distance_covered_km: number;
    total_distance_km: number | null;
    distance_remaining_km: number | null;
    next_stop: string | null;
    next_stop_eta: string | null;
  };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string; pulse: boolean }> = {
  boarding: { label: 'Boarding', color: '#659E85', bg: '#EEF5F1', icon: '🎫', pulse: true },
  in_transit: { label: 'In Transit', color: '#2BB2A9', bg: '#E6F7F6', icon: '🚌', pulse: true },
  delayed: { label: 'Delayed', color: '#E07B54', bg: '#FDF0EC', icon: '⚠️', pulse: true },
  arrived: { label: 'Arrived', color: '#2BB2A9', bg: '#E6F7F6', icon: '✅', pulse: false },
  completed: { label: 'Completed', color: '#666', bg: '#F5F5F5', icon: '🏁', pulse: false },
  cancelled: { label: 'Cancelled', color: '#C0392B', bg: '#FDF0EC', icon: '❌', pulse: false },
  scheduled: { label: 'Scheduled', color: '#1976D2', bg: '#E3F2FD', icon: '📅', pulse: false },
};

export default function LiveTrackingPage({ params }: { params: Promise<{ bookingRef: string }> }) {
  const { bookingRef } = use(params);
  const [data, setData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchTracking = useCallback(async () => {
    try {
      const response = await fetch(`/api/tracking/bus?booking_ref=${bookingRef}`);
      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to fetch tracking data');
        return;
      }

      setData(result);
      setError('');
      setLastRefresh(new Date());
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [bookingRef]);

  useEffect(() => {
    fetchTracking();
  }, [fetchTracking]);

  useEffect(() => {
    if (!autoRefresh || !data?.tracking_available) return;

    const activeStatuses = ['boarding', 'in_transit', 'delayed'];
    if (!data?.trip || !activeStatuses.includes(data.trip.status)) return;

    const interval = setInterval(fetchTracking, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, data, fetchTracking]);

  const formatTime = (dateStr: string | null | undefined) => {
    if (!dateStr) return '--:--';
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString('en-ZM', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return dateStr.substring(0, 5);
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-ZM', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const getDirectionArrow = (heading: number | null) => {
    if (heading === null) return '';
    const directions = ['↑ N', '↗ NE', '→ E', '↘ SE', '↓ S', '↙ SW', '← W', '↖ NW'];
    const index = Math.round(heading / 45) % 8;
    return directions[index];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center animate-pulse" style={{ backgroundColor: '#2BB2A920' }}>
            <span className="text-3xl">🚌</span>
          </div>
          <p className="text-gray-600 font-medium">Loading tracking data...</p>
          <p className="text-sm text-gray-400 mt-1">Ref: {bookingRef}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header bookingRef={bookingRef} />
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-lg mx-auto bg-white rounded-xl shadow-lg p-8 text-center border border-gray-100">
            <span className="text-5xl">😕</span>
            <h2 className="text-xl font-bold text-gray-800 mt-4">Tracking Unavailable</h2>
            <p className="text-gray-600 mt-2">{error}</p>
            <div className="mt-6 space-y-3">
              <button onClick={fetchTracking} className="w-full py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium transition">
                Try Again
              </button>
              <Link href="/customer/track" className="block w-full py-2 rounded-lg border border-gray-300 font-medium text-gray-700 hover:bg-gray-50 transition">
                Enter Different Reference
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (data && !data.tracking_available) {
    const booking = data.booking;
    return (
      <div className="min-h-screen bg-gray-50">
        <Header bookingRef={bookingRef} />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-lg mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center bg-blue-50">
                  <span className="text-3xl">📅</span>
                </div>
                <h2 className="text-xl font-bold text-gray-800">Tracking Not Yet Active</h2>
                <p className="text-gray-500 text-sm mt-1">{data.message}</p>
              </div>

              {booking && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 uppercase">From</p>
                      <p className="font-bold text-gray-800">{booking.origin}</p>
                    </div>
                    <span className="text-2xl text-gray-400">→</span>
                    <div className="text-center">
                      <p className="text-xs text-gray-500 uppercase">To</p>
                      <p className="font-bold text-gray-800">{booking.destination}</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-medium">{formatDate(booking.date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Departure:</span>
                      <span className="font-medium">{formatTime(booking.departure_time)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bus:</span>
                      <span className="font-medium">{booking.bus_name} ({booking.bus_number})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Company:</span>
                      <span className="font-medium">{booking.company_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Seat(s):</span>
                      <span className="font-medium">{booking.seat_numbers}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                <button
                  onClick={fetchTracking}
                  className="w-full py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium transition"
                >
                  Refresh Status
                </button>
                <Link
                  href="/customer/dashboard"
                  className="block w-full py-2 text-center rounded-lg border border-gray-300 font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const trip = data?.trip;
  const location = data?.location;
  const eta = data?.eta;
  const progress = data?.progress;
  const status = trip ? STATUS_CONFIG[trip.status] || STATUS_CONFIG.scheduled : STATUS_CONFIG.scheduled;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header bookingRef={bookingRef} />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold text-gray-800">Live Trip Status</h2>
              <div
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold ${status.pulse ? 'animate-pulse' : ''}`}
                style={{ backgroundColor: status.bg, color: status.color }}
              >
                <span>{status.icon}</span>
                <span>{status.label}</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-5 rounded-xl mb-4 bg-gray-50">
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase mb-1">From</p>
                <p className="font-bold text-lg text-gray-800">{trip?.origin}</p>
              </div>
              <div className="flex-1 px-4">
                <div className="relative">
                  <div className="h-2 rounded-full" style={{ backgroundColor: '#E0E0E0' }}>
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${progress?.percent || 0}%`,
                        backgroundColor: 'rgb(37 99 235)'
                      }}
                    />
                  </div>
                  <span className="absolute -top-6 right-0 text-xs font-medium text-gray-600">
                    {Math.round(progress?.percent || 0)}%
                  </span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase mb-1">To</p>
                <p className="font-bold text-lg text-gray-800">{trip?.destination}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <InfoCard icon="🚌" label="Bus" value={trip?.bus_number || '--'} />
              <InfoCard icon="👨‍✈️" label="Driver" value={trip?.driver_name || 'Assigned'} />
              <InfoCard icon="⏰" label="ETA" value={eta?.formatted || 'Calculating'} />
              <InfoCard icon="⚡" label="Speed" value={location?.speed_kmh ? `${Math.round(location.speed_kmh)} km/h` : '--'} />
            </div>

            {eta?.is_delayed && (
              <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: '#FDF0EC' }}>
                <p className="text-sm font-medium" style={{ color: '#E07B54' }}>
                  ⚠️ Delay: {eta.delay_minutes} minutes
                  {eta.delay_reason && ` • ${eta.delay_reason}`}
                </p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Trip Details</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500">Booking Ref</p>
                <p className="font-mono font-semibold">{bookingRef}</p>
              </div>
              <div>
                <p className="text-gray-500">Scheduled Departure</p>
                <p className="font-semibold">{formatTime(trip?.scheduled_departure)}</p>
              </div>
              <div>
                <p className="text-gray-500">Scheduled Arrival</p>
                <p className="font-semibold">{formatTime(trip?.scheduled_arrival)}</p>
              </div>
              <div>
                <p className="text-gray-500">Distance Covered</p>
                <p className="font-semibold">{progress?.distance_covered_km ? `${Math.round(progress.distance_covered_km)} km` : '--'}</p>
              </div>
              <div>
                <p className="text-gray-500">Remaining</p>
                <p className="font-semibold">
                  {progress?.distance_remaining_km ? `${Math.round(progress.distance_remaining_km)} km` : '--'}
                </p>
              </div>
              {location && (
                <div>
                  <p className="text-gray-500">Direction</p>
                  <p className="font-semibold">{getDirectionArrow(location.heading)}</p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100 space-y-2">
              <button
                onClick={fetchTracking}
                className="w-full py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium transition"
              >
                Refresh Now
              </button>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className="w-full py-2 rounded-lg border border-gray-300 font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Auto Refresh: {autoRefresh ? 'ON' : 'OFF'}
              </button>
              <p className="text-xs text-gray-400 text-center mt-2">
                Last updated: {lastRefresh.toLocaleTimeString('en-ZM', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            </div>
          </div>
        </div>

        {location ? (
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Live Location</h3>
            <div className="rounded-xl overflow-hidden border border-gray-200">
              <iframe
                title="Live Bus Location"
                width="100%"
                height="420"
                src={`https://maps.google.com/maps?q=${location.latitude},${location.longitude}&z=12&output=embed`}
                className="w-full"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              GPS: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
              {location.last_updated && ` • Updated ${new Date(location.last_updated).toLocaleTimeString('en-ZM')}`}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <span className="text-5xl">📡</span>
            <h3 className="text-xl font-bold text-gray-800 mt-3">Waiting for GPS Update</h3>
            <p className="text-gray-600 mt-2">
              Trip is active but the latest location has not been uploaded yet.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function Header({ bookingRef }: { bookingRef: string }) {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <img
              src="/logo.jpg"
              alt="VayaZed Logo"
              className="w-12 h-12 rounded-xl border-2 border-primary-600"
              style={{ objectFit: 'cover', objectPosition: 'center', background: 'linear-gradient(135deg, #E6F7F6, #E8F3EC)', boxShadow: '0 5px 12px rgba(0,0,0,0.18)' }}
            />
            <div>
              <h1 className="text-2xl font-bold text-primary-600">Vayazed</h1>
              <p className="text-xs text-gray-500">Booking Ref: {bookingRef}</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/customer/dashboard"
              className="px-3 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50"
            >
              Dashboard
            </Link>
            <Link
              href="/customer/track"
              className="px-3 py-2 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition"
            >
              New Track
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

function InfoCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
      <div className="text-xl mb-1">{icon}</div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-semibold text-sm text-gray-800 truncate">{value}</p>
    </div>
  );
}
