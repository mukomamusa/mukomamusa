const Database = require('better-sqlite3');
const db = new Database('./bus_booking.db');

// Test the fixed PATCH functionality
console.log('Testing booking status update...');

// First, let's see a booking to update
const booking = db.prepare('SELECT * FROM bookings WHERE status = ? LIMIT 1').get('confirmed');

if (booking) {
  console.log('Found booking to test:', booking.id, booking.status);
  
  // Test the update query that the API uses (without the problematic updated_at)
  try {
    const result = db.prepare("UPDATE bookings SET status = ?, confirmed_at = datetime('now') WHERE id = ?").run('completed', booking.id);
    console.log('Update result:', result);
    
    // Check if it worked
    const updated = db.prepare('SELECT status, confirmed_at FROM bookings WHERE id = ?').get(booking.id);
    console.log('Updated booking:', updated);
    
    // Revert for testing
    db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run('confirmed', booking.id);
    console.log('Reverted booking status for next test');
  } catch (error) {
    console.error('Update failed:', error.message);
  }
} else {
  console.log('No confirmed booking found to test');
}

db.close();