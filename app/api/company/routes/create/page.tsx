'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface RouteFormData {
  bus_id: number;
  origin: string;
  destination: string;
  intermediate_stops: string;
  departure_time: string;
  arrival_time: string;
  date: string;
  price: number;
  // Recurring fields
  is_recurring: boolean;
  recurring_pattern: 'daily' | 'weekly' | 'monthly' | 'custom';
  recurring_days: string[];
  recurring_until: string;
  recurring_weeks?: number; // For weekly: every X weeks
  recurring_month_dates?: number[]; // For monthly: specific dates (1-31)
  recurring_month_pattern?: 'date' | 'day'; // e.g., "last Friday of month"
  recurring_exclude_dates?: string[]; // Specific dates to exclude
}

const DAYS_OF_WEEK = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

const MONTH_OPTIONS = [
  { value: 'date', label: 'Specific date of month (e.g., 15th)' },
  { value: 'day', label: 'Specific day (e.g., last Friday)' }
];

export default function CreateRoutePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<RouteFormData>({
    bus_id: 0,
    origin: '',
    destination: '',
    intermediate_stops: '',
    departure_time: '',
    arrival_time: '',
    date: '',
    price: 0,
    is_recurring: false,
    recurring_pattern: 'weekly',
    recurring_days: [],
    recurring_until: '',
  });

  const [previewRoutes, setPreviewRoutes] = useState<any[]>([]);

  // Generate preview of recurring routes
  const generateRecurringPreview = () => {
    if (!formData.is_recurring || !formData.recurring_until) return;
    
    const startDate = new Date(formData.date);
    const endDate = new Date(formData.recurring_until);
    const preview: any[] = [];
    
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate && preview.length < 10) { // Show max 10 preview
      if (formData.recurring_pattern === 'daily') {
        preview.push({
          date: currentDate.toISOString().split('T')[0],
          day: currentDate.toLocaleDateString('en-US', { weekday: 'long' })
        });
        currentDate.setDate(currentDate.getDate() + 1);
      } 
      else if (formData.recurring_pattern === 'weekly' && formData.recurring_days.length > 0) {
        // Check if current day is in selected days
        const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
        if (formData.recurring_days.includes(dayName)) {
          preview.push({
            date: currentDate.toISOString().split('T')[0],
            day: dayName
          });
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      else if (formData.recurring_pattern === 'monthly') {
        // Example: 15th of every month
        const dateNum = currentDate.getDate();
        if (dateNum === 15) { // You can make this configurable
          preview.push({
            date: currentDate.toISOString().split('T')[0],
            day: currentDate.toLocaleDateString('en-US', { weekday: 'long' })
          });
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    
    setPreviewRoutes(preview);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      // If recurring, create multiple routes
      if (formData.is_recurring) {
        const routes = [];
        const startDate = new Date(formData.date);
        const endDate = new Date(formData.recurring_until);
        let currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
          let shouldCreate = false;
          
          if (formData.recurring_pattern === 'daily') {
            shouldCreate = true;
          } else if (formData.recurring_pattern === 'weekly') {
            const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
            shouldCreate = formData.recurring_days.includes(dayName);
          } else if (formData.recurring_pattern === 'monthly') {
            // Example: create on 15th of each month
            shouldCreate = currentDate.getDate() === 15;
          }
          
          if (shouldCreate) {
            routes.push({
              ...formData,
              date: currentDate.toISOString().split('T')[0],
              is_recurring: false // Individual routes are not recurring
            });
          }
          
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // Submit all routes
        const response = await fetch('/api/routes/bulk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ routes })
        });
        
        if (response.ok) {
          alert(`Successfully created ${routes.length} routes!`);
          router.push('/company/dashboard');
        }
      } else {
        // Single route creation
        const response = await fetch('/api/routes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });
        
        if (response.ok) {
          alert('Route created successfully!');
          router.push('/company/dashboard');
        }
      }
    } catch (error) {
      console.error('Error creating route:', error);
      alert('Failed to create route');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Create New Route</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Bus Selection - Existing */}
        <div className="bg-white p-6 rounded-lg shadow">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Bus
          </label>
          <select
            value={formData.bus_id}
            onChange={(e) => setFormData({...formData, bus_id: parseInt(e.target.value)})}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            required
          >
            <option value="">Select a bus...</option>
            <option value="102">Power Standard (ZM-102-PT)</option>
            {/* Add more bus options */}
          </select>
        </div>

        {/* Route Details - Existing */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Origin
              </label>
              <select
                value={formData.origin}
                onChange={(e) => setFormData({...formData, origin: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                required
              >
                <option value="">Select origin city...</option>
                <option value="Lusaka">Lusaka</option>
                <option value="Ndola">Ndola</option>
                {/* Add more cities */}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Destination
              </label>
              <select
                value={formData.destination}
                onChange={(e) => setFormData({...formData, destination: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                required
              >
                <option value="">Select destination city...</option>
                <option value="Livingstone">Livingstone</option>
                <option value="Kitwe">Kitwe</option>
                {/* Add more cities */}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Intermediate Stops
            </label>
            <input
              type="text"
              placeholder="e.g., Kafue, Mazabuka, Monze"
              value={formData.intermediate_stops}
              onChange={(e) => setFormData({...formData, intermediate_stops: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        {/* NEW: Recurring Route Toggle */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center gap-3 mb-4">
            <input
              type="checkbox"
              id="is_recurring"
              checked={formData.is_recurring}
              onChange={(e) => setFormData({...formData, is_recurring: e.target.checked})}
              className="w-5 h-5 text-primary-600"
            />
            <label htmlFor="is_recurring" className="font-medium text-gray-800">
              This is a recurring route (runs on multiple dates)
            </label>
          </div>

          {formData.is_recurring && (
            <div className="space-y-4 border-t pt-4">
              {/* Recurring Pattern Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recurring Pattern
                </label>
                <select
                  value={formData.recurring_pattern}
                  onChange={(e) => setFormData({
                    ...formData, 
                    recurring_pattern: e.target.value as any
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly (specific days)</option>
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom pattern</option>
                </select>
              </div>

              {/* Weekly Day Selection */}
              {formData.recurring_pattern === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Days of Week
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map(day => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          const days = formData.recurring_days.includes(day)
                            ? formData.recurring_days.filter(d => d !== day)
                            : [...formData.recurring_days, day];
                          setFormData({...formData, recurring_days: days});
                        }}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                          formData.recurring_days.includes(day)
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {day.substring(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Monthly Pattern */}
              {formData.recurring_pattern === 'monthly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Pattern
                  </label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="15">15th of each month</option>
                    <option value="last_fri">Last Friday of each month</option>
                    <option value="first_mon">First Monday of each month</option>
                  </select>
                </div>
              )}

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date (Recurring Until)
                </label>
                <input
                  type="date"
                  value={formData.recurring_until}
                  onChange={(e) => {
                    setFormData({...formData, recurring_until: e.target.value});
                    generateRecurringPreview();
                  }}
                  min={formData.date}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required={formData.is_recurring}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Routes will be created from start date until this date
                </p>
              </div>

              {/* Preview of generated routes */}
              {previewRoutes.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">
                    Preview: {previewRoutes.length} routes will be created
                  </h4>
                  <div className="text-sm text-blue-600 space-y-1 max-h-40 overflow-y-auto">
                    {previewRoutes.map((route, idx) => (
                      <div key={idx}>
                        {route.date} ({route.day})
                      </div>
                    ))}
                    {previewRoutes.length >= 10 && (
                      <div className="text-blue-500 italic">
                        ... and more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Time and Price - Existing */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Departure Time
              </label>
              <input
                type="time"
                value={formData.departure_time}
                onChange={(e) => setFormData({...formData, departure_time: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Arrival Time
              </label>
              <input
                type="time"
                value={formData.arrival_time}
                onChange={(e) => setFormData({...formData, arrival_time: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date {formData.is_recurring ? '(Start Date)' : ''}
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => {
                  setFormData({...formData, date: e.target.value});
                  if (formData.is_recurring) generateRecurringPreview();
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (ZMW)
              </label>
              <input
                type="number"
                placeholder="e.g., 250"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                required
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : formData.is_recurring ? 'Create Recurring Routes' : 'Create Route'}
          </button>
        </div>
      </form>
    </div>
  );
}