'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CancellationModal from '@/app/components/CancellationModal';
import PaymentModal from '@/app/components/PaymentModal';
import ReviewForm from '@/app/components/ReviewForm';
import ReviewModal from '@/app/components/ReviewModal';
import OfflineTicketsList from '@/app/components/OfflineTicketsList';
import OfflineIndicator from '@/app/components/OfflineIndicator';
import NotificationPrompt from '@/app/components/NotificationPrompt'
import NotificationSettings from '@/app/components/NotificationSettings';

interface Booking {
  id: number;
  booking_reference: string;
  seat_numbers: string;
  num_seats: number;
  luggage_count: number;
  boarding_point: string;
  total_price: number;
  status: string;
  payment_status: string;
  origin: string;
  destination: string;
  departure_time: string;
  arrival_time: string;
  date: string;
  bus_name: string;
  bus_number: string;
  company_name: string;
  company_id?: number;
}

interface UserProfile {
  id: number;
  email: string;
  name: string;
  phone: string;
  user_type: string;
  nrc_number: string | null;
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  status: string;
  email_verified: number;
  phone_verified: number;
  created_at: string;
}

interface Review {
  id: number;
  booking_id: number | null;
  company_id: number;
  customer_id: number;
  rating: number;
  review_text: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  // Add these for display (you might need to join with companies table)
  company_name?: string;
  admin_feedback?: string; // You might want to add this to your schema
}

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
  company_id: number;
  intermediate_stops: string;
  // Recurring fields
  is_recurring?: boolean;
  recurring_pattern?: 'daily' | 'weekly' | 'monthly' | 'custom';
  recurring_days?: string[]; // ['Monday', 'Wednesday', 'Friday']
  recurring_until?: string; // End date for recurring schedule
  recurring_months?: number[]; // For monthly pattern
  recurring_dates?: number[]; // For monthly pattern (1-31)
}

