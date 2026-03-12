# VayaZed

A comprehensive full-stack web application for managing intercity bus bookings in Zambia. VayaZed is powered by Moov.

## Features

### For Customers
- 🔍 **Search Buses**: Search for buses by origin, destination, and date- 📷 **Bus Preview Images**: View bus photos in search results with lightbox gallery
- 🖼️ **Company Logos**: See verified company logos in search results
- 📌 **Sticky Navigation**: Header stays fixed for easy access while scrolling- � **Flexible Date Search**: Search ±3 days with date carousel comparison
- 🔎 **Advanced Filters**: Filter by bus type, price range, time of day
- 🎛️ **Amenity Filters**: Filter by WiFi, AC, Reclining Seats, USB, Toilet, etc.
- 🚦 **Color-Coded Availability**:
  - 🟢 Green: Many seats (>10)
  - 🟡 Yellow: Limited seats (5-10)
  - 🔴 Red: Almost full (<5)
  - ⚫ Gray: Sold out
- 🏷️ **Smart Badges**: Lowest Price, Most Seats, VIP Coach, Express tags
- 📊 **Smart Sorting**: Sort by departure time, price, or seat availability
- 🎫 **Book Tickets**: Book bus tickets with seat selection
- 👤 **Passenger Details**: Enter name, NRC/ID, phone, and passenger type (adult/child/infant/senior)
- 🎟️ **E-Tickets**: View and print tickets with QR codes
- 🧳 **Luggage Management**: Specify number of luggage pieces
- 🚏 **Flexible Boarding**: Choose boarding point from origin or intermediate stops
- 📱 **Booking Management**: View and manage all bookings
- ❌ **Cancel Bookings**: Cancel bookings with automatic refund calculation
- 📋 **Booking Reference**: Get unique booking reference for each ticket
- 💳 **Multiple Payment Options**:
  - Mobile Money (MTN, Airtel, Zamtel)
  - Debit/Credit Cards (Visa, Mastercard)
  - Cash payment at bus station
- 💰 **Pay Later**: Complete payment from dashboard for unpaid bookings
- 🔔 **Payment Status Tracking**: Real-time payment status (Paid/Unpaid/Refunded)
- 📍 **Track Your Bus** ✨ NEW:
  - View live location of booked bus on map
  - Real-time location updates and ETA
  - Distance traveled and remaining
  - Push notifications for trip updates (departure, delays, arrival)
  - SMS & WhatsApp notifications for trip events

### For Bus Companies
- 🚌 **Fleet Management**: Register and manage buses
- � **Bus Photo Gallery**: Upload up to 5 photos per bus (interior/exterior)
- 🖼️ **Company Logo**: Upload company logo for brand visibility
- �🛣️ **Route Management**: Create and manage routes with schedules
- � **Route Deactivation**: Activate/deactivate routes and schedules
- 📊 **Booking Overview**: View all customer bookings
- 📋 **Trip Manifest**: View passenger list per trip with boarding status
- 🟢 **Route Status**: Mark routes as departed, completed, or delayed
- 💺 **Seat Tracking**: Real-time seat availability tracking
- ⏰ **Schedule Management**: Set departure and arrival times
- 🛑 **Intermediate Stops**: Define stops along routes
- 💳 **Subscription Management**:
  - 14-day free trial for new buses
  - Subscribe/renew buses via company dashboard
  - Payment history tracking
  - Expired buses have routes hidden from customers
- 💰 **Earnings Tracking**: View gross revenue, platform commission (7.5%), and net earnings
- � **Real-Time GPS Tracking** ✨ NEW:
  - Live bus location tracking on interactive map
  - Multiple GPS provider support (Ctrack, Tramigo, Teltonika, driver app)
  - View trip status and ETA updates
  - Location history with timestamp and accuracy
  - GPS device management and status monitoring
- �🔄 **Refund Management**:
  - View all refund requests
  - Filter by status (pending/processed/failed)
  - Approve or reject refund requests
  - Track refund statistics and totals
- 👤 **Company Profile Management**:
  - Update company name and contact details
  - Manage RTSA license and PACRA registration
  - Change account password securely

### For Customers
- 👤 **Profile Management**:
  - Update personal information (name, phone, NRC, date of birth)
  - Add emergency contact details
  - Change account password securely
  - View account status and verification

