# Quick Start Guide - VayaZed Bus Booking System v2.0

Get up and running in 5 minutes! ⚡

---

## Prerequisites

✅ Node.js 18+ installed  
✅ npm installed  
✅ Terminal/Command prompt access  

---

## Installation (4 Steps)

### Step 1: Navigate to Project
```bash
cd DEVELOPER_PACKAGE
```

### Step 2: Install Dependencies
```bash
npm install
```

> ⚠️ You may see a PostgreSQL migration error - this is safe to ignore. The app uses SQLite locally.

### Step 3: Configure Environment
```bash
cp .env.example .env.local
```

Then edit `.env.local` with your settings:
- `AT_USERNAME=sandbox` (Africa's Talking for SMS, use sandbox for testing)
- `JWT_SECRET` - already set to a secure value
- `GPS_WEBHOOK_SECRET` - GPS device webhook authentication
- `FCM_SERVER_KEY` - Firebase Cloud Messaging for push notifications
- `CTRACK_API_KEY`, `CTRACK_BASE_URL` - GPS tracking provider
- `WHATSAPP_API_TOKEN` - WhatsApp messaging (optional)

### Step 4: Seed the Database
```bash
npm run seed
```

This creates the database with sample data including:
- 3 bus companies with RTSA licenses
- PSV-licensed drivers (1 per company)
- Buses with seat layouts and amenities
- Demo customer and admin accounts
- **GPS demo devices** linked to buses
- **Active tracking trips** in-transit
- **Location history** for each tracking trip
- **Notification logs** for trip events

### Step 5: Start Development Server
```bash
npm run dev
```

**That's it!** The application will start at `http://localhost:3000`

---

## Access the Application

### Local Development
🏠 **http://localhost:3000**

---

## Demo Accounts

### Try as a Customer
```
Email: customer@example.com
Password: password123
NRC: 123456/78/1
```

**What you can do:**
- Search for buses with flexible dates (±3 days)
- Use color-coded seat indicators
- Filter by amenities (WiFi, AC, etc.)
- Book tickets with passenger details and seat map selection
- View tickets with QR codes
- View booking history
- Track active trips directly using booking reference

### Try as a Bus Company
```
Email: info@mazhindubuses.com
Password: password123
RTSA License: RTSA-2024-MBS001
```

**What you can do:**
- Add buses to fleet
- Manage drivers
- Create routes and assign drivers
- View passenger manifests
- Scan tickets for boarding
- View GPS tracking dashboard
- Register GPS devices
- Manage route seat states (available, blocked, reserved)
- Configure dynamic pricing multiplier per route

### Try as a Driver
```
Email: peter.banda@example.com (or any seeded driver)
Password: password123
```

**What you can do:**
- View assigned routes and trips
- Access driver dashboard
- Check boarding manifest
- Submit location updates

> **ℹ️ Testing Note:** Email verification is bypassed during local development (`REQUIRE_DRIVER_EMAIL_VERIFICATION=false` in `.env.local`) to speed up testing. All seeded drivers are pre-verified and can log in immediately.

### Try as Admin
```
Email: admin@zambiabus.com
Password: password123
```

**What you can do:**
- Process payments
- Handle refund requests
- Manage notifications

---

## Database Management Scripts

### Available Commands

```bash
# Seed the database (creates demo data)
npm run seed

# Initialize database with schema only
npm run db:init

# Verify all tables exist
npm run db:verify

# Reset database: backup → wipe → reinit → verify
npm run db:reset

# Pre-verify drivers for testing (marks all active drivers as email-verified)
npm run drivers:preverify
```

**Notes:**
- `db:reset` backs up your current database before wiping it, so you can restore if needed.
- `drivers:preverify` is useful if you've already seeded but want to quickly mark drivers as verified for testing.

---

## Quick Test Flow

### 1. Book a Ticket (Customer)
1. Go to home page
2. Select: From "Lusaka" → To "Ndola"
3. Choose today's date
4. Click "Search Buses"
5. Click "Book Now" on any bus
6. Login with customer credentials
7. Fill booking details
8. Select seats from the seat map
9. Confirm booking
10. Save your booking reference!

### 2. Manage Fleet (Company)
1. Click "Company Login"
2. Login with company credentials
3. Go to "My Buses" tab
4. Click "+ Add Bus"
5. Fill bus details
6. Go to "Routes" tab
7. Click "+ Add Route"
8. Create a new route
9. View bookings in "Bookings" tab
10. **NEW:** Scroll to "Quick Actions" to see "Active Trips" and "GPS Devices"
11. **NEW:** Open "Seats & Pricing" for any route to block/reserve seats and set dynamic pricing

### 3. Test Live Tracking ✅ NEW
1. Login as company: `info@mazhindubuses.com` / `password123`
2. Go to "Active Trips" in Quick Actions
3. View live bus locations on map
4. See real-time GPS device status in "GPS Devices" card
5. Check location history for trips

### 4. Track by Booking Reference ✅ NEW
1. Login as customer and complete a booking
2. Go to "My Bookings"
3. Click "Track Bus" on an active booking
4. Verify status and map updates without re-entering booking reference

**Demo Data Included:**
- 3 GPS devices (one per demo bus)
- 3 active tracking trips
- Location history with coordinates from Lusaka, Ndola, Livingstone
- Notification logs for each trip

---

## Project Structure

```
zambia-bus-booking/
├── app/
│   ├── api/              # Backend APIs
│   ├── customer/         # Customer pages
│   ├── company/          # Company pages
│   └── lib/              # Utilities
├── Documentation/
│   ├── README.md         # Full documentation
│   ├── USER_GUIDE.md     # Detailed user guide
│   └── API_DOCUMENTATION.md
└── Configuration files
```

---

## Common Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Stop server
Ctrl + C
```

---

## Troubleshooting

### Port 3000 Already in Use?
```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
PORT=3001 npm run dev
```

### Database Issues?
```bash
# Delete and reinitialize
rm bus_booking.db
# Then visit http://localhost:3000/api/init
```

### Module Not Found?
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## Next Steps

📖 **Read Full Documentation:**
- `README.md` - Complete setup guide
- `USER_GUIDE.md` - Detailed usage instructions
- `API_DOCUMENTATION.md` - API reference

🚀 **Deploy to Production:**
- See `DEPLOYMENT_GUIDE.md`

💡 **Customize:**
- Modify cities in `app/page.tsx`
- Update colors in `tailwind.config.js`
- Add features as needed

---

## Features at a Glance

### For Customers ✅
- Search buses by route and date
- Real-time seat availability
- Book multiple seats
- Specify luggage count
- Choose boarding point
- View booking history

### For Companies ✅
- Register buses
- Create routes
- Set schedules and prices
- View all bookings
- Track seat availability
- Manage multiple buses

---

## Support

Need help?
1. Check `USER_GUIDE.md` for detailed instructions
2. See `README.md` for setup issues
3. Review `API_DOCUMENTATION.md` for technical details

---

## Success Checklist

- [ ] Dependencies installed
- [ ] Server running
- [ ] Database initialized
- [ ] Can access home page
- [ ] Can login as customer
- [ ] Can login as company
- [ ] Can search buses
- [ ] Can book ticket
- [ ] Can create route

---

**You're all set! Start exploring the application.** 🎉

**Live URL:** https://3000-af7d2996-61c0-41e0-8854-df7f6afd34d1.proxy.daytona.works