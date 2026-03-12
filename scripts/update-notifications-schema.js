// scripts/update-notifications-schema.js
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'bus_booking.db');
const db = new Database(dbPath);

console.log('🔧 Updating notifications table schema...');

try {
    // Start transaction
    db.exec('BEGIN TRANSACTION');

    // Create new table with updated schema
    db.exec(`
        CREATE TABLE notifications_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            type TEXT NOT NULL CHECK(type IN (
                'booking_confirmed', 
                'booking_cancelled', 
                'payment_received', 
                'trip_reminder', 
                'trip_delayed', 
                'trip_cancelled', 
                'refund_processed',
                'boarding',
                'test'
            )),
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            read INTEGER DEFAULT 0,
            sent_via TEXT DEFAULT 'app' CHECK(sent_via IN (
                'app',
                'sms',
                'email',
                'push',
                'whatsapp',
                'telegram',
                'messenger',
                'signal',
                'slack',
                'webhook'
            )),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            data TEXT,
            sent_at DATETIME,
            delivered BOOLEAN DEFAULT 0,
            read_at DATETIME,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);

    // Copy data from old table
    db.exec(`
        INSERT INTO notifications_new (
            id, user_id, type, title, message, read, sent_via, 
            created_at, data, sent_at, delivered, read_at
        )
        SELECT 
            id, user_id, type, title, message, read, sent_via,
            created_at, data, sent_at, delivered, read_at
        FROM notifications
    `);

    // Drop old table
    db.exec('DROP TABLE notifications');

    // Rename new table
    db.exec('ALTER TABLE notifications_new RENAME TO notifications');

    // Recreate indexes
    db.exec('CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_notifications_sent_via ON notifications(sent_via)');

    // Commit transaction
    db.exec('COMMIT');

    console.log('✅ Notifications table schema updated successfully!');
    console.log('\n📱 Added sent_via options:');
    console.log('   • whatsapp - WhatsApp integration');
    console.log('   • telegram - Telegram bot');
    console.log('   • messenger - Facebook Messenger');
    console.log('   • signal - Signal app');
    console.log('   • slack - Slack (for company notifications)');
    console.log('   • webhook - Generic webhook for integrations');

} catch (error) {
    // Rollback on error
    db.exec('ROLLBACK');
    console.error('❌ Error updating notifications table:', error);
} finally {
    db.close();
}