export default function DashboardPage() {
  const [userReviews, setUserReviews] = useState<any[]>([]);
  // Review modal state
  const [reviewModalBooking, setReviewModalBooking] = useState<Booking | null>(null);
  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const BOOKINGS_PER_PAGE = 5;

  // Fetch reviews for this user
  const fetchUserReviews = async (customerId: number) => {
    try {
      const res = await fetch(`/api/reviews?customer_id=${customerId}`);
      const data = await res.json();
      // Your API returns the reviews array directly
      setUserReviews(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error fetching reviews:', e);
      setUserReviews([]);
    }
  };

  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentBooking, setPaymentBooking] = useState<Booking | null>(null);
  // Profile management state
  const [activeTab, setActiveTab] = useState<'bookings' | 'reviews' | 'profile' | 'settings'>('bookings');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    nrc_number: '',
    date_of_birth: '',
    gender: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const isTrackableBooking = (booking: Booking) => {
    if (!['pending', 'confirmed'].includes(booking.status)) return false;

    // Hide tracking for past departures.
    const datePart = typeof booking.date === 'string' ? booking.date.split('T')[0] : '';
    const departureRaw = booking.departure_time || '';
    const departurePart = departureRaw.length >= 5 ? departureRaw.slice(0, 5) : '00:00';
    const departureDateTime = new Date(`${datePart}T${departurePart}:00`);

    if (!Number.isNaN(departureDateTime.getTime())) {
      return departureDateTime >= new Date();
    }

    // Fallback to date-only comparison if datetime parsing fails.
    const routeDate = new Date(datePart);
    if (Number.isNaN(routeDate.getTime())) return false;
    const today = new Date();
    routeDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return routeDate >= today;
  };

  const quickTrackBookingRef = bookings.find((booking) => isTrackableBooking(booking))?.booking_reference;
  const quickTrackHref = quickTrackBookingRef ? `/customer/track/${quickTrackBookingRef}` : '/customer/track';
  const quickTrackLabel = quickTrackBookingRef ? 'Track Latest Bus →' : 'Track by Reference →';

  // Handle body scroll lock when modals are open
  useEffect(() => {
    if (showCancellationModal || showPaymentModal || reviewModalBooking) {
      // Lock body scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Unlock
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showCancellationModal, showPaymentModal, reviewModalBooking]);

  // Fetch bookings and user reviews
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) {
      router.push('/customer/login');
      return;
    }
    const parsedUser = JSON.parse(userData);
    if (parsedUser.user_type !== 'customer') {
      router.push('/');
      return;
    }
    setUser(parsedUser);
    fetchBookings(token);
    fetchUserReviews(parsedUser.id);
  }, []);

  // Refetch bookings when page changes
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && user) {
      fetchBookings(token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Handle review submission - updated to match your API response
  const handleReviewSubmitted = (reviewData?: any) => {
    if (reviewData && reviewData.id) {
      // Create a temporary review object to show immediately
      const tempReview: Review = {
        id: reviewData.id,
        booking_id: reviewModalBooking?.id || null,
        company_id: reviewModalBooking?.company_id || 0,
        customer_id: user?.id,
        rating: 0, // We don't have this from the response, but we'll fetch updated list
        review_text: '', // We don't have this from the response
        status: reviewData.status || 'pending',
        created_at: new Date().toISOString(),
        company_name: reviewModalBooking?.company_name
      };
      // Add to local state immediately for better UX
      setUserReviews(prev => [tempReview, ...prev]);

      // Show success message
      alert('Review submitted successfully! It will be visible after admin approval.');

      // Refresh reviews to get the full data including rating and text
      if (user?.id) {
        setTimeout(() => fetchUserReviews(user.id), 500);
      }
    } else {
      // If no review data, just refresh
      if (user?.id) {
        fetchUserReviews(user.id);
      }
    }
  };
  // Helper function to get review status badge
  const getReviewStatusBadge = (status: string) => {
    const config = {
      pending: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        icon: '⏳',
        label: 'Pending Approval'
      },
      approved: {
        bg: 'bg-green-100',
        text: 'text-green-700',
        icon: '✓',
        label: 'Approved'
      },
      rejected: {
        bg: 'bg-red-100',
        text: 'text-red-700',
        icon: '✗',
        label: 'Not Approved'
      }
    };

    const statusConfig = config[status as keyof typeof config] || config.pending;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
        <span>{statusConfig.icon}</span>
        {statusConfig.label}
      </span>
    );
  };
  const fetchBookings = async (token: string) => {
    try {
      const response = await fetch('/api/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      // Map company_id if present in booking data, fallback to 0 if missing
      setBookings((data.bookings || []).map((b: any) => ({ ...b, company_id: b.company_id ?? 0 })));
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    setProfileLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success && data.profile) {
        setProfile(data.profile);
        setProfileForm({
          name: data.profile.name || '',
          phone: data.profile.phone || '',
          nrc_number: data.profile.nrc_number || '',
          date_of_birth: data.profile.date_of_birth || '',
          gender: data.profile.gender || '',
          address: data.profile.address || '',
          emergency_contact_name: data.profile.emergency_contact_name || '',
          emergency_contact_phone: data.profile.emergency_contact_phone || '',
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleProfileSave = async () => {
    setProfileMessage(null);

    // Validate passwords if changing
    if (profileForm.new_password) {
      if (!profileForm.current_password) {
        setProfileMessage({ type: 'error', text: 'Current password is required to change password' });
        return;
      }
      if (profileForm.new_password !== profileForm.confirm_password) {
        setProfileMessage({ type: 'error', text: 'New passwords do not match' });
        return;
      }
      if (profileForm.new_password.length < 6) {
        setProfileMessage({ type: 'error', text: 'New password must be at least 6 characters' });
        return;
      }
    }

    setProfileSaving(true);
    try {
      const token = localStorage.getItem('token');
      const updateData: any = {
        name: profileForm.name,
        phone: profileForm.phone,
        nrc_number: profileForm.nrc_number,
        date_of_birth: profileForm.date_of_birth,
        gender: profileForm.gender,
        address: profileForm.address,
        emergency_contact_name: profileForm.emergency_contact_name,
        emergency_contact_phone: profileForm.emergency_contact_phone
      };

      if (profileForm.new_password) {
        updateData.current_password = profileForm.current_password;
        updateData.new_password = profileForm.new_password;
      }

      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setProfile(data.profile);
        // Update localStorage user data
        const userData = localStorage.getItem('user');
        if (userData) {
          const userObj = JSON.parse(userData);
          userObj.name = data.profile.name;
          userObj.phone = data.profile.phone;
          localStorage.setItem('user', JSON.stringify(userObj));
          setUser(userObj);
        }
        setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
        // Clear password fields
        setProfileForm(prev => ({
          ...prev,
          current_password: '',
          new_password: '',
          confirm_password: ''
        }));
      } else {
        setProfileMessage({ type: 'error', text: data.error || 'Failed to update profile' });
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setProfileMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setProfileSaving(false);
    }
  };

  // Fetch profile when profile tab is active
  useEffect(() => {
    if (activeTab === 'profile' && !profile) {
      fetchProfile();
    }
  }, [activeTab]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const handleCancelBooking = (booking: any) => {
    setSelectedBooking(booking);
    setShowCancellationModal(true);
  };

  const confirmCancellation = async (reason: string, refundAmount: number) => {
    if (!selectedBooking) return;

    setCancelling(selectedBooking.id);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          booking_id: selectedBooking.id,
          status: 'cancelled',
          cancellation_reason: reason
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Update local state
        setBookings(bookings.map(b =>
          b.id === selectedBooking.id ? { ...b, status: 'cancelled' } : b
        ));

        // Show success message with refund info
        if (data.refund && data.refund.amount > 0) {
          alert(`Booking cancelled successfully!\n\nRefund Details:\n• Amount: K${data.refund.amount.toFixed(2)}\n• Processing Time: ${data.refund.processingTime}\n• Cancellation Fee: K${data.refund.fee.toFixed(2)}`);
        } else {
          alert('Booking cancelled successfully. No refund applicable due to timing policy.');
        }

        setShowCancellationModal(false);
        setSelectedBooking(null);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to cancel booking');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Failed to cancel booking');
    } finally {
      setCancelling(null);
    }
  };

  // Payment handlers
  const handlePayNow = (booking: Booking) => {
    setPaymentBooking(booking);
    setShowPaymentModal(true);
  };

  const handlePaymentComplete = (paymentResult: { success: boolean; payment_id?: number; message: string }) => {
    setShowPaymentModal(false);
    if (paymentResult.success && paymentBooking) {
      // Update booking payment status in local state
      setBookings(bookings.map(b =>
        b.id === paymentBooking.id ? { ...b, payment_status: 'paid', status: 'confirmed' } : b
      ));
      alert('Payment successful! Your booking is now confirmed.');
    } else {
      alert(paymentResult.message || 'Payment failed. Please try again.');
    }
    setPaymentBooking(null);
  };

  if (!user) return null;

return (
  <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #E8F5E6, white, #FFF3E6)' }}>
    {/* Header - Zambian Theme */}
    <header style={{ background: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderBottom: '4px solid #198A00', position: 'sticky', top: 0, zIndex: 1000 }}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <img
              src="/logo.jpg"
              alt="VayaZed Logo"
              style={{ width: '52px', height: '52px', objectFit: 'cover', objectPosition: 'center', borderRadius: '0.75rem', background: 'linear-gradient(135deg, #E8F5E6, #FFF3E6)', border: '2px solid #198A00', boxShadow: '0 5px 12px rgba(0,0,0,0.18)' }}
            />
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', background: 'linear-gradient(to right, #198A00, #EF7D00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>VayaZed Bus Booking</h1>
              <p className="text-sm text-gray-600">Customer Dashboard</p>
            </div>
          </Link>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="font-medium text-gray-800">{user.name}</p>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>

    <div className="container mx-auto px-4 py-8">
      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Link
          href="/"
          className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition text-center"
        >
          <svg className="w-12 h-12 text-primary-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Search Buses</h3>
          <p className="text-gray-600">Find and book buses to your destination</p>
        </Link>

        <button
          onClick={() => setActiveTab('bookings')}
          className={`bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition text-center ${activeTab === 'bookings' ? 'ring-2 ring-primary-500' : ''}`}
        >
          <svg className="w-12 h-12 text-accent-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
          <h3 className="text-xl font-bold text-gray-800 mb-2">My Bookings</h3>
          <p className="text-gray-600">View and manage your bus tickets</p>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition text-center ${activeTab === 'profile' ? 'ring-2 ring-primary-500' : ''}`}
        >
          <svg className="w-12 h-12 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <h3 className="text-xl font-bold text-gray-800 mb-2">My Profile</h3>
          <p className="text-gray-600">Manage your account settings</p>
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-white rounded-lg shadow p-1">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`flex-1 py-3 px-4 rounded-md font-medium transition ${
            activeTab === 'bookings'
              ? 'bg-primary-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
          My Bookings
        </button>
        
        <button
          onClick={() => setActiveTab('reviews')}
          className={`flex-1 py-3 px-4 rounded-md font-medium transition ${
            activeTab === 'reviews'
              ? 'bg-primary-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          My Reviews
          {userReviews.filter(r => r.status === 'pending').length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-yellow-500 text-white text-xs rounded-full">
              {userReviews.filter(r => r.status === 'pending').length}
            </span>
          )}
        </button>
        
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 py-3 px-4 rounded-md font-medium transition ${
            activeTab === 'profile'
              ? 'bg-primary-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          My Profile
        </button>

        {/* Settings Tab */}
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-3 px-4 rounded-md font-medium transition ${
            activeTab === 'settings'
              ? 'bg-primary-600 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Settings
        </button>
      </div>

      {/* Offline Tickets List */}
      <div className="mt-8 mb-4">
        <OfflineTicketsList />
      </div>

      {/* Bookings Section */}
      {activeTab === 'bookings' && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">My Bookings</h2>
            <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
              Total: {bookings.length}
            </span>
          </div>

          {/* Track Your Bus Banner */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📍</span>
              <div>
                <p className="font-semibold text-blue-800">Track Your Bus Live</p>
                <p className="text-sm text-blue-600">Get real-time location, ETA and delay updates</p>
              </div>
            </div>
            <Link
              href={quickTrackHref}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition whitespace-nowrap"
            >
              {quickTrackLabel}
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-600">Loading your bookings...</p>
            </div>
          ) : bookings.length > 0 ? (
            <>
              <div className="space-y-6">
                {bookings.map((booking) => {
                  return (
                    <div key={booking.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
                      {/* Booking content - keep your existing booking display */}
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                              booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {booking.status.toUpperCase()}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              booking.payment_status === 'paid' ? 'bg-green-100 text-green-700' :
                              booking.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              booking.payment_status === 'refunded' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {booking.payment_status === 'paid' ? '✓ PAID' :
                               booking.payment_status === 'pending' ? '⏳ UNPAID' :
                               booking.payment_status === 'refunded' ? '↩ REFUNDED' :
                               booking.payment_status?.toUpperCase() || 'UNKNOWN'}
                            </span>
                            <span className="text-sm font-mono text-gray-600">
                              Ref: {booking.booking_reference}
                            </span>
                          </div>
                          <h3 className="text-xl font-bold text-gray-800">
                            {booking.origin} → {booking.destination}
                          </h3>
                          <p className="text-sm text-gray-600">{booking.company_name} • {booking.bus_name}</p>
                        </div>
                        <div className="text-right mt-4 md:mt-0">
                          <p className="text-2xl font-bold text-primary-600">K{booking.total_price}</p>
                          <p className="text-sm text-gray-600">{booking.num_seats} seat(s)</p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600 mb-1">
                            <span className="font-medium">Date:</span> {new Date(booking.date).toLocaleDateString('en-GB')}
                          </p>
                          <p className="text-gray-600 mb-1">
                            <span className="font-medium">Departure:</span> {booking.departure_time}
                          </p>
                          <p className="text-gray-600 mb-1">
                            <span className="font-medium">Arrival:</span> {booking.arrival_time}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 mb-1">
                            <span className="font-medium">Seat Numbers:</span> {booking.seat_numbers}
                          </p>
                          <p className="text-gray-600 mb-1">
                            <span className="font-medium">Boarding Point:</span> {booking.boarding_point}
                          </p>
                          <p className="text-gray-600 mb-1">
                            <span className="font-medium">Luggage:</span> {booking.luggage_count} piece(s)
                          </p>
                        </div>
                      </div>

                      {/* Review section for completed bookings */}
                      {booking.status === 'completed' && (
                        <div className="mt-4">
                          {(() => {
                            const existingReview = userReviews.find(r => r.booking_id === booking.id);
                            
                            if (existingReview) {
                              return (
                                <div className={`p-4 rounded-lg ${
                                  existingReview.status === 'approved' ? 'bg-green-50 border border-green-200' :
                                  existingReview.status === 'pending' ? 'bg-yellow-50 border border-yellow-200' :
                                  'bg-red-50 border border-red-200'
                                }`}>
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <h4 className="font-medium text-gray-900">Your Review</h4>
                                        {getReviewStatusBadge(existingReview.status)}
                                      </div>
                                      
                                      {existingReview.rating > 0 && (
                                        <div className="flex items-center gap-1 mb-2">
                                          {[1, 2, 3, 4, 5].map((star) => (
                                            <span
                                              key={star}
                                              className={`text-lg ${
                                                star <= existingReview.rating ? 'text-yellow-400' : 'text-gray-300'
                                              }`}
                                            >
                                              ★
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                      
                                      {existingReview.review_text && (
                                        <p className="text-gray-700 text-sm mb-2">{existingReview.review_text}</p>
                                      )}
                                      
                                      <p className="text-xs text-gray-500">
                                        Submitted on {new Date(existingReview.created_at).toLocaleDateString()}
                                      </p>
                                      
                                      {existingReview.status === 'pending' && !existingReview.review_text && (
                                        <p className="text-xs text-gray-500 mt-1 italic">
                                          Loading review details...
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            } else {
                              return (
                                <button
                                  onClick={() => setReviewModalBooking(booking)}
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                  </svg>
                                  Leave a Review
                                </button>
                              );
                            }
                          })()}
                        </div>
                      )}

                      {/* Action buttons */}
                      {booking.status !== 'cancelled' && (
                        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2 justify-between items-center">
                          <div className="flex gap-2">
                            {isTrackableBooking(booking) && (
                              <Link
                                href={`/customer/track/${booking.booking_reference}`}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Track Bus
                              </Link>
                            )}

                            {(booking.status === 'pending' || booking.status === 'confirmed') && (
                              <button
                                onClick={() => handleCancelBooking(booking)}
                                disabled={cancelling === booking.id}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium transition disabled:opacity-50"
                              >
                                {cancelling === booking.id ? (
                                  <>
                                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                    </svg>
                                    Cancelling...
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Cancel Booking
                                  </>
                                )}
                              </button>
                            )}

                            {booking.status !== 'completed' && booking.payment_status !== 'paid' && booking.payment_status !== 'refunded' && (
                              <button
                                onClick={() => handlePayNow(booking)}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-medium transition"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                Pay Now
                              </button>
                            )}
                          </div>

                          <Link
                            href={`/customer/ticket/${booking.id}`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                            </svg>
                            View Ticket
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                    className="px-6 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium w-full sm:w-auto flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Previous
                  </button>

                  <span className="text-gray-700 font-medium text-lg">
                    Page {page} of {totalPages}
                  </span>

                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || loading}
                    className="px-6 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium w-full sm:w-auto flex items-center justify-center gap-2"
                  >
                    Next
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No bookings yet</h3>
              <p className="text-gray-600 mb-6">Start your journey by booking a bus</p>
              <Link
                href="/"
                className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition"
              >
                Search Buses
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Profile Section */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">My Profile</h2>

          {profileLoading ? (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-600">Loading your profile...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Status Message */}
              {profileMessage && (
                <div className={`p-4 rounded-lg ${profileMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {profileMessage.text}
                </div>
              )}

              {/* Account Info */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">Account Information</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <span className="ml-2 font-medium">{profile?.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Account Type:</span>
                    <span className="ml-2 font-medium capitalize">{profile?.user_type}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${profile?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {profile?.status?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Member Since:</span>
                    <span className="ml-2 font-medium">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Personal Information Form */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-4">Personal Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="+260 XX XXX XXXX"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">NRC Number</label>
                    <input
                      type="text"
                      value={profileForm.nrc_number}
                      onChange={(e) => setProfileForm({ ...profileForm, nrc_number: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="XXXXXX/XX/X"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={profileForm.date_of_birth}
                      onChange={(e) => setProfileForm({ ...profileForm, date_of_birth: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <select
                      value={profileForm.gender}
                      onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input
                      type="text"
                      value={profileForm.address}
                      onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Your residential address"
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-4">Emergency Contact</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                    <input
                      type="text"
                      value={profileForm.emergency_contact_name}
                      onChange={(e) => setProfileForm({ ...profileForm, emergency_contact_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Emergency contact name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                    <input
                      type="tel"
                      value={profileForm.emergency_contact_phone}
                      onChange={(e) => setProfileForm({ ...profileForm, emergency_contact_phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="+260 XX XXX XXXX"
                    />
                  </div>
                </div>
              </div>

              {/* Change Password */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-4">Change Password</h3>
                <p className="text-sm text-gray-500 mb-4">Leave blank if you don't want to change your password</p>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                    <input
                      type="password"
                      value={profileForm.current_password}
                      onChange={(e) => setProfileForm({ ...profileForm, current_password: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <input
                      type="password"
                      value={profileForm.new_password}
                      onChange={(e) => setProfileForm({ ...profileForm, new_password: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      value={profileForm.confirm_password}
                      onChange={(e) => setProfileForm({ ...profileForm, confirm_password: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4 border-t">
                <button
                  onClick={handleProfileSave}
                  disabled={profileSaving}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {profileSaving ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reviews Section */}
      {activeTab === 'reviews' && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">My Reviews</h2>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                Total: {userReviews.length}
              </span>
              {userReviews.filter(r => r.status === 'pending').length > 0 && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                  Pending: {userReviews.filter(r => r.status === 'pending').length}
                </span>
              )}
              {userReviews.filter(r => r.status === 'approved').length > 0 && (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  Approved: {userReviews.filter(r => r.status === 'approved').length}
                </span>
              )}
            </div>
          </div>
          
          {userReviews.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No reviews yet</h3>
              <p className="text-gray-600 mb-6">Your reviews will appear here after completing bookings</p>
              <Link
                href="/"
                className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition"
              >
                Book a Bus
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {userReviews.map((review) => (
                <div key={review.id} className="border rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {bookings.find(b => b.id === review.booking_id)?.company_name || `Booking #${review.booking_id}`}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {getReviewStatusBadge(review.status)}
                  </div>
                  
                  {/* Rating stars */}
                  {review.rating > 0 && (
                    <div className="flex items-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-lg ${
                            star <= review.rating ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Review text */}
                  {review.review_text && (
                    <p className="text-gray-700">{review.review_text}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Settings Section */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Notification Settings */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Notification Settings</h2>
            <NotificationSettings />
          </div>

          {/* Additional settings can be added here in the future */}
          {/* <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">App Preferences</h2>
            ... other settings ...
          </div> */}
        </div>
      )}
    </div>

    {/* Global Components */}
    <OfflineIndicator />
    <NotificationPrompt />

    {/* Modals */}
    {showCancellationModal && (
      <CancellationModal
        isOpen={showCancellationModal}
        onClose={() => {
          setShowCancellationModal(false);
          setSelectedBooking(null);
        }}
        onConfirm={confirmCancellation}
        booking={selectedBooking}
        loading={cancelling !== null}
      />
    )}

    {showPaymentModal && paymentBooking && (
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setPaymentBooking(null);
        }}
        onPaymentComplete={handlePaymentComplete}
        bookingId={paymentBooking.id}
        amount={paymentBooking.total_price}
        bookingReference={paymentBooking.booking_reference}
      />
    )}

    {reviewModalBooking && (
      <ReviewModal
        isOpen={!!reviewModalBooking}
        onClose={() => setReviewModalBooking(null)}
        companyId={reviewModalBooking.company_id || 0}
        customerId={user?.id}
        bookingId={reviewModalBooking.id}
        onSubmitted={handleReviewSubmitted}
      />
    )}
  </div>
);
}




