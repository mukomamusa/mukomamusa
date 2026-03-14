// scripts/test-boarding.js
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'bus_booking.db');
const db = new Database(dbPath);

console.log('🔍 Testing database connections...\n');

// Check passengers
const passengers = db.prepare(`
  SELECT 
    p.id,
    p.full_name,
    p.seat_number,
    t.ticket_number,
    b.booking_reference,
    b.route_id
  FROM passengers p
  LEFT JOIN tickets t ON p.id = t.passenger_id
  JOIN bookings b ON p.booking_id = b.id
  LIMIT 5
`).all();

console.log('📋 Passengers found:', passengers.length);
console.table(passengers);

// Check tickets
const tickets = db.prepare(`
  SELECT t.*, p.full_name 
  FROM tickets t
  JOIN passengers p ON t.passenger_id = p.id
  LIMIT 5
`).all();

console.log('\n🎫 Tickets found:', tickets.length);
console.table(tickets);

// Check routes with drivers assigned
const routes = db.prepare(`
  SELECT id, origin, destination, driver_id 
  FROM routes 
  WHERE driver_id IS NOT NULL
  LIMIT 5
`).all();

console.log('\n🛣️ Routes with drivers:', routes.length);
console.table(routes);