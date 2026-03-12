const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'bus_booking.db');
const db = new Database(dbPath);

console.log('🚀 Starting enhanced database migration...\n');

// Enable foreign keys
db.pragma('foreign_keys = ON');

try {
  // Create enhanced passengers table
  console.log('Creating enhanced passengers table...');
  
  // Check if passengers table exists and back it up
  const existingPassengers = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='passengers'").get();
  
  if (existingPassengers) {
    console.log('Backing up existing passengers table...');
    db.exec(`CREATE TABLE passengers_backup AS SELECT * FROM passengers`);
    db.exec(`DROP TABLE passengers`);
  }
  
  db.exec(`
    CREATE TABLE passengers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL,
      seat_number TEXT NOT NULL,
      full_name TEXT NOT NULL,
      phone_number TEXT NOT NULL,
      email TEXT,
      date_of_birth DATE,
      gender TEXT CHECK(gender IN ('Male', 'Female', 'Other')),
      id_type TEXT CHECK(id_type IN ('NRC', 'Passport', 'Driver License', 'Other')),
      id_number TEXT,
      emergency_contact_name TEXT,
      emergency_contact_phone TEXT,
      emergency_contact_relationship TEXT,
      special_needs TEXT,
      luggage_count INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
      UNIQUE(booking_id, seat_number)
    )
  `);
  console.log('✅ Enhanced passengers table created\n');

  // Create payments table
  console.log('Creating enhanced payments table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'ZMW',
      payment_method TEXT NOT NULL CHECK(payment_method IN ('MTN', 'Airtel', 'Zamtel', 'Card', 'Cash')),
      payment_provider TEXT,
      transaction_id TEXT UNIQUE,
      payment_reference TEXT UNIQUE NOT NULL,
      external_reference TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
      initiated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      metadata TEXT,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
    )
  `);
  console.log('✅ Payments table created\n');

  // Create refunds table
  console.log('Creating refunds table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS refunds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL,
      payment_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      refund_percentage INTEGER,
      reason TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'processing', 'completed', 'failed')),
      refund_reference TEXT UNIQUE NOT NULL,
      external_reference TEXT,
      requested_by INTEGER NOT NULL,
      approved_by INTEGER,
      rejection_reason TEXT,
      requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      processed_at DATETIME,
      completed_at DATETIME,
      FOREIGN KEY (booking_id) REFERENCES bookings(id),
      FOREIGN KEY (payment_id) REFERENCES payments(id),
      FOREIGN KEY (requested_by) REFERENCES users(id),
      FOREIGN KEY (approved_by) REFERENCES users(id)
    )
  `);
  console.log('✅ Refunds table created\n');

  // Create platform_revenue table
  console.log('Creating platform_revenue table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS platform_revenue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL,
      payment_id INTEGER NOT NULL,
      booking_amount REAL NOT NULL,
      commission_percentage REAL NOT NULL DEFAULT 7.5,
      commission_amount REAL NOT NULL,
      company_payout REAL NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'paid_to_company', 'completed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      paid_at DATETIME,
      FOREIGN KEY (booking_id) REFERENCES bookings(id),
      FOREIGN KEY (payment_id) REFERENCES payments(id)
    )
  `);
  console.log('✅ Platform revenue table created\n');

  // Create system_settings table
  console.log('Creating system_settings table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS system_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      setting_key TEXT UNIQUE NOT NULL,
      setting_value TEXT NOT NULL,
      description TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✅ System settings table created\n');

  // Insert default system settings
  console.log('Inserting default system settings...');
  db.exec(`
    INSERT OR IGNORE INTO system_settings (setting_key, setting_value, description) VALUES
    ('platform_commission_percentage', '7.5', 'Platform commission percentage per booking'),
    ('payment_gateway_fee', '3.8', 'Flutterwave transaction fee percentage'),
    ('min_cancellation_hours', '6', 'Minimum hours before departure to cancel'),
    ('max_refund_percentage', '90', 'Maximum refund percentage allowed'),
    ('platform_name', 'City to City', 'Platform name'),
    ('support_email', 'support@citytocity.zm', 'Support email address'),
    ('support_phone', '+260977000000', 'Support phone number')
  `);
  console.log('✅ Default settings inserted\n');

  // Create indexes for better performance
  console.log('Creating performance indexes...');
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_passengers_booking ON passengers(booking_id);
    CREATE INDEX IF NOT EXISTS idx_passengers_phone ON passengers(phone_number);
    CREATE INDEX IF NOT EXISTS idx_passengers_seat ON passengers(booking_id, seat_number);
    CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
    CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
    CREATE INDEX IF NOT EXISTS idx_refunds_booking ON refunds(booking_id);
    CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);
    CREATE INDEX IF NOT EXISTS idx_platform_revenue_booking ON platform_revenue(booking_id);
  `);
  console.log('✅ Performance indexes created\n');

  console.log('🎉 Enhanced database migration completed successfully!');
  console.log('\n📊 Database now includes:');
  console.log('  - Enhanced passengers table with emergency contacts');
  console.log('  - Payments tracking system');
  console.log('  - Refunds management');
  console.log('  - Platform revenue tracking (7.5% commission)');
  console.log('  - System settings configuration');
  console.log('  - Performance indexes');

} catch (error) {
  console.error('❌ Migration failed:', error);
  throw error;
} finally {
  db.close();
}