// app/components/OfflineIndicator.tsx
'use client';

import { useOffline } from '@/app/hooks/useOffline';
import { useState, useEffect } from 'react';

export default function OfflineIndicator() {
  const { isOnline, wasOffline } = useOffline();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowBanner(true);
    } else if (wasOffline) {
      // Show "back online" banner for 3 seconds
      setShowBanner(true);
      const timer = setTimeout(() => setShowBanner(false), 3000);
      return () => clearTimeout(timer);
    } else {
      setShowBanner(false);
    }
  }, [isOnline, wasOffline]);

  if (!showBanner) return null;

  return (
    <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${
      isOnline ? 'bg-green-600' : 'bg-yellow-600'
    } text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm`}>
      {isOnline ? (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Back online! Syncing...</span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.828-2.829m2.828 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.828-2.828m2.828 2.828L15.536 21" />
          </svg>
          <span>You're offline - viewing saved tickets</span>
        </>
      )}
    </div>
  );
}