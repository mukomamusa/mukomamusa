// app/components/NotificationSettings.tsx
'use client';

import { useState, useEffect } from 'react';

export default function NotificationSettings() {
  const [settings, setSettings] = useState({
    trip_reminders: true,
    booking_updates: true,
    promotions: false,
    reminder_hours: 24
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/notifications/settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/notifications/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
      
      if (response.ok) {
        setMessage('Settings saved successfully!');
      } else {
        setMessage('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        Notification Settings
      </h3>

      {message && (
        <div className={`mb-4 p-3 rounded-lg ${
          message.includes('success') 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      <div className="space-y-4">
        <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
          <div>
            <p className="font-medium text-gray-800">Trip Reminders</p>
            <p className="text-sm text-gray-500">Get notified 24 hours before your trip</p>
          </div>
          <input
            type="checkbox"
            checked={settings.trip_reminders}
            onChange={(e) => setSettings({ ...settings, trip_reminders: e.target.checked })}
            className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
          />
        </label>

        {settings.trip_reminders && (
          <div className="ml-8 pl-4 border-l-2 border-primary-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reminder Hours Before Departure
            </label>
            <select
              value={settings.reminder_hours}
              onChange={(e) => setSettings({ ...settings, reminder_hours: parseInt(e.target.value) })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value={12}>12 hours before</option>
              <option value={24}>24 hours before</option>
              <option value={48}>48 hours before</option>
              <option value={72}>72 hours before</option>
            </select>
          </div>
        )}

        <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
          <div>
            <p className="font-medium text-gray-800">Booking Updates</p>
            <p className="text-sm text-gray-500">Payment confirmations, cancellations, delays</p>
          </div>
          <input
            type="checkbox"
            checked={settings.booking_updates}
            onChange={(e) => setSettings({ ...settings, booking_updates: e.target.checked })}
            className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
          />
        </label>

        <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
          <div>
            <p className="font-medium text-gray-800">Promotions & Offers</p>
            <p className="text-sm text-gray-500">Discounts, special offers, and new routes</p>
          </div>
          <input
            type="checkbox"
            checked={settings.promotions}
            onChange={(e) => setSettings({ ...settings, promotions: e.target.checked })}
            className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
          />
        </label>

        <button
          onClick={saveSettings}
          disabled={saving}
          className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 font-medium"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}