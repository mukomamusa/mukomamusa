const Database = require('better-sqlite3');
const db = new Database('./bus_booking.db');

// Fix bookings that were incorrectly marked as paid without actual payment
const result = db.prepare(`
  UPDATE bookings 
  SET payment_status = 'pending' 
  WHERE payment_status = 'paid' 
  AND id NOT IN (
    SELECT DISTINCT booking_id FROM payments WHERE status = 'completed'
  )
`).run();

console.log('Fixed', result.changes, 'bookings that were marked paid without actual payment');

// Show current state
const pending = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE payment_status = 'pending'").get();
const paid = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE payment_status = 'paid'").get();
console.log('Bookings with pending payment:', pending.count);
console.log('Bookings with completed payment:', paid.count);

db.close();
