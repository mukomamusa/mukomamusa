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

## 🆕 What's New in v2.0.0

Version 2.0.0 represents a major upgrade to VayaZed, introducing comprehensive new features and enhancements based on Mr. Kabuya's development work.

### Major New Features

#### 🤖 Agent Booking System
- Dedicated agent portal for travel agents
- Commission-based booking system (configurable rates)
- Bulk booking capabilities
- Agent performance tracking and analytics
- Customer relationship management
- Quick booking interface for high-volume agents
- Commission earnings dashboard with 7-day charts

#### ⭐ Review & Rating System
- Customer reviews for bus companies and drivers
- Star rating system (1-5 stars)
- Review moderation by admins
- Company performance rankings
- Driver performance tracking
- Review statistics and analytics
- Verified purchase reviews only

#### 📱 Progressive Web App (PWA)
- Installable as mobile app
- Offline functionality with IndexedDB
- Service worker for background sync
- Push notifications support
- App manifest with icons
- Responsive mobile-first design
- Fast loading with caching strategies

#### 📍 Enhanced Real-Time Tracking
- WebSocket/Socket.IO for live updates
- GPS integration with multiple providers (Ctrack, Tramigo, Teltonika)
- Real-time bus location on interactive maps
- ETA calculations with traffic awareness
- Location history with timestamps
- Driver mobile app for location updates
- Push notifications for trip events

