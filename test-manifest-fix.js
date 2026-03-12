const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'bus_booking.db');
const db = new Database(dbPath);

console.log('🧪 Testing manifest query fix...\n');

try {
  // Test the fixed query (this is the same query from the manifest API)
  const routeId = 265; // Using the route ID from the error
  
  const passengers = db.prepare(`
    SELECT 
      p.id as passenger_id,
      p.full_name as passenger_name,
      p.id_number as nrc_or_passport,
      p.phone_number as passenger_phone,
      CASE 
        WHEN p.date_of_birth IS NOT NULL AND 
             DATE('now', '-18 years') > p.date_of_birth THEN 'child'
        WHEN p.date_of_birth IS NOT NULL AND 
             DATE('now', '-60 years') < p.date_of_birth THEN 'senior'
        ELSE 'adult'
      END as passenger_type,
      p.seat_number,
      p.special_needs,
      t.ticket_number,
      t.boarding_status,
      t.boarded_at,
      b.booking_reference,
      b.boarding_point,
      b.dropping_point,
      b.luggage_count,
      b.status as booking_status,
      b.payment_status,
      u.name as booked_by,
      u.phone as booker_phone
    FROM passengers p
    JOIN bookings b ON p.booking_id = b.id
    JOIN users u ON b.customer_id = u.id
    LEFT JOIN tickets t ON t.passenger_id = p.id
    WHERE b.route_id = ? AND b.status IN ('pending', 'confirmed')
    ORDER BY p.seat_number
  `).all(routeId);

  console.log(`✅ Query executed successfully!`);
  console.log(`📊 Found ${passengers.length} passengers for route ${routeId}`);
  
  if (passengers.length > 0) {
    console.log(`📋 Sample passenger data:`);
    console.log(passengers[0]);
  }
  
} catch (error) {
  console.error('❌ Query failed:', error.message);
  console.error('Full error:', error);
}

db.close();
console.log('\n🔚 Test completed.');