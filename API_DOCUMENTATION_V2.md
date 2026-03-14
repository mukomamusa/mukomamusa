# VayaZed API Documentation v2.0.0

**Version:** 2.0.0  
**Base URL:** `https://api.vayazed.com/api` (or `http://localhost:3000/api` for development)  
**Last Updated:** March 12, 2026

---

## Overview

VayaZed v2.0.0 features over 80 API endpoints organized into several categories. This documentation covers all available endpoints, including the 40+ new endpoints added in v2.0.0.

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Response Format

All responses follow this structure:

```json
{
  "success": true|false,
  "message": "Human-readable message",
  "data": { ... },
  "error": "Error details (if success: false)"
}
```

---

## Table of Contents

1. [Authentication](#authentication-endpoints)
2. [Customers](#customer-endpoints)
3. [Bus Companies](#bus-company-endpoints)
4. [Bookings](#booking-endpoints)
5. [Routes & Schedules](#routes--schedules-endpoints)
6. [Payments](#payment-endpoints)
7. [Tracking](#tracking-endpoints)
8. [Reviews & Ratings](#reviews--ratings-endpoints) ⭐ NEW
9. [Agent System](#agent-system-endpoints) 🆕 NEW
10. [PWA & Offline Sync](#pwa--offline-sync-endpoints) 🆕 NEW
11. [Notifications](#notification-endpoints) 🆕 NEW
12. [Drivers](#driver-endpoints) 🆕 NEW
13. [Admin](#admin-endpoints)

---

## Authentication Endpoints

### Register Customer
```http
POST /auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "phone": "+260971234567",
  "nrc": "123456/78/9"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": { "id": 1, "name": "John Doe", "email": "john@example.com" },
    "token": "jwt-token-here"
  }
}
```

### Login (Email-Based) ⚠️ UPDATED
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Note:** v2.0.0 uses email-based authentication (changed from phone-based in v1.0.0)

### Google OAuth
```http
POST /auth/google
```

**Request Body:**
```json
{
  "idToken": "google-id-token"
}
```

### Forgot Password
```http
POST /auth/forgot-password
```

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

### Reset Password
```http
POST /auth/reset-password
```

**Request Body:**
```json
{
  "token": "reset-token",
  "newPassword": "newsecurepassword"
}
```

### Enable 2FA
```http
POST /auth/enable-2fa
```

**Headers:** `Authorization: Bearer <token>`

### Verify 2FA
```http
POST /auth/verify-2fa
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "token": "123456",
  "password": "securepassword123"
}
```

---

## Customer Endpoints

### Get Profile
```http
GET /customer/profile
```
**Headers:** `Authorization: Bearer <token>`

### Update Profile
```http
PUT /customer/profile
```

**Request Body:**
```json
{
  "name": "John Updated",
  "phone": "+260971234568",
  "emergencyContact": "+260971234569"
}
```

### Get Bookings
```http
GET /customer/bookings
```
**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `status`: `pending|confirmed|completed|cancelled` (optional)
- `limit`: Number of results (default: 20)

### Get Booking Details
```http
GET /customer/bookings/{id}
```
**Headers:** `Authorization: Bearer <token>`

### Cancel Booking
```http
POST /customer/bookings/{id}/cancel
```
**Headers:** `Authorization: Bearer <token>`

### Get Dashboard Stats 🆕
```http
GET /customer/dashboard/stats
```
**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalTrips": 12,
    "totalDistance": 4500,
    "moneySaved": 120,
    "loyaltyPoints": 1200,
    "upcomingTrips": 2,
    "completedTrips": 10
  }
}
```

### Get Loyalty Points 🆕
```http
GET /customer/loyalty-points
```
**Headers:** `Authorization: Bearer <token>`

---

## Bus Company Endpoints

### Register Company
```http
POST /company/register
```

**Request Body:**
```json
{
  "name": "Mazhandu Family Bus",
  "email": "info@mazhandu.com",
  "password": "securepassword",
  "phone": "+260971234567",
  "rtsaLicense": "RTSA-12345",
  "pacraRegistration": "PACRA-67890",
  "logo": "base64-image-data"
}
```

### Get Company Profile
```http
GET /company/profile
```
**Headers:** `Authorization: Bearer <token>`

### Update Company Profile
```http
PUT /company/profile
```
**Headers:** `Authorization: Bearer <token>`

### Get Dashboard Stats 🆕
```http
GET /company/dashboard/stats
```
**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "todayBookings": 45,
    "revenueToday": 8100,
    "activeBuses": 8,
    "totalDrivers": 12,
    "totalRevenue": 150000,
    "totalPassengers": 1200
  }
}
```

### Get Fleet Overview 🆕
```http
GET /company/fleet
```
**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "busNumber": "ZM 1234",
      "type": "Luxury Coach",
      "status": "on_route",
      "driver": { "name": "James Phiri", "rating": 4.9 },
      "passengers": 25,
      "capacity": 40,
      "route": "Lusaka to Livingstone",
      "progress": 60
    }
  ]
}
```

### Add Bus
```http
POST /company/buses
```
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "busNumber": "ZM 1234",
  "type": "Luxury Coach",
  "capacity": 40,
  "amenities": ["WiFi", "AC", "USB", "TV"],
  "photos": ["base64-image-1", "base64-image-2"]
}
```

### Get Route Performance 🆕
```http
GET /company/routes/performance
```
**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `startDate`: YYYY-MM-DD
- `endDate`: YYYY-MM-DD

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "route": "Lusaka to Livingstone",
      "bookings": 45,
      "revenue": 8100,
      "rating": 4.8,
      "avgFillRate": 85
    }
  ]
}
```

### Get Driver Performance 🆕
```http
GET /company/drivers/performance
```
**Headers:** `Authorization: Bearer <token>`

### Get Upcoming Departures 🆕
```http
GET /company/departures/upcoming
```
**Headers:** `Authorization: Bearer <token>`

---

## Booking Endpoints

### Search Buses
```http
GET /booking/search
```

**Query Parameters:**
- `from`: Origin city (required)
- `to`: Destination city (required)
- `date`: Travel date YYYY-MM-DD (required)
- `passengers`: Number of passengers (default: 1)
- `busType`: `luxury|executive|standard` (optional)
- `minPrice`: Minimum price (optional)
- `maxPrice`: Maximum price (optional)
- `minRating`: Minimum rating (optional)
- `companies`: Comma-separated company IDs (optional)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "company": {
        "id": 1,
        "name": "Mazhandu Family Bus",
        "logo": "logo-url",
        "rating": 4.8
      },
      "busNumber": "ZM 1234",
      "type": "Luxury Coach",
      "departureTime": "06:00",
      "arrivalTime": "11:30",
      "duration": "5h 30m",
      "price": 180,
      "availableSeats": 15,
      "amenities": ["WiFi", "AC", "USB", "TV"],
      "previewImages": ["image-1.jpg", "image-2.jpg"]
    }
  ],
  "total": 15
}
```

### Get Seat Availability
```http
GET /booking/seat-availability/{scheduleId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "capacity": 40,
    "layout": "2-2",
    "seats": [
      { "row": 1, "column": "A", "status": "booked" },
      { "row": 1, "column": "B", "status": "available" },
      { "row": 1, "column": "C", "status": "available" },
      { "row": 1, "column": "D", "status": "booked" }
    ]
  }
}
```

### Create Booking
```http
POST /booking/create
```
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "scheduleId": 1,
  "seats": ["4A", "4B"],
  "passengers": [
    {
      "name": "John Doe",
      "nrc": "123456/78/9",
      "phone": "+260971234567",
      "type": "adult"
    },
    {
      "name": "Jane Doe",
      "nrc": "123456/78/0",
      "phone": "+260971234568",
      "type": "adult"
    }
  ],
  "luggage": 2,
  "boardingPoint": "Lusaka",
  "paymentMethod": "mobile_money"
}
```

### Confirm Payment
```http
POST /booking/payment/confirm
```
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "bookingId": 123,
  "transactionId": "TXN123456",
  "amount": 360,
  "paymentMethod": "airtel_money"
}
```

### Generate Ticket
```http
GET /booking/ticket/{bookingId}
```
**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "bookingReference": "VAY-20240315-001234",
    "route": "Lusaka to Livingstone",
    "company": "Mazhandu Family Bus",
    "date": "2026-03-15",
    "departureTime": "06:00",
    "seats": ["4A", "4B"],
    "passengers": ["John Doe", "Jane Doe"],
    "totalPaid": 360,
    "qrCode": "data:image/png;base64,..."
  }
}
```

---

## Payment Endpoints

### Initiate Mobile Money Payment 🆕
```http
POST /payment/mobile-money/initiate
```
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "bookingId": 123,
  "amount": 360,
  "provider": "airtel_money", // or "mtn_mobile_money"
  "phoneNumber": "+260971234567"
}
```

### Verify Mobile Money Payment 🆕
```http
POST /payment/mobile-money/verify
```
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "transactionId": "TXN123456",
  "provider": "airtel_money"
}
```

### Get Payment Methods 🆕
```http
GET /payment/methods
```
**Headers:** `Authorization: Bearer <token>`

### Process Refund
```http
POST /payment/refund/{bookingId}
```
**Headers:** `Authorization: Bearer <token>`

---

## Tracking Endpoints

### Get Bus Location (Real-time) 🆕
```http
GET /tracking/bus/{busNumber}
```
**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "busNumber": "ZM 1234",
    "latitude": -15.4167,
    "longitude": 28.2833,
    "speed": 80,
    "lastUpdate": "2026-03-15T08:30:00Z",
    "route": {
      "origin": "Lusaka",
      "destination": "Livingstone",
      "currentLocation": "Choma",
      "progress": 60,
      "eta": "2026-03-15T11:30:00Z"
    },
    "driver": {
      "name": "James Phiri",
      "rating": 4.9
    }
  }
}
```

### Get Location History 🆕
```http
GET /tracking/bus/{busNumber}/history
```
**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `startDate`: YYYY-MM-DD
- `endDate`: YYYY-MM-DD

### Update Driver Location (Driver App) 🆕
```http
POST /tracking/driver/update-location
```
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "latitude": -15.4167,
  "longitude": 28.2833,
  "speed": 80,
  "tripId": 123
}
```

### Start Trip (Driver) 🆕
```http
POST /tracking/driver/start-trip
```
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "tripId": 123,
  "busNumber": "ZM 1234",
  "departureTime": "2026-03-15T06:00:00Z"
}
```

### End Trip (Driver) 🆕
```http
POST /tracking/driver/end-trip
```
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "tripId": 123,
  "arrivalTime": "2026-03-15T11:30:00Z",
  "passengersBoarded": 35
}
```

---

## Reviews & Ratings Endpoints ⭐ NEW

### Create Review
```http
POST /reviews/create
```
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "bookingId": 123,
  "companyId": 1,
  "driverId": 5,
  "overallRating": 5,
  "comfortRating": 5,
  "punctualityRating": 4,
  "staffRating": 5,
  "valueRating": 4,
  "comment": "Great journey, comfortable seats and friendly staff!"
}
```

### Get Company Reviews
```http
GET /reviews/company/{companyId}
```

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20)
- `sort`: `recent|highest|lowest` (default: recent)

**Response:**
```json
{
  "success": true,
  "data": {
    "company": {
      "id": 1,
      "name": "Mazhandu Family Bus",
      "averageRating": 4.8,
      "totalReviews": 156,
      "ratingBreakdown": {
        "5": 120,
        "4": 25,
        "3": 8,
        "2": 2,
        "1": 1
      }
    },
    "reviews": [
      {
        "id": 1,
        "customer": { "name": "John Doe", "avatar": "avatar-url" },
        "rating": 5,
        "comment": "Excellent service!",
        "date": "2026-03-15",
        "verifiedPurchase": true
      }
    ],
    "pagination": {
      "page": 1,
      "totalPages": 8,
      "total": 156
    }
  }
}
```

### Get Driver Reviews
```http
GET /reviews/driver/{driverId}
```

### Get My Reviews
```http
GET /reviews/my-reviews
```
**Headers:** `Authorization: Bearer <token>`

### Update Review
```http
PUT /reviews/{reviewId}
```
**Headers:** `Authorization: Bearer <token>`

### Delete Review
```http
DELETE /reviews/{reviewId}
```
**Headers:** `Authorization: Bearer <token>`

### Get Review Stats (Admin) 🆕
```http
GET /reviews/stats
```
**Headers:** `Authorization: Bearer <token>`

### Moderate Review (Admin) 🆕
```http
POST /reviews/{reviewId}/moderate
```
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "action": "approve|reject|flag",
  "reason": "Review violates community guidelines"
}
```

---

## Agent System Endpoints 🆕 NEW

### Agent Registration
```http
POST /agent/register
```

**Request Body:**
```json
{
  "name": "Sarah Mwamba",
  "email": "sarah@agent.com",
  "password": "securepassword",
  "phone": "+260971234567",
  "agencyName": "Travel Excellence Agency",
  "businessLicense": "BL-12345",
  "commissionRate": 8
}
```

### Agent Login
```http
POST /agent/login
```

**Request Body:**
```json
{
  "email": "sarah@agent.com",
  "password": "securepassword"
}
```

### Get Agent Dashboard Stats
```http
GET /agent/dashboard/stats
```
**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "todayBookings": 28,
    "commissionEarned": 1296,
    "totalCustomers": 156,
    "thisMonthRevenue": 45600,
    "commissionRate": 8,
    "rating": 4.8
  }
}
```

### Create Booking (Agent)
```http
POST /agent/booking/create
```
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "customerName": "John Mwamba",
  "customerPhone": "+260971234567",
  "customerEmail": "john@example.com",
  "scheduleId": 1,
  "seats": ["4A", "4B"],
  "passengers": [
    {
      "name": "John Mwamba",
      "nrc": "123456/78/9",
      "phone": "+260971234567",
      "type": "adult"
    }
  ],
  "paymentMethod": "mobile_money"
}
```

### Create Bulk Booking (Agent) 🆕
```http
POST /agent/booking/bulk
```
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "bookings": [
    {
      "customerName": "John Mwamba",
      "customerPhone": "+260971234567",
      "scheduleId": 1,
      "seats": ["4A", "4B"],
      "passengers": [...]
    },
    {
      "customerName": "Mary Phiri",
      "customerPhone": "+260971234568",
      "scheduleId": 2,
      "seats": ["5A"],
      "passengers": [...]
    }
  ]
}
```

### Get Agent Bookings
```http
GET /agent/bookings
```
**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `status`: `pending|confirmed|completed|cancelled`
- `startDate`: YYYY-MM-DD
- `endDate`: YYYY-MM-DD

### Get Commission Report
```http
GET /agent/commission/report
```
**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `startDate`: YYYY-MM-DD
- `endDate`: YYYY-MM-DD

**Response:**
```json
{
  "success": true,
  "data": {
    "totalBookings": 45,
    "totalRevenue": 18000,
    "totalCommission": 1440,
    "dailyEarnings": [
      { "date": "2026-03-15", "earnings": 288 },
      { "date": "2026-03-14", "earnings": 192 },
      { "date": "2026-03-13", "earnings": 320 }
    ]
  }
}
```

### Get Agent Customers
```http
GET /agent/customers
```
**Headers:** `Authorization: Bearer <token>`

### Get Agent Profile
```http
GET /agent/profile
```
**Headers:** `Authorization: Bearer <token>`

### Update Agent Profile
```http
PUT /agent/profile
```
**Headers:** `Authorization: Bearer <token>`

---

## PWA & Offline Sync Endpoints 🆕 NEW

### Sync Offline Data
```http
POST /pwa/sync
```
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "offlineBookings": [
    {
      "id": "local-123",
      "scheduleId": 1,
      "seats": ["4A"],
      "timestamp": "2026-03-15T10:00:00Z"
    }
  ],
  "offlineActions": [
    {
      "type": "create_booking",
      "data": { ... },
      "timestamp": "2026-03-15T10:00:00Z"
    }
  ]
}
```

### Get Data for Offline Use
```http
GET /pwa/offline-data
```
**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "routes": [...],
    "companies": [...],
    "myBookings": [...],
    "userProfile": {...},
    "lastSync": "2026-03-15T10:00:00Z"
  }
}
```

### Check for Updates
```http
GET /pwa/updates
```

### Get App Manifest
```http
GET /manifest.json
```

### Service Worker Registration
```http
GET /sw.js
```

---

## Notification Endpoints 🆕 NEW

### Send Push Notification (Server-side)
```http
POST /notifications/send
```
**Headers:** `Authorization: Bearer <admin-token>`

**Request Body:**
```json
{
  "userId": 123,
  "title": "Trip Departure Alert",
  "body": "Your bus to Livingstone departs in 30 minutes",
  "type": "trip_departure",
  "data": {
    "bookingId": 123,
    "route": "Lusaka to Livingstone"
  }
}
```

### Send SMS Notification 🆕
```http
POST /notifications/sms
```
**Headers:** `Authorization: Bearer <admin-token>`

**Request Body:**
```json
{
  "phoneNumber": "+260971234567",
  "message": "Your booking VAY-123456 is confirmed. Trip departs at 06:00 AM.",
  "type": "booking_confirmation"
}
```

### Register Push Subscription
```http
POST /notifications/register
```
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/...",
    "keys": {
      "p256dh": "key...",
      "auth": "auth..."
    }
  }
}
```

### Get Notifications
```http
GET /notifications
```
**Headers:** `Authorization: Bearer <token>`

### Mark Notification as Read
```http
POST /notifications/{id}/read
```
**Headers:** `Authorization: Bearer <token>`

### Mark All as Read
```http
POST /notifications/read-all
```
**Headers:** `Authorization: Bearer <token>`

---

## Driver Endpoints 🆕 NEW

### Get Driver Dashboard Stats
```http
GET /driver/dashboard/stats
```
**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "todayEarnings": 450,
    "completedTrips": 3,
    "totalDistance": 520,
    "currentTrip": {
      "id": 1,
      "route": "Lusaka to Livingstone",
      "status": "in_progress",
      "passengers": 25
    },
    "nextTrip": {
      "id": 2,
      "route": "Kitwe to Lusaka",
      "departureTime": "14:00"
    },
    "rating": 4.9
  }
}
```

### Get Driver Trips
```http
GET /driver/trips
```
**Headers:** `Authorization: Bearer <token>`

### Get Trip Manifest
```http
GET /driver/trips/{tripId}/manifest
```
**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "tripId": 1,
    "route": "Lusaka to Livingstone",
    "busNumber": "ZM 1234",
    "passengers": [
      {
        "name": "John Doe",
        "seat": "4A",
        "boardingPoint": "Lusaka",
        "status": "boarded"
      },
      {
        "name": "Jane Doe",
        "seat": "4B",
        "boardingPoint": "Lusaka",
        "status": "not_boarded"
      }
    ]
  }
}
```

### Board Passenger
```http
POST /driver/trips/{tripId}/board-passenger
```
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "seat": "4A",
  "ticketId": "VAY-123456"
}
```

### Get Driver Profile
```http
GET /driver/profile
```
**Headers:** `Authorization: Bearer <token>`

### Update Driver Profile
```http
PUT /driver/profile
```
**Headers:** `Authorization: Bearer <token>`

---

## Admin Endpoints

### Get System Overview
```http
GET /admin/overview
```
**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 15234,
    "activeBookings": 342,
    "revenueToday": 45600,
    "totalCompanies": 45,
    "activeBuses": 120,
    "totalDrivers": 180,
    "systemHealth": {
      "apiStatus": "online",
      "databaseStatus": "healthy",
      "serverLoad": 32
    }
  }
}
```

### Get Real-time Activity Feed 🆕
```http
GET /admin/activity-feed
```
**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `limit`: Number of results (default: 50)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "new_booking",
      "message": "New booking: John Mwamba - Lusaka to Livingstone",
      "timestamp": "2026-03-15T10:30:00Z",
      "user": "John Mwamba"
    },
    {
      "id": 2,
      "type": "company_registration",
      "message": "Company registered: Eaglestar Transport",
      "timestamp": "2026-03-15T10:15:00Z",
      "user": "Eaglestar Admin"
    }
  ]
}
```

### Manage Users
```http
GET /admin/users
```
**Headers:** `Authorization: Bearer <token>`

### Suspend User
```http
POST /admin/users/{id}/suspend
```
**Headers:** `Authorization: Bearer <token>`

### Approve Company
```http
POST /admin/companies/{id}/approve
```
**Headers:** `Authorization: Bearer <token>`

### Get System Reports
```http
GET /admin/reports
```
**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `type`: `bookings|revenue|users|companies`
- `startDate`: YYYY-MM-DD
- `endDate`: YYYY-MM-DD

### Update Platform Settings 🆕
```http
PUT /admin/settings
```
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "commissionRate": 7.5,
  "subscriptionFee": 500,
  "freeTrialDays": 14,
  "cancellationPolicy": {
    "fullRefundHours": 24,
    "partialRefundHours": 12,
    "partialRefundPercent": 50
  }
}
```

### Get Audit Logs 🆕
```http
GET /admin/audit-logs
```
**Headers:** `Authorization: Bearer <token>`

---

## WebSocket Events (Real-time) 🆕 NEW

### Connection
```javascript
const socket = io('https://api.vayazed.com', {
  auth: { token: 'your-jwt-token' }
});
```

### Events

#### Client → Server

**Subscribe to Booking Updates**
```javascript
socket.emit('subscribe:booking', { bookingId: 123 });
```

**Subscribe to Bus Location**
```javascript
socket.emit('subscribe:bus', { busNumber: 'ZM 1234' });
```

#### Server → Client

**Booking Status Update**
```javascript
socket.on('booking:update', (data) => {
  // data: { bookingId, status, message }
});
```

**Bus Location Update**
```javascript
socket.on('bus:location', (data) => {
  // data: { busNumber, latitude, longitude, speed, timestamp }
});
```

**New Notification**
```javascript
socket.on('notification:new', (data) => {
  // data: { id, title, body, type }
});
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Validation Error |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

---

## Rate Limiting

- **Anonymous**: 100 requests per 15 minutes
- **Authenticated**: 1000 requests per 15 minutes
- **Admin**: Unlimited

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1678886400
```

---

## Versioning

API versioning is done via URL path:
- Current: `https://api.vayazed.com/api/v2`
- Legacy: `https://api.vayazed.com/api/v1` (deprecated)

---

## Support

For API support, contact: api-support@vayazed.com

---

**© 2026 VayaZed. All rights reserved. Powered by Moov.**