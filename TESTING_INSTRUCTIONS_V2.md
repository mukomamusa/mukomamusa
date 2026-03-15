# Vayazed v2.0.0 Testing Guide

## 🚀 Quick Start

**Your application is now running and accessible at:**
**https://001eu.app.super.myninja.ai**

---

## 📋 Test Accounts

### Customer Account
```
Email: customer@example.com
Password: password123
```

### Bus Company Accounts
```
Mazhindu Buses:
Email: info@mazhindubuses.com
Password: password123

Power Tools Transport:
Email: contact@powertools.com
Password: password123

Juldan Motors:
Email: info@juldan.com
Password: password123
```

### Driver Account
```
Email: peter.banda@example.com
Password: password123
```

---

## 🧪 Testing Scenarios

### 1. **Customer Booking Flow** (End-to-End)

#### Step 1: Access Homepage
- [ ] Go to https://001eu.app.super.myninja.ai
- [ ] Verify homepage loads with search form
- [ ] Check Vayazed branding is displayed (not "Vayazed")
- [ ] Verify color scheme is teal (#2BB2A9)

#### Step 2: Search for Buses
- [ ] From: Select "Lusaka"
- [ ] To: Select "Ndola" (or any other city)
- [ ] Date: Select today or a future date
- [ ] Click "Search Buses"
- [ ] Verify search results display multiple bus options
- [ ] Check company logos are visible
- [ ] Verify prices and ratings are shown

#### Step 3: View Bus Details
- [ ] Click on a bus option
- [ ] Verify amenities are displayed (WiFi, AC, USB, etc.)
- [ ] Check departure and arrival times
- [ ] View seat availability

#### Step 4: Seat Selection
- [ ] Click "Select Seats"
- [ ] Verify interactive seat layout appears
- [ ] Check color coding:
  - Green = Available
  - Red = Booked
  - Blue = Selected
- [ ] Select 2-3 seats
- [ ] Verify price updates dynamically
- [ ] Click "Continue to Payment"

#### Step 5: Payment & Confirmation
- [ ] Enter passenger details
- [ ] Select luggage count (0-5)
- [ ] Choose boarding point if intermediate stops exist
- [ ] Select payment method (Mobile Money/Card)
- [ ] Click "Confirm Booking"
- [ ] Verify booking confirmation appears
- [ ] Check QR code is generated
- [ ] Verify booking reference number is displayed

#### Step 6: My Bookings
- [ ] Navigate to "My Trips" or "My Bookings"
- [ ] Verify recent booking appears
- [ ] Check booking details are correct
- [ ] Test download ticket functionality
- [ ] Test share ticket functionality

---

### 2. **Real-Time Tracking** (New v2.0.0 Feature)

#### Step 1: Track a Bus
- [ ] Navigate to "Track Bus" or go to your booking
- [ ] Click "Track Bus" button
- [ ] Verify map view loads
- [ ] Check bus location is displayed on map
- [ ] Verify route visualization
- [ ] Check ETA is calculated

#### Step 2: Tracking Features
- [ ] Verify progress indicator (percentage complete)
- [ ] Check current speed display
- [ ] View driver information
- [ ] Test "Contact Driver" button
- [ ] Test "Share Location" functionality
- [ ] Verify real-time updates (wait 30 seconds)

---

### 3. **Agent System** (New v2.0.0 Feature)

#### Step 1: Agent Dashboard
- [ ] Log in as agent (create agent account first)
- [ ] Verify agent dashboard loads
- [ ] Check commission rate is displayed
- [ ] View booking statistics

#### Step 2: Single Booking
- [ ] Click "New Booking"
- [ ] Select customer or enter customer details
- [ ] Choose route and bus
- [ ] Select seats
- [ ] Calculate commission
- [ ] Confirm booking
- [ ] Verify commission is recorded

#### Step 3: Bulk Booking
- [ ] Click "Bulk Booking"
- [ ] Select multiple passengers
- [ ] Choose same bus/route
- [ ] Select multiple seats
- [ ] Calculate total commission
- [ ] Confirm bulk booking
- [ ] Verify all bookings are created

#### Step 4: Commission Tracking
- [ ] Navigate to "Commission Report"
- [ ] View commission earnings
- [ ] Check commission by booking
- [ ] Verify commission rate calculation

---

### 4. **Review & Rating System** (New v2.0.0 Feature)

#### Step 1: Submit a Review
- [ ] Go to "My Trips"
- [ ] Click on a completed trip
- [ ] Click "Write Review"
- [ ] Select star rating (1-5 stars)
- [ ] Write review text
- [ ] Submit review
- [ ] Verify review submission confirmation

#### Step 2: View Bus Reviews
- [ ] Search for buses
- [ ] Click on a bus company
- [ ] Scroll to reviews section
- [ ] Verify reviews are displayed
- [ ] Check star ratings
- [ ] View individual reviews

#### Step 3: Filter Reviews
- [ ] Test filtering by rating
- [ ] Test sorting by newest/oldest
- [ ] Verify filtering works correctly

---

### 5. **Company Dashboard**

#### Step 1: Log in as Company
- [ ] Log out of customer account
- [ ] Log in as: info@mazhindubuses.com
- [ ] Password: password123
- [ ] Verify company dashboard loads

#### Step 2: Fleet Management
- [ ] Navigate to "My Buses"
- [ ] View list of buses
- [ ] Check bus status (Active/Inactive)
- [ ] Add a new test bus (optional)
- [ ] Edit existing bus details

#### Step 3: Route Management
- [ ] Navigate to "Routes"
- [ ] View all routes
- [ ] Check route performance metrics
- [ ] Add a new test route (optional)
- [ ] Update route pricing

#### Step 4: Booking Management
- [ ] Navigate to "Bookings"
- [ ] View all bookings for your buses
- [ ] Check passenger manifests
- [ ] Verify seat allocation
- [ ] View revenue by route

#### Step 5: Driver Management
- [ ] Navigate to "Drivers"
- [ ] View all drivers
- [ ] Assign driver to bus/route
- [ ] View driver performance

---

### 6. **Driver Dashboard**

#### Step 1: Log in as Driver
- [ ] Log out of company account
- [ ] Log in as: peter.banda@example.com
- [ ] Password: password123
- [ ] Verify driver dashboard loads

#### Step 2: View Assigned Trips
- [ ] Check "Today's Trips"
- [ ] View upcoming trips
- [ ] Check trip details (route, time, passengers)
- [ ] View passenger manifest

#### Step 3: Start/End Trip
- [ ] Click "Start Trip" for assigned trip
- [ ] Verify trip status changes to "In Progress"
- [ ] Check location sharing starts
- [ ] Complete trip (or use test mode)
- [ ] Click "End Trip"
- [ ] Verify trip status changes to "Completed"

#### Step 4: View Earnings
- [ ] Navigate to "Earnings"
- [ ] View daily earnings
- [ ] Check earnings history
- [ ] View performance chart

---

### 7. **Admin Dashboard**

#### Step 1: Access Admin Panel
- [ ] Log in with admin credentials
- [ ] Verify admin dashboard loads
- [ ] Check system statistics

#### Step 2: System Monitoring
- [ ] View total users count
- [ ] Check total bookings
- [ ] Verify revenue statistics
- [ ] View active companies

#### Step 3: Activity Feed
- [ ] View real-time activity feed
- [ ] Check recent bookings
- [ ] Monitor user registrations
- [ ] View system events

#### Step 4: User Management
- [ ] Navigate to "Users"
- [ ] View all users
- [ ] Search for specific users
- [ ] View user details
- [ ] Manage user status (Active/Inactive)

---

### 8. **PWA & Offline Features** (New v2.0.0 Feature)

#### Step 1: Install as PWA
- [ ] Open application in Chrome/Edge
- [ ] Look for install icon in address bar
- [ ] Click "Install Vayazed"
- [ ] Verify PWA installation
- [ ] Check desktop icon is created

#### Step 2: Offline Mode
- [ ] Disconnect internet connection
- [ ] Try to access previously loaded pages
- [ ] Verify offline cache works
- [ ] Check saved bookings are accessible
- [ ] Reconnect internet
- [ ] Verify data syncs when online

#### Step 3: Background Sync
- [ ] Create a booking while offline
- [ ] Verify booking is queued
- [ ] Reconnect internet
- [ ] Check if booking syncs automatically
- [ ] Verify confirmation appears after sync

---

### 9. **Mobile Money Integration** (New v2.0.0 Feature)

#### Step 1: Airtel Money
- [ ] Start a booking
- [ ] Select "Airtel Money" as payment method
- [ ] Enter phone number
- [ ] Click "Pay"
- [ ] Verify payment prompt appears (test mode)
- [ ] Complete test payment
- [ ] Check booking confirmation

#### Step 2: MTN Mobile Money
- [ ] Start another booking
- [ ] Select "MTN Mobile Money" as payment method
- [ ] Enter phone number
- [ ] Click "Pay"
- [ ] Verify payment prompt appears (test mode)
- [ ] Complete test payment
- [ ] Check booking confirmation

---

### 10. **Authentication System** (Breaking Change)

#### Step 1: Email-Based Login
- [ ] Log out if logged in
- [ ] Go to login page
- [ ] Verify email input field (NOT phone number)
- [ ] Enter: customer@example.com
- [ ] Password: password123
- [ ] Click "Sign In"
- [ ] Verify successful login

#### Step 2: Create New Account
- [ ] Click "Create Account"
- [ ] Verify email input (not phone)
- [ ] Enter new email: testcustomer@example.com
- [ ] Enter password
- [ ] Click "Sign Up"
- [ ] Verify account creation
- [ ] Check email verification (may be disabled in test mode)

#### Step 3: Password Recovery
- [ ] Log out
- [ ] Click "Forgot Password"
- [ ] Enter email address
- [ ] Click "Send Reset Link"
- [ ] Verify reset email is sent (test mode)
- [ ] Check email for reset link

---

## 📱 Responsive Design Testing

### Desktop (1920x1080)
- [ ] Test homepage layout
- [ ] Verify dashboard rendering
- [ ] Check booking flow
- [ ] Test search results

### Tablet (768x1024)
- [ ] Test responsive navigation
- [ ] Verify touch targets
- [ ] Check card layouts
- [ ] Test scrolling behavior

### Mobile (375x667)
- [ ] Test mobile navigation
- [ ] Verify hamburger menu
- [ ] Check form inputs on mobile
- [ ] Test touch gestures
- [ ] Verify PWA install prompt

---

## 🔍 API Testing

### Test API Endpoints
Use the provided test scripts or Postman/cURL:

```bash
# Test database connection
npm run test:db

# Test enhanced database
npm run test:enhanced

# Test API endpoints
node test-api-endpoints.js

# Test booking flow
node test-booking-flow.js
```

### Manual API Testing
1. Open browser DevTools (F12)
2. Go to Network tab
3. Perform actions in the app
4. Check API requests:
   - Verify correct endpoints are called
   - Check request payloads
   - Verify response codes (200, 201, 400, etc.)
   - Check response data structure

---

## 🐛 Bug Reporting

If you find any issues, please document:

1. **Bug Description**: What went wrong?
2. **Steps to Reproduce**: How to trigger the bug?
3. **Expected Behavior**: What should happen?
4. **Actual Behavior**: What actually happened?
5. **Browser/Device**: Which browser and device?
6. **Screenshots**: Take screenshots if possible
7. **Console Errors**: Check browser console (F12) for errors

---

## ✅ Testing Checklist Summary

### Core Features
- [ ] Customer booking flow (end-to-end)
- [ ] Search and filter functionality
- [ ] Seat selection
- [ ] Payment processing
- [ ] Booking confirmation
- [ ] My Bookings page

### New v2.0.0 Features
- [ ] Real-time bus tracking
- [ ] Agent booking system
- [ ] Commission tracking
- [ ] Review and rating system
- [ ] PWA installation
- [ ] Offline functionality
- [ ] Background sync
- [ ] Mobile money payments (Airtel & MTN)

### User Roles
- [ ] Customer features
- [ ] Driver dashboard
- [ ] Company dashboard
- [ ] Agent dashboard
- [ ] Admin dashboard

### Technical
- [ ] Email-based authentication
- [ ] Responsive design (all devices)
- [ ] API endpoints functionality
- [ ] Database operations
- [ ] Error handling
- [ ] Loading states

---

## 📊 Performance Testing

### Page Load Times
- [ ] Homepage: < 3 seconds
- [ ] Search results: < 2 seconds
- [ ] Booking page: < 2 seconds
- [ ] Dashboard: < 2 seconds

### User Experience
- [ ] Smooth animations
- [ ] No lag on interactions
- [ ] Fast API responses (< 500ms)
- [ ] Efficient data loading

---

## 🔐 Security Testing

### Authentication
- [ ] Login validation
- [ ] Password encryption
- [ ] Session management
- [ ] Token handling

### Data Protection
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Secure API endpoints

---

## 📝 Notes for Testers

- **Testing Mode**: Email verification is disabled in development
- **Demo Data**: Use seeded accounts for testing
- **Payment**: Use test mode for mobile money payments
- **GPS**: Use mock GPS data for testing tracking features
- **Database**: SQLite is used in development (PostgreSQL in production)

---

## 🎯 Success Criteria

All tests pass if:
✅ All core booking features work correctly
✅ All new v2.0.0 features function as expected
✅ No critical bugs are found
✅ Performance is acceptable
✅ Responsive design works on all devices
✅ Authentication system works correctly
✅ API endpoints respond correctly

---

## 📞 Support

If you encounter issues during testing:
1. Check browser console for errors (F12)
2. Review the `DEVELOPER_TEAM_NOTES.md` for known issues
3. Check the `API_DOCUMENTATION_V2.md` for API details
4. Verify all environment variables are set correctly

---

**Happy Testing! 🚀**