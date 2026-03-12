// app/components/company/DriverActivityLog.tsx
'use client';

import { useState, useEffect } from 'react';

interface AuditLog {
  id: number;
  action: string;
  action_category: string;
  old_value: string | null;
  new_value: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
}

interface Props {
  driverId: number;
  driverName: string;
  onClose: () => void;
}

export default function DriverActivityLog({ driverId, driverName, onClose }: Props) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedLog, setExpandedLog] = useState<number | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [driverId, filter, page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/company/drivers/${driverId}/audit-logs?page=${page}&limit=20&filter=${filter}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      const data = await response.json();
      if (data.success) {
        setLogs(data.logs);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getActionColor = (action: string, status: string) => {
    if (status === 'failure') return '#DE2010';
    
    const colors: Record<string, string> = {
      'login_success': '#198A00',
      'login_failed': '#DE2010',
      'password_reset': '#EF7D00',
      'booking_created': '#198A00',
      'profile_updated': '#00A86B'
    };
    return colors[action] || '#666';
  };

  const getActionIcon = (action: string) => {
    const icons: Record<string, string> = {
      'login_success': '✅',
      'login_failed': '❌',
      'password_reset': '🔐',
      'booking_created': '🎫',
      'profile_updated': '👤',
      'email_verified': '📧',
      'logout': '👋'
    };
    return icons[action] || '📝';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-primary-600 to-secondary-600">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-white">Activity Log: {driverName}</h2>
              <p className="text-sm text-white/80">Driver ID: {driverId}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-white/80"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Filters */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => { setFilter('all'); setPage(1); }}
              className={`px-3 py-1 rounded-full text-sm ${
                filter === 'all' 
                  ? 'bg-white text-primary-600' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              All
            </button>
            <button
              onClick={() => { setFilter('auth'); setPage(1); }}
              className={`px-3 py-1 rounded-full text-sm ${
                filter === 'auth' 
                  ? 'bg-white text-primary-600' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Authentication
            </button>
            <button
              onClick={() => { setFilter('booking'); setPage(1); }}
              className={`px-3 py-1 rounded-full text-sm ${
                filter === 'booking' 
                  ? 'bg-white text-primary-600' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Bookings
            </button>
            <button
              onClick={() => { setFilter('profile'); setPage(1); }}
              className={`px-3 py-1 rounded-full text-sm ${
                filter === 'profile' 
                  ? 'bg-white text-primary-600' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              Profile
            </button>
          </div>
        </div>

        {/* Logs List */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Loading activity logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4 opacity-30">📝</div>
              <p className="text-gray-500">No activity logs found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="border rounded-lg p-4 hover:shadow-md transition cursor-pointer"
                  onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="text-2xl">
                      {getActionIcon(log.action)}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-800">
                            {log.action.replace(/_/g, ' ')}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {formatDateTime(log.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className="px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: log.status === 'success' ? '#E8F5E6' : '#FEE9E7',
                              color: log.status === 'success' ? '#198A00' : '#DE2010'
                            }}
                          >
                            {log.status}
                          </span>
                          <span className="text-xs text-gray-500">
                            {log.ip_address || 'Unknown IP'}
                          </span>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {expandedLog === log.id && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          {log.new_value && (
                            <div className="mb-3">
                              <h4 className="text-xs font-semibold text-gray-500 mb-1">Details:</h4>
                              <pre className="text-xs bg-gray-50 p-2 rounded">
                                {JSON.stringify(JSON.parse(log.new_value), null, 2)}
                              </pre>
                            </div>
                          )}
                          
                          {log.metadata && (
                            <div className="mb-3">
                              <h4 className="text-xs font-semibold text-gray-500 mb-1">Metadata:</h4>
                              <pre className="text-xs bg-gray-50 p-2 rounded">
                                {JSON.stringify(JSON.parse(log.metadata), null, 2)}
                              </pre>
                            </div>
                          )}
                          
                          {log.error_message && (
                            <div className="mb-3">
                              <h4 className="text-xs font-semibold text-gray-500 mb-1">Error:</h4>
                              <p className="text-xs text-red-600">{log.error_message}</p>
                            </div>
                          )}
                          
                          {log.user_agent && (
                            <div className="text-xs text-gray-500">
                              <span className="font-semibold">Device:</span> {log.user_agent}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex justify-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}