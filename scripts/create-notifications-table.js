// scripts/create-notifications-table.js
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'bus_booking.db');
const db = new Database(dbPath);

console.log('📦 Creating notifications tables...');

// Create push_subscriptions table
db.exec(`
  CREATE TABLE IF NOT EXISTS push_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, endpoint)
  )
`);

// Create notifications table for history
db.exec(`
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data TEXT,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    delivered BOOLEAN DEFAULT 0,
    read_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

// Create notification_settings table for user preferences
db.exec(`
  CREATE TABLE IF NOT EXISTS notification_settings (
    user_id INTEGER PRIMARY KEY,
    trip_reminders BOOLEAN DEFAULT 1,
    booking_updates BOOLEAN DEFAULT 1,
    promotions BOOLEAN DEFAULT 0,
    reminder_hours INTEGER DEFAULT 24,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

console.log('✅ Notifications tables created successfully!');

// Insert default settings for existing users
const users = db.prepare('SELECT id FROM users').all();
const insertSetting = db.prepare(`
  INSERT OR IGNORE INTO notification_settings (user_id)
  VALUES (?)
`);

for (const user of users) {
  insertSetting.run(user.id);
}

console.log(`✅ Default settings added for ${users.length} users`);