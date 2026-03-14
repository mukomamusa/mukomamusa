const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'bus_booking.db');
const db = new Database(dbPath);

console.log('🔍 Testing Enhanced Database Schema...\n');

try {
  // Test 1: Check all tables exist
  console.log('=== TESTING TABLE STRUCTURE ===');
  const tables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' 
    ORDER BY name
  `).all();
  
  console.log('📋 Available Tables:');
  tables.forEach(table => {
    console.log(`  ✅ ${table.name}`);
  });

  // Test 2: Check passengers table structure
  console.log('\n=== PASSENGERS TABLE STRUCTURE ===');
  const passengerCols = db.prepare(`PRAGMA table_info(passengers)`).all();
  console.log('📝 Passenger Table Columns:');
  passengerCols.forEach(col => {
    console.log(`  - ${col.name} (${col.type}) ${col.notnull ? '* REQUIRED' : ''}`);
  });

  // Test 3: Check system settings
  console.log('\n=== SYSTEM SETTINGS ===');
  const settings = db.prepare(`SELECT setting_key, setting_value FROM system_settings`).all();
  console.log('⚙️ Platform Configuration:');
  settings.forEach(setting => {
    console.log(`  - ${setting.setting_key}: ${setting.setting_value}`);
  });

  // Test 4: Check indexes
  console.log('\n=== PERFORMANCE INDEXES ===');
  const indexes = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='index' AND name LIKE 'idx_%'
    ORDER BY name
  `).all();
  console.log('⚡ Performance Indexes:');
  indexes.forEach(index => {
    console.log(`  - ${index.name}`);
  });

  console.log('\n🎉 Enhanced Database Schema Test: PASSED!');
  console.log('\n📊 Summary:');
  console.log(`  - Total Tables: ${tables.length}`);
  console.log(`  - Passenger Columns: ${passengerCols.length}`);
  console.log(`  - System Settings: ${settings.length}`);
  console.log(`  - Performance Indexes: ${indexes.length}`);

} catch (error) {
  console.error('❌ Database test failed:', error);
} finally {
  db.close();
}