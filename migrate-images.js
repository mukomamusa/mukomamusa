// Migration script to add image support to the database
// Run with: node migrate-images.js

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'bus_booking.db');
const db = new Database(dbPath);

console.log('🖼️  Starting image support migration...\n');

// Add company_logo_url column to users table (for company logos)
try {
  db.prepare('ALTER TABLE users ADD COLUMN company_logo_url TEXT').run();
  console.log('✅ Added company_logo_url column to users table');
} catch (e) {
  if (e.message.includes('duplicate column')) {
    console.log('ℹ️  company_logo_url column already exists in users table');
  } else {
    console.log('⚠️  Error adding company_logo_url:', e.message);
  }
}

// Create bus_images table
try {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS bus_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bus_id INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      image_type TEXT DEFAULT 'general',
      caption TEXT,
      display_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE
    )
  `).run();
  console.log('✅ Created bus_images table');
} catch (e) {
  if (e.message.includes('already exists')) {
    console.log('ℹ️  bus_images table already exists');
  } else {
    console.log('⚠️  Error creating bus_images table:', e.message);
  }
}

// Create index for better query performance
try {
  db.prepare('CREATE INDEX IF NOT EXISTS idx_bus_images_bus_id ON bus_images(bus_id)').run();
  console.log('✅ Created index on bus_images.bus_id');
} catch (e) {
  console.log('ℹ️  Index may already exist');
}

// Create uploads directories
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'public', 'uploads');
const logosDir = path.join(uploadsDir, 'logos');
const busesDir = path.join(uploadsDir, 'buses');

try {
  fs.mkdirSync(logosDir, { recursive: true });
  fs.mkdirSync(busesDir, { recursive: true });
  console.log('✅ Created upload directories:');
  console.log('   - public/uploads/logos/');
  console.log('   - public/uploads/buses/');
} catch (e) {
  console.log('ℹ️  Upload directories may already exist');
}

console.log('\n🎉 Image support migration completed!\n');

// Show schema info
console.log('📊 Database Schema Update:\n');
console.log('users table:');
console.log('  + logo_url TEXT - Company logo image URL\n');
console.log('bus_images table (NEW):');
console.log('  - id INTEGER PRIMARY KEY');
console.log('  - bus_id INTEGER (FK → buses.id)');
console.log('  - image_url TEXT');
console.log('  - image_type TEXT (general/interior/exterior)');
console.log('  - caption TEXT');
console.log('  - display_order INTEGER');
console.log('  - created_at DATETIME\n');

db.close();
console.log('✅ Database connection closed');
