// scripts/migrate-agents.js
// Migration script to ensure agents table has required columns

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'bus_booking.db');
const db = new Database(dbPath);

console.log('Running agents table migration...');

try {
  // Check if agents table exists
  const tableInfo = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='agents'").get();
  
  if (!tableInfo) {
    console.log('Creating agents table...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS agents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        business_name TEXT NOT NULL,
        business_type TEXT NOT NULL DEFAULT 'independent',
        contact_name TEXT NOT NULL,
        contact_phone TEXT NOT NULL,
        contact_email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        commission_rate REAL NOT NULL DEFAULT 7.5,
        commission_type TEXT NOT NULL DEFAULT 'percentage',
        fixed_commission_amount REAL DEFAULT 0,
        can_sell_all_companies INTEGER NOT NULL DEFAULT 1,
        restricted_companies TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        verified INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        nrc_number TEXT,
        address TEXT,
        city TEXT
      );
    `);
    console.log('Agents table created successfully');
  } else {
    console.log('Agents table exists, checking columns...');
    
    // Check for required columns
    const columns = db.prepare("PRAGMA table_info(agents)").all();
    const columnNames = columns.map(c => c.name);
    
    // Add missing columns
    const migrations = [
      { name: 'nrc_number', sql: 'ALTER TABLE agents ADD COLUMN nrc_number TEXT' },
      { name: 'address', sql: 'ALTER TABLE agents ADD COLUMN address TEXT' },
      { name: 'city', sql: 'ALTER TABLE agents ADD COLUMN city TEXT NOT NULL DEFAULT \'Unknown\'' },
      { name: 'province', sql: 'ALTER TABLE agents ADD COLUMN province TEXT NOT NULL DEFAULT \'Unknown\'' },
      { name: 'physical_address', sql: 'ALTER TABLE agents ADD COLUMN physical_address TEXT NOT NULL DEFAULT \'\'' },
      { name: 'commission_rate', sql: 'ALTER TABLE agents ADD COLUMN commission_rate REAL NOT NULL DEFAULT 7.5' },
      { name: 'commission_type', sql: 'ALTER TABLE agents ADD COLUMN commission_type TEXT NOT NULL DEFAULT \'percentage\'' },
      { name: 'fixed_commission_amount', sql: 'ALTER TABLE agents ADD COLUMN fixed_commission_amount REAL DEFAULT 0' },
      { name: 'can_sell_all_companies', sql: 'ALTER TABLE agents ADD COLUMN can_sell_all_companies INTEGER NOT NULL DEFAULT 1' },
      { name: 'restricted_companies', sql: 'ALTER TABLE agents ADD COLUMN restricted_companies TEXT' },
      { name: 'status', sql: 'ALTER TABLE agents ADD COLUMN status TEXT NOT NULL DEFAULT \'pending\'' },
      { name: 'verified', sql: 'ALTER TABLE agents ADD COLUMN verified INTEGER NOT NULL DEFAULT 0' },
      { name: 'last_login', sql: 'ALTER TABLE agents ADD COLUMN last_login DATETIME' }
    ];
    
    for (const mig of migrations) {
      if (!columnNames.includes(mig.name)) {
        console.log(`Adding column: ${mig.name}`);
        db.exec(mig.sql);
      }
    }
    
    console.log('Migration complete!');
  }
  
  // Show final table structure
  console.log('\nFinal agents table structure:');
  const finalColumns = db.prepare("PRAGMA table_info(agents)").all();
  console.log(finalColumns.map(c => c.name).join(', '));
  
} catch (error) {
  console.error('Migration error:', error);
} finally {
  db.close();
}
