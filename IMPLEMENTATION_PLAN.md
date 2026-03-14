# VayaZed Bus Booking System - Implementation Plan

## 🎯 Comprehensive Update Implementation

This document outlines the step-by-step implementation of all 5 requested enhancements.

---

## Phase 1: Foundation Updates (Cities & Branding)

### ✅ Completed
1. Created `app/lib/zambia-data.ts` with:
   - 40+ Zambian cities across all 10 provinces
   - Popular routes with distances and travel times
   - Zambian flag color definitions
   - Payment methods (MTN, Airtel, Zamtel, Cards)
   - Bus amenities
   
2. Updated `tailwind.config.js` with:
   - Zambian flag colors (Green, Red, Orange, Black)
   - Primary color: Zambian Green (#198A00)
   - Secondary color: Zambian Orange (#EF7D00)
   - Accent color: Zambian Red (#DE2010)

### 🔄 In Progress
3. Update homepage (`app/page.tsx`) to use:
   - New city list (40+ cities)
   - Zambian flag color scheme
   - Improved UI/UX
   - Cultural elements

4. Update database initialization to include:
   - More routes based on zambia-data.ts
   - Realistic pricing
   - Travel times

---

## Phase 2: Admin Panel

### Components to Create
1. **Admin Authentication**
   - `app/admin/login/page.tsx`
   - Admin credentials in database
   - JWT with admin role

2. **Admin Dashboard**
   - `app/admin/dashboard/page.tsx`
   - Statistics overview
   - Charts and graphs

3. **User Management**
   - `app/admin/users/page.tsx`
   - List all users
   - Edit/Delete users
   - View user activity

4. **Company Management**
   - `app/admin/companies/page.tsx`
   - Approve/Reject companies
   - View company details
   - Manage company status

5. **Route Management**
   - `app/admin/routes/page.tsx`
   - View all routes
   - Edit/Delete routes
   - Route analytics

6. **Booking Management**
   - `app/admin/bookings/page.tsx`
   - View all bookings
   - Booking statistics
   - Revenue tracking

7. **Payment Monitoring**
   - `app/admin/payments/page.tsx`
   - Payment transactions
   - Payment status
   - Revenue reports

8. **System Settings**
   - `app/admin/settings/page.tsx`
   - Platform settings
   - Commission rates
   - Email/SMS templates

---

## Phase 3: Payment Gateway Integration

### Payment Providers
1. **Mobile Money Integration**
   - MTN Mobile Money API
   - Airtel Money API
   - Zamtel Kwacha API

2. **Card Payment Integration**
   - Flutterwave (recommended for Zambia)
   - Paystack
   - Stripe (international cards)

### Components to Create
1. **Payment Selection**
   - `app/components/PaymentSelector.tsx`
   - Choose payment method
   - Display available options

2. **Mobile Money Payment**
   - `app/components/MobileMoneyPayment.tsx`
   - Enter phone number
   - Initiate payment
   - Verify payment

3. **Card Payment**
   - `app/components/CardPayment.tsx`
   - Card details form
   - Secure payment processing
   - 3D Secure support

4. **Payment Verification**
   - `app/api/payments/verify/route.ts`
   - Check payment status
   - Update booking status
   - Generate receipt

5. **Payment History**
   - `app/customer/payments/page.tsx`
   - View all payments
   - Download receipts
   - Payment status

### API Endpoints
- `POST /api/payments/initiate` - Start payment
- `POST /api/payments/verify` - Verify payment
- `GET /api/payments/status/:id` - Check status
- `POST /api/payments/webhook` - Payment callbacks

---

## Phase 4: Email/SMS Notifications

### Email Service Setup
**Provider:** Resend (recommended) or SendGrid

**Email Templates:**
1. Booking Confirmation
2. Payment Confirmation
3. Booking Reminder (24 hours before)
4. Booking Cancellation
5. Password Reset
6. Welcome Email

### SMS Service Setup
**Provider:** Africa's Talking (Zambian provider)

**SMS Templates:**
1. Booking Confirmation with reference
2. Payment Confirmation
3. Boarding reminder
4. Bus delay notifications

### Components to Create
1. **Email Service**
   - `app/lib/email-service.ts`
   - Send email function
   - Template rendering
   - Error handling

2. **SMS Service**
   - `app/lib/sms-service.ts`
   - Send SMS function
   - Template rendering
   - Delivery tracking

3. **Notification Manager**
   - `app/lib/notification-manager.ts`
   - Unified notification interface
   - Queue management
   - Retry logic

### API Endpoints
- `POST /api/notifications/email` - Send email
- `POST /api/notifications/sms` - Send SMS
- `GET /api/notifications/status/:id` - Check delivery

---

## Phase 5: UI/UX Improvements

### Homepage Enhancements
1. **Hero Section**
   - Zambian flag colors
   - Compelling headline
   - Search prominence
   - Cultural imagery

2. **Features Section**
   - Why choose us
   - Safety features
   - Customer testimonials
   - Popular routes

3. **How It Works**
   - Step-by-step guide
   - Visual illustrations
   - Clear CTAs

### Booking Flow Improvements
1. **Search Results**
   - Better bus cards
   - Filter options
   - Sort functionality
   - Map view (optional)

2. **Booking Form**
   - Progress indicator
   - Form validation
   - Seat selection visual
   - Price breakdown

3. **Payment Page**
   - Secure indicators
   - Multiple payment options
   - Clear instructions
   - Support contact

### Dashboard Improvements
1. **Customer Dashboard**
   - Upcoming trips
   - Past bookings
   - Quick rebooking
   - Favorite routes

2. **Company Dashboard**
   - Revenue charts
   - Booking trends
   - Fleet utilization
   - Performance metrics

---

## Implementation Timeline

### Week 1: Foundation
- ✅ Day 1: Cities & Colors (DONE)
- Day 2: Update homepage UI
- Day 3: Update database with new routes
- Day 4: Test and refine

### Week 2: Admin Panel
- Day 1-2: Admin authentication & dashboard
- Day 3: User & company management
- Day 4: Route & booking management
- Day 5: Payment monitoring & settings

### Week 3: Payment Integration
- Day 1: Payment provider setup
- Day 2: Mobile money integration
- Day 3: Card payment integration
- Day 4: Payment verification & webhooks
- Day 5: Testing & refinement

### Week 4: Notifications
- Day 1: Email service setup
- Day 2: SMS service setup
- Day 3: Notification templates
- Day 4: Integration with booking flow
- Day 5: Testing & monitoring

### Week 5: Polish & Testing
- Day 1-2: UI/UX improvements
- Day 3: End-to-end testing
- Day 4: Performance optimization
- Day 5: Documentation & deployment

---

## Technical Requirements

### Environment Variables Needed
```env
# Database
DATABASE_URL=

# JWT
JWT_SECRET=

# Email (Resend)
RESEND_API_KEY=

# SMS (Africa's Talking)
AFRICAS_TALKING_API_KEY=
AFRICAS_TALKING_USERNAME=

# Payment - Flutterwave
FLUTTERWAVE_PUBLIC_KEY=
FLUTTERWAVE_SECRET_KEY=
FLUTTERWAVE_ENCRYPTION_KEY=

# Payment - MTN Mobile Money
MTN_API_KEY=
MTN_API_SECRET=

# Payment - Airtel Money
AIRTEL_API_KEY=
AIRTEL_API_SECRET=

# Admin
ADMIN_EMAIL=
ADMIN_PASSWORD=

# App
NEXT_PUBLIC_APP_URL=
```

### Dependencies to Install
```bash
# Payment
npm install flutterwave-node-v3

# Email
npm install resend

# SMS
npm install africastalking

# Charts (for admin dashboard)
npm install recharts

# Date handling
npm install date-fns

# Form validation
npm install zod

# State management (optional)
npm install zustand
```

---

## Database Schema Updates

### New Tables

**1. payments**
```sql
CREATE TABLE payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  payment_method TEXT NOT NULL,
  payment_provider TEXT,
  transaction_id TEXT UNIQUE,
  phone_number TEXT,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (booking_id) REFERENCES bookings(id)
);
```

**2. notifications**
```sql
CREATE TABLE notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  channel TEXT NOT NULL,
  recipient TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  sent_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**3. admin_users**
```sql
CREATE TABLE admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**4. system_settings**
```sql
CREATE TABLE system_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Updated Tables

**bookings** - Add payment_status column
```sql
ALTER TABLE bookings ADD COLUMN payment_status TEXT DEFAULT 'pending';
ALTER TABLE bookings ADD COLUMN payment_id INTEGER;
```

---

## Testing Checklist

### Phase 1: Foundation
- [ ] All 40+ cities appear in dropdowns
- [ ] Zambian colors display correctly
- [ ] Homepage loads with new design
- [ ] Search functionality works
- [ ] Routes display with correct info

### Phase 2: Admin Panel
- [ ] Admin can login
- [ ] Dashboard shows statistics
- [ ] Can manage users
- [ ] Can manage companies
- [ ] Can view all bookings
- [ ] Can monitor payments

### Phase 3: Payment Integration
- [ ] MTN Mobile Money works
- [ ] Airtel Money works
- [ ] Card payment works
- [ ] Payment verification works
- [ ] Receipts are generated
- [ ] Failed payments handled

### Phase 4: Notifications
- [ ] Booking confirmation email sent
- [ ] Booking confirmation SMS sent
- [ ] Payment confirmation sent
- [ ] Reminders sent
- [ ] Templates render correctly

### Phase 5: UI/UX
- [ ] Homepage is attractive
- [ ] Booking flow is smooth
- [ ] Dashboards are intuitive
- [ ] Mobile responsive
- [ ] Fast loading times

---

## Success Criteria

✅ **Foundation**
- 40+ cities available
- Zambian flag colors throughout
- Improved UI/UX

✅ **Admin Panel**
- Full system management
- Analytics and reports
- User/company control

✅ **Payment Integration**
- Multiple payment methods
- Secure transactions
- Automatic verification

✅ **Notifications**
- Email confirmations
- SMS notifications
- Timely reminders

✅ **Overall**
- Professional appearance
- Smooth user experience
- Production-ready code
- Complete documentation

---

**Current Status:** Phase 1 - Foundation (In Progress)
**Next Step:** Update homepage with new cities and Zambian branding
**Estimated Completion:** 5 weeks for full implementation