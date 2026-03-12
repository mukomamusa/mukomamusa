const Database = require('better-sqlite3');
const db = new Database('./bus_booking.db');

console.log('Testing manifest query with route 6...');

const passengers = db.prepare(`
  SELECT 
    p.id as passenger_id,
    p.full_name as passenger_name,
    p.id_number as nrc_or_passport,
    p.phone_number as passenger_phone,
    p.seat_number,
    b.booking_reference,
    b.status as booking_status
  FROM passengers p
  JOIN bookings b ON p.booking_id = b.id
  JOIN users u ON b.customer_id = u.id  
  WHERE b.route_id = ? AND b.status IN ('pending', 'confirmed')
  ORDER BY p.seat_number
`).all(6);

console.log('Found', passengers.length, 'passengers for route 6');
passengers.forEach(p => console.log(`- ${p.passenger_name} (Seat ${p.seat_number})`));

db.close();