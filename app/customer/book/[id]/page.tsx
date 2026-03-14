'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import PaymentModal from '@/app/components/PaymentModal';
import ReviewForm from '@/app/components/ReviewForm';

interface Route {
  id: number;
  origin: string;
  destination: string;
  departure_time: string;
  arrival_time: string;
  date: string;
  price: number;
  available_seats: number;
  bus_name: string;
  bus_number: string;
  bus_type: string;
  amenities: string;
  company_name: string;
  company_id?: number;
  intermediate_stops: string;
}

interface Passenger {
  full_name: string;
  phone_number: string;
  email: string;
  date_of_birth: string;
  gender: 'Male' | 'Female' | 'Other' | '';
  id_type: 'NRC' | 'Passport' | 'Driver License' | 'Other' | '';
  id_number: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  special_needs: string;
  luggage_count: number;
}

interface SeatMapSeat {
  seat_number: number;
  status: 'available' | 'booked' | 'blocked' | 'reserved';
  reason: string | null;
  reserved_until: string | null;
  price: number;
}

interface SeatMapData {
  route: {
    total_seats: number;
    base_price: number;
    dynamic_pricing_enabled: boolean;
    dynamic_price_multiplier: number;
  };
  summary: {
    available: number;
    booked: number;
    blocked: number;
    reserved: number;
    occupancy_rate: number;
  };
  seats: SeatMapSeat[];
}

