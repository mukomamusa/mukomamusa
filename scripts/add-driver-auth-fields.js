// scripts/add-driver-auth-fields.js
const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = path.join(process.cwd(), 'bus_booking.db');
const db = new Database(dbPath);

console.log('🔧 Adding driver authentication fields...');

try {
  // Add email_verified field
  try {
    db.exec(`ALTER TABLE drivers ADD COLUMN email_verified INTEGER DEFAULT 0`);
    console.log('✅ Added column: email_verified');
  } catch (e) {
    console.log('ℹ️ email_verified already exists');
  }

  // Add email_verified_at field
  try {
    db.exec(`ALTER TABLE drivers ADD COLUMN email_verified_at DATETIME`);
    console.log('✅ Added column: email_verified_at');
  } catch (e) {
    console.log('ℹ️ email_verified_at already exists');
  }

  // Add verification_token field
  try {
    db.exec(`ALTER TABLE drivers ADD COLUMN verification_token TEXT`);
    console.log('✅ Added column: verification_token');
  } catch (e) {
    console.log('ℹ️ verification_token already exists');
  }

  // Add reset_password_token field
  try {
    db.exec(`ALTER TABLE drivers ADD COLUMN reset_password_token TEXT`);
    console.log('✅ Added column: reset_password_token');
  } catch (e) {
    console.log('ℹ️ reset_password_token already exists');
  }

  // Add reset_password_expires field
  try {
    db.exec(`ALTER TABLE drivers ADD COLUMN reset_password_expires DATETIME`);
    console.log('✅ Added column: reset_password_expires');
  } catch (e) {
    console.log('ℹ️ reset_password_expires already exists');
  }

  console.log('\n✅ Driver authentication fields added successfully!');
  console.log('\n📋 New columns:');
  console.log('   • email_verified - Whether email is verified (0/1)');
  console.log('   • email_verified_at - When email was verified');
  console.log('   • verification_token - Token for email verification');
  console.log('   • reset_password_token - Token for password reset');
  console.log('   • reset_password_expires - When reset token expires');

} catch (error) {
  console.error('❌ Error:', error);
} finally {
  db.close();
}