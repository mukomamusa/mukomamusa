'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Passenger {
  passenger_id: number;
  passenger_name: string;
  nrc_or_passport: string;
  passenger_phone: string;
  passenger_type: string;
  seat_number: number;
  special_needs: string | null;
  ticket_number: string;
  boarding_status: string;
  boarded_at: string | null;
  booking_reference: string;
  boarding_point: string;
  dropping_point: string | null;
  luggage_count: number;
  booking_status: string;
  payment_status: string;
  booked_by: string;
  booker_phone: string;
}

interface ManifestData {
  id: number;
  generated_at: string;
  route: {
    id: number;
    origin: string;
    destination: string;
    date: string;
    departure_time: string;
    arrival_time: string;
    status: string;
    intermediate_stops: string;
  };
  bus: {
    name: string;
    number: string;
    total_seats: number;
  };
  driver: {
    name: string;
    phone: string;
  } | null;
  company: string;
  statistics: {
    total_seats: number;
    booked_seats: number;
    available_seats: number;
    boarded: number;
    not_boarded: number;
    missed: number;
    paid: number;
    pending_payment: number;
    adults: number;
    children: number;
    infants: number;
    seniors: number;
    special_needs: number;
    total_luggage: number;
  };
  boarding_points: { [key: string]: Passenger[] };
  passengers: Passenger[];
}

export default function TripManifest() {
  const router = useRouter();
  const params = useParams();
  const routeId = params.routeId as string;
  
  const [manifest, setManifest] = useState<ManifestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/company/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.user_type !== 'company') {
      router.push('/');
      return;
    }

    fetchManifest(token);
  }, [routeId]);

  const fetchManifest = async (token: string) => {
    try {
      const res = await fetch(`/api/manifests?route_id=${routeId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to load manifest');
        return;
      }

      const data = await res.json();
      setManifest(data.manifest);
    } catch (err) {
      setError('Failed to load manifest');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatTime = (time: string) => {
    try {
      const [hours, minutes] = time.split(':');
      const h = parseInt(hours);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const hour12 = h % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    } catch {
      return time;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'boarded': return 'bg-green-100 text-green-800';
      case 'missed': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getPaymentColor = (status: string) => {
    return status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#198A00] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading trip manifest...</p>
        </div>
      </div>
    );
  }

  if (error || !manifest) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Manifest</h2>
          <p className="text-gray-600 mb-6">{error || 'Manifest not found'}</p>
          <Link href="/company/dashboard" className="inline-block bg-[#198A00] text-white px-6 py-2 rounded-lg hover:bg-[#146d00] transition-colors">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const stats = manifest.statistics;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
          .shadow-lg, .shadow { box-shadow: none !important; }
          .rounded-lg { border: 1px solid #ddd !important; }
        }
      `}</style>

      {/* Header */}
      <header className="bg-[#198A00] text-white py-4 no-print">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/company/dashboard" className="flex items-center gap-2 hover:opacity-80">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Link>
            <h1 className="text-xl font-bold">Trip Manifest</h1>
          </div>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-white text-[#198A00] px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Manifest
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Trip Info Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {manifest.route.origin} → {manifest.route.destination}
              </h2>
              <p className="text-gray-600 mt-1">{formatDate(manifest.route.date)}</p>
              <p className="text-lg font-medium text-[#198A00] mt-2">
                Departure: {formatTime(manifest.route.departure_time)}
                {manifest.route.arrival_time && ` | Arrival: ${formatTime(manifest.route.arrival_time)}`}
              </p>
              {manifest.route.intermediate_stops && (
                <p className="text-sm text-gray-500 mt-1">
                  Via: {manifest.route.intermediate_stops}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Company</p>
              <p className="font-bold text-gray-900">{manifest.company}</p>
              <p className="text-sm text-gray-500 mt-2">Bus</p>
              <p className="font-medium text-gray-900">{manifest.bus.name} ({manifest.bus.number})</p>
              {manifest.driver && (
                <>
                  <p className="text-sm text-gray-500 mt-2">Driver</p>
                  <p className="font-medium text-gray-900">{manifest.driver.name}</p>
                  <p className="text-sm text-gray-600">{manifest.driver.phone}</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-3xl font-bold text-[#198A00]">{stats.booked_seats}</p>
            <p className="text-sm text-gray-600">Passengers</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{stats.available_seats}</p>
            <p className="text-sm text-gray-600">Available</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{stats.boarded}</p>
            <p className="text-sm text-gray-600">Boarded</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-3xl font-bold text-yellow-600">{stats.not_boarded}</p>
            <p className="text-sm text-gray-600">Waiting</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{stats.paid}</p>
            <p className="text-sm text-gray-600">Paid</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-3xl font-bold text-orange-600">{stats.pending_payment}</p>
            <p className="text-sm text-gray-600">Pending</p>
          </div>
        </div>

        {/* Passenger Type Breakdown */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap gap-6 justify-center text-sm">
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <strong>{stats.adults}</strong> Adults
          </span>
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <strong>{stats.children}</strong> Children
          </span>
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <strong>{stats.infants}</strong> Infants
          </span>
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <strong>{stats.seniors}</strong> Seniors
          </span>
          {stats.special_needs > 0 && (
            <span className="flex items-center gap-2 text-amber-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <strong>{stats.special_needs}</strong> Special Needs
            </span>
          )}
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <strong>{stats.total_luggage}</strong> Luggage Items
          </span>
        </div>

        {/* Passenger List */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-[#198A00] text-white px-6 py-4">
            <h3 className="text-lg font-bold">Passenger List</h3>
            <p className="text-sm opacity-90">Total: {manifest.passengers.length} passengers</p>
          </div>

          {manifest.passengers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p>No passengers booked for this trip yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seat</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Passenger</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID/NRC</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Boarding</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {manifest.passengers.map((passenger, index) => (
                    <tr key={passenger.passenger_id || index} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-[#198A00] text-white rounded-full font-bold text-sm">
                          {passenger.seat_number}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{passenger.passenger_name}</div>
                        <div className="text-xs text-gray-500 capitalize">{passenger.passenger_type || 'adult'}</div>
                        {passenger.special_needs && (
                          <div className="text-xs text-amber-600 mt-1">
                            <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {passenger.special_needs}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                        {passenger.nrc_or_passport || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {passenger.passenger_phone || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono text-gray-600">{passenger.ticket_number || '-'}</span>
                        <div className="text-xs text-gray-400">{passenger.booking_reference}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {passenger.boarding_point || manifest.route.origin}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(passenger.boarding_status)}`}>
                          {passenger.boarding_status === 'boarded' ? 'Boarded' : 
                           passenger.boarding_status === 'missed' ? 'Missed' : 'Waiting'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPaymentColor(passenger.payment_status)}`}>
                          {passenger.payment_status === 'paid' ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Generated Timestamp */}
        <div className="text-center text-sm text-gray-500 mt-6 pb-4">
          Manifest generated: {new Date(manifest.generated_at).toLocaleString('en-GB')}
        </div>
      </main>
    </div>
  );
}
