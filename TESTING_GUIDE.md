# VayaZed Bus Booking System - Testing Guide

## 🎯 Application is Ready for Testing!

The VayaZed Bus Booking web application is now running and ready to be tested.

---

## 🌐 Access the Application

**Live URL:** https://3000-b3d2b4b0-a230-4db7-8ef4-ff6ffd5d7292.sandbox-service.public.prod.myninja.ai

**Local URL:** http://localhost:3000

---

## 👥 Demo Accounts

### Customer Account
```
Email: customer@example.com
Password: password123
```

**Capabilities:**
- Search for buses by route and date
- View available buses with seat information
- Book tickets (single or multiple seats)
- Specify luggage count (0-5 pieces)
- Choose boarding point (intermediate stops)
- View booking history
- Check booking details

### Bus Company Accounts

#### Mazhindu Buses
```
Email: info@mazhindubuses.com
Password: password123
```

#### Power Tools Transport
```
Email: contact@powertools.com
Password: password123
```

#### Juldan Motors
```
Email: info@juldan.com
Password: password123
```

**Company Capabilities:**
- Add buses to fleet
- Create and manage routes
- Set departure times and prices
- View all bookings for their buses
- Track seat availability
- Block or reserve specific seats per route
- Configure route-level dynamic pricing multiplier
- Manage multiple buses and routes
- View GPS tracking dashboard
- Register GPS devices

### Driver Accounts

```
Email: peter.banda@example.com
Password: password123
```

Additional drivers are automatically seeded (Joseph Mulenga, Michael Tembo, etc.) with email `{first.last}@example.com`.

**Driver Capabilities:**
- View assigned routes and trips
- Access driver dashboard
- Check boarding manifest
- Submit location updates via GPS
- View trip details and passenger lists
- Start and end trips for live tracking status

> **ℹ️ Testing Mode:** Email verification is disabled in local development. All seeded drivers are pre-verified and ready to log in immediately.

---

## 🧪 Testing Scenarios

### Scenario 1: Customer Booking Flow (End-to-End)

**Objective:** Test the complete customer journey from search to booking confirmation.

**Steps:**
1. **Access Homepage**
   - Go to the live URL
   - Verify homepage loads with search form

2. **Search for Buses**
   - From: Select "Lusaka"
   - To: Select "Ndola" (or any other city)
   - Date: Select today or tomorrow
   - Click "Search Buses"
   - Verify: List of available buses appears

3. **Test Flexible Date Search**
   - Check "Flexible dates (±3 days)" checkbox
   - Click "Search Buses" again
   - Verify: Date carousel appears showing 7 days
   - Each date shows: number of buses available, minimum price
   - Click different dates to filter results
   - Verify: Results update based on selected date

4. **View Bus Details**
   - Check bus information (company, departure time, price)
   - Verify **color-coded seat availability**:
     - 🟢 Green = Many seats (>10)
     - 🟡 Yellow = Limited seats (5-10)
     - 🔴 Red = Almost full (<5)
   - Check **feature badges** (Lowest Price, VIP Coach, etc.)
   - Check amenities (AC, WiFi, etc.)

5. **Test Amenity Filters**
   - Click "Filters" button
   - Check "WiFi" and "AC" amenity buttons
   - Verify: Only buses with both amenities are shown
   - Click "Clear Filters" to reset

6. **Login as Customer**
   - Click "Book Now" on any bus
   - You'll be redirected to login
   - Enter customer credentials
   - Click "Login"

7. **Complete Booking**
   - Select number of passengers (1-5)
   - Pick specific seats from the seat map (when enabled)
   - Specify luggage count (0-5)
   - Choose boarding point (if intermediate stops available)
   - Review booking summary
   - Click "Confirm Booking"

8. **Verify Booking**
   - Note the booking reference number
   - Check booking confirmation message
   - Go to "My Bookings" page
   - Verify booking appears in history

**Expected Results:**
- ✅ Search returns relevant buses
- ✅ Booking process is smooth
- ✅ Blocked/reserved seats are not selectable
- ✅ Booking reference is generated
- ✅ Booking appears in history
- ✅ Seat count decreases after booking

---

### Scenario 2: Company Route Management

**Objective:** Test company's ability to create and manage routes.

