// app/company/enhanced-dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CompanyReviews from '@/app/components/CompanyReviews';
import ReviewsSummary from '@/app/components/ReviewsSummary';
import DriverActivityLog from '@/app/components/company/DriverActivityLog';

interface DashboardStats {
  totalBuses: number;
  activeBuses: number;
  totalRoutes: number;
  activeRoutes: number;
  totalBookings: number;
  todayBookings: number;
  totalRevenue: number;
  thisMonthRevenue: number;
  totalPassengers: number;
  todayPassengers: number;
  averageOccupancy: number;
  cancelledBookings: number;
  pendingRefunds: number;
}

interface Bus {
  id: number;
  bus_number: string;
  bus_name: string;
  total_seats: number;
  bus_type: string;
  amenities: string;
  status: string;
  subscription_status: string;
  activeRoutes: number;
  totalBookings: number;
  revenue: number;
}

interface Route {
  id: number;
  bus_id: number;
  origin: string;
  destination: string;
  departure_time: string;
  arrival_time: string;
  date: string;
  price: number;
  available_seats: number;
  intermediate_stops: string;
  bus_name: string;
  status: string;
  bookings_count: number;
  revenue: number;
}

interface RecentBooking {
  id: number;
  booking_reference: string;
  customer_name: string;
  customer_phone: string;
  seat_numbers: string;
  num_seats: number;
  boarding_point: string;
  total_price: number;
  origin: string;
  destination: string;
  date: string;
  departure_time: string;
  bus_name: string;
  status: string;
  payment_status: string;
  created_at: string;
}

// Official Zambian cities and major towns for bus routes
const ZAMBIAN_CITIES = [
  'Lusaka',
  'Ndola',
  'Kitwe',
  'Livingstone',
  'Chipata',
  'Solwezi',
  'Kabwe',
  'Chingola',
  'Mufulira',
  'Kasama',
  'Luanshya',
  'Choma',
  'Mansa',
  'Mongu',
  'Mazabuka',
  'Kafue',
  'Monze',
  'Kalulushi',
  'Kapiri Mposhi',
  'Mpika',
  'Chililabombwe',
  'Petauke',
  'Nakonde',
  'Sesheke',
  'Siavonga',
  'Chirundu',
  'Mbala',
  'Lundazi',
  'Samfya',
  'Senanga',
  'Kaoma',
  'Kalabo',
  'Kawambwa',
  'Nchelenge',
  'Serenje',
  'Mkushi',
  'Isoka',
  'Chinsali',
  'Mumbwa',
  'Itezhi-Tezhi',
  'Kazungula',
  'Victoria Falls Border'
].sort();

// Bus amenities list
const BUS_AMENITIES = [
  { id: 'ac', name: 'Air Conditioning', icon: '❄️' },
  { id: 'wifi', name: 'WiFi', icon: '📶' },
  { id: 'charging', name: 'Phone Charging', icon: '🔌' },
  { id: 'tv', name: 'TV/Entertainment', icon: '📺' },
  { id: 'reclining', name: 'Reclining Seats', icon: '💺' },
  { id: 'toilet', name: 'Onboard Toilet', icon: '🚻' },
  { id: 'refreshments', name: 'Refreshments', icon: '☕' },
  { id: 'luggage', name: 'Large Luggage Space', icon: '🧳' },
];

