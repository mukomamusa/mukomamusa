const db = require('better-sqlite3')('bus_booking.db');

// Check routes schema
console.log('=== ROUTES TABLE SCHEMA ===');
const routes = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='routes'").get();
console.log(routes?.sql || 'NOT FOUND');

// Check bookings schema
console.log('\n=== BOOKINGS TABLE SCHEMA ===');
const bookings = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='bookings'").get();
console.log(bookings?.sql || 'NOT FOUND');

db.close();
