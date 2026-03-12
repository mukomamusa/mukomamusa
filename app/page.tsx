
'use client';
// At the top of your page component (after imports)
import InstallPrompt from '@/app/components/InstallPrompt';
import PWAUpdatePrompt from '@/app/components/PWAUpdatePrompt';

// Helper: Get average rating and latest reviews for a company
// Replace your existing getCompanyReviewStats with this:
const getCompanyReviewStats = (companyName: string, companyReviews: { [companyName: string]: any[] }) => {
  const reviews = companyReviews[companyName] || [];
  
  if (reviews.length === 0) {
    return { 
      avg: null, 
      total: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
  }
  
  // Calculate average
  const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
  const avg = (sum / reviews.length).toFixed(1);
  
  // Calculate rating distribution
  const distribution = {
    1: reviews.filter(r => r.rating === 1).length,
    2: reviews.filter(r => r.rating === 2).length,
    3: reviews.filter(r => r.rating === 3).length,
    4: reviews.filter(r => r.rating === 4).length,
    5: reviews.filter(r => r.rating === 5).length
  };
  
  return { 
    avg, 
    total: reviews.length,
    distribution,
    latest: reviews.slice(0, 3) // Keep for quick preview
  };
};

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cityNames } from './lib/zambia-data';
// Add debouncing for search to prevent too many API calls

// Custom debounce hook - add this after your imports
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
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
  company_logo_url?: string;
  bus_preview_image?: string;
  bus_images?: { image_url: string; image_type: string }[];
}

interface User {
  id: number;
  name: string;
  email: string;
  user_type: 'customer' | 'company' | 'admin';
}

// Helper functions
const formatTime = (timeString: string) => {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const formatShortDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
};

// Seat availability color coding
const getSeatColor = (availableSeats: number) => {
  if (availableSeats > 10) return { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300', label: 'Many seats' };
  if (availableSeats >= 5) return { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300', label: 'Limited seats' };
  if (availableSeats > 0) return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', label: 'Almost full' };
  return { bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-300', label: 'Sold out' };
};

// Available amenities for filtering
const AVAILABLE_AMENITIES = [
  { id: 'wifi', label: 'WiFi', icon: '📶' },
  { id: 'ac', label: 'AC', icon: '❄️' },
  { id: 'reclining', label: 'Reclining Seats', icon: '💺' },
  { id: 'usb', label: 'USB Charging', icon: '🔌' },
  { id: 'toilet', label: 'Toilet', icon: '🚻' },
  { id: 'refreshments', label: 'Refreshments', icon: '🥤' },
  { id: 'entertainment', label: 'Entertainment', icon: '🎬' },
  { id: 'blanket', label: 'Blanket', icon: '🛏️' },
];

// Check if route has specific amenity
const hasAmenity = (amenities: string, amenityId: string): boolean => {
  if (!amenities) return false;
  const amenityLower = amenities.toLowerCase();
  const checkMap: { [key: string]: string[] } = {
    'wifi': ['wifi', 'wi-fi', 'wireless'],
    'ac': ['ac', 'air conditioning', 'air-conditioning', 'aircon'],
    'reclining': ['reclining', 'recline'],
    'usb': ['usb', 'charging', 'charger'],
    'toilet': ['toilet', 'restroom', 'bathroom', 'wc'],
    'refreshments': ['refreshment', 'snack', 'drink', 'food'],
    'entertainment': ['entertainment', 'tv', 'movie', 'screen'],
    'blanket': ['blanket', 'pillow', 'bedding'],
  };
  const keywords = checkMap[amenityId] || [amenityId];
  return keywords.some(kw => amenityLower.includes(kw));
};

// Generate date range for carousel
const getDateRange = (centerDate: string, range: number = 3): string[] => {
  const dates: string[] = [];
  const center = new Date(centerDate);
  for (let i = -range; i <= range; i++) {
    const d = new Date(center);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
};

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  // Reviews state
  const [companyReviews, setCompanyReviews] = useState<{ [companyName: string]: any[] }>({});
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewPopupCompany, setReviewPopupCompany] = useState<string | null>(null);
  const [reviewPopupReviews, setReviewPopupReviews] = useState<any[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchParams, setSearchParams] = useState({
    origin: 'Lusaka',
    destination: '',
    date: new Date().toISOString().split('T')[0],
  });
  
  // Use the custom debounce hook
  const debouncedSearchParams = useDebounce(searchParams, 500);
  
  // Then use debouncedSearchParams in your useEffect
  useEffect(() => {
    if (debouncedSearchParams.destination) {
      searchRoutes();
    }
  }, [debouncedSearchParams.origin, debouncedSearchParams.destination, debouncedSearchParams.date]);


  // Fetch reviews for all companies in routes
useEffect(() => {
  if (routes.length === 0) return;
  
  const fetchAllReviews = async () => {
    setReviewLoading(true);
    try {
      // Get unique company IDs from routes
      const companyIds = [...new Set(routes.map(r => r.company_id))];
      
      // Fetch reviews for all companies at once (if your API supports it)
      // Option 1: Fetch all approved reviews (if API supports filtering by status)
      const res = await fetch('/api/reviews?status=approved');
      if (!res.ok) throw new Error('Failed to fetch reviews');
      
      const allReviews = await res.json();
      
      // Group reviews by company name
      const reviewMap: { [companyName: string]: any[] } = {};
      
      routes.forEach(route => {
        // Filter reviews for this specific company
        const companyReviews = allReviews.filter(
          (r: any) => r.company_id === route.company_id && r.status === 'approved'
        );
        
        // Add company name to each review for display
        const reviewsWithCompany = companyReviews.map((r: any) => ({
          ...r,
          company_name: route.company_name
        }));
        
        reviewMap[route.company_name] = reviewsWithCompany;
      });
      
      setCompanyReviews(reviewMap);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setReviewLoading(false);
    }
  };
  
  fetchAllReviews();
}, [routes]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    busType: '',
    priceMin: '',
    priceMax: '',
    timeOfDay: '', // morning, afternoon, evening
    amenities: [] as string[], // Selected amenity IDs
  });
  const [sortBy, setSortBy] = useState('departure'); // departure, price-asc, price-desc, seats
  const [flexibleDateSearch, setFlexibleDateSearch] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateRange, setDateRange] = useState<string[]>([]);
  
  // Bus images lightbox state
  const [showBusGallery, setShowBusGallery] = useState(false);
  const [galleryImages, setGalleryImages] = useState<{ image_url: string; image_type: string }[]>([]);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [galleryBusName, setGalleryBusName] = useState('');

  // Calculate lowest price and best options for badges
  const getRouteBadges = useMemo(() => {
    if (routes.length === 0) return {};
    const lowestPrice = Math.min(...routes.map(r => r.price));
    const mostSeats = Math.max(...routes.map(r => r.available_seats));
    const badges: { [key: number]: string[] } = {};
    
    routes.forEach(route => {
      badges[route.id] = [];
      if (route.price === lowestPrice && routes.length > 1) badges[route.id].push('Lowest Price');
      if (route.available_seats === mostSeats && mostSeats > 10 && routes.length > 1) badges[route.id].push('Most Seats');
      if (route.bus_type?.toLowerCase().includes('vip') || route.bus_type?.toLowerCase().includes('luxury')) badges[route.id].push('VIP Coach');
      if (route.bus_type?.toLowerCase().includes('express') || route.bus_type?.toLowerCase().includes('direct')) badges[route.id].push('Express');
    });
    return badges;
  }, [routes]);

  // Toggle amenity filter
  const toggleAmenity = (amenityId: string) => {
    setFilters(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter(a => a !== amenityId)
        : [...prev.amenities, amenityId]
    }));
  };

  // Filter and sort routes
  const getFilteredRoutes = () => {
    let filtered = [...routes];

    // Apply bus type filter
    if (filters.busType) {
      filtered = filtered.filter(r => r.bus_type === filters.busType);
    }

    // Apply price filters
    if (filters.priceMin) {
      filtered = filtered.filter(r => r.price >= parseInt(filters.priceMin));
    }
    if (filters.priceMax) {
      filtered = filtered.filter(r => r.price <= parseInt(filters.priceMax));
    }

    // Apply time of day filter
    if (filters.timeOfDay) {
      filtered = filtered.filter(r => {
        const hour = parseInt(r.departure_time.split(':')[0]);
        if (filters.timeOfDay === 'morning') return hour >= 5 && hour < 12;
        if (filters.timeOfDay === 'afternoon') return hour >= 12 && hour < 17;
        if (filters.timeOfDay === 'evening') return hour >= 17 || hour < 5;
        return true;
      });
    }

    // Apply amenity filters
    if (filters.amenities.length > 0) {
      filtered = filtered.filter(r => 
        filters.amenities.every(amenityId => hasAmenity(r.amenities || '', amenityId))
      );
    }

    // Apply sorting
    if (sortBy === 'price-asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'seats') {
      filtered.sort((a, b) => b.available_seats - a.available_seats);
    } else {
      // Default: departure time, then date
      filtered.sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.departure_time.localeCompare(b.departure_time);
      });
    }

    return filtered;
  };

  const filteredRoutes = getFilteredRoutes();
  const busTypes = [...new Set(routes.map(r => r.bus_type).filter(Boolean))];

  const clearFilters = () => {
    setFilters({ busType: '', priceMin: '', priceMax: '', timeOfDay: '', amenities: [] });
    setSortBy('departure');
  };

  const searchRoutes = async (overrideDate?: string, flexible: boolean = flexibleDateSearch) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchParams.origin) params.append('origin', searchParams.origin);
      if (searchParams.destination) params.append('destination', searchParams.destination);
      
      const dateToUse = overrideDate || searchParams.date;
      if (dateToUse) {
        params.append('date', dateToUse);
        if (flexible) {
          params.append('flexible_days', '3');
        }
      }

      const response = await fetch(`/api/routes?${params.toString()}`);
      const data = await response.json();
      setRoutes(data.routes || []);
      
      // Update date range for carousel
      if (dateToUse) {
        setDateRange(getDateRange(dateToUse, 3));
        setSelectedDate(dateToUse);
      }
    } catch (error) {
      console.error('Error searching routes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle date selection from carousel
  const handleDateSelect = (date: string) => {
    setSearchParams(prev => ({ ...prev, date }));
    setSelectedDate(date);
    searchRoutes(date, flexibleDateSearch);
  };

  useEffect(() => {
    searchRoutes();
  }, []);

  // Check authentication status
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch {
        // Invalid user data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu) {
        const target = event.target as HTMLElement;
        if (!target.closest('[data-user-menu]')) {
          setShowUserMenu(false);
        }
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showUserMenu]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setShowUserMenu(false);
    router.refresh();
  };
// Review popup modal
  const closeReviewPopup = () => {
    setReviewPopupCompany(null);
    setReviewPopupReviews([]);
  };
  
  const getDashboardLink = () => {
    if (!user) return '/customer/login';
    if (user.user_type === 'admin') return '/admin/dashboard';
    if (user.user_type === 'company') return '/company/enhanced-dashboard';
    return '/customer/dashboard';
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #E8F5E6, white, #FFF3E6)' }}>
      {/* Header with Zambian Flag Colors */}
      <header style={{ 
        background: 'white', 
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        borderBottom: '4px solid #198A00',
        position: 'sticky',
        top: 0,
        zIndex: 1000
        // Updated header text
        // ...existing code...
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
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
                  background: 'linear-gradient(135deg, #E8F5E6, #FFF3E6)',
                  border: '2px solid #198A00',
                  boxShadow: '0 6px 14px rgba(0, 0, 0, 0.2)'
                }}
              />
              <div>
                <h1 style={{ 
                  fontSize: '1.875rem', 
                  fontWeight: 'bold',
                  background: 'linear-gradient(to right, #198A00, #EF7D00)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  VayaZed Bus Booking
                </h1>
                <p style={{ fontSize: '0.875rem', color: '#666', fontWeight: '500' }}>Travel Across Zambia with Comfort & Safety</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {user ? (
                <>
                  {/* Dashboard Button */}
                  <Link 
                    href={getDashboardLink()}
                    style={{
                      padding: '0.625rem 1.25rem',
                      background: 'linear-gradient(to right, #198A00, #116600)',
                      color: 'white',
                      borderRadius: '0.5rem',
                      fontWeight: '600',
                      textDecoration: 'none',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      transition: 'all 0.3s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    Dashboard
                  </Link>

                  {/* User Menu Dropdown */}
                  <div style={{ position: 'relative' }} data-user-menu>
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        background: '#f0f9f0',
                        border: '2px solid #198A00',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontWeight: '500',
                        color: '#198A00'
                      }}
                    >
                      <div style={{
                        width: '2rem',
                        height: '2rem',
                        background: 'linear-gradient(to right, #198A00, #EF7D00)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.875rem'
                      }}>
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user.name?.split(' ')[0] || 'User'}
                      </span>
                      <svg style={{ width: '1rem', height: '1rem', transition: 'transform 0.2s', transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {showUserMenu && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: '0.5rem',
                        background: 'white',
                        borderRadius: '0.5rem',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                        border: '1px solid #e5e7eb',
                        minWidth: '200px',
                        zIndex: 50,
                        overflow: 'hidden'
                      }}>
                        {/* User Info */}
                        <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                          <p style={{ fontWeight: '600', color: '#198A00', marginBottom: '0.25rem' }}>{user.name}</p>
                          <p style={{ fontSize: '0.75rem', color: '#666' }}>{user.email}</p>
                          <span style={{ 
                            display: 'inline-block',
                            marginTop: '0.5rem',
                            fontSize: '0.625rem',
                            padding: '0.25rem 0.5rem',
                            background: user.user_type === 'admin' ? '#fef3c7' : user.user_type === 'company' ? '#dbeafe' : '#dcfce7',
                            color: user.user_type === 'admin' ? '#92400e' : user.user_type === 'company' ? '#1e40af' : '#166534',
                            borderRadius: '9999px',
                            fontWeight: '600',
                            textTransform: 'uppercase'
                          }}>
                            {user.user_type}
                          </span>
                        </div>

                        {/* Menu Items */}
                        {user.user_type === 'customer' && (
                          <>
                            <Link href="/customer/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', color: '#374151', textDecoration: 'none', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                              <svg style={{ width: '1.25rem', height: '1.25rem', color: '#198A00' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                              </svg>
                              My Bookings
                            </Link>
                          </>
                        )}

                        <button
                          onClick={handleLogout}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem 1rem',
                            color: '#dc2626',
                            width: '100%',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            textAlign: 'left',
                            borderTop: '1px solid #e5e7eb',
                            fontSize: '1rem'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link 
                    href="/customer/login" 
                    style={{
                      padding: '0.625rem 1.25rem',
                      color: '#198A00',
                      border: '2px solid #198A00',
                      borderRadius: '0.5rem',
                      fontWeight: '600',
                      textDecoration: 'none',
                      transition: 'all 0.3s'
                    }}
                  >
                    Customer Login
                  </Link>
                  <Link
                    href="/driver/login"
                    style={{
                      padding: '0.625rem 1.25rem',
                      color: '#EF7D00',
                      border: '2px solid #EF7D00',
                      borderRadius: '0.5rem',
                      fontWeight: '600',
                      textDecoration: 'none',
                      transition: 'all 0.3s'
                    }}
                  >
                    Driver Login
                  </Link>
                  <Link
                    href="/agent/login"
                    style={{
                      padding: '0.625rem 1.25rem',
                      background: '#198A00',
                      color: 'white',
                      borderRadius: '0.5rem',
                      fontWeight: '600',
                      textDecoration: 'none',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      transition: 'all 0.3s'
                    }}
                  >
                    Agent Login
                  </Link>
                  <Link 
                    href="/company/login" 
                    style={{
                      padding: '0.625rem 1.25rem',
                      background: 'linear-gradient(to right, #198A00, #116600)',
                      color: 'white',
                      borderRadius: '0.5rem',
                      fontWeight: '600',
                      textDecoration: 'none',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      transition: 'all 0.3s'
                    }}
                  >
                    Company Login
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Zambian Theme */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 1rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: '#FFE0BF',
            padding: '0.5rem 1rem',
            borderRadius: '9999px',
            marginBottom: '1rem'
          }}>
            <span style={{ fontWeight: 'bold', color: '#198A00' }}>ZM</span>
            <span style={{ color: '#BD6200', fontWeight: '600' }}>Proudly Zambian</span>
          </div>
          
          <h2 style={{ fontSize: '3rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>
            Travel Across <span style={{ color: '#198A00' }}>Zambia</span> with Ease
          </h2>
          
          <p style={{ fontSize: '1.25rem', color: '#4b5563', maxWidth: '48rem', margin: '0 auto' }}>
            Book intercity bus tickets to over <span style={{ fontWeight: 'bold', color: '#EF7D00' }}>40+ destinations</span> across all 10 provinces
          </p>
        </div>

        {/* Search Form */}
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '1rem',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          maxWidth: '56rem',
          margin: '0 auto 3rem'
        }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#198A00', marginBottom: '1.5rem', textAlign: 'center' }}>
            Search for Buses
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '600', color: '#198A00', marginBottom: '0.5rem' }}>From</label>
              <select 
                value={searchParams.origin}
                onChange={(e) => setSearchParams({...searchParams, origin: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #198A00',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  background: 'white'
                }}
              >
                {cityNames.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', fontWeight: '600', color: '#198A00', marginBottom: '0.5rem' }}>To</label>
              <select 
                value={searchParams.destination}
                onChange={(e) => setSearchParams({...searchParams, destination: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #198A00',
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  background: 'white'
                }}
              >
                <option value="">Select destination</option>
                {cityNames.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', fontWeight: '600', color: '#198A00', marginBottom: '0.5rem' }}>Date</label>
              <input 
                type="date" 
                value={searchParams.date}
                onChange={(e) => setSearchParams({...searchParams, date: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #198A00',
                  borderRadius: '0.5rem',
                  fontSize: '1rem'
                }} 
              />
            </div>
          </div>
          
          {/* Flexible Date Toggle */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem', 
            marginBottom: '1rem',
            padding: '0.75rem 1rem',
            background: flexibleDateSearch ? '#E8F5E6' : '#f5f5f5',
            borderRadius: '0.5rem',
            border: flexibleDateSearch ? '2px solid #198A00' : '2px solid transparent',
            transition: 'all 0.2s'
          }}>
            <input
              type="checkbox"
              id="flexibleDate"
              checked={flexibleDateSearch}
              onChange={(e) => setFlexibleDateSearch(e.target.checked)}
              style={{ width: '1.25rem', height: '1.25rem', accentColor: '#198A00' }}
            />
            <label htmlFor="flexibleDate" style={{ color: '#333', fontWeight: '500', cursor: 'pointer', flex: 1 }}>
              Flexible dates (±3 days)
            </label>
            <span style={{ fontSize: '0.875rem', color: '#666' }}>
              Show buses from {flexibleDateSearch ? '7 days' : 'selected date only'}
            </span>
          </div>
          
          <button 
            onClick={() => searchRoutes()}
            disabled={loading}
            style={{
              width: '100%',
              padding: '1rem',
              background: loading ? '#ccc' : 'linear-gradient(to right, #198A00, #EF7D00)',
              color: 'white',
              fontSize: '1.125rem',
              fontWeight: 'bold',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              transition: 'all 0.3s'
            }}
          >
            {loading ? 'Searching...' : 'Search Buses'}
          </button>
          
          {/* Date Carousel - Show when flexible search and results exist */}
          {(flexibleDateSearch || dateRange.length > 0) && routes.length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#666', marginBottom: '0.75rem', textAlign: 'center' }}>
                Compare dates
              </h4>
              <div style={{ 
                display: 'flex', 
                gap: '0.5rem', 
                overflowX: 'auto', 
                padding: '0.5rem',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}>
                {(dateRange.length > 0 ? dateRange : getDateRange(searchParams.date, 3)).map(date => {
                  const routesOnDate = routes.filter(r => r.date === date);
                  const minPriceOnDate = routesOnDate.length > 0 ? Math.min(...routesOnDate.map(r => r.price)) : null;
                  const isSelected = date === selectedDate;
                  const isToday = date === new Date().toISOString().split('T')[0];
                  
                  return (
                    <button
                      key={date}
                      onClick={() => handleDateSelect(date)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '0.75rem 1rem',
                        minWidth: '100px',
                        background: isSelected ? 'linear-gradient(to bottom, #198A00, #116600)' : 'white',
                        color: isSelected ? 'white' : '#333',
                        border: isSelected ? '2px solid #198A00' : '2px solid #ddd',
                        borderRadius: '0.75rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        position: 'relative'
                      }}
                    >
                      {isToday && (
                        <span style={{
                          position: 'absolute',
                          top: '-8px',
                          fontSize: '0.65rem',
                          fontWeight: 'bold',
                          background: '#EF7D00',
                          color: 'white',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          Today
                        </span>
                      )}
                      <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                        {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                      <span style={{ fontWeight: 'bold', fontSize: '1rem' }}>
                        {new Date(date).getDate()}
                      </span>
                      <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                        {new Date(date).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      {routesOnDate.length > 0 ? (
                        <span style={{ 
                          fontSize: '0.7rem', 
                          marginTop: '0.25rem',
                          fontWeight: '600',
                          color: isSelected ? '#FFE0BF' : '#198A00'
                        }}>
                          {routesOnDate.length} bus{routesOnDate.length > 1 ? 'es' : ''}
                          {minPriceOnDate && <span style={{ display: 'block' }}>from K{minPriceOnDate}</span>}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.7rem', marginTop: '0.25rem', opacity: 0.5 }}>
                          No buses
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Filter & Sort Section */}
        {routes.length > 0 && (
          <div style={{
            background: 'white',
            padding: '1rem 1.5rem',
            borderRadius: '1rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            maxWidth: '56rem',
            margin: '0 auto 1.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <button
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  background: showFilters ? '#E8F5E6' : 'white',
                  border: '2px solid #198A00',
                  borderRadius: '0.5rem',
                  color: '#198A00',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters {(filters.busType || filters.priceMin || filters.priceMax || filters.timeOfDay || filters.amenities.length > 0) && (
                  <span style={{
                    background: '#EF7D00',
                    color: 'white',
                    borderRadius: '50%',
                    width: '1.25rem',
                    height: '1.25rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 'bold'
                  }}>
                    {[filters.busType, filters.priceMin, filters.priceMax, filters.timeOfDay].filter(Boolean).length + filters.amenities.length}
                  </span>
                )}
              </button>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <label style={{ fontWeight: '600', color: '#666', fontSize: '0.875rem' }}>Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '2px solid #ddd',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    background: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value="departure">Earliest Departure</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="seats">Most Seats Available</option>
                </select>
              </div>
            </div>

            {showFilters && (
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#666', marginBottom: '0.25rem' }}>Bus Type</label>
                    <select
                      value={filters.busType}
                      onChange={(e) => setFilters({...filters, busType: e.target.value})}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '0.5rem', fontSize: '0.875rem' }}
                    >
                      <option value="">All Types</option>
                      {busTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#666', marginBottom: '0.25rem' }}>Min Price (K)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={filters.priceMin}
                      onChange={(e) => setFilters({...filters, priceMin: e.target.value})}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '0.5rem', fontSize: '0.875rem' }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#666', marginBottom: '0.25rem' }}>Max Price (K)</label>
                    <input
                      type="number"
                      placeholder="1000"
                      value={filters.priceMax}
                      onChange={(e) => setFilters({...filters, priceMax: e.target.value})}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '0.5rem', fontSize: '0.875rem' }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#666', marginBottom: '0.25rem' }}>Time of Day</label>
                    <select
                      value={filters.timeOfDay}
                      onChange={(e) => setFilters({...filters, timeOfDay: e.target.value})}
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '0.5rem', fontSize: '0.875rem' }}
                    >
                      <option value="">Any Time</option>
                      <option value="morning">Morning (5AM - 12PM)</option>
                      <option value="afternoon">Afternoon (12PM - 5PM)</option>
                      <option value="evening">Evening (5PM - 5AM)</option>
                    </select>
                  </div>
                </div>
                
                {/* Amenity Filters */}
                <div style={{ marginTop: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#666', marginBottom: '0.5rem' }}>
                    Amenities
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {AVAILABLE_AMENITIES.map(amenity => (
                      <button
                        key={amenity.id}
                        onClick={() => toggleAmenity(amenity.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.375rem 0.75rem',
                          background: filters.amenities.includes(amenity.id) ? '#E8F5E6' : 'white',
                          border: filters.amenities.includes(amenity.id) ? '2px solid #198A00' : '1px solid #ddd',
                          borderRadius: '9999px',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          color: filters.amenities.includes(amenity.id) ? '#198A00' : '#666',
                          fontWeight: filters.amenities.includes(amenity.id) ? '600' : '400'
                        }}
                      >
                        <span>{amenity.icon}</span>
                        <span>{amenity.label}</span>
                        {filters.amenities.includes(amenity.id) && (
                          <span style={{ marginLeft: '0.25rem', fontWeight: 'bold' }}>✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div style={{ marginTop: '1rem', textAlign: 'right' }}>
                  <button
                    onClick={clearFilters}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'white',
                      border: '1px solid #ddd',
                      borderRadius: '0.5rem',
                      color: '#666',
                      fontSize: '0.875rem',
                      cursor: 'pointer'
                    }}
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Search Results */}
        {routes.length > 0 && (
          <div>
            <h3 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#198A00', marginBottom: '1.5rem', textAlign: 'center' }}>
              Available Buses ({filteredRoutes.length} of {routes.length} routes)
            </h3>
            
            {filteredRoutes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '1rem' }}>
                <svg style={{ width: '4rem', height: '4rem', color: '#ccc', margin: '0 auto 1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p style={{ color: '#666', fontSize: '1.125rem' }}>No buses match your filters.</p>
                <button onClick={clearFilters} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#198A00', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>
                  Clear Filters
                </button>
              </div>
            ) : (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {filteredRoutes.map((route) => {
                const seatColor = getSeatColor(route.available_seats);
                const badges = getRouteBadges[route.id] || [];
                
                return (
                <div 
                  key={route.id}
                  style={{
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: '1rem',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    border: '2px solid #E8F5E6',
                    transition: 'all 0.3s',
                    position: 'relative'
                  }}
                >
                  {/* Feature Badges */}
                  {badges.length > 0 && (
                    <div style={{ 
                      position: 'absolute', 
                      top: '-10px', 
                      left: '1rem', 
                      display: 'flex', 
                      gap: '0.5rem',
                      flexWrap: 'wrap'
                    }}>
                      {badges.map((badge, idx) => (
                        <span
                          key={idx}
                          style={{
                            padding: '0.25rem 0.75rem',
                            background: badge === 'Lowest Price' ? '#EF7D00' 
                              : badge === 'Most Seats' ? '#198A00'
                              : badge === 'VIP Coach' ? '#7c3aed'
                              : badge === 'Express' ? '#0891b2'
                              : '#666',
                            color: 'white',
                            fontSize: '0.7rem',
                            fontWeight: 'bold',
                            borderRadius: '9999px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }}
                        >
                          {badge === 'Lowest Price' && '💰 '}
                          {badge === 'Most Seats' && '🎫 '}
                          {badge === 'VIP Coach' && '⭐ '}
                          {badge === 'Express' && '⚡ '}
                          {badge}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Date display when flexible search */}
                  {flexibleDateSearch && (
                    <div style={{
                      position: 'absolute',
                      top: '0.75rem',
                      right: '0.75rem',
                      padding: '0.25rem 0.5rem',
                      background: '#f0f0f0',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      color: '#666',
                      fontWeight: '500'
                    }}>
                      {formatShortDate(route.date)}
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '1rem', marginTop: badges.length > 0 ? '0.5rem' : '0' }}>
                    <div style={{ flex: '1', minWidth: '250px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        {/* Company Logo or fallback icon */}
                        {route.company_logo_url ? (
                          <img 
                            src={route.company_logo_url} 
                            alt={route.company_name}
                            style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', objectFit: 'cover', border: '2px solid #E8F5E6' }}
                          />
                        ) : (
                          <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', background: '#E8F5E6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg style={{ width: '1.5rem', height: '1.5rem', color: '#198A00' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8m-8 4h8m-4 4v3m-6-3h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7a2 2 0 002 2zm0 0v3a1 1 0 001 1h2m8-4v3a1 1 0 01-1 1h-2" />
                            </svg>
                          </div>
                        )}
                        <div>
                          <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#198A00' }}>
                            {route.company_name}
                          </h4>
                          <p style={{ fontSize: '0.875rem', color: '#666' }}>
                            {route.bus_name} • {route.bus_type}
                          </p>
                          {/* Reviews summary */}
                          <div style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                            {reviewLoading ? (
                              <span style={{ color: '#666', fontSize: '0.875rem' }}>Loading reviews...</span>
                            ) : (
                              (() => {
                                const stats = getCompanyReviewStats(route.company_name, companyReviews);
                                if (!stats.avg) return <span style={{ color: '#666', fontSize: '0.875rem' }}>No reviews yet</span>;
                                return (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontWeight: 'bold', color: '#EF7D00', fontSize: '1rem' }}>★ {stats.avg}</span>
                                    <button
                                      style={{
                                        padding: '0.25rem 0.75rem',
                                        background: '#E8F5E6',
                                        color: '#198A00',
                                        borderRadius: '9999px',
                                        border: '1px solid #198A00',
                                        fontSize: '0.8rem',
                                        cursor: 'pointer',
                                        fontWeight: '600'
                                      }}
                                      onClick={() => {
                                        setReviewPopupCompany(route.company_name);
                                        setReviewPopupReviews(companyReviews[route.company_name] || []);
                                      }}
                                    >
                                      View Reviews
                                    </button>
                                  </div>
                                );
                              })()
                            )}
                          </div>
                          
                          {/* Reviews summary continued */}
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                        <div>
                          <p style={{ fontSize: '0.875rem', color: '#666' }}>From</p>
                          <p style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1f2937' }}>{route.origin}</p>
                          <p style={{ fontSize: '0.875rem', color: '#EF7D00', fontWeight: '600' }}>{formatTime(route.departure_time)}</p>
                        </div>
                        <div style={{ fontSize: '1.5rem', color: '#198A00' }}>→</div>
                        <div>
                          <p style={{ fontSize: '0.875rem', color: '#666' }}>To</p>
                          <p style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1f2937' }}>{route.destination}</p>
                          <p style={{ fontSize: '0.875rem', color: '#EF7D00', fontWeight: '600' }}>{formatTime(route.arrival_time)}</p>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        {route.amenities && route.amenities.split(',').map((amenity, idx) => (
                          <span 
                            key={idx}
                            style={{
                              padding: '0.25rem 0.75rem',
                              background: '#E8F5E6',
                              color: '#198A00',
                              borderRadius: '9999px',
                              fontSize: '0.875rem',
                              fontWeight: '500'
                            }}
                          >
                            {amenity.trim()}
                          </span>
                        ))}
                      </div>
                      
                      {/* Color-coded seat availability */}
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '0.5rem',
                        border: `2px solid`,
                        borderColor: seatColor.text.replace('text-', '').includes('emerald') ? '#059669' 
                          : seatColor.text.includes('amber') ? '#d97706' 
                          : seatColor.text.includes('red') ? '#dc2626' 
                          : '#9ca3af'
                      }}
                      className={`${seatColor.bg}`}
                      >
                        <div style={{
                          width: '0.75rem',
                          height: '0.75rem',
                          borderRadius: '50%',
                          background: seatColor.text.includes('emerald') ? '#059669' 
                            : seatColor.text.includes('amber') ? '#d97706' 
                            : seatColor.text.includes('red') ? '#dc2626' 
                            : '#9ca3af'
                        }}></div>
                        <span style={{
                          fontWeight: '600',
                          fontSize: '0.875rem',
                          color: seatColor.text.includes('emerald') ? '#059669' 
                            : seatColor.text.includes('amber') ? '#d97706' 
                            : seatColor.text.includes('red') ? '#dc2626' 
                            : '#9ca3af'
                        }}>
                          {route.available_seats} seats • {seatColor.label}
                        </span>
                      </div>
                    </div>
                    
                    <div style={{ textAlign: 'right', minWidth: '150px' }}>
                      {/* Bus Preview Image */}
                      {route.bus_preview_image && (
                        <div style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                          <div style={{ position: 'relative' }}>
                            <img 
                              src={route.bus_preview_image}
                              alt={`${route.bus_name} preview`}
                              style={{
                                width: '100px',
                                height: '60px',
                                objectFit: 'cover',
                                borderRadius: '0.5rem',
                                border: '2px solid #e5e7eb',
                                cursor: 'pointer'
                              }}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                // Open gallery with all bus images
                                if (route.bus_images && route.bus_images.length > 0) {
                                  setGalleryImages(route.bus_images);
                                  setGalleryBusName(route.bus_name);
                                  setGalleryIndex(0);
                                  setShowBusGallery(true);
                                } else if (route.bus_preview_image) {
                                  setGalleryImages([{ image_url: route.bus_preview_image, image_type: 'general' }]);
                                  setGalleryBusName(route.bus_name);
                                  setGalleryIndex(0);
                                  setShowBusGallery(true);
                                }
                              }}
                            />
                            {route.bus_images && route.bus_images.length > 1 && (
                              <span style={{
                                position: 'absolute',
                                bottom: '4px',
                                right: '4px',
                                background: 'rgba(0,0,0,0.6)',
                                color: 'white',
                                fontSize: '0.65rem',
                                padding: '2px 6px',
                                borderRadius: '4px'
                              }}>
                                +{route.bus_images.length - 1}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>Price</p>
                      <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#EF7D00', marginBottom: '1rem' }}>
                        K{route.price}
                      </p>
                      <Link
                        href={`/customer/book/${route.id}`}
                        style={{
                          display: 'inline-block',
                          padding: '0.75rem 1.5rem',
                          background: route.available_seats > 0 
                            ? 'linear-gradient(to right, #198A00, #EF7D00)' 
                            : '#ccc',
                          color: 'white',
                          fontWeight: 'bold',
                          borderRadius: '0.5rem',
                          textDecoration: 'none',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                          transition: 'all 0.3s',
                          pointerEvents: route.available_seats > 0 ? 'auto' : 'none'
                        }}
                      >
                        {route.available_seats > 0 ? 'Book Now →' : 'Sold Out'}
                      </Link>
                    </div>
                  </div>
                </div>
              )})}
            </div>
            )}
          </div>
        )}

        {routes.length === 0 && !loading && (
          <div style={{
            background: 'white',
            padding: '3rem',
            borderRadius: '1rem',
            textAlign: 'center',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem', color: '#198A00', fontWeight: 'bold' }}>?</div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#198A00', marginBottom: '0.5rem' }}>
              No routes found
            </h3>
            <p style={{ color: '#666' }}>
              Try selecting a different destination or date
            </p>
          </div>
        )}
      </section>

      {/* Features Section */}
      <section style={{ background: 'white', padding: '3rem 1rem', borderTop: '4px solid #198A00' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '2rem', fontWeight: 'bold', textAlign: 'center', color: '#198A00', marginBottom: '2rem' }}>
            Why Choose VayaZed Bus Booking?
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #E8F5E6, white)',
              padding: '2rem',
              borderRadius: '1rem',
              border: '2px solid #198A00',
              textAlign: 'center',
              transition: 'transform 0.3s'
            }}>
              <svg style={{ width: '3rem', height: '3rem', color: '#198A00', margin: '0 auto 1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#198A00', marginBottom: '0.5rem' }}>
                40+ Cities
              </h4>
              <p style={{ color: '#4b5563' }}>
                Travel to any destination across all 10 provinces of Zambia
              </p>
            </div>
            
            <div style={{ 
              background: 'linear-gradient(135deg, #FFF3E6, white)',
              padding: '2rem',
              borderRadius: '1rem',
              border: '2px solid #EF7D00',
              textAlign: 'center',
              transition: 'transform 0.3s'
            }}>
              <svg style={{ width: '3rem', height: '3rem', color: '#EF7D00', margin: '0 auto 1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#EF7D00', marginBottom: '0.5rem' }}>
                Easy Payment
              </h4>
              <p style={{ color: '#4b5563' }}>
                Pay with MTN, Airtel, Zamtel Mobile Money or Cards
              </p>
            </div>
            
            <div style={{ 
              background: 'linear-gradient(135deg, #FEE9E7, white)',
              padding: '2rem',
              borderRadius: '1rem',
              border: '2px solid #DE2010',
              textAlign: 'center',
              transition: 'transform 0.3s'
            }}>
              <svg style={{ width: '3rem', height: '3rem', color: '#DE2010', margin: '0 auto 1rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#DE2010', marginBottom: '0.5rem' }}>
                Instant Booking
              </h4>
              <p style={{ color: '#4b5563' }}>
                Get your ticket instantly with real-time seat availability
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#198A00', color: 'white', padding: '2rem 1rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            VayaZed Bus Booking System
          </p>
          <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>
            Making intercity travel across Zambia easy, safe, and convenient
          </p>
          <p style={{ fontSize: '0.75rem', marginTop: '1rem', opacity: 0.8 }}>
            © 2025 VayaZed Bus Booking - Moov Company All rights reserved.
          </p>
        </div>
      </footer>

      {/* Bus Reviews Popup Modal */}
     {reviewPopupCompany && (
  <div 
    style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.7)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}
    onClick={closeReviewPopup}
  >
    <div
      style={{
        background: 'white',
        borderRadius: '1rem',
        maxWidth: '500px',
        width: '90vw',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        padding: '2rem',
        position: 'relative',
        textAlign: 'left'
      }}
      onClick={e => e.stopPropagation()}
    >
      <button
        onClick={closeReviewPopup}
        style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          background: 'none',
          border: 'none',
          color: '#EF7D00',
          fontSize: '1.5rem',
          cursor: 'pointer',
          fontWeight: 'bold',
          zIndex: 2,
          width: '2rem',
          height: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        aria-label="Close reviews popup"
      >
        ×
      </button>
      
      <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#198A00', marginBottom: '1rem' }}>
        Reviews for {reviewPopupCompany}
      </h3>
      
      {reviewPopupReviews.length === 0 ? (
        <div style={{ 
          color: '#666', 
          fontSize: '1rem', 
          textAlign: 'center', 
          margin: '3rem 0',
          padding: '2rem',
          background: '#f9f9f9',
          borderRadius: '0.5rem'
        }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📝</span>
          No reviews yet for this company.
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          {(() => {
            const stats = getCompanyReviewStats(reviewPopupCompany, companyReviews);
            return (
              <div style={{
                background: 'linear-gradient(135deg, #E8F5E6, white)',
                padding: '1rem',
                borderRadius: '0.75rem',
                marginBottom: '1.5rem',
                border: '2px solid #198A00'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#EF7D00' }}>
                      {stats.avg}
                    </span>
                    <span style={{ fontSize: '1rem', color: '#666' }}> /5</span>
                    <div style={{ fontSize: '0.875rem', color: '#666' }}>
                      {stats.total} review{stats.total !== 1 ? 's' : ''}
                    </div>
                  </div>
                  
                  {/* Rating distribution bars */}
                  <div style={{ flex: 1 }}>
                    {[5,4,3,2,1].map(star => (
                      <div key={star} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem',
                        marginBottom: '0.25rem'
                      }}>
                        <span style={{ 
                          minWidth: '2rem', 
                          fontSize: '0.75rem',
                          color: '#666'
                        }}>
                          {star}★
                        </span>
                        <div style={{
                          flex: 1,
                          height: '0.5rem',
                          background: '#e5e7eb',
                          borderRadius: '9999px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${(stats.distribution[star as keyof typeof stats.distribution] / stats.total) * 100}%`,
                            height: '100%',
                            background: star >= 4 ? '#059669' : star >= 3 ? '#f59e0b' : '#dc2626',
                            borderRadius: '9999px'
                          }} />
                        </div>
                        <span style={{ 
                          minWidth: '2rem', 
                          fontSize: '0.75rem',
                          color: '#666',
                          textAlign: 'right'
                        }}>
                          {stats.distribution[star as keyof typeof stats.distribution]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
          
          {/* Reviews List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {reviewPopupReviews.map((review, idx) => (
              <div key={idx} style={{ 
                borderBottom: idx < reviewPopupReviews.length - 1 ? '1px solid #eee' : 'none',
                paddingBottom: '1rem'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  marginBottom: '0.5rem',
                  flexWrap: 'wrap'
                }}>
                  <span style={{ 
                    color: '#EF7D00', 
                    fontWeight: 'bold', 
                    fontSize: '1.1rem',
                    background: '#FFF3E6',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px'
                  }}>
                    ★ {review.rating}
                  </span>
                  <span style={{ 
                    color: '#198A00', 
                    fontWeight: '600', 
                    fontSize: '0.95rem' 
                  }}>
                    {review.customer_name || 'Anonymous Customer'}
                  </span>
                  <span style={{ 
                    color: '#888', 
                    fontSize: '0.8rem', 
                    marginLeft: 'auto' 
                  }}>
                    {review.created_at ? new Date(review.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    }) : ''}
                  </span>
                </div>
                <div style={{ 
                  color: '#444', 
                  fontSize: '1rem', 
                  whiteSpace: 'pre-line',
                  lineHeight: '1.5',
                  paddingLeft: '0.5rem'
                }}>
                  {review.review_text || review.comment || 'No comment provided.'}
                </div>
              </div>
            ))}
          </div>
          
          {/* Show more indicator if needed */}
          {reviewPopupReviews.length >= 10 && (
            <div style={{
              marginTop: '1rem',
              textAlign: 'center',
              color: '#666',
              fontSize: '0.875rem'
            }}>
              Showing first 10 reviews
            </div>
          )}
          <InstallPrompt />
      <PWAUpdatePrompt />
        </>
      )}
    </div>
  </div>
)}

      {/* Bus Images Gallery Modal */}
      {showBusGallery && galleryImages.length > 0 && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.9)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={() => setShowBusGallery(false)}
        >
          {/* Close button */}
          <button
            onClick={() => setShowBusGallery(false)}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              color: 'white',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              zIndex: 10001
            }}
          >
            <svg style={{ width: '2rem', height: '2rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Bus name */}
          <div style={{
            position: 'absolute',
            top: '1rem',
            left: '1rem',
            color: 'white',
            fontSize: '1.125rem',
            fontWeight: 'bold'
          }}>
            {galleryBusName}
          </div>

          {/* Navigation arrows */}
          {galleryImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setGalleryIndex(prev => (prev - 1 + galleryImages.length) % galleryImages.length);
                }}
                style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '3rem',
                  height: '3rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10001
                }}
              >
                <svg style={{ width: '1.5rem', height: '1.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setGalleryIndex(prev => (prev + 1) % galleryImages.length);
                }}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '3rem',
                  height: '3rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10001
                }}
              >
                <svg style={{ width: '1.5rem', height: '1.5rem' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Main image */}
          <img
            src={galleryImages[galleryIndex]?.image_url}
            alt={`${galleryBusName} - Image ${galleryIndex + 1}`}
            style={{
              maxWidth: '90vw',
              maxHeight: '80vh',
              objectFit: 'contain',
              borderRadius: '0.5rem'
            }}
            onClick={(e) => e.stopPropagation()}
          />

          {/* Image counter and type */}
          <div style={{
            position: 'absolute',
            bottom: '1rem',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.6)',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '9999px',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <span>{galleryIndex + 1} / {galleryImages.length}</span>
            {galleryImages[galleryIndex]?.image_type && (
              <span style={{ 
                textTransform: 'capitalize',
                padding: '0.125rem 0.5rem',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '0.25rem'
              }}>
                {galleryImages[galleryIndex].image_type}
              </span>
            )}
          </div>

          {/* Thumbnail strip */}
          {galleryImages.length > 1 && (
            <div style={{
              position: 'absolute',
              bottom: '4rem',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '0.5rem',
              padding: '0.5rem',
              background: 'rgba(0,0,0,0.5)',
              borderRadius: '0.5rem'
            }}>
              {galleryImages.map((img, idx) => (
                <img
                  key={idx}
                  src={img.image_url}
                  alt={`Thumbnail ${idx + 1}`}
                  style={{
                    width: '4rem',
                    height: '3rem',
                    objectFit: 'cover',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                    border: idx === galleryIndex ? '2px solid #EF7D00' : '2px solid transparent',
                    opacity: idx === galleryIndex ? 1 : 0.6,
                    transition: 'all 0.2s'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setGalleryIndex(idx);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}