# VayaZed Developer Guide v2.0.0

**Version:** 2.0.0  
**Last Updated:** March 12, 2026  
**For Developers:** Moov Development Team

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Component-Based UI](#component-based-ui)
4. [PWA Development](#pwa-development)
5. [Offline Storage](#offline-storage)
6. [Real-time Features](#real-time-features)
7. [Mobile Money Integration](#mobile-money-integration)
8. [Testing](#testing)
9. [Deployment](#deployment)
10. [Best Practices](#best-practices)

---

## Overview

VayaZed v2.0.0 is built with Next.js 16, React 19, and TypeScript, featuring a component-based architecture, PWA capabilities, real-time tracking, and enhanced mobile-first design.

### Key Technical Features

- **Progressive Web App (PWA)** with offline support
- **Real-time communication** via WebSocket/Socket.IO
- **Component-based architecture** for maintainability
- **TypeScript** for type safety
- **Mobile Money Integration** (Airtel, MTN)
- **GPS Tracking** with multiple providers
- **IndexedDB** for offline data storage

---

## Architecture

### Project Structure

```
vayazed/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Auth group routes
│   ├── (customer)/          # Customer routes
│   ├── (company)/           # Company routes
│   ├── (agent)/             # Agent routes (NEW)
│   ├── (driver)/            # Driver routes (NEW)
│   ├── (admin)/             # Admin routes
│   ├── api/                 # API routes
│   │   ├── auth/           # Authentication endpoints
│   │   ├── agent/          # Agent endpoints (NEW)
│   │   ├── reviews/        # Review endpoints (NEW)
│   │   ├── tracking/       # Tracking endpoints (NEW)
│   │   ├── notifications/  # Notification endpoints (NEW)
│   │   └── pwa/            # PWA endpoints (NEW)
│   ├── components/         # Reusable components
│   │   ├── ui/            # Base UI components
│   │   ├── booking/       # Booking components
│   │   ├── reviews/       # Review components (NEW)
│   │   ├── agent/         # Agent components (NEW)
│   │   ├── driver/        # Driver components (NEW)
│   │   └── pwa/           # PWA components (NEW)
│   ├── lib/               # Utility functions
│   ├── services/          # Service layer (NEW)
│   ├── hooks/             # Custom React hooks
│   ├── store/             # State management
│   └── types/             # TypeScript types
├── public/                # Static assets
│   ├── icons/            # PWA icons
│   └── sw.js             # Service worker
├── database/             # Database utilities
├── middleware/           # Middleware
├── scripts/              # Build and deployment scripts
└── config/               # Configuration files
```

### Layered Architecture

```
┌─────────────────────────────┐
│     Presentation Layer      │  ← React Components, Pages
│   (app/, components/)       │
├─────────────────────────────┤
│      Service Layer          │  ← Business Logic (NEW)
│      (services/)            │
├─────────────────────────────┤
│      API Layer              │  ← API Routes
│       (api/)                │
├─────────────────────────────┤
│    Data Access Layer        │  ← Database Queries
│     (database/)             │
└─────────────────────────────┘
```

---

## Component-Based UI

### Component Structure

All components follow a consistent structure:

```typescript
// app/components/booking/SeatSelector.tsx
import React, { useState, useCallback } from 'react';
import { Seat } from '@/types';

interface SeatSelectorProps {
  seats: Seat[];
  selectedSeats: string[];
  onSeatSelect: (seatId: string) => void;
  maxSelection?: number;
}

export const SeatSelector: React.FC<SeatSelectorProps> = ({
  seats,
  selectedSeats,
  onSeatSelect,
  maxSelection = 10
}) => {
  const [hoveredSeat, setHoveredSeat] = useState<string | null>(null);

  const handleSeatClick = useCallback((seatId: string) => {
    if (selectedSeats.includes(seatId)) {
      onSeatSelect(seatId); // Deselect
    } else if (selectedSeats.length < maxSelection) {
      onSeatSelect(seatId); // Select
    }
  }, [selectedSeats, maxSelection, onSeatSelect]);

  return (
    <div className="seat-selector">
      {seats.map((seat) => (
        <Seat
          key={seat.id}
          seat={seat}
          isSelected={selectedSeats.includes(seat.id)}
          isHovered={hoveredSeat === seat.id}
          onClick={handleSeatClick}
          onHover={setHoveredSeat}
        />
      ))}
    </div>
  );
};
```

### Component Categories

1. **Base UI Components** (`components/ui/`)
   - Button, Input, Modal, Card
   - Form elements
   - Layout components

2. **Feature Components** (`components/{feature}/`)
   - Booking: SeatSelector, RouteCard, BookingForm
   - Reviews: ReviewCard, RatingStars, ReviewForm
   - Tracking: MapView, LocationMarker, ETAIndicator
   - Agent: AgentDashboard, BookingForm, CommissionChart

3. **Business Components** (`components/business/`)
   - UserProfile, CompanyProfile, BookingCard

### Reusable Hooks

```typescript
// app/hooks/useDebounce.ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Usage in Search Component
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearchTerm = useDebounce(searchTerm, 500);

useEffect(() => {
  if (debouncedSearchTerm) {
    searchRoutes(debouncedSearchTerm);
  }
}, [debouncedSearchTerm]);
```

---

## PWA Development

### Service Worker Setup

```javascript
// public/sw.js
const CACHE_NAME = 'vayazed-v2.0.0';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/offline'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
  );
});
```

### App Manifest

```json
// public/manifest.json
{
  "name": "VayaZed",
  "short_name": "VayaZed",
  "description": "Zambia's Premier Bus Booking Platform",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2BB2A9",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### PWA Installation Prompt

```typescript
// app/components/pwa/InstallPrompt.tsx
import { useEffect, useState } from 'react';

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    
    setDeferredPrompt(null);
  };

  if (!showPrompt) return null;

  return (
    <button onClick={handleInstall} className="install-btn">
      Install VayaZed App
    </button>
  );
};
```

---

## Offline Storage

### IndexedDB Setup

```typescript
// app/lib/offlineStorage.ts
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface VayaZedDB extends DBSchema {
  bookings: {
    key: string;
    value: {
      id: string;
      scheduleId: number;
      seats: string[];
      timestamp: number;
      synced: boolean;
    };
    indexes: {
      'by-synced': boolean;
    };
  };
  routes: {
    key: string;
    value: Route;
  };
  companies: {
    key: number;
    value: Company;
  };
}

let db: IDBPDatabase<VayaZedDB> | null = null;

export async function getDB() {
  if (!db) {
    db = await openDB<VayaZedDB>('vayazed-v2', 1, {
      upgrade(database) {
        const bookingStore = database.createObjectStore('bookings', {
          keyPath: 'id'
        });
        bookingStore.createIndex('by-synced', 'synced');

        database.createObjectStore('routes', {
          keyPath: 'id'
        });

        database.createObjectStore('companies', {
          keyPath: 'id'
        });
      }
    });
  }
  return db;
}

// Save booking offline
export async function saveOfflineBooking(booking: any) {
  const db = await getDB();
  await db.add('bookings', {
    ...booking,
    synced: false,
    timestamp: Date.now()
  });
}

// Get unsynced bookings
export async function getUnsyncedBookings() {
  const db = await getDB();
  return await db.getAllFromIndex('bookings', 'by-synced', false);
}

// Mark booking as synced
export async function markBookingSynced(bookingId: string) {
  const db = await getDB();
  const booking = await db.get('bookings', bookingId);
  if (booking) {
    await db.put('bookings', { ...booking, synced: true });
  }
}
```

### Offline Sync Hook

```typescript
// app/hooks/useOfflineSync.ts
import { useEffect } from 'react';
import { getUnsyncedBookings, markBookingSynced } from '@/lib/offlineStorage';

export function useOfflineSync() {
  useEffect(() => {
    // Sync when back online
    const handleOnline = async () => {
      const unsyncedBookings = await getUnsyncedBookings();
      
      for (const booking of unsyncedBookings) {
        try {
          await fetch('/api/pwa/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${getAuthToken()}`
            },
            body: JSON.stringify({ offlineBookings: [booking] })
          });
          
          await markBookingSynced(booking.id);
        } catch (error) {
          console.error('Failed to sync booking:', error);
        }
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);
}
```

---

## Real-time Features

### WebSocket Connection

```typescript
// app/lib/socket.ts
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(token?: string) {
  if (!socket && token) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('Connected to WebSocket');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
    });

    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
```

### Real-time Bus Tracking Hook

```typescript
// app/hooks/useBusTracking.ts
import { useEffect, useState, useCallback } from 'react';
import { getSocket } from '@/lib/socket';

interface BusLocation {
  latitude: number;
  longitude: number;
  speed: number;
  timestamp: string;
}

export function useBusTracking(busNumber: string) {
  const [location, setLocation] = useState<BusLocation | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  const startTracking = useCallback(() => {
    const socket = getSocket(getAuthToken());
    socket?.emit('subscribe:bus', { busNumber });
    setIsTracking(true);
  }, [busNumber]);

  const stopTracking = useCallback(() => {
    const socket = getSocket();
    socket?.emit('unsubscribe:bus', { busNumber });
    setIsTracking(false);
  }, [busNumber]);

  useEffect(() => {
    const socket = getSocket(getAuthToken());

    if (isTracking) {
      socket?.on('bus:location', (data: BusLocation) => {
        setLocation(data);
      });
    }

    return () => {
      socket?.off('bus:location');
    };
  }, [isTracking]);

  return { location, isTracking, startTracking, stopTracking };
}
```

### Push Notifications

```typescript
// app/lib/pushNotifications.ts
import { messaging, getToken } from 'firebase/messaging';

export async function requestNotificationPermission() {
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

export async function getFCMToken() {
  try {
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    });
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}

export async function registerPushSubscription(token: string) {
  try {
    const response = await fetch('/api/notifications/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({ subscription: { token } })
    });

    return response.ok;
  } catch (error) {
    console.error('Error registering push subscription:', error);
    return false;
  }
}
```

---

## Mobile Money Integration

### Airtel Money Integration

```typescript
// app/services/payment/airtelMoney.ts
import axios from 'axios';

interface AirtelPaymentRequest {
  amount: number;
  phoneNumber: string;
  reference: string;
}

interface AirtelPaymentResponse {
  transactionId: string;
  status: 'pending' | 'success' | 'failed';
  message: string;
}

export class AirtelMoneyService {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.AIRTEL_MONEY_API_KEY!;
    this.apiSecret = process.env.AIRTEL_MONEY_API_SECRET!;
    this.baseUrl = process.env.AIRTEL_MONEY_BASE_URL || 'https://api.airtel.com';
  }

  async initiatePayment(request: AirtelPaymentRequest): Promise<AirtelPaymentResponse> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/payment/initiate`,
        {
          amount: request.amount,
          msisdn: request.phoneNumber,
          reference: request.reference
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey,
            'X-API-Secret': this.apiSecret
          }
        }
      );

      return {
        transactionId: response.data.transaction_id,
        status: 'pending',
        message: 'Payment initiated successfully'
      };
    } catch (error) {
      throw new Error('Failed to initiate Airtel Money payment');
    }
  }

  async checkStatus(transactionId: string): Promise<AirtelPaymentResponse> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/payment/status/${transactionId}`,
        {
          headers: {
            'X-API-Key': this.apiKey,
            'X-API-Secret': this.apiSecret
          }
        }
      );

      return {
        transactionId,
        status: response.data.status,
        message: response.data.message
      };
    } catch (error) {
      throw new Error('Failed to check payment status');
    }
  }
}
```

### Payment Service Interface

```typescript
// app/services/payment/index.ts
import { AirtelMoneyService } from './airtelMoney';
import { MTNMoneyService } from './mtnMoney';

export interface PaymentService {
  initiatePayment(request: PaymentRequest): Promise<PaymentResponse>;
  checkStatus(transactionId: string): Promise<PaymentResponse>;
}

export class PaymentFactory {
  static getProvider(provider: string): PaymentService {
    switch (provider) {
      case 'airtel_money':
        return new AirtelMoneyService();
      case 'mtn_mobile_money':
        return new MTNMoneyService();
      default:
        throw new Error(`Unsupported payment provider: ${provider}`);
    }
  }
}
```

---

## Testing

### Unit Tests with Jest

```typescript
// components/__tests__/SeatSelector.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { SeatSelector } from '../SeatSelector';

describe('SeatSelector', () => {
  const mockSeats = [
    { id: '1A', status: 'available' },
    { id: '1B', status: 'booked' },
    { id: '1C', status: 'available' }
  ];

  it('renders all seats', () => {
    render(
      <SeatSelector
        seats={mockSeats}
        selectedSeats={[]}
        onSeatSelect={jest.fn()}
      />
    );

    expect(screen.getByText('1A')).toBeInTheDocument();
    expect(screen.getByText('1B')).toBeInTheDocument();
    expect(screen.getByText('1C')).toBeInTheDocument();
  });

  it('calls onSeatSelect when clicking available seat', () => {
    const mockSelect = jest.fn();
    render(
      <SeatSelector
        seats={mockSeats}
        selectedSeats={[]}
        onSeatSelect={mockSelect}
      />
    );

    fireEvent.click(screen.getByText('1A'));
    expect(mockSelect).toHaveBeenCalledWith('1A');
  });

  it('does not allow selecting booked seats', () => {
    const mockSelect = jest.fn();
    render(
      <SeatSelector
        seats={mockSeats}
        selectedSeats={[]}
        onSeatSelect={mockSelect}
      />
    );

    const bookedSeat = screen.getByText('1B');
    expect(bookedSeat).toBeDisabled();
  });
});
```

### Integration Tests

```typescript
// api/__tests__/booking.test.ts
import { POST } from '../booking/create';
import { createMocks } from 'node-mocks-http';

describe('/api/booking/create', () => {
  it('creates a booking successfully', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        scheduleId: 1,
        seats: ['4A', '4B'],
        passengers: [...],
        paymentMethod: 'mobile_money'
      },
      headers: {
        authorization: 'Bearer valid-token'
      }
    });

    await POST(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toMatchObject({
      success: true,
      data: {
        bookingId: expect.any(Number)
      }
    });
  });
});
```

---

## Deployment

### Environment Variables

```bash
# .env.production
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://vayazed.com
NEXT_PUBLIC_SOCKET_URL=https://api.vayazed.com

# Database
DATABASE_URL=postgresql://user:pass@host:5432/vayazed

# Authentication
JWT_SECRET=your-production-secret

# Mobile Money
AIRTEL_MONEY_API_KEY=prod-key
AIRTEL_MONEY_API_SECRET=prod-secret
MTN_MOBILE_MONEY_API_KEY=prod-key
MTN_MOBILE_MONEY_API_SECRET=prod-secret

# Push Notifications
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# GPS Tracking
CTRACK_API_KEY=prod-key
CTRACK_API_SECRET=prod-secret
```

### Build Process

```bash
# Install dependencies
npm ci

# Run tests
npm test

# Build application
npm run build

# Start production server
npm start
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine AS runner

WORKDIR /app

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/vayazed
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=vayazed
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

## Best Practices

### Code Style

1. **TypeScript**: Use strict mode and type all variables
2. **Components**: Functional components with hooks
3. **Naming**: Use descriptive names (PascalCase for components, camelCase for functions)
4. **Comments**: Document complex logic and public APIs

### Performance

1. **Lazy Loading**: Use `next/dynamic` for heavy components
2. **Image Optimization**: Use Next.js Image component
3. **Code Splitting**: Split routes and components
4. **Caching**: Implement API response caching

### Security

1. **Input Validation**: Validate all user inputs
2. **Authentication**: Use JWT with proper expiration
3. **Authorization**: Check permissions on all protected routes
4. **Data Sanitization**: Sanitize data before database operations

### Error Handling

```typescript
// app/lib/errorHandler.ts
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof AppError) {
    return {
      success: false,
      message: error.message,
      statusCode: error.statusCode
    };
  }

  return {
    success: false,
    message: 'An unexpected error occurred',
    statusCode: 500
  };
}
```

### Logging

```typescript
// app/lib/logger.ts
export class Logger {
  private static log(level: string, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data
    };

    console.log(JSON.stringify(logEntry));

    // Send to logging service in production
    if (process.env.NODE_ENV === 'production') {
      // Send to Sentry, LogRocket, etc.
    }
  }

  static info(message: string, data?: any) {
    this.log('info', message, data);
  }

  static error(message: string, error?: any) {
    this.log('error', message, error);
  }

  static warn(message: string, data?: any) {
    this.log('warn', message, data);
  }
}
```

---

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Socket.IO Documentation](https://socket.io/docs/)

---

**© 2026 VayaZed. All rights reserved. Powered by Moov.**