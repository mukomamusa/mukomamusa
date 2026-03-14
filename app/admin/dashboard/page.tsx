'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface SystemStats {
  totalUsers: number;
  totalCustomers: number;
  totalCompanies: number;
  totalBuses: number;
  totalRoutes: number;
  totalBookings: number;
  totalRevenue: number;
  todayBookings: number;
  activeRoutes: number;
  cancelledBookings: number;
  // Commission stats
  commissionRate: number;
  totalCommission: number;
  companyPayouts: number;
  // Subscription stats
  subscriptionRevenue: number;
  subscriptionPricePerBus: number;
  trialBuses: number;
  activeBuses: number;
  expiredBuses: number;
}

interface User {
  id: number;
  email: string;
  name: string;
  phone: string;
  user_type: string;
  company_name?: string;
  created_at: string;
  status: string;
  // Verification documents for companies
  license_number?: string;
  company_registration_number?: string;
  company_address?: string;
}

interface Company {
  id: number;
  company_name: string;
  email: string;
  phone: string;
  busCount: number;
  routeCount: number;
  bookingCount: number;
  revenue: number;
  commissionPaid: number;
  netEarnings: number;
  status: string;
}

interface RecentBooking {
  id: number;
  booking_reference: string;
  customer_name: string;
  company_name: string;
  origin: string;
  destination: string;
  date: string;
  total_price: number;
  status: string;
  created_at: string;
}

type SortDirection = 'asc' | 'desc';
type UserSortField = 'id' | 'name' | 'email' | 'user_type' | 'created_at';
type CompanySortField = 'company_name' | 'busCount' | 'routeCount' | 'bookingCount' | 'revenue' | 'netEarnings';
type BookingSortField = 'booking_reference' | 'customer_name' | 'company_name' | 'date' | 'total_price' | 'status';

const ITEMS_PER_PAGE = 10;

export default function AdminDashboard() {
    // --- State declarations ---
    const [user, setUser] = useState<any>(null);
    //const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'companies' | 'bookings' | 'settings'>('overview');
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'companies' | 'bookings' | 'settings' | 'reviews'>('overview');
    const [reviews, setReviews] = useState<any[]>([]);
    const [reviewLoading, setReviewLoading] = useState(false);
    const [reviewActionLoading, setReviewActionLoading] = useState<number|null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);

        // Review filter and sort states
    const [reviewSearchTerm, setReviewSearchTerm] = useState('');
    const [reviewStatusFilter, setReviewStatusFilter] = useState<string>('all');
    const [reviewSortField, setReviewSortField] = useState<'created_at' | 'rating' | 'company_name' | 'status'>('created_at');
    const [reviewSortDirection, setReviewSortDirection] = useState<'asc' | 'desc'>('desc');
    const [reviewPage, setReviewPage] = useState(1);
    const REVIEWS_PER_PAGE = 10;


const fetchReviews = async () => {
  setReviewLoading(true);
  try {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/reviews', { 
      headers: { Authorization: `Bearer ${token}` } 
    });
    
    if (res.ok) {
      const data = await res.json();
      
      // Enhance reviews with company and customer names from existing data
      const enhancedReviews = data.map((review: any) => {
      const company = companies.find(c => c.id === review.company_id);
      const customer = users.find(u => u.id === review.customer_id);
        
        return {
          ...review,
          company_name: company?.company_name,
          customer_name: customer?.name
        };
      });
      
      setReviews(enhancedReviews);
    }
  } catch (e) { 
    console.error('Error fetching reviews:', e); 
  }
  setReviewLoading(false);
};

// Also fetch reviews when companies or users data changes
useEffect(() => {
  if (user && companies.length > 0 && users.length > 0) {
    fetchReviews();
  }
}, [user, companies, users]);

    // Fetch reviews when user is set
    useEffect(() => {
      if (user) {
        fetchReviews();
      }
    }, [user]);

    // Approve review
    const handleApproveReview = async (id: number) => {
      setReviewActionLoading(id);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/reviews', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ id, status: 'approved' })
        });
        if (res.ok) setReviews(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
      } catch (e) { alert('Failed to approve review.'); }
      setReviewActionLoading(null);
    };
     
    // Reject review
  const handleRejectReview = async (id: number) => {
  setReviewActionLoading(id);
  try {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/reviews', {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json', 
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ id, status: 'rejected' })
    });
    if (res.ok) {
      setReviews(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' } : r));
    }
  } catch (e) { 
    alert('Failed to reject review.'); 
  }
  setReviewActionLoading(null);
};
         
  const router = useRouter();

  
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);

  // Settings state
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [commissionRate, setCommissionRate] = useState('7.5');
  const [subscriptionPrice, setSubscriptionPrice] = useState('500');
  const [trialDays, setTrialDays] = useState('14');

  // Filter states
  const [userFilter, setUserFilter] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState<string>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState('');
  const [bookingFilter, setBookingFilter] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>('all');
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);

  // Sort states
  const [userSort, setUserSort] = useState<{ field: UserSortField; direction: SortDirection }>({ field: 'id', direction: 'asc' });
  const [companySort, setCompanySort] = useState<{ field: CompanySortField; direction: SortDirection }>({ field: 'company_name', direction: 'asc' });
  const [bookingSort, setBookingSort] = useState<{ field: BookingSortField; direction: SortDirection }>({ field: 'date', direction: 'desc' });

  // Pagination states
  const [userPage, setUserPage] = useState(1);
  const [companyPage, setCompanyPage] = useState(1);
  const [bookingPage, setBookingPage] = useState(1);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/admin/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.user_type !== 'admin') {
      router.push('/');
      return;
    }

    setUser(parsedUser);
    fetchData(token);
  }, []);

  const fetchData = async (token: string) => {
    try {
      const response = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setUsers(data.users || []);
        setCompanies(data.companies || []);
        setRecentBookings(data.recentBookings || []);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Reset page when filters change
  useEffect(() => { setUserPage(1); }, [userFilter, userTypeFilter, userStatusFilter]);

  // Update user status function
  const updateUserStatus = async (userId: number, newStatus: 'active' | 'suspended') => {
    setUpdatingUserId(userId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        const data = await response.json();
        // Update local state
        setUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, status: newStatus } : u
        ));
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Failed to update user status');
    } finally {
      setUpdatingUserId(null);
    }
  };
  useEffect(() => { setCompanyPage(1); }, [companyFilter]);
  useEffect(() => { setBookingPage(1); }, [bookingFilter, bookingStatusFilter]);

  // Load settings when settings tab is active
  useEffect(() => {
    if (activeTab === 'settings') {
      const loadSettings = async () => {
        setSettingsLoading(true);
        try {
          const token = localStorage.getItem('token');
          const response = await fetch('/api/admin/settings', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            const settings = data.settings;
            if (settings.commission_rate) {
              setCommissionRate((parseFloat(settings.commission_rate.value) * 100).toString());
            }
            if (settings.subscription_price_per_bus) {
              setSubscriptionPrice(settings.subscription_price_per_bus.value);
            }
            if (settings.subscription_trial_days) {
              setTrialDays(settings.subscription_trial_days.value);
            }
          }
        } catch (error) {
          console.error('Error loading settings:', error);
        } finally {
          setSettingsLoading(false);
        }
      };
      loadSettings();
    }
  }, [activeTab]);
