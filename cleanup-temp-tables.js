const Database = require('better-sqlite3');
const db = new Database('./bus_booking.db');

console.log('🧹 Cleaning up temporary migration tables...');

try {
  db.exec('DROP TABLE IF EXISTS passengers_backup');
  db.exec('DROP TABLE IF EXISTS passengers_new');
  console.log('✅ Temporary tables cleaned up successfully');
} catch (error) {
  console.error('❌ Cleanup failed:', error);
} finally {
  db.close();
}