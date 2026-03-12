'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DriverTrackingPage() {
  const router = useRouter();
  const [active, setActive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [tripId, setTripId] = useState('');
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('driver_token');
    if (!token) {
      router.push('/driver/login');
    }
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [router]);

  const submitPosition = async (latitude: number, longitude: number, speed?: number | null, heading?: number | null, accuracy?: number | null) => {
    const token = localStorage.getItem('driver_token');
    if (!token) return;

    const body: any = { latitude, longitude, speed, heading, accuracy };
    if (tripId.trim()) {
      body.trip_id = Number(tripId);
    }

    const response = await fetch('/api/tracking/location', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Location update failed');
    }

    setLastUpdate(new Date().toLocaleTimeString());
    setMessage(`Trip ${data.trip_id}: ${data.status} | ETA: ${data.eta || 'n/a'}`);
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      setMessage('Geolocation not supported on this device.');
      return;
    }

    setMessage('Starting GPS tracking...');
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        try {
          await submitPosition(
            position.coords.latitude,
            position.coords.longitude,
            position.coords.speed,
            position.coords.heading,
            position.coords.accuracy
          );
          setActive(true);
        } catch (error: any) {
          setMessage(error.message || 'Failed to submit location');
        }
      },
      (error) => {
        setMessage(error.message || 'Unable to access location.');
        setActive(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setActive(false);
    setMessage('GPS tracking stopped.');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '1.5rem' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', background: '#fff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Driver Live Tracking</h1>
        <p style={{ color: '#475569', marginBottom: '1rem' }}>
          Multi-provider GPS is primary. This driver location feed is the backup channel.
        </p>

        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Optional Trip ID (auto-detect if empty)</label>
        <input
          type="number"
          value={tripId}
          onChange={(e) => setTripId(e.target.value)}
          placeholder="e.g. 123"
          style={{ width: '100%', marginBottom: '1rem', padding: '0.7rem', border: '1px solid #cbd5e1', borderRadius: '8px' }}
        />

        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
          <button onClick={startTracking} disabled={active} style={{ padding: '0.7rem 1rem', border: 'none', borderRadius: '8px', background: active ? '#94a3b8' : '#0f766e', color: '#fff', cursor: active ? 'not-allowed' : 'pointer' }}>
            Start Sharing
          </button>
          <button onClick={stopTracking} disabled={!active} style={{ padding: '0.7rem 1rem', border: 'none', borderRadius: '8px', background: !active ? '#94a3b8' : '#dc2626', color: '#fff', cursor: !active ? 'not-allowed' : 'pointer' }}>
            Stop Sharing
          </button>
        </div>

        <div style={{ fontSize: '0.95rem', color: '#334155' }}>
          <p>Status: <strong>{active ? 'Active' : 'Idle'}</strong></p>
          <p>Last Update: <strong>{lastUpdate || 'None'}</strong></p>
          <p>{message}</p>
        </div>
      </div>
    </div>
  );
}
