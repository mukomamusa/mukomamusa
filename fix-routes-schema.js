// fix-routes-schema.js
// One-time script to fix both routes and bookings table CHECK constraints
// Run: node fix-routes-schema.js

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(process.cwd(), 'bus_booking.db');

// Create a backup first
const backupPath = path.join(process.cwd(), 'bus_booking.db.backup-' + Date.now());
fs.copyFileSync(dbPath, backupPath);
console.log(`✅ Created backup at ${backupPath}\n`);

const db = new Database(dbPath);

console.log('🔧 Fixing database schema...\n');

try {
  // Disable foreign keys temporarily
  db.pragma('foreign_keys = OFF');
  
  // Get current data
  console.log('=== STEP 1: Export bookings data ===');
  const bookingsData = db.prepare('SELECT * FROM bookings').all();
  console.log(`  Found ${bookingsData.length} bookings to migrate`);
  
  // Drop old bookings table
  console.log('\n=== STEP 2: Recreate bookings table ===');
  db.exec('DROP TABLE IF EXISTS bookings');
  console.log('  ✓ Dropped old bookings table');
  
  // Create new bookings table with correct schema
  db.exec(`
    CREATE TABLE bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      route_id INTEGER NOT NULL,
      seat_numbers TEXT NOT NULL,
      num_seats INTEGER NOT NULL,
      luggage_count INTEGER DEFAULT 0,
      boarding_point TEXT NOT NULL,
      dropping_point TEXT,
      total_price REAL NOT NULL,
      booking_reference TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
      payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid', 'refunded', 'partial_refund')),
      booked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      confirmed_at DATETIME,
      cancelled_at DATETIME,
      cancellation_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      commission_rate REAL DEFAULT 0.075,
      commission_amount REAL DEFAULT 0,
      company_earnings REAL DEFAULT 0,
      refund_amount REAL DEFAULT 0,
      cancellation_fee REAL DEFAULT 0,
      refund_status TEXT DEFAULT NULL CHECK(refund_status IS NULL OR refund_status IN ('pending', 'processed', 'failed')),
      refund_processed_at DATETIME DEFAULT NULL,
      FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE
    )
  `);
  console.log('  ✓ Created new bookings table');
  
  // Re-insert bookings data
  if (bookingsData.length > 0) {
    const insertStmt = db.prepare(`
      INSERT INTO bookings (
        id, customer_id, route_id, seat_numbers, num_seats, luggage_count,
        boarding_point, dropping_point, total_price, booking_reference,
        status, payment_status, booked_at, confirmed_at, cancelled_at,
        cancellation_reason, created_at, commission_rate, commission_amount,
        company_earnings, refund_amount, cancellation_fee, refund_status,
        refund_processed_at
      ) VALUES (
        @id, @customer_id, @route_id, @seat_numbers, @num_seats, @luggage_count,
        @boarding_point, @dropping_point, @total_price, @booking_reference,
        @status, @payment_status, @booked_at, @confirmed_at, @cancelled_at,
        @cancellation_reason, @created_at, @commission_rate, @commission_amount,
        @company_earnings, @refund_amount, @cancellation_fee, @refund_status,
        @refund_processed_at
      )
    `);
    
    for (const booking of bookingsData) {
      insertStmt.run(booking);
    }
    console.log(`  ✓ Migrated ${bookingsData.length} bookings`);
  }
  
  // Now fix routes table
  console.log('\n=== STEP 3: Export routes data ===');
  const routesData = db.prepare('SELECT * FROM routes').all();
  console.log(`  Found ${routesData.length} routes to migrate`);
  
  console.log('\n=== STEP 4: Recreate routes table ===');
  db.exec('DROP TABLE IF EXISTS routes');
  console.log('  ✓ Dropped old routes table');
  
  db.exec(`
    CREATE TABLE routes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bus_id INTEGER NOT NULL,
      driver_id INTEGER,
      origin TEXT NOT NULL,
      destination TEXT NOT NULL,
      departure_time TEXT NOT NULL,
      arrival_time TEXT NOT NULL,
      price REAL NOT NULL,
      date TEXT NOT NULL,
      intermediate_stops TEXT,
      available_seats INTEGER NOT NULL,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'scheduled', 'cancelled', 'completed', 'departed', 'delayed')),
      cancellation_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE,
      FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL
    )
  `);
  console.log('  ✓ Created new routes table');
  
  // Re-insert routes data
  if (routesData.length > 0) {
    const insertRouteStmt = db.prepare(`
      INSERT INTO routes (
        id, bus_id, driver_id, origin, destination, departure_time, arrival_time,
        price, date, intermediate_stops, available_seats, status, cancellation_reason, created_at
      ) VALUES (
        @id, @bus_id, @driver_id, @origin, @destination, @departure_time, @arrival_time,
        @price, @date, @intermediate_stops, @available_seats, @status, @cancellation_reason, @created_at
      )
    `);
    
    for (const route of routesData) {
      // Normalize status to valid value
      if (!['active', 'inactive', 'scheduled', 'cancelled', 'completed', 'departed', 'delayed'].includes(route.status)) {
        route.status = 'active';
      }
      insertRouteStmt.run(route);
    }
    console.log(`  ✓ Migrated ${routesData.length} routes`);
  }
  
  // Re-enable foreign keys
  db.pragma('foreign_keys = ON');
  
  console.log('\n🎉 All migrations complete!\n');
  
  // Verify
  console.log('=== VERIFICATION ===');
  const newRoutes = db.prepare(
    "SELECT sql FROM sqlite_master WHERE type='table' AND name='routes'"
  ).get();
  console.log('Routes status CHECK:', newRoutes.sql.includes("'inactive'") ? '✅ includes inactive' : '❌ missing inactive');
  
  const newBookings = db.prepare(
    "SELECT sql FROM sqlite_master WHERE type='table' AND name='bookings'"
  ).get();
  console.log('Bookings refund_status CHECK:', !newBookings.sql.includes('"pending"') ? '✅ uses single quotes' : '❌ still has double quotes');

  console.log(`\nBackup saved at: ${backupPath}`);
  console.log('You can delete it once you verify everything works.');
  
} catch (error) {
  console.error('\n❌ Migration failed:', error.message);
  console.log(`\nRestore from backup: copy "${backupPath}" to "${dbPath}"`);
  process.exit(1);
} finally {
  db.close();
}