export default function BookBus() {
  const router = useRouter();
  const params = useParams();
  const routeId = params.id;

  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  
  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingBookingResult, setPendingBookingResult] = useState<any>(null);
  
  const [bookingData, setBookingData] = useState({
    num_seats: 1,
    luggage_count: 0,
    boarding_point: '',
  });
  const [passengers, setPassengers] = useState<Passenger[]>([
    {
      full_name: '',
      phone_number: '',
      email: '',
      date_of_birth: '',
      gender: '',
      id_type: '',
      id_number: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      emergency_contact_relationship: '',
      special_needs: '',
      luggage_count: 1
    }
  ]);
  const [bookingResult, setBookingResult] = useState<any>(null);
  const [seatMap, setSeatMap] = useState<SeatMapData | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);

  // Enhanced validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return !email || emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    // Zambian phone number format: 09XXXXXXXX or +260XXXXXXXXX
    const phoneRegex = /^(\+260|0)[97][0-9]{8}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
  };

  const validateNRC = (nrc: string, idType: string): boolean => {
    if (idType !== 'NRC') return true;
    // Zambian NRC format: XXXXXX/XX/X
    const nrcRegex = /^[0-9]{6}\/[0-9]{2}\/[0-9]$/;
    return nrcRegex.test(nrc);
  };

  const validateDateOfBirth = (dob: string): boolean => {
    if (!dob) return true; // Optional field
    const birthDate = new Date(dob);
    const today = new Date();
    const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
    const maxDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
    return birthDate >= minDate && birthDate <= maxDate;
  };

  const validatePassenger = (passenger: Passenger, index: number): string[] => {
    const errors: string[] = [];
    const prefix = `passenger_${index}`;

    // Clear previous errors for this passenger
    const newErrors = { ...validationErrors };
    Object.keys(newErrors).forEach(key => {
      if (key.startsWith(prefix)) {
        delete newErrors[key];
      }
    });

    // Required field validations
    if (!passenger.full_name.trim()) {
      errors.push('Full name is required');
      newErrors[`${prefix}_full_name`] = 'Full name is required';
    } else if (passenger.full_name.trim().length < 2) {
      errors.push('Full name must be at least 2 characters');
      newErrors[`${prefix}_full_name`] = 'Full name must be at least 2 characters';
    }

    if (!passenger.phone_number.trim()) {
      errors.push('Phone number is required');
      newErrors[`${prefix}_phone_number`] = 'Phone number is required';
    } else if (!validatePhone(passenger.phone_number)) {
      errors.push('Please enter a valid Zambian phone number (09XXXXXXXX)');
      newErrors[`${prefix}_phone_number`] = 'Please enter a valid Zambian phone number (09XXXXXXXX)';
    }

    if (!passenger.id_type) {
      errors.push('ID type is required');
      newErrors[`${prefix}_id_type`] = 'ID type is required';
    }

    if (!passenger.id_number.trim()) {
      errors.push('ID number is required');
      newErrors[`${prefix}_id_number`] = 'ID number is required';
    } else if (!validateNRC(passenger.id_number, passenger.id_type)) {
      errors.push('Please enter a valid NRC number (XXXXXX/XX/X)');
      newErrors[`${prefix}_id_number`] = 'Please enter a valid NRC number (XXXXXX/XX/X)';
    }

    // Optional field validations
    if (passenger.email && !validateEmail(passenger.email)) {
      errors.push('Please enter a valid email address');
      newErrors[`${prefix}_email`] = 'Please enter a valid email address';
    }

    if (passenger.date_of_birth && !validateDateOfBirth(passenger.date_of_birth)) {
      errors.push('Please enter a valid date of birth');
      newErrors[`${prefix}_date_of_birth`] = 'Please enter a valid date of birth';
    }

    if (passenger.emergency_contact_phone && !validatePhone(passenger.emergency_contact_phone)) {
      errors.push('Please enter a valid emergency contact phone number');
      newErrors[`${prefix}_emergency_contact_phone`] = 'Please enter a valid emergency contact phone number';
    }

    setValidationErrors(newErrors);
    return errors;
  };

  const clearFieldError = (field: string) => {
    const newErrors = { ...validationErrors };
    delete newErrors[field];
    setValidationErrors(newErrors);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      // Not logged in - redirect to customer login with return URL
      setRedirecting(true);
      router.push(`/customer/login?redirect=/customer/book/${routeId}`);
      return;
    }

    try {
      const user = JSON.parse(userData);
      if (user.user_type === 'company' || user.user_type === 'admin') {
        // Non-customer users cannot book - show login prompt
        setError('Only customer accounts can make bookings. Please login with a customer account.');
        setLoading(false);
        return;
      }
      setIsAuthenticated(true);
    } catch {
      setRedirecting(true);
      router.push(`/customer/login?redirect=/customer/book/${routeId}`);
      return;
    }

    fetchRoute();
  }, [routeId, router]);

  // Update passengers array when num_seats changes
  useEffect(() => {
    const newPassengers = [...passengers];
    while (newPassengers.length < bookingData.num_seats) {
      newPassengers.push({
        full_name: '',
        phone_number: '',
        email: '',
        date_of_birth: '',
        gender: '',
        id_type: '',
        id_number: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        emergency_contact_relationship: '',
        special_needs: '',
        luggage_count: 1
      });
    }
    while (newPassengers.length > bookingData.num_seats) {
      newPassengers.pop();
    }
    setPassengers(newPassengers);

    setSelectedSeats((previous) => previous.slice(0, bookingData.num_seats));
  }, [bookingData.num_seats]);

  const fetchSeatMap = async (routeIdValue: number) => {
    try {
      const response = await fetch(`/api/routes/${routeIdValue}/seats`);
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load seat map');
      }
      setSeatMap(payload);
    } catch (err: any) {
      setError(err.message || 'Failed to load seat map');
    }
  };

  const toggleSeatSelection = (seatNumber: number) => {
    if (!seatMap) return;
    const seat = seatMap.seats.find((value) => value.seat_number === seatNumber);
    if (!seat || seat.status !== 'available') return;

    setSelectedSeats((previous) => {
      if (previous.includes(seatNumber)) {
        return previous.filter((value) => value !== seatNumber);
      }
      if (previous.length >= bookingData.num_seats) {
        return previous;
      }
      return [...previous, seatNumber].sort((a, b) => a - b);
    });
  };

  const fetchRoute = async () => {
    try {
      const response = await fetch(`/api/routes?origin=&destination=&date=`);
      const data = await response.json();
      const foundRoute = data.routes.find((r: any) => r.id === parseInt(routeId as string));
      if (foundRoute) {
        setRoute({ ...foundRoute, company_id: foundRoute.company_id });
        setBookingData({
          ...bookingData,
          boarding_point: foundRoute.origin,
        });
        await fetchSeatMap(foundRoute.id);
      } else {
        setError('Route not found');
      }
    } catch (error) {
      console.error('Error fetching route:', error);
      setError('Failed to load route details');
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Enhanced validation for all passengers
    let allErrors: string[] = [];
    for (let i = 0; i < passengers.length; i++) {
      const passengerErrors = validatePassenger(passengers[i], i);
      allErrors = [...allErrors, ...passengerErrors.map(err => `Passenger ${i + 1}: ${err}`)];
    }

    if (allErrors.length > 0) {
      setError(allErrors[0]); // Show first error
      return;
    }

    if (selectedSeats.length !== bookingData.num_seats) {
      setError(`Please select exactly ${bookingData.num_seats} seat(s) from the seat map.`);
      return;
    }

    setBooking(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push(`/customer/login?redirect=/customer/book/${routeId}`);
        return;
      }

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          route_id: routeId,
          ...bookingData,
          selected_seats: selectedSeats,
          passengers: passengers.map((p, index) => ({
            seat_number: (selectedSeats[index] || index + 1).toString(),
            full_name: p.full_name,
            phone_number: p.phone_number,
            email: p.email || null,
            date_of_birth: p.date_of_birth || null,
            gender: p.gender || null,
            id_type: p.id_type,
            id_number: p.id_number,
            emergency_contact_name: p.emergency_contact_name || null,
            emergency_contact_phone: p.emergency_contact_phone || null,
            emergency_contact_relationship: p.emergency_contact_relationship || null,
            special_needs: p.special_needs || null,
            luggage_count: p.luggage_count
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle authentication errors - redirect to login
        if (response.status === 401 || response.status === 403 || data.error?.toLowerCase().includes('unauthorized')) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push(`/customer/login?redirect=/customer/book/${routeId}`);
          return;
        }
        throw new Error(data.error || 'Booking failed');
      }

      // Store booking result and show payment modal
      setPendingBookingResult(data);
      setShowPaymentModal(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBooking(false);
    }
  };

  const updatePassenger = (index: number, field: keyof Passenger, value: string | number) => {
    const newPassengers = [...passengers];
    newPassengers[index] = { ...newPassengers[index], [field]: value };
    setPassengers(newPassengers);

    // Clear field-specific error when user starts typing
    const fieldKey = `passenger_${index}_${field}`;
    clearFieldError(fieldKey);
    
    // Real-time validation for immediate feedback
    setTimeout(() => {
      if (value && typeof value === 'string' && value.trim()) {
        const passengerToValidate = newPassengers[index];
        validatePassenger(passengerToValidate, index);
      }
    }, 500); // Debounce validation
  };

  // Handle payment completion
  const handlePaymentComplete = (paymentResult: { success: boolean; payment_id?: number; message: string }) => {
    setShowPaymentModal(false);
    if (paymentResult.success && pendingBookingResult) {
      // Store payment message for display (cash vs electronic payment)
      const isCashPayment = paymentResult.message?.toLowerCase().includes('cash');
      setBookingResult({
        ...pendingBookingResult,
        isCashPayment,
        paymentMessage: paymentResult.message
      });
      setSuccess(true);
    } else {
      // Payment failed - show error but keep the booking for retry
      setError(paymentResult.message || 'Payment failed. Your booking has been saved. Please try payment again from your bookings page.');
    }
  };

  // Handle payment modal close without completing
  const handlePaymentModalClose = () => {
    setShowPaymentModal(false);
    // Booking is already created, inform user
    if (pendingBookingResult) {
      setError('Payment not completed. Your booking has been saved. Please complete payment from your bookings page to confirm your tickets.');
    }
  };

  // Redirecting to login
  if (redirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-xl text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Not authenticated as customer
  if (!isAuthenticated && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <svg className="w-16 h-16 text-yellow-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Customer Login Required</h2>
          <p className="text-gray-600 mb-6">
            {error || 'Please login or register as a customer to book tickets.'}
          </p>
          <div className="space-y-3">
            <Link
              href={`/customer/login?redirect=/customer/book/${routeId}`}
              className="block w-full px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
            >
              Login
            </Link>
            <Link
              href={`/customer/login?redirect=/customer/book/${routeId}&mode=register`}
              className="block w-full px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition"
            >
              Register New Account
            </Link>
            <Link
              href="/"
              className="block w-full px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-xl text-gray-600">Loading route details...</p>
        </div>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Route not found</h2>
          <Link href="/" className="text-primary-600 hover:text-primary-800 font-medium">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (success && bookingResult) {
    const isCashPayment = bookingResult.isCashPayment;
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <svg className={`w-16 h-16 ${isCashPayment ? 'text-yellow-500' : 'text-green-500'} mx-auto mb-4`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className={`text-3xl font-bold ${isCashPayment ? 'text-yellow-600' : 'text-green-600'} mb-2`}>
              {isCashPayment ? 'Booking Confirmed!' : 'Booking & Payment Confirmed!'}
            </h2>
            <p className="text-gray-600">
              {isCashPayment 
                ? 'Your booking is confirmed. Please pay at the bus station before departure.' 
                : 'Your bus ticket has been successfully booked and paid for'}
            </p>
            <div className={`mt-3 inline-flex items-center px-3 py-1 ${isCashPayment ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'} rounded-full text-sm font-medium`}>
              {isCashPayment ? (
                <>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Pay at Station
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Payment Received
                </>
              )}
            </div>
          </div>

          {/* Cash Payment Warning */}
          {isCashPayment && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold mb-1">Payment Required at Station</p>
                  <ul className="space-y-1">
                    <li>• Arrive 30 minutes before departure</li>
                    <li>• Pay <strong>K{bookingResult.totalPrice}</strong> in cash</li>
                    <li>• Seat may be released if unpaid 15 mins before departure</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600 mb-2">
                  <span className="font-medium">Booking Reference:</span>
                  <br />
                  <span className="text-xl font-bold text-primary-600">{bookingResult.bookingReference}</span>
                </p>
                <p className="text-gray-600 mb-2">
                  <span className="font-medium">Route:</span> {route.origin} → {route.destination}
                </p>
                <p className="text-gray-600 mb-2">
                  <span className="font-medium">Date:</span> {new Date(route.date).toLocaleDateString('en-GB')}
                </p>
                <p className="text-gray-600 mb-2">
                  <span className="font-medium">Departure:</span> {route.departure_time}
                </p>
              </div>
              <div>
                <p className="text-gray-600 mb-2">
                  <span className="font-medium">Bus:</span> {route.bus_name}
                </p>
                <p className="text-gray-600 mb-2">
                  <span className="font-medium">Company:</span> {route.company_name}
                </p>
                <p className="text-gray-600 mb-2">
                  <span className="font-medium">Seat Numbers:</span> {bookingResult.seatNumbers}
                </p>
                <p className="text-gray-600 mb-2">
                  <span className="font-medium">Total Price:</span>
                  <br />
                  <span className="text-2xl font-bold text-primary-600">K{bookingResult.totalPrice}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Enhanced Passenger Details Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Passenger Information
            </h3>
            
            <div className="space-y-4">
              {passengers.map((passenger, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-800">
                      Passenger {index + 1} {index === 0 && '(Primary Contact)'}
                    </h4>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                      Seat {bookingResult.seatNumbers?.split(',')[index] || (index + 1)}
                    </span>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    {/* Basic Information */}
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Basic Information</h5>
                      <div className="space-y-1">
                        <p><span className="text-gray-600">Name:</span> <span className="font-medium">{passenger.full_name}</span></p>
                        <p><span className="text-gray-600">Phone:</span> <span className="font-medium">{passenger.phone_number}</span></p>
                        {passenger.email && (
                          <p><span className="text-gray-600">Email:</span> <span className="font-medium">{passenger.email}</span></p>
                        )}
                        {passenger.date_of_birth && (
                          <p><span className="text-gray-600">DOB:</span> <span className="font-medium">{new Date(passenger.date_of_birth).toLocaleDateString('en-GB')}</span></p>
                        )}
                        {passenger.gender && (
                          <p><span className="text-gray-600">Gender:</span> <span className="font-medium">{passenger.gender}</span></p>
                        )}
                      </div>
                    </div>
                    
                    {/* ID Information */}
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">ID Information</h5>
                      <div className="space-y-1">
                        {passenger.id_type && (
                          <p><span className="text-gray-600">ID Type:</span> <span className="font-medium">{passenger.id_type}</span></p>
                        )}
                        {passenger.id_number && (
                          <p><span className="text-gray-600">ID Number:</span> <span className="font-medium">{passenger.id_number}</span></p>
                        )}
                        <p><span className="text-gray-600">Luggage:</span> <span className="font-medium">{passenger.luggage_count || 1} bag(s)</span></p>
                        {passenger.special_needs && (
                          <p><span className="text-gray-600">Special Needs:</span> <span className="font-medium">{passenger.special_needs}</span></p>
                        )}
                      </div>
                    </div>
                    
                    {/* Emergency Contact */}
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Emergency Contact</h5>
                      <div className="space-y-1">
                        {passenger.emergency_contact_name ? (
                          <>
                            <p><span className="text-gray-600">Name:</span> <span className="font-medium">{passenger.emergency_contact_name}</span></p>
                            {passenger.emergency_contact_phone && (
                              <p><span className="text-gray-600">Phone:</span> <span className="font-medium">{passenger.emergency_contact_phone}</span></p>
                            )}
                            {passenger.emergency_contact_relationship && (
                              <p><span className="text-gray-600">Relationship:</span> <span className="font-medium">{passenger.emergency_contact_relationship}</span></p>
                            )}
                          </>
                        ) : (
                          <p className="text-gray-500 italic">Not provided</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Important:</strong> Please save your booking reference number. You'll need it when boarding the bus.
              Arrive at the boarding point at least 15 minutes before departure.
            </p>
          </div>

          <div className="flex flex-col space-y-3">
            <Link
              href={`/customer/ticket/${bookingResult.bookingId}`}
              className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition text-center flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
              View & Print Ticket
            </Link>
            <div className="flex space-x-4">
              <Link
                href="/customer/dashboard"
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition text-center"
              >
                My Bookings
              </Link>
              <Link
                href="/"
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition text-center"
              >
                Book Another
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const boardingPoints = [route.origin];
  if (route.intermediate_stops) {
    boardingPoints.push(...route.intermediate_stops.split(',').map(s => s.trim()));
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="flex items-center space-x-2">
            <img
              src="/logo.jpg"
              alt="VayaZed Logo"
              className="w-12 h-12 rounded-xl border-2 border-primary-600"
              style={{ objectFit: 'cover', objectPosition: 'center', background: 'linear-gradient(135deg, #E6F7F6, #E8F3EC)', boxShadow: '0 5px 12px rgba(0,0,0,0.18)' }}
            />
            <div>
              <h1 className="text-2xl font-bold text-primary-700">VayaZed Bus Booking</h1>
              <p className="text-sm text-gray-600">Complete Your Booking</p>
            </div>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Route Details */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Trip Details</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <span className="text-2xl font-bold text-gray-800">{route.origin}</span>
                  <span className="text-gray-400">→</span>
                  <span className="text-2xl font-bold text-gray-800">{route.destination}</span>
                </div>
                <p className="text-gray-600 mb-2">
                  <span className="font-medium">Date:</span> {new Date(route.date).toLocaleDateString('en-GB')}
                </p>
                <p className="text-gray-600 mb-2">
                  <span className="font-medium">Departure:</span> {route.departure_time}
                </p>
                <p className="text-gray-600 mb-2">
                  <span className="font-medium">Arrival:</span> {route.arrival_time}
                </p>
              </div>
              <div>
                <p className="text-gray-600 mb-2">
                  <span className="font-medium">Bus:</span> {route.bus_name}
                </p>
                <p className="text-gray-600 mb-2">
                  <span className="font-medium">Company:</span> {route.company_name}
                </p>
                <p className="text-gray-600 mb-2">
                  <span className="font-medium">Type:</span> {route.bus_type}
                </p>
                <p className="text-gray-600 mb-2">
                  <span className="font-medium">Available Seats:</span> {route.available_seats}
                </p>
              </div>
            </div>
            {route.amenities && (
              <div className="mt-4">
                <p className="font-medium text-gray-700 mb-2">Amenities:</p>
                <div className="flex flex-wrap gap-2">
                  {route.amenities.split(',').map((amenity, idx) => (
                    <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      {amenity.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Booking Form */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Booking Information</h2>

            {error && (
              <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleBooking} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Seats
                </label>
                <input
                  type="number"
                  min="1"
                  max={seatMap?.summary.available || route.available_seats}
                  required
                  value={bookingData.num_seats}
                  onChange={(e) => setBookingData({ ...bookingData, num_seats: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-600 mt-1">
                  Base price per seat: K{route.price}
                </p>
              </div>

              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <h3 className="text-lg font-semibold text-gray-800">Seat Map</h3>
                  {seatMap && (
                    <p className="text-sm text-gray-600">
                      Available {seatMap.summary.available} • Blocked {seatMap.summary.blocked} • Reserved {seatMap.summary.reserved}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 text-xs mb-4">
                  <span className="px-2 py-1 rounded bg-green-100 text-green-700">Available</span>
                  <span className="px-2 py-1 rounded bg-blue-100 text-blue-700">Booked</span>
                  <span className="px-2 py-1 rounded bg-red-100 text-red-700">Blocked</span>
                  <span className="px-2 py-1 rounded bg-amber-100 text-amber-700">Reserved</span>
                  <span className="px-2 py-1 rounded bg-indigo-100 text-indigo-700">Selected</span>
                </div>

                {seatMap ? (
                  <>
                    <p className="text-xs text-gray-500 mb-2">Front of bus</p>
                    <div className="space-y-2 mb-4">
                      {Array.from({ length: Math.ceil(seatMap.seats.length / 4) }, (_, rowIndex) => {
                        const row = seatMap.seats.slice(rowIndex * 4, rowIndex * 4 + 4);
                        return (
                          <div key={rowIndex} className="grid grid-cols-4 gap-2 max-w-xl">
                            {row.map((seat) => {
                              const isSelected = selectedSeats.includes(seat.seat_number);
                              const isDisabled = seat.status !== 'available' && !isSelected;

                              const statusClass = isSelected
                                ? 'bg-indigo-100 border-indigo-300 text-indigo-800'
                                : seat.status === 'booked'
                                ? 'bg-blue-100 border-blue-300 text-blue-800 cursor-not-allowed'
                                : seat.status === 'blocked'
                                ? 'bg-red-100 border-red-300 text-red-800 cursor-not-allowed'
                                : seat.status === 'reserved'
                                ? 'bg-amber-100 border-amber-300 text-amber-800 cursor-not-allowed'
                                : 'bg-green-100 border-green-300 text-green-800 hover:bg-green-200';

                              return (
                                <button
                                  key={seat.seat_number}
                                  type="button"
                                  disabled={isDisabled}
                                  onClick={() => toggleSeatSelection(seat.seat_number)}
                                  className={`border rounded-lg p-2 text-xs font-medium transition disabled:opacity-100 ${statusClass}`}
                                  title={`Seat ${seat.seat_number} • ${seat.status} • K${seat.price.toFixed(2)}${seat.reason ? ` • ${seat.reason}` : ''}`}
                                >
                                  <div>Seat {seat.seat_number}</div>
                                  <div className="text-[10px]">K{seat.price.toFixed(2)}</div>
                                </button>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-3 text-sm">
                      <p className="text-gray-700 mb-1">
                        Selected seats: {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None'}
                      </p>
                      <p className="text-gray-700">
                        Estimated total: K
                        {selectedSeats
                          .map((seatNumber) => seatMap.seats.find((seat) => seat.seat_number === seatNumber)?.price || 0)
                          .reduce((sum, value) => sum + value, 0)
                          .toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Select exactly {bookingData.num_seats} seat(s) to continue.
                      </p>
                    </div>

                    <div className="mt-3 grid md:grid-cols-2 gap-3 text-xs">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="font-semibold text-red-800 mb-1">Blocked Seats</p>
                        <p className="text-red-700">
                          {seatMap.seats.filter((seat) => seat.status === 'blocked').map((seat) => seat.seat_number).join(', ') || 'None'}
                        </p>
                      </div>
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <p className="font-semibold text-amber-800 mb-1">Reserved Seats</p>
                        <p className="text-amber-700">
                          {seatMap.seats.filter((seat) => seat.status === 'reserved').map((seat) => seat.seat_number).join(', ') || 'None'}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-500">Loading seat map...</p>
                )}
              </div>

              {/* Passenger Information */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Passenger Information
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Please provide details for each passenger traveling on this trip
                </p>
                
                <div className="space-y-6">
                  {passengers.map((passenger, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-6 space-y-4">
                      <h4 className="font-medium text-gray-800 mb-4">
                        Passenger {index + 1} {index === 0 && '(Primary Contact)'}
                      </h4>
                      
                      {/* Basic Information */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Enter full name"
                            value={passenger.full_name}
                            onChange={(e) => updatePassenger(index, 'full_name', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                              validationErrors[`passenger_${index}_full_name`] 
                                ? 'border-red-500 bg-red-50' 
                                : 'border-gray-300'
                            }`}
                          />
                          {validationErrors[`passenger_${index}_full_name`] && (
                            <p className="text-red-500 text-xs mt-1 flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              {validationErrors[`passenger_${index}_full_name`]}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone Number *
                          </label>
                          <input
                            type="tel"
                            required
                            placeholder="e.g., 0971234567"
                            value={passenger.phone_number}
                            onChange={(e) => updatePassenger(index, 'phone_number', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                              validationErrors[`passenger_${index}_phone_number`] 
                                ? 'border-red-500 bg-red-50' 
                                : 'border-gray-300'
                            }`}
                          />
                          {validationErrors[`passenger_${index}_phone_number`] && (
                            <p className="text-red-500 text-xs mt-1 flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              {validationErrors[`passenger_${index}_phone_number`]}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                          </label>
                          <input
                            type="email"
                            placeholder="passenger@example.com"
                            value={passenger.email}
                            onChange={(e) => updatePassenger(index, 'email', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                              validationErrors[`passenger_${index}_email`] 
                                ? 'border-red-500 bg-red-50' 
                                : 'border-gray-300'
                            }`}
                          />
                          {validationErrors[`passenger_${index}_email`] && (
                            <p className="text-red-500 text-xs mt-1 flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              {validationErrors[`passenger_${index}_email`]}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date of Birth
                          </label>
                          <input
                            type="date"
                            value={passenger.date_of_birth}
                            onChange={(e) => updatePassenger(index, 'date_of_birth', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      {/* ID Information */}
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Gender
                          </label>
                          <select
                            value={passenger.gender}
                            onChange={(e) => updatePassenger(index, 'gender', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            ID Type *
                          </label>
                          <select
                            required
                            value={passenger.id_type}
                            onChange={(e) => updatePassenger(index, 'id_type', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                              validationErrors[`passenger_${index}_id_type`] 
                                ? 'border-red-500 bg-red-50' 
                                : 'border-gray-300'
                            }`}
                          >
                            <option value="">Select ID Type</option>
                            <option value="NRC">National Registration Card</option>
                            <option value="Passport">Passport</option>
                            <option value="Driver License">Driver's License</option>
                            <option value="Other">Other</option>
                          </select>
                          {validationErrors[`passenger_${index}_id_type`] && (
                            <p className="text-red-500 text-xs mt-1 flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              {validationErrors[`passenger_${index}_id_type`]}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            ID Number *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g., 123456/78/1"
                            value={passenger.id_number}
                            onChange={(e) => updatePassenger(index, 'id_number', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                              validationErrors[`passenger_${index}_id_number`] 
                                ? 'border-red-500 bg-red-50' 
                                : 'border-gray-300'
                            }`}
                          />
                          {validationErrors[`passenger_${index}_id_number`] && (
                            <p className="text-red-500 text-xs mt-1 flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              {validationErrors[`passenger_${index}_id_number`]}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Emergency Contact Information */}
                      <div className="bg-amber-50 p-4 rounded-lg">
                        <h5 className="font-medium text-amber-800 mb-3">Emergency Contact Information</h5>
                        <div className="grid md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-amber-700 mb-1">
                              Contact Name
                            </label>
                            <input
                              type="text"
                              placeholder="Emergency contact name"
                              value={passenger.emergency_contact_name}
                              onChange={(e) => updatePassenger(index, 'emergency_contact_name', e.target.value)}
                              className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-amber-700 mb-1">
                              Contact Phone
                            </label>
                            <input
                              type="tel"
                              placeholder="e.g., 0971234567"
                              value={passenger.emergency_contact_phone}
                              onChange={(e) => updatePassenger(index, 'emergency_contact_phone', e.target.value)}
                              className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-amber-700 mb-1">
                              Relationship
                            </label>
                            <select
                              value={passenger.emergency_contact_relationship}
                              onChange={(e) => updatePassenger(index, 'emergency_contact_relationship', e.target.value)}
                              className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white"
                            >
                              <option value="">Select Relationship</option>
                              <option value="Parent">Parent</option>
                              <option value="Spouse">Spouse</option>
                              <option value="Sibling">Sibling</option>
                              <option value="Child">Child</option>
                              <option value="Friend">Friend</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Additional Information */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Luggage Count
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="5"
                            value={passenger.luggage_count}
                            onChange={(e) => updatePassenger(index, 'luggage_count', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Special Needs
                          </label>
                          <input
                            type="text"
                            placeholder="e.g., Wheelchair access, dietary requirements"
                            value={passenger.special_needs}
                            onChange={(e) => updatePassenger(index, 'special_needs', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Boarding Point
                </label>
                <select
                  required
                  value={bookingData.boarding_point}
                  onChange={(e) => setBookingData({ ...bookingData, boarding_point: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select boarding point</option>
                  {boardingPoints.map((point) => (
                    <option key={point} value={point}>{point}</option>
                  ))}
                </select>
                <p className="text-sm text-gray-600 mt-1">
                  Choose where you'll board the bus
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Luggage Pieces
                </label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  required
                  value={bookingData.luggage_count}
                  onChange={(e) => setBookingData({ ...bookingData, luggage_count: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-600 mt-1">
                  Standard luggage allowance applies
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">Booking Summary</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Number of Seats: {bookingData.num_seats}</p>
                  <p>Price per Seat: K{route.price}</p>
                  <p>Luggage: {bookingData.luggage_count} piece(s)</p>
                  <p className="text-lg font-bold text-primary-600 mt-2">
                    Total Amount: K{route.price * bookingData.num_seats}
                  </p>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={booking}
                  className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition disabled:bg-gray-400"
                >
                  {booking ? 'Processing...' : 'Continue to Payment'}
                </button>
                <Link
                  href="/"
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition text-center"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {pendingBookingResult && route && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={handlePaymentModalClose}
          onPaymentComplete={handlePaymentComplete}
          bookingId={pendingBookingResult.bookingId}
          amount={route.price * bookingData.num_seats}
          bookingReference={pendingBookingResult.bookingReference}
        />
      )}

      {/* Review Form: Show after booking is completed and not yet reviewed */}
{/* Review Form: Show after booking is completed and not yet reviewed */}
{bookingResult && bookingResult.status === 'completed' && route && (
  <div className="mt-12 max-w-xl mx-auto bg-white rounded-xl shadow-lg p-8 border border-primary-200">
    <h3 className="text-2xl font-bold text-primary-700 mb-2 text-center">Rate Your Trip</h3>
    <p className="text-gray-600 mb-6 text-center">We value your feedback! Please rate your experience with <span className="font-semibold">{route.company_name}</span> and leave a review below.</p>
    <ReviewForm
      companyId={route.company_id ?? 0} // FIX: Provide default value 0 if undefined
      customerId={bookingResult.customer_id}
      bookingId={bookingResult.bookingId}
      onSubmitted={() => alert('Thank you for your review!')}
    />
  </div>
)}
    </div>
  );
}