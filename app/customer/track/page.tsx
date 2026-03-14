'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TrackBusPage() {
  const router = useRouter();
  const [bookingRef, setBookingRef] = useState('');
  const [error, setError] = useState('');

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    const ref = bookingRef.trim().toUpperCase();
    
    // Validate booking reference format
    if (!ref) {
      setError('Please enter your booking reference');
      return;
    }
    
    // Basic validation: booking references are typically 10+ characters with letters and numbers
    if (ref.length < 6 || ref.length > 20) {
      setError('Invalid booking reference format');
      return;
    }
    
    // Only allow alphanumeric characters
    if (!/^[A-Z0-9]+$/.test(ref)) {
      setError('Booking reference should only contain letters and numbers');
      return;
    }
    
    router.push(`/customer/track/${ref}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
                <p className="text-sm text-gray-600">Track Your Bus</p>
              </div>
            </Link>
            <Link
              href="/customer/dashboard"
              className="px-4 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition"
            >
              My Bookings
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center bg-primary-50">
                <span className="text-4xl">📍</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Track Your Bus</h2>
              <p className="text-gray-600 mt-2">
                Use your booking reference only if you are tracking from SMS or outside your dashboard.
              </p>
            </div>

            <form onSubmit={handleTrack} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Booking Reference</label>
                <input
                  type="text"
                  value={bookingRef}
                  onChange={(e) => {
                    setBookingRef(e.target.value.toUpperCase());
                    setError('');
                  }}
                  placeholder="e.g. BKM5X2ABC123"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 uppercase"
                  autoFocus
                />
                {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-lg bg-primary-600 text-white font-semibold text-lg hover:bg-primary-700 transition"
              >
                Track Bus
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-sm text-gray-500 text-center">
                Tip: in your dashboard, use the Track Bus button on each booking card for one-click tracking.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
              <span className="text-2xl">📍</span>
              <p className="text-sm text-gray-600 mt-2">Live Location</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
              <span className="text-2xl">⏱️</span>
              <p className="text-sm text-gray-600 mt-2">Real-Time ETA</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
              <span className="text-2xl">🔔</span>
              <p className="text-sm text-gray-600 mt-2">Trip Status</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
