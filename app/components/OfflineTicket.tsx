// app/components/OfflineTicket.tsx
'use client';

import { useState, useEffect } from 'react';
import { offlineDB } from '@/app/lib/offline-db';
import { useOffline } from '@/app/hooks/useOffline';
import QRCode from 'qrcode.react';
import Link from 'next/link';

interface OfflineTicketProps {
  ticketId: string;
}

export default function OfflineTicket({ ticketId }: OfflineTicketProps) {
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savedOffline, setSavedOffline] = useState(false);
  const { isOnline, wasOffline } = useOffline();

  useEffect(() => {
    loadTicket();
    // Initialize IndexedDB
    offlineDB.init();
  }, [ticketId]);

  useEffect(() => {
    // When coming back online, check if we were offline
    if (wasOffline && ticket) {
      // Could trigger a sync here
      console.log('Back online, syncing data...');
    }
  }, [wasOffline, ticket]);

  const loadTicket = async () => {
    try {
      // Try to get from IndexedDB first
      const storedTicket = await offlineDB.getTicket(ticketId);
      
      if (storedTicket) {
        setTicket(storedTicket);
        setSavedOffline(true);
        setLoading(false);
        return;
      }

      // If not in IndexedDB and online, fetch from API
      if (isOnline) {
        const response = await fetch(`/api/tickets/${ticketId}`);
        if (!response.ok) throw new Error('Ticket not found');
        
        const data = await response.json();
        setTicket(data);
        
        // Auto-save tickets for offline access
        await offlineDB.saveTicket({
          id: data.id,
          bookingReference: data.bookingReference,
          ticketNumber: data.ticketNumber,
          passengerName: data.passengerName,
          seatNumber: data.seatNumber,
          route: data.route,
          departureTime: data.departureTime,
          date: data.date,
          price: data.price,
          qrCode: data.qrCode,
          status: data.status
        });
        setSavedOffline(true);
      } else {
        setError('Ticket not available offline. Please connect to internet to view your tickets.');
      }
    } catch (err) {
      console.error('Error loading ticket:', err);
      setError('Failed to load ticket');
    } finally {
      setLoading(false);
    }
  };

  const saveForOffline = async () => {
    if (!ticket) return;
    
    try {
      await offlineDB.saveTicket({
        id: ticket.id,
        bookingReference: ticket.bookingReference,
        ticketNumber: ticket.ticketNumber,
        passengerName: ticket.passengerName,
        seatNumber: ticket.seatNumber,
        route: ticket.route,
        departureTime: ticket.departureTime,
        date: ticket.date,
        price: ticket.price,
        qrCode: ticket.qrCode,
        status: ticket.status
      });
      setSavedOffline(true);
      alert('✅ Ticket saved for offline viewing!');
    } catch (err) {
      console.error('Error saving ticket:', err);
      alert('❌ Failed to save ticket offline');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5); // HH:MM format
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-red-600 mb-4">{error || 'Ticket not found'}</p>
        <Link href="/customer/dashboard" className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border-2 border-primary-200 max-w-md mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 p-4 text-white">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm opacity-90">VayaZed Boarding Pass</p>
            <p className="text-xs opacity-75 font-mono mt-1">#{ticket.ticketNumber}</p>
          </div>
          <div className="flex items-center gap-2">
            {!isOnline && (
              <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.828-2.829m2.828 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.828m2.829 2.828L15.536 21" />
                </svg>
                Offline
              </span>
            )}
            {savedOffline && isOnline && (
              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Saved
              </span>
            )}
          </div>
        </div>
      </div>

      {/* QR Code */}
      <div className="p-6 flex justify-center bg-gray-50 border-b border-gray-200">
        <div className="bg-white p-3 rounded-lg shadow-sm">
          <QRCode 
            value={ticket.qrCode || JSON.stringify({
              ticket: ticket.ticketNumber,
              booking: ticket.bookingReference,
              seat: ticket.seatNumber,
              passenger: ticket.passengerName
            })} 
            size={180}
            level="H"
            includeMargin={true}
          />
        </div>
      </div>

      {/* Ticket Details */}
      <div className="p-6 space-y-4">
        {/* Passenger Info */}
        <div className="border-b border-gray-100 pb-3">
          <p className="text-xs text-gray-500 mb-1">Passenger</p>
          <p className="font-bold text-gray-800">{ticket.passengerName}</p>
        </div>

        {/* Route */}
        <div className="border-b border-gray-100 pb-3">
          <p className="text-xs text-gray-500 mb-1">Route</p>
          <p className="font-semibold text-gray-800">{ticket.route}</p>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3">
          <div>
            <p className="text-xs text-gray-500 mb-1">Date</p>
            <p className="font-medium text-gray-800">{formatDate(ticket.date)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Departure</p>
            <p className="font-medium text-gray-800">{formatTime(ticket.departureTime)}</p>
          </div>
        </div>

        {/* Seat & Booking Ref */}
        <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3">
          <div>
            <p className="text-xs text-gray-500 mb-1">Seat</p>
            <p className="text-xl font-bold text-primary-600">{ticket.seatNumber}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Booking Ref</p>
            <p className="font-mono text-sm text-gray-600">{ticket.bookingReference}</p>
          </div>
        </div>

        {/* Price */}
        <div className="flex justify-between items-center">
          <p className="text-xs text-gray-500">Total Paid</p>
          <p className="text-lg font-bold text-secondary-600">K{ticket.price}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          {!savedOffline && isOnline && (
            <button
              onClick={saveForOffline}
              className="flex-1 px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition text-sm font-medium flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Save Offline
            </button>
          )}
          {!isOnline && !savedOffline && (
            <div className="flex-1 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg text-sm text-center">
              Connect to internet to save
            </div>
          )}
          <Link
            href="/customer/dashboard"
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium text-center"
          >
            My Bookings
          </Link>
        </div>

        {/* Offline indicator */}
        {!isOnline && savedOffline && (
          <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Ticket available offline - no internet needed
          </div>
        )}
      </div>
    </div>
  );
}