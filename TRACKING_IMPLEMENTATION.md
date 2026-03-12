# Real-Time GPS Tracking Implementation - VayaZed Bus System

## Overview

VayaZed now includes comprehensive **real-time GPS tracking** for buses, enabling customers to track their buses live, companies to monitor their fleet, and drivers to record location data.

**Status**: ✅ **IMPLEMENTED (March 12, 2026)**

---

## Features Implemented

### 1. Dashboard Integration

#### Company Dashboard (Bus Company View)
- **New "Quick Actions" Cards**:
  - ✅ "Active Trips" → `/customer/track` (view all active trips on map)
  - ✅ "GPS Devices" → `/api/tracking/devices` (manage GPS device status)

#### Customer Tracking Page
- ✅ **"Track Your Bus Live" Banner** on customer dashboard
- ✅ Links to `/customer/track` for real-time bus tracking

#### Driver Tracking Page
- ✅ **"Share Location" Card** on driver dashboard
- ✅ Links to `/driver/tracking` for sharing live location

### 2. Database Tables

All tracking-related tables are auto-created via `seed-database.js`:

| Table | Purpose | Demo Data |
|-------|---------|-----------|
| `gps_devices` | Links physical GPS trackers to buses | 3 devices (Ctrack) |
| `trips` | Active and historical trips | 3 in-transit trips |
| `bus_locations` | GPS location history | 6 location updates |
| `notification_log` | Notification event history | 3 trip events |
| `notification_preferences` | User notification settings | Created per user |
| `geofence_zones` | Location-based triggers | (schema only, not seeded) |

### 3. API Endpoints

#### Authentication-First Security
All tracking endpoints enforce **proper HTTP semantics**:
- **401 Unauthorized** - Missing/invalid authentication
- **400 Bad Request** - Missing/invalid parameters
- **404 Not Found** - Resource not found

**Implemented Endpoints:**

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/api/tracking/devices` | List company's GPS devices | Company |
| GET | `/api/tracking/bus?bus_id=X` | Get current bus location & trip | User |
| GET | `/api/tracking/history?trip_id=X` | Get location history for trip | User |
| POST | `/api/tracking/trip/start` | Start trip tracking | Driver |
| POST | `/api/tracking/trip/end` | End trip tracking | Driver |
| POST | `/api/tracking/location` | Submit GPS location update | Driver/Device |
| POST | `/api/notifications/test-sms` | Test SMS notifications | Admin |

### 4. Demo Data Seeding

Run `npm run seed` to include:

```
✅ Tracking demo seeded for 3 buses (max 3)

📊 Summary:
   Users: 9
   Drivers: 24
   Buses: 24
   GPS Devices: 3 ← Demo devices created
   Tracking Trips: 3 ← Demo trips created
   Bus Locations: 6 ← Demo location pings
   Notification Logs: 3 ← Demo notification events
```

**Demo Trip Routes:**
1. Lusaka → Kitwe (6:30 AM departure)
2. Ndola → Lusaka (7:00 AM departure)
3. Livingstone → Lusaka (5:45 AM departure)

**Demo Locations:** Realistic coordinates for each route showing bus movement progression.

---

## Technical Implementation Details

### Database Schema (Auto-Created)

#### gps_devices Table
```sql
CREATE TABLE gps_devices (
  id INTEGER PRIMARY KEY,
  company_id INTEGER,
  bus_id INTEGER (UNIQUE per provider),
  device_imei TEXT (UNIQUE),
  device_serial TEXT,
  provider TEXT CHECK (ctrack|tramigo|ruptela|teltonika|custom_api|driver_app),
  status TEXT DEFAULT 'active' CHECK (active|inactive|maintenance|offline),
  last_heartbeat DATETIME,
  ...
);
```

**Providers Supported:**
- ✅ Ctrack (primary - used in demo)
- Tramigo
- Ruptela
- Teltonika
- Custom API
- Driver App (mobile app location sharing)

#### trips Table
```sql
CREATE TABLE trips (
  id INTEGER PRIMARY KEY,
  route_id INTEGER (linked to routes),
  bus_id INTEGER,
  driver_id INTEGER,
  gps_device_id INTEGER,
  status TEXT CHECK (scheduled|boarding|in_transit|delayed|arrived|completed|cancelled),
  scheduled_departure DATETIME,
  actual_departure DATETIME,
  estimated_arrival DATETIME,
  actual_arrival DATETIME,
  current_latitude REAL,
  current_longitude REAL,
  current_speed REAL,
  heading REAL,
  delay_minutes INTEGER,
  distance_covered_km REAL,
  distance_remaining_km REAL,
  progress_percentage REAL,
  weather_conditions TEXT,
  traffic_conditions TEXT,
  geofence_status TEXT,
  ...
);
```

**Trip Statuses:**
- `scheduled` - Announced, not yet started
- `boarding` - Passengers boarding
- `in_transit` - En route
- `delayed` - Behind schedule
- `arrived` - Reached destination
- `completed` - Trip finished
- `cancelled` - Trip cancelled

#### bus_locations Table
```sql
CREATE TABLE bus_locations (
  id INTEGER PRIMARY KEY,
  trip_id INTEGER,
  bus_id INTEGER,
  gps_device_id INTEGER,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  speed REAL DEFAULT 0,
  heading REAL,
  altitude REAL,
  accuracy REAL,
  battery_level REAL,
  signal_strength REAL,
  timestamp DATETIME NOT NULL,
  location_source TEXT CHECK (gps|cell_tower|wifi|manual),
  ...
);
```

This stores **every GPS ping** from devices, creating a history of bus movement.

### API Routes (Next.js)

```
app/api/tracking/
├── bus/route.ts            ← Get current bus location
├── devices/route.ts        ← List company GPS devices
├── history/route.ts        ← Get trip location history
├── location/route.ts       ← Submit GPS update
└── trip/
    ├── start/route.ts      ← Start tracking
    └── end/route.ts        ← End tracking