### For Administrators
- 📊 **System Overview**: View total users, bookings, and revenue
- 👥 **User Management**: View all customers and companies
- 🏢 **Company Stats**: Monitor company performance and revenue
- 🎫 **Booking Reports**: View all system bookings with details
- 📈 **Analytics**: Track daily bookings and system health
- 💰 **Platform Monetization**:
  - Commission on bookings (configurable 1% - 30%, default 7.5%)
  - Monthly bus subscriptions (configurable K100 - K5000, default K500)
  - Free trial period for new buses (configurable 0-90 days, default 14)
- ⚙️ **Platform Settings**: Configure commission rates and subscription pricing via admin dashboard

### Security & Authentication
- 🔐 **Two-Factor Authentication (2FA)**: TOTP-based 2FA with authenticator apps (Google Authenticator, Authy, etc.)
- 🔑 **Forgot Password**: Secure password reset with time-limited tokens
- 🌐 **Google OAuth**: Sign in with Google for easier registration/login
- 🚫 **Account Suspension**: Admin can suspend/activate user accounts
- ✅ **Company Verification**: New company registrations require admin approval
- 📋 **Required Business Documents**: Companies must provide RTSA license and PACRA registration

## Technology Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: SQLite with better-sqlite3
- **Authentication**: JWT with bcryptjs
- **Two-Factor Auth**: speakeasy (TOTP) with qrcode
- **OAuth**: Google Sign-In integration
- **Styling**: Tailwind CSS

## Prerequisites

- Node.js 18+ and npm
- Git (optional)

## Installation & Setup

### 1. Navigate to Project Directory
```bash
cd zambia-bus-booking
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Initialize Database

**Option A: Seed with sample data (Recommended for testing)**
```bash
npm run seed
```

This creates `bus_booking.db` with:
- **Users**: 1 customer, 3 bus companies, 1 admin
- **Fleet**: 6 buses with seating layouts (13-14 seats, 4 columns)
- **Drivers**: 18 PSV-licensed drivers assigned to companies
- **Booking Tables**: Routes, bookings, passengers, tickets, payments, refunds
- **Demo Tracking Data** ✨:
  - **3 GPS Devices** (Ctrack provider, one per demo bus)
  - **3 Active Trips** (in-transit status with realistic coordinates)
  - **6 Location Points** (2 per trip showing movement from Lusaka → Ndola → Livingstone)
  - **3 Notification Logs** (trip started events for demo data)
- **Settings**: Platform commission (7.5%), subscription pricing (K500/month), trial period (14 days)

**Option B: Database Management Scripts**
```bash
npm run db:init    # Initialize schema only (no data)
npm run db:verify  # Check that all tables exist
npm run db:reset   # Backup current DB → wipe → reinit → verify
```

**Option C: Auto-initialize on first API call**
- Start the development server (see step 4)
- Visit: `http://localhost:3000/api/init`

### 4. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Environment Variables (Optional)

Create a `.env.local` file in the project root for production configuration:

```bash
# JWT Secret (required for production)
JWT_SECRET="your-secure-random-secret-key-change-this"

# Google OAuth (optional - for "Sign in with Google")
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
NEXTAUTH_URL="http://localhost:3000"  # Change to your production URL

# Email Service (optional - for password reset emails)
# Currently logs reset links to console for development
# Configure your preferred email service (Resend, SendGrid, etc.) for production
```

**Note:** The system works without these variables in development mode:
- Google OAuth: Button will redirect but fail with a helpful error message
- Password reset: Token is logged to console (development only)
- JWT: Uses a default secret (change for production!)

## Demo Credentials

### Bus Companies
1. **Mazhindu Bus Services**
   - Email: `info@mazhindubuses.com`
   - Password: `password123`

2. **Power Tools Transport**
   - Email: `contact@powertools.com`
   - Password: `password123`

3. **Juldan Motors**
   - Email: `info@juldan.com`
   - Password: `password123`

### Customer
- Email: `customer@example.com`
- Password: `password123`

## Usage Guide

### For Customers

1. **Search for Buses**
   - Go to the home page
   - Select origin, destination, and date
   - Click "Search Buses"

