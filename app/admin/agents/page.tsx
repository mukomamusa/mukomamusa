'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Agent {
  id: number;
  business_name: string;
  business_type: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  commission_rate: number;
  can_sell_all_companies: boolean;
  status: string;
  verified: number;
  created_at: string;
  last_login: string | null;
  total_bookings: number;
  total_earnings: number;
}

export default function AdminAgentsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'suspended'>('all');
  const [search, setSearch] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/admin/login');
      return;
    }

    const user = JSON.parse(userData);
    if (user.user_type !== 'admin') {
      router.push('/admin/login');
      return;
    }

    loadAgents();
  }, [router, filter]);

  const loadAgents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);
      if (search) params.set('search', search);

      const response = await fetch(`/api/admin/agents?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setAgents(data.agents || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      loadAgents();
    }, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  const handleAction = async (agentId: number, action: 'approve' | 'reject' | 'suspend' | 'activate') => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/agents/${agentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        alert(`Agent ${action}ed successfully`);
        loadAgents();
        setShowModal(false);
      } else {
        const data = await response.json();
        alert(data.error || 'Action failed');
      }
    } catch (err) {
      alert('Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string, verified: number) => {
    if (status === 'suspended') {
      return <span style={{ background: '#E6F5F4', color: '#1A8A82', padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem' }}>Suspended</span>;
    }
    if (verified === 0) {
      return <span style={{ background: '#E8F3EC', color: '#659E85', padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem' }}>Pending</span>;
    }
    return <span style={{ background: '#E6F7F6', color: '#2BB2A9', padding: '0.25rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem' }}>Active</span>;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F3F4F6' }}>
      {/* Header */}
      <header style={{ background: 'linear-gradient(to right, #197670, #13625D)', color: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderBottom: '4px solid #659E85' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1rem 1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Link href="/admin/dashboard" style={{ textDecoration: 'none' }}>
                <img
                  src="/logo.jpg"
                  alt="VayaZed Logo"
                  style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '0.5rem', border: '2px solid #659E85' }}
                />
              </Link>
              <div>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Agent Management</h1>
                <p style={{ fontSize: '0.75rem', opacity: 0.9 }}>VayaZed Admin Panel</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Link href="/admin/dashboard" style={{ color: 'white', textDecoration: 'none', fontSize: '0.875rem' }}>← Back to Dashboard</Link>
              <button onClick={handleLogout} style={{ padding: '0.5rem 1rem', background: '#1A8A82', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}>Logout</button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.5rem' }}>
        {/* Filters */}
        <div style={{ background: 'white', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search agents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: '0.5rem 1rem', border: '1px solid #D1D5DB', borderRadius: '0.5rem', flex: '1', minWidth: '200px' }}
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              style={{ padding: '0.5rem 1rem', border: '1px solid #D1D5DB', borderRadius: '0.5rem' }}
            >
              <option value="all">All Agents</option>
              <option value="pending">Pending Approval</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
            <button
              onClick={loadAgents}
              style={{ padding: '0.5rem 1rem', background: '#2BB2A9', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '0.75rem', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>Total Agents</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{agents.length}</p>
          </div>
          <div style={{ background: 'white', borderRadius: '0.75rem', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>Pending</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#659E85' }}>{agents.filter(a => a.verified === 0).length}</p>
          </div>
          <div style={{ background: 'white', borderRadius: '0.75rem', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>Active</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2BB2A9' }}>{agents.filter(a => a.status === 'active' && a.verified === 1).length}</p>
          </div>
          <div style={{ background: 'white', borderRadius: '0.75rem', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>Total Earnings</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>K{agents.reduce((sum, a) => sum + (a.total_earnings || 0), 0).toFixed(2)}</p>
          </div>
        </div>

        {/* Agents Table */}
        <div style={{ background: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
          ) : agents.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F9FAFB', borderBottom: '2px solid #E5E7EB' }}>
                  <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.75rem', fontWeight: '600' }}>Business</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', fontSize: '0.75rem', fontWeight: '600' }}>Contact</th>
                  <th style={{ textAlign: 'center', padding: '0.75rem', fontSize: '0.75rem', fontWeight: '600' }}>Commission</th>
                  <th style={{ textAlign: 'center', padding: '0.75rem', fontSize: '0.75rem', fontWeight: '600' }}>Bookings</th>
                  <th style={{ textAlign: 'right', padding: '0.75rem', fontSize: '0.75rem', fontWeight: '600' }}>Earnings</th>
                  <th style={{ textAlign: 'center', padding: '0.75rem', fontSize: '0.75rem', fontWeight: '600' }}>Status</th>
                  <th style={{ textAlign: 'center', padding: '0.75rem', fontSize: '0.75rem', fontWeight: '600' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {agents.map(agent => (
                  <tr key={agent.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <p style={{ fontWeight: '600', fontSize: '0.875rem' }}>{agent.business_name}</p>
                      <p style={{ fontSize: '0.75rem', color: '#6B7280', textTransform: 'capitalize' }}>{agent.business_type?.replace('_', ' ')}</p>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <p style={{ fontSize: '0.875rem' }}>{agent.contact_name}</p>
                      <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>{agent.contact_email}</p>
                      <p style={{ fontSize: '0.75rem', color: '#6B7280' }}>{agent.contact_phone}</p>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <span style={{ fontWeight: '600' }}>{agent.commission_rate}%</span>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      {agent.total_bookings || 0}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', color: '#2BB2A9', fontWeight: '600' }}>
                      K{(agent.total_earnings || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      {getStatusBadge(agent.status, agent.verified)}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <button
                        onClick={() => { setSelectedAgent(agent); setShowModal(true); }}
                        style={{ padding: '0.25rem 0.75rem', background: '#2BB2A9', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.75rem' }}
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#6B7280' }}>
              No agents found
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {showModal && selectedAgent && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '0.75rem', padding: '1.5rem', maxWidth: '500px', width: '90%' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>Manage Agent</h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <p><strong>Business:</strong> {selectedAgent.business_name}</p>
              <p><strong>Contact:</strong> {selectedAgent.contact_name}</p>
              <p><strong>Email:</strong> {selectedAgent.contact_email}</p>
              <p><strong>Phone:</strong> {selectedAgent.contact_phone}</p>
              <p><strong>Commission:</strong> {selectedAgent.commission_rate}%</p>
              <p><strong>Total Bookings:</strong> {selectedAgent.total_bookings || 0}</p>
              <p><strong>Total Earnings:</strong> K{(selectedAgent.total_earnings || 0).toFixed(2)}</p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {selectedAgent.verified === 0 && (
                <>
                  <button
                    onClick={() => handleAction(selectedAgent.id, 'approve')}
                    disabled={actionLoading}
                    style={{ padding: '0.5rem 1rem', background: '#2BB2A9', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: actionLoading ? 'not-allowed' : 'pointer' }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction(selectedAgent.id, 'reject')}
                    disabled={actionLoading}
                    style={{ padding: '0.5rem 1rem', background: '#1A8A82', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: actionLoading ? 'not-allowed' : 'pointer' }}
                  >
                    Reject
                  </button>
                </>
              )}
              {selectedAgent.status === 'active' && selectedAgent.verified === 1 && (
                <button
                  onClick={() => handleAction(selectedAgent.id, 'suspend')}
                  disabled={actionLoading}
                  style={{ padding: '0.5rem 1rem', background: '#659E85', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: actionLoading ? 'not-allowed' : 'pointer' }}
                >
                  Suspend
                </button>
              )}
              {selectedAgent.status === 'suspended' && (
                <button
                  onClick={() => handleAction(selectedAgent.id, 'activate')}
                  disabled={actionLoading}
                  style={{ padding: '0.5rem 1rem', background: '#2BB2A9', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: actionLoading ? 'not-allowed' : 'pointer' }}
                >
                  Reactivate
                </button>
              )}
            </div>

            <button
              onClick={() => setShowModal(false)}
              style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#E5E7EB', color: '#374151', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