```

All endpoints include:
- ✅ JWT token validation
- ✅ Proper HTTP status codes (401, 400, 404)
- ✅ Role-based access control (company, driver, customer, admin)
- ✅ Resource ownership verification
- ✅ Error logging and messages

### Environment Variables

In `.env.local`:

```bash
# GPS Webhook security
GPS_WEBHOOK_SECRET=your-secret-key

# GPS Provider: Ctrack
CTRACK_API_KEY=your-api-key
CTRACK_BASE_URL=https://api.ctrack.co.za/v1

# Notifications: SMS via Africa's Talking
AT_USERNAME=sandbox
AT_API_KEY=your-api-key
AT_SENDER_ID=VayaZed
AT_BASE_URL=https://api.sandbox.africastalking.com/version1/messaging

# Push Notifications: Firebase
FCM_SERVER_KEY=your-firebase-key

# WhatsApp (optional)
WHATSAPP_API_TOKEN=your-token
```

---

## Database Management Scripts

### Available Commands

```bash
# Full seeding (includes tracking demo)
npm run seed

# Schema initialization only
npm run db:init

# Verify all tables exist
npm run db:verify

# Backup → Wipe → Reinit → Verify
npm run db:reset
```

### Script Files

- `scripts/db-init.js` - Creates all tables using SQLite CLI
- `scripts/db-verify.js` - Validates table existence
- `scripts/db-reset.js` - Safe database reset with backup
- `seed-database.js` - Inserts demo data + tracking demo

---

## Testing the Tracking Feature

### 1. Verify Demo Data

```bash
npm run seed
sqlite3 bus_booking.db "SELECT COUNT(*) as gps_devices FROM gps_devices;"
sqlite3 bus_booking.db "SELECT COUNT(*) as trips FROM trips;"
sqlite3 bus_booking.db "SELECT COUNT(*) as locations FROM bus_locations;"
```

Expected output:
```
3
3
6
```

### 2. Test API Endpoints

Start dev server:
```bash
npm run dev
```

#### Test unauthenticated request (should return 401):
```bash
curl -X GET "http://localhost:3000/api/tracking/bus?bus_id=1"
```

#### Test with auth token:
```bash
# 1. Login as company
curl -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"info@mazhindubuses.com","password":"password123"}'

# Extract token from response
TOKEN="eyJhbGci..."

# 2. Get GPS devices
curl -X GET "http://localhost:3000/api/tracking/devices" \
  -H "Authorization: Bearer $TOKEN"

# 3. Get current bus location
curl -X GET "http://localhost:3000/api/tracking/bus?bus_id=1" \
  -H "Authorization: Bearer $TOKEN"

# 4. Get location history
curl -X GET "http://localhost:3000/api/tracking/history?trip_id=1" \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Dashboard Testing

1. **Customer View:**
   - Login: `customer@example.com` / `password123`
   - Look for "Track Your Bus Live" banner
   - Click to view tracking page

2. **Company View:**
   - Login: `info@mazhindubuses.com` / `password123`
   - Scroll to "Quick Actions"
   - Click "Active Trips" → See trip map
   - Click "GPS Devices" → See device status

3. **Driver View:**
   - Login: driver (if available)
   - Look for "Share Location" card
   - Start sharing location

---

## Architecture Decisions

### 1. **Table Split: `trips` vs `routes`**
- `routes`: Static schedule template (fixed departure/arrival times)
- `trips`: Live instance of a route (captured actual times, real-time data)
- **Benefit**: One route can spawn multiple trip instances on different days; tracking data only attached to trips

### 2. **Location Warehouse Pattern**
- `bus_locations` stores every GPS ping (memory-efficient via SQLite)
- Creates complete history for analysis/replay
- **Benefit**: Can answer "where was bus X at time T?" exactly

### 3. **Modular GPS Providers**
- Schema supports multiple tracker types (Ctrack, Tramigo, etc.) simultaneously
- One bus can have multiple devices for redundancy
- **Benefit**: Easy to add/switch providers without DB migration

### 4. **Status-Based Access Control**
- Trip status (`scheduled`, `in_transit`, `completed`) gates visibility
- Only active trips show live locations to customers
- **Benefit**: Prevents data leaks for completed journeys

### 5. **Notification Log Decoupling**
- All notifications logged to `notification_log` (SMS, push, email, in-app, WhatsApp)
- Separate from `notifications` table (for in-app alerts)
- **Benefit**: Complete audit trail; can retry failed deliveries

---

## Security Considerations

### 1. **Authentication**
- ✅ All endpoints require valid JWT
- ✅ Endpoints return 401 if missing/invalid auth
- ✅ Tracked demo data uses proper error semantics

### 2. **Authorization**
- ✅ Companies only see their own buses' tracking
- ✅ Customers only see buses they've booked on
- ✅ Drivers only modify trips they're assigned to
- ✅ Admins can access all data

### 3. **Data Validation**
- ✅ Coordinates validated for Zambia bounding box
- ✅ Timestamps validated (no future times)
- ✅ No SQL injection (parameterized queries via better-sqlite3)

### 4. **Webhook Security**
- `GPS_WEBHOOK_SECRET` protects incoming location updates from GPS providers
- Must be verified before processing device locations

---

## Future Enhancements

### Planned Features
1. **Geofence Alerts**: Notify on entry/exit of defined zones (bus stations, checkpoints)
2. **Route Analytics**: Historical heatmaps of busy vs quiet routes
3. **Driver Behavior**: Speed violations, harsh braking detection
4. **Estimated Time of Arrival (ETA)**: Dynamic calculation based on traffic
5. **Mobile App**: Native iOS/Android with background location tracking
6. **Real-Time Dashboard**: WebSocket updates for live tracking map
7. **Reporting**: Generate trip reports, fuel consumption estimates

### Provider Integration Roadmap
- [ ] Tramigo integration
- [ ] Ruptela integration  
- [ ] Teltonika integration
- [ ] Custom webhook receiver framework

---

## Troubleshooting

### 500 Errors on Tracking Endpoints
- **Cause**: `better-sqlite3` native module mismatch
- **Fix**: `npm rebuild better-sqlite3`

### No GPS Devices/Trips After Seed
- **Cause**: Seed script didn't complete successfully
- **Check**: `npm run db:verify` to confirm tables exist
- **Retry**: `npm run db:reset` then `npm run seed`

### Locations Not Recording
- **Check**: Device is in `active` status
- **Check**: Trip is in `in_transit` status
- **Check**: `GPS_WEBHOOK_SECRET` matches incoming webhooks

### Auth Returning 400 Instead of 401
- **Old behavior** (fixed): Combined auth+param check returned 400
- **New behavior**: Auth check returns 401 first, then param validation

---

## Files Modified/Created (March 12, 2026)

### Created
- `scripts/db-reset.js` - Safe database reset script
- `/tmp/e2e-tracking-test.js` - Ephemeral E2E test suite
- `TRACKING_IMPLEMENTATION.md` - This file

### Modified
- `seed-database.js` - Added tracking demo data (3 devices, 3 trips, 6 locations)
- `app/api/tracking/bus/route.ts` - Fixed auth check order (401 before 400)
- `app/api/tracking/history/route.ts` - Fixed auth check order (401 before 400)
- `app/driver/dashboard/page.tsx` - Added "Share Location" quick action
- `app/customer/dashboard/page.tsx` - Added "Track Your Bus Live" banner
- `app/company/enhanced-dashboard/page.tsx` - Added "Active Trips" and "GPS Devices" cards
- `.env.local` - Added GPS, FCM, Ctrack, WhatsApp environment variables
- `package.json` - Added `db:reset` script

### Documentation Updated
- `README.md` - Added tracking features to feature list
- `QUICK_START.md` - Added .env setup, tracking demo explanation
- `API_DOCUMENTATION.md` - Added comprehensive tracking endpoint reference

---

## Contact & Support

For issues or questions about the tracking implementation, refer to:
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - Full endpoint reference
- [QUICK_START.md](QUICK_START.md) - Getting started with tracking
- `.env.example` - Environment variable reference