2. **Book a Ticket**
   - Click "Book Now" on any available bus
   - Login or register if not already logged in
   - Fill in booking details:
     - Number of seats
     - Boarding point (origin or intermediate stop)
     - Number of luggage pieces
   - Fill in passenger details for each seat
   - Click "Continue to Payment"
   - **Select Payment Method**:
     - **Mobile Money**: Select provider (MTN/Airtel/Zamtel), enter phone number, confirm with OTP
     - **Card**: Enter card details and submit
     - **Cash**: Confirm to pay at bus station before departure
   - Receive booking confirmation with reference number

3. **Pay for Unpaid Bookings**
   - Go to customer dashboard
   - Find bookings with "UNPAID" status
   - Click "Pay Now" to complete payment

4. **Cancel a Booking**
   - Go to customer dashboard
   - Click "Cancel Booking" on active bookings
   - View refund calculation based on timing
   - Confirm cancellation

5. **View Bookings**
   - Login to customer dashboard
   - View all your bookings with details
   - See payment status and trip information
   - View and print e-tickets with QR codes

### For Bus Companies

1. **Register Your Company**
   - Go to Company Login page
   - Click "Register"
   - Fill in company details:
     - Company name
     - License number
     - Contact person details
   - Submit registration

2. **Add Buses**
   - Login to company dashboard
   - Go to "My Buses" tab
   - Click "+ Add Bus"
   - Fill in bus details:
     - Bus number (e.g., ZM-001-LK)
     - Bus name
     - Total seats
     - Bus type
     - Amenities
   - Submit

3. **Create Routes**
   - Go to "Routes" tab
   - Click "+ Add Route"
   - Select bus from your fleet
   - Fill in route details:
     - Origin and destination
     - Date
     - Departure and arrival times
     - Price
     - Intermediate stops (optional)
   - Submit

4. **Manage Bookings**
   - Go to "Bookings" tab
   - View all customer bookings
   - See customer details and booking information
   - Mark passengers as boarded

5. **Manage Refunds**
   - Go to "Refunds" tab in enhanced dashboard
   - View all pending refund requests
   - Filter by status (pending/processed/failed)
   - Click on a refund to view details
   - Approve or reject refund requests
   - Track refund statistics

6. **Deactivate Routes**
   - Go to "Routes & Schedule" tab
   - Click "Deactivate" on active routes to hide from customers
   - Click "Activate" to make routes visible again

## Project Structure

```
zambia-bus-booking/
├── app/
│   ├── api/                    # API routes
│   │   ├── auth/              # Authentication endpoints
│   │   ├── buses/             # Bus management endpoints
│   │   ├── routes/            # Route management endpoints
│   │   ├── bookings/          # Booking endpoints
│   │   ├── payments/          # Payment processing
│   │   │   └── confirm/       # Payment confirmation
│   │   ├── company/           # Company-specific endpoints
│   │   │   └── refunds/       # Refund management
│   │   └── init/              # Database initialization
│   ├── components/            # Reusable UI components
│   │   ├── PaymentModal.tsx   # Payment method selection
│   │   └── CancellationModal.tsx # Booking cancellation
│   ├── customer/              # Customer pages
│   │   ├── login/            # Customer login/register
│   │   ├── dashboard/        # Customer dashboard
│   │   ├── book/[id]/        # Booking page with payment
│   │   └── ticket/[id]/      # View ticket with QR code
│   ├── company/               # Company pages
│   │   ├── login/            # Company login/register
│   │   ├── dashboard/        # Company dashboard
│   │   └── enhanced-dashboard/ # Enhanced dashboard with refunds
│   ├── lib/                   # Utility functions
│   │   ├── database.ts       # Database setup
│   │   ├── auth.ts           # Authentication utilities
│   │   └── seed.ts           # Database seeding
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page
├── bus_booking.db            # SQLite database (created on init)
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user (customer or company)
- `POST /api/auth/login` - Login user (supports 2FA)
- `POST /api/auth/forgot-password` - Request password reset email
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/2fa` - Generate 2FA secret and QR code
- `POST /api/auth/2fa` - Verify and enable 2FA
- `DELETE /api/auth/2fa` - Disable 2FA
- `GET /api/auth/google` - Redirect to Google OAuth
- `POST /api/auth/google` - Handle Google OAuth token

### Admin - User Management
- `PATCH /api/admin/users/[id]/status` - Suspend/activate user accounts

### Buses
- `GET /api/buses` - Get all buses (optional: filter by company_id)
- `POST /api/buses` - Create new bus (company only)

