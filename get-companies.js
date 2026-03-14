const db = require('better-sqlite3')('bus_booking.db');
const companies = db.prepare("SELECT id, email, company_name FROM users WHERE user_type='company' LIMIT 3").all();
console.log('Company accounts:');
companies.forEach(c => console.log(`  - ${c.email} (${c.company_name})`));
db.close();