**Steps:**
1. **Login as Company**
   - Click "Company Login" on homepage
   - Enter company credentials (Mazhindu Buses)
   - Click "Login"

2. **View Dashboard**
   - Verify company dashboard loads
   - Check tabs: My Buses, Routes, Bookings

3. **Add a New Bus**
   - Go to "My Buses" tab
   - Click "+ Add Bus"
   - Fill in details:
     - Registration: e.g., "BAZ 1234"
     - Capacity: e.g., 50
     - Amenities: Check AC, WiFi, etc.
   - Click "Add Bus"
   - Verify bus appears in list

4. **Create a Route**
   - Go to "Routes" tab
   - Click "+ Add Route"
   - Fill in details:
     - Origin: Select city
     - Destination: Select city
     - Select your bus from dropdown
     - Departure Time: e.g., "08:00"
     - Price: e.g., 150
     - Intermediate Stops: Add 1-2 stops (optional)
   - Click "Create Route"
   - Verify route appears in list

5. **View Bookings**
   - Go to "Bookings" tab
   - Verify bookings for your buses are shown
   - Check booking details (customer, seats, status)

**Expected Results:**
- ✅ Can add buses successfully
- ✅ Can create routes with stops
- ✅ Routes appear in search results
- ✅ Bookings are tracked correctly
- ✅ Dashboard shows accurate data

---

### Scenario 3: Multi-Passenger Booking

**Objective:** Test booking multiple seats with luggage.

**Steps:**
1. Login as customer
2. Search for a bus with available seats
3. Click "Book Now"
4. Select 3 passengers
5. Specify 2 pieces of luggage
6. Choose intermediate boarding point
7. Confirm booking
8. Verify 3 seats are deducted from availability

**Expected Results:**
- ✅ Can book multiple seats
- ✅ Luggage count is recorded
- ✅ Boarding point is saved
- ✅ Seat availability updates correctly

---

### Scenario 4: Search Filters & Enhanced Search

**Objective:** Test search functionality with different parameters and new enhanced features.

**Test Cases:**

**Test 4.1: Same-Day Travel**
- Search: Lusaka → Ndola, Today
- Expected: Shows buses departing today

**Test 4.2: Future Date**
- Search: Lusaka → Livingstone, Tomorrow
- Expected: Shows buses for selected date

**Test 4.3: Flexible Date Search**
- Search: Lusaka → Ndola, Any date
- Enable "Flexible dates (±3 days)" checkbox
- Click "Search Buses"
- Expected: 
  - Date carousel appears with 7 days
  - Each date shows bus count and minimum price
  - Can click dates to filter results
  - Routes show the travel date badge

**Test 4.4: Color-Coded Seat Availability**
- Search for buses
- Expected: Each bus shows colored seat indicator:
  - 🟢 Green = Many seats (>10 available)
  - 🟡 Yellow = Limited seats (5-10 available)
  - 🔴 Red = Almost full (<5 available)
  - ⚫ Gray = Sold out (Book button disabled)

**Test 4.5: Amenity Filtering**
- Click "Filters" button
- Select "WiFi" amenity checkbox
- Select "AC" amenity checkbox
- Expected: Only buses with BOTH WiFi AND AC are shown
- Filter count badge shows "2"
- Clear filters to reset

**Test 4.6: Feature Badges**
- Search for multiple buses on same route
- Expected: Buses display badges:
  - 💰 "Lowest Price" on cheapest option
  - 🎫 "Most Seats" on bus with most availability
  - ⭐ "VIP Coach" on luxury/VIP bus types
  - ⚡ "Express" on express/direct services

**Test 4.7: Combined Filters**
- Set Bus Type: "Luxury"
- Set Price Max: "500"
- Set Time: "Morning"
- Select Amenities: WiFi, AC
- Expected: Results match all filter criteria

**Test 4.8: No Results**
- Search: Obscure route with no buses
- Expected: "No buses found" message

**Expected Results:**
- ✅ Search filters work correctly
- ✅ Results match search criteria
- ✅ Flexible date carousel works
- ✅ Color-coded seats display properly
- ✅ Amenity filters combine correctly (AND logic)
- ✅ Feature badges appear on qualifying buses
- ✅ Appropriate messages for no results

