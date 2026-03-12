'use client';

import Link from 'next/link';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border-t-4 border-primary-500">
        <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8m-8 4h8m-4 4v3m-6-3h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7a2 2 0 002 2zm0 0v3a1 1 0 001 1h2m8-4v3a1 1 0 01-1 1h-2" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-2">You're Offline</h1>
        <p className="text-gray-600 mb-6">
          Don't worry! You can still view your downloaded tickets and booking history.
        </p>
        
        <div className="space-y-3 mb-6">
          <Link
            href="/customer/dashboard"
            className="block w-full px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium"
          >
            View My Bookings
          </Link>
          
          <Link
            href="/"
            className="block w-full px-4 py-3 border-2 border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition font-medium"
          >
            Try Again
          </Link>
        </div>
        
        <p className="text-sm text-gray-500">
          Connect to the internet to search for new buses and make bookings.
        </p>
      </div>
    </div>
  );
}