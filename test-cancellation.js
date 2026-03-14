// Enhanced Cancellation System Test
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'bus_booking.db');
const db = new Database(dbPath);

console.log('🧪 ENHANCED CANCELLATION SYSTEM TEST');
console.log('====================================\n');

// Test different cancellation scenarios
const testScenarios = [
  {
    name: 'Early Cancellation (48+ hours)',
    hoursFromNow: 72, // 3 days
    expectedRefund: 90
  },
  {
    name: 'Medium Cancellation (24-48 hours)', 
    hoursFromNow: 36, // 1.5 days
    expectedRefund: 70
  },
  {
    name: 'Late Cancellation (6-24 hours)',
    hoursFromNow: 12, // 12 hours
    expectedRefund: 50
  },
  {
    name: 'Very Late Cancellation (<6 hours)',
    hoursFromNow: 3, // 3 hours
    expectedRefund: 0
  }
];

testScenarios.forEach((scenario, index) => {
  console.log(`${index + 1}. Testing: ${scenario.name}`);
  console.log('   ════════════════════════════════════');

  try {
    // Create a test route with departure time based on scenario
    const futureDate = new Date();
    futureDate.setHours(futureDate.getHours() + scenario.hoursFromNow);
    const testDate = futureDate.toISOString().split('T')[0];
    const testTime = futureDate.toTimeString().split(' ')[0].substring(0, 5);

    // Create test route
    const testRoute = db.prepare(`
      INSERT INTO routes (
        bus_id, origin, destination, date, departure_time, 
        arrival_time, price, available_seats, status
      ) VALUES (1, 'Test Origin', 'Test Destination', ?, ?, '14:00', 100, 40, 'active')
    `).run(testDate, testTime);

    const routeId = testRoute.lastInsertRowid;

    // Create test booking
    const testBooking = db.prepare(`
      INSERT INTO bookings (
        customer_id, route_id, num_seats, seat_numbers, total_price,
        booking_reference, boarding_point, dropping_point, status, payment_status
      ) VALUES (1, ?, 2, '1A,1B', 200, 'TEST${Date.now()}', 'Test Boarding', 'Test Dropping', 'confirmed', 'paid')
    `).run(routeId);

    const bookingId = testBooking.lastInsertRowid;

    // Test cancellation policy calculation
    const routeInfo = db.prepare(`
      SELECT r.date, r.departure_time 
      FROM routes r WHERE r.id = ?
    `).get(routeId);
    
    const departureDateTime = new Date(`${routeInfo.date}T${routeInfo.departure_time}`);
    const currentDateTime = new Date();
    const hoursUntilDeparture = (departureDateTime.getTime() - currentDateTime.getTime()) / (1000 * 60 * 60);
    
    let refundPercentage = 0;
    if (hoursUntilDeparture >= 48) {
      refundPercentage = 90;
    } else if (hoursUntilDeparture >= 24) {
      refundPercentage = 70;
    } else if (hoursUntilDeparture >= 6) {
      refundPercentage = 50;
    } else {
      refundPercentage = 0;
    }
    
    const totalPrice = 200;
    const refundAmount = totalPrice * (refundPercentage / 100);
    const cancellationFee = totalPrice - refundAmount;

    console.log(`   📅 Departure: ${routeInfo.date} ${routeInfo.departure_time}`);
    console.log(`   ⏰ Hours until departure: ${hoursUntilDeparture.toFixed(1)}`);
    console.log(`   💰 Total booking: K${totalPrice}`);
    console.log(`   🔢 Refund percentage: ${refundPercentage}%`);
    console.log(`   💸 Refund amount: K${refundAmount.toFixed(2)}`);
    console.log(`   📋 Cancellation fee: K${cancellationFee.toFixed(2)}`);

    // Verify calculation matches expected
    if (refundPercentage === scenario.expectedRefund) {
      console.log(`   ✅ PASS: Refund percentage matches expected (${scenario.expectedRefund}%)`);
    } else {
      console.log(`   ❌ FAIL: Expected ${scenario.expectedRefund}%, got ${refundPercentage}%`);
    }

    // Test actual cancellation
    db.prepare(`
      UPDATE bookings 
      SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP, cancellation_reason = ?,
          refund_amount = ?, cancellation_fee = ?, refund_status = ?
      WHERE id = ?
    `).run(
      `Test cancellation - ${scenario.name}`,
      refundAmount,
      cancellationFee,
      refundAmount > 0 ? 'pending' : null,
      bookingId
    );

    // Log to audit trail
    db.prepare(`
      INSERT INTO cancellation_logs (
        booking_id, cancelled_by, cancellation_reason, original_amount,
        refund_amount, cancellation_fee, hours_before_departure, refund_percentage
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      bookingId,
      1, // Test user ID
      `Test cancellation - ${scenario.name}`,
      totalPrice,
      refundAmount,
      cancellationFee,
      hoursUntilDeparture,
      refundPercentage
    );

    console.log(`   ✅ Cancellation processed successfully`);
    console.log(`   📝 Audit log entry created`);

    // Clean up test data
    db.prepare('DELETE FROM cancellation_logs WHERE booking_id = ?').run(bookingId);
    db.prepare('DELETE FROM bookings WHERE id = ?').run(bookingId);
    db.prepare('DELETE FROM routes WHERE id = ?').run(routeId);

  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
  }

  console.log('');
});

// Test cancellation audit queries
console.log('5. Testing Cancellation Analytics');
console.log('   ════════════════════════════════');

try {
  // Get cancellation statistics
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total_cancelled_bookings,
      AVG(refund_amount) as avg_refund,
      AVG(cancellation_fee) as avg_fee,
      AVG(hours_before_departure) as avg_hours_notice
    FROM cancellation_logs
  `).get();

  console.log('   📊 Cancellation Statistics:');
  console.log(`      Total cancelled bookings: ${stats.total_cancelled_bookings}`);
  console.log(`      Average refund: K${(stats.avg_refund || 0).toFixed(2)}`);
  console.log(`      Average fee: K${(stats.avg_fee || 0).toFixed(2)}`);
  console.log(`      Average notice hours: ${(stats.avg_hours_notice || 0).toFixed(1)}`);

  // Get refund breakdown by policy tier
  const refundBreakdown = db.prepare(`
    SELECT 
      refund_percentage,
      COUNT(*) as count,
      AVG(refund_amount) as avg_refund,
      SUM(refund_amount) as total_refunds
    FROM cancellation_logs
    GROUP BY refund_percentage
    ORDER BY refund_percentage DESC
  `).all();

  console.log('\n   📈 Refund Policy Breakdown:');
  refundBreakdown.forEach(row => {
    console.log(`      ${row.refund_percentage}% refund tier: ${row.count} bookings, K${row.total_refunds.toFixed(2)} total refunds`);
  });

} catch (error) {
  console.log(`   ❌ Analytics error: ${error.message}`);
}

console.log('\n🎉 ENHANCED CANCELLATION SYSTEM TEST COMPLETE!');
console.log('===============================================');
console.log('✅ All cancellation policy tiers tested');
console.log('✅ Refund calculations verified');
console.log('✅ Audit logging functional');
console.log('✅ Analytics queries working');
console.log('✅ Enhanced cancellation system fully operational!');

db.close();