---

### Scenario 5: Booking History

**Objective:** Test customer's ability to view past bookings.

**Steps:**
1. Login as customer
2. Make 2-3 bookings on different routes
3. Go to "My Bookings" page
4. Verify all bookings are listed
5. Check booking details:
   - Booking reference
   - Route information
   - Date and time
   - Number of passengers
   - Total price
   - Status

**Expected Results:**
- ✅ All bookings are displayed
- ✅ Booking details are accurate
- ✅ Bookings are sorted by date
- ✅ Can view individual booking details

---

### Scenario 6: Customer Tracking by Booking Reference

**Objective:** Verify customer can track a bus directly from booking reference and dashboard action.

**Steps:**
1. Login as customer
2. Open "My Bookings"
3. Pick an upcoming or in-transit booking
4. Click "Track Bus"
5. Verify tracking opens without asking for booking reference again
6. Check status message for one of these states:
   - Trip not started yet
   - In transit with latest location
   - Completed/ended

**Expected Results:**
- ✅ Track page loads with booking-based context
- ✅ Inactive trips show clear status messaging instead of broken map state
- ✅ Past bookings do not show "Track Bus" action

---

### Scenario 7: Company Seat Blocking and Dynamic Pricing

**Objective:** Verify company can manage seat availability and pricing per route.

**Steps:**
1. Login as company
2. Open dashboard and click "Seats & Pricing" for a route
3. Mark one seat as `blocked` and another as `reserved`
4. Enable dynamic pricing and set multiplier (example: `1.10`)
5. Save changes
6. Login as customer and open same route booking page
7. Confirm blocked/reserved seats are disabled
8. Select an available seat and verify fare reflects dynamic settings

**Expected Results:**
- ✅ Company changes persist after refresh
- ✅ Customer cannot book blocked/reserved seats
- ✅ Seat-level price updates are reflected during booking and checkout

---

### Scenario 6: Completed Booking Restrictions

**Objective:** Test that completed bookings cannot be cancelled.

**Steps:**
1. Login as customer
2. View a booking that is marked as "COMPLETED"
3. Verify the booking card displays correctly

**Expected Results:**
- ✅ "Cancel Booking" button is NOT shown for completed bookings
- ✅ "Pay Now" button is NOT shown for completed bookings
- ✅ "View Ticket" button IS still shown
- ✅ Booking status shows "COMPLETED" badge

**API Test:**
```
PATCH /api/bookings
Body: { "booking_id": <completed_booking_id>, "status": "cancelled" }
Expected: 400 Bad Request - "Cannot cancel a completed booking"
```

---

### Scenario 7: Route Auto-Completion

**Objective:** Test that past routes are automatically marked as completed.

**Steps:**
1. Login as company
2. Access the enhanced dashboard
3. If there are any routes with dates in the past, they should be auto-completed

**Expected Results:**
- ✅ Routes with past dates show "completed" status
- ✅ Associated bookings are also marked as completed
- ✅ No manual action required

**API Test:**
```
POST /api/routes/auto-complete
Expected: 200 OK - { "routesCompleted": X, "bookingsCompleted": Y }
```

---

### Scenario 8: Duplicate and Recurring Routes

**Objective:** Test route duplication and recurring schedule creation.

**Steps:**
1. Login as company (e.g., info@mazhindubuses.com)
2. Go to "Routes & Schedules" tab
3. Find an existing route
4. Click "Duplicate" button

**Test 8.1: Single Date Duplicate**
1. Select "Single Date" mode
2. Pick a future date
3. Optionally change time or price
4. Click "Create Route"
- Expected: One new route is created

**Test 8.2: Daily Recurring**
1. Select "Recurring" mode
2. Choose "Daily" pattern
3. Set start date (tomorrow) and end date (7 days out)
4. Click "Create Routes"
- Expected: 7 routes are created

**Test 8.3: Weekdays Only**
1. Select "Recurring" mode
2. Choose "Weekdays (Mon-Fri)" pattern
3. Set a two-week date range
4. Click "Create Routes"
- Expected: ~10 routes created (only weekdays)

**Test 8.4: Specific Days**
1. Select "Recurring" mode
2. Choose "Specific Days of Week" pattern
3. Select Mon, Wed, Fri
4. Set a month-long date range
4. Click "Create Routes"
- Expected: Routes created only for selected days

