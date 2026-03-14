import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'bus_booking.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Run essential migrations on module load (for existing databases)
function runMigrations() {
  // Commission columns for bookings
  try { db.exec(`ALTER TABLE bookings ADD COLUMN commission_rate REAL DEFAULT 0.075`); } catch (e) { /* exists */ }
  try { db.exec(`ALTER TABLE bookings ADD COLUMN commission_amount REAL DEFAULT 0`); } catch (e) { /* exists */ }
  try { db.exec(`ALTER TABLE bookings ADD COLUMN company_earnings REAL DEFAULT 0`); } catch (e) { /* exists */ }
  
  // Subscription columns for buses
  try { db.exec(`ALTER TABLE buses ADD COLUMN subscription_status TEXT DEFAULT 'trial'`); } catch (e) { /* exists */ }
  try { db.exec(`ALTER TABLE buses ADD COLUMN subscription_start_date DATETIME`); } catch (e) { /* exists */ }
  try { db.exec(`ALTER TABLE buses ADD COLUMN subscription_end_date DATETIME`); } catch (e) { /* exists */ }
  try { db.exec(`ALTER TABLE buses ADD COLUMN trial_end_date DATETIME`); } catch (e) { /* exists */ }
  
  // Two-factor authentication columns
  try { db.exec(`ALTER TABLE users ADD COLUMN two_factor_enabled INTEGER DEFAULT 0`); } catch (e) { /* exists */ }
  try { db.exec(`ALTER TABLE users ADD COLUMN two_factor_secret TEXT`); } catch (e) { /* exists */ }
  
  // Password reset columns
  try { db.exec(`ALTER TABLE users ADD COLUMN password_reset_token TEXT`); } catch (e) { /* exists */ }
  try { db.exec(`ALTER TABLE users ADD COLUMN password_reset_expires DATETIME`); } catch (e) { /* exists */ }
  
  // Google OAuth columns
  try { db.exec(`ALTER TABLE users ADD COLUMN google_id TEXT`); } catch (e) { /* exists */ }
  try { db.exec(`ALTER TABLE users ADD COLUMN auth_provider TEXT DEFAULT 'local'`); } catch (e) { /* exists */ }
  
  // Platform settings table
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS platform_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        setting_key TEXT UNIQUE NOT NULL,
        setting_value TEXT NOT NULL,
        description TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    db.exec(`INSERT OR IGNORE INTO platform_settings (setting_key, setting_value, description) VALUES ('commission_rate', '0.075', 'Platform commission rate (7.5%)')`);
    db.exec(`INSERT OR IGNORE INTO platform_settings (setting_key, setting_value, description) VALUES ('subscription_price_per_bus', '500', 'Monthly subscription price per bus in ZMW')`);
    db.exec(`INSERT OR IGNORE INTO platform_settings (setting_key, setting_value, description) VALUES ('subscription_trial_days', '14', 'Free trial period in days for new buses')`);
  } catch (e) { /* exists */ }
  
  // Bus subscriptions table
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS bus_subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bus_id INTEGER NOT NULL,
        company_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        currency TEXT DEFAULT 'ZMW',
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        payment_method TEXT,
        transaction_id TEXT,
        status TEXT DEFAULT 'pending',
        paid_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (e) { /* exists */ }

  // Expand routes status constraint to include inactive/scheduled
  try {
    const routesTable = db.prepare(
      "SELECT sql FROM sqlite_master WHERE type='table' AND name='routes'"
    ).get() as { sql?: string } | undefined;

    if (routesTable?.sql && !routesTable.sql.includes("'inactive'")) {
      db.exec('BEGIN');
      db.exec('ALTER TABLE routes RENAME TO routes_old');
      db.exec(`
        CREATE TABLE IF NOT EXISTS routes (
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
      db.exec(`
        INSERT INTO routes (
          id, bus_id, driver_id, origin, destination, departure_time, arrival_time,
          price, date, intermediate_stops, available_seats, status, cancellation_reason, created_at
        )
        SELECT
          id, bus_id, driver_id, origin, destination, departure_time, arrival_time,
          price, date, intermediate_stops, available_seats, status, cancellation_reason, created_at
        FROM routes_old
      `);
      db.exec('DROP TABLE routes_old');
      db.exec('COMMIT');
    }
  } catch (e) {
    try { db.exec('ROLLBACK'); } catch (rollbackError) { /* ignore */ }
  }
}

// Run migrations immediately when module loads
try { runMigrations(); } catch (e) { console.log('Migration note:', e); }

// Initialize database tables
export function initDatabase() {
  // ==========================================
  // USERS TABLE - Improved with proper fields
  // ==========================================
  // Stores all users: customers, companies, and admins
  // Note: For larger scale, consider separating into customers + companies tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      user_type TEXT NOT NULL CHECK(user_type IN ('customer', 'company', 'admin')),
      
      -- Customer-specific fields
      nrc_number TEXT,                    -- National Registration Card (Zambian ID)
      date_of_birth TEXT,
      gender TEXT CHECK(gender IN ('male', 'female', 'other')),
      address TEXT,
      emergency_contact_name TEXT,
      emergency_contact_phone TEXT,
      
      -- Company-specific fields
      company_name TEXT,
      license_number TEXT,                -- RTSA License
      company_registration_number TEXT,   -- PACRA Registration
      company_address TEXT,
      company_logo_url TEXT,
      
      -- Account status
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'suspended', 'pending_verification')),
      email_verified INTEGER DEFAULT 0,
      phone_verified INTEGER DEFAULT 0,
      
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ==========================================
  // DRIVERS TABLE - New
  // ==========================================
  // Stores driver information for bus companies
  db.exec(`
    CREATE TABLE IF NOT EXISTS drivers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      license_number TEXT NOT NULL,
      license_type TEXT NOT NULL,         -- e.g., PSV (Public Service Vehicle)
      license_expiry TEXT NOT NULL,
      nrc_number TEXT NOT NULL,
      date_of_birth TEXT,
      address TEXT,
      photo_url TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'suspended')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // ==========================================
  // BUSES TABLE - Enhanced with Subscriptions
  // ==========================================
  db.exec(`
    CREATE TABLE IF NOT EXISTS buses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL,
      bus_number TEXT NOT NULL,           -- Registration plate
      bus_name TEXT NOT NULL,             -- Fleet name/identifier
      total_seats INTEGER NOT NULL,
      bus_type TEXT NOT NULL,             -- Standard, Luxury, Semi-Luxury
      amenities TEXT,                     -- JSON array
      seat_layout TEXT,                   -- JSON: rows, columns, aisle position
      insurance_expiry TEXT,
      fitness_expiry TEXT,                -- RTSA fitness certificate
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'maintenance', 'retired')),
      -- Subscription fields
      subscription_status TEXT DEFAULT 'trial' CHECK(subscription_status IN ('trial', 'active', 'expired', 'suspended')),
      subscription_start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      subscription_end_date DATETIME,
      trial_end_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Add subscription columns if they don't exist (for existing databases)
  try {
    db.exec(`ALTER TABLE buses ADD COLUMN subscription_status TEXT DEFAULT 'trial'`);
  } catch (e) { /* Column already exists */ }
  try {
    db.exec(`ALTER TABLE buses ADD COLUMN subscription_start_date DATETIME DEFAULT CURRENT_TIMESTAMP`);
  } catch (e) { /* Column already exists */ }
  try {
    db.exec(`ALTER TABLE buses ADD COLUMN subscription_end_date DATETIME`);
  } catch (e) { /* Column already exists */ }
  try {
    db.exec(`ALTER TABLE buses ADD COLUMN trial_end_date DATETIME`);
  } catch (e) { /* Column already exists */ }

  // ==========================================
  // BUS_SUBSCRIPTIONS TABLE - Payment History
  // ==========================================
  db.exec(`
    CREATE TABLE IF NOT EXISTS bus_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bus_id INTEGER NOT NULL,
      company_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'ZMW',
      period_start DATE NOT NULL,
      period_end DATE NOT NULL,
      payment_method TEXT,
      transaction_id TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'failed', 'refunded')),
      paid_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE,
      FOREIGN KEY (company_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Add subscription settings
  db.exec(`
    INSERT OR IGNORE INTO platform_settings (setting_key, setting_value, description)
    VALUES 
      ('subscription_price_per_bus', '500', 'Monthly subscription price per bus in ZMW'),
      ('subscription_trial_days', '14', 'Free trial period in days for new buses')
  `);

  // ==========================================
  // ROUTES TABLE - Enhanced (now called TRIPS)
  // ==========================================
  db.exec(`
    CREATE TABLE IF NOT EXISTS routes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bus_id INTEGER NOT NULL,
      driver_id INTEGER,                  -- Assigned driver (optional)
      origin TEXT NOT NULL,
      destination TEXT NOT NULL,
      departure_time TEXT NOT NULL,
      arrival_time TEXT NOT NULL,
      price REAL NOT NULL,
      date TEXT NOT NULL,
      intermediate_stops TEXT,            -- JSON array with stop names and times
      available_seats INTEGER NOT NULL,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'scheduled', 'cancelled', 'completed', 'departed', 'delayed')),
      cancellation_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE,
      FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL
    )
  `);

  // ==========================================
  // BOOKINGS TABLE - Enhanced
  // ==========================================
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      route_id INTEGER NOT NULL,
      seat_numbers TEXT NOT NULL,         -- Comma-separated seat numbers
      num_seats INTEGER NOT NULL,
      luggage_count INTEGER DEFAULT 0,
      boarding_point TEXT NOT NULL,
      dropping_point TEXT,                -- New: where passenger alights
      total_price REAL NOT NULL,
      commission_rate REAL DEFAULT 0.075, -- Platform commission rate (7.5%)
      commission_amount REAL DEFAULT 0,   -- Calculated commission amount
      company_earnings REAL DEFAULT 0,    -- Amount after commission
      booking_reference TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
      payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid', 'refunded', 'partial_refund')),
      booked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      confirmed_at DATETIME,
      cancelled_at DATETIME,
      cancellation_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE
    )
  `);

  // Add commission columns if they don't exist (for existing databases)
  try {
    db.exec(`ALTER TABLE bookings ADD COLUMN commission_rate REAL DEFAULT 0.075`);
  } catch (e) { /* Column already exists */ }
  try {
    db.exec(`ALTER TABLE bookings ADD COLUMN commission_amount REAL DEFAULT 0`);
  } catch (e) { /* Column already exists */ }
  try {
    db.exec(`ALTER TABLE bookings ADD COLUMN company_earnings REAL DEFAULT 0`);
  } catch (e) { /* Column already exists */ }

  // ==========================================
  // PLATFORM_SETTINGS TABLE - New
  // ==========================================
  db.exec(`
    CREATE TABLE IF NOT EXISTS platform_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      setting_key TEXT UNIQUE NOT NULL,
      setting_value TEXT NOT NULL,
      description TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert default commission rate if not exists
  db.exec(`
    INSERT OR IGNORE INTO platform_settings (setting_key, setting_value, description)
    VALUES ('commission_rate', '0.075', 'Platform commission rate (7.5%)')
  `);

  // ==========================================
  // PASSENGERS TABLE - New
  // ==========================================
  // Stores individual passenger details for each booking
  db.exec(`
    CREATE TABLE IF NOT EXISTS passengers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      nrc_or_passport TEXT,               -- ID document number
      id_type TEXT CHECK(id_type IN ('nrc', 'passport', 'drivers_license', 'other')),
      phone TEXT,
      email TEXT,
      date_of_birth TEXT,
      passenger_type TEXT DEFAULT 'adult' CHECK(passenger_type IN ('adult', 'child', 'infant', 'senior')),
      seat_number INTEGER NOT NULL,
      special_needs TEXT,                 -- Wheelchair, etc.
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
    )
  `);

  // ==========================================
  // TICKETS TABLE - New
  // ==========================================
  // Individual tickets per seat/passenger
  db.exec(`
    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL,
      passenger_id INTEGER NOT NULL,
      ticket_number TEXT UNIQUE NOT NULL,
      qr_code TEXT,                       -- Unique QR code for scanning
      seat_number INTEGER NOT NULL,
      status TEXT DEFAULT 'valid' CHECK(status IN ('valid', 'used', 'cancelled', 'expired')),
      boarding_status TEXT DEFAULT 'not_boarded' CHECK(boarding_status IN ('not_boarded', 'boarded', 'missed')),
      boarded_at DATETIME,
      issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
      FOREIGN KEY (passenger_id) REFERENCES passengers(id) ON DELETE CASCADE
    )
  `);

  // ==========================================
  // PAYMENTS TABLE - New
  // ==========================================
  db.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'ZMW',        -- Zambian Kwacha
      payment_method TEXT NOT NULL CHECK(payment_method IN ('mobile_money', 'bank_transfer', 'card', 'cash', 'wallet')),
      provider TEXT,                      -- MTN, Airtel, Zamtel, Visa, etc.
      transaction_id TEXT,                -- External reference from payment provider
      phone_number TEXT,                  -- For mobile money
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
      paid_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ==========================================
  // REFUNDS TABLE - New
  // ==========================================
  db.exec(`
    CREATE TABLE IF NOT EXISTS refunds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL,
      payment_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      reason TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'processed', 'rejected')),
      processed_by INTEGER,               -- Admin who processed
      refund_method TEXT,                 -- Same as payment or different
      transaction_id TEXT,
      requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      processed_at DATETIME,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
      FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
      FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // ==========================================
  // TRIP_MANIFESTS TABLE - New
  // ==========================================
  // Passenger list for each trip (for drivers/conductors)
  db.exec(`
    CREATE TABLE IF NOT EXISTS trip_manifests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      route_id INTEGER NOT NULL,
      generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      total_passengers INTEGER DEFAULT 0,
      total_boarded INTEGER DEFAULT 0,
      notes TEXT,
      FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE
    )
  `);

  // ==========================================
  // NOTIFICATIONS TABLE - New
  // ==========================================
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('booking_confirmed', 'booking_cancelled', 'payment_received', 'trip_reminder', 'trip_delayed', 'trip_cancelled', 'refund_processed')),
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      read INTEGER DEFAULT 0,
      sent_via TEXT DEFAULT 'app' CHECK(sent_via IN ('app', 'sms', 'email', 'push')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_route ON bookings(route_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_reference ON bookings(booking_reference);
    CREATE INDEX IF NOT EXISTS idx_routes_date ON routes(date);
    CREATE INDEX IF NOT EXISTS idx_routes_origin_dest ON routes(origin, destination);
    CREATE INDEX IF NOT EXISTS idx_passengers_booking ON passengers(booking_id);
    CREATE INDEX IF NOT EXISTS idx_tickets_booking ON tickets(booking_id);
    CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
  `);

  console.log('Database initialized successfully with enhanced schema');

  // ==========================================
  // REAL-TIME TRACKING TABLES (from city-to-city-zambia)
  // ==========================================
  
  // GPS Devices table — links physical GPS tracker to a bus
  // Supports multiple providers: Ctrack, Tramigo, Ruptela, Teltonika, custom API, driver app
  db.exec(`
    CREATE TABLE IF NOT EXISTS gps_devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bus_id INTEGER NOT NULL,
      device_imei TEXT UNIQUE,
      device_serial TEXT,
      provider TEXT NOT NULL CHECK(provider IN ('ctrack', 'tramigo', 'ruptela', 'teltonika', 'custom_api', 'driver_app')),
      provider_device_id TEXT,
      sim_number TEXT,
      sim_provider TEXT CHECK(sim_provider IN ('airtel', 'mtn', 'zamtel', NULL)),
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'maintenance', 'offline')),
      last_seen_at DATETIME,
      firmware_version TEXT,
      installed_at DATETIME,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE
    )
  `);

  // Trips table — represents an active journey from origin to destination
  // A trip is created when a bus starts a scheduled route
  db.exec(`
    CREATE TABLE IF NOT EXISTS trips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      route_id INTEGER NOT NULL,
      bus_id INTEGER NOT NULL,
      gps_device_id INTEGER,
      driver_name TEXT,
      driver_phone TEXT,
      status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'boarding', 'in_transit', 'delayed', 'arrived', 'completed', 'cancelled')),
      scheduled_departure DATETIME NOT NULL,
      scheduled_arrival DATETIME NOT NULL,
      actual_departure DATETIME,
      actual_arrival DATETIME,
      current_latitude REAL,
      current_longitude REAL,
      current_speed REAL DEFAULT 0,
      current_heading REAL,
      current_eta DATETIME,
      last_location_update DATETIME,
      delay_minutes INTEGER DEFAULT 0,
      delay_reason TEXT,
      distance_covered_km REAL DEFAULT 0,
      total_distance_km REAL,
      next_stop TEXT,
      next_stop_eta DATETIME,
      passenger_count INTEGER DEFAULT 0,
      started_by INTEGER,
      ended_by INTEGER,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (route_id) REFERENCES routes(id),
      FOREIGN KEY (bus_id) REFERENCES buses(id),
      FOREIGN KEY (gps_device_id) REFERENCES gps_devices(id),
      FOREIGN KEY (started_by) REFERENCES users(id),
      FOREIGN KEY (ended_by) REFERENCES users(id)
    )
  `);

  // Bus Locations table — stores GPS location history
  // Each row is a single GPS ping from the device/provider
  db.exec(`
    CREATE TABLE IF NOT EXISTS bus_locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL,
      bus_id INTEGER NOT NULL,
      gps_device_id INTEGER,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      altitude REAL,
      speed REAL DEFAULT 0,
      heading REAL,
      accuracy REAL,
      source TEXT DEFAULT 'gps' CHECK(source IN ('gps', 'cell_tower', 'wifi', 'manual', 'interpolated')),
      provider TEXT,
      satellites_used INTEGER,
      hdop REAL,
      ignition_on BOOLEAN,
      fuel_level REAL,
      odometer REAL,
      raw_data TEXT,
      recorded_at DATETIME NOT NULL,
      received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
      FOREIGN KEY (bus_id) REFERENCES buses(id),
      FOREIGN KEY (gps_device_id) REFERENCES gps_devices(id)
    )
  `);

  // Notification Preferences table — per-user channel preferences
  db.exec(`
    CREATE TABLE IF NOT EXISTS notification_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      channel_sms BOOLEAN DEFAULT 1,
      channel_push BOOLEAN DEFAULT 1,
      channel_whatsapp BOOLEAN DEFAULT 0,
      channel_email BOOLEAN DEFAULT 0,
      notify_departure BOOLEAN DEFAULT 1,
      notify_delay BOOLEAN DEFAULT 1,
      notify_approaching BOOLEAN DEFAULT 1,
      notify_arrived BOOLEAN DEFAULT 1,
      notify_eta_change BOOLEAN DEFAULT 1,
      sms_phone TEXT,
      whatsapp_phone TEXT,
      preferred_language TEXT DEFAULT 'en' CHECK(preferred_language IN ('en', 'bem', 'nya', 'ton', 'loz')),
      quiet_hours_start TEXT,
      quiet_hours_end TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id)
    )
  `);

  // Notification Log table — records every notification sent
  db.exec(`
    CREATE TABLE IF NOT EXISTS notification_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER,
      booking_id INTEGER,
      user_id INTEGER NOT NULL,
      channel TEXT NOT NULL CHECK(channel IN ('sms', 'push', 'whatsapp', 'email', 'in_app', 'ussd')),
      event_type TEXT NOT NULL CHECK(event_type IN (
        'trip_started', 'departure_reminder', 'boarding_open',
        'bus_departed', 'delay_alert', 'eta_update',
        'approaching_destination', 'arrived', 'trip_completed',
        'trip_cancelled', 'schedule_change', 'general'
      )),
      recipient TEXT NOT NULL,
      subject TEXT,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
      provider TEXT,
      provider_message_id TEXT,
      cost REAL DEFAULT 0,
      currency TEXT DEFAULT 'ZMW',
      error_message TEXT,
      retry_count INTEGER DEFAULT 0,
      sent_at DATETIME,
      delivered_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (trip_id) REFERENCES trips(id),
      FOREIGN KEY (booking_id) REFERENCES bookings(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Geofence Zones table — defines trigger zones for notifications
  // e.g., bus stations, city boundaries, rest stops
  db.exec(`
    CREATE TABLE IF NOT EXISTS geofence_zones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      zone_type TEXT NOT NULL CHECK(zone_type IN ('bus_station', 'city_boundary', 'rest_stop', 'checkpoint', 'custom')),
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      radius_meters REAL NOT NULL DEFAULT 500,
      city TEXT,
      province TEXT,
      is_active BOOLEAN DEFAULT 1,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create tracking-related indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_gps_devices_bus ON gps_devices(bus_id);
    CREATE INDEX IF NOT EXISTS idx_gps_devices_provider ON gps_devices(provider);
    CREATE INDEX IF NOT EXISTS idx_trips_bus ON trips(bus_id);
    CREATE INDEX IF NOT EXISTS idx_trips_route ON trips(route_id);
    CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
    CREATE INDEX IF NOT EXISTS idx_bus_locations_trip ON bus_locations(trip_id);
    CREATE INDEX IF NOT EXISTS idx_bus_locations_bus ON bus_locations(bus_id);
    CREATE INDEX IF NOT EXISTS idx_bus_locations_recorded ON bus_locations(recorded_at);
    CREATE INDEX IF NOT EXISTS idx_notification_log_trip ON notification_log(trip_id);
    CREATE INDEX IF NOT EXISTS idx_notification_log_user ON notification_log(user_id);

  // Auto-initialize all tables (including tracking tables) when module first loads
  try { initDatabase(); } catch (e) { console.log('DB init note:', e); }
  `);
}

export default db;