const Database = require('better-sqlite3');
const db = new Database('./bus_booking.db');

console.log('Available routes:');
const routes = db.prepare('SELECT id, origin, destination, date FROM routes LIMIT 5').all();
routes.forEach(r => console.log(`Route ${r.id}: ${r.origin} -> ${r.destination} (${r.date})`));

console.log('\nAvailable bookings:');
const bookings = db.prepare('SELECT id, route_id, booking_reference, status FROM bookings LIMIT 5').all();
bookings.forEach(b => console.log(`Booking ${b.id}: Route ${b.route_id}, Status: ${b.status}`));

db.close();