// scripts/create-driver-audit-logs.js
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'bus_booking.db');
const db = new Database(dbPath);

console.log('📦 Creating driver_audit_logs table...');

try {
    // Create driver_audit_logs table
    db.exec(`
        CREATE TABLE IF NOT EXISTS driver_audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            driver_id INTEGER NOT NULL,
            action TEXT NOT NULL,
            old_value TEXT,
            new_value TEXT,
            ip_address TEXT,
            user_agent TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
        )
    `);

    console.log('✅ driver_audit_logs table created successfully!');

    // Create indexes for better performance
    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_audit_driver ON driver_audit_logs(driver_id);
        CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON driver_audit_logs(timestamp);
        CREATE INDEX IF NOT EXISTS idx_audit_action ON driver_audit_logs(action);
    `);

    console.log('✅ Indexes created successfully!');

    // Verify table structure
    const tableInfo = db.prepare("PRAGMA table_info(driver_audit_logs)").all();
    console.log('\n📋 Table structure:');
    console.table(tableInfo.map(col => ({
        column: col.name,
        type: col.type,
        notnull: col.notnull ? 'YES' : 'NO',
        pk: col.pk ? 'YES' : 'NO'
    })));

} catch (error) {
    console.error('❌ Error creating table:', error);
} finally {
    db.close();
}