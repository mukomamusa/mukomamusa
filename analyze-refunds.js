const Database = require('better-sqlite3');
const db = new Database('./bus_booking.db');

console.log('=== REFUND SYSTEM ANALYSIS ===\n');

// Check if refund columns exist in bookings table
const columns = db.prepare('PRAGMA table_info(bookings)').all();
const refundColumns = columns.filter(col => col.name.includes('refund') || col.name.includes('cancel'));

console.log('Refund-related columns in bookings table:');
refundColumns.forEach(col => console.log(`  ${col.name} (${col.type})`));

// Check for refunds table
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%refund%'").all();
console.log(`\nRefunds table exists: ${tables.length > 0 ? 'YES' : 'NO'}`);
if (tables.length > 0) {
  console.log('Refund tables found:', tables.map(t => t.name));
}

// Check current refund data
const refundData = db.prepare("SELECT id, booking_reference, refund_amount, refund_status, cancellation_fee, status FROM bookings WHERE refund_amount IS NOT NULL OR refund_status IS NOT NULL OR status = 'cancelled'").all();
console.log(`\nBookings with refund/cancellation data: ${refundData.length}`);

refundData.forEach((r, i) => {
  console.log(`  ${i+1}. Ref: ${r.booking_reference}, Status: ${r.status}, Refund: K${r.refund_amount || 0}, Fee: K${r.cancellation_fee || 0}, Refund Status: ${r.refund_status || 'N/A'}`);
});

// Check for cancellation logs table
const cancellationTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%cancel%'").all();
console.log(`\nCancellation tables: ${cancellationTables.map(t => t.name).join(', ') || 'None'}`);

db.close();