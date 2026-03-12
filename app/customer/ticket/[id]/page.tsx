'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';

interface Passenger {
  id: number;
  full_name: string;
  phone_number: string;
  email?: string;
  date_of_birth?: string;
  gender?: string;
  id_type?: string;
  id_number?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  special_needs?: string;
  luggage_count?: number;
  seat_number: number;
  ticket_number: string;
  qr_code: string;
  ticket_status: string;
  boarding_status: string;
}

interface Booking {
  id: number;
  booking_reference: string;
  origin: string;
  destination: string;
  departure_time: string;
  arrival_time: string;
  date: string;
  bus_name: string;
  bus_number: string;
  company_name: string;
  seat_numbers: string;
  num_seats: number;
  total_price: number;
  boarding_point: string;
  status: string;
  payment_status: string;
  passengers: Passenger[];
}

export default function TicketView() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.id;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/customer/login');
      return;
    }

    fetchBooking(token);
  }, [bookingId, router]);

  const fetchBooking = async (token: string) => {
    try {
      const response = await fetch('/api/bookings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.bookings) {
        const found = data.bookings.find((b: Booking) => b.id === parseInt(bookingId as string));
        if (found) {
          setBooking(found);
        } else {
          setError('Booking not found');
        }
      }
    } catch (err) {
      setError('Failed to load ticket');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-bold text-gray-800 mb-2">{error || 'Ticket not found'}</h2>
          <Link href="/customer/dashboard" className="text-primary-600 hover:text-primary-800">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header - Hidden on print */}
      <header className="bg-white shadow-md print:hidden">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/customer/dashboard" className="flex items-center space-x-2">
              <img
                src="/logo.jpg"
                alt="VayaZed Logo"
                className="w-11 h-11 rounded-xl border-2 border-primary-600"
                style={{ objectFit: 'cover', objectPosition: 'center', background: 'linear-gradient(135deg, #E8F5E6, #FFF3E6)', boxShadow: '0 5px 12px rgba(0,0,0,0.18)' }}
              />
              <div>
                <h1 className="text-xl font-bold text-primary-700">VayaZed Bus Booking</h1>
                <p className="text-sm text-gray-600">E-Ticket</p>
              </div>
            </Link>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Ticket
            </button>
          </div>
        </div>
      </header>

      {/* Ticket Content */}
      <div className="container mx-auto px-4 py-8 print:py-0">
        <div className="max-w-3xl mx-auto">
          {/* Main Ticket Card */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden print:shadow-none print:border print:border-gray-300">
            {/* Ticket Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6 print:bg-primary-600">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-1">E-Ticket</h2>
                  <p className="text-primary-100">VayaZed Bus Booking</p>
                </div>
                <div className="flex items-center gap-4">
                  {/* QR Code */}
                  <div className="bg-white p-2 rounded-lg">
                    <QRCodeSVG
                      value={`ZBB:${booking.booking_reference}|${booking.origin}-${booking.destination}|${booking.date}|K${booking.total_price}`}
                      size={80}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-primary-100">Booking Reference</p>
                    <p className="text-2xl font-bold font-mono">{booking.booking_reference}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Banner */}
            <div className={`px-6 py-3 ${
              booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
              booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold">
                  Status: {booking.status.toUpperCase()}
                </span>
                <span>
                  Payment: {booking.payment_status.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Journey Details */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <div className="text-center flex-1">
                  <p className="text-sm text-gray-500 mb-1">From</p>
                  <p className="text-2xl font-bold text-gray-800">{booking.origin}</p>
                </div>
                <div className="flex-shrink-0 px-4">
                  <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
                <div className="text-center flex-1">
                  <p className="text-sm text-gray-500 mb-1">To</p>
                  <p className="text-2xl font-bold text-gray-800">{booking.destination}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Date</p>
                  <p className="font-semibold">{new Date(booking.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <div>
                  <p className="text-gray-500">Departure</p>
                  <p className="font-semibold text-lg">{booking.departure_time}</p>
                </div>
                <div>
                  <p className="text-gray-500">Arrival</p>
                  <p className="font-semibold text-lg">{booking.arrival_time}</p>
                </div>
                <div>
                  <p className="text-gray-500">Boarding Point</p>
                  <p className="font-semibold">{booking.boarding_point}</p>
                </div>
              </div>
            </div>

            {/* Bus & Company */}
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 text-sm">Bus Operator</p>
                  <p className="font-semibold text-gray-800">{booking.company_name}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Bus</p>
                  <p className="font-semibold text-gray-800">{booking.bus_name}</p>
                  <p className="text-sm text-gray-600">{booking.bus_number}</p>
                </div>
              </div>
            </div>

            {/* Passenger Details */}
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Passenger Details</h3>
              <div className="space-y-4">
                {booking.passengers && booking.passengers.length > 0 ? (
                  booking.passengers.map((passenger, index) => (
                    <div key={passenger.id || index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{passenger.full_name}</p>
                            <p className="text-sm text-gray-600">{passenger.phone_number}</p>
                            {passenger.email && (
                              <p className="text-sm text-gray-600">{passenger.email}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Seat Number</p>
                          <p className="text-xl font-bold text-primary-600">{passenger.seat_number}</p>
                          <p className="text-sm font-medium text-green-600">{passenger.ticket_number}</p>
                        </div>
                      </div>
                      
                      {/* Enhanced Passenger Information */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-3 border-t border-gray-200">
                        {/* Basic Info */}
                        <div>
                          {passenger.date_of_birth && (
                            <p className="text-sm"><span className="text-gray-500">DOB:</span> {new Date(passenger.date_of_birth).toLocaleDateString('en-GB')}</p>
                          )}
                          {passenger.gender && (
                            <p className="text-sm"><span className="text-gray-500">Gender:</span> {passenger.gender}</p>
                          )}
                          <p className="text-sm"><span className="text-gray-500">Luggage:</span> {passenger.luggage_count || 1} bag(s)</p>
                        </div>
                        
                        {/* ID Information */}
                        <div>
                          {passenger.id_type && (
                            <p className="text-sm"><span className="text-gray-500">ID Type:</span> {passenger.id_type}</p>
                          )}
                          {passenger.id_number && (
                            <p className="text-sm"><span className="text-gray-500">ID Number:</span> {passenger.id_number}</p>
                          )}
                          {passenger.special_needs && (
                            <p className="text-sm"><span className="text-gray-500">Special Needs:</span> {passenger.special_needs}</p>
                          )}
                        </div>
                        
                        {/* Emergency Contact */}
                        <div>
                          {passenger.emergency_contact_name && (
                            <>
                              <p className="text-sm"><span className="text-gray-500">Emergency:</span> {passenger.emergency_contact_name}</p>
                              {passenger.emergency_contact_phone && (
                                <p className="text-sm text-gray-600">{passenger.emergency_contact_phone}</p>
                              )}
                              {passenger.emergency_contact_relationship && (
                                <p className="text-sm text-gray-600">({passenger.emergency_contact_relationship})</p>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">Seats: {booking.seat_numbers}</p>
                    <p className="text-gray-600">Total passengers: {booking.num_seats}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Price Summary */}
            <div className="p-6 bg-gray-50">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-500 text-sm">Total Amount Paid</p>
                  <p className="text-3xl font-bold text-primary-600">K{booking.total_price}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 text-sm">{booking.num_seats} seat(s)</p>
                  <p className="text-gray-600">K{(booking.total_price / booking.num_seats).toFixed(0)} per seat</p>
                </div>
              </div>
            </div>

            {/* QR Code Section for Scanning */}
            <div className="p-6 border-t border-gray-200 bg-white">
              <div className="flex items-center justify-center gap-8">
                <div className="text-center">
                  <div className="bg-gray-50 p-4 rounded-xl inline-block border-2 border-dashed border-gray-300">
                    <QRCodeSVG
                      value={JSON.stringify({
                        ref: booking.booking_reference,
                        from: booking.origin,
                        to: booking.destination,
                        date: booking.date,
                        time: booking.departure_time,
                        seats: booking.num_seats,
                        amount: booking.total_price,
                        bus: booking.bus_number,
                        status: booking.payment_status
                      })}
                      size={120}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-3">Scan to verify ticket</p>
                  <p className="text-xs text-gray-400 font-mono mt-1">{booking.booking_reference}</p>
                </div>
                <div className="text-left max-w-xs">
                  <h4 className="font-semibold text-gray-700 mb-2">Quick Boarding</h4>
                  <p className="text-sm text-gray-600">
                    Show this QR code to the conductor for quick verification and boarding. 
                    Keep your ID ready for verification.
                  </p>
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="p-6 border-t border-dashed border-gray-300 text-xs text-gray-500">
              <h4 className="font-semibold text-gray-700 mb-2">Terms & Conditions</h4>
              <ul className="space-y-1">
                <li>• Please arrive at the boarding point at least 15 minutes before departure</li>
                <li>• Present this ticket (printed or on screen) and a valid ID when boarding</li>
                <li>• Each passenger is allowed 1 piece of luggage (max 20kg) included</li>
                <li>• Cancellations must be made at least 24 hours before departure for a refund</li>
                <li>• The bus company reserves the right to verify passenger identity</li>
              </ul>
            </div>
          </div>

          {/* Back Button - Hidden on print */}
          <div className="mt-6 text-center print:hidden">
            <Link
              href="/customer/dashboard"
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-800 font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:border {
            border: 1px solid #d1d5db !important;
          }
          .print\\:py-0 {
            padding-top: 0 !important;
            padding-bottom: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
