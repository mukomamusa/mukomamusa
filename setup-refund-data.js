const Database = require('better-sqlite3');
const db = new Database('./bus_booking.db');

console.log('=== CREATING REFUND MANAGEMENT DATA ===\n');

// Create some sample refund requests for testing
const sampleRefunds = [
  {
    booking_id: 1,
    amount: 200.00,
    reason: 'Customer requested cancellation - family emergency',
    status: 'pending',
    refund_method: 'mobile_money',
    requested_at: '2026-02-10 14:30:00'
  },
  {
    booking_id: 2, 
    amount: 150.00,
    reason: 'Route cancelled due to vehicle breakdown',
    status: 'processed',
    refund_method: 'bank_transfer',
    requested_at: '2026-02-09 10:15:00',
    processed_at: '2026-02-09 16:45:00',
    processed_by: 1
  },
  {
    booking_id: 3,
    amount: 80.00,
    reason: 'Partial refund - missed boarding',
    status: 'pending', 
    refund_method: 'mobile_money',
    requested_at: '2026-02-11 08:00:00'
  }
];

// Insert sample refunds
const insertRefund = db.prepare(`
  INSERT INTO refunds (booking_id, amount, reason, status, refund_method, requested_at, processed_at, processed_by)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

sampleRefunds.forEach(refund => {
  try {
    insertRefund.run(
      refund.booking_id,
      refund.amount, 
      refund.reason,
      refund.status,
      refund.refund_method,
      refund.requested_at,
      refund.processed_at || null,
      refund.processed_by || null
    );
    console.log(`✅ Created refund for booking ${refund.booking_id} - K${refund.amount}`);
  } catch (error) {
    console.log(`⚠️ Refund for booking ${refund.booking_id} may already exist`);
  }
});

// Update some bookings to show refund status
db.prepare(`UPDATE bookings SET refund_status = 'pending', refund_amount = 200 WHERE id = 1`).run();
db.prepare(`UPDATE bookings SET refund_status = 'processed', refund_amount = 150 WHERE id = 2`).run();
db.prepare(`UPDATE bookings SET refund_status = 'pending', refund_amount = 80 WHERE id = 3`).run();

console.log('\n=== REFUND SYSTEM SUMMARY ===');

// Get refund statistics 
const stats = db.prepare(`
  SELECT 
    COUNT(*) as total_refunds,
    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_refunds,
    SUM(CASE WHEN status = 'processed' THEN 1 ELSE 0 END) as processed_refunds,
    SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount,
    SUM(CASE WHEN status = 'processed' THEN amount ELSE 0 END) as processed_amount
  FROM refunds
`).get();

console.log(`Total Refunds: ${stats.total_refunds}`);
console.log(`Pending Refunds: ${stats.pending_refunds} (K${stats.pending_amount})`);
console.log(`Processed Refunds: ${stats.processed_refunds} (K${stats.processed_amount})`);

db.close();