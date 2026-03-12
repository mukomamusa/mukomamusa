'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

type SeatStatus = 'available' | 'booked' | 'blocked' | 'reserved';
type ActionStatus = 'available' | 'blocked' | 'reserved';

interface SeatRow {
  seat_number: number;
  status: SeatStatus;
  reason: string | null;
  reserved_until: string | null;
  price: number;
}

interface SeatData {
  route: {
    id: number;
    origin: string;
    destination: string;
    date: string;
    departure_time: string;
    arrival_time: string;
    bus_name: string;
    bus_number: string;
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
  seats: SeatRow[];
}

export default function CompanyRouteSeatsPage() {
  const params = useParams();
  const router = useRouter();
  const routeId = Number(params.routeId);

  const [data, setData] = useState<SeatData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionStatus, setActionStatus] = useState<ActionStatus>('blocked');
  const [reason, setReason] = useState('');
  const [reservedUntil, setReservedUntil] = useState('');
  const [dynamicEnabled, setDynamicEnabled] = useState(false);
  const [dynamicMultiplier, setDynamicMultiplier] = useState('1');

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const fetchData = async () => {
    if (!token || !routeId) return;
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/company/routes/${routeId}/seats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load seat controls');
      }

      setData(payload);
      setDynamicEnabled(!!payload.route.dynamic_pricing_enabled);
      setDynamicMultiplier(String(payload.route.dynamic_price_multiplier || 1));
    } catch (err: any) {
      setError(err.message || 'Failed to load seat controls');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userJson = localStorage.getItem('user');
    if (!token || !userJson) {
      router.push('/company/login');
      return;
    }

    const user = JSON.parse(userJson);
    if (user.user_type !== 'company') {
      router.push('/company/login');
      return;
    }

    fetchData();
  }, [routeId]);

  const groupedRows = useMemo(() => {
    if (!data) return [] as SeatRow[][];

    const rows: SeatRow[][] = [];
    const perRow = 4;
    for (let i = 0; i < data.seats.length; i += perRow) {
      rows.push(data.seats.slice(i, i + perRow));
    }
    return rows;
  }, [data]);

  const updateSeat = async (seatNumber: number) => {
    if (!token || saving) return;
    if (actionStatus === 'reserved' && reservedUntil && Number.isNaN(new Date(reservedUntil).getTime())) {
      setError('Invalid reservation expiry date/time');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await fetch(`/api/company/routes/${routeId}/seats`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          updates: [
            {
              seat_number: seatNumber,
              status: actionStatus,
              reason: reason || null,
              reserved_until: actionStatus === 'reserved' ? (reservedUntil || null) : null,
            },
          ],
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to update seat');
      }

      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to update seat');
    } finally {
      setSaving(false);
    }
  };

  const saveDynamicPricing = async () => {
    if (!token || saving) return;

    const parsedMultiplier = Number(dynamicMultiplier);
    if (!Number.isFinite(parsedMultiplier) || parsedMultiplier <= 0 || parsedMultiplier > 3) {
      setError('Dynamic multiplier must be between 0.1 and 3');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await fetch(`/api/company/routes/${routeId}/seats`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          dynamic_pricing_enabled: dynamicEnabled,
          dynamic_price_multiplier: parsedMultiplier,
          updates: [],
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to save dynamic pricing settings');
      }

      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to save dynamic pricing settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 p-8 text-center text-gray-600">Loading seat controls...</div>;
  }

  if (!data) {
    return <div className="min-h-screen bg-gray-50 p-8 text-center text-red-600">{error || 'Seat controls unavailable'}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Seat Map & Dynamic Pricing</h1>
              <p className="text-gray-600">
                Route {data.route.origin} {'->'} {data.route.destination} | {data.route.date} | {data.route.departure_time}
              </p>
            </div>
            <Link href="/company/enhanced-dashboard" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 w-fit">
              Back to Dashboard
            </Link>
          </div>
        </header>

        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Dynamic Pricing</h2>
          <div className="grid md:grid-cols-3 gap-4 items-end">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={dynamicEnabled}
                onChange={(e) => setDynamicEnabled(e.target.checked)}
              />
              <span className="text-sm font-medium text-gray-700">Enable Dynamic Pricing</span>
            </label>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Multiplier</label>
              <input
                type="number"
                min="0.1"
                max="3"
                step="0.05"
                value={dynamicMultiplier}
                onChange={(e) => setDynamicMultiplier(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <button
              onClick={saveDynamicPricing}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
            >
              Save Pricing Settings
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Final seat price = base price * seat zone factor * occupancy factor * multiplier.
          </p>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Seat Controls</h2>

          <div className="grid md:grid-cols-4 gap-3 mb-4 text-sm">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">Available: <strong>{data.summary.available}</strong></div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">Booked: <strong>{data.summary.booked}</strong></div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">Blocked: <strong>{data.summary.blocked}</strong></div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">Reserved: <strong>{data.summary.reserved}</strong></div>
          </div>

          <div className="grid md:grid-cols-4 gap-3 mb-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
              <select
                value={actionStatus}
                onChange={(e) => setActionStatus(e.target.value as ActionStatus)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="blocked">Block Seat</option>
                <option value="reserved">Reserve Seat</option>
                <option value="available">Unblock / Clear</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Maintenance, VIP, etc"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reserve Until</label>
              <input
                type="datetime-local"
                value={reservedUntil}
                onChange={(e) => setReservedUntil(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={actionStatus !== 'reserved'}
              />
            </div>
            <div className="text-sm text-gray-500 flex items-end">
              Click any seat to apply selected action.
            </div>
          </div>

          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

          <div className="space-y-2">
            <div className="text-xs text-gray-500">Front of Bus</div>
            <div className="space-y-2">
              {groupedRows.map((row, rowIndex) => (
                <div key={rowIndex} className="grid grid-cols-4 gap-2 max-w-xl">
                  {row.map((seat, idx) => {
                    const isBooked = seat.status === 'booked';
                    const statusClass =
                      seat.status === 'booked'
                        ? 'bg-blue-100 border-blue-300 text-blue-800 cursor-not-allowed'
                        : seat.status === 'blocked'
                        ? 'bg-red-100 border-red-300 text-red-800'
                        : seat.status === 'reserved'
                        ? 'bg-amber-100 border-amber-300 text-amber-800'
                        : 'bg-green-100 border-green-300 text-green-800 hover:bg-green-200';

                    return (
                      <button
                        key={seat.seat_number}
                        type="button"
                        onClick={() => !isBooked && updateSeat(seat.seat_number)}
                        disabled={isBooked || saving}
                        className={`border rounded-lg p-2 text-xs font-medium transition ${statusClass}`}
                        title={`Seat ${seat.seat_number} | ${seat.status} | K${seat.price}`}
                      >
                        <div>Seat {seat.seat_number}</div>
                        <div className="text-[10px]">K{seat.price.toFixed(2)}</div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