#### 🎨 Enhanced User Interface
- Component-based architecture
- Debounced search functionality
- Company logos and branding throughout
- Professional teal color scheme (#2BB2A9)
- Mobile-optimized responsive design
- Improved accessibility
- Smooth animations and transitions

#### 👨‍✈️ Driver Features
- Driver dashboard with trip management
- Start/End trip functionality
- Passenger count tracking
- Daily earnings and statistics
- Driver performance ratings
- Mobile driver app for on-the-go management
- Boarding system integration

#### 💳 Enhanced Payment Integration
- Mobile money integration (Airtel Money, MTN Mobile Money)
- Payment status tracking in real-time
- Automated refund processing
- Payment history and receipts
- Multi-payment method support
- Secure payment processing

#### 🔧 Technical Improvements
- 40+ new API endpoints (total: 80+ endpoints)
- Enhanced error handling
- Improved database optimization
- Better logging and monitoring
- Enhanced security measures
- Improved performance and caching
- Better code organization and modularity

### Architecture Improvements
- **Component-Based UI**: Reusable React components for consistency
- **Service Layer**: Separated business logic from controllers
- **Database Optimization**: Improved queries and indexing
- **API Organization**: Better endpoint structure and documentation
- **Error Handling**: Comprehensive error management
- **State Management**: Enhanced data flow and updates

### New API Endpoints (40+)
- Agent booking endpoints (10+)
- Review system endpoints (8+)
- PWA and offline sync endpoints (5+)
- Real-time tracking endpoints (6+)
- Payment integration endpoints (5+)
- Notification endpoints (4+)
- Driver management endpoints (5+)
- Enhanced admin endpoints (8+)

### Documentation Updates
- Comprehensive API documentation
- Agent system guide
- PWA development guidelines
- Real-time tracking implementation guide
- Mobile money integration docs
- Component library documentation

### Screenshots
All screenshots have been updated to reflect v2.0.0:
- 13 new accurate screenshots
- Customer-facing mobile app screens (7)
- Dashboard screens (4: Driver, Admin, Company, Agent)
- Web application screens (2)
- See `/screenshots` folder for complete collection

### Migration Notes
- Database schema updated with new tables (reviews, agents, notifications)
- API changes: Some endpoints have been enhanced or modified
- Breaking changes: Email-based authentication (replaced phone login)
- New environment variables for PWA and real-time features
- Dependencies updated (see package.json)

### Performance Improvements
- 40% faster page loads with optimized images
- Reduced API response times with caching
- Better database query performance
- Optimized bundle size
- Improved mobile performance

---

## Technology Stack

### Frontend
- **Framework**: Next.js 16 with App Router
- **UI Library**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Icons**: Lucide React / Heroicons
- **Forms**: React Hook Form
- **Charts**: Recharts / Chart.js
- **PWA**: next-pwa (Service Workers, Offline Support)

### Backend
- **API**: Next.js API Routes
- **Authentication**: JWT with bcryptjs
- **Two-Factor Auth**: speakeasy (TOTP) with qrcode
- **OAuth**: Google Sign-In integration
- **Real-time**: Socket.IO / WebSocket
- **File Upload**: Next.js Upload / Multer
- **Email**: Nodemailer
- **SMS**: BulkSMS integration

### Database
- **Database**: SQLite with better-sqlite3
- **ORM**: Custom query builder
- **Offline Storage**: IndexedDB (for PWA)
- **Caching**: Redis (optional)

### Payments & Integrations
- **Mobile Money**: Airtel Money API, MTN Mobile Money
- **Payment Gateway**: Stripe / Paystack (optional)
- **GPS Tracking**: Ctrack, Tramigo, Teltonika APIs
- **Push Notifications**: Firebase Cloud Messaging

### Development Tools
- **Package Manager**: npm
- **Version Control**: Git
- **Code Quality**: ESLint, Prettier
- **Testing**: Jest, React Testing Library
- **Deployment**: Vercel / Docker

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

# Mobile Money Integration (v2.0.0)
AIRTEL_MONEY_API_KEY="your-airtel-api-key"
AIRTEL_MONEY_API_SECRET="your-airtel-api-secret"
MTN_MOBILE_MONEY_API_KEY="your-mtn-api-key"
MTN_MOBILE_MONEY_API_SECRET="your-mtn-api-secret"

# GPS Tracking Providers (v2.0.0)
CTRACK_API_KEY="your-ctrack-api-key"
CTRACK_API_SECRET="your-ctrack-api-secret"
TRAMIGO_API_KEY="your-tramigo-api-key"
TELTONIKA_API_KEY="your-teltonika-api-key"

# Push Notifications (v2.0.0)
FIREBASE_PROJECT_ID="your-firebase-project-id"
FIREBASE_PRIVATE_KEY="your-firebase-private-key"
FIREBASE_CLIENT_EMAIL="your-firebase-client-email"

# Real-time Communication (v2.0.0)
SOCKET_IO_PORT="3001"  # Socket.IO server port
SOCKET_IO_CORS_ORIGIN="http://localhost:3000"

# PWA Configuration (v2.0.0)
NEXT_PUBLIC_APP_NAME="VayaZed"
NEXT_PUBLIC_APP_DESCRIPTION="Zambia's Premier Bus Booking Platform"
NEXT_PUBLIC_APP_THEME_COLOR="#2BB2A9"

# SMS Service (v2.0.0)
BULKSMS_API_KEY="your-bulksms-api-key"
BULKSMS_SENDER_ID="VayaZed"
```

**Note:** The system works without these variables in development mode:
- Google OAuth: Button will redirect but fail with a helpful error message
- Password reset: Token is logged to console (development only)
- JWT: Uses a default secret (change for production!)
- Mobile Money: Falls back to manual payment mode
- GPS Tracking: Uses mock data in development
- Push Notifications: Disabled in development
- SMS: Logs to console in development

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

## Screenshots 📸

### Mobile App - Customer Experience

1. **Login Screen** - Email-based authentication with Vayazed branding
2. **Home Screen** - Quick actions, today's routes, popular routes with company logos
3. **Search Results** - Multiple operators with pricing, ratings, and availability
4. **Seat Selection** - Interactive 2-2 layout with color-coded seats
5. **Payment Confirmation** - QR code ticket with booking details
6. **Real-time Tracking** - Live map view with bus location and ETA
7. **Customer Dashboard** - Travel history, loyalty points, upcoming trips

### Dashboard Screens

8. **Driver Dashboard** - Trip management, earnings tracking, daily statistics
9. **Admin Dashboard** - System statistics, activity feed, health monitoring
10. **Company Dashboard** - Fleet overview, route performance, revenue tracking
11. **Agent Dashboard** - Booking management, commission tracking, customer relations

### Web Application

12. **Web Homepage** - Landing page with features and popular routes
13. **Web Search Results** - Advanced filtering with comprehensive bus listings

**View all screenshots in the `/screenshots` folder** or see the detailed [Screenshots Summary](/screenshots/SCREENSHOTS_SUMMARY.md) document for complete descriptions.

## Support

For issues or questions, please contact the development team.

## License

This project is proprietary software developed for VayaZed, powered by Moov.

---

**Made with ❤️ for Zambia's intercity travel, by Moov**