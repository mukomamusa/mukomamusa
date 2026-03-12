// Test script to verify booking flow with enhanced passenger data
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'bus_booking.db');
const db = new Database(dbPath);

console.log('🧪 BOOKING FLOW TEST - Phase 2B Verification\n');

// 1. Check passengers table structure
console.log('1. VERIFYING PASSENGERS TABLE STRUCTURE:');
console.log('==========================================');

try {
  const tableInfo = db.prepare("PRAGMA table_info(passengers)").all();
  console.log('✅ Passengers table columns:');
  tableInfo.forEach(col => {
    console.log(`   - ${col.name} (${col.type})`);
  });
  console.log(`   Total columns: ${tableInfo.length}\n`);
} catch (error) {
  console.log('❌ Error checking table structure:', error.message);
}

// 2. Check recent bookings with passenger data
console.log('2. CHECKING RECENT BOOKINGS:');
console.log('============================');

try {
  const recentBookings = db.prepare(`
    SELECT 
      b.id, b.booking_reference, b.num_seats, b.total_price, b.status,
      b.created_at,
      r.origin, r.destination, r.date, r.departure_time
    FROM bookings b
    JOIN routes r ON b.route_id = r.id
    ORDER BY b.created_at DESC
    LIMIT 5
  `).all();

  if (recentBookings.length > 0) {
    console.log(`✅ Found ${recentBookings.length} recent booking(s):`);
    recentBookings.forEach((booking, index) => {
      console.log(`\n   Booking ${index + 1}:`);
      console.log(`   - ID: ${booking.id}`);
      console.log(`   - Reference: ${booking.booking_reference}`);
      console.log(`   - Route: ${booking.origin} → ${booking.destination}`);
      console.log(`   - Date: ${booking.date}`);
      console.log(`   - Seats: ${booking.num_seats}`);
      console.log(`   - Price: K${booking.total_price}`);
      console.log(`   - Status: ${booking.status}`);
      console.log(`   - Created: ${new Date(booking.created_at).toLocaleString()}`);
    });
  } else {
    console.log('ℹ️  No recent bookings found');
  }
} catch (error) {
  console.log('❌ Error checking recent bookings:', error.message);
}

// 3. Check passenger data for recent bookings
console.log('\n3. CHECKING PASSENGER DATA:');
console.log('===========================');

try {
  const passengersWithBookings = db.prepare(`
    SELECT 
      p.*,
      b.booking_reference,
      b.created_at as booking_created
    FROM passengers p
    JOIN bookings b ON p.booking_id = b.id
    ORDER BY b.created_at DESC, p.id ASC
    LIMIT 10
  `).all();

  if (passengersWithBookings.length > 0) {
    console.log(`✅ Found ${passengersWithBookings.length} passenger record(s):`);
    passengersWithBookings.forEach((passenger, index) => {
      console.log(`\n   Passenger ${index + 1} (Booking: ${passenger.booking_reference}):`);
      console.log(`   - Name: ${passenger.full_name || 'N/A'}`);
      console.log(`   - Phone: ${passenger.phone_number || 'N/A'}`);
      console.log(`   - Email: ${passenger.email || 'N/A'}`);
      console.log(`   - DOB: ${passenger.date_of_birth || 'N/A'}`);
      console.log(`   - Gender: ${passenger.gender || 'N/A'}`);
      console.log(`   - ID Type: ${passenger.id_type || 'N/A'}`);
      console.log(`   - ID Number: ${passenger.id_number || 'N/A'}`);
      console.log(`   - Emergency Contact: ${passenger.emergency_contact_name || 'N/A'}`);
      console.log(`   - Emergency Phone: ${passenger.emergency_contact_phone || 'N/A'}`);
      console.log(`   - Emergency Relationship: ${passenger.emergency_contact_relationship || 'N/A'}`);
      console.log(`   - Seat: ${passenger.seat_number}`);
      console.log(`   - Luggage Count: ${passenger.luggage_count || 'N/A'}`);
      console.log(`   - Special Needs: ${passenger.special_needs || 'N/A'}`);
    });
  } else {
    console.log('ℹ️  No passenger records found');
  }
} catch (error) {
  console.log('❌ Error checking passenger data:', error.message);
}

// 4. Check tickets for passengers
console.log('\n4. CHECKING TICKET DATA:');
console.log('========================');

try {
  const ticketsWithPassengers = db.prepare(`
    SELECT 
      t.*,
      p.full_name,
      b.booking_reference
    FROM tickets t
    JOIN passengers p ON t.passenger_id = p.id
    JOIN bookings b ON t.booking_id = b.id
    ORDER BY b.created_at DESC, t.id ASC
    LIMIT 10
  `).all();

  if (ticketsWithPassengers.length > 0) {
    console.log(`✅ Found ${ticketsWithPassengers.length} ticket record(s):`);
    ticketsWithPassengers.forEach((ticket, index) => {
      console.log(`\n   Ticket ${index + 1}:`);
      console.log(`   - Booking: ${ticket.booking_reference}`);
      console.log(`   - Passenger: ${ticket.full_name}`);
      console.log(`   - Ticket Number: ${ticket.ticket_number}`);
      console.log(`   - Seat: ${ticket.seat_number}`);
      console.log(`   - Status: ${ticket.status}`);
      console.log(`   - Boarding Status: ${ticket.boarding_status}`);
    });
  } else {
    console.log('ℹ️  No ticket records found');
  }
} catch (error) {
  console.log('❌ Error checking ticket data:', error.message);
}

// 5. Data integrity checks
console.log('\n5. DATA INTEGRITY CHECKS:');
console.log('=========================');

try {
  // Check for orphaned passengers (without bookings)
  const orphanedPassengers = db.prepare(`
    SELECT COUNT(*) as count FROM passengers p 
    LEFT JOIN bookings b ON p.booking_id = b.id 
    WHERE b.id IS NULL
  `).get();
  
  if (orphanedPassengers.count === 0) {
    console.log('✅ No orphaned passengers found');
  } else {
    console.log(`⚠️  Found ${orphanedPassengers.count} orphaned passenger(s)`);
  }

  // Check for passengers without tickets
  const passengersWithoutTickets = db.prepare(`
    SELECT COUNT(*) as count FROM passengers p 
    LEFT JOIN tickets t ON p.id = t.passenger_id 
    WHERE t.id IS NULL
  `).get();
  
  if (passengersWithoutTickets.count === 0) {
    console.log('✅ All passengers have tickets');
  } else {
    console.log(`⚠️  Found ${passengersWithoutTickets.count} passenger(s) without tickets`);
  }

  // Check for missing required fields
  const missingNameCount = db.prepare(`
    SELECT COUNT(*) as count FROM passengers WHERE full_name IS NULL OR full_name = ''
  `).get();
  
  const missingPhoneCount = db.prepare(`
    SELECT COUNT(*) as count FROM passengers WHERE phone_number IS NULL OR phone_number = ''
  `).get();

  console.log(`✅ Required field check: ${missingNameCount.count} missing names, ${missingPhoneCount.count} missing phones`);

} catch (error) {
  console.log('❌ Error in integrity checks:', error.message);
}

console.log('\n🏁 BOOKING FLOW TEST COMPLETE');
console.log('=====================================');
console.log('✨ Phase 2B: Enhanced passenger data verification done!');

db.close();