**Test 8.5: Conflict Handling**
1. Try to duplicate to a date where same bus already has a route at same time
2. Expected: Date is skipped, message shows "X skipped due to conflicts"

**Expected Results:**
- ✅ Single duplicate creates exactly one route
- ✅ Recurring creates multiple routes per pattern
- ✅ Conflicts are skipped gracefully
- ✅ Summary shows created vs skipped count
- ✅ New routes have full seat capacity

---

### Scenario 9: Company Logo and Bus Image Upload

**Objective:** Test company branding features - logo upload and bus photo gallery.

**Steps:**

**Test 9.1: Upload Company Logo**
1. Login as company (e.g., info@mazhindubuses.com)
2. Go to Enhanced Dashboard
3. Click "Profile" or navigate to company profile section
4. Click "Choose File" in logo upload area
5. Select an image (JPEG, PNG, WebP, or GIF, max 2MB)
6. Click "Upload"
- Expected: Logo appears in preview and is saved to server

**Test 9.2: Delete Company Logo**
1. With a logo uploaded, click the delete/remove button
- Expected: Logo is removed and default placeholder shows

**Test 9.3: Upload Bus Photos**
1. Go to "Fleet Management" or "My Buses" tab
2. Click "📷 Photos" button on any bus
3. Click "Choose Files" 
4. Select up to 5 images (max 2MB each)
5. Click "Upload"
- Expected: Images appear in gallery grid

**Test 9.4: View Bus Photo Gallery**
1. With uploaded images, click on any image
- Expected: Lightbox opens with full-size image
- Can navigate with arrows or thumbnails
- Shows image count (e.g., "2 / 5")
- Close button works

**Test 9.5: Delete Bus Photo**
1. In the bus photos modal, click delete icon on any image
- Expected: Image is removed from gallery

**Test 9.6: Image Limit Enforcement**
1. Try to upload more than 5 images for a single bus
- Expected: Error message "Maximum 5 images allowed per bus"

**Test 9.7: File Size Limit**
1. Try to upload an image larger than 2MB
- Expected: Error message about file size limit

**Test 9.8: Images in Search Results**
1. Search for buses
2. Look for buses with uploaded images
- Expected: 
  - Company logo shows next to company name
  - Bus preview image shows on the left of each result
  - "+X" badge shows count of additional images

**Test 9.9: Customer Lightbox**
1. As a customer, search for buses
2. Click on a bus preview image with multiple photos
- Expected: Lightbox opens showing all bus photos with navigation

**Expected Results:**
- ✅ Company logo uploads and displays correctly
- ✅ Can delete company logo
- ✅ Bus photos upload with progress indication
- ✅ Gallery displays in grid format
- ✅ Lightbox navigation works (arrows, thumbnails)
- ✅ Delete removes individual photos
- ✅ 5 image limit per bus enforced
- ✅ 2MB file size limit enforced
- ✅ Images display in customer search results
- ✅ Lightbox works from search results

---

## 🔍 Key Features to Test

### Customer Features
- [ ] Homepage search form
- [ ] Bus search results
- [ ] Bus details display
- [ ] Login/Logout
- [ ] Booking form
- [ ] Booking confirmation
- [ ] Booking history
- [ ] Seat availability check
- [ ] Luggage specification
- [ ] Intermediate stop selection
- [ ] Cancel booking (pending/confirmed only)
- [ ] View E-Ticket with QR code
- [ ] Completed booking restrictions (no cancel button)
- [ ] **View company logos in search results**
- [ ] **View bus preview images**
- [ ] **Open photo lightbox gallery**
- [ ] **Sticky header navigation**

### Company Features
- [ ] Company login
- [ ] Dashboard overview
- [ ] Add new bus
- [ ] Edit bus details
- [ ] Create route
- [ ] Edit route
- [ ] **Duplicate route (single date)**
- [ ] **Create recurring routes (daily/weekdays/weekends/weekly)**
- [ ] View bookings
- [ ] Booking details
- [ ] Fleet management
- [ ] Route management
- [ ] **Auto-complete past routes**
- [ ] Trip manifest
- [ ] **Upload company logo**
- [ ] **Delete company logo**
- [ ] **Upload bus photos (up to 5)**
- [ ] **View bus photo gallery**
- [ ] **Delete bus photos**

