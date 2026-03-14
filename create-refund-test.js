const Database = require('better-sqlite3');
const db = new Database('./bus_booking.db');

console.log('=== AVAILABLE BOOKINGS FOR REFUND TESTING ===');
const bookings = db.prepare('SELECT id, booking_reference, status, total_price FROM bookings LIMIT 10').all();
bookings.forEach(b => console.log(`ID: ${b.id}, Ref: ${b.booking_reference}, Status: ${b.status}, Price: K${b.total_price}`));

console.log('\n=== CREATING REFUND FOR CANCELLED BOOKING ===');
const cancelledBooking = db.prepare("SELECT id, total_price FROM bookings WHERE status = 'cancelled' LIMIT 1").get();

if (cancelledBooking) {
  console.log(`Using booking ID: ${cancelledBooking.id}, Amount: K${cancelledBooking.total_price}`);
  
  // Insert a refund request
  try {
    const insertRefund = db.prepare(`
      INSERT INTO refunds (booking_id, amount, reason, status, refund_method, requested_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const result = insertRefund.run(
      cancelledBooking.id,
      cancelledBooking.total_price * 0.8, // 80% refund (20% cancellation fee)
      'Customer requested cancellation - personal reasons',
      'pending',
      'mobile_money', 
      new Date().toISOString()
    );
    
    console.log('✅ Refund request created successfully');
    
    // Update booking refund status
    db.prepare(`UPDATE bookings SET refund_status = 'pending', refund_amount = ? WHERE id = ?`)
      .run(cancelledBooking.total_price * 0.8, cancelledBooking.id);
      
    console.log('✅ Booking updated with refund status');
    
  } catch (error) {
    console.log(`⚠️ Error creating refund: ${error.message}`);
  }
} else {
  console.log('No cancelled bookings found for refund testing');
}

db.close();