// Filter and sort reviews
const filteredAndSortedReviews = reviews
  .filter(review => {
    const company = companies.find(c => c.id === review.company_id);
    const customer = users.find(u => u.id === review.customer_id);
    const companyName = company?.company_name || '';
    const customerName = customer?.name || '';
    const searchTerm = reviewSearchTerm.toLowerCase();
    
    const matchesSearch = 
      companyName.toLowerCase().includes(searchTerm) ||
      customerName.toLowerCase().includes(searchTerm) ||
      (review.review_text || '').toLowerCase().includes(searchTerm);
    
    const matchesStatus = reviewStatusFilter === 'all' || review.status === reviewStatusFilter;
    
    return matchesSearch && matchesStatus;
  })
  .sort((a, b) => {
    let aVal: any;
    let bVal: any;
    
    if (reviewSortField === 'company_name') {
      const aCompany = companies.find(c => c.id === a.company_id);
      const bCompany = companies.find(c => c.id === b.company_id);
      aVal = aCompany?.company_name || '';
      bVal = bCompany?.company_name || '';
    } else {
      aVal = a[reviewSortField];
      bVal = b[reviewSortField];
    }
    
    const modifier = reviewSortDirection === 'asc' ? 1 : -1;
    
    if (typeof aVal === 'string') {
      return aVal.localeCompare(bVal) * modifier;
    }
    return ((aVal as number) - (bVal as number)) * modifier;
  });

// Paginate reviews
const paginatedReviews = filteredAndSortedReviews.slice(
  (reviewPage - 1) * REVIEWS_PER_PAGE, 
  reviewPage * REVIEWS_PER_PAGE
);
const totalReviewPages = Math.ceil(filteredAndSortedReviews.length / REVIEWS_PER_PAGE);