### System Features
- [ ] Authentication (login/logout)
- [ ] Session management
- [ ] Real-time seat updates
- [ ] Data validation
- [ ] Error handling
- [ ] Responsive design (mobile/tablet/desktop)
- [ ] Navigation between pages
- [ ] Form submissions
- [ ] **Image upload (logo, bus photos)**
- [ ] **File type/size validation**
- [ ] **Lightbox gallery component**

---

## 📊 Database Verification

### Check Current Data

**Users:**
- 4 users total (3 companies + 1 customer)

**Buses:**
- 5 buses registered across companies

**Routes:**
- 63 routes available

**Bookings:**
- 0 bookings initially (will increase as you test)

### Verify After Testing

After completing test scenarios, verify:
- Booking count increases
- Seat availability decreases
- Booking references are unique
- Customer bookings appear in company dashboard

---

## 🐛 Bug Reporting Template

If you find any issues, document them using this format:

```
**Bug Title:** [Brief description]

**Severity:** Critical / High / Medium / Low

**Steps to Reproduce:**
1. Step one
2. Step two
3. Step three

**Expected Result:**
What should happen

**Actual Result:**
What actually happened

**Screenshots:**
[Attach if applicable]

**Browser/Device:**
[e.g., Chrome on Windows, Safari on iPhone]
```

---

## ✅ Testing Checklist

### Functional Testing
- [ ] User registration/login works
- [ ] Search functionality returns correct results
- [ ] Booking process completes successfully
- [ ] Payment simulation works
- [ ] Booking confirmation is generated
- [ ] Booking history displays correctly
- [ ] Company can add buses
- [ ] Company can create routes
- [ ] Company can view bookings
- [ ] Seat availability updates in real-time

### UI/UX Testing
- [ ] All pages load correctly
- [ ] Navigation is intuitive
- [ ] Forms are user-friendly
- [ ] Error messages are clear
- [ ] Success messages appear
- [ ] Responsive on mobile devices
- [ ] Responsive on tablets
- [ ] Responsive on desktop

### Security Testing
- [ ] Cannot access protected pages without login
- [ ] Customer cannot access company pages
- [ ] Company cannot access other company's data
- [ ] Passwords are not visible
- [ ] Session expires after logout

### Performance Testing
- [ ] Pages load within 3 seconds
- [ ] Search results appear quickly
- [ ] Booking submission is fast
- [ ] No lag when navigating
- [ ] Database queries are efficient

---

## 🚨 Known Limitations

1. **Payment Integration:** Currently simulated (no real payment processing)
2. **Email Notifications:** Not implemented (would need email service)
3. **SMS Notifications:** Not implemented (would need SMS gateway)
4. **Admin Panel:** Not included in current version
5. **Seat Selection:** Automatic assignment (no visual seat map)

---

## 📞 Support

If you encounter issues during testing:

1. Check the browser console for errors (F12)
2. Verify you're using the correct credentials
3. Ensure the server is running (check terminal)
4. Try refreshing the page
5. Clear browser cache if needed

---

## 🎉 Success Criteria

The application is considered ready for production when:

✅ All test scenarios pass successfully
✅ No critical bugs found
✅ UI is responsive on all devices
✅ All features work as expected
✅ Data integrity is maintained
✅ Security measures are effective
✅ Performance is acceptable

---

## 📝 Test Results Template

Use this template to document your testing:

```
**Test Date:** [Date]
**Tester:** [Your Name]
**Version:** 1.0.0

**Test Summary:**
- Total Tests: [Number]
- Passed: [Number]
- Failed: [Number]
- Blocked: [Number]

**Critical Issues:**
1. [Issue 1]
2. [Issue 2]

**Recommendations:**
1. [Recommendation 1]
2. [Recommendation 2]

**Overall Assessment:**
[Ready for Production / Needs Fixes / Major Issues]
```

---

**Happy Testing! 🚀**

**Application URL:** https://3000-b3d2b4b0-a230-4db7-8ef4-ff6ffd5d7292.sandbox-service.public.prod.myninja.ai