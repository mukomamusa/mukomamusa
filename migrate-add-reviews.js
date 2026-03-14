// Migration script to add reviews table and new columns
const db = require('better-sqlite3')('bus_booking.db');
db.prepare(`
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER,
  company_id INTEGER NOT NULL,
  customer_id INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  review_text TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  company_response TEXT,
  responded_at DATETIME,
  admin_feedback TEXT,
  FOREIGN KEY (booking_id) REFERENCES bookings(id),
  FOREIGN KEY (company_id) REFERENCES companies(id),
  FOREIGN KEY (customer_id) REFERENCES users(id)
);
`).run();

// Add columns if they do not exist (for existing tables)
const pragma = db.prepare("PRAGMA table_info(reviews)").all();
const columns = pragma.map(col => col.name);
if (!columns.includes('company_response')) {
  db.prepare("ALTER TABLE reviews ADD COLUMN company_response TEXT").run();
  console.log('Added company_response column to reviews table.');
}
if (!columns.includes('responded_at')) {
  db.prepare("ALTER TABLE reviews ADD COLUMN responded_at DATETIME").run();
  console.log('Added responded_at column to reviews table.');
}
if (!columns.includes('admin_feedback')) {
  db.prepare("ALTER TABLE reviews ADD COLUMN admin_feedback TEXT").run();
  console.log('Added admin_feedback column to reviews table.');
}
console.log('Reviews table created/verified and columns updated.');