### Routes
- `GET /api/routes` - Search routes (filter by origin, destination, date)
- `POST /api/routes` - Create new route (company only)

### Bookings
- `GET /api/bookings` - Get user bookings
- `POST /api/bookings` - Create new booking (customer only)
- `PATCH /api/bookings` - Cancel booking with refund calculation

### Payments
- `GET /api/payments` - Get payment history
- `POST /api/payments` - Initiate a payment
- `PATCH /api/payments` - Update payment status (admin/webhook)
- `POST /api/payments/confirm` - Confirm payment (Mobile Money OTP or Card)

### Refunds (Company)
- `GET /api/company/refunds` - Get refund requests for company
- `POST /api/company/refunds` - Process refund (approve/reject)

### Profile Management
- `GET /api/profile` - Get current user profile
- `PATCH /api/profile` - Update user profile (name, phone, personal details, password)

### Initialization
- `GET /api/init` - Initialize and seed database

## Database Schema

### Users Table
- Stores both customers and bus companies
- Fields: id, email, password, name, phone, user_type, company_name, license_number

### Buses Table
- Stores bus information
- Fields: id, company_id, bus_number, bus_name, total_seats, bus_type, amenities

### Routes Table
- Stores bus routes and schedules
- Fields: id, bus_id, origin, destination, departure_time, arrival_time, price, date, intermediate_stops, available_seats, status

### Bookings Table
- Stores customer bookings
- Fields: id, customer_id, route_id, seat_numbers, num_seats, luggage_count, boarding_point, total_price, booking_reference, status, payment_status, refund_status, cancellation_reason

### Payments Table
- Stores payment transactions
- Fields: id, booking_id, amount, currency, payment_method, provider, transaction_id, phone_number, status, created_at, paid_at

### Passengers Table
- Stores passenger details for each booking
- Fields: id, booking_id, full_name, phone_number, email, date_of_birth, gender, id_type, id_number, emergency_contact_name, emergency_contact_phone, special_needs

### Tickets Table
- Stores e-ticket information
- Fields: id, booking_id, passenger_id, ticket_number, qr_code, status, boarding_status

### Reviews & Feedback (NEW)
- ⭐ **Customer Reviews**: Customers can leave reviews and ratings for bus companies after their trip.
- 📝 **Company Response**: Companies can respond to reviews directly from their dashboard. Responses are shown publicly.
- 🛡️ **Admin Feedback**: Admins can add feedback to reviews (e.g., if a review is rejected or flagged).
- ⏱️ **Timestamps**: All reviews, company responses, and admin feedback include timestamps for transparency.

#### Database Schema Changes
- The `reviews` table now includes:
  - `company_response` (TEXT): Company's public reply to a review
  - `responded_at` (DATETIME): When the company responded
  - `admin_feedback` (TEXT): Admin's feedback if a review is rejected or flagged

#### How to Use
- After a review is submitted, companies and admins can add responses/feedback via their respective dashboards.
- All responses and feedback are visible in the review details modal.

## Features Implemented

✅ User authentication (customers and companies)
✅ Bus fleet management
✅ Route creation and management
✅ Route activation/deactivation
✅ Real-time seat availability
✅ Booking system with seat selection
✅ Luggage specification
✅ Intermediate stop boarding
✅ Search and filter functionality
✅ Responsive design
✅ Booking history and management
✅ Unique booking references
✅ **Payment Integration**:
  - Mobile Money (MTN, Airtel, Zamtel)
  - Credit/Debit Cards (Visa, Mastercard)
  - Cash payment option
  - Payment confirmation flow with OTP
✅ **Cancellation & Refund System**:
  - Tiered refund policy based on timing
  - Full refund (>24h before departure)
  - Partial refund (12-24h: 75%, 6-12h: 50%, 2-6h: 25%)
  - No refund (<2h before departure)
  - Company refund management dashboard
✅ QR code tickets
✅ Enhanced passenger details (emergency contacts, special needs)

## Future Enhancements

- Email notifications
- SMS notifications for booking confirmations
- Real-time bus tracking
- Customer reviews and ratings
- Mobile app version
- Multi-language support
- Advanced seat selection (visual seat map)

## Support

For issues or questions, please contact the development team.

## License

This project is proprietary software developed for VayaZed, powered by Moov.

---

**Made with ❤️ for Zambia's intercity travel, by Moov**