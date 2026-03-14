// scripts/add-driver-login-fields.js
const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(process.cwd(), 'bus_booking.db');
const db = new Database(dbPath);

console.log('🔧 Adding login fields to drivers table...');

function getColumns(table) {
  return db.prepare(`PRAGMA table_info(${table})`).all().map(col => col.name);
}

function hasIndex(indexName) {
  const row = db
    .prepare(`SELECT name FROM sqlite_master WHERE type='index' AND name = ?`)
    .get(indexName);
  return !!row;
}

try {
  // 1) Add missing fields (SQLite cannot ADD COLUMN with UNIQUE)
  let existingColumns = getColumns('drivers');
  console.log('📋 Existing columns:', existingColumns);

  const fieldsToAdd = [
    { name: 'email', definition: 'TEXT' }, // <-- no UNIQUE here
    { name: 'password', definition: 'TEXT' },
    { name: 'last_login', definition: 'DATETIME' },
    { name: 'device_id', definition: 'TEXT' }
  ];

  for (const field of fieldsToAdd) {
    if (!existingColumns.includes(field.name)) {
      try {
        db.exec(`ALTER TABLE drivers ADD COLUMN ${field.name} ${field.definition}`);
        console.log(`✅ Added column: ${field.name}`);
      } catch (e) {
        console.log(`❌ Failed to add ${field.name}: ${e.message}`);
      }
    } else {
      console.log(`ℹ️ Column ${field.name} already exists`);
    }
  }

  // Refresh columns after ALTER TABLE
  existingColumns = getColumns('drivers');

  // 2) Ensure unique index on email (correct SQLite approach)
  if (existingColumns.includes('email') && !hasIndex('idx_drivers_email_unique')) {
    try {
      db.exec(`
        CREATE UNIQUE INDEX idx_drivers_email_unique
        ON drivers(email)
        WHERE email IS NOT NULL
      `);
      console.log('✅ Created unique index: idx_drivers_email_unique');
    } catch (e) {
      console.log(`❌ Failed to create unique index: ${e.message}`);
    }
  } else if (hasIndex('idx_drivers_email_unique')) {
    console.log('ℹ️ Unique index already exists: idx_drivers_email_unique');
  }

  // 3) Get all drivers
  const drivers = db.prepare(`
    SELECT d.id, d.name, d.phone, d.license_number, u.company_name
    FROM drivers d
    LEFT JOIN users u ON d.company_id = u.id
  `).all();

  console.log(`\n📋 Found ${drivers.length} existing drivers`);

  if (drivers.length === 0) {
    console.log('ℹ️ No drivers found to update');
    process.exit(0);
  }

  console.log('\n🔑 Default login credentials (for testing):');
  console.log('='.repeat(60));

  // Only include email in UPDATE if column exists
  const canSetEmail = existingColumns.includes('email');
  const updateStmt = canSetEmail
    ? db.prepare(`
        UPDATE drivers
        SET email = ?, password = ?, phone = ?
        WHERE id = ?
      `)
    : db.prepare(`
        UPDATE drivers
        SET password = ?, phone = ?
        WHERE id = ?
      `);

  for (const driver of drivers) {
    const safeName = (driver.name || `driver${driver.id}`)
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, '.');

    const companyPrefix = driver.company_name
      ? driver.company_name.toLowerCase().replace(/[^a-z0-9]/g, '')
      : 'driver';

    const email = `${safeName || `driver${driver.id}`}@${companyPrefix || 'company'}.vayazed.com`;

    let phone = driver.phone || '';
    if (phone && !phone.startsWith('+260') && phone.startsWith('0')) {
      phone = '+260' + phone.substring(1);
    }

    const password = 'driver123';
    const hashedPassword = bcrypt.hashSync(password, 10);

    try {
      if (canSetEmail) {
        updateStmt.run(email, hashedPassword, phone, driver.id);
      } else {
        updateStmt.run(hashedPassword, phone, driver.id);
      }

      console.log(`\nDriver: ${driver.name}`);
      console.log(`Company: ${driver.company_name || 'N/A'}`);
      if (canSetEmail) console.log(`Email: ${email}`);
      console.log(`Phone: ${phone}`);
      console.log(`Password: ${password}`);
      console.log(`License: ${driver.license_number}`);
      console.log('-'.repeat(40));
    } catch (error) {
      console.error(`❌ Error updating driver ${driver.name}: ${error.message}`);
    }
  }

  console.log('\n✅ Driver login fields added successfully!');
  console.log('\n⚠️ In production, change default passwords!');
  console.log('\n🔍 Verify:');
  console.log('sqlite3 bus_booking.db "SELECT id, name, email, phone FROM drivers;"');
} catch (error) {
  console.error('❌ Error:', error);
} finally {
  db.close();
}