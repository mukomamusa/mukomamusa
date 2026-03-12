// app/components/OfflineTicketsList.tsx
'use client';

import { useState, useEffect } from 'react';
import { offlineDB } from '@/app/lib/offline-db';
import { useOffline } from '@/app/hooks/useOffline';
import Link from 'next/link';

interface StoredTicket {
  id: string;
  passengerName: string;
  route: string;
  date: string;
  departureTime: string;
  seatNumber: string;
  status: string;
}

export default function OfflineTicketsList() {
  const [tickets, setTickets] = useState<StoredTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const { isOnline } = useOffline();

  useEffect(() => {
    loadOfflineTickets();
  }, []);

  const loadOfflineTickets = async () => {
    try {
      await offlineDB.init();
      const storedTickets = await offlineDB.getTickets();
      setTickets(storedTickets);
    } catch (error) {
      console.error('Error loading offline tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleDelete = async (ticketId: string) => {
    if (!confirm('Remove this ticket from offline storage?')) return;
    
    try {
      // Note: You'll need to add a delete method to offlineDB
      // await offlineDB.deleteTicket(ticketId);
      await loadOfflineTickets(); // Refresh list
    } catch (error) {
      console.error('Error deleting ticket:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-3 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-primary-50 to-secondary-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Offline Tickets ({tickets.length})
          </h3>
          {!isOnline && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
              You're offline
            </span>
          )}
        </div>
      </div>

      {tickets.length === 0 ? (
        <div className="p-8 text-center">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
          <p className="text-gray-500 mb-2">No tickets saved offline</p>
          <p className="text-sm text-gray-400">Save tickets when online to view them without internet</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="p-4 hover:bg-gray-50 transition">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium text-gray-800">{ticket.passengerName}</p>
                  <p className="text-sm text-gray-600">{ticket.route}</p>
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  Offline
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="text-gray-500">
                  {formatDate(ticket.date)} • {ticket.departureTime} • Seat {ticket.seatNumber}
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/customer/ticket/${ticket.id}`}
                    className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => handleDelete(ticket.id)}
                    className="text-gray-400 hover:text-red-600 transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}