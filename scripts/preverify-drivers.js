const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'bus_booking.db');
const db = new Database(dbPath);

function hasColumn(tableName, columnName) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  return columns.some((column) => column.name === columnName);
}

try {
  const hasEmailVerified = hasColumn('drivers', 'email_verified');

  if (!hasEmailVerified) {
    console.log('No email verification columns found on drivers table. Nothing to pre-verify.');
    process.exit(0);
  }

  const hasEmailVerifiedAt = hasColumn('drivers', 'email_verified_at');
  const hasVerificationToken = hasColumn('drivers', 'verification_token');

  const setClauses = ['email_verified = 1'];
  if (hasEmailVerifiedAt) {
    setClauses.push('email_verified_at = COALESCE(email_verified_at, CURRENT_TIMESTAMP)');
  }
  if (hasVerificationToken) {
    setClauses.push('verification_token = NULL');
  }

  const update = db.prepare(`
    UPDATE drivers
    SET ${setClauses.join(', ')}
    WHERE status = 'active'
  `);

  const result = update.run();
  console.log(`Pre-verified ${result.changes} active drivers.`);
} catch (error) {
  console.error('Failed to pre-verify drivers:', error.message);
  process.exit(1);
} finally {
  db.close();
}