// Reset review page when filters change
useEffect(() => {
  setReviewPage(1);
}, [reviewSearchTerm, reviewStatusFilter, reviewSortField, reviewSortDirection]);

  // Filter and sort users
  const filteredUsers = users
    .filter(u => {
      const matchesSearch = u.name.toLowerCase().includes(userFilter.toLowerCase()) ||
                           u.email.toLowerCase().includes(userFilter.toLowerCase()) ||
                           u.phone.includes(userFilter);
      const matchesType = userTypeFilter === 'all' || u.user_type === userTypeFilter;
      const matchesStatus = userStatusFilter === 'all' || u.status === userStatusFilter;
      return matchesSearch && matchesType && matchesStatus;
    })
    .sort((a, b) => {
      const aVal = a[userSort.field];
      const bVal = b[userSort.field];
      const modifier = userSort.direction === 'asc' ? 1 : -1;
      if (typeof aVal === 'string') return aVal.localeCompare(bVal as string) * modifier;
      return ((aVal as number) - (bVal as number)) * modifier;
    });

  // Filter and sort companies
  const filteredCompanies = companies
    .filter(c => c.company_name.toLowerCase().includes(companyFilter.toLowerCase()) ||
                c.email.toLowerCase().includes(companyFilter.toLowerCase()))
    .sort((a, b) => {
      const aVal = a[companySort.field];
      const bVal = b[companySort.field];
      const modifier = companySort.direction === 'asc' ? 1 : -1;
      if (typeof aVal === 'string') return aVal.localeCompare(bVal as string) * modifier;
      return ((aVal as number) - (bVal as number)) * modifier;
    });



  // Filter and sort bookings
  const filteredBookings = recentBookings
    .filter(b => {
      const matchesSearch = b.booking_reference.toLowerCase().includes(bookingFilter.toLowerCase()) ||
                           b.customer_name.toLowerCase().includes(bookingFilter.toLowerCase()) ||
                           b.company_name.toLowerCase().includes(bookingFilter.toLowerCase()) ||
                           b.origin.toLowerCase().includes(bookingFilter.toLowerCase()) ||
                           b.destination.toLowerCase().includes(bookingFilter.toLowerCase());
      const matchesStatus = bookingStatusFilter === 'all' || b.status === bookingStatusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const aVal = a[bookingSort.field];
      const bVal = b[bookingSort.field];
      const modifier = bookingSort.direction === 'asc' ? 1 : -1;
      if (typeof aVal === 'string') return aVal.localeCompare(bVal as string) * modifier;
      return ((aVal as number) - (bVal as number)) * modifier;
    });

  // Paginate
  const paginatedUsers = filteredUsers.slice((userPage - 1) * ITEMS_PER_PAGE, userPage * ITEMS_PER_PAGE);
  const paginatedCompanies = filteredCompanies.slice((companyPage - 1) * ITEMS_PER_PAGE, companyPage * ITEMS_PER_PAGE);
  const paginatedBookings = filteredBookings.slice((bookingPage - 1) * ITEMS_PER_PAGE, bookingPage * ITEMS_PER_PAGE);

  const totalUserPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const totalCompanyPages = Math.ceil(filteredCompanies.length / ITEMS_PER_PAGE);
  const totalBookingPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (!user) return null;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '3rem', 
            height: '3rem', 
            border: '3px solid #e5e7eb',
            borderTop: '3px solid #1f2937',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: '#6b7280' }}>Loading admin dashboard...</p>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #E6F7F6, #f3f4f6, #E8F3EC)' }}>
      {/* Header - Zambian Theme */}
      <header style={{ background: 'linear-gradient(to right, #197670, #13625D)', color: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderBottom: '4px solid #659E85', position: 'sticky', top: 0, zIndex: 1000 }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
                  border: '2px solid #659E85',
                  boxShadow: '0 6px 14px rgba(0, 0, 0, 0.25)'
                }}
              />
              <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Admin Dashboard</h1>
                <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>VayaZed Bus Booking System</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '0.875rem', color: '#d1d5db' }}>
                Welcome, {user.name}
              </span>
              <a
                href="/admin/users"
                style={{
                  padding: '0.5rem 1rem',
                  background: '#659E85',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  textDecoration: 'none'
                }}
              >
                User Management
              </a>
              <a
                href="/admin/agents"
                style={{
                  padding: '0.5rem 1rem',
                  background: '#2BB2A9',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  textDecoration: 'none'
                }}
              >
                Agents
              </a>
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
        </div>
      </header>

      {/* Navigation Tabs */}
      <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1.5rem' }}>
          <div style={{ display: 'flex', gap: '0' }}>
            {(['overview', 'users', 'companies', 'bookings', 'settings','reviews'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '1rem 1.5rem',
                  background: activeTab === tab ? '#E6F7F6' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab ? '3px solid #2BB2A9' : '3px solid transparent',
                  color: activeTab === tab ? '#2BB2A9' : '#6b7280',
                  fontWeight: activeTab === tab ? '600' : '500',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  fontSize: '0.875rem'
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        
        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div>
            {/* Platform Earnings Section */}
            <div style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, #197670 0%, #13625D 100%)', borderRadius: '1rem', padding: '1.5rem', color: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '1.5rem' }}>💎</span>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Platform Revenue</h2>
                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', marginLeft: 'auto' }}>
                  Commission: {stats.commissionRate}% | Subscription: K{stats.subscriptionPricePerBus}/bus/mo
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '1rem', borderRadius: '0.75rem' }}>
                  <p style={{ fontSize: '0.875rem', opacity: 0.8 }}>Booking Revenue</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>K{stats.totalRevenue.toLocaleString()}</p>
                </div>
                <div style={{ background: 'rgba(25, 138, 0, 0.3)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid rgba(25, 138, 0, 0.5)' }}>
                  <p style={{ fontSize: '0.875rem', opacity: 0.8 }}>Commission Earned</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4ade80' }}>K{(stats.totalCommission || 0).toLocaleString()}</p>
                </div>
                <div style={{ background: 'rgba(139, 92, 246, 0.3)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid rgba(139, 92, 246, 0.5)' }}>
                  <p style={{ fontSize: '0.875rem', opacity: 0.8 }}>Subscription Revenue</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#c4b5fd' }}>K{(stats.subscriptionRevenue || 0).toLocaleString()}</p>
                </div>
                <div style={{ background: 'rgba(34, 197, 94, 0.4)', padding: '1rem', borderRadius: '0.75rem', border: '2px solid rgba(34, 197, 94, 0.7)' }}>
                  <p style={{ fontSize: '0.875rem', opacity: 0.8 }}>Total Platform Earnings</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#22c55e' }}>K{((stats.totalCommission || 0) + (stats.subscriptionRevenue || 0)).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Bus Subscription Status */}
            <div style={{ marginBottom: '2rem', background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#374151', marginBottom: '1rem' }}>Bus Subscription Status</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                <div style={{ background: '#fef3c7', padding: '1rem', borderRadius: '0.75rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#92400e' }}>{stats.trialBuses || 0}</p>
                  <p style={{ fontSize: '0.875rem', color: '#92400e' }}>Trial Period</p>
                </div>
                <div style={{ background: '#d1fae5', padding: '1rem', borderRadius: '0.75rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#065f46' }}>{stats.activeBuses || 0}</p>
                  <p style={{ fontSize: '0.875rem', color: '#065f46' }}>Active Subscriptions</p>
                </div>
                <div style={{ background: '#fee2e2', padding: '1rem', borderRadius: '0.75rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#991b1b' }}>{stats.expiredBuses || 0}</p>
                  <p style={{ fontSize: '0.875rem', color: '#991b1b' }}>Expired/Suspended</p>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <StatCard title="Total Users" value={stats.totalUsers} icon="👥" color="#3b82f6" />
              <StatCard title="Customers" value={stats.totalCustomers} icon="🧑" color="#10b981" />
              <StatCard title="Companies" value={stats.totalCompanies} icon="🏢" color="#8b5cf6" />
              <StatCard title="Buses" value={stats.totalBuses} icon="🚌" color="#f59e0b" />
              <StatCard title="Active Routes" value={stats.activeRoutes} icon="🛣️" color="#06b6d4" />
              <StatCard title="Total Bookings" value={stats.totalBookings} icon="🎫" color="#ec4899" />
              <StatCard title="Today's Bookings" value={stats.todayBookings} icon="📅" color="#84cc16" />
              <StatCard title="Cancelled" value={stats.cancelledBookings} icon="❌" color="#ef4444" />
            </div>

            {/* Recent Bookings */}
            <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>Recent Bookings</h2>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#f9fafb' }}>
                    <tr>
                      <th style={thStyle}>Reference</th>
                      <th style={thStyle}>Customer</th>
                      <th style={thStyle}>Company</th>
                      <th style={thStyle}>Route</th>
                      <th style={thStyle}>Date</th>
                      <th style={thStyle}>Amount</th>
                      <th style={thStyle}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBookings.slice(0, 10).map(booking => (
                      <tr key={booking.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={tdStyle}><code style={{ fontSize: '0.75rem', background: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>{booking.booking_reference}</code></td>
                        <td style={tdStyle}>{booking.customer_name}</td>
                        <td style={tdStyle}>{booking.company_name}</td>
                        <td style={tdStyle}>{booking.origin} → {booking.destination}</td>
                        <td style={tdStyle}>{new Date(booking.date).toLocaleDateString('en-GB')}</td>
                        <td style={tdStyle}>K{booking.total_price}</td>
                        <td style={tdStyle}>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            background: booking.status === 'confirmed' ? '#d1fae5' : booking.status === 'cancelled' ? '#fee2e2' : '#fef3c7',
                            color: booking.status === 'confirmed' ? '#065f46' : booking.status === 'cancelled' ? '#991b1b' : '#92400e'
                          }}>
                            {booking.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {recentBookings.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>No bookings found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>All Users ({filteredUsers.length})</h2>
              </div>
              {/* Filters */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  style={{ flex: '1', minWidth: '200px', padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}
                />
                <select
                  value={userTypeFilter}
                  onChange={(e) => setUserTypeFilter(e.target.value)}
                  style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem', background: 'white' }}
                >
                  <option value="all">All Types</option>
                  <option value="customer">Customers</option>
                  <option value="company">Companies</option>
                  <option value="admin">Admins</option>
                </select>
                <select
                  value={userStatusFilter}
                  onChange={(e) => setUserStatusFilter(e.target.value)}
                  style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem', background: 'white' }}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="pending_verification">Pending</option>
                </select>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f9fafb' }}>
                  <tr>
                    <SortHeader field="id" label="ID" currentSort={userSort} onSort={(field) => setUserSort(prev => ({ field: field as UserSortField, direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc' }))} />
                    <SortHeader field="name" label="Name" currentSort={userSort} onSort={(field) => setUserSort(prev => ({ field: field as UserSortField, direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc' }))} />
                    <SortHeader field="email" label="Email" currentSort={userSort} onSort={(field) => setUserSort(prev => ({ field: field as UserSortField, direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc' }))} />
                    <th style={thStyle}>Phone</th>
                    <SortHeader field="user_type" label="Type" currentSort={userSort} onSort={(field) => setUserSort(prev => ({ field: field as UserSortField, direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc' }))} />
                    <th style={thStyle}>Status</th>
                    <SortHeader field="created_at" label="Registered" currentSort={userSort} onSort={(field) => setUserSort(prev => ({ field: field as UserSortField, direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc' }))} />
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={tdStyle}>{u.id}</td>
                      <td style={tdStyle}>{u.name}</td>
                      <td style={tdStyle}>{u.email}</td>
                      <td style={tdStyle}>{u.phone}</td>
                      <td style={tdStyle}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          background: u.user_type === 'admin' ? '#fce7f3' : u.user_type === 'company' ? '#ddd6fe' : '#cffafe',
                          color: u.user_type === 'admin' ? '#9d174d' : u.user_type === 'company' ? '#5b21b6' : '#0e7490'
                        }}>
                          {u.user_type}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          background: u.status === 'active' ? '#d1fae5' : u.status === 'suspended' ? '#fee2e2' : '#fef3c7',
                          color: u.status === 'active' ? '#065f46' : u.status === 'suspended' ? '#991b1b' : '#92400e'
                        }}>
                          {u.status === 'pending_verification' ? 'pending' : u.status || 'active'}
                        </span>
                      </td>
                      <td style={tdStyle}>{new Date(u.created_at).toLocaleDateString('en-GB')}</td>
                      <td style={tdStyle}>
                        {u.user_type !== 'admin' ? (
                          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                            {/* View button for companies */}
                            {u.user_type === 'company' && (
                              <button
                                onClick={() => setViewingUser(u)}
                                style={{
                                  padding: '0.375rem 0.5rem',
                                  borderRadius: '0.375rem',
                                  border: 'none',
                                  fontSize: '0.75rem',
                                  fontWeight: '500',
                                  cursor: 'pointer',
                                  background: '#dbeafe',
                                  color: '#1e40af'
                                }}
                              >
                                View
                              </button>
                            )}
                            {/* Approve/Reject for pending companies */}
                            {(u.status === 'pending_verification' || u.status === 'pending') ? (
                              <>
                                <button
                                  onClick={() => updateUserStatus(u.id, 'active')}
                                  disabled={updatingUserId === u.id}
                                  style={{
                                    padding: '0.375rem 0.5rem',
                                    borderRadius: '0.375rem',
                                    border: 'none',
                                    fontSize: '0.75rem',
                                    fontWeight: '500',
                                    cursor: updatingUserId === u.id ? 'wait' : 'pointer',
                                    background: '#d1fae5',
                                    color: '#065f46',
                                    opacity: updatingUserId === u.id ? 0.6 : 1
                                  }}
                                >
                                  {updatingUserId === u.id ? '...' : 'Approve'}
                                </button>
                                <button
                                  onClick={() => updateUserStatus(u.id, 'suspended')}
                                  disabled={updatingUserId === u.id}
                                  style={{
                                    padding: '0.375rem 0.5rem',
                                    borderRadius: '0.375rem',
                                    border: 'none',
                                    fontSize: '0.75rem',
                                    fontWeight: '500',
                                    cursor: updatingUserId === u.id ? 'wait' : 'pointer',
                                    background: '#fee2e2',
                                    color: '#991b1b',
                                    opacity: updatingUserId === u.id ? 0.6 : 1
                                  }}
                                >
                                  Reject
                                </button>
                              </>
                            ) : (
                              /* Active/Suspended toggle */
                              <button
                                onClick={() => updateUserStatus(u.id, u.status === 'suspended' ? 'active' : 'suspended')}
                                disabled={updatingUserId === u.id}
                                style={{
                                  padding: '0.375rem 0.5rem',
                                  borderRadius: '0.375rem',
                                  border: 'none',
                                  fontSize: '0.75rem',
                                  fontWeight: '500',
                                  cursor: updatingUserId === u.id ? 'wait' : 'pointer',
                                  background: u.status === 'suspended' ? '#d1fae5' : '#fee2e2',
                                  color: u.status === 'suspended' ? '#065f46' : '#991b1b',
                                  opacity: updatingUserId === u.id ? 0.6 : 1
                                }}
                              >
                                {updatingUserId === u.id ? '...' : u.status === 'suspended' ? 'Activate' : 'Suspend'}
                              </button>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {paginatedUsers.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>No users found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {totalUserPages > 1 && (
              <Pagination currentPage={userPage} totalPages={totalUserPages} onPageChange={setUserPage} />
            )}
          </div>
        )}

        {/* Companies Tab */}
        {activeTab === 'companies' && (
          <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>Bus Companies ({filteredCompanies.length})</h2>
              </div>
              {/* Filter */}
              <input
                type="text"
                placeholder="Search by company name or email..."
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                style={{ width: '100%', maxWidth: '300px', padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}
              />
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f9fafb' }}>
                  <tr>
                    <SortHeader field="company_name" label="Company Name" currentSort={companySort} onSort={(field) => setCompanySort(prev => ({ field: field as CompanySortField, direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc' }))} />
                    <th style={thStyle}>Email</th>
                    <SortHeader field="busCount" label="Buses" currentSort={companySort} onSort={(field) => setCompanySort(prev => ({ field: field as CompanySortField, direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc' }))} />
                    <SortHeader field="routeCount" label="Routes" currentSort={companySort} onSort={(field) => setCompanySort(prev => ({ field: field as CompanySortField, direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc' }))} />
                    <SortHeader field="bookingCount" label="Bookings" currentSort={companySort} onSort={(field) => setCompanySort(prev => ({ field: field as CompanySortField, direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc' }))} />
                    <SortHeader field="revenue" label="Gross Rev." currentSort={companySort} onSort={(field) => setCompanySort(prev => ({ field: field as CompanySortField, direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc' }))} />
                    <th style={thStyle}>Commission</th>
                    <SortHeader field="netEarnings" label="Net Earnings" currentSort={companySort} onSort={(field) => setCompanySort(prev => ({ field: field as CompanySortField, direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc' }))} />
                  </tr>
                </thead>
                <tbody>
                  {paginatedCompanies.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={tdStyle}><strong>{c.company_name}</strong></td>
                      <td style={tdStyle}>{c.email}</td>
                      <td style={tdStyle}>{c.busCount}</td>
                      <td style={tdStyle}>{c.routeCount}</td>
                      <td style={tdStyle}>{c.bookingCount}</td>
                      <td style={tdStyle}>K{c.revenue.toLocaleString()}</td>
                      <td style={{...tdStyle, color: '#dc2626', fontSize: '0.75rem'}}>-K{(c.commissionPaid || 0).toLocaleString()}</td>
                      <td style={{...tdStyle, color: '#2BB2A9', fontWeight: '600'}}>K{(c.netEarnings || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                  {paginatedCompanies.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>No companies found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {totalCompanyPages > 1 && (
              <Pagination currentPage={companyPage} totalPages={totalCompanyPages} onPageChange={setCompanyPage} />
            )}
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>All Bookings ({filteredBookings.length})</h2>
              </div>
              {/* Filters */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Search by reference, customer, company, or route..."
                  value={bookingFilter}
                  onChange={(e) => setBookingFilter(e.target.value)}
                  style={{ flex: '1', minWidth: '250px', padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem' }}
                />
                <select
                  value={bookingStatusFilter}
                  onChange={(e) => setBookingStatusFilter(e.target.value)}
                  style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '0.875rem', background: 'white' }}
                >
                  <option value="all">All Status</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f9fafb' }}>
                  <tr>
                    <SortHeader field="booking_reference" label="Reference" currentSort={bookingSort} onSort={(field) => setBookingSort(prev => ({ field: field as BookingSortField, direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc' }))} />
                    <SortHeader field="customer_name" label="Customer" currentSort={bookingSort} onSort={(field) => setBookingSort(prev => ({ field: field as BookingSortField, direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc' }))} />
                    <SortHeader field="company_name" label="Company" currentSort={bookingSort} onSort={(field) => setBookingSort(prev => ({ field: field as BookingSortField, direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc' }))} />
                    <th style={thStyle}>Route</th>
                    <SortHeader field="date" label="Travel Date" currentSort={bookingSort} onSort={(field) => setBookingSort(prev => ({ field: field as BookingSortField, direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc' }))} />
                    <SortHeader field="total_price" label="Amount" currentSort={bookingSort} onSort={(field) => setBookingSort(prev => ({ field: field as BookingSortField, direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc' }))} />
                    <SortHeader field="status" label="Status" currentSort={bookingSort} onSort={(field) => setBookingSort(prev => ({ field: field as BookingSortField, direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc' }))} />
                    <th style={thStyle}>Booked On</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedBookings.map(booking => (
                    <tr key={booking.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={tdStyle}><code style={{ fontSize: '0.75rem', background: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>{booking.booking_reference}</code></td>
                      <td style={tdStyle}>{booking.customer_name}</td>
                      <td style={tdStyle}>{booking.company_name}</td>
                      <td style={tdStyle}>{booking.origin} → {booking.destination}</td>
                      <td style={tdStyle}>{new Date(booking.date).toLocaleDateString('en-GB')}</td>
                      <td style={tdStyle}>K{booking.total_price}</td>
                      <td style={tdStyle}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          background: booking.status === 'confirmed' ? '#d1fae5' : booking.status === 'cancelled' ? '#fee2e2' : '#fef3c7',
                          color: booking.status === 'confirmed' ? '#065f46' : booking.status === 'cancelled' ? '#991b1b' : '#92400e'
                        }}>
                          {booking.status}
                        </span>
                      </td>
                      <td style={tdStyle}>{new Date(booking.created_at).toLocaleDateString('en-GB')}</td>
                    </tr>
                  ))}
                  {paginatedBookings.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>No bookings found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {totalBookingPages > 1 && (
              <Pagination currentPage={bookingPage} totalPages={totalBookingPages} onPageChange={setBookingPage} />
            )}
          </div>
        )}
          {/* Reviews Tab */}
{/* Reviews Tab */}
{activeTab === 'reviews' && (
  <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden', padding: '2rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>Customer Reviews</h2>
      <span style={{ 
        padding: '0.25rem 0.75rem', 
        background: '#e5e7eb', 
        borderRadius: '9999px',
        fontSize: '0.875rem',
        color: '#4b5563'
      }}>
        Total: {reviews.length} | Pending: {reviews.filter(r => r.status === 'pending').length}
      </span>
    </div>
    
    {/* Search and Filter Bar */}
    <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      <input
        type="text"
        placeholder="Search by company, customer, or review text..."
        value={reviewSearchTerm}
        onChange={(e) => setReviewSearchTerm(e.target.value)}
        style={{
          flex: '2',
          minWidth: '250px',
          padding: '0.75rem 1rem',
          border: '1px solid #d1d5db',
          borderRadius: '0.5rem',
          fontSize: '0.875rem'
        }}
      />
      <select
        value={reviewStatusFilter}
        onChange={(e) => setReviewStatusFilter(e.target.value)}
        style={{
          padding: '0.75rem 1rem',
          border: '1px solid #d1d5db',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          background: 'white',
          minWidth: '150px'
        }}
      >
        <option value="all">All Status</option>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
      </select>
      <select
        value={reviewSortField}
        onChange={(e) => setReviewSortField(e.target.value as any)}
        style={{
          padding: '0.75rem 1rem',
          border: '1px solid #d1d5db',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          background: 'white',
          minWidth: '150px'
        }}
      >
        <option value="created_at">Sort by Date</option>
        <option value="rating">Sort by Rating</option>
        <option value="company_name">Sort by Company</option>
        <option value="status">Sort by Status</option>
      </select>
      <button
        onClick={() => setReviewSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
        style={{
          padding: '0.75rem 1rem',
          border: '1px solid #d1d5db',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          background: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}
      >
        {reviewSortDirection === 'asc' ? '↑ Ascending' : '↓ Descending'}
      </button>
    </div>

    {reviewLoading ? (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
        <div style={{ 
          width: '2rem', 
          height: '2rem', 
          border: '3px solid #e5e7eb',
          borderTopColor: '#059669',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1rem'
        }}></div>
        Loading reviews...
      </div>
    ) : (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f9fafb' }}>
            <tr>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Company</th>
              <th style={thStyle}>Customer</th>
              <th style={thStyle}>Rating</th>
              <th style={thStyle}>Review</th>
              <th style={thStyle}>Submitted</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedReviews.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                  No reviews found
                </td>
              </tr>
            ) : (
             paginatedReviews.map(r => {
                const company = companies.find(c => c.id === r.company_id);
                const customer = users.find(u => u.id === r.customer_id);
                
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={tdStyle}>#{r.id}</td>
                    <td style={tdStyle}>
                      <span style={{ fontWeight: '500' }}>
                        {company?.company_name || `Company #${r.company_id}`}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {customer?.name || `User #${r.customer_id}`}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span style={{ fontWeight: '600', color: '#f59e0b' }}>{r.rating}</span>
                        <span style={{ color: '#f59e0b', fontSize: '1rem' }}>★</span>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ maxWidth: '300px' }}>
                        <p style={{ 
                          margin: 0, 
                          fontSize: '0.875rem', 
                          color: '#374151',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }} title={r.review_text}>
                          {r.review_text || '—'}
                        </p>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        <div>{new Date(r.created_at).toLocaleDateString('en-GB')}</div>
                        <div style={{ fontSize: '0.7rem' }}>
                          {new Date(r.created_at).toLocaleTimeString('en-GB', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        background: r.status === 'approved' ? '#d1fae5' : 
                                   r.status === 'rejected' ? '#fee2e2' : '#fef3c7',
                        color: r.status === 'approved' ? '#065f46' : 
                               r.status === 'rejected' ? '#991b1b' : '#92400e',
                        textTransform: 'capitalize'
                      }}>
                        {r.status}
                      </span>
                    </td>
                   <td style={tdStyle}>
  {r.status === 'pending' ? (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <button 
        onClick={() => handleApproveReview(r.id)} 
        disabled={reviewActionLoading === r.id}
        style={{
          padding: '0.5rem 1rem',
          borderRadius: '0.375rem',
          border: 'none',
          fontSize: '0.75rem',
          fontWeight: '500',
          cursor: reviewActionLoading === r.id ? 'wait' : 'pointer',
          background: '#059669',
          color: 'white',
          opacity: reviewActionLoading === r.id ? 0.6 : 1,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem'
        }}
      >
        {reviewActionLoading === r.id ? (
          <>
            <span style={{ 
              display: 'inline-block', 
              width: '0.75rem', 
              height: '0.75rem', 
              border: '2px solid white',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></span>
            ...
          </>
        ) : (
          <>✓ Approve</>
        )}
      </button>
      <button 
        onClick={() => handleRejectReview(r.id)} 
        disabled={reviewActionLoading === r.id}
        style={{
          padding: '0.5rem 1rem',
          borderRadius: '0.375rem',
          border: 'none',
          fontSize: '0.75rem',
          fontWeight: '500',
          cursor: reviewActionLoading === r.id ? 'wait' : 'pointer',
          background: '#dc2626',
          color: 'white',
          opacity: reviewActionLoading === r.id ? 0.6 : 1,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem'
        }}
      >
        ✗ Reject
      </button>
    </div>
  ) : r.status === 'approved' ? (
    <span style={{ 
      color: '#059669', 
      fontSize: '0.875rem',
      fontWeight: '500',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.25rem'
    }}>
      <span>✓</span> Approved
    </span>
  ) : (
    <span style={{ 
      color: '#dc2626', 
      fontSize: '0.875rem',
      fontWeight: '500',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.25rem'
    }}>
      <span>✗</span> Rejected
    </span>
  )}
</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    )}
    
    {/* Pagination for reviews */}
    {totalReviewPages > 1 && (
      <div style={{ 
        marginTop: '2rem',
        padding: '1rem 0',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <button
          onClick={() => setReviewPage(prev => Math.max(1, prev - 1))}
          disabled={reviewPage === 1}
          style={{
            padding: '0.5rem 1rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            background: 'white',
            cursor: reviewPage === 1 ? 'not-allowed' : 'pointer',
            opacity: reviewPage === 1 ? 0.5 : 1
          }}
        >
          Previous
        </button>
        <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>
          Page {reviewPage} of {totalReviewPages}
        </span>
        <button
          onClick={() => setReviewPage(prev => Math.min(totalReviewPages, prev + 1))}
          disabled={reviewPage === totalReviewPages}
          style={{
            padding: '0.5rem 1rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            background: 'white',
            cursor: reviewPage === totalReviewPages ? 'not-allowed' : 'pointer',
            opacity: reviewPage === totalReviewPages ? 0.5 : 1
          }}
        >
          Next
        </button>
      </div>
    )}
  </div>
)}
        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
              <span style={{ fontSize: '1.5rem' }}>⚙️</span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>Platform Settings</h2>
            </div>

            {settingsError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', color: '#dc2626' }}>
                {settingsError}
              </div>
            )}
            {settingsSuccess && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', color: '#16a34a' }}>
                {settingsSuccess}
              </div>
            )}

            <div style={{ display: 'grid', gap: '2rem', maxWidth: '600px' }}>
              {/* Commission Rate */}
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                  Commission Rate (%)
                </label>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                  Platform commission charged on each booking (1% - 30%)
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    step="0.5"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(e.target.value)}
                    style={{
                      width: '120px',
                      padding: '0.75rem 1rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      fontWeight: '600'
                    }}
                  />
                  <span style={{ fontSize: '1.25rem', fontWeight: '600', color: '#374151' }}>%</span>
                </div>
              </div>

              {/* Subscription Price */}
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                  Monthly Subscription Price per Bus (ZMW)
                </label>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                  Amount companies pay monthly for each bus (K100 - K5000)
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: '600', color: '#374151' }}>K</span>
                  <input
                    type="number"
                    min="100"
                    max="5000"
                    step="50"
                    value={subscriptionPrice}
                    onChange={(e) => setSubscriptionPrice(e.target.value)}
                    style={{
                      width: '150px',
                      padding: '0.75rem 1rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      fontWeight: '600'
                    }}
                  />
                  <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>/month</span>
                </div>
              </div>

              {/* Trial Period */}
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                  Free Trial Period (Days)
                </label>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                  Number of days new buses can operate before requiring subscription (0 - 90)
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="number"
                    min="0"
                    max="90"
                    step="1"
                    value={trialDays}
                    onChange={(e) => setTrialDays(e.target.value)}
                    style={{
                      width: '120px',
                      padding: '0.75rem 1rem',
                      border: '2px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      fontWeight: '600'
                    }}
                  />
                  <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>days</span>
                </div>
              </div>

              {/* Save Button */}
              <div style={{ paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                <button
                  onClick={async () => {
                    setSettingsSaving(true);
                    setSettingsError('');
                    setSettingsSuccess('');
                    try {
                      const token = localStorage.getItem('token');
                      const response = await fetch('/api/admin/settings', {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                          commission_rate: parseFloat(commissionRate) / 100,
                          subscription_price_per_bus: parseFloat(subscriptionPrice),
                          subscription_trial_days: parseInt(trialDays)
                        })
                      });
                      const data = await response.json();
                      if (response.ok) {
                        setSettingsSuccess('Settings saved successfully!');
                        // Update stats to reflect new values
                        if (stats) {
                          setStats({
                            ...stats,
                            commissionRate: parseFloat(commissionRate),
                            subscriptionPricePerBus: parseFloat(subscriptionPrice)
                          });
                        }
                      } else {
                        setSettingsError(data.error || 'Failed to save settings');
                      }
                    } catch (error) {
                      setSettingsError('Network error. Please try again.');
                    } finally {
                      setSettingsSaving(false);
                    }
                  }}
                  disabled={settingsSaving}
                  style={{
                    padding: '0.875rem 2rem',
                    background: settingsSaving ? '#9ca3af' : '#1f2937',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: settingsSaving ? 'not-allowed' : 'pointer'
                  }}
                >
                  {settingsSaving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>

              {/* Current Values Info */}
              <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '0.5rem', marginTop: '1rem' }}>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Current Active Values:</p>
                <ul style={{ fontSize: '0.875rem', color: '#374151', listStyle: 'none', padding: 0, margin: 0 }}>
                  <li>• Commission: {stats?.commissionRate || 7.5}% of each booking</li>
                  <li>• Subscription: K{stats?.subscriptionPricePerBus || 500}/bus/month</li>
                  <li>• Trial Period: {trialDays} days for new buses</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Company Verification Details Modal */}
        {viewingUser && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50
          }}>
            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '2rem',
              maxWidth: '32rem',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>
                  Company Verification Details
                </h3>
                <button
                  onClick={() => setViewingUser(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    color: '#6b7280'
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Company Name</p>
                  <p style={{ fontWeight: '600', color: '#1f2937' }}>{viewingUser.company_name || viewingUser.name}</p>
                </div>

                <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Contact Email</p>
                  <p style={{ fontWeight: '600', color: '#1f2937' }}>{viewingUser.email}</p>
                </div>

                <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Phone Number</p>
                  <p style={{ fontWeight: '600', color: '#1f2937' }}>{viewingUser.phone}</p>
                </div>

                <div style={{ padding: '1rem', background: '#fef3c7', borderRadius: '0.5rem', border: '1px solid #fcd34d' }}>
                  <p style={{ fontSize: '0.75rem', color: '#92400e', marginBottom: '0.25rem' }}>RTSA License Number</p>
                  <p style={{ fontWeight: '600', color: '#78350f' }}>{viewingUser.license_number || 'Not provided'}</p>
                </div>

                <div style={{ padding: '1rem', background: '#dbeafe', borderRadius: '0.5rem', border: '1px solid #93c5fd' }}>
                  <p style={{ fontSize: '0.75rem', color: '#1e40af', marginBottom: '0.25rem' }}>PACRA Registration Number</p>
                  <p style={{ fontWeight: '600', color: '#1e3a8a' }}>{viewingUser.company_registration_number || 'Not provided'}</p>
                </div>

                <div style={{ padding: '1rem', background: '#f3e8ff', borderRadius: '0.5rem', border: '1px solid #c4b5fd' }}>
                  <p style={{ fontSize: '0.75rem', color: '#6b21a8', marginBottom: '0.25rem' }}>Company Address</p>
                  <p style={{ fontWeight: '600', color: '#581c87' }}>{viewingUser.company_address || 'Not provided'}</p>
                </div>

                <div style={{ padding: '1rem', background: viewingUser.status === 'active' ? '#d1fae5' : viewingUser.status === 'suspended' ? '#fee2e2' : '#fef3c7', borderRadius: '0.5rem' }}>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Current Status</p>
                  <p style={{ 
                    fontWeight: '600', 
                    color: viewingUser.status === 'active' ? '#065f46' : viewingUser.status === 'suspended' ? '#991b1b' : '#92400e' 
                  }}>
                    {viewingUser.status === 'pending_verification' ? 'Pending Verification' : viewingUser.status?.toUpperCase() || 'ACTIVE'}
                  </p>
                </div>

                <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Registration Date</p>
                  <p style={{ fontWeight: '600', color: '#1f2937' }}>{new Date(viewingUser.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                {(viewingUser.status === 'pending_verification' || viewingUser.status === 'pending') && (
                  <>
                    <button
                      onClick={() => {
                        updateUserStatus(viewingUser.id, 'active');
                        setViewingUser(null);
                      }}
                      style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: '0.5rem',
                        border: 'none',
                        background: '#059669',
                        color: 'white',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      ✓ Approve Company
                    </button>
                    <button
                      onClick={() => {
                        updateUserStatus(viewingUser.id, 'suspended');
                        setViewingUser(null);
                      }}
                      style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: '0.5rem',
                        border: 'none',
                        background: '#dc2626',
                        color: 'white',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      ✗ Reject Company
                    </button>
                  </>
                )}
                <button
                  onClick={() => setViewingUser(null)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #d1d5db',
                    background: 'white',
                    color: '#374151',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
       {/* Add the style tag here, at the very end, before closing the main div */}
    <style jsx>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: string | number; icon: string; color: string }) {
  return (
    <div style={{
      background: 'white',
      padding: '1.5rem',
      borderRadius: '1rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      borderLeft: `4px solid ${color}`
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>{title}</p>
          <p style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1f2937' }}>{value}</p>
        </div>
        <span style={{ fontSize: '1.5rem' }}>{icon}</span>
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  textAlign: 'left',
  fontSize: '0.75rem',
  fontWeight: '600',
  color: '#6b7280',
  textTransform: 'uppercase'
};

const tdStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  fontSize: '0.875rem',
  color: '#374151'
};

// Sortable column header component
function SortHeader({ field, label, currentSort, onSort }: { 
  field: string; 
  label: string; 
  currentSort: { field: string; direction: 'asc' | 'desc' }; 
  onSort: (field: string) => void 
}) {
  const isActive = currentSort.field === field;
  return (
    <th 
      style={{ ...thStyle, cursor: 'pointer', userSelect: 'none' }}
      onClick={() => onSort(field)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        {label}
        <span style={{ opacity: isActive ? 1 : 0.3, fontSize: '0.625rem' }}>
          {isActive && currentSort.direction === 'asc' ? '▲' : '▼'}
        </span>
      </div>
    </th>
  );
}

// Pagination component
function Pagination({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (page: number) => void }) {
  const pages: (number | string)[] = [];
  
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div style={{ 
      padding: '1rem 1.5rem', 
      borderTop: '1px solid #e5e7eb', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '0.5rem'
    }}>
      <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
        Page {currentPage} of {totalPages}
      </span>
      <div style={{ display: 'flex', gap: '0.25rem' }}>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={{
            padding: '0.5rem 0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            background: 'white',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            opacity: currentPage === 1 ? 0.5 : 1,
            fontSize: '0.875rem'
          }}
        >
          Previous
        </button>
        {pages.map((page, idx) => (
          <button
            key={idx}
            onClick={() => typeof page === 'number' && onPageChange(page)}
            disabled={typeof page !== 'number'}
            style={{
              padding: '0.5rem 0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              background: page === currentPage ? '#1f2937' : 'white',
              color: page === currentPage ? 'white' : '#374151',
              cursor: typeof page === 'number' ? 'pointer' : 'default',
              fontSize: '0.875rem',
              minWidth: '2.5rem'
            }}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{
            padding: '0.5rem 0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            background: 'white',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            opacity: currentPage === totalPages ? 0.5 : 1,
            fontSize: '0.875rem'
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
}