export default function EnhancedCompanyDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'fleet' | 'routes' | 'seats' | 'bookings' | 'drivers' | 'tracking' | 'analytics' | 'subscriptions' | 'buses' | 'refunds' | 'profile' | 'reviews'>('overview');
  const [loading, setLoading] = useState(true);

  // In the actions column of your drivers table
  const [viewingActivityFor, setViewingActivityFor] = useState<number | null>(null);
  // Add these with your other state declarations
  const [viewingDriverName, setViewingDriverName] = useState('');
  // Mock data for demonstration (will be replaced with API calls)
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalBuses: 8,
    activeBuses: 6,
    totalRoutes: 24,
    activeRoutes: 18,
    totalBookings: 156,
    todayBookings: 12,
    totalRevenue: 124500,
    thisMonthRevenue: 45200,
    totalPassengers: 1240,
    todayPassengers: 84,
    averageOccupancy: 78.5,
    cancelledBookings: 8,
    pendingRefunds: 3
  });
  // Routes search and pagination states
  const [routeSearchTerm, setRouteSearchTerm] = useState('');
  const [routeStatusFilter, setRouteStatusFilter] = useState<string>('all');
  const [routePage, setRoutePage] = useState(1);
  const ROUTES_PER_PAGE = 10;

  const [buses, setBuses] = useState<Bus[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [recentRefunds, setRecentRefunds] = useState<any[]>([]);
  const [recentBuses, setRecentBuses] = useState<Bus[]>([]);
  const [recentRoutes, setRecentRoutes] = useState<Route[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  // Modal states for fleet and route management
  const [showAddBusModal, setShowAddBusModal] = useState(false);
  const [showEditBusModal, setShowEditBusModal] = useState(false);
  const [showAddRouteModal, setShowAddRouteModal] = useState(false);
  const [newBus, setNewBus] = useState({ bus_name: '', bus_number: '', total_seats: 50, amenities: [] as string[] });
  const [editingBus, setEditingBus] = useState<Bus | null>(null);
  const [newRoute, setNewRoute] = useState({
    bus_id: '', origin: '', destination: '', departure_time: '',
    arrival_time: '', date: '', price: '', intermediate_stops: ''
  });
  const [showEditRouteModal, setShowEditRouteModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState<any>(null);

  // Duplicate/Recurring route states
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicatingRoute, setDuplicatingRoute] = useState<Route | null>(null);
  const [duplicateOptions, setDuplicateOptions] = useState({
    mode: 'single' as 'single' | 'recurring',
    recurrence: 'daily' as 'daily' | 'weekdays' | 'weekends' | 'weekly',
    start_date: '',
    end_date: '',
    days_of_week: [] as number[],
    new_price: '',
    new_departure_time: '',
    new_arrival_time: ''
  });
  const [creatingRoutes, setCreatingRoutes] = useState(false);

  // Additional states for subscription and trip management
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>({
    buses: [],
    summary: { totalBuses: 0, activeBuses: 0, expiredBuses: 0, monthlyDue: 0 },
    settings: { pricePerBus: 500, trialDays: 14 },
    payments: []
  });
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedBusForPayment, setSelectedBusForPayment] = useState<any>(null);
  const [paymentForm, setPaymentForm] = useState({
    months: 1,
    payment_method: 'mtn_money',
    phone_number: '',
    card_number: '',
    card_expiry: '',
    card_cvv: ''
  });
  const [processingPayment, setProcessingPayment] = useState(false);
  const [earnings, setEarnings] = useState({ gross: 0, commission: 0, net: 0, rate: 7.5 });

  // Booking management states
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [bookingStatusFilter, setBookingStatusFilter] = useState('');
  const [bookingDateFilter, setBookingDateFilter] = useState('');
  const [viewingBooking, setViewingBooking] = useState<any>(null);

  // Driver management states
  const [drivers, setDrivers] = useState<any[]>([]);
  const [showAddDriverModal, setShowAddDriverModal] = useState(false);
  const [showEditDriverModal, setShowEditDriverModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<any>(null);
  // Update it to include email and password:
  const [newDriver, setNewDriver] = useState({
    name: '',
    phone: '',
    email: '',           // Add this to accept driver's email 
    password: '',        // Add this to accept driver's password  
    license_number: '',
    license_type: 'Class B',
    license_expiry: '',
    nrc_number: '',
    date_of_birth: '',
    address: ''
  });
  // Refund management states
  const [refunds, setRefunds] = useState<any[]>([]);
  const [refundStats, setRefundStats] = useState<any>({
    total_refunds: 0,
    pending_refunds: 0,
    processed_refunds: 0,
    rejected_refunds: 0,
    pending_amount: 0,
    processed_amount: 0
  });
  const [refundStatusFilter, setRefundStatusFilter] = useState('');
  const [viewingRefund, setViewingRefund] = useState<any>(null);
  const [processingRefund, setProcessingRefund] = useState<number | null>(null);

  // Tracking management states
  const [trackingDevices, setTrackingDevices] = useState<any[]>([]);
  const [loadingTrackingDevices, setLoadingTrackingDevices] = useState(false);
  const [registeringDevice, setRegisteringDevice] = useState(false);
  const [trackingMessage, setTrackingMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [newTrackingDevice, setNewTrackingDevice] = useState({
    bus_id: '',
    device_imei: '',
    device_serial: '',
    provider: 'ctrack',
    provider_device_id: '',
    sim_number: '',
    sim_provider: '',
  });

  // Profile management states
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [companyProfileForm, setCompanyProfileForm] = useState({
    name: '',
    phone: '',
    company_name: '',
    license_number: '',
    company_registration_number: '',
    company_address: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Logo upload states
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Bus images states
  const [showBusImagesModal, setShowBusImagesModal] = useState(false);
  const [selectedBusForImages, setSelectedBusForImages] = useState<Bus | null>(null);
  const [busImages, setBusImages] = useState<any[]>([]);
  const [loadingBusImages, setLoadingBusImages] = useState(false);
  const [uploadingBusImages, setUploadingBusImages] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/company/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.user_type !== 'company') {
      router.push('/company/login');
      return;
    }

    setUser(parsedUser);
    loadDashboardData(token);
  }, []);

  const loadDashboardData = async (token: string) => {
    try {
      setLoading(true);

      // Auto-complete past routes (mark routes as completed when date has passed)
      try {
        await fetch('/api/routes/auto-complete', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
        });
      } catch (e) {
        // Silently ignore auto-complete errors
      }

      // Load dashboard stats
      const statsResponse = await fetch('/api/company/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        setDashboardStats(stats);
      }


      // Load buses with performance metrics
      const busesResponse = await fetch('/api/company/buses', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      let busesData: any = { buses: [] };
      if (busesResponse.ok) {
        busesData = await busesResponse.json();
        setBuses(busesData.buses || []);
        // Get last 5 buses added
        setRecentBuses((busesData.buses || []).slice(0, 5));
      }

      // Load routes with metrics
      const routesResponse = await fetch('/api/company/routes', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      let routesData: any = { routes: [] };
      if (routesResponse.ok) {
        routesData = await routesResponse.json();
        setRoutes(routesData.routes || []);
        // Get last 5 routes added
        setRecentRoutes((routesData.routes || []).slice(0, 5));
      }

      // Load drivers for driver assignment dropdown
      const driversResponse = await fetch('/api/company/drivers', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      let driversData: any = { drivers: [] };
      if (driversResponse.ok) {
        driversData = await driversResponse.json();
        setDrivers(driversData.drivers || []);
      }

      // Load recent bookings
      const bookingsResponse = await fetch('/api/company/bookings?recent=true', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      let bookingsData: any = { bookings: [] };
      if (bookingsResponse.ok) {
        bookingsData = await bookingsResponse.json();
        setRecentBookings(bookingsData.bookings || []);
      }

      // Load recent refunds (last 5)
      const refundsResponse = await fetch('/api/company/refunds', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      let refundsData: any = { refunds: [] };
      if (refundsResponse.ok) {
        refundsData = await refundsResponse.json();
        setRecentRefunds((refundsData.refunds || []).slice(0, 5));
      }

      // Aggregate recent activity (bookings, refunds, buses, routes)
      const activities: any[] = [];
      (bookingsData.bookings || []).forEach((b: any) => {
        activities.push({
          type: b.status === 'cancelled' ? 'booking_cancelled' : 'booking_confirmed',
          date: b.created_at,
          data: b,
        });
      });
      (refundsData.refunds || []).forEach((r: any) => {
        activities.push({
          type: r.status === 'pending' ? 'refund_requested' : r.status === 'processed' ? 'refund_processed' : 'refund_rejected',
          date: r.requested_at || r.processed_at || r.created_at,
          data: r,
        });
      });
      (busesData.buses || []).forEach((bus: any) => {
        activities.push({
          type: 'bus_added',
          date: bus.created_at,
          data: bus,
        });
      });
      (routesData.routes || []).forEach((route: any) => {
        activities.push({
          type: 'route_added',
          date: route.created_at || route.date,
          data: route,
        });
      });
      // Sort by date desc, take top 10
      activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentActivity(activities.slice(0, 10));

      // Load subscription data
      const subscriptionsResponse = await fetch('/api/subscriptions', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (subscriptionsResponse.ok) {
        const subscriptionsData = await subscriptionsResponse.json();
        setSubscriptionInfo(subscriptionsData);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load all bookings with filters
  const loadAllBookings = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      let url = '/api/company/bookings?';
      if (bookingStatusFilter) url += `status=${bookingStatusFilter}&`;
      if (bookingDateFilter) url += `date=${bookingDateFilter}&`;

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setAllBookings(data.bookings || []);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
    }
  };

  const loadTrackingDevices = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setLoadingTrackingDevices(true);
      const response = await fetch('/api/tracking/devices', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setTrackingDevices(data.devices || []);
      }
    } catch (error) {
      console.error('Error loading tracking devices:', error);
    } finally {
      setLoadingTrackingDevices(false);
    }
  };

  const handleRegisterTrackingDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    setTrackingMessage(null);

    if (!newTrackingDevice.bus_id || !newTrackingDevice.device_imei || !newTrackingDevice.provider) {
      setTrackingMessage({ type: 'error', text: 'Bus, IMEI, and provider are required.' });
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setRegisteringDevice(true);
      const response = await fetch('/api/tracking/devices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bus_id: Number(newTrackingDevice.bus_id),
          device_imei: newTrackingDevice.device_imei,
          device_serial: newTrackingDevice.device_serial || null,
          provider: newTrackingDevice.provider,
          provider_device_id: newTrackingDevice.provider_device_id || null,
          sim_number: newTrackingDevice.sim_number || null,
          sim_provider: newTrackingDevice.sim_provider || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setTrackingMessage({ type: 'error', text: data.error || 'Failed to register device.' });
        return;
      }

      setTrackingMessage({ type: 'success', text: 'GPS device registered successfully.' });
      setNewTrackingDevice({
        bus_id: '',
        device_imei: '',
        device_serial: '',
        provider: 'ctrack',
        provider_device_id: '',
        sim_number: '',
        sim_provider: '',
      });
      loadTrackingDevices();
    } catch (error) {
      console.error('Error registering tracking device:', error);
      setTrackingMessage({ type: 'error', text: 'Failed to register device. Please try again.' });
    } finally {
      setRegisteringDevice(false);
    }
  };

  // Update booking status
  const updateBookingStatus = async (bookingId: number, newStatus: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        loadAllBookings();
        alert(`Booking status updated to ${newStatus}`);
      } else {
        alert('Failed to update booking status');
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert('Failed to update booking status');
    }
  };

  // Load bookings when tab changes or filters change
  useEffect(() => {
    if (activeTab === 'bookings') {
      loadAllBookings();
    }
    if (activeTab === 'drivers') {
      loadDrivers();
    }
    if (activeTab === 'routes') {
      // Load drivers for the driver assignment dropdown when routes tab is active
      loadDrivers();
    }
    if (activeTab === 'tracking') {
      loadTrackingDevices();
    }
    if (activeTab === 'refunds') {
      loadRefunds();
    }
    if (activeTab === 'profile') {
      fetchCompanyProfile();
    }
  }, [activeTab, bookingStatusFilter, bookingDateFilter, refundStatusFilter]);

  // Profile management functions
  const fetchCompanyProfile = async () => {
    setProfileLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/profile', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success && data.profile) {
        setCompanyProfile(data.profile);
        setLogoUrl(data.profile.company_logo_url || null);
        setCompanyProfileForm({
          name: data.profile.name || '',
          phone: data.profile.phone || '',
          company_name: data.profile.company_name || '',
          license_number: data.profile.license_number || '',
          company_registration_number: data.profile.company_registration_number || '',
          company_address: data.profile.company_address || '',
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
      }
    } catch (error) {
      console.error('Error fetching company profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleCompanyProfileSave = async () => {
    setProfileMessage(null);

    // Validate passwords if changing
    if (companyProfileForm.new_password) {
      if (!companyProfileForm.current_password) {
        setProfileMessage({ type: 'error', text: 'Current password is required to change password' });
        return;
      }
      if (companyProfileForm.new_password !== companyProfileForm.confirm_password) {
        setProfileMessage({ type: 'error', text: 'New passwords do not match' });
        return;
      }
      if (companyProfileForm.new_password.length < 6) {
        setProfileMessage({ type: 'error', text: 'New password must be at least 6 characters' });
        return;
      }
    }

    setProfileSaving(true);
    try {
      const token = localStorage.getItem('token');
      const updateData: any = {
        name: companyProfileForm.name,
        phone: companyProfileForm.phone,
        company_name: companyProfileForm.company_name,
        license_number: companyProfileForm.license_number,
        company_registration_number: companyProfileForm.company_registration_number,
        company_address: companyProfileForm.company_address
      };

      if (companyProfileForm.new_password) {
        updateData.current_password = companyProfileForm.current_password;
        updateData.new_password = companyProfileForm.new_password;
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
        setCompanyProfile(data.profile);
        // Update localStorage user data
        const userData = localStorage.getItem('user');
        if (userData) {
          const userObj = JSON.parse(userData);
          userObj.name = data.profile.name;
          userObj.company_name = data.profile.company_name;
          localStorage.setItem('user', JSON.stringify(userObj));
          setUser(userObj);
        }
        setProfileMessage({ type: 'success', text: 'Company profile updated successfully!' });
        // Clear password fields
        setCompanyProfileForm(prev => ({
          ...prev,
          current_password: '',
          new_password: '',
          confirm_password: ''
        }));
      } else {
        setProfileMessage({ type: 'error', text: data.error || 'Failed to update profile' });
      }
    } catch (error) {
      console.error('Error saving company profile:', error);
      setProfileMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setProfileSaving(false);
    }
  };

  // Logo upload functions
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setProfileMessage({ type: 'error', text: 'Please upload a valid image file (JPG, PNG, WebP, or GIF)' });
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      setProfileMessage({ type: 'error', text: 'Logo must be smaller than 2MB' });
      return;
    }

    setUploadingLogo(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('logo', file);

      const response = await fetch('/api/upload/logo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setLogoUrl(data.logo_url);
        setProfileMessage({ type: 'success', text: 'Logo uploaded successfully!' });
      } else {
        setProfileMessage({ type: 'error', text: data.error || 'Failed to upload logo' });
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      setProfileMessage({ type: 'error', text: 'Failed to upload logo. Please try again.' });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleLogoDelete = async () => {
    if (!logoUrl) return;

    if (!confirm('Are you sure you want to remove your company logo?')) return;

    setUploadingLogo(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/upload/logo', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setLogoUrl(null);
        setProfileMessage({ type: 'success', text: 'Logo removed successfully!' });
      } else {
        setProfileMessage({ type: 'error', text: data.error || 'Failed to remove logo' });
      }
    } catch (error) {
      console.error('Error deleting logo:', error);
      setProfileMessage({ type: 'error', text: 'Failed to remove logo. Please try again.' });
    } finally {
      setUploadingLogo(false);
    }
  };

  // Bus images management functions
  const openBusImagesModal = async (bus: Bus) => {
    setSelectedBusForImages(bus);
    setShowBusImagesModal(true);
    await loadBusImages(bus.id);
  };

  const loadBusImages = async (busId: number) => {
    setLoadingBusImages(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/upload/bus-images?bus_id=${busId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setBusImages(data.images || []);
      } else {
        setBusImages([]);
      }
    } catch (error) {
      console.error('Error loading bus images:', error);
      setBusImages([]);
    } finally {
      setLoadingBusImages(false);
    }
  };

  const handleBusImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !selectedBusForImages) return;

    // Check if we'd exceed the limit
    if (busImages.length + files.length > 5) {
      alert(`You can only have 5 images per bus. You have ${busImages.length} images and are trying to add ${files.length}.`);
      return;
    }

    setUploadingBusImages(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('bus_id', selectedBusForImages.id.toString());

      for (let i = 0; i < files.length; i++) {
        // Validate each file
        const file = files[i];
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
          alert(`File "${file.name}" is not a valid image type`);
          continue;
        }
        if (file.size > 2 * 1024 * 1024) {
          alert(`File "${file.name}" is larger than 2MB`);
          continue;
        }
        formData.append('images', file);
      }

      const response = await fetch('/api/upload/bus-images', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        await loadBusImages(selectedBusForImages.id);
      } else {
        alert(data.error || 'Failed to upload images');
      }
    } catch (error) {
      console.error('Error uploading bus images:', error);
      alert('Failed to upload images. Please try again.');
    } finally {
      setUploadingBusImages(false);
    }
  };

  const handleBusImageDelete = async (imageId: number) => {
    if (!confirm('Are you sure you want to delete this image?')) return;
    if (!selectedBusForImages) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/upload/bus-images?image_id=${imageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        await loadBusImages(selectedBusForImages.id);
      } else {
        alert(data.error || 'Failed to delete image');
      }
    } catch (error) {
      console.error('Error deleting bus image:', error);
      alert('Failed to delete image. Please try again.');
    }
  };

  // Driver management functions
  const loadDrivers = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await fetch('/api/company/drivers', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setDrivers(data.drivers || []);
      }
    } catch (error) {
      console.error('Error loading drivers:', error);
    }
  };

  const handleAddDriver = async () => {
    const token = localStorage.getItem('token');

    // Validate required fields including email and password
    if (!newDriver.name || !newDriver.phone || !newDriver.license_number || !newDriver.email || !newDriver.password) {
      alert('Please fill in all required fields including email and password');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newDriver.email)) {
      alert('Please enter a valid email address');
      return;
    }

    // Validate password length
    if (newDriver.password.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    try {
      // Hash password before sending
      const response = await fetch('/api/company/drivers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newDriver,
          // Send plain password - backend will hash it
          password: newDriver.password
        }),
      });

      if (response.ok) {
        setShowAddDriverModal(false);
        setNewDriver({
          name: '',
          phone: '',
          email: '',           // Reset email
          password: '',        // Reset password
          license_number: '',
          license_type: 'Class B',
          license_expiry: '',
          nrc_number: '',
          date_of_birth: '',
          address: ''
        });
        loadDrivers();
        alert('Driver added successfully! They can now login with their email and password.');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to add driver');
      }
    } catch (error) {
      alert('Failed to add driver');
    }
  };

  const handleEditDriver = async () => {
    const token = localStorage.getItem('token');
    if (!token || !editingDriver) return;

    try {
      // Prepare update data
      const updateData: any = {
        name: editingDriver.name,
        phone: editingDriver.phone,
        email: editingDriver.email,
        license_number: editingDriver.license_number,
        license_type: editingDriver.license_type,
        license_expiry: editingDriver.license_expiry,
        nrc_number: editingDriver.nrc_number,
        date_of_birth: editingDriver.date_of_birth,
        address: editingDriver.address,
        status: editingDriver.status
      };

      // Only include password if it was provided (to change it)
      if (editingDriver.new_password && editingDriver.new_password.length >= 6) {
        updateData.password = editingDriver.new_password;
      }

      const response = await fetch(`/api/company/drivers/${editingDriver.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        setShowEditDriverModal(false);
        setEditingDriver(null);
        loadDrivers();
        alert('Driver updated successfully!');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update driver');
      }
    } catch (error) {
      alert('Failed to update driver');
    }
  };

  const handleDeleteDriver = async (driverId: number) => {
    if (!confirm('Are you sure you want to delete this driver?')) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await fetch(`/api/company/drivers/${driverId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        loadDrivers();
        alert('Driver deleted successfully!');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete driver');
      }
    } catch (error) {
      alert('Failed to delete driver');
    }
  };

  const handleDriverStatusChange = async (driverId: number, newStatus: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await fetch(`/api/company/drivers/${driverId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) { loadDrivers(); }
    } catch (error) {
      console.error('Error updating driver status:', error);
    }
  };

  // Refund management functions
  const loadRefunds = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const params = new URLSearchParams();
      if (refundStatusFilter) params.append('status', refundStatusFilter);

      const response = await fetch(`/api/company/refunds?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setRefunds(data.refunds || []);
        setRefundStats(data.statistics || {});
      } else {
        // Fallback to get refund data from bookings table
        const bookingsResponse = await fetch('/api/company/bookings', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (bookingsResponse.ok) {
          const bookingsData = await bookingsResponse.json();
          const refundBookings = (bookingsData.bookings || []).filter((b: any) =>
            b.refund_status || b.refund_amount > 0
          );
          setRefunds(refundBookings);

          // Calculate stats
          const stats = {
            total_refunds: refundBookings.length,
            pending_refunds: refundBookings.filter((r: any) => r.refund_status === 'pending').length,
            processed_refunds: refundBookings.filter((r: any) => r.refund_status === 'processed').length,
            rejected_refunds: refundBookings.filter((r: any) => r.refund_status === 'rejected').length,
            pending_amount: refundBookings.filter((r: any) => r.refund_status === 'pending').reduce((sum: number, r: any) => sum + (r.refund_amount || 0), 0),
            processed_amount: refundBookings.filter((r: any) => r.refund_status === 'processed').reduce((sum: number, r: any) => sum + (r.refund_amount || 0), 0)
          };
          setRefundStats(stats);
        }
      }
    } catch (error) {
      console.error('Error loading refunds:', error);
    }
  };

  const handleRefundAction = async (refundId: number, action: 'approve' | 'reject', rejectionReason?: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setProcessingRefund(refundId);

    try {
      const response = await fetch('/api/company/refunds', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          refundId,
          status: action === 'approve' ? 'processed' : 'rejected',
          rejectionReason
        }),
      });

      if (response.ok) {
        loadRefunds();
        alert(`Refund ${action === 'approve' ? 'approved' : 'rejected'} successfully!`);
      } else {
        const data = await response.json();
        alert(data.error || `Failed to ${action} refund`);
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      alert(`Failed to ${action} refund`);
    } finally {
      setProcessingRefund(null);
    }
  };

  // Handle subscription payment
  const handleSubscriptionPayment = async () => {
    if (!selectedBusForPayment) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    // Validate payment method specific fields
    if (paymentForm.payment_method.includes('money') && !paymentForm.phone_number) {
      alert('Please enter your mobile money phone number');
      return;
    }
    if (paymentForm.payment_method === 'card' && (!paymentForm.card_number || !paymentForm.card_expiry || !paymentForm.card_cvv)) {
      alert('Please fill in all card details');
      return;
    }

    setProcessingPayment(true);

    try {
      // Generate transaction ID based on payment method
      const transactionId = `${paymentForm.payment_method.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          bus_id: selectedBusForPayment.id,
          months: paymentForm.months,
          payment_method: paymentForm.payment_method,
          transaction_id: transactionId
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Payment successful! Your subscription for ${selectedBusForPayment.bus_name} has been activated for ${paymentForm.months} month(s).`);
        setShowPayModal(false);
        setSelectedBusForPayment(null);
        setPaymentForm({
          months: 1,
          payment_method: 'mtn_money',
          phone_number: '',
          card_number: '',
          card_expiry: '',
          card_cvv: ''
        });
        // Reload subscription data
        loadDashboardData(token);
      } else {
        const data = await response.json();
        alert(data.error || 'Payment failed. Please try again.');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Payment failed. Please check your connection and try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  // Trip status management function
  const updateRouteStatus = async (routeId: number, newStatus: string) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`/api/company/routes/${routeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Refresh routes data
        const refreshToken = localStorage.getItem('token');
        if (refreshToken) {
          loadDashboardData(refreshToken);
        }
        alert(`Route status updated to ${newStatus}`);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update route status');
      }
    } catch (error) {
      console.error('Error updating route status:', error);
      alert('Failed to update route status');
    }
  };

  // Handler for editing a route
  const handleEditRoute = async () => {
    const token = localStorage.getItem('token');
    if (!token || !editingRoute) return;
    try {
      const response = await fetch(`/api/company/routes/${editingRoute.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          origin: editingRoute.origin,
          destination: editingRoute.destination,
          departure_time: editingRoute.departure_time,
          arrival_time: editingRoute.arrival_time,
          date: editingRoute.date,
          price: editingRoute.price,
          intermediate_stops: editingRoute.intermediate_stops,
          driver_id: editingRoute.driver_id || null,
          status: editingRoute.status
        }),
      });
      if (response.ok) {
        setShowEditRouteModal(false);
        setEditingRoute(null);
        const refreshToken = localStorage.getItem('token');
        if (refreshToken) loadDashboardData(refreshToken);
        alert('Route updated successfully!');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update route');
      }
    } catch (error) {
      alert('Failed to update route');
    }
  };

  // Handler for deleting a route
  const handleDeleteRoute = async (routeId: number) => {
    if (!confirm('Are you sure you want to delete this route? This cannot be undone.')) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await fetch(`/api/company/routes/${routeId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const refreshToken = localStorage.getItem('token');
        if (refreshToken) loadDashboardData(refreshToken);
        alert('Route deleted successfully!');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete route');
      }
    } catch (error) {
      alert('Failed to delete route');
    }
  };

  // Handler for bus status change
  const handleBusStatusChange = async (busId: number, newStatus: string) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`/api/company/buses/${busId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const refreshToken = localStorage.getItem('token');
        if (refreshToken) {
          loadDashboardData(refreshToken);
        }
        alert(`Bus status updated to ${newStatus}`);
      } else {
        alert('Failed to update bus status');
      }
    } catch (error) {
      console.error('Error updating bus status:', error);
      alert('Failed to update bus status');
    }
  };

  // Handler for adding a new bus
  const handleAddBus = async () => {
    const token = localStorage.getItem('token');
    if (!newBus.bus_name || !newBus.bus_number) {
      alert('Please fill in bus name and bus number');
      return;
    }
    try {
      const response = await fetch('/api/company/buses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newBus,
          amenities: newBus.amenities.join(', ')
        }),
      });

      if (response.ok) {
        const refreshToken = localStorage.getItem('token');
        if (refreshToken) {
          loadDashboardData(refreshToken);
        }
        setShowAddBusModal(false);
        setNewBus({ bus_name: '', bus_number: '', total_seats: 50, amenities: [] });
        alert('Bus added successfully!');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to add bus');
      }
    } catch (error) {
      console.error('Error adding bus:', error);
      alert('Failed to add bus');
    }
  };

  // Handler for editing a bus
  const handleEditBus = async () => {
    if (!editingBus) return;
    const token = localStorage.getItem('token');
    if (!editingBus.bus_name || !editingBus.bus_number) {
      alert('Please fill in bus name and bus number');
      return;
    }
    try {
      const response = await fetch(`/api/company/buses/${editingBus.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          bus_name: editingBus.bus_name,
          total_seats: editingBus.total_seats,
          bus_type: editingBus.bus_type,
          amenities: editingBus.amenities,
          status: editingBus.status,
        }),
      });

      if (response.ok) {
        const refreshToken = localStorage.getItem('token');
        if (refreshToken) {
          loadDashboardData(refreshToken);
        }
        setShowEditBusModal(false);
        setEditingBus(null);
        alert('Bus updated successfully!');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to update bus');
      }
    } catch (error) {
      console.error('Error updating bus:', error);
      alert('Failed to update bus');
    }
  };

  // Handler for adding a new route
  const handleAddRoute = async () => {
    const token = localStorage.getItem('token');
    if (!newRoute.bus_id || !newRoute.origin || !newRoute.destination || !newRoute.departure_time || !newRoute.date || !newRoute.price) {
      alert('Please fill in all required fields');
      return;
    }
    try {
      const response = await fetch('/api/company/routes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newRoute),
      });

      if (response.ok) {
        const refreshToken = localStorage.getItem('token');
        if (refreshToken) {
          loadDashboardData(refreshToken);
        }
        setShowAddRouteModal(false);
        setNewRoute({ bus_id: '', origin: '', destination: '', departure_time: '', arrival_time: '', date: '', price: '', intermediate_stops: '' });
        alert('Route created successfully!');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to create route');
      }
    } catch (error) {
      console.error('Error creating route:', error);
      alert('Failed to create route');
    }
  };

  // Handler for opening duplicate route modal
  const openDuplicateModal = (route: Route) => {
    setDuplicatingRoute(route);
    // Set default start date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    setDuplicateOptions({
      mode: 'single',
      recurrence: 'daily',
      start_date: tomorrow.toISOString().split('T')[0],
      end_date: nextWeek.toISOString().split('T')[0],
      days_of_week: [],
      new_price: String(route.price),
      new_departure_time: route.departure_time,
      new_arrival_time: route.arrival_time || ''
    });
    setShowDuplicateModal(true);
  };

  // Handler for creating duplicate/recurring routes
  const handleDuplicateRoute = async () => {
    if (!duplicatingRoute) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    setCreatingRoutes(true);

    try {
      let body: any = {};

      if (duplicateOptions.mode === 'single') {
        // Single duplicate for the selected start date
        body = {
          dates: [duplicateOptions.start_date],
          new_price: duplicateOptions.new_price ? Number(duplicateOptions.new_price) : undefined,
          new_departure_time: duplicateOptions.new_departure_time || undefined,
          new_arrival_time: duplicateOptions.new_arrival_time || undefined
        };
      } else {
        // Recurring routes
        body = {
          recurrence: duplicateOptions.recurrence,
          start_date: duplicateOptions.start_date,
          end_date: duplicateOptions.end_date,
          days_of_week: duplicateOptions.recurrence === 'weekly' ? duplicateOptions.days_of_week : undefined,
          new_price: duplicateOptions.new_price ? Number(duplicateOptions.new_price) : undefined,
          new_departure_time: duplicateOptions.new_departure_time || undefined,
          new_arrival_time: duplicateOptions.new_arrival_time || undefined
        };
      }

      const response = await fetch(`/api/company/routes/${duplicatingRoute.id}/duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (response.ok) {
        const refreshToken = localStorage.getItem('token');
        if (refreshToken) {
          loadDashboardData(refreshToken);
        }
        setShowDuplicateModal(false);
        setDuplicatingRoute(null);

        let message = `Created ${result.created} route(s) successfully!`;
        if (result.skipped > 0) {
          message += `\n${result.skipped} date(s) skipped due to conflicts.`;
        }
        alert(message);
      } else {
        alert(result.error || 'Failed to create routes');
      }
    } catch (error) {
      console.error('Error duplicating route:', error);
      alert('Failed to create routes');
    } finally {
      setCreatingRoutes(false);
    }
  };

  // Filter routes based on search and status
  const filteredRoutes = routes.filter(route => {
    // Status filter
    if (routeStatusFilter !== 'all' && route.status !== routeStatusFilter) {
      return false;
    }

    // Search filter
    if (routeSearchTerm) {
      const searchLower = routeSearchTerm.toLowerCase();
      return (
        route.origin.toLowerCase().includes(searchLower) ||
        route.destination.toLowerCase().includes(searchLower) ||
        (route.bus_name && route.bus_name.toLowerCase().includes(searchLower)) ||
        (route.intermediate_stops && route.intermediate_stops.toLowerCase().includes(searchLower)) ||
        (route.date && route.date.includes(routeSearchTerm))
      );
    }

    return true;
  });

  // Paginate filtered routes
  const paginatedRoutes = filteredRoutes.slice(
    (routePage - 1) * ROUTES_PER_PAGE,
    routePage * ROUTES_PER_PAGE
  );

  const totalRoutePages = Math.ceil(filteredRoutes.length / ROUTES_PER_PAGE);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/company/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom right, #E6F7F6, white, #E8F3EC)' }}>
      {/* Enhanced Header - Zambian Theme */}
      <header style={{ background: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderBottom: '4px solid #2BB2A9', position: 'sticky', top: 0, zIndex: 1000 }}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/company/dashboard" className="flex items-center space-x-3">
                <img
                  src="/logo.jpg"
                  alt="VayaZed Logo"
                  style={{ width: '52px', height: '52px', objectFit: 'cover', objectPosition: 'center', borderRadius: '0.75rem', background: 'linear-gradient(135deg, #E6F7F6, #E8F3EC)', border: '2px solid #2BB2A9', boxShadow: '0 6px 14px rgba(0, 0, 0, 0.2)' }}
                />
                <div>
                  <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', background: 'linear-gradient(to right, #2BB2A9, #659E85)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Company Dashboard</h1>
                  <p className="text-sm text-gray-600">{user.company_name || user.name}</p>
                </div>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-medium text-gray-800">{user.name}</p>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Enhanced Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="flex flex-wrap border-b border-gray-200">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'fleet', label: 'Fleet Management', icon: '🚌' },
              { id: 'routes', label: 'Routes & Schedules', icon: '🛣️' },
              { id: 'seats', label: 'Seats & Pricing', icon: '💺' },
              { id: 'drivers', label: 'Drivers', icon: '👨‍✈️' },
              { id: 'tracking', label: 'Tracking', icon: '📍' },
              { id: 'bookings', label: 'Bookings', icon: '🎫' },
              { id: 'refunds', label: 'Refunds', icon: '💸' },
              { id: 'analytics', label: 'Analytics', icon: '📈' },
              { id: 'subscriptions', label: 'Subscriptions', icon: '💳' },
              { id: 'profile', label: 'Company Profile', icon: '🏢' },
              { id: 'reviews', label: 'Reviews', icon: '⭐' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '1rem 1.5rem',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  borderBottom: activeTab === tab.id ? '3px solid #2BB2A9' : '3px solid transparent',
                  color: activeTab === tab.id ? '#2BB2A9' : '#4b5563',
                  background: activeTab === tab.id ? '#E6F7F6' : 'transparent'
                }}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <svg style={{ width: '3rem', height: '3rem', color: '#2BB2A9' }} className="animate-spin mx-auto mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Key Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8m-8 4h8m-4 4v4" />
                        </svg>
                      </div>
                      <span className="text-sm opacity-80">Fleet Status</span>
                    </div>
                    <div className="text-3xl font-bold mb-1">{dashboardStats.activeBuses}/{dashboardStats.totalBuses}</div>
                    <div className="text-sm opacity-80">Active Buses</div>
                  </div>

                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                        </svg>
                      </div>
                      <span className="text-sm opacity-80">Today</span>
                    </div>
                    <div className="text-3xl font-bold mb-1">{dashboardStats.todayBookings}</div>
                    <div className="text-sm opacity-80">New Bookings</div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      <span className="text-sm opacity-80">This Month</span>
                    </div>
                    <div className="text-3xl font-bold mb-1">K{dashboardStats.thisMonthRevenue.toLocaleString()}</div>
                    <div className="text-sm opacity-80">Revenue</div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <span className="text-sm opacity-80">Today</span>
                    </div>
                    <div className="text-3xl font-bold mb-1">{dashboardStats.todayPassengers}</div>
                    <div className="text-sm opacity-80">Passengers</div>
                  </div>
                </div>

                {/* Performance Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-6">Business Performance</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Average Occupancy</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full">
                            <div
                              className="h-full bg-green-500 rounded-full"
                              style={{ width: `${dashboardStats.averageOccupancy}%` }}
                            ></div>
                          </div>
                          <span className="font-medium text-gray-800">{dashboardStats.averageOccupancy}%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Active Routes</span>
                        <span className="font-medium text-gray-800">{dashboardStats.activeRoutes} of {dashboardStats.totalRoutes}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Total Passengers</span>
                        <span className="font-medium text-gray-800">{dashboardStats.totalPassengers.toLocaleString()}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Total Revenue</span>
                        <span className="font-medium text-green-600">K{dashboardStats.totalRevenue.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-6">Recent Activity</h3>
                    <div className="space-y-4">
                      {recentActivity.length === 0 ? (
                        <div className="text-gray-500 text-sm">No recent activity found.</div>
                      ) : (
                        recentActivity.map((activity, idx) => {
                          let icon = '🟢', color = 'bg-green-500', title = '', desc = '', time = '';
                          const now = new Date();
                          const eventDate = new Date(activity.date);
                          const diffMs = now.getTime() - eventDate.getTime();
                          const diffMins = Math.floor(diffMs / 60000);
                          if (diffMins < 1) time = 'just now';
                          else if (diffMins < 60) time = `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
                          else if (diffMins < 1440) time = `${Math.floor(diffMins / 60)} hour${Math.floor(diffMins / 60) > 1 ? 's' : ''} ago`;
                          else time = `${Math.floor(diffMins / 1440)} day${Math.floor(diffMins / 1440) > 1 ? 's' : ''} ago`;

                          switch (activity.type) {
                            case 'booking_confirmed':
                              icon = '🟢'; color = 'bg-green-500';
                              title = 'New booking confirmed';
                              desc = `${activity.data.origin} to ${activity.data.destination} - ${activity.data.num_seats || activity.data.seat_numbers?.split(',').length || 1} passenger(s)`;
                              break;
                            case 'booking_cancelled':
                              icon = '❌'; color = 'bg-yellow-500';
                              title = 'Booking cancelled';
                              desc = `Refund ${activity.data.refund_status === 'processed' ? 'processed' : 'requested'} - K${activity.data.refund_amount || activity.data.total_price}`;
                              break;
                            case 'refund_requested':
                              icon = '💸'; color = 'bg-yellow-500';
                              title = 'Refund requested';
                              desc = `${activity.data.customer_name} - K${activity.data.amount}`;
                              break;
                            case 'refund_processed':
                              icon = '✅'; color = 'bg-green-500';
                              title = 'Refund processed';
                              desc = `${activity.data.customer_name} - K${activity.data.amount}`;
                              break;
                            case 'refund_rejected':
                              icon = '❌'; color = 'bg-red-500';
                              title = 'Refund rejected';
                              desc = `${activity.data.customer_name} - K${activity.data.amount}`;
                              break;
                            case 'bus_added':
                              icon = '🚌'; color = 'bg-purple-500';
                              title = 'New bus registered';
                              desc = `${activity.data.bus_name} (${activity.data.bus_number}) added to fleet`;
                              break;
                            case 'route_added':
                              icon = '🛣️'; color = 'bg-blue-500';
                              title = 'New route created';
                              desc = `${activity.data.origin} to ${activity.data.destination}`;
                              break;
                            default:
                              icon = 'ℹ️'; color = 'bg-gray-400';
                              title = 'Activity';
                              desc = '';
                          }
                          return (
                            <div className="flex items-start space-x-3" key={idx}>
                              <div className={`w-7 h-7 flex items-center justify-center rounded-full mt-1.5 text-lg ${color}`}>{icon}</div>
                              <div>
                                <p className="text-sm text-gray-800 font-medium">{title}</p>
                                <p className="text-xs text-gray-600">{desc}</p>
                                <p className="text-xs text-gray-500">{time}</p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-6">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button
                      onClick={() => setActiveTab('buses')}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition text-left group"
                    >
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-200 transition">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <h4 className="font-medium text-gray-800">Add New Bus</h4>
                      <p className="text-sm text-gray-600">Expand your fleet</p>
                    </button>

                    <button
                      onClick={() => setActiveTab('routes')}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition text-left group"
                    >
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-green-200 transition">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <h4 className="font-medium text-gray-800">Create Route</h4>
                      <p className="text-sm text-gray-600">Add new schedule</p>
                    </button>

                    <button
                      onClick={() => setActiveTab('bookings')}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition text-left group"
                    >
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-purple-200 transition">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                        </svg>
                      </div>
                      <h4 className="font-medium text-gray-800">View Bookings</h4>
                      <p className="text-sm text-gray-600">Manage reservations</p>
                    </button>

                    <button
                      onClick={() => setActiveTab('analytics')}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-orange-50 hover:border-orange-300 transition text-left group"
                    >
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-orange-200 transition">
                        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <h4 className="font-medium text-gray-800">View Analytics</h4>
                      <p className="text-sm text-gray-600">Business insights</p>
                    </button>

                    <Link
                      href="/customer/track"
                      className="p-4 border border-gray-200 rounded-lg hover:bg-teal-50 hover:border-teal-300 transition text-left group block"
                    >
                      <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-teal-200 transition">
                        <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <h4 className="font-medium text-gray-800">Active Trips</h4>
                      <p className="text-sm text-gray-600">Live bus locations</p>
                    </Link>

                    <Link
                      href="/api/tracking/devices"
                      className="p-4 border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition text-left group block"
                    >
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-indigo-200 transition">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
                        </svg>
                      </div>
                      <h4 className="font-medium text-gray-800">GPS Devices</h4>
                      <p className="text-sm text-gray-600">Manage trackers</p>
                    </Link>
                  </div>
                </div>

                {/*Reviews Summary*/}
                {/* Compact Reviews Summary Card – place after Quick Actions or Recent Activity */}

                {/* Compact Reviews Summary Card */}
                <ReviewsSummary
                  companyId={user?.id}
                  onViewAllClick={() => setActiveTab('reviews')}  // Switches to full Reviews tab
                />
              </div>
            )}

            {/* Fleet Management Tab */}
            {activeTab === 'fleet' && (
              <div className="space-y-6">
                {/* Fleet Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">🚌 Fleet Management</h2>
                      <p className="text-blue-100">Manage your bus fleet, add new vehicles, and track performance</p>
                    </div>
                    <button
                      onClick={() => setShowAddBusModal(true)}
                      className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add New Bus
                    </button>
                  </div>
                </div>

                {/* Fleet Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">🚌</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Buses</p>
                        <p className="text-2xl font-bold text-gray-800">{buses.length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">✅</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Active Buses</p>
                        <p className="text-2xl font-bold text-green-600">{buses.filter(b => b.status === 'active').length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">🔧</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">In Maintenance</p>
                        <p className="text-2xl font-bold text-yellow-600">{buses.filter(b => b.status === 'maintenance').length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">💺</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Capacity</p>
                        <p className="text-2xl font-bold text-purple-600">{buses.reduce((sum, b) => sum + (b.total_seats || 50), 0)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fleet Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">Your Fleet</h3>
                  </div>
                  {buses.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">🚌</span>
                      </div>
                      <h4 className="text-lg font-medium text-gray-800 mb-2">No buses yet</h4>
                      <p className="text-gray-600 mb-4">Add your first bus to get started with fleet management</p>
                      <button
                        onClick={() => setShowAddBusModal(true)}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                      >
                        Add Your First Bus
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Bus Name</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Bus Number</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Capacity</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Amenities</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {buses.map((bus) => (
                            <tr key={bus.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <span className="text-lg">🚌</span>
                                  </div>
                                  <span className="font-medium text-gray-800">{bus.bus_name}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-gray-600">{bus.bus_number}</td>
                              <td className="px-6 py-4 text-gray-600">{bus.total_seats || 50} seats</td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${bus.status === 'active' ? 'bg-green-100 text-green-700' :
                                  bus.status === 'maintenance' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                  {bus.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-gray-600 text-sm">{bus.amenities || 'Standard'}</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleBusStatusChange(bus.id, bus.status === 'active' ? 'maintenance' : 'active')}
                                    className={`px-3 py-1 rounded text-xs font-medium transition ${bus.status === 'active'
                                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                                      }`}
                                  >
                                    {bus.status === 'active' ? 'Set Maintenance' : 'Set Active'}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingBus(bus);
                                      setShowEditBusModal(true);
                                    }}
                                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200 transition"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => openBusImagesModal(bus)}
                                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium hover:bg-purple-200 transition"
                                    title="Manage bus photos"
                                  >
                                    📷 Photos
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Routes & Schedules Tab */}
            {activeTab === 'routes' && (
              <div className="space-y-6">
                {/* Routes Header */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">🗺️</span>
                      <div>
                        <h2 className="text-2xl font-bold">Routes & Schedules</h2>
                        <p className="text-green-100">Create and manage your bus routes</p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                      <button
                        onClick={() => setShowAddRouteModal(true)}
                        className="bg-white text-green-600 px-5 py-2.5 rounded-lg font-semibold hover:bg-green-50 transition flex items-center justify-center gap-2 shadow-md"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Single Route
                      </button>
                      <button
                        onClick={() => {
                          if (routes.length === 0) {
                            alert('Please create a single route first to use as template');
                            return;
                          }
                          openDuplicateModal(routes[0]);
                        }}
                        className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-md border-2 border-white/20"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        🔄 Create Recurring
                      </button>
                    </div>
                  </div>
                </div>

                {/* Routes Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">🛣️</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Routes</p>
                        <p className="text-2xl font-bold text-gray-800">{routes.length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">✅</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Active Routes</p>
                        <p className="text-2xl font-bold text-blue-600">{routes.filter(r => r.status === 'active').length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">🎫</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Bookings</p>
                        <p className="text-2xl font-bold text-purple-600">{routes.reduce((sum, r) => sum + (r.bookings_count || 0), 0)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">💰</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Avg. Price</p>
                        <p className="text-2xl font-bold text-orange-600">
                          K{routes.length > 0 ? Math.round(routes.reduce((sum, r) => sum + r.price, 0) / routes.length) : 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Search and Filter Bar */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Search Input */}
                    <div className="flex-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        placeholder="Search by origin, destination, bus, or stops..."
                        value={routeSearchTerm}
                        onChange={(e) => {
                          setRouteSearchTerm(e.target.value);
                          setRoutePage(1); // Reset to first page on search
                        }}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>

                    {/* Status Filter */}
                    <div className="md:w-48">
                      <select
                        value={routeStatusFilter}
                        onChange={(e) => {
                          setRouteStatusFilter(e.target.value);
                          setRoutePage(1); // Reset to first page on filter change
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                      >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    {/* Clear Filters Button (shown only when filters are active) */}
                    {(routeSearchTerm || routeStatusFilter !== 'all') && (
                      <button
                        onClick={() => {
                          setRouteSearchTerm('');
                          setRouteStatusFilter('all');
                          setRoutePage(1);
                        }}
                        className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Clear Filters
                      </button>
                    )}
                  </div>
                </div>

                {/* Routes Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">Your Routes</h3>

                  </div>
                  {paginatedRoutes.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">🗺️</span>
                      </div>
                      <h4 className="text-lg font-medium text-gray-800 mb-2">No routes yet</h4>
                      <p className="text-gray-600 mb-4">Create your first route to start accepting bookings</p>
                      <button
                        onClick={() => setShowAddRouteModal(true)}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
                      >
                        Create Your First Route
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Route</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Bus</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Schedule</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Price</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Seats</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {paginatedRoutes.map((route) => (
                            <tr key={route.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <span className="text-lg">🛣️</span>
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-800">{route.origin} → {route.destination}</p>
                                    {route.intermediate_stops && (
                                      <p className="text-xs text-gray-500">via {route.intermediate_stops}</p>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-gray-600">{route.bus_name}</td>
                              <td className="px-6 py-4">
                                <div>
                                  <p className="text-gray-800 font-medium">{route.departure_time} - {route.arrival_time}</p>
                                  <p className="text-xs text-gray-500">{route.date}</p>
                                </div>
                              </td>
                              <td className="px-6 py-4 font-medium text-gray-800">K{route.price}</td>
                              <td className="px-6 py-4">
                                <span className={`font-medium ${route.available_seats <= 5 ? 'text-red-600' : 'text-green-600'}`}>
                                  {route.available_seats} left
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${route.status === 'active' ? 'bg-green-100 text-green-700' :
                                  route.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                  {route.status}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => updateRouteStatus(route.id, route.status === 'active' ? 'inactive' : 'active')}
                                    className={`px-3 py-1 rounded text-xs font-medium transition ${route.status === 'active'
                                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                                      }`}
                                  >
                                    {route.status === 'active' ? 'Deactivate' : 'Activate'}
                                  </button>
                                  <button
                                    onClick={() => { setEditingRoute({ ...route }); setShowEditRouteModal(true); }}
                                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200 transition"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => openDuplicateModal(route)}
                                    className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium hover:bg-indigo-200 transition flex items-center gap-1"
                                    title="Create recurring schedule based on this route"
                                  >
                                    <span>🔄</span> Recurring
                                  </button>
                                  <a
                                    href={`/company/routes/${route.id}/seats`}
                                    className="px-3 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium hover:bg-orange-200 transition"
                                    title="Manage seat map, blocked seats, and dynamic pricing"
                                  >
                                    Seats & Pricing
                                  </a>
                                  <button
                                    onClick={() => handleDeleteRoute(route.id)}
                                    className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition"
                                  >
                                    Delete
                                  </button>
                                  <a
                                    href={`/company/manifest/${route.id}`}
                                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium hover:bg-purple-200 transition"
                                  >
                                    Manifest
                                  </a>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                {/* Routes Table */}

                {/* PAGINATION CONTROLS - ADD HERE */}
                {totalRoutePages > 1 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <p className="text-sm text-gray-600">
                        Showing <span className="font-medium">{(routePage - 1) * ROUTES_PER_PAGE + 1}</span> to{' '}
                        <span className="font-medium">
                          {Math.min(routePage * ROUTES_PER_PAGE, filteredRoutes.length)}
                        </span>{' '}
                        of <span className="font-medium">{filteredRoutes.length}</span> routes
                      </p>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setRoutePage(p => Math.max(1, p - 1))}
                          disabled={routePage === 1}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                          Previous
                        </button>

                        <div className="flex gap-1">
                          {Array.from({ length: Math.min(5, totalRoutePages) }, (_, i) => {
                            let pageNum;
                            if (totalRoutePages <= 5) {
                              pageNum = i + 1;
                            } else if (routePage <= 3) {
                              pageNum = i + 1;
                            } else if (routePage >= totalRoutePages - 2) {
                              pageNum = totalRoutePages - 4 + i;
                            } else {
                              pageNum = routePage - 2 + i;
                            }

                            return (
                              <button
                                key={pageNum}
                                onClick={() => setRoutePage(pageNum)}
                                className={`w-10 h-10 rounded-lg font-medium transition ${routePage === pageNum
                                  ? 'bg-green-600 text-white'
                                  : 'border border-gray-300 hover:bg-gray-50'
                                  }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                        </div>

                        <button
                          onClick={() => setRoutePage(p => Math.min(totalRoutePages, p + 1))}
                          disabled={routePage === totalRoutePages}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                        >
                          Next
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {/* FLOATING ACTION BUTTON - ADD THIS HERE */}
                {routes.length > 0 && (
                  <button
                    onClick={() => {
                      // You can either use the first route or show a selection modal
                      if (routes.length === 1) {
                        openDuplicateModal(routes[0]);
                      } else {
                        // Optional: Show a quick selection modal or just use the first
                        openDuplicateModal(routes[0]);
                        // Or you could show a toast/message asking to click Duplicate on specific route
                      }
                    }}
                    className="fixed bottom-6 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-2xl hover:bg-indigo-700 transition z-50 flex items-center gap-2 group"
                    title="Create recurring routes"
                  >
                    <span className="text-2xl">🔄</span>
                    <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:pl-2 transition-all duration-300 whitespace-nowrap">
                      Recurring Routes
                    </span>
                  </button>
                )}

              </div>
            )}

            {/* Seats & Pricing Tab */}
            {activeTab === 'seats' && (
              <div className="space-y-6">
                {/* Seats Header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">💺 Seat Management & Pricing</h2>
                      <p className="text-gray-600">Manage seat availability and configure dynamic pricing for your routes</p>
                    </div>
                  </div>
                </div>

                {/* Quick Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-blue-800">
                    <strong>💡 How it works:</strong> Select a route from the "Routes & Schedules" tab and click "Seats & Pricing" to manage:
                  </p>
                  <ul className="mt-2 text-blue-700 text-sm list-disc list-inside">
                    <li>Block or reserve specific seats</li>
                    <li>Enable dynamic pricing with custom multipliers</li>
                    <li>View seat availability and occupancy rates</li>
                  </ul>
                </div>

                {/* Routes with Seats Links */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-800">Your Routes - Manage Seats</h3>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {routes.filter(r => r.status === 'active').slice(0, 10).map((route) => (
                      <div key={route.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                        <div>
                          <p className="font-medium text-gray-800">{route.origin} → {route.destination}</p>
                          <p className="text-sm text-gray-500">{route.date} at {route.departure_time}</p>
                        </div>
                        <a
                          href={`/company/routes/${route.id}/seats`}
                          className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 font-medium transition"
                        >
                          💺 Manage Seats
                        </a>
                      </div>
                    ))}
                    {routes.filter(r => r.status === 'active').length === 0 && (
                      <div className="p-8 text-center text-gray-500">
                        No active routes found. Create routes first to manage seats.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Drivers Management Tab */}
            {activeTab === 'drivers' && (
              <div className="space-y-6">
                {/* Drivers Header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">👨‍✈️ Driver Management</h2>
                      <p className="text-gray-600">Manage your drivers and assign them to routes</p>
                    </div>
                    <button
                      onClick={() => setShowAddDriverModal(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition"
                    >
                      <span>➕</span> Add Driver
                    </button>
                  </div>
                </div>

                {/* Driver Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Total Drivers</p>
                        <p className="text-2xl font-bold text-gray-800">{drivers.length}</p>
                      </div>
                      <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl">👥</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Active Drivers</p>
                        <p className="text-2xl font-bold text-green-600">{drivers.filter((d: any) => d.status === 'active').length}</p>
                      </div>
                      <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl">✅</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">On Leave</p>
                        <p className="text-2xl font-bold text-yellow-600">{drivers.filter((d: any) => d.status === 'on_leave').length}</p>
                      </div>
                      <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl">🏖️</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Inactive</p>
                        <p className="text-2xl font-bold text-red-600">{drivers.filter((d: any) => d.status === 'inactive').length}</p>
                      </div>
                      <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl">⛔</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Drivers Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-800">All Drivers</h3>
                  </div>
                  {drivers.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="text-6xl mb-4">👨‍✈️</div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">No Drivers Yet</h3>
                      <p className="text-gray-600 mb-4">Add drivers to assign them to your routes</p>
                      <button
                        onClick={() => setShowAddDriverModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Add Your First Driver
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-4 text-left text-gray-600 font-medium">Driver</th>
                            <th className="px-6 py-4 text-left text-gray-600 font-medium">Email</th>
                            <th className="px-6 py-4 text-left text-gray-600 font-medium">Contact</th>
                            <th className="px-6 py-4 text-left text-gray-600 font-medium">License</th>
                            <th className="px-6 py-4 text-left text-gray-600 font-medium">License Expiry</th>
                            <th className="px-6 py-4 text-left text-gray-600 font-medium">Status</th>
                            <th className="px-6 py-4 text-left text-gray-600 font-medium">Active Routes</th>
                            <th className="px-6 py-4 text-left text-gray-600 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {drivers.map((driver: any) => (
                            <tr key={driver.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-blue-600 font-medium">{driver.name.charAt(0)}</span>
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-800">{driver.name}</p>
                                    {driver.nrc_number && <p className="text-xs text-gray-500">NRC: {driver.nrc_number}</p>}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-sm text-gray-800">{driver.email || 'No email'}</p>
                                <p className="text-xs text-gray-500">Login credential</p>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-gray-800">{driver.phone}</p>
                              </td>
                              <td className="px-6 py-4">
                                <p className="font-mono text-sm">{driver.license_number}</p>
                                <p className="text-xs text-gray-500">{driver.license_type || 'Class B'}</p>
                              </td>
                              <td className="px-6 py-4">
                                {driver.license_expiry ? (
                                  <span className={`text-sm ${new Date(driver.license_expiry) < new Date() ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                                    {new Date(driver.license_expiry).toLocaleDateString('en-GB')}
                                    {new Date(driver.license_expiry) < new Date() && ' (Expired)'}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">Not set</span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <select
                                  value={driver.status}
                                  onChange={(e) => handleDriverStatusChange(driver.id, e.target.value)}
                                  className={`px-2 py-1 rounded text-xs font-medium border-0 cursor-pointer ${driver.status === 'active' ? 'bg-green-100 text-green-700' :
                                    driver.status === 'on_leave' ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-red-100 text-red-700'
                                    }`}
                                >
                                  <option value="active">Active</option>
                                  <option value="on_leave">On Leave</option>
                                  <option value="inactive">Inactive</option>
                                </select>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-gray-800 font-medium">{driver.active_routes || 0}</span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => { setEditingDriver({ ...driver }); setShowEditDriverModal(true); }}
                                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200 transition"
                                    title="Edit driver"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteDriver(driver.id)}
                                    className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition"
                                    title="Delete driver"
                                  >
                                    Delete
                                  </button>
                                  <button
                                    onClick={() => {
                                      setViewingActivityFor(driver.id);
                                      setViewingDriverName(driver.name);
                                    }}
                                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium hover:bg-purple-200 transition"
                                    title="View driver activity"
                                  >
                                    📋 Activity
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                          </table>
                        </div>
                      )}
                    </div>
    
                    {viewingActivityFor && (
                      <DriverActivityLog
                        driverId={viewingActivityFor}
                        driverName={viewingDriverName}
                        onClose={() => {
                          setViewingActivityFor(null);
                          setViewingDriverName('');
                        }}
                      />
                    )}
                  </div>
                )}
                {activeTab === 'bookings' && (
                  <div className="space-y-6">
                    {/* Bookings Header */}
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-lg p-6 text-white">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">🎫</span>
                          <div>
                            <h2 className="text-2xl font-bold">Booking Management</h2>
                            <p className="text-purple-100">Track and manage all customer bookings</p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <select
                            value={bookingStatusFilter}
                            onChange={(e) => setBookingStatusFilter(e.target.value)}
                            className="bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white placeholder-white/70"
                          >
                            <option value="" className="text-gray-800">All Status</option>
                            <option value="confirmed" className="text-gray-800">Confirmed</option>
                            <option value="pending" className="text-gray-800">Pending</option>
                            <option value="cancelled" className="text-gray-800">Cancelled</option>
                            <option value="completed" className="text-gray-800">Completed</option>
                          </select>
                          <input
                            type="date"
                            value={bookingDateFilter}
                            onChange={(e) => setBookingDateFilter(e.target.value)}
                            className="bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white"
                          />
                          <button
                            onClick={loadAllBookings}
                            className="bg-white/20 hover:bg-white/30 border border-white/30 rounded-lg px-4 py-2 flex items-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Refresh
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Booking Statistics */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <span className="text-blue-600 text-xl">📊</span>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Total Bookings</p>
                            <p className="text-xl font-bold text-gray-800">{allBookings.length}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <span className="text-green-600 text-xl">✅</span>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Confirmed</p>
                            <p className="text-xl font-bold text-green-600">{allBookings.filter((b: any) => b.status === 'confirmed').length}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <span className="text-yellow-600 text-xl">⏳</span>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Pending</p>
                            <p className="text-xl font-bold text-yellow-600">{allBookings.filter((b: any) => b.status === 'pending').length}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <span className="text-purple-600 text-xl">🏁</span>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Completed</p>
                            <p className="text-xl font-bold text-purple-600">{allBookings.filter((b: any) => b.status === 'completed').length}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <span className="text-red-600 text-xl">❌</span>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Cancelled</p>
                            <p className="text-xl font-bold text-red-600">{allBookings.filter((b: any) => b.status === 'cancelled').length}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bookings Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="text-left py-3 px-4 font-medium text-gray-600">Reference</th>
                              <th className="text-left py-3 px-4 font-medium text-gray-600">Customer</th>
                              <th className="text-left py-3 px-4 font-medium text-gray-600">Route</th>
                              <th className="text-left py-3 px-4 font-medium text-gray-600">Date & Time</th>
                              <th className="text-center py-3 px-4 font-medium text-gray-600">Seats</th>
                              <th className="text-right py-3 px-4 font-medium text-gray-600">Amount</th>
                              <th className="text-center py-3 px-4 font-medium text-gray-600">Payment</th>
                              <th className="text-center py-3 px-4 font-medium text-gray-600">Status</th>
                              <th className="text-center py-3 px-4 font-medium text-gray-600">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {allBookings.length === 0 ? (
                              <tr>
                                <td colSpan={9} className="py-12 text-center text-gray-500">
                                  <div className="flex flex-col items-center">
                                    <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    <p>No bookings found</p>
                                    <p className="text-sm text-gray-400">Bookings will appear here when customers make reservations</p>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              allBookings.map((booking: any) => (
                                <tr key={booking.id} className="hover:bg-gray-50">
                                  <td className="py-3 px-4">
                                    <span className="font-mono text-sm font-medium text-purple-600">{booking.booking_reference}</span>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div>
                                      <p className="font-medium text-gray-800">{booking.customer_name}</p>
                                      <p className="text-sm text-gray-500">{booking.customer_phone}</p>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div>
                                      <p className="font-medium text-gray-800">{booking.origin} → {booking.destination}</p>
                                      <p className="text-sm text-gray-500">{booking.bus_name}</p>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4">
                                    <div>
                                      <p className="font-medium text-gray-800">{new Date(booking.date).toLocaleDateString()}</p>
                                      <p className="text-sm text-gray-500">{booking.departure_time}</p>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-full font-medium">
                                      {booking.num_seats || booking.seat_numbers?.split(',').length || 1}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <span className="font-bold text-gray-800">K{booking.total_price?.toLocaleString()}</span>
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${booking.payment_status === 'paid'
                                      ? 'bg-green-100 text-green-700'
                                      : booking.payment_status === 'partial'
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : 'bg-gray-100 text-gray-700'
                                      }`}>
                                      {booking.payment_status || 'pending'}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${booking.status === 'confirmed'
                                      ? 'bg-green-100 text-green-700'
                                      : booking.status === 'completed'
                                        ? 'bg-purple-100 text-purple-700'
                                        : booking.status === 'cancelled'
                                          ? 'bg-red-100 text-red-700'
                                          : 'bg-yellow-100 text-yellow-700'
                                      }`}>
                                      {booking.status}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        onClick={() => setViewingBooking(booking)}
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                                        title="View Details"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                      </button>
                                      {booking.status === 'confirmed' && (
                                        <button
                                          onClick={() => updateBookingStatus(booking.id, 'completed')}
                                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                                          title="Mark Completed"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                          </svg>
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Refunds Section */}
                {activeTab === 'refunds' && (
                  <div className="space-y-6">
                    {/* Refunds Header */}
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-lg p-6 text-white">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl">💸</span>
                        <h2 className="text-2xl font-bold">Refund Management</h2>
                      </div>
                      <p className="text-purple-100">Review, approve, and manage customer refund requests</p>
                    </div>

                    {/* Refund Statistics Cards */}
                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">📊</span>
                          <div>
                            <p className="text-blue-100 text-sm">Total Refunds</p>
                            <p className="text-2xl font-bold">{refundStats.total_refunds || 0}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-4 text-white">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">⏳</span>
                          <div>
                            <p className="text-yellow-100 text-sm">Pending</p>
                            <p className="text-2xl font-bold">{refundStats.pending_refunds || 0}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">✅</span>
                          <div>
                            <p className="text-green-100 text-sm">Processed</p>
                            <p className="text-2xl font-bold">{refundStats.processed_refunds || 0}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-4 text-white">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">❌</span>
                          <div>
                            <p className="text-red-100 text-sm">Rejected</p>
                            <p className="text-2xl font-bold">{refundStats.rejected_refunds || 0}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Refund Amounts Summary */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <span className="text-yellow-600 text-xl">💰</span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800">Pending Amount</h3>
                            <p className="text-sm text-gray-600">Total pending refunds</p>
                          </div>
                        </div>
                        <p className="text-3xl font-bold text-yellow-600">K{refundStats.pending_amount || 0}</p>
                      </div>
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <span className="text-green-600 text-xl">✅</span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800">Processed Amount</h3>
                            <p className="text-sm text-gray-600">Total refunds processed</p>
                          </div>
                        </div>
                        <p className="text-3xl font-bold text-green-600">K{refundStats.processed_amount || 0}</p>
                      </div>
                    </div>

                    {/* Refund Filters */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
                          <select
                            value={refundStatusFilter}
                            onChange={(e) => setRefundStatusFilter(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="processed">Processed</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>
                        <div className="flex items-end">
                          <button
                            onClick={() => setRefundStatusFilter('')}
                            className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                          >
                            Clear Filter
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Refunds List */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                      <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">📋</span>
                          <h3 className="text-lg font-semibold text-gray-800">Refund Requests</h3>
                          <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-sm font-medium">
                            {refunds.length} Total
                          </span>
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-4 text-left text-gray-600 font-medium">Booking ID</th>
                              <th className="px-6 py-4 text-left text-gray-600 font-medium">Customer</th>
                              <th className="px-6 py-4 text-left text-gray-600 font-medium">Route</th>
                              <th className="px-6 py-4 text-left text-gray-600 font-medium">Refund Amount</th>
                              <th className="px-6 py-4 text-left text-gray-600 font-medium">Status</th>
                              <th className="px-6 py-4 text-left text-gray-600 font-medium">Request Date</th>
                              <th className="px-6 py-4 text-left text-gray-600 font-medium">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {refunds.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                  <div className="flex flex-col items-center gap-3">
                                    <span className="text-4xl">💸</span>
                                    <p className="text-lg font-medium">No refund requests</p>
                                    <p className="text-sm">All refund requests will appear here</p>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              refunds.map((refund) => (
                                <tr key={refund.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 font-medium text-blue-600">#{refund.id}</td>
                                  <td className="px-6 py-4">
                                    <div>
                                      <p className="font-medium text-gray-800">{refund.customer_name}</p>
                                      <p className="text-sm text-gray-600">{refund.customer_phone}</p>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div>
                                      <p className="font-medium text-gray-800">{refund.origin} → {refund.destination}</p>
                                      <p className="text-sm text-gray-600">{new Date(refund.departure_time?.split('T')[0] || refund.created_at).toLocaleDateString('en-GB')}</p>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div>
                                      <p className="text-lg font-bold text-green-600">K{refund.refund_amount || 0}</p>
                                      {refund.cancellation_fee > 0 && (
                                        <p className="text-sm text-red-600">Fee: K{refund.cancellation_fee}</p>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${refund.refund_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                      refund.refund_status === 'processed' ? 'bg-green-100 text-green-700' :
                                        refund.refund_status === 'rejected' ? 'bg-red-100 text-red-700' :
                                          'bg-gray-100 text-gray-700'
                                      }`}>
                                      {refund.refund_status || 'pending'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-gray-600">
                                    {new Date(refund.refund_requested_at || refund.created_at).toLocaleDateString('en-GB')}
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex gap-2">
                                      {refund.refund_status === 'pending' && (
                                        <>
                                          <button
                                            onClick={() => handleRefundAction(refund.id, 'approve')}
                                            disabled={processingRefund === refund.id}
                                            className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 disabled:opacity-50 transition"
                                          >
                                            {processingRefund === refund.id ? (
                                              <span className="flex items-center gap-1">
                                                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Processing...
                                              </span>
                                            ) : (
                                              '✅ Approve'
                                            )}
                                          </button>
                                          <button
                                            onClick={() => {
                                              const reason = prompt('Please enter rejection reason (optional):');
                                              handleRefundAction(refund.id, 'reject', reason || undefined);
                                            }}
                                            disabled={processingRefund === refund.id}
                                            className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 disabled:opacity-50 transition"
                                          >
                                            ❌ Reject
                                          </button>
                                        </>
                                      )}
                                      <button
                                        onClick={() => setViewingRefund(refund)}
                                        className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition"
                                      >
                                        👁️ View
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'tracking' && (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">📍</span>
                        <div>
                          <h2 className="text-2xl font-bold">Live Tracking</h2>
                          <p className="text-cyan-100">Monitor active trips, device status, and location history in real time</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <Link href="/customer/track" className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition block">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">Active Trips</h3>
                            <p className="text-gray-600">Open the live map to track buses currently in transit.</p>
                          </div>
                          <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center text-2xl">🛰️</div>
                        </div>
                        <div className="mt-4 text-cyan-700 font-medium group-hover:underline">Open Live Tracking →</div>
                      </Link>

                      <Link href="/api/tracking/devices" className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition block">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">GPS Devices</h3>
                            <p className="text-gray-600">View registered trackers, provider details, and latest heartbeat.</p>
                          </div>
                          <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-2xl">📡</div>
                        </div>
                        <div className="mt-4 text-indigo-700 font-medium group-hover:underline">View Device Feed →</div>
                      </Link>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Register GPS Device</h3>
                        <button
                          onClick={loadTrackingDevices}
                          className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                        >
                          Refresh Devices
                        </button>
                      </div>

                      {trackingMessage && (
                        <div className={`mb-4 p-3 rounded-lg ${trackingMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                          {trackingMessage.text}
                        </div>
                      )}

                      <form onSubmit={handleRegisterTrackingDevice} className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Bus *</label>
                          <select
                            value={newTrackingDevice.bus_id}
                            onChange={(e) => setNewTrackingDevice({ ...newTrackingDevice, bus_id: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                            required
                          >
                            <option value="">Select bus</option>
                            {buses.map((bus) => (
                              <option key={bus.id} value={bus.id}>
                                {bus.bus_name} ({bus.bus_number})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Provider *</label>
                          <select
                            value={newTrackingDevice.provider}
                            onChange={(e) => setNewTrackingDevice({ ...newTrackingDevice, provider: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                            required
                          >
                            <option value="ctrack">Ctrack</option>
                            <option value="tramigo">Tramigo</option>
                            <option value="ruptela">Ruptela</option>
                            <option value="teltonika">Teltonika</option>
                            <option value="driver_app">Driver App</option>
                            <option value="custom_api">Custom API</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Device IMEI *</label>
                          <input
                            type="text"
                            value={newTrackingDevice.device_imei}
                            onChange={(e) => setNewTrackingDevice({ ...newTrackingDevice, device_imei: e.target.value })}
                            placeholder="e.g. 357000000001"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Device Serial</label>
                          <input
                            type="text"
                            value={newTrackingDevice.device_serial}
                            onChange={(e) => setNewTrackingDevice({ ...newTrackingDevice, device_serial: e.target.value })}
                            placeholder="e.g. CTRACK-0001"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Provider Device ID</label>
                          <input
                            type="text"
                            value={newTrackingDevice.provider_device_id}
                            onChange={(e) => setNewTrackingDevice({ ...newTrackingDevice, provider_device_id: e.target.value })}
                            placeholder="e.g. ct-1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">SIM Number</label>
                          <input
                            type="text"
                            value={newTrackingDevice.sim_number}
                            onChange={(e) => setNewTrackingDevice({ ...newTrackingDevice, sim_number: e.target.value })}
                            placeholder="e.g. +26097xxxxxxx"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">SIM Provider</label>
                          <input
                            type="text"
                            value={newTrackingDevice.sim_provider}
                            onChange={(e) => setNewTrackingDevice({ ...newTrackingDevice, sim_provider: e.target.value })}
                            placeholder="airtel / mtn / zamtel"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <button
                            type="submit"
                            disabled={registeringDevice}
                            className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-60 transition"
                          >
                            {registeringDevice ? 'Registering...' : 'Register Device'}
                          </button>
                        </div>
                      </form>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Registered Devices</h3>
                      {loadingTrackingDevices ? (
                        <p className="text-gray-600">Loading devices...</p>
                      ) : trackingDevices.length === 0 ? (
                        <p className="text-gray-600">No devices registered yet.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-gray-500 border-b">
                                <th className="py-2 pr-4">Bus</th>
                                <th className="py-2 pr-4">Provider</th>
                                <th className="py-2 pr-4">IMEI</th>
                                <th className="py-2 pr-4">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {trackingDevices.map((device) => (
                                <tr key={device.id} className="border-b border-gray-100">
                                  <td className="py-2 pr-4 text-gray-800">{device.bus_name} ({device.bus_number})</td>
                                  <td className="py-2 pr-4 text-gray-700">{device.provider}</td>
                                  <td className="py-2 pr-4 text-gray-700">{device.device_imei}</td>
                                  <td className="py-2 pr-4">
                                    <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">{device.status}</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">How To Use</h3>
                      <div className="space-y-2 text-gray-700">
                        <p>1. Start a trip from the driver app or tracking API endpoint.</p>
                        <p>2. Submit GPS locations to update current position and ETA.</p>
                        <p>3. Use Active Trips to monitor movement and history.</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'analytics' && (
                  <div className="space-y-6">
                    {/* Analytics Header */}
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-lg p-6 text-white">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">📊</span>
                        <div>
                          <h2 className="text-2xl font-bold">Business Analytics</h2>
                          <p className="text-orange-100">Insights into revenue, performance, and customer patterns</p>
                        </div>
                      </div>
                    </div>

                    {/* Revenue Overview */}
                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-5 text-white">
                        <p className="text-green-100 text-sm">Total Revenue</p>
                        <p className="text-3xl font-bold mt-1">K{dashboardStats.totalRevenue?.toLocaleString()}</p>
                        <p className="text-green-100 text-xs mt-2">All time earnings</p>
                      </div>
                      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
                        <p className="text-blue-100 text-sm">This Month</p>
                        <p className="text-3xl font-bold mt-1">K{dashboardStats.thisMonthRevenue?.toLocaleString()}</p>
                        <p className="text-blue-100 text-xs mt-2">Monthly revenue</p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
                        <p className="text-purple-100 text-sm">Total Passengers</p>
                        <p className="text-3xl font-bold mt-1">{dashboardStats.totalPassengers?.toLocaleString()}</p>
                        <p className="text-purple-100 text-xs mt-2">All time travelers</p>
                      </div>
                      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white">
                        <p className="text-orange-100 text-sm">Avg. Occupancy</p>
                        <p className="text-3xl font-bold mt-1">{dashboardStats.averageOccupancy}%</p>
                        <p className="text-orange-100 text-xs mt-2">Seat utilization</p>
                      </div>
                    </div>

                    {/* Performance Metrics */}
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Booking Statistics */}
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                          <span>🎫</span> Booking Statistics
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <span className="text-blue-600">📋</span>
                              </div>
                              <span className="text-gray-700">Total Bookings</span>
                            </div>
                            <span className="text-2xl font-bold text-gray-800">{dashboardStats.totalBookings}</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <span className="text-green-600">📅</span>
                              </div>
                              <span className="text-gray-700">Today's Bookings</span>
                            </div>
                            <span className="text-2xl font-bold text-green-600">{dashboardStats.todayBookings}</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                <span className="text-red-600">❌</span>
                              </div>
                              <span className="text-gray-700">Cancellations</span>
                            </div>
                            <span className="text-2xl font-bold text-red-600">{dashboardStats.cancelledBookings}</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <span className="text-yellow-600">💸</span>
                              </div>
                              <span className="text-gray-700">Pending Refunds</span>
                            </div>
                            <span className="text-2xl font-bold text-yellow-600">{dashboardStats.pendingRefunds}</span>
                          </div>
                        </div>
                      </div>

                      {/* Fleet Performance */}
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                          <span>🚌</span> Fleet Performance
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <span className="text-blue-600">🚌</span>
                              </div>
                              <span className="text-gray-700">Total Buses</span>
                            </div>
                            <span className="text-2xl font-bold text-gray-800">{dashboardStats.totalBuses}</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <span className="text-green-600">✅</span>
                              </div>
                              <span className="text-gray-700">Active Buses</span>
                            </div>
                            <span className="text-2xl font-bold text-green-600">{dashboardStats.activeBuses}</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                <span className="text-purple-600">🛣️</span>
                              </div>
                              <span className="text-gray-700">Total Routes</span>
                            </div>
                            <span className="text-2xl font-bold text-gray-800">{dashboardStats.totalRoutes}</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                                <span className="text-teal-600">🟢</span>
                              </div>
                              <span className="text-gray-700">Active Routes</span>
                            </div>
                            <span className="text-2xl font-bold text-teal-600">{dashboardStats.activeRoutes}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Top Performing Routes */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <span>🏆</span> Top Performing Routes
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="text-left py-3 px-4 font-medium text-gray-600">Route</th>
                              <th className="text-left py-3 px-4 font-medium text-gray-600">Bus</th>
                              <th className="text-center py-3 px-4 font-medium text-gray-600">Bookings</th>
                              <th className="text-right py-3 px-4 font-medium text-gray-600">Revenue</th>
                              <th className="text-center py-3 px-4 font-medium text-gray-600">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {routes
                              .sort((a, b) => (b.revenue || 0) - (a.revenue || 0))
                              .slice(0, 5)
                              .map((route) => (
                                <tr key={route.id} className="hover:bg-gray-50">
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-2">
                                      <span className="text-lg">🛣️</span>
                                      <span className="font-medium text-gray-800">{route.origin} → {route.destination}</span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-gray-600">{route.bus_name}</td>
                                  <td className="py-3 px-4 text-center">
                                    <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-full font-medium">
                                      {route.bookings_count || 0}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-right font-bold text-green-600">
                                    K{(route.revenue || 0).toLocaleString()}
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${route.status === 'active' || route.status === 'scheduled'
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-gray-100 text-gray-700'
                                      }`}>
                                      {route.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            {routes.length === 0 && (
                              <tr>
                                <td colSpan={5} className="py-8 text-center text-gray-500">
                                  No routes data available
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Revenue Breakdown */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <span>💰</span> Revenue Breakdown
                      </h3>
                      <div className="grid md:grid-cols-3 gap-6">
                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                              <span className="text-white text-xl">💵</span>
                            </div>
                            <div>
                              <p className="text-sm text-green-600">Gross Revenue</p>
                              <p className="text-2xl font-bold text-green-700">K{earnings.gross?.toLocaleString() || dashboardStats.totalRevenue?.toLocaleString()}</p>
                            </div>
                          </div>
                          <p className="text-xs text-green-600">Total from all bookings</p>
                        </div>
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-5 border border-orange-200">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                              <span className="text-white text-xl">📊</span>
                            </div>
                            <div>
                              <p className="text-sm text-orange-600">Platform Commission ({earnings.rate || 7.5}%)</p>
                              <p className="text-2xl font-bold text-orange-700">K{earnings.commission?.toLocaleString() || Math.round((dashboardStats.totalRevenue || 0) * 0.075).toLocaleString()}</p>
                            </div>
                          </div>
                          <p className="text-xs text-orange-600">City-to-City service fee</p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                              <span className="text-white text-xl">🏦</span>
                            </div>
                            <div>
                              <p className="text-sm text-blue-600">Net Earnings</p>
                              <p className="text-2xl font-bold text-blue-700">K{earnings.net?.toLocaleString() || Math.round((dashboardStats.totalRevenue || 0) * 0.925).toLocaleString()}</p>
                            </div>
                          </div>
                          <p className="text-xs text-blue-600">Your actual earnings</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'subscriptions' && (
                  <div className="space-y-6">
                    {/* Subscription Management Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl">💳</span>
                        <h2 className="text-2xl font-bold">Subscription Management</h2>
                      </div>
                      <p className="text-blue-100">Manage bus subscriptions, track payments, and maintain active routes</p>
                    </div>

                    {/* Subscription Summary Cards */}
                    <div className="grid md:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                        <p className="text-blue-100 text-sm">Total Buses</p>
                        <p className="text-2xl font-bold">{subscriptionInfo.summary?.totalBuses || buses.length}</p>
                      </div>
                      <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
                        <p className="text-green-100 text-sm">Active</p>
                        <p className="text-2xl font-bold">{subscriptionInfo.summary?.activeBuses || 0}</p>
                      </div>
                      <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-4 text-white">
                        <p className="text-amber-100 text-sm">On Trial</p>
                        <p className="text-2xl font-bold">
                          {(subscriptionInfo.buses || []).filter((b: any) => b.current_status === 'trial').length}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-4 text-white">
                        <p className="text-red-100 text-sm">Expired</p>
                        <p className="text-2xl font-bold">{subscriptionInfo.summary?.expiredBuses || 0}</p>
                      </div>
                    </div>

                    {/* Pricing Information */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl">💰</span>
                        <h3 className="font-semibold text-blue-800 text-lg">Subscription Pricing</h3>
                      </div>
                      <p className="text-blue-700">
                        <strong className="text-2xl">K{subscriptionInfo.settings?.pricePerBus || 500}</strong> per bus per month
                      </p>
                      <p className="text-sm text-blue-600 mt-1">
                        New buses get a {subscriptionInfo.settings?.trialDays || 14}-day free trial period.
                      </p>
                    </div>

                    {/* Payment Due Alert */}
                    {subscriptionInfo.summary?.monthlyDue > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-semibold text-red-800 text-lg">⚠️ Payment Due</h3>
                            <p className="text-sm text-red-600">
                              {subscriptionInfo.summary.expiredBuses} expired bus(es) need subscription renewal
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-3xl font-bold text-red-700">K{subscriptionInfo.summary.monthlyDue.toLocaleString()}</p>
                            <p className="text-xs text-red-500">per month</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Bus Subscription List */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                      <div className="p-6 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800">Bus Subscriptions</h3>
                      </div>
                      <div className="p-6 space-y-4">
                        {(subscriptionInfo.buses || buses).map((bus: any) => {
                          const status = bus.current_status || 'trial';
                          const daysRemaining = bus.days_remaining ? Math.ceil(bus.days_remaining) : 0;
                          const expiresAt = bus.expires_at ? new Date(bus.expires_at).toLocaleDateString('en-GB') : 'N/A';
                          const isExpired = status === 'expired' || status === 'suspended';

                          return (
                            <div key={bus.id} className={`border rounded-xl p-4 transition-colors ${isExpired ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
                              }`}>
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-semibold text-gray-800">{bus.bus_name}</h4>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${status === 'active' ? 'bg-green-100 text-green-700' :
                                      status === 'trial' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-red-100 text-red-700'
                                      }`}>
                                      {status === 'trial' ? 'Trial' :
                                        status === 'active' ? 'Active' :
                                          'Expired'}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-500 mt-1">{bus.bus_number}</p>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {isExpired ? '⚠️ Routes hidden from customers' :
                                      status === 'trial' ? `📅 Trial ends: ${expiresAt} (${daysRemaining} days)` :
                                        `✅ Active until: ${expiresAt} (${daysRemaining} days)`}
                                  </p>
                                </div>
                                <button
                                  onClick={() => {
                                    setSelectedBusForPayment(bus);
                                    setShowPayModal(true);
                                  }}
                                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isExpired ? 'bg-red-600 text-white hover:bg-red-700' :
                                    status === 'trial' ? 'bg-amber-500 text-white hover:bg-amber-600' :
                                      'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                  {isExpired ? '🔄 Renew Now' :
                                    status === 'trial' ? '🚀 Subscribe' :
                                      '➕ Extend'}
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {(subscriptionInfo.buses || buses).length === 0 && (
                          <div className="text-center py-12">
                            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h8m-8 4h8m-4 4v3m-6-3h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7a2 2 0 002 2zm0 0v3a1 1 0 001 1h2m8-4v3a1 1 0 01-1 1h-2" />
                            </svg>
                            <p className="text-gray-600">No buses found. Add buses to manage subscriptions.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Payment History */}
                    {subscriptionInfo.payments && subscriptionInfo.payments.length > 0 && (
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="p-6 border-b border-gray-200">
                          <h3 className="text-lg font-semibold text-gray-800">Payment History</h3>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-4 text-left text-gray-600 font-medium">Date</th>
                                <th className="px-6 py-4 text-left text-gray-600 font-medium">Bus</th>
                                <th className="px-6 py-4 text-left text-gray-600 font-medium">Amount</th>
                                <th className="px-6 py-4 text-left text-gray-600 font-medium">Period</th>
                                <th className="px-6 py-4 text-left text-gray-600 font-medium">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {subscriptionInfo.payments.map((payment: any) => (
                                <tr key={payment.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4">{new Date(payment.paid_at || payment.created_at).toLocaleDateString('en-GB')}</td>
                                  <td className="px-6 py-4 font-medium">{payment.bus_name}</td>
                                  <td className="px-6 py-4 font-semibold text-green-600">K{payment.amount}</td>
                                  <td className="px-6 py-4 text-gray-600">{payment.period_start} - {payment.period_end}</td>
                                  <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${payment.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                      }`}>
                                      {payment.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Company Profile Tab */}
                {activeTab === 'profile' && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">🏢 Company Profile</h2>

                    {profileLoading ? (
                      <div className="text-center py-12">
                        <svg className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-gray-600">Loading company profile...</p>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        {/* Status Message */}
                        {profileMessage && (
                          <div className={`p-4 rounded-lg ${profileMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                            {profileMessage.text}
                          </div>
                        )}

                        {/* Company Logo */}
                        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="text-xl">🖼️</span> Company Logo
                          </h3>
                          <div className="flex items-center gap-6">
                            {/* Logo Preview */}
                            <div className="flex-shrink-0">
                              {logoUrl ? (
                                <div className="relative group">
                                  <img
                                    src={logoUrl}
                                    alt="Company Logo"
                                    className="w-24 h-24 object-cover rounded-lg border-2 border-white shadow-md"
                                  />
                                  <button
                                    onClick={handleLogoDelete}
                                    disabled={uploadingLogo}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                    title="Remove logo"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              ) : (
                                <div className="w-24 h-24 bg-gray-200 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              )}
                            </div>

                            {/* Upload Controls */}
                            <div className="flex-1">
                              <p className="text-sm text-gray-600 mb-3">
                                Upload your company logo to be displayed on search results and bookings.
                                <br />
                                <span className="text-gray-500">Supported: JPG, PNG, WebP, GIF (max 2MB)</span>
                              </p>
                              <label className={`inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors ${uploadingLogo ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                {uploadingLogo ? (
                                  <>
                                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Uploading...</span>
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                    <span>{logoUrl ? 'Change Logo' : 'Upload Logo'}</span>
                                  </>
                                )}
                                <input
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp,image/gif"
                                  onChange={handleLogoUpload}
                                  disabled={uploadingLogo}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Account Info */}
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <h3 className="font-semibold text-gray-800 mb-2">Account Information</h3>
                          <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Email:</span>
                              <span className="ml-2 font-medium">{companyProfile?.email}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Account Type:</span>
                              <span className="ml-2 font-medium capitalize">{companyProfile?.user_type}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Status:</span>
                              <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${companyProfile?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {companyProfile?.status?.toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Member Since:</span>
                              <span className="ml-2 font-medium">{companyProfile?.created_at ? new Date(companyProfile.created_at).toLocaleDateString() : 'N/A'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Contact Person Information */}
                        <div>
                          <h3 className="font-semibold text-gray-800 mb-4">Contact Person</h3>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name *</label>
                              <input
                                type="text"
                                value={companyProfileForm.name}
                                onChange={(e) => setCompanyProfileForm({ ...companyProfileForm, name: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                              <input
                                type="tel"
                                value={companyProfileForm.phone}
                                onChange={(e) => setCompanyProfileForm({ ...companyProfileForm, phone: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="+260 XX XXX XXXX"
                                required
                              />
                            </div>
                          </div>
                        </div>

                        {/* Company Information */}
                        <div>
                          <h3 className="font-semibold text-gray-800 mb-4">Company Details</h3>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                              <input
                                type="text"
                                value={companyProfileForm.company_name}
                                onChange={(e) => setCompanyProfileForm({ ...companyProfileForm, company_name: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">RTSA License Number</label>
                              <input
                                type="text"
                                value={companyProfileForm.license_number}
                                onChange={(e) => setCompanyProfileForm({ ...companyProfileForm, license_number: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="RTSA License"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">PACRA Registration Number</label>
                              <input
                                type="text"
                                value={companyProfileForm.company_registration_number}
                                onChange={(e) => setCompanyProfileForm({ ...companyProfileForm, company_registration_number: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="PACRA Registration"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Company Address</label>
                              <input
                                type="text"
                                value={companyProfileForm.company_address}
                                onChange={(e) => setCompanyProfileForm({ ...companyProfileForm, company_address: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Company physical address"
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
                                value={companyProfileForm.current_password}
                                onChange={(e) => setCompanyProfileForm({ ...companyProfileForm, current_password: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                              <input
                                type="password"
                                value={companyProfileForm.new_password}
                                onChange={(e) => setCompanyProfileForm({ ...companyProfileForm, new_password: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                              <input
                                type="password"
                                value={companyProfileForm.confirm_password}
                                onChange={(e) => setCompanyProfileForm({ ...companyProfileForm, confirm_password: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end pt-4 border-t">
                          <button
                            onClick={handleCompanyProfileSave}
                            disabled={profileSaving}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                {/* Operator/Company Review Tab */}
                {activeTab === 'reviews' && (
                  <div className="space-y-8">
                    {/* Header banner */}
                    <div className="bg-gradient-to-r from-amber-500 to-yellow-600 rounded-xl shadow-lg p-6 md:p-8 text-white">
                      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
                        <div className="text-5xl md:text-6xl">⭐</div>
                        <div>
                          <h2 className="text-2xl md:text-3xl font-bold mb-2">Customer Reviews</h2>
                          <p className="text-amber-100 text-base md:text-lg">
                            See what passengers say about your service – average rating, recent feedback & trends
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* The actual reviews component – full width */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <CompanyReviews companyId={user?.id} />
                    </div>

                    {/* Optional: quick tips or call-to-action */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
                      <p className="text-amber-800 mb-3">
                        Want to improve your rating? Respond to reviews and maintain high service quality!
                      </p>
                      <button className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition">
                        View Response Guidelines →
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

        {/* Add Bus Modal */}
        {showAddBusModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-800">🚌 Add New Bus</h3>
                  <button onClick={() => setShowAddBusModal(false)} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bus Name *</label>
                  <input
                    type="text"
                    value={newBus.bus_name}
                    onChange={(e) => setNewBus({ ...newBus, bus_name: e.target.value })}
                    placeholder="e.g., Express Liner 1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bus Number *</label>
                  <input
                    type="text"
                    value={newBus.bus_number}
                    onChange={(e) => setNewBus({ ...newBus, bus_number: e.target.value })}
                    placeholder="e.g., ABC 1234"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total Seats</label>
                  <input
                    type="number"
                    value={newBus.total_seats}
                    onChange={(e) => setNewBus({ ...newBus, total_seats: parseInt(e.target.value) })}
                    placeholder="50"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
                  <div className="grid grid-cols-2 gap-2 p-3 border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
                    {BUS_AMENITIES.map((amenity) => (
                      <label key={amenity.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={newBus.amenities.includes(amenity.name)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewBus({ ...newBus, amenities: [...newBus.amenities, amenity.name] });
                            } else {
                              setNewBus({ ...newBus, amenities: newBus.amenities.filter(a => a !== amenity.name) });
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm">{amenity.icon} {amenity.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex gap-3">
                <button
                  onClick={() => setShowAddBusModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddBus}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Add Bus
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Bus Modal */}
        {showEditBusModal && editingBus && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-800">✏️ Edit Bus</h3>
                  <button onClick={() => { setShowEditBusModal(false); setEditingBus(null); }} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bus Name *</label>
                  <input
                    type="text"
                    value={editingBus.bus_name}
                    onChange={(e) => setEditingBus({ ...editingBus, bus_name: e.target.value })}
                    placeholder="e.g., Express Liner 1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bus Number</label>
                  <input
                    type="text"
                    value={editingBus.bus_number}
                    disabled
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Bus number cannot be changed</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total Seats</label>
                  <input
                    type="number"
                    value={editingBus.total_seats}
                    onChange={(e) => setEditingBus({ ...editingBus, total_seats: parseInt(e.target.value) })}
                    placeholder="50"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bus Type</label>
                  <select
                    value={editingBus.bus_type || 'Standard Coach'}
                    onChange={(e) => setEditingBus({ ...editingBus, bus_type: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Standard Coach">Standard Coach</option>
                    <option value="Luxury Coach">Luxury Coach</option>
                    <option value="Semi-Luxury">Semi-Luxury</option>
                    <option value="Executive">Executive</option>
                    <option value="Mini Bus">Mini Bus</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
                  <div className="grid grid-cols-2 gap-2 p-3 border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
                    {BUS_AMENITIES.map((amenity) => {
                      const currentAmenities = (editingBus.amenities || '').split(',').map((a: string) => a.trim()).filter(Boolean);
                      return (
                        <label key={amenity.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                          <input
                            type="checkbox"
                            checked={currentAmenities.includes(amenity.name)}
                            onChange={(e) => {
                              let newAmenities: string[];
                              if (e.target.checked) {
                                newAmenities = [...currentAmenities, amenity.name];
                              } else {
                                newAmenities = currentAmenities.filter((a: string) => a !== amenity.name);
                              }
                              setEditingBus({ ...editingBus, amenities: newAmenities.join(', ') });
                            }}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm">{amenity.icon} {amenity.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={editingBus.status}
                    onChange={(e) => setEditingBus({ ...editingBus, status: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex gap-3">
                <button
                  onClick={() => { setShowEditBusModal(false); setEditingBus(null); }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditBus}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bus Images Modal */}
        {showBusImagesModal && selectedBusForImages && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">📷 Bus Photo Gallery</h3>
                    <p className="text-sm text-gray-500 mt-1">{selectedBusForImages.bus_name} ({selectedBusForImages.bus_number})</p>
                  </div>
                  <button onClick={() => { setShowBusImagesModal(false); setSelectedBusForImages(null); setBusImages([]); }} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-6">
                {/* Upload Section */}
                <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-100">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-800">Upload Bus Photos</h4>
                      <p className="text-sm text-gray-500">Interior, exterior, seating - show off your bus! ({busImages.length}/5 images)</p>
                    </div>
                    <label className={`inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg cursor-pointer hover:bg-purple-700 transition-colors ${uploadingBusImages || busImages.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      {uploadingBusImages ? (
                        <>
                          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          <span>Add Photos</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        multiple
                        onChange={handleBusImageUpload}
                        disabled={uploadingBusImages || busImages.length >= 5}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">Supported: JPG, PNG, WebP, GIF (max 2MB each)</p>
                </div>

                {/* Images Grid */}
                {loadingBusImages ? (
                  <div className="text-center py-12">
                    <svg className="w-10 h-10 text-purple-500 animate-spin mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-gray-500">Loading images...</p>
                  </div>
                ) : busImages.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-500 font-medium">No photos yet</p>
                    <p className="text-sm text-gray-400 mt-1">Upload photos to showcase this bus to passengers</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {busImages.map((image, index) => (
                      <div key={image.id} className="relative group rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                        <img
                          src={image.image_url}
                          alt={image.caption || `Bus image ${index + 1}`}
                          className="w-full h-40 object-cover cursor-pointer hover:opacity-90 transition"
                          onClick={() => {
                            setLightboxIndex(index);
                            setLightboxOpen(true);
                          }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                          <button
                            onClick={() => handleBusImageDelete(image.id)}
                            className="opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-all transform scale-90 hover:scale-100"
                            title="Delete image"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        {image.image_type && (
                          <span className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded capitalize">
                            {image.image_type}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-6 border-t border-gray-200">
                <button
                  onClick={() => { setShowBusImagesModal(false); setSelectedBusForImages(null); setBusImages([]); }}
                  className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Image Lightbox */}
        {lightboxOpen && busImages.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-90 z-[60] flex items-center justify-center">
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition p-2"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Navigation */}
            {busImages.length > 1 && (
              <>
                <button
                  onClick={() => setLightboxIndex(prev => (prev - 1 + busImages.length) % busImages.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition p-2 bg-black bg-opacity-50 rounded-full"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => setLightboxIndex(prev => (prev + 1) % busImages.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition p-2 bg-black bg-opacity-50 rounded-full"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Image */}
            <img
              src={busImages[lightboxIndex]?.image_url}
              alt={busImages[lightboxIndex]?.caption || 'Bus image'}
              className="max-w-[90vw] max-h-[85vh] object-contain"
            />

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black bg-opacity-50 px-4 py-2 rounded-full">
              {lightboxIndex + 1} / {busImages.length}
            </div>
          </div>
        )}

        {/* Add Route Modal */}
        {showAddRouteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-[9999] p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-t-2xl sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-800">🗺️ Create New Route</h3>
                  <button onClick={() => setShowAddRouteModal(false)} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Bus *</label>
                  <select
                    value={newRoute.bus_id}
                    onChange={(e) => setNewRoute({ ...newRoute, bus_id: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Choose a bus...</option>
                    {buses.filter(b => b.status === 'active').map((bus) => (
                      <option key={bus.id} value={bus.id}>{bus.bus_name} ({bus.bus_number})</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Origin *</label>
                    <select
                      value={newRoute.origin}
                      onChange={(e) => setNewRoute({ ...newRoute, origin: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">Select origin city...</option>
                      {ZAMBIAN_CITIES.map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Destination *</label>
                    <select
                      value={newRoute.destination}
                      onChange={(e) => setNewRoute({ ...newRoute, destination: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">Select destination city...</option>
                      {ZAMBIAN_CITIES.filter(city => city !== newRoute.origin).map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Intermediate Stops</label>
                  <input
                    type="text"
                    value={newRoute.intermediate_stops}
                    onChange={(e) => setNewRoute({ ...newRoute, intermediate_stops: e.target.value })}
                    placeholder="e.g., Kafue, Mazabuka, Monze"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Departure Time *</label>
                    <input
                      type="time"
                      value={newRoute.departure_time}
                      onChange={(e) => setNewRoute({ ...newRoute, departure_time: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Arrival Time</label>
                    <input
                      type="time"
                      value={newRoute.arrival_time}
                      onChange={(e) => setNewRoute({ ...newRoute, arrival_time: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                    <input
                      type="date"
                      value={newRoute.date}
                      onChange={(e) => setNewRoute({ ...newRoute, date: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price (ZMW) *</label>
                    <input
                      type="number"
                      value={newRoute.price}
                      onChange={(e) => setNewRoute({ ...newRoute, price: e.target.value })}
                      placeholder="e.g., 250"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex gap-3 sticky bottom-0 bg-white">
                <button
                  onClick={() => setShowAddRouteModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddRoute}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg hover:from-primary-700 hover:to-secondary-700 transition font-medium shadow-lg"
                >
                  Create Route
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Booking Details Modal */}
        {viewingBooking && (
          <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-[9999] p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎫</span>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">Booking Details</h3>
                    <p className="text-sm text-gray-500">Reference: {viewingBooking.booking_reference}</p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingBooking(null)}
                  className="text-gray-500 hover:text-gray-700 p-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-6">
                {/* Status Badge */}
                <div className="flex items-center justify-between">
                  <span className={`inline-flex px-4 py-2 rounded-full text-sm font-medium ${viewingBooking.status === 'confirmed'
                    ? 'bg-green-100 text-green-700'
                    : viewingBooking.status === 'completed'
                      ? 'bg-purple-100 text-purple-700'
                      : viewingBooking.status === 'cancelled'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                    Status: {viewingBooking.status?.toUpperCase()}
                  </span>
                  <span className={`inline-flex px-4 py-2 rounded-full text-sm font-medium ${viewingBooking.payment_status === 'paid'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                    }`}>
                    Payment: {viewingBooking.payment_status?.toUpperCase() || 'PENDING'}
                  </span>
                </div>

                {/* Customer Information */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span>👤</span> Customer Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Name</p>
                      <p className="font-medium text-gray-800">{viewingBooking.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Phone</p>
                      <p className="font-medium text-gray-800">{viewingBooking.customer_phone}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Email</p>
                      <p className="font-medium text-gray-800">{viewingBooking.customer_email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Booked On</p>
                      <p className="font-medium text-gray-800">{new Date(viewingBooking.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Trip Information */}
                <div className="bg-blue-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span>🚌</span> Trip Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Route</p>
                      <p className="font-medium text-gray-800">{viewingBooking.origin} → {viewingBooking.destination}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Bus</p>
                      <p className="font-medium text-gray-800">{viewingBooking.bus_name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Date</p>
                      <p className="font-medium text-gray-800">{new Date(viewingBooking.date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Departure Time</p>
                      <p className="font-medium text-gray-800">{viewingBooking.departure_time}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Boarding Point</p>
                      <p className="font-medium text-gray-800">{viewingBooking.boarding_point || viewingBooking.origin}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Seat Numbers</p>
                      <p className="font-medium text-gray-800">{viewingBooking.seat_numbers}</p>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="bg-green-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span>💰</span> Payment Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Number of Seats</p>
                      <p className="font-medium text-gray-800">{viewingBooking.num_seats || viewingBooking.seat_numbers?.split(',').length || 1}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Total Amount</p>
                      <p className="font-bold text-2xl text-green-600">K{viewingBooking.total_price?.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Passengers List */}
                {viewingBooking.passengers && viewingBooking.passengers.length > 0 && (
                  <div className="bg-purple-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <span>👥</span> Passengers ({viewingBooking.passengers.length})
                    </h4>
                    <div className="space-y-2">
                      {viewingBooking.passengers.map((passenger: any, index: number) => (
                        <div key={index} className="flex items-center justify-between bg-white rounded-lg p-3 text-sm">
                          <div>
                            <p className="font-medium text-gray-800">{passenger.name}</p>
                            <p className="text-gray-500">{passenger.id_number} • {passenger.phone}</p>
                          </div>
                          <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-medium">
                            Seat {passenger.seat_number}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="p-6 border-t border-gray-200 flex gap-3 sticky bottom-0 bg-white">
                <button
                  onClick={() => setViewingBooking(null)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Close
                </button>
                {viewingBooking.status === 'confirmed' && (
                  <button
                    onClick={() => {
                      updateBookingStatus(viewingBooking.id, 'completed');
                      setViewingBooking(null);
                    }}
                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    Mark as Completed
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Add Driver Modal */}
     {/* Add Driver Modal - FIXED */}
{showAddDriverModal && (
  <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-[9999] p-4 overflow-y-auto">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-8 mx-4 relative">
      {/* Modal Header - Fixed to be visible */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-t-2xl sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">👨‍✈️</span>
          Add New Driver
          </h3>
          <button 
            onClick={() => setShowAddDriverModal(false)} 
            className="text-white hover:text-white/80 bg-white/20 hover:bg-white/30 rounded-lg p-2 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Modal Body - Scrollable */}
      <div className="p-6 max-h-[calc(90vh-120px)] overflow-y-auto">
        {/* Form fields here - keep as is */}
        <div className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
            <input
              type="text"
              value={newDriver.name}
              onChange={(e) => setNewDriver({ ...newDriver, name: e.target.value })}
              placeholder="e.g., John Mwanza"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Email field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address <span className="text-xs text-gray-500">(used for login)</span>
            </label>
            <input
              type="email"
              value={newDriver.email}
              onChange={(e) => setNewDriver({ ...newDriver, email: e.target.value })}
              placeholder="driver@company.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Password field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password <span className="text-xs text-gray-500">(minimum 6 characters)</span>
            </label>
            <input
              type="password"
              value={newDriver.password}
              onChange={(e) => setNewDriver({ ...newDriver, password: e.target.value })}
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Phone field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
            <input
              type="tel"
              value={newDriver.phone}
              onChange={(e) => setNewDriver({ ...newDriver, phone: e.target.value })}
              placeholder="e.g., 0971234567"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* License fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">License Number *</label>
              <input
                type="text"
                value={newDriver.license_number}
                onChange={(e) => setNewDriver({ ...newDriver, license_number: e.target.value })}
                placeholder="e.g., DL123456"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">License Type</label>
              <select
                value={newDriver.license_type}
                onChange={(e) => setNewDriver({ ...newDriver, license_type: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="Class B">Class B</option>
                <option value="Class C">Class C</option>
                <option value="Class D">Class D</option>
                <option value="PSV">PSV</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">License Expiry Date</label>
            <input
              type="date"
              value={newDriver.license_expiry}
              onChange={(e) => setNewDriver({ ...newDriver, license_expiry: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">NRC Number</label>
            <input
              type="text"
              value={newDriver.nrc_number}
              onChange={(e) => setNewDriver({ ...newDriver, nrc_number: e.target.value })}
              placeholder="e.g., 123456/12/1"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
            <textarea
              value={newDriver.address}
              onChange={(e) => setNewDriver({ ...newDriver, address: e.target.value })}
              placeholder="Driver's residential address"
              rows={2}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
      
      {/* Modal Footer */}
      <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddDriverModal(false)}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleAddDriver}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg hover:from-primary-700 hover:to-secondary-700 transition font-medium shadow-lg"
          >
            Add Driver
          </button>
        </div>
      </div>
    </div>
  </div>
)}
        {/* Edit Driver Modal */}
        {showEditDriverModal && editingDriver && (
          <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-[9999] p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-t-2xl sticky top-0 z-10">
                <h3 className="text-xl font-bold text-gray-800">✏️ Edit Driver</h3>
                <button onClick={() => { setShowEditDriverModal(false); setEditingDriver(null); }} className="text-gray-500 hover:text-gray-700">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={editingDriver.name}
                    onChange={(e) => setEditingDriver({ ...editingDriver, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* NEW: Email field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address <span className="text-xs text-gray-500">(used for login)</span>
                  </label>
                  <input
                    type="email"
                    value={editingDriver.email || ''}
                    onChange={(e) => setEditingDriver({ ...editingDriver, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* NEW: Password field (optional - only fill to change) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password <span className="text-xs text-gray-500">(leave blank to keep current)</span>
                  </label>
                  <input
                    type="password"
                    value={editingDriver.new_password || ''}
                    onChange={(e) => setEditingDriver({ ...editingDriver, new_password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Phone field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    value={editingDriver.phone}
                    onChange={(e) => setEditingDriver({ ...editingDriver, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* License fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">License Number *</label>
                    <input
                      type="text"
                      value={editingDriver.license_number}
                      onChange={(e) => setEditingDriver({ ...editingDriver, license_number: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">License Type</label>
                    <select
                      value={editingDriver.license_type || 'Class B'}
                      onChange={(e) => setEditingDriver({ ...editingDriver, license_type: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Class B">Class B</option>
                      <option value="Class C">Class C</option>
                      <option value="Class D">Class D</option>
                      <option value="PSV">PSV</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">License Expiry Date</label>
                  <input
                    type="date"
                    value={editingDriver.license_expiry || ''}
                    onChange={(e) => setEditingDriver({ ...editingDriver, license_expiry: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">NRC Number</label>
                  <input
                    type="text"
                    value={editingDriver.nrc_number || ''}
                    onChange={(e) => setEditingDriver({ ...editingDriver, nrc_number: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <textarea
                    value={editingDriver.address || ''}
                    onChange={(e) => setEditingDriver({ ...editingDriver, address: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={editingDriver.status}
                    onChange={(e) => setEditingDriver({ ...editingDriver, status: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="on_leave">On Leave</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex gap-3">
                <button
                  onClick={() => { setShowEditDriverModal(false); setEditingDriver(null); }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditDriver}
className="flex-1 px-4 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg hover:from-primary-700 hover:to-secondary-700 transition font-medium shadow-lg"                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Route Modal */}
        {showEditRouteModal && editingRoute && (
          <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-[9999] p-4 overflow-y-auto backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">✏️ Edit Route</h3>
                <button onClick={() => { setShowEditRouteModal(false); setEditingRoute(null); }} className="text-gray-500 hover:text-gray-700">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Origin *</label>
                    <select
                      value={editingRoute.origin}
                      onChange={(e) => setEditingRoute({ ...editingRoute, origin: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select origin city...</option>
                      {ZAMBIAN_CITIES.map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Destination *</label>
                    <select
                      value={editingRoute.destination}
                      onChange={(e) => setEditingRoute({ ...editingRoute, destination: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select destination city...</option>
                      {ZAMBIAN_CITIES.filter(city => city !== editingRoute.origin).map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Intermediate Stops</label>
                  <input
                    type="text"
                    value={editingRoute.intermediate_stops || ''}
                    onChange={(e) => setEditingRoute({ ...editingRoute, intermediate_stops: e.target.value })}
                    placeholder="e.g., Kafue, Mazabuka, Monze"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Departure Time *</label>
                    <input
                      type="time"
                      value={editingRoute.departure_time}
                      onChange={(e) => setEditingRoute({ ...editingRoute, departure_time: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Arrival Time</label>
                    <input
                      type="time"
                      value={editingRoute.arrival_time || ''}
                      onChange={(e) => setEditingRoute({ ...editingRoute, arrival_time: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                    <input
                      type="date"
                      value={editingRoute.date}
                      onChange={(e) => setEditingRoute({ ...editingRoute, date: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price (ZMW) *</label>
                    <input
                      type="number"
                      value={editingRoute.price}
                      onChange={(e) => setEditingRoute({ ...editingRoute, price: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assign Driver</label>
                  <select
                    value={editingRoute.driver_id || ''}
                    onChange={(e) => setEditingRoute({ ...editingRoute, driver_id: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">-- No Driver Assigned --</option>
                    {drivers.filter((d: any) => d.status === 'active').map((driver: any) => (
                      <option key={driver.id} value={driver.id}>{driver.name} - {driver.license_number}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={editingRoute.status}
                    onChange={(e) => setEditingRoute({ ...editingRoute, status: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex gap-3">
                <button
                  onClick={() => { setShowEditRouteModal(false); setEditingRoute(null); }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditRoute}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Refund Details Modal */}
        {viewingRefund && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-[9999] p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-screen overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-800">💸 Refund Details</h3>
                  <button onClick={() => setViewingRefund(null)} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-6">
                {/* Refund Overview */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Refund Overview</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Booking ID</p>
                      <p className="font-medium text-blue-600">#{viewingRefund.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Refund Status</p>
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${viewingRefund.refund_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        viewingRefund.refund_status === 'processed' ? 'bg-green-100 text-green-700' :
                          viewingRefund.refund_status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                        }`}>
                        {viewingRefund.refund_status || 'pending'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Original Amount</p>
                      <p className="font-medium text-gray-800">K{viewingRefund.amount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Refund Amount</p>
                      <p className="font-bold text-green-600 text-lg">K{viewingRefund.refund_amount || 0}</p>
                    </div>
                    {viewingRefund.cancellation_fee > 0 && (
                      <div>
                        <p className="text-sm text-gray-600">Cancellation Fee</p>
                        <p className="font-medium text-red-600">K{viewingRefund.cancellation_fee}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600">Request Date</p>
                      <p className="font-medium text-gray-800">
                        {new Date(viewingRefund.refund_requested_at || viewingRefund.created_at).toLocaleDateString('en-GB')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Customer Information</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-medium text-gray-800">{viewingRefund.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium text-gray-800">{viewingRefund.customer_phone}</p>
                    </div>
                    {viewingRefund.customer_email && (
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium text-gray-800">{viewingRefund.customer_email}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600">Seat Number</p>
                      <p className="font-medium text-gray-800">{viewingRefund.seat_number}</p>
                    </div>
                  </div>
                </div>

                {/* Trip Information */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Trip Information</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Route</p>
                      <p className="font-medium text-gray-800">{viewingRefund.origin} → {viewingRefund.destination}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Departure Date</p>
                      <p className="font-medium text-gray-800">
                        {new Date(viewingRefund.departure_time?.split('T')[0] || viewingRefund.created_at).toLocaleDateString('en-GB')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Departure Time</p>
                      <p className="font-medium text-gray-800">
                        {viewingRefund.departure_time ? new Date(viewingRefund.departure_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Bus</p>
                      <p className="font-medium text-gray-800">{viewingRefund.bus_name || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Refund Reason */}
                {viewingRefund.refund_reason && (
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Refund Reason</h4>
                    <p className="text-gray-700">{viewingRefund.refund_reason}</p>
                  </div>
                )}

                {/* Rejection Reason */}
                {viewingRefund.refund_status === 'rejected' && viewingRefund.rejection_reason && (
                  <div className="bg-red-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Rejection Reason</h4>
                    <p className="text-red-700">{viewingRefund.rejection_reason}</p>
                  </div>
                )}

                {/* Action Buttons */}
                {viewingRefund.refund_status === 'pending' && (
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        handleRefundAction(viewingRefund.id, 'approve');
                        setViewingRefund(null);
                      }}
                      disabled={processingRefund === viewingRefund.id}
                      className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition font-medium"
                    >
                      {processingRefund === viewingRefund.id ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </span>
                      ) : (
                        '✅ Approve Refund'
                      )}
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Please enter rejection reason (optional):');
                        handleRefundAction(viewingRefund.id, 'reject', reason || undefined);
                        setViewingRefund(null);
                      }}
                      disabled={processingRefund === viewingRefund.id}
                      className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition font-medium"
                    >
                      ❌ Reject Refund
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Subscription Payment Modal */}
        {showPayModal && selectedBusForPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-[9999] p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-600 to-emerald-600 rounded-t-xl">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-white">Subscribe Bus</h2>
                    <p className="text-green-100 text-sm mt-1">{selectedBusForPayment.bus_name} ({selectedBusForPayment.bus_number})</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowPayModal(false);
                      setSelectedBusForPayment(null);
                    }}
                    className="text-white hover:text-green-200 transition"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Subscription Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subscription Duration</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[1, 3, 6].map((months) => (
                      <button
                        key={months}
                        type="button"
                        onClick={() => setPaymentForm({ ...paymentForm, months })}
                        className={`p-4 rounded-lg border-2 text-center transition ${paymentForm.months === months
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        <div className="text-2xl font-bold">{months}</div>
                        <div className="text-sm text-gray-600">{months === 1 ? 'Month' : 'Months'}</div>
                        {months > 1 && (
                          <div className="text-xs text-green-600 mt-1">Save {months === 3 ? '5%' : '10%'}</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                    <span>Price per month</span>
                    <span>K{subscriptionInfo.settings?.pricePerBus || 500}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                    <span>Duration</span>
                    <span>{paymentForm.months} month{paymentForm.months > 1 ? 's' : ''}</span>
                  </div>
                  {paymentForm.months > 1 && (
                    <div className="flex justify-between items-center text-sm text-green-600 mb-2">
                      <span>Discount</span>
                      <span>-K{Math.round((subscriptionInfo.settings?.pricePerBus || 500) * paymentForm.months * (paymentForm.months === 3 ? 0.05 : 0.10))}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between items-center font-bold text-lg text-gray-800">
                      <span>Total</span>
                      <span className="text-green-600">
                        K{Math.round((subscriptionInfo.settings?.pricePerBus || 500) * paymentForm.months * (paymentForm.months === 1 ? 1 : paymentForm.months === 3 ? 0.95 : 0.90))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Method Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Payment Method</label>
                  <div className="grid grid-cols-2 gap-3">
                    {/* MTN Mobile Money */}
                    <button
                      type="button"
                      onClick={() => setPaymentForm({ ...paymentForm, payment_method: 'mtn_money' })}
                      className={`p-4 rounded-lg border-2 text-left transition ${paymentForm.payment_method === 'mtn_money'
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">📱</span>
                        <div>
                          <div className="font-semibold text-gray-800">MTN MoMo</div>
                          <div className="text-xs text-gray-500">Mobile Money</div>
                        </div>
                      </div>
                    </button>

                    {/* Airtel Money */}
                    <button
                      type="button"
                      onClick={() => setPaymentForm({ ...paymentForm, payment_method: 'airtel_money' })}
                      className={`p-4 rounded-lg border-2 text-left transition ${paymentForm.payment_method === 'airtel_money'
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">📱</span>
                        <div>
                          <div className="font-semibold text-gray-800">Airtel Money</div>
                          <div className="text-xs text-gray-500">Mobile Money</div>
                        </div>
                      </div>
                    </button>

                    {/* Zamtel Kwacha */}
                    <button
                      type="button"
                      onClick={() => setPaymentForm({ ...paymentForm, payment_method: 'zamtel_money' })}
                      className={`p-4 rounded-lg border-2 text-left transition ${paymentForm.payment_method === 'zamtel_money'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">📱</span>
                        <div>
                          <div className="font-semibold text-gray-800">Zamtel Kwacha</div>
                          <div className="text-xs text-gray-500">Mobile Money</div>
                        </div>
                      </div>
                    </button>

                    {/* Card Payment */}
                    <button
                      type="button"
                      onClick={() => setPaymentForm({ ...paymentForm, payment_method: 'card' })}
                      className={`p-4 rounded-lg border-2 text-left transition ${paymentForm.payment_method === 'card'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">💳</span>
                        <div>
                          <div className="font-semibold text-gray-800">Card</div>
                          <div className="text-xs text-gray-500">Visa / Mastercard</div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Mobile Money Phone Number Input */}
                {paymentForm.payment_method.includes('money') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                        +260
                      </span>
                      <input
                        type="tel"
                        value={paymentForm.phone_number}
                        onChange={(e) => setPaymentForm({ ...paymentForm, phone_number: e.target.value.replace(/\D/g, '').slice(0, 9) })}
                        placeholder="97XXXXXXX"
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Enter your registered mobile money number</p>
                  </div>
                )}

                {/* Card Details Input */}
                {paymentForm.payment_method === 'card' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                      <input
                        type="text"
                        value={paymentForm.card_number}
                        onChange={(e) => setPaymentForm({ ...paymentForm, card_number: e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim() })}
                        placeholder="4242 4242 4242 4242"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                        <input
                          type="text"
                          value={paymentForm.card_expiry}
                          onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, '').slice(0, 4);
                            if (value.length >= 2) value = value.slice(0, 2) + '/' + value.slice(2);
                            setPaymentForm({ ...paymentForm, card_expiry: value });
                          }}
                          placeholder="MM/YY"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                        <input
                          type="text"
                          value={paymentForm.card_cvv}
                          onChange={(e) => setPaymentForm({ ...paymentForm, card_cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                          placeholder="123"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Security Note */}
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                  <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-blue-800">Secure Payment</p>
                    <p className="text-xs text-blue-600 mt-1">Your payment information is encrypted and secure. We never store your full card details.</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                <button
                  onClick={handleSubscriptionPayment}
                  disabled={processingPayment}
                  className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processingPayment ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Processing Payment...</span>
                    </>
                  ) : (
                    <>
                      <span>💳</span>
                      <span>
                        Pay K{Math.round((subscriptionInfo.settings?.pricePerBus || 500) * paymentForm.months * (paymentForm.months === 1 ? 1 : paymentForm.months === 3 ? 0.95 : 0.90))}
                      </span>
                    </>
                  )}
                </button>
                <p className="text-center text-xs text-gray-500 mt-3">
                  By completing this payment, you agree to our Terms of Service
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Duplicate/Recurring Route Modal */}
        {showDuplicateModal && duplicatingRoute && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto animate-slideIn">
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 sticky top-0 z-10 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🔄</span>
                    <div>
                      <h3 className="text-xl font-bold text-white">Create Recurring Routes</h3>
                      <p className="text-indigo-100 text-sm mt-1">
                        {duplicatingRoute.origin} → {duplicatingRoute.destination}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setShowDuplicateModal(false); setDuplicatingRoute(null); }}
                    className="text-white hover:text-indigo-200 transition p-2 hover:bg-white/10 rounded-lg"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Template Selection (if multiple routes exist) */}
              {routes.length > 1 && (
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Switch Template Route</label>
                  <select
                    value={duplicatingRoute.id}
                    onChange={(e) => {
                      const route = routes.find(r => r.id === parseInt(e.target.value));
                      if (route) {
                        setDuplicatingRoute(route);
                        setDuplicateOptions({
                          ...duplicateOptions,
                          new_price: String(route.price),
                          new_departure_time: route.departure_time,
                          new_arrival_time: route.arrival_time || ''
                        });
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {routes.map(route => (
                      <option key={route.id} value={route.id}>
                        {route.origin} → {route.destination} ({route.departure_time} - K{route.price})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="p-6 space-y-6">
                {/* Mode Selection - Large Prominent Cards */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Schedule Type</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setDuplicateOptions({ ...duplicateOptions, mode: 'single' })}
                      className={`p-6 rounded-xl border-2 text-center transition-all ${duplicateOptions.mode === 'single'
                        ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
                        : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                        }`}
                    >
                      <span className="text-4xl mb-3 block">📅</span>
                      <div className="font-semibold text-lg">Single Date</div>
                      <p className="text-sm text-gray-500 mt-1">Create one route</p>
                    </button>
                    <button
                      onClick={() => setDuplicateOptions({ ...duplicateOptions, mode: 'recurring' })}
                      className={`p-6 rounded-xl border-2 text-center transition-all ${duplicateOptions.mode === 'recurring'
                        ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
                        : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                        }`}
                    >
                      <span className="text-4xl mb-3 block">🔄</span>
                      <div className="font-semibold text-lg">Recurring</div>
                      <p className="text-sm text-gray-500 mt-1">Daily, weekly, custom</p>
                    </button>
                  </div>
                </div>

                {/* Date Selection */}
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                  <h4 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
                    <span className="text-lg">📆</span>
                    {duplicateOptions.mode === 'single' ? 'Select Date' : 'Date Range'}
                  </h4>

                  {duplicateOptions.mode === 'single' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">New Date *</label>
                      <input
                        type="date"
                        value={duplicateOptions.start_date}
                        onChange={(e) => setDuplicateOptions({ ...duplicateOptions, start_date: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                        <input
                          type="date"
                          value={duplicateOptions.start_date}
                          onChange={(e) => setDuplicateOptions({ ...duplicateOptions, start_date: e.target.value })}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">End Date *</label>
                        <input
                          type="date"
                          value={duplicateOptions.end_date}
                          onChange={(e) => setDuplicateOptions({ ...duplicateOptions, end_date: e.target.value })}
                          min={duplicateOptions.start_date || new Date().toISOString().split('T')[0]}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Recurrence Pattern (only for recurring mode) */}
                {duplicateOptions.mode === 'recurring' && (
                  <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                    <h4 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
                      <span className="text-lg">🔄</span> Recurrence Pattern
                    </h4>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {[
                        { value: 'daily', label: 'Daily', icon: '📅', desc: 'Every day' },
                        { value: 'weekdays', label: 'Weekdays', icon: '💼', desc: 'Mon - Fri' },
                        { value: 'weekends', label: 'Weekends', icon: '🎉', desc: 'Sat - Sun' },
                        { value: 'weekly', label: 'Custom', icon: '⚙️', desc: 'Select days' }
                      ].map((pattern) => (
                        <button
                          key={pattern.value}
                          onClick={() => setDuplicateOptions({ ...duplicateOptions, recurrence: pattern.value as any })}
                          className={`p-4 rounded-lg border-2 text-left transition ${duplicateOptions.recurrence === pattern.value
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-indigo-300 bg-white'
                            }`}
                        >
                          <span className="text-2xl mb-2 block">{pattern.icon}</span>
                          <div className="font-medium">{pattern.label}</div>
                          <p className="text-xs text-gray-500">{pattern.desc}</p>
                        </button>
                      ))}
                    </div>

                    {duplicateOptions.recurrence === 'weekly' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Select Days</label>
                        <div className="flex flex-wrap gap-2">
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                            <button
                              key={day}
                              type="button"
                              onClick={() => {
                                const days = duplicateOptions.days_of_week.includes(index)
                                  ? duplicateOptions.days_of_week.filter(d => d !== index)
                                  : [...duplicateOptions.days_of_week, index];
                                setDuplicateOptions({ ...duplicateOptions, days_of_week: days });
                              }}
                              className={`w-12 h-12 rounded-full font-medium transition ${duplicateOptions.days_of_week.includes(index)
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                              {day}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Optional Modifications */}
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                  <h4 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
                    <span className="text-lg">⚙️</span> Optional Modifications
                  </h4>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Departure Time</label>
                      <input
                        type="time"
                        value={duplicateOptions.new_departure_time}
                        onChange={(e) => setDuplicateOptions({ ...duplicateOptions, new_departure_time: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Current: {duplicatingRoute.departure_time}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Arrival Time</label>
                      <input
                        type="time"
                        value={duplicateOptions.new_arrival_time}
                        onChange={(e) => setDuplicateOptions({ ...duplicateOptions, new_arrival_time: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Current: {duplicatingRoute.arrival_time || 'N/A'}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Price (ZMW)</label>
                    <input
                      type="number"
                      value={duplicateOptions.new_price}
                      onChange={(e) => setDuplicateOptions({ ...duplicateOptions, new_price: e.target.value })}
                      placeholder={`Current: K${duplicatingRoute.price}`}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Summary Card */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-200">
                  <h4 className="font-medium text-indigo-800 mb-3 flex items-center gap-2">
                    <span className="text-lg">📊</span> Summary
                  </h4>
                  <div className="space-y-2">
                    <p className="text-indigo-700">
                      <span className="font-medium">Template:</span> {duplicatingRoute.origin} → {duplicatingRoute.destination}
                    </p>
                    {duplicateOptions.mode === 'single' ? (
                      <p className="text-indigo-700">
                        <span className="font-medium">Creating:</span> 1 route on <strong>{new Date(duplicateOptions.start_date).toLocaleDateString('en-GB')}</strong>
                      </p>
                    ) : (
                      <p className="text-indigo-700">
                        <span className="font-medium">Creating:</span> <strong>{duplicateOptions.recurrence}</strong> routes from{' '}
                        <strong>{new Date(duplicateOptions.start_date).toLocaleDateString('en-GB')}</strong> to{' '}
                        <strong>{new Date(duplicateOptions.end_date).toLocaleDateString('en-GB')}</strong>
                        {duplicateOptions.recurrence === 'weekly' && duplicateOptions.days_of_week.length > 0 && (
                          <span className="block mt-1">
                            on {duplicateOptions.days_of_week.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')}
                          </span>
                        )}
                      </p>
                    )}
                    {duplicateOptions.new_price && Number(duplicateOptions.new_price) !== duplicatingRoute.price && (
                      <p className="text-indigo-700">
                        <span className="font-medium">Price:</span> K{duplicateOptions.new_price} (was K{duplicatingRoute.price})
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl flex gap-3">
                <button
                  onClick={() => { setShowDuplicateModal(false); setDuplicatingRoute(null); }}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium"
                  disabled={creatingRoutes}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDuplicateRoute}
                  disabled={creatingRoutes || !duplicateOptions.start_date || (duplicateOptions.mode === 'recurring' && !duplicateOptions.end_date)}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium shadow-lg"
                >
                  {creatingRoutes ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    <>
                      <span className="text-lg">✨</span>
                      Create {duplicateOptions.mode === 'single' ? 'Route' : 'Routes'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add this CSS for the slide-in animation */}
        <style jsx>{`
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .animate-slideIn {
    animation: slideIn 0.3s ease-out;
  }
`}</style>

        {/* Close main container div */}
      </div>
      );
}