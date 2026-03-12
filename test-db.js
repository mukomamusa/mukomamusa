const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'bus_booking.db');
console.log('Database path:', dbPath);

try {
  const db = new Database(dbPath);
  
  console.log('\n=== USERS TABLE ===');
  const users = db.prepare('SELECT id, email, user_type, company_name FROM users').all();
  console.log('Total users:', users.length);
  users.forEach(user => {
    console.log(`- ${user.email} (${user.user_type}) ${user.company_name || ''}`);
  });
  
  console.log('\n=== TEST LOGIN ===');
  const testUser = db.prepare('SELECT * FROM users WHERE email = ?').get('customer@example.com');
  if (testUser) {
    console.log('Found customer user:', {
      id: testUser.id,
      email: testUser.email,
      user_type: testUser.user_type,
      has_password: !!testUser.password
    });
  } else {
    console.log('Customer user NOT FOUND!');
  }
  
  db.close();
} catch (error) {
  console.error('Database error:', error);
}