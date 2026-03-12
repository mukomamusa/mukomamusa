const Database = require('better-sqlite3');
const db = new Database('./bus_booking.db');

const columns = [
  { name: 'two_factor_enabled', type: 'INTEGER DEFAULT 0' },
  { name: 'two_factor_secret', type: 'TEXT' },
  { name: 'google_id', type: 'TEXT' },
  { name: 'auth_provider', type: 'TEXT DEFAULT "local"' },
  { name: 'password_reset_token', type: 'TEXT' },
  { name: 'password_reset_expires', type: 'TEXT' }
];

columns.forEach(col => {
  try {
    db.exec(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`);
    console.log(`Added column: ${col.name}`);
  } catch (e) {
    console.log(`Column ${col.name} already exists or error: ${e.message}`);
  }
});

console.log('\nCurrent users table columns:');
const info = db.prepare('PRAGMA table_info(users)').all();
console.log(info.map(c => c.name).join(', '));

db.close();
console.log('\nDone!');
