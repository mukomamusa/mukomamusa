const Database = require('better-sqlite3');
const db = new Database('./bus_booking.db');

console.log('=== BOOKING FLOW EXPLANATION ===\n');

// Get all distinct statuses used
console.log('1. All booking statuses in system:');
const statuses = db.prepare('SELECT DISTINCT status FROM bookings').all();
console.log(statuses.map(s => s.status).join(', '));

// Get Kabuya's bookings to see current state
console.log('\n2. Kabuya Buses (company_id=6) bookings:');
const query = `
  SELECT bk.id, bk.booking_reference, bk.status, bk.payment_status, bk.num_seats 
  FROM bookings bk 
  JOIN routes r ON bk.route_id = r.id 
  JOIN buses b ON r.bus_id = b.id 
  WHERE b.company_id = 6
`;
const bookings = db.prepare(query).all();
console.log(bookings);

// Check passengers
console.log('\n3. Passengers for these bookings:');
const passengers = db.prepare(`
  SELECT p.id, p.full_name, bk.status as booking_status
  FROM passengers p 
  JOIN bookings bk ON p.booking_id = bk.id 
  JOIN routes r ON bk.route_id = r.id 
  JOIN buses b ON r.bus_id = b.id 
  WHERE b.company_id = 6
`).all();
console.log(passengers);

// Current query logic explanation
console.log('\n=== CURRENT QUERY LOGIC ===');
console.log('The dashboard query counts passengers WHERE booking status IN ("confirmed", "cancelled")');
console.log('\nBookings with confirmed/cancelled status:', 
  bookings.filter(b => ['confirmed', 'cancelled'].includes(b.status)).length);

// What status the booking actually has
if (bookings.length > 0) {
  console.log('\n=== ISSUE FOUND ===');
  bookings.forEach(b => {
    const included = ['confirmed', 'cancelled'].includes(b.status);
    console.log(`Booking ${b.booking_reference}: status="${b.status}" -> ${included ? 'COUNTED' : 'NOT COUNTED'}`);
  });
}

db.close();
