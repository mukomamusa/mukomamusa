'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { cityNames } from './lib/zambia-data';

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
  intermediate_stops: string;
}

export default function Home() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState({
    origin: 'Lusaka',
    destination: '',
    date: new Date().toISOString().split('T')[0],
  });

  const searchRoutes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchParams.origin) params.append('origin', searchParams.origin);
      if (searchParams.destination) params.append('destination', searchParams.destination);
      if (searchParams.date) params.append('date', searchParams.date);

      const response = await fetch(`/api/routes?${params.toString()}`);
      const data = await response.json();
      setRoutes(data.routes || []);
    } catch (error) {
      console.error('Error searching routes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchRoutes();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zambian-green-50 via-white to-zambian-orange-50">
      {/* Header with Zambian Flag Colors */}
      <header className="bg-white shadow-lg border-b-4 border-zambian-green-500">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="text-4xl">🚌</div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-zambian-green-600 to-zambian-orange-500 bg-clip-text text-transparent">
                  VayaZed Bus Booking
                </h1>
                <p className="text-sm text-gray-600 font-medium">Travel Across Zambia with Comfort & Safety</p>
              </div>
            </div>
            <div className="flex space-x-4">
              <Link 
                href="/customer/login" 
                className="px-5 py-2.5 text-zambian-green-600 hover:text-zambian-green-700 font-semibold border-2 border-zambian-green-500 rounded-lg hover:bg-zambian-green-50 transition-all"
              >
                Customer Login
              </Link>
              <Link 
                href="/company/login" 
                className="px-5 py-2.5 bg-gradient-to-r from-zambian-green-500 to-zambian-green-600 text-white rounded-lg hover:from-zambian-green-600 hover:to-zambian-green-700 font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Company Login
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Zambian Theme */}
      <section className="container mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center space-x-2 bg-zambian-orange-100 px-4 py-2 rounded-full mb-4">
            <span className="text-2xl">🇿🇲</span>
            <span className="text-zambian-orange-700 font-semibold">Proudly Zambian</span>
          </div>
          <h2 className="text-5xl font-bold text-gray-800 mb-4">
            Travel Across <span className="text-zambian-green-600">Zambia</span> with Ease
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Book intercity bus tickets to over <span className="font-bold text-zambian-orange-600">40+ destinations</span> across all 10 provinces
          </p>
        </div>

        {/* Search Form with Zambian Colors */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-5xl mx-auto border-t-4 border-zambian-green-500">
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📍 From (Origin)
              </label>
              <select
                value={searchParams.origin}
                onChange={(e) => setSearchParams({ ...searchParams, origin: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-zambian-green-500 focus:ring-2 focus:ring-zambian-green-200 outline-none transition-all"
              >
                <option value="">Select origin city</option>
                {cityNames.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🎯 To (Destination)
              </label>
              <select
                value={searchParams.destination}
                onChange={(e) => setSearchParams({ ...searchParams, destination: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-zambian-orange-500 focus:ring-2 focus:ring-zambian-orange-200 outline-none transition-all"
              >
                <option value="">Select destination city</option>
                {cityNames.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📅 Travel Date
              </label>
              <input
                type="date"
                value={searchParams.date}
                onChange={(e) => setSearchParams({ ...searchParams, date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-zambian-green-500 focus:ring-2 focus:ring-zambian-green-200 outline-none transition-all"
              />
            </div>
          </div>

          <button
            onClick={searchRoutes}
            disabled={loading}
            className="w-full bg-gradient-to-r from-zambian-green-500 via-zambian-green-600 to-zambian-orange-500 text-white py-4 rounded-lg font-bold text-lg hover:from-zambian-green-600 hover:via-zambian-green-700 hover:to-zambian-orange-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Searching Buses...
              </span>
            ) : (
              '🔍 Search Available Buses'
            )}
          </button>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-4 gap-6 mt-12 max-w-6xl mx-auto">
          <div className="bg-white p-6 rounded-xl shadow-lg text-center hover:shadow-xl transition-all border-t-4 border-zambian-green-500">
            <div className="text-4xl mb-3">🇿🇲</div>
            <h3 className="font-bold text-lg mb-2 text-gray-800">40+ Cities</h3>
            <p className="text-gray-600 text-sm">All 10 provinces covered</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg text-center hover:shadow-xl transition-all border-t-4 border-zambian-orange-500">
            <div className="text-4xl mb-3">🛡️</div>
            <h3 className="font-bold text-lg mb-2 text-gray-800">Safe Travel</h3>
            <p className="text-gray-600 text-sm">RTSA certified operators</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg text-center hover:shadow-xl transition-all border-t-4 border-zambian-green-500">
            <div className="text-4xl mb-3">💳</div>
            <h3 className="font-bold text-lg mb-2 text-gray-800">Easy Payment</h3>
            <p className="text-gray-600 text-sm">Mobile money & cards</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg text-center hover:shadow-xl transition-all border-t-4 border-zambian-orange-500">
            <div className="text-4xl mb-3">⚡</div>
            <h3 className="font-bold text-lg mb-2 text-gray-800">Instant Booking</h3>
            <p className="text-gray-600 text-sm">Book in under 2 minutes</p>
          </div>
        </div>
      </section>

      {/* Search Results */}
      {routes.length > 0 && (
        <section className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Available Buses ({routes.length} found)
            </h3>
            <p className="text-gray-600">
              {searchParams.origin && searchParams.destination && (
                <>From <span className="font-semibold text-zambian-green-600">{searchParams.origin}</span> to <span className="font-semibold text-zambian-orange-600">{searchParams.destination}</span></>
              )}
            </p>
          </div>

          <div className="grid gap-6">
            {routes.map((route) => (
              <div
                key={route.id}
                className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all p-6 border-l-4 border-zambian-green-500"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="bg-zambian-green-100 px-4 py-2 rounded-lg">
                        <span className="text-zambian-green-700 font-bold text-lg">{route.company_name}</span>
                      </div>
                      <div className="bg-zambian-orange-100 px-3 py-1 rounded-full">
                        <span className="text-zambian-orange-700 font-semibold text-sm">{route.bus_type}</span>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Route</p>
                        <p className="font-semibold text-gray-800">
                          {route.origin} → {route.destination}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Departure</p>
                        <p className="font-semibold text-gray-800">🕐 {route.departure_time}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Available Seats</p>
                        <p className="font-semibold text-zambian-green-600">
                          💺 {route.available_seats} seats
                        </p>
                      </div>
                    </div>

                    {route.amenities && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {route.amenities.split(',').map((amenity, idx) => (
                          <span
                            key={idx}
                            className="bg-gray-100 px-3 py-1 rounded-full text-xs text-gray-700"
                          >
                            {amenity.trim()}
                          </span>
                        ))}
                      </div>
                    )}

                    {route.intermediate_stops && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Stops:</span> {route.intermediate_stops}
                      </div>
                    )}
                  </div>

                  <div className="md:ml-6 mt-4 md:mt-0 flex flex-col items-end space-y-3">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Price</p>
                      <p className="text-3xl font-bold text-zambian-orange-600">
                        K{route.price}
                      </p>
                    </div>
                    <Link
                      href={`/customer/booking?routeId=${route.id}`}
                      className="px-8 py-3 bg-gradient-to-r from-zambian-green-500 to-zambian-green-600 text-white rounded-lg font-bold hover:from-zambian-green-600 hover:to-zambian-green-700 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                    >
                      Book Now →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* No Results */}
      {!loading && routes.length === 0 && searchParams.origin && searchParams.destination && (
        <section className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-lg p-12 text-center max-w-2xl mx-auto border-t-4 border-zambian-orange-500">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">No Buses Found</h3>
            <p className="text-gray-600 mb-6">
              We couldn't find any buses for this route on the selected date.
              Try searching for a different date or route.
            </p>
            <button
              onClick={() => setSearchParams({ ...searchParams, destination: '' })}
              className="px-6 py-3 bg-zambian-green-500 text-white rounded-lg font-semibold hover:bg-zambian-green-600 transition-all"
            >
              Try Different Route
            </button>
          </div>
        </section>
      )}

      {/* Footer with Zambian Colors */}
      <footer className="bg-gradient-to-r from-zambian-green-700 via-zambian-green-800 to-zambian-black text-white mt-16">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-xl font-bold mb-4 text-zambian-orange-400">About Us</h4>
              <p className="text-gray-300 text-sm leading-relaxed">
                Zambia's leading online bus booking platform, connecting travelers across all 10 provinces with safe, reliable, and comfortable intercity transport.
              </p>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4 text-zambian-orange-400">Popular Routes</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>Lusaka → Ndola</li>
                <li>Lusaka → Livingstone</li>
                <li>Lusaka → Kitwe</li>
                <li>Ndola → Kitwe</li>
                <li>Livingstone → Kazungula</li>
              </ul>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4 text-zambian-orange-400">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><Link href="/customer/login" className="hover:text-zambian-orange-400 transition-colors">Customer Login</Link></li>
                <li><Link href="/company/login" className="hover:text-zambian-orange-400 transition-colors">Company Login</Link></li>
                <li><a href="#" className="hover:text-zambian-orange-400 transition-colors">Help & Support</a></li>
                <li><a href="#" className="hover:text-zambian-orange-400 transition-colors">Terms & Conditions</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-4 text-zambian-orange-400">Contact Us</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>📧 info@zambiabus.com</li>
                <li>📱 +260 XXX XXX XXX</li>
                <li>📍 Lusaka, Zambia</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-zambian-green-600 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 VayaZed Bus Booking. All rights reserved. 🇿🇲</p>
          </div>
        </div>
      </footer>
    </div>
  );
}