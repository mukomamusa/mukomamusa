const Database = require('better-sqlite3');
const db = new Database('./bus_booking.db');

console.log('=== CREATING SIMPLE REFUND REQUESTS ===\n');

// Get a cancelled booking to create a refund for
const booking = db.prepare("SELECT id, booking_reference, total_price FROM bookings WHERE status = 'cancelled' LIMIT 1").get();

if (booking) {
  console.log(`Creating refund for booking: ${booking.booking_reference} (K${booking.total_price})`);
  
  try {
    // Create refund request (without payment_id constraint)
    const insertRefund = db.prepare(`
      INSERT INTO refunds (booking_id, amount, reason, status, refund_method, requested_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    // Try inserting with null payment_id first
    db.exec('PRAGMA foreign_keys = OFF');
    
    const refundAmount = booking.total_price * 0.8; // 80% refund
    const result = insertRefund.run(
      booking.id,
      refundAmount,
      'Booking cancellation - customer request',
      'pending',
      'mobile_money',
      '2026-02-11 10:00:00'
    );
    
    console.log('✅ Refund request created successfully');
    
    // Update booking with refund info
    db.prepare(`UPDATE bookings SET refund_status = 'pending', refund_amount = ? WHERE id = ?`)
      .run(refundAmount, booking.id);
    
    console.log('✅ Booking updated with refund status');
    
    // Create another processed refund example
    const booking2 = db.prepare("SELECT id FROM bookings WHERE status = 'cancelled' AND id != ? LIMIT 1").get(booking.id);
    
    if (booking2) {
      insertRefund.run(
        booking2.id,
        120,
        'Route cancelled by company',
        'processed',
        'bank_transfer',
        '2026-02-10 15:30:00'
      );
      console.log('✅ Second refund (processed) created');
    }
    
    db.exec('PRAGMA foreign_keys = ON');
    
  } catch (error) {
    console.log(`⚠️ Error: ${error.message}`);
    
    // Try alternative approach - just update booking refund fields
    console.log('Updating booking refund fields directly...');
    
    db.prepare(`UPDATE bookings SET refund_status = 'pending', refund_amount = ?, cancellation_fee = ? WHERE id = ?`)
      .run(booking.total_price * 0.8, booking.total_price * 0.2, booking.id);
    
    console.log('✅ Booking refund info updated directly');
  }
}

console.log('\n=== REFUND SUMMARY ===');
const refundStats = db.prepare(`
  SELECT 
    COUNT(*) as total_with_refund_status,
    SUM(CASE WHEN refund_status = 'pending' THEN 1 ELSE 0 END) as pending,
    SUM(CASE WHEN refund_status = 'processed' THEN 1 ELSE 0 END) as processed,
    SUM(refund_amount) as total_refund_amount
  FROM bookings 
  WHERE refund_status IS NOT NULL
`).get();

console.log(`Bookings with refund status: ${refundStats.total_with_refund_status}`);
console.log(`Pending refunds: ${refundStats.pending}`);
console.log(`Processed refunds: ${refundStats.processed}`);
console.log(`Total refund amount: K${refundStats.total_refund_amount || 0}`);

db.close();