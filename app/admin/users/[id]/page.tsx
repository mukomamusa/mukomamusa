'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { validateZambiaCellphone, validateZambiaNRC } from '@/app/lib/validations';

interface User {
  id: number;
  email: string;
  name: string;
  phone: string;
  user_type: string;
  status: string;
  created_at: string;
  updated_at: string;
  company_name?: string;
  license_number?: string;
  company_registration_number?: string;
  company_address?: string;
  nrc?: string;
  date_of_birth?: string;
  gender?: string;
  emergency_contact?: string;
  emergency_phone?: string;
}

interface RelatedData {
  bookingCount?: number;
  busCount?: number;
  routeCount?: number;
  tripCount?: number;
}

export default function AdminUserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = parseInt(params.id as string);

  const [user, setUser] = useState<User | null>(null);
  const [relatedData, setRelatedData] = useState<RelatedData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'edit'>('details');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [errors, setErrors] = useState<{
    phone?: string;
    nrc?: string;
    emergency_phone?: string;
  }>({});

  const validatePhone = (phone: string): boolean => {
    const result = validateZambiaCellphone(phone);
    if (!result.isValid) {
      setErrors(prev => ({ ...prev, phone: result.error }));
      return false;
    }
    setErrors(prev => ({ ...prev, phone: undefined }));
    return true;
  };

  const validateNRC = (nrc: string): boolean => {
    if (!nrc) return true; // Optional field
    const result = validateZambiaNRC(nrc);
    if (!result.isValid) {
      setErrors(prev => ({ ...prev, nrc: result.error }));
      return false;
    }
    setErrors(prev => ({ ...prev, nrc: undefined }));
    return true;
  };

  const validateEmergencyPhone = (phone: string): boolean => {
    if (!phone) return true; // Optional field
    const result = validateZambiaCellphone(phone);
    if (!result.isValid) {
      setErrors(prev => ({ ...prev, emergency_phone: result.error }));
      return false;
    }
    setErrors(prev => ({ ...prev, emergency_phone: undefined }));
    return true;
  };

  // Edit form state
  const [formData, setFormData] = useState<Partial<User>>({});

  useEffect(() => {
    if (userId) {
      fetchUser();
    }
  }, [userId]);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setRelatedData(data.relatedData || {});
        setFormData(data.user);
      } else {
        setMessage({ type: 'error', text: 'User not found' });
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setMessage({ type: 'error', text: 'Failed to load user' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    // Validate phone numbers before submitting
    if (!validatePhone(formData.phone || '')) {
      setSaving(false);
      return;
    }
    if (formData.nrc && !validateNRC(formData.nrc)) {
      setSaving(false);
      return;
    }
    if (formData.emergency_phone && !validateEmergencyPhone(formData.emergency_phone)) {
      setSaving(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setMessage({ type: 'success', text: 'User updated successfully!' });
        setActiveTab('details');
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to update user' });
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setMessage({ type: 'error', text: 'Failed to update user' });
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setUser({ ...user!, status: newStatus });
        setMessage({ type: 'success', text: `User ${newStatus === 'active' ? 'activated' : 'suspended'} successfully!` });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to update status' });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setMessage({ type: 'error', text: 'Failed to update status' });
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        router.push('/admin/users');
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to delete user' });
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      setMessage({ type: 'error', text: 'Failed to delete user' });
    }
  };

  const getUserTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      customer: 'Customer',
      company: 'Bus Company',
      driver: 'Driver',
      admin: 'Administrator'
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      suspended: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      pending_verification: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-ZM', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading user...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="text-red-500 mb-4">User not found</div>
        <Link href="/admin/users" className="text-primary-600 hover:underline">
          Back to Users
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-2">
            <Link href="/admin/users" className="text-gray-500 hover:text-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">User Details</h1>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(user.status)}`}>
              {user.status}
            </span>
          </div>
          <p className="text-gray-500 ml-9">ID: #{user.id} • {getUserTypeLabel(user.user_type)}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Message */}
        {message.text && (
          <div className={`mb-4 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'details' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('edit')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'edit' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Edit
          </button>
        </div>

        {activeTab === 'details' ? (
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Full Name</label>
                  <p className="text-gray-900">{user.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900">{user.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-gray-900">{user.phone}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">User Type</label>
                  <p className="text-gray-900">{getUserTypeLabel(user.user_type)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Created At</label>
                  <p className="text-gray-900">{formatDate(user.created_at)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="text-gray-900">{formatDate(user.updated_at)}</p>
                </div>
              </div>
            </div>

            {/* Type-specific Information */}
            {user.user_type === 'company' && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Company Name</label>
                    <p className="text-gray-900">{user.company_name || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">RTSA License</label>
                    <p className="text-gray-900">{user.license_number || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Registration Number</label>
                    <p className="text-gray-900">{user.company_registration_number || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Address</label>
                    <p className="text-gray-900">{user.company_address || '-'}</p>
                  </div>
                </div>
              </div>
            )}

            {user.user_type === 'customer' && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">NRC</label>
                    <p className="text-gray-900">{user.nrc || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Date of Birth</label>
                    <p className="text-gray-900">{user.date_of_birth || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Gender</label>
                    <p className="text-gray-900">{user.gender || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Emergency Contact</label>
                    <p className="text-gray-900">{user.emergency_contact || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Emergency Phone</label>
                    <p className="text-gray-900">{user.emergency_phone || '-'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Related Data */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Summary</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {relatedData.bookingCount !== undefined && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600">{relatedData.bookingCount}</div>
                    <div className="text-sm text-blue-600">Bookings</div>
                  </div>
                )}
                {relatedData.busCount !== undefined && (
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-purple-600">{relatedData.busCount}</div>
                    <div className="text-sm text-purple-600">Buses</div>
                  </div>
                )}
                {relatedData.routeCount !== undefined && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-600">{relatedData.routeCount}</div>
                    <div className="text-sm text-green-600">Routes</div>
                  </div>
                )}
                {relatedData.tripCount !== undefined && (
                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-orange-600">{relatedData.tripCount}</div>
                    <div className="text-sm text-orange-600">Trips</div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
              <div className="flex flex-wrap gap-3">
                {user.status === 'active' ? (
                  <button
                    onClick={() => handleStatusChange('suspended')}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    Suspend User
                  </button>
                ) : (
                  <button
                    onClick={() => handleStatusChange('active')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    Activate User
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('edit')}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition"
                >
                  Edit User
                </button>
                {user.user_type !== 'admin' && (
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
                  >
                    Delete User
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Edit Form */
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit User</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value });
                      if (errors.phone) validatePhone(e.target.value);
                    }}
                    onBlur={(e) => validatePhone(e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                    required
                    maxLength={12}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                  )}
                </div>

                {/* Company-specific fields */}
                {user.user_type === 'company' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                      <input
                        type="text"
                        value={formData.company_name || ''}
                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">RTSA License</label>
                      <input
                        type="text"
                        value={formData.license_number || ''}
                        onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                      <input
                        type="text"
                        value={formData.company_registration_number || ''}
                        onChange={(e) => setFormData({ ...formData, company_registration_number: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <input
                        type="text"
                        value={formData.company_address || ''}
                        onChange={(e) => setFormData({ ...formData, company_address: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </>
                )}

                {/* Customer-specific fields */}
                {user.user_type === 'customer' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">NRC</label>
                      <input
                        type="text"
                        value={formData.nrc || ''}
                        onChange={(e) => {
                          setFormData({ ...formData, nrc: e.target.value });
                          if (errors.nrc) validateNRC(e.target.value);
                        }}
                        onBlur={(e) => validateNRC(e.target.value)}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${errors.nrc ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                        maxLength={12}
                      />
                      {errors.nrc && (
                        <p className="text-red-500 text-xs mt-1">{errors.nrc}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
                      <input
                        type="text"
                        value={formData.emergency_contact || ''}
                        onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Phone</label>
                      <input
                        type="text"
                        value={formData.emergency_phone || ''}
                        onChange={(e) => {
                          setFormData({ ...formData, emergency_phone: e.target.value });
                          if (errors.emergency_phone) validateEmergencyPhone(e.target.value);
                        }}
                        onBlur={(e) => validateEmergencyPhone(e.target.value)}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 ${errors.emergency_phone ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                        maxLength={12}
                      />
                      {errors.emergency_phone && (
                        <p className="text-red-500 text-xs mt-1">{errors.emergency_phone}</p>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('details')}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
