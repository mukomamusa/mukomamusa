// scripts/create-boarding-logs-table.js
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'bus_booking.db');
const db = new Database(dbPath);

console.log('📦 Creating boarding_logs table...');

try {
    db.exec(`
        CREATE TABLE IF NOT EXISTS boarding_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            passenger_id INTEGER NOT NULL,
            ticket_number TEXT,
            boarded_by INTEGER NOT NULL,
            boarding_method TEXT DEFAULT 'manual',
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (passenger_id) REFERENCES passengers(id) ON DELETE CASCADE,
            FOREIGN KEY (boarded_by) REFERENCES drivers(id) ON DELETE SET NULL
        )
    `);
    
    console.log('✅ boarding_logs table created successfully!');
    
    // Create index for better query performance
    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_boarding_logs_passenger ON boarding_logs(passenger_id);
        CREATE INDEX IF NOT EXISTS idx_boarding_logs_timestamp ON boarding_logs(timestamp);
    `);
    
    console.log('✅ Indexes created successfully!');
    
} catch (error) {
    console.error('❌ Error creating table:', error);
} finally {
    db.close();
}