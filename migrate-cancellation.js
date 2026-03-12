// Enhanced Cancellation Migration - Add refund tracking columns
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'bus_booking.db');
const db = new Database(dbPath);

console.log('🔧 ENHANCED CANCELLATION MIGRATION');
console.log('==================================\n');

try {
  // Add refund tracking columns to bookings table
  console.log('1. Adding refund tracking columns to bookings table...');
  
  const addColumns = [
    'ALTER TABLE bookings ADD COLUMN refund_amount REAL DEFAULT 0',
    'ALTER TABLE bookings ADD COLUMN cancellation_fee REAL DEFAULT 0',
    'ALTER TABLE bookings ADD COLUMN refund_status TEXT DEFAULT NULL CHECK (refund_status IN ("pending", "processed", "failed", NULL))',
    'ALTER TABLE bookings ADD COLUMN refund_processed_at DATETIME DEFAULT NULL'
  ];

  addColumns.forEach(sql => {
    try {
      db.exec(sql);
      console.log('   ✅ Added column:', sql.match(/ADD COLUMN (\w+)/)[1]);
    } catch (error) {
      if (error.message.includes('duplicate column name')) {
        console.log('   ⚠️  Column already exists:', sql.match(/ADD COLUMN (\w+)/)[1]);
      } else {
        throw error;
      }
    }
  });

  // Create cancellation_logs table for audit trail
  console.log('\n2. Creating cancellation audit log table...');
  
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS cancellation_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_id INTEGER NOT NULL,
        cancelled_by INTEGER NOT NULL, -- user ID who cancelled
        cancellation_reason TEXT NOT NULL,
        original_amount REAL NOT NULL,
        refund_amount REAL NOT NULL,
        cancellation_fee REAL NOT NULL,
        hours_before_departure REAL NOT NULL,
        refund_percentage INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES bookings(id),
        FOREIGN KEY (cancelled_by) REFERENCES users(id)
      )
    `);
    console.log('   ✅ Cancellation logs table created');
  } catch (error) {
    console.log('   ⚠️  Cancellation logs table already exists');
  }

  // Create index for performance
  console.log('\n3. Creating performance indexes...');
  
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_bookings_refund_status ON bookings(refund_status)',
    'CREATE INDEX IF NOT EXISTS idx_cancellation_logs_booking ON cancellation_logs(booking_id)',
    'CREATE INDEX IF NOT EXISTS idx_cancellation_logs_date ON cancellation_logs(created_at)'
  ];

  indexes.forEach(sql => {
    try {
      db.exec(sql);
      console.log('   ✅ Index created:', sql.match(/idx_(\w+)/)[1]);
    } catch (error) {
      if (!error.message.includes('already exists')) {
        throw error;
      }
    }
  });

  // Test the new structure
  console.log('\n4. Testing enhanced cancellation structure...');
  
  const testBooking = db.prepare(`
    SELECT 
      id, booking_reference, status, total_price, 
      refund_amount, cancellation_fee, refund_status
    FROM bookings 
    WHERE status = 'cancelled'
    LIMIT 1
  `).get();

  if (testBooking) {
    console.log('   ✅ Sample cancelled booking:');
    console.log(`      Ref: ${testBooking.booking_reference}`);
    console.log(`      Original: K${testBooking.total_price}`);
    console.log(`      Refund: K${testBooking.refund_amount || 0}`);
    console.log(`      Fee: K${testBooking.cancellation_fee || 0}`);
    console.log(`      Status: ${testBooking.refund_status || 'Not set'}`);
  } else {
    console.log('   ℹ️  No cancelled bookings found to test with');
  }

  console.log('\n🎉 ENHANCED CANCELLATION MIGRATION COMPLETE!');
  console.log('============================================');
  console.log('✅ Refund tracking columns added');
  console.log('✅ Cancellation audit log table created');
  console.log('✅ Performance indexes created');
  console.log('✅ Enhanced cancellation system ready');

} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
} finally {
  db.close();
}