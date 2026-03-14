const Database = require('better-sqlite3');
const db = new Database('./bus_booking.db');

console.log('=== REFUNDS TABLE STRUCTURE ===');
const refundColumns = db.prepare('PRAGMA table_info(refunds)').all();
refundColumns.forEach(col => console.log(`  ${col.name} (${col.type})`));

console.log('\n=== CANCELLATION LOGS TABLE STRUCTURE ===');
const cancelColumns = db.prepare('PRAGMA table_info(cancellation_logs)').all();
cancelColumns.forEach(col => console.log(`  ${col.name} (${col.type})`));

console.log('\n=== ACTUAL REFUND RECORDS ===');
const refunds = db.prepare('SELECT * FROM refunds LIMIT 5').all();
console.log('Refunds found:', refunds.length);
refunds.forEach((r, i) => console.log(`  ${i+1}. ID: ${r.id}, Booking: ${r.booking_id}, Amount: K${r.amount}, Status: ${r.status}`));

console.log('\n=== CANCELLATION LOGS ===');
const cancellations = db.prepare('SELECT * FROM cancellation_logs LIMIT 5').all();
console.log('Cancellation logs found:', cancellations.length);
cancellations.forEach((c, i) => console.log(`  ${i+1}. Booking: ${c.booking_id}, Reason: ${c.reason}`));

db.close();