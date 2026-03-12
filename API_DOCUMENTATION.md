# API Documentation - VayaZed Bus Booking System

## Base URL
```
http://localhost:3000/api
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Endpoints

### 1. Authentication

#### Register User
**POST** `/api/auth/register`

Register a new customer or bus company.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "phone": "+260971234567",
  "user_type": "customer", // or "company"
  "company_name": "Bus Company Ltd", // required if user_type is "company"
  "license_number": "LIC123456" // required if user_type is "company"
}
```

**Response (201 Created):**
```json
{
  "message": "User registered successfully",
  "userId": 1
}
```

**Error Responses:**
- `400 Bad Request` - Missing required fields
- `409 Conflict` - User already exists

---

#### Login
**POST** `/api/auth/login`

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "phone": "+260971234567",
    "user_type": "customer",
    "company_name": null,
    "license_number": null
  }
}
```

**Error Responses:**
- `400 Bad Request` - Missing email or password
- `401 Unauthorized` - Invalid credentials

---

### 2. Buses

#### Get All Buses
**GET** `/api/buses`

Retrieve all buses, optionally filtered by company.

**Query Parameters:**
- `company_id` (optional) - Filter buses by company ID

**Example:**
```
GET /api/buses?company_id=1
```

**Response (200 OK):**
```json
{
  "buses": [
    {
      "id": 1,
      "company_id": 1,
      "bus_number": "ZM-001-LK",
      "bus_name": "Mazhindu Express",
      "total_seats": 50,
      "bus_type": "Luxury Coach",
      "amenities": "AC,WiFi,Reclining Seats,USB Charging",
      "company_name": "Mazhindu Bus Services",
      "owner_name": "Mazhindu Buses",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

#### Create Bus
**POST** `/api/buses`

Create a new bus (company only).

**Authentication:** Required (Company)

**Request Body:**
```json
{
  "bus_number": "ZM-001-LK",
  "bus_name": "Express Coach",
  "total_seats": 50,
  "bus_type": "Luxury Coach",
  "amenities": "AC,WiFi,Reclining Seats"
}
```

**Response (201 Created):**
```json
{
  "message": "Bus created successfully",
  "busId": 1
}
```

**Error Responses:**
- `401 Unauthorized` - No token provided
- `403 Forbidden` - Not a company account
- `400 Bad Request` - Missing required fields

---

### 3. Routes

#### Search Routes
**GET** `/api/routes`

Search for available routes with filters.

**Query Parameters:**
- `origin` (optional) - Departure city
- `destination` (optional) - Arrival city
- `date` (optional) - Travel date (YYYY-MM-DD)
- `date_from` (optional) - Start date for range search (YYYY-MM-DD)
- `date_to` (optional) - End date for range search (YYYY-MM-DD)
- `flexible_days` (optional) - Number of days ± from the date for flexible search (e.g., '3' for ±3 days)
- `company_id` (optional) - Filter by company

**Example - Single Date:**
```
GET /api/routes?origin=Lusaka&destination=Ndola&date=2024-12-25
```

**Example - Flexible Date Search (±3 days):**
```
GET /api/routes?origin=Lusaka&destination=Ndola&date=2024-12-25&flexible_days=3
```
This returns routes from 2024-12-22 to 2024-12-28.

**Example - Date Range:**
```
GET /api/routes?origin=Lusaka&date_from=2024-12-20&date_to=2024-12-30
```

**Response (200 OK):**
```json
{
  "routes": [
    {
      "id": 1,
      "bus_id": 1,
      "origin": "Lusaka",
      "destination": "Ndola",
      "departure_time": "06:00",
      "arrival_time": "10:30",
      "date": "2024-12-25",
      "price": 250,
      "available_seats": 45,
      "intermediate_stops": "Kabwe,Kapiri Mposhi",
      "status": "active",
      "bus_name": "Mazhindu Express",
      "bus_number": "ZM-001-LK",
      "bus_type": "Luxury Coach",
      "amenities": "AC,WiFi,Reclining Seats,USB Charging",
      "total_seats": 50,
      "company_name": "Mazhindu Bus Services",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

#### Create Route
**POST** `/api/routes`

Create a new route (company only).

**Authentication:** Required (Company)

**Request Body:**
```json
{
  "bus_id": 1,
  "origin": "Lusaka",
  "destination": "Ndola",
  "departure_time": "06:00",
  "arrival_time": "10:30",
  "price": 250,
  "date": "2024-12-25",
  "intermediate_stops": "Kabwe,Kapiri Mposhi"
}
```

**Response (201 Created):**
```json
{
  "message": "Route created successfully",
  "routeId": 1
}
```

**Error Responses:**
- `401 Unauthorized` - No token provided
- `403 Forbidden` - Not a company account
- `404 Not Found` - Bus not found or doesn't belong to company
- `400 Bad Request` - Missing required fields

---

#### Auto-Complete Past Routes
**POST** `/api/routes/auto-complete`

Automatically mark routes as 'completed' when their travel date has passed. Also marks associated bookings as completed.

**Authentication:** Required

**Request Body:** None required

**Response (200 OK):**
```json
{
  "message": "Auto-completion successful",
  "routesCompleted": 5,
  "bookingsCompleted": 12
}
```

**Notes:**
- For company users: Only their routes are processed
- For admin users: All routes are processed
- Typically called automatically when dashboard loads

---

#### Get Pending Completions Count
**GET** `/api/routes/auto-complete`

Get count of routes that need auto-completion.

**Authentication:** Required

**Response (200 OK):**
```json
{
  "pendingCompletion": 3
}
```

---

#### Duplicate Route / Create Recurring Routes
**POST** `/api/company/routes/{routeId}/duplicate`

Create copies of an existing route for one or multiple dates. Useful for regular scheduled services.

**Authentication:** Required (Company)

**Request Body - Single Date:**
```json
{
  "dates": ["2026-02-15"],
  "new_price": 450,
  "new_departure_time": "08:00",
  "new_arrival_time": "12:00"
}
```

**Request Body - Recurring:**
```json
{
  "recurrence": "daily",
  "start_date": "2026-02-15",
  "end_date": "2026-02-28",
  "new_price": 400
}
```

**Recurrence Options:**
- `daily` - Every day in the date range
- `weekdays` - Monday through Friday
- `weekends` - Saturday and Sunday only
- `weekly` - Specific days (requires `days_of_week`)

**Weekly Example:**
```json
{
  "recurrence": "weekly",
  "start_date": "2026-02-15",
  "end_date": "2026-03-31",
  "days_of_week": [1, 3, 5]
}
```
*Days: 0=Sunday, 1=Monday, 2=Tuesday, etc.*

**Response (200 OK):**
```json
{
  "message": "Created 10 route(s)",
  "created": 10,
  "skipped": 2,
  "skippedDates": ["2026-02-20", "2026-02-27"],
  "routeIds": [101, 102, 103, ...]
}
```

**Error Responses:**
- `401 Unauthorized` - No token provided
- `403 Forbidden` - Route doesn't belong to company
- `404 Not Found` - Route not found

**Notes:**
- Dates with scheduling conflicts are automatically skipped
- New routes get full seat capacity from the bus
- Original route details (origin, destination, stops) are preserved

---

### 4. Bookings

#### Get User Bookings
**GET** `/api/bookings`

Get bookings for the authenticated user.

**Authentication:** Required

**For Customers:** Returns their bookings
**For Companies:** Returns all bookings for their buses

**Response (200 OK) - Customer:**
```json
{
  "bookings": [
    {
      "id": 1,
      "customer_id": 1,
      "route_id": 1,
      "seat_numbers": "1,2",
      "num_seats": 2,
      "luggage_count": 1,
      "boarding_point": "Lusaka",
      "total_price": 500,
      "booking_reference": "BK1A2B3C4D5E",
      "status": "confirmed",
      "created_at": "2024-01-01T00:00:00.000Z",
      "origin": "Lusaka",
      "destination": "Ndola",
      "departure_time": "06:00",
      "arrival_time": "10:30",
      "date": "2024-12-25",
      "bus_name": "Mazhindu Express",
      "bus_number": "ZM-001-LK",
      "company_name": "Mazhindu Bus Services"
    }
  ]
}
```

**Response (200 OK) - Company:**
```json
{
  "bookings": [
    {
      "id": 1,
      "customer_id": 1,
      "route_id": 1,
      "seat_numbers": "1,2",
      "num_seats": 2,
      "luggage_count": 1,
      "boarding_point": "Lusaka",
      "total_price": 500,
      "booking_reference": "BK1A2B3C4D5E",
      "status": "confirmed",
      "created_at": "2024-01-01T00:00:00.000Z",
      "origin": "Lusaka",
      "destination": "Ndola",
      "departure_time": "06:00",
      "arrival_time": "10:30",
      "date": "2024-12-25",
      "bus_name": "Mazhindu Express",
      "bus_number": "ZM-001-LK",
      "customer_name": "John Doe",
      "customer_phone": "+260971234567"
    }
  ]
}
```

---

#### Create Booking
**POST** `/api/bookings`

Create a new booking (customer only).

**Authentication:** Required (Customer)

**Request Body:**
```json
{
  "route_id": 1,
  "num_seats": 2,
  "selected_seats": ["A1", "A2"],
  "luggage_count": 1,
  "boarding_point": "Lusaka"
}
```

**Notes:**
- `selected_seats` is optional but recommended for customer-selected seat map bookings
- Seats marked as `blocked` or `reserved` by the company cannot be booked
- When dynamic pricing is enabled for a route, seat-level pricing may increase/decrease the final `totalPrice`

**Response (201 Created):**
```json
{
  "message": "Booking created successfully",
  "bookingId": 1,
  "bookingReference": "BK1A2B3C4D5E",
  "seatNumbers": "1,2",
  "totalPrice": 500
}
```

**Error Responses:**
- `401 Unauthorized` - No token provided
- `403 Forbidden` - Not a customer account
- `400 Bad Request` - Missing required fields
- `500 Internal Server Error` - Not enough seats available or route not found

---

### 5. Seat Map and Pricing

#### Get Route Seat Map (Public)
**GET** `/api/routes/{routeId}/seats`

Retrieve live seat map data for a route during booking.

**Authentication:** Not required

**Response (200 OK):**
```json
{
  "route": {
    "id": 12,
    "origin": "Lusaka",
    "destination": "Ndola",
    "base_price": 180,
    "dynamic_pricing_enabled": true,
    "dynamic_price_multiplier": 1.15
  },
  "seats": [
    {
      "seat_number": "A1",
      "status": "available",
      "price": 207
    },
    {
      "seat_number": "A2",
      "status": "blocked",
      "price": 207
    }
  ]
}
```

**Error Responses:**
- `404 Not Found` - Route not found
- `500 Internal Server Error` - Failed to load seat map

#### Get Company Seat Controls
**GET** `/api/company/routes/{routeId}/seats`

Retrieve company seat state and dynamic pricing settings for one route.

**Authentication:** Required (Company)

**Response (200 OK):**
```json
{
  "route": {
    "id": 12,
    "dynamic_pricing_enabled": true,
    "dynamic_price_multiplier": 1.15
  },
  "seats": [
    {
      "seat_number": "A1",
      "status": "available"
    },
    {
      "seat_number": "A2",
      "status": "reserved"
    }
  ]
}
```

#### Update Company Seat Controls
**PUT** `/api/company/routes/{routeId}/seats`

Update blocked/reserved seats and route dynamic pricing options.

**Authentication:** Required (Company)

**Request Body:**
```json
{
  "dynamic_pricing_enabled": true,
  "dynamic_price_multiplier": 1.1,
  "seat_updates": [
    { "seat_number": "A2", "status": "blocked" },
    { "seat_number": "B1", "status": "reserved" },
    { "seat_number": "C3", "status": "available" }
  ]
}
```

**Valid Seat Status Values:**
- `available`
- `blocked`
- `reserved`

**Error Responses:**
- `401 Unauthorized` - No token provided
- `403 Forbidden` - Not a company account or route ownership mismatch
- `404 Not Found` - Route not found
- `500 Internal Server Error` - Failed to save seat controls

---

### 6. Database Initialization

#### Initialize Database
**GET** `/api/init`

Initialize the database and seed with sample data.

**Note:** This should only be called once during setup.

**Response (200 OK):**
```json
{
  "message": "Database initialized and seeded successfully",
  "credentials": {
    "companies": [
      {
        "email": "info@mazhindubuses.com",
        "password": "password123"
      },
      {
        "email": "contact@powertools.com",
        "password": "password123"
      },
      {
        "email": "info@juldan.com",
        "password": "password123"
      }
    ],
    "customer": {
      "email": "customer@example.com",
      "password": "password123"
    }
  }
}
```

---

## Data Models

### User
```typescript
{
  id: number;
  email: string;
  password: string; // hashed
  name: string;
  phone: string;
  user_type: 'customer' | 'company';
  company_name?: string;
  license_number?: string;
  created_at: string;
}
```

### Bus
```typescript
{
  id: number;
  company_id: number;
  bus_number: string;
  bus_name: string;
  total_seats: number;
  bus_type: string;
  amenities: string;
  created_at: string;
}
```

### Route
```typescript
{
  id: number;
  bus_id: number;
  origin: string;
  destination: string;
  departure_time: string;
  arrival_time: string;
  price: number;
  date: string;
  intermediate_stops: string;
  available_seats: number;
  status: 'active' | 'cancelled' | 'completed';
  created_at: string;
}
```

### Booking
```typescript
{
  id: number;
  customer_id: number;
  route_id: number;
  seat_numbers: string;
  num_seats: number;
  luggage_count: number;
  boarding_point: string;
  total_price: number;
  booking_reference: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
}
```

---

## Error Handling

All endpoints return errors in the following format:

```json
{
  "error": "Error message description"
}
```

### HTTP Status Codes
- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required or failed
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists
- `500 Internal Server Error` - Server error

---

## Rate Limiting

Currently, there are no rate limits implemented. In production, consider implementing rate limiting to prevent abuse.

---

## Security Notes

1. **JWT Tokens:** Tokens expire after 7 days
2. **Password Hashing:** Passwords are hashed using bcrypt
3. **HTTPS:** Use HTTPS in production
4. **Environment Variables:** Store JWT_SECRET in environment variables
5. **Input Validation:** All inputs are validated before processing

---

## Example Usage with cURL

### Register a Customer
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newcustomer@example.com",
    "password": "password123",
    "name": "Jane Doe",
    "phone": "+260971234567",
    "user_type": "customer"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "password123"
  }'
```

### Search Routes
```bash
curl "http://localhost:3000/api/routes?origin=Lusaka&destination=Ndola&date=2024-12-25"
```

### Create Booking
```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "route_id": 1,
    "num_seats": 2,
    "luggage_count": 1,
    "boarding_point": "Lusaka"
  }'
```

---

## Testing

Use tools like:
- **Postman** - For API testing
- **cURL** - Command-line testing
- **Thunder Client** - VS Code extension
- **Insomnia** - API client

---

## New API Endpoints (v2.0)

### 6. Passengers

#### Passenger Types
| Type | Description | Age Range |
|------|-------------|-----------|
| `adult` | Adult passenger | 18+ years |
| `child` | Child passenger | 2-17 years |
| `infant` | Infant passenger | 0-2 years |
| `senior` | Senior citizen | 60+ years |

#### Get Passengers
**GET** `/api/passengers`

Retrieve passengers for a booking or route (manifest).

**Query Parameters:**
- `booking_id` - Get passengers for a specific booking
- `route_id` - Get all passengers for a route (company only)

**Response (200 OK):**
```json
{
  "passengers": [
    {
      "id": 1,
      "booking_id": 1,
      "name": "John Mwansa",
      "nrc_or_passport": "123456/78/1",
      "id_type": "nrc",
      "phone": "+260971234567",
      "passenger_type": "adult",
      "seat_number": 5,
      "special_needs": null,
      "ticket_number": "TK12345ABC",
      "qr_code": "base64_encoded_qr",
      "boarding_status": "not_boarded"
    }
  ]
}
```

#### Update Passenger
**PATCH** `/api/passengers`

Update passenger details.

**Request Body:**
```json
{
  "passenger_id": 1,
  "name": "John Mwansa Updated",
  "nrc_or_passport": "123456/78/1",
  "phone": "+260971234567"
}
```

---

### 7. Tickets

#### Get Tickets
**GET** `/api/tickets`

Retrieve tickets by booking, ticket number, or route.

**Query Parameters:**
- `booking_id` - Get all tickets for a booking
- `ticket_number` - Get a specific ticket
- `route_id` - Get all tickets for a route (company only)

**Response (200 OK):**
```json
{
  "tickets": [
    {
      "id": 1,
      "ticket_number": "TK12345ABC",
      "qr_code": "base64_encoded_qr",
      "seat_number": 5,
      "status": "valid",
      "boarding_status": "not_boarded",
      "passenger_name": "John Mwansa",
      "booking_reference": "BK123456",
      "origin": "Lusaka",
      "destination": "Ndola",
      "date": "2026-02-10",
      "departure_time": "06:00"
    }
  ]
}
```

#### Validate Ticket (QR Scan)
**POST** `/api/tickets`

Validate a ticket by QR code (company only).

**Request Body:**
```json
{
  "qr_code": "base64_encoded_qr_string"
}
```

**Response (200 OK):**
```json
{
  "valid": true,
  "ticket_number": "TK12345ABC",
  "passenger_name": "John Mwansa",
  "seat_number": 5,
  "boarding_status": "not_boarded",
  "warnings": []
}
```

#### Update Ticket (Boarding)
**PATCH** `/api/tickets`

Update ticket boarding status (company only).

**Request Body:**
```json
{
  "ticket_number": "TK12345ABC",
  "boarding_status": "boarded"
}
```

---

### 8. Payments

#### Get Payments
**GET** `/api/payments`

Retrieve payments for a booking or all user payments.

**Query Parameters:**
- `booking_id` - Get payments for a specific booking
- `payment_id` - Get a specific payment

**Response (200 OK):**
```json
{
  "payments": [
    {
      "id": 1,
      "booking_id": 1,
      "amount": 350.00,
      "currency": "ZMW",
      "payment_method": "mobile_money",
      "provider": "MTN",
      "transaction_id": "TXN123456ABC",
      "status": "completed",
      "paid_at": "2026-02-08T10:30:00Z"
    }
  ]
}
```

#### Initiate Payment
**POST** `/api/payments`

Create a payment for a booking.

**Request Body:**
```json
{
  "booking_id": 1,
  "payment_method": "mobile_money",
  "provider": "MTN",
  "phone_number": "+260971234567"
}
```

**Response (201 Created):**
```json
{
  "message": "Payment initiated",
  "payment_id": 1,
  "transaction_id": "TXN123456ABC",
  "amount": 350.00,
  "status": "pending",
  "instructions": "A payment request of K350 has been sent to +260971234567..."
}
```

#### Update Payment (Admin)
**PATCH** `/api/payments`

Update payment status (admin only, or payment webhook).

**Request Body:**
```json
{
  "payment_id": 1,
  "status": "completed"
}
```

---

### 9. Drivers

#### Get Drivers
**GET** `/api/drivers`

Retrieve drivers for a company (company/admin only).

**Query Parameters:**
- `driver_id` - Get specific driver with assigned routes
- `company_id` - Filter by company (admin only)

**Response (200 OK):**
```json
{
  "drivers": [
    {
      "id": 1,
      "name": "Peter Banda",
      "phone": "+260976111222",
      "license_number": "PSV-2024000",
      "license_type": "PSV",
      "license_expiry": "2027-12-31",
      "status": "active"
    }
  ]
}
```

#### Create Driver
**POST** `/api/drivers`

Add a new driver (company only).

**Request Body:**
```json
{
  "name": "Peter Banda",
  "phone": "+260976111222",
  "license_number": "PSV-2024000",
  "license_type": "PSV",
  "license_expiry": "2027-12-31",
  "nrc_number": "234567/89/1",
  "date_of_birth": "1985-06-15",
  "address": "Lusaka, Zambia"
}
```

#### Update Driver
**PATCH** `/api/drivers`

Update driver details (company only).

**Request Body:**
```json
{
  "driver_id": 1,
  "phone": "+260976999888",
  "status": "active"
}
```

---

### 10. Refunds

#### Get Refunds
**GET** `/api/refunds`

Retrieve refund requests.

**Query Parameters:**
- `refund_id` - Get specific refund
- `booking_id` - Get refunds for a booking
- `status` - Filter by status (pending/approved/processed/rejected)

**Response (200 OK):**
```json
{
  "refunds": [
    {
      "id": 1,
      "booking_id": 1,
      "amount": 350.00,
      "reason": "Trip cancelled",
      "status": "pending",
      "requested_at": "2026-02-08T10:30:00Z"
    }
  ]
}
```

#### Request Refund
**POST** `/api/refunds`

Request a refund for a paid booking.

**Request Body:**
```json
{
  "booking_id": 1,
  "reason": "Trip cancelled due to emergency"
}
```

#### Process Refund (Admin)
**PATCH** `/api/refunds`

Approve/reject/process a refund (admin only).

**Request Body:**
```json
{
  "refund_id": 1,
  "status": "processed",
  "transaction_id": "REF123456"
}
```

---

### 11. Notifications

#### Get Notifications
**GET** `/api/notifications`

Retrieve user notifications.

**Query Parameters:**
- `unread` - Set to "true" for unread only
- `limit` - Number of notifications (default 50)

**Response (200 OK):**
```json
{
  "notifications": [
    {
      "id": 1,
      "type": "booking_confirmed",
      "title": "Booking Confirmed",
      "message": "Your booking BK123456 has been confirmed",
      "read": 0,
      "created_at": "2026-02-08T10:30:00Z"
    }
  ],
  "unread_count": 3
}
```

#### Mark as Read
**PATCH** `/api/notifications`

Mark notifications as read.

**Request Body:**
```json
{
  "notification_id": 1
}
```

Or mark all as read:
```json
{
  "mark_all_read": true
}
```

---

### 12. Manifests

#### Get Trip Manifest
**GET** `/api/manifests`

Get passenger manifest for a route (company only).

**Query Parameters:**
- `route_id` - Route ID (required)

**Response (200 OK):**
```json
{
  "manifest": {
    "id": 1,
    "generated_at": "2026-02-08T10:30:00Z",
    "route": {
      "id": 1,
      "origin": "Lusaka",
      "destination": "Ndola",
      "date": "2026-02-10",
      "departure_time": "06:00"
    },
    "bus": {
      "name": "Mazhindu Express",
      "number": "ABZ 1000 ZM",
      "total_seats": 52
    },
    "driver": {
      "name": "Peter Banda",
      "phone": "+260976111222"
    },
    "statistics": {
      "total_seats": 52,
      "booked_seats": 35,
      "boarded": 20,
      "not_boarded": 15,
      "paid": 33,
      "pending_payment": 2
    },
    "passengers": [...]
  }
}
```

---

### Updated Endpoints

#### Create Booking (Enhanced)
**POST** `/api/bookings`

Now supports passenger details and generates tickets.

**Request Body:**
```json
{
  "route_id": 1,
  "num_seats": 2,
  "luggage_count": 1,
  "boarding_point": "Lusaka",
  "dropping_point": "Ndola",
  "passengers": [
    {
      "name": "John Mwansa",
      "nrc_or_passport": "123456/78/1",
      "id_type": "nrc",
      "phone": "+260971234567",
      "passenger_type": "adult"
    },
    {
      "name": "Mary Mwansa",
      "nrc_or_passport": "123456/78/2",
      "id_type": "nrc",
      "phone": "+260972345678",
      "passenger_type": "adult"
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "message": "Booking created successfully",
  "bookingId": 1,
  "bookingReference": "BK123456ABC",
  "seatNumbers": "5,6",
  "totalPrice": 700.00,
  "status": "confirmed",
  "paymentStatus": "paid",
  "tickets": [
    {
      "ticketNumber": "TK12345ABC",
      "seatNumber": 5,
      "passengerName": "John Mwansa"
    },
    {
      "ticketNumber": "TK12346DEF",
      "seatNumber": 6,
      "passengerName": "Mary Mwansa"
    }
  ]
}
```

#### Update Route (New)
**PATCH** `/api/routes`

Update route details, assign driver, or change status (company only).

**Request Body:**
```json
{
  "route_id": 1,
  "status": "departed"
}
```

**Valid Status Values:**
| Status | Description |
|--------|-------------|
| `active` | Route is scheduled and accepting bookings |
| `departed` | Bus has left the origin |
| `completed` | Trip has finished |
| `cancelled` | Route was cancelled |
| `delayed` | Route is running late |

#### Cancel Booking
**PATCH** `/api/bookings`

Cancel a booking and restore seats. Refund is calculated based on cancellation policy.

**Request Body:**
```json
{
  "booking_id": 1,
  "status": "cancelled",
  "cancellation_reason": "Customer request"
}
```

**Response (200 OK):**
```json
{
  "message": "Booking cancelled",
  "refund_amount": 350,
  "cancellation_fee": 50
}
```

**Cancellation Restrictions:**
- ❌ **Completed bookings** cannot be cancelled - returns `400 Bad Request`
- ❌ **Already cancelled bookings** cannot be cancelled again

**Error Responses:**
- `400 Bad Request` - "Cannot cancel a completed booking"
- `400 Bad Request` - "Booking is already cancelled"
- `403 Forbidden` - Not authorized to cancel this booking

---

## Page Routes

### Customer Pages

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Search for routes |
| Login | `/customer/login` | Customer login |
| Dashboard | `/customer/dashboard` | View bookings |
| Book Route | `/customer/book/[id]` | Book a specific route with passenger details |
| **E-Ticket** | `/customer/ticket/[id]` | View and print e-ticket for a booking |

### Company Pages

| Page | Route | Description |
|------|-------|-------------|
| Login | `/company/login` | Company login |
| Dashboard | `/company/dashboard` | Manage routes, buses, view bookings |
| Trip Manifest | `/company/manifest/[routeId]` | View passenger list for a trip |

### Admin Pages

| Page | Route | Description |
|------|-------|-------------|
| Login | `/admin/login` | Admin-only login |
| Dashboard | `/admin/dashboard` | System-wide management dashboard |

---

## Admin API

### GET /api/admin/stats

Get system-wide statistics (admin only).

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "stats": {
    "totalUsers": 50,
    "totalCustomers": 45,
    "totalCompanies": 4,
    "totalBuses": 12,
    "totalRoutes": 25,
    "activeRoutes": 18,
    "totalBookings": 150,
    "todayBookings": 8,
    "cancelledBookings": 5,
    "totalRevenue": 45000,
    "commissionRate": 7.5,
    "totalCommission": 3375,
    "companyPayouts": 41625,
    "subscriptionRevenue": 2500,
    "subscriptionPricePerBus": 500,
    "trialBuses": 3,
    "activeBuses": 5,
    "expiredBuses": 2
  },
  "users": [...],
  "companies": [...],
  "recentBookings": [...]
}
```

---

### GET /api/admin/settings

Get platform configuration settings (admin only).

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (200 OK):**
```json
{
  "settings": {
    "commission_rate": {
      "value": "0.075",
      "description": "Platform commission rate (7.5%)",
      "updated_at": "2026-02-09T10:00:00.000Z"
    },
    "subscription_price_per_bus": {
      "value": "500",
      "description": "Monthly subscription price per bus in ZMW",
      "updated_at": "2026-02-09T10:00:00.000Z"
    },
    "subscription_trial_days": {
      "value": "14",
      "description": "Free trial period in days for new buses",
      "updated_at": "2026-02-09T10:00:00.000Z"
    }
  }
}
```

---

### PUT /api/admin/settings

Update platform configuration settings (admin only).

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "commission_rate": 0.10,
  "subscription_price_per_bus": 750,
  "subscription_trial_days": 21
}
```

**Validation Rules:**
- `commission_rate`: 0.01 - 0.30 (1% - 30%)
- `subscription_price_per_bus`: 100 - 5000 (K100 - K5000)
- `subscription_trial_days`: 0 - 90 days

**Response (200 OK):**
```json
{
  "message": "Settings updated successfully",
  "updated": {
    "commission_rate": 0.10,
    "subscription_price_per_bus": 750,
    "subscription_trial_days": 21
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "Commission rate must be between 1% (0.01) and 30% (0.30)"
}
```

---

## Subscriptions API

### GET /api/subscriptions

Get subscription status for buses. Returns different data based on user type.

**Headers:**
```
Authorization: Bearer <token>
```

**For Company Users - Response (200 OK):**
```json
{
  "buses": [
    {
      "id": 1,
      "bus_name": "Express Coach",
      "bus_number": "ZM-001-LK",
      "current_status": "active",
      "expires_at": "2026-03-09T00:00:00.000Z",
      "days_remaining": 28
    }
  ],
  "payments": [
    {
      "id": 1,
      "bus_id": 1,
      "bus_name": "Express Coach",
      "amount": 500,
      "period_start": "2026-02-09",
      "period_end": "2026-03-09",
      "status": "paid",
      "paid_at": "2026-02-09T10:00:00.000Z"
    }
  ],
  "settings": {
    "pricePerBus": 500,
    "trialDays": 14
  },
  "summary": {
    "totalBuses": 3,
    "activeBuses": 2,
    "expiredBuses": 1,
    "monthlyDue": 500
  }
}
```

**For Admin Users - Response (200 OK):**
```json
{
  "buses": [...],
  "settings": { "pricePerBus": 500, "trialDays": 14 },
  "revenue": {
    "totalPaid": 5000,
    "paidCount": 10,
    "pendingCount": 0
  },
  "statusCounts": {
    "trial": 5,
    "active": 12,
    "expired": 3
  }
}
```

---

### POST /api/subscriptions

Subscribe or renew a bus subscription (company only).

**Headers:**
```
Authorization: Bearer <company_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "bus_id": 1,
  "months": 1,
  "payment_method": "mobile_money"
}
```

**Response (200 OK):**
```json
{
  "message": "Subscription activated successfully",
  "subscription": {
    "bus_id": 1,
    "amount": 500,
    "period_start": "2026-02-09",
    "period_end": "2026-03-09",
    "months": 1
  }
}
```

**Error Responses:**
- `400 Bad Request` - Bus ID required
- `403 Forbidden` - Company access required
- `404 Not Found` - Bus not found or not owned by company

---

### PATCH /api/subscriptions

Admin can update settings or manually change bus subscription status.

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Update Setting:**
```json
{
  "setting_key": "subscription_price_per_bus",
  "setting_value": "750"
}
```

**Manually Update Bus Status:**
```json
{
  "bus_id": 1,
  "subscription_status": "active",
  "months": 1
}
```

**Response (200 OK):**
```json
{
  "message": "Setting updated"
}
```

---

**For more information, see the README.md and USER_GUIDE.md files.**

---

### 12. Image Upload

#### Upload Company Logo
**POST** `/api/upload/logo`

Upload or update company logo (company only).

**Headers:**
```
Authorization: Bearer <company_token>
Content-Type: multipart/form-data
```

**Form Data:**
- `logo` - Image file (JPG, PNG, WebP, GIF, max 2MB)

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logo uploaded successfully",
  "logo_url": "/uploads/logos/company_1_1739312345678.jpg"
}
```

**Error Responses:**
- `400 Bad Request` - No file or invalid file type/size
- `403 Forbidden` - Company access required

---

#### Delete Company Logo
**DELETE** `/api/upload/logo`

Remove company logo (company only).

**Headers:**
```
Authorization: Bearer <company_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logo removed successfully"
}
```

---

#### Get Bus Images
**GET** `/api/upload/bus-images`

Retrieve images for a specific bus.

**Query Parameters:**
- `bus_id` (required) - Bus ID

**Response (200 OK):**
```json
{
  "success": true,
  "images": [
    {
      "id": 1,
      "bus_id": 1,
      "image_url": "/uploads/buses/1/bus_1_1739312345678.jpg",
      "image_type": "exterior",
      "caption": "Front view",
      "display_order": 1,
      "created_at": "2026-02-12T10:30:00.000Z"
    }
  ]
}
```

---

#### Upload Bus Images
**POST** `/api/upload/bus-images`

Upload images for a bus (company only, max 5 per bus).

**Headers:**
```
Authorization: Bearer <company_token>
Content-Type: multipart/form-data
```

**Form Data:**
- `bus_id` (required) - Bus ID
- `images` - One or more image files (JPG, PNG, WebP, GIF, max 2MB each)
- `image_type` (optional) - Type of image: "general", "interior", "exterior" (default: "general")
- `caption` (optional) - Image caption

**Response (200 OK):**
```json
{
  "success": true,
  "message": "3 image(s) uploaded successfully",
  "images": [
    {
      "id": 1,
      "bus_id": 1,
      "image_url": "/uploads/buses/1/bus_1_1739312345678.jpg",
      "image_type": "general",
      "caption": null
    }
  ]
}
```

**Error Responses:**
- `400 Bad Request` - No bus_id, no valid files, or exceeds 5 image limit
- `403 Forbidden` - Company access required
- `404 Not Found` - Bus not found or not owned by company

---

#### Delete Bus Image
**DELETE** `/api/upload/bus-images`

Remove a specific bus image (company only).

**Headers:**
```
Authorization: Bearer <company_token>
```

**Query Parameters:**
- `image_id` (required) - Image ID to delete

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Missing image_id
- `403 Forbidden` - Not owner of image

---

## Real-Time GPS Tracking ✨

### 1. GPS Device Management

#### Get All GPS Devices
**GET** `/api/tracking/devices`

Retrieve GPS devices linked to company buses.

**Headers:**
```
Authorization: Bearer <company_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "devices": [
    {
      "id": 1,
      "bus_id": 1,
      "bus_name": "Mazhindu Express",
      "device_imei": "357000000001",
      "provider": "ctrack",
      "status": "active",
      "last_seen_at": "2026-03-12T14:30:45Z"
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid token
- `403 Forbidden` - Company access required

---

### 2. Live Bus Tracking

#### Get Bus Current Location
**GET** `/api/tracking/bus`

Get current location, trip status, and GPS device info for a specific bus.

**Headers:**
```
Authorization: Bearer <user_token>
```

**Query Parameters:**
- `bus_id` (required) - Bus ID to track

**Response (200 OK):**
```json
{
  "bus": {
    "id": 1,
    "name": "Mazhindu Express",
    "number": "ABZ 1000 ZM",
    "company": "Mazhindu Bus Services"
  },
  "gps_device": {
    "id": 1,
    "provider": "ctrack",
    "status": "active",
    "last_seen": "2026-03-12T14:30:45Z"
  },
  "current_trip": {
    "id": 5,
    "origin": "Lusaka",
    "destination": "Ndola",
    "status": "in_transit",
    "scheduled_departure": "2026-03-12T06:30:00Z",
    "scheduled_arrival": "2026-03-12T11:30:00Z",
    "current_eta": "2026-03-12T11:25:00Z",
    "delay_minutes": 0,
    "passenger_count": 45
  },
  "location": {
    "latitude": -15.3102,
    "longitude": 28.4101,
    "altitude": 1250,
    "speed": 48,
    "heading": 31,
    "recorded_at": "2026-03-12T14:30:45Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Missing bus_id parameter
- `401 Unauthorized` - Invalid token
- `404 Not Found` - Bus not found

---

#### Get Location History for Trip
**GET** `/api/tracking/history`

Retrieve location history for a completed or active trip.

**Headers:**
```
Authorization: Bearer <user_token>
```

**Query Parameters:**
- `trip_id` (required) - Trip ID
- `limit` (optional, default 100, max 500) - Number of records
- `offset` (optional, default 0) - Pagination offset

**Response (200 OK):**
```json
{
  "success": true,
  "trip_id": "5",
  "locations": [
    {
      "id": 1,
      "latitude": -15.3875,
      "longitude": 28.3228,
      "altitude": 1100,
      "speed": 25,
      "heading": 25,
      "accuracy": 8,
      "source": "gps",
      "provider": "ctrack",
      "recorded_at": "2026-03-12T06:35:00Z"
    },
    {
      "id": 2,
      "latitude": -15.3102,
      "longitude": 28.4101,
      "altitude": 1250,
      "speed": 48,
      "heading": 31,
      "accuracy": 8,
      "source": "gps",
      "provider": "ctrack",
      "recorded_at": "2026-03-12T06:45:30Z"
    }
  ],
  "pagination": {
    "limit": 100,
    "offset": 0,
    "total": 142,
    "has_more": true
  }
}
```

**Error Responses:**
- `400 Bad Request` - Missing trip_id parameter
- `401 Unauthorized` - Invalid token
- `404 Not Found` - Trip not found

---

### 3. Trip Management (Driver)

#### Start Trip
**POST** `/api/tracking/trip/start`

Initiate tracking for a trip (driver/company).

**Headers:**
```
Authorization: Bearer <driver_token>
```

**Request Body:**
```json
{
  "route_id": 123,
  "bus_id": 5,
  "gps_device_id": 2
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "trip": {
    "id": 42,
    "route_id": 123,
    "bus_id": 5,
    "status": "in_transit",
    "scheduled_departure": "2026-03-12T14:00:00Z",
    "actual_departure": "2026-03-12T14:05:30Z",
    "estimated_arrival": "2026-03-12T17:30:00Z",
    "current_latitude": -15.3875,
    "current_longitude": 28.3228,
    "current_speed": 0,
    "last_location_update": "2026-03-12T14:05:30Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Missing required fields
- `401 Unauthorized` - Invalid or no authentication
- `404 Not Found` - Route/bus/device not found

---

#### End Trip
**POST** `/api/tracking/trip/end`

Mark trip as completed (driver/company).

**Headers:**
```
Authorization: Bearer <driver_token>
```

**Request Body:**
```json
{
  "trip_id": 42,
  "notes": "Arrived safely at Ndola terminal"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "trip": {
    "id": 42,
    "status": "completed",
    "actual_departure": "2026-03-12T14:05:30Z",
    "actual_arrival": "2026-03-12T17:28:45Z",
    "distance_covered_km": 520.5,
    "total_distance_km": 520,
    "progress_percentage": 100
  }
}
```

**Error Responses:**
- `400 Bad Request` - Missing trip_id
- `401 Unauthorized` - Invalid token
- `404 Not Found` - Trip not found

---

### 4. Location Submission (Driver App)

#### Submit Location Update
**POST** `/api/tracking/location`

Submit GPS location from driver app or device webhook.

**Headers:**
```
Authorization: Bearer <driver_or_device_token>
```

**Request Body:**
```json
{
  "trip_id": 42,
  "latitude": -15.3102,
  "longitude": 28.4101,
  "altitude": 1250,
  "speed": 48,
  "heading": 31,
  "accuracy": 8,
  "source": "gps",
  "battery_level": 78,
  "signal_strength": 4
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "location": {
    "id": 287,
    "trip_id": 42,
    "latitude": -15.3102,
    "longitude": 28.4101,
    "speed": 48,
    "recorded_at": "2026-03-12T14:30:45Z"
  },
  "trip_updated": {
    "current_latitude": -15.3102,
    "current_longitude": 28.4101,
    "current_speed": 48,
    "progress_percentage": 55
  }
}
```

**Error Responses:**
- `400 Bad Request` - Invalid coordinates or missing fields
- `401 Unauthorized` - Invalid token
- `404 Not Found` - Trip not found

---

### 5. Customer Bus Tracking by Booking Reference

#### Get Live Bus Tracking (Public by Booking Reference)
**GET** `/api/tracking/bus?booking_ref={bookingReference}`

Fetch live bus tracking details tied to a confirmed booking reference.

**Authentication:** Not required

**Query Parameters:**
- `booking_ref` (required) - Booking reference, for example `BK1A2B3C4D5E`

**Response (200 OK):**
```json
{
  "success": true,
  "tracking": {
    "booking_reference": "BK1A2B3C4D5E",
    "trip_status": "in_transit",
    "bus_number": "ZM-001-LK",
    "route": "Lusaka -> Ndola",
    "last_location_update": "2026-03-12T14:30:45Z",
    "current_latitude": -15.3102,
    "current_longitude": 28.4101,
    "current_speed": 48
  }
}
```

**Behavior Notes:**
- If the trip has not started yet, response explains that tracking will be available after departure
- If the trip has ended, response returns a completed/inactive status message instead of live movement

**Error Responses:**
- `400 Bad Request` - Missing `booking_ref`
- `404 Not Found` - Booking not found or no matching route/trip

---

## Environment Configuration for Tracking

Add these variables to `.env.local` to enable GPS tracking features:

```env
# GPS Webhooks & Security
GPS_WEBHOOK_SECRET=your-super-secret-gps-webhook-key-change-this

# Ctrack GPS Provider (primary)
CTRACK_API_KEY=your-ctrack-api-key
CTRACK_BASE_URL=https://api.ctrack.co.za/v1

# Firebase Cloud Messaging (push notifications)
FCM_SERVER_KEY=your-firebase-server-key-here

# SMS Notifications (Africa's Talking)
AT_USERNAME=sandbox  # or your AT username for production
AT_API_KEY=your-africastalking-api-key
AT_SENDER_ID=VayaZed
AT_BASE_URL=https://api.sandbox.africastalking.com/version1/messaging

# WhatsApp (optional)
WHATSAPP_API_TOKEN=your-whatsapp-api-token
```

---

## Demo Tracking Data

When you run `npm run seed`, the database includes:

- **3 GPS Devices**: Ctrack provider with IMEI and device IDs
- **3 Active Trips**: In-transit status between Lusaka, Ndola, Livingstone
- **6 Location Points**: 2 location updates per trip showing movement
- **Notification Logs**: Trip started events for each demo trip

Use these in your testing/development of tracking features.

- `404 Not Found` - Image not found