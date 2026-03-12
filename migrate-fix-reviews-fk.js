// Migration script to fix foreign key in reviews table
const db = require('better-sqlite3')('bus_booking.db');

// 1. Rename old table
// 2. Create new table with correct FK
// 3. Copy data
// 4. Drop old table
// 5. Rename new table

db.exec(`
PRAGMA foreign_keys=off;

ALTER TABLE reviews RENAME TO reviews_old;

CREATE TABLE reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER,
  company_id INTEGER NOT NULL,
  customer_id INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  review_text TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id),
  FOREIGN KEY (company_id) REFERENCES users(id),
  FOREIGN KEY (customer_id) REFERENCES users(id)
);

INSERT INTO reviews (id, booking_id, company_id, customer_id, rating, review_text, status, created_at)
SELECT id, booking_id, company_id, customer_id, rating, review_text, status, created_at FROM reviews_old;

DROP TABLE reviews_old;

PRAGMA foreign_keys=on;
`);

console.log('Reviews table foreign key fixed to reference users(id) for company_id.');
