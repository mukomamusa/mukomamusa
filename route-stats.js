const Database = require('better-sqlite3');
const db = new Database('./bus_booking.db');

console.log('\n=== KEY ROUTE STATISTICS ===');

// Popular routes
const popular = db.prepare(`
  SELECT origin, destination, COUNT(*) as route_count, AVG(price) as avg_price
  FROM routes 
  GROUP BY origin, destination 
  ORDER BY route_count DESC 
  LIMIT 10
`).all();

console.log('\nMost Popular Routes:');
popular.forEach(r => {
  console.log(`  ${r.origin} → ${r.destination}: ${r.route_count} routes (Avg K${r.avg_price.toFixed(0)})`);
});

// Price analysis  
const prices = db.prepare(`SELECT MIN(price) as min, MAX(price) as max, AVG(price) as avg FROM routes`).get();
console.log(`\nPrice Range: K${prices.min} - K${prices.max} (Avg: K${prices.avg.toFixed(0)})`);

// Status analysis
const status = db.prepare(`SELECT status, COUNT(*) as count FROM routes GROUP BY status`).all();
console.log('\nRoute Status:');
status.forEach(s => console.log(`  ${s.status || 'NULL'}: ${s.count}`));

// Comprehensive booking analysis with correct column names
const bookingStats = db.prepare(`
  SELECT 
    COUNT(*) as total_bookings,
    COUNT(DISTINCT route_id) as routes_with_bookings,
    SUM(num_seats) as total_seats_booked,
    AVG(total_price) as avg_booking_price,
    SUM(total_price) as total_revenue
  FROM bookings
`).get();

console.log('\n=== BOOKING ANALYSIS ===');
console.log(`Total Bookings: ${bookingStats.total_bookings}`);
console.log(`Routes with Bookings: ${bookingStats.routes_with_bookings}`);  
console.log(`Total Seats Booked: ${bookingStats.total_seats_booked}`);
console.log(`Average Booking Value: K${bookingStats.avg_booking_price?.toFixed(0) || 0}`);
console.log(`Total Revenue: K${bookingStats.total_revenue?.toFixed(0) || 0}`);

// Booking status breakdown
const statusBreakdown = db.prepare(`
  SELECT status, COUNT(*) as count, SUM(total_price) as revenue
  FROM bookings 
  GROUP BY status
`).all();

console.log('\nBooking Status:');
statusBreakdown.forEach(s => {
  console.log(`  ${s.status}: ${s.count} bookings (K${s.revenue?.toFixed(0) || 0})`);
});

db.close();

db.close();