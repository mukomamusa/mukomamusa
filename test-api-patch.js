const Database = require('better-sqlite3');
const db = new Database('./bus_booking.db');

// Simulate the API PATCH functionality 
console.log('Testing complete API PATCH simulation...');

// Get a booking to test with
const booking = db.prepare('SELECT * FROM bookings WHERE status = ? LIMIT 1').get('confirmed');

if (booking) {
  console.log(`Testing with booking ID: ${booking.id} (Status: ${booking.status})`);
  
  try {
    // Simulate the exact PATCH logic from the API
    const status = 'completed';
    const updates = ['status = ?'];
    const values = [status];
    
    // Add timestamp logic from the fixed API
    if (status === 'confirmed' || status === 'completed') {
      updates.push("confirmed_at = datetime('now')");
    } else if (status === 'cancelled') {
      updates.push("cancelled_at = datetime('now')");
    }
    
    values.push(booking.id);
    
    console.log('SQL query:', `UPDATE bookings SET ${updates.join(', ')} WHERE id = ?`);
    console.log('Values:', values);
    
    const result = db.prepare(`UPDATE bookings SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    
    console.log('Update result:', result);
    
    if (result.changes === 0) {
      console.log('❌ Failed to update booking - no changes made');
    } else {
      console.log('✅ Booking updated successfully');
      
      // Get updated booking
      const updatedBooking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(booking.id);
      console.log('Updated booking status:', updatedBooking.status);
      console.log('Updated confirmed_at:', updatedBooking.confirmed_at);
    }
    
  } catch (error) {
    console.error('❌ API simulation failed:', error.message);
  }
  
} else {
  console.log('No confirmed booking found to test');
}

db.close();