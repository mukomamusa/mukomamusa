const sqlite3 = require('sqlite3').verbose();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Migration script to convert SQLite to PostgreSQL
async function migrateToPostgres() {
  console.log('🔄 Starting migration from SQLite to PostgreSQL...');
  
  // Read SQLite database
  const dbPath = path.join(__dirname, 'bus_booking.db');
  
  if (!fs.existsSync(dbPath)) {
    console.log('❌ SQLite database not found. Running seed script first...');
    // Run the seed script to create SQLite database
    require('./app/lib/seed.js');
  }

  const sqlite = new sqlite3.Database(dbPath);
  
  // PostgreSQL connection (will be set via environment variable)
  const postgres = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await postgres.connect();
    console.log('✅ Connected to PostgreSQL');

    // Create tables in PostgreSQL
    console.log('📋 Creating tables...');
    
    await postgres.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'customer',
        company_name VARCHAR(255),
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await postgres.query(`
      CREATE TABLE IF NOT EXISTS buses (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES users(id),
        name VARCHAR(255) NOT NULL,
        license_plate VARCHAR(50) NOT NULL,
        capacity INTEGER NOT NULL,
        amenities TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await postgres.query(`
      CREATE TABLE IF NOT EXISTS routes (
        id SERIAL PRIMARY KEY,
        bus_id INTEGER REFERENCES buses(id),
        origin VARCHAR(255) NOT NULL,
        destination VARCHAR(255) NOT NULL,
        departure_time TIME NOT NULL,
        arrival_time TIME NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        date DATE NOT NULL,
        available_seats INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await postgres.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        route_id INTEGER REFERENCES routes(id),
        seats_booked INTEGER NOT NULL,
        seat_numbers TEXT,
        total_amount DECIMAL(10,2) NOT NULL,
        booking_reference VARCHAR(50) UNIQUE NOT NULL,
        status VARCHAR(50) DEFAULT 'confirmed',
        luggage_count INTEGER DEFAULT 0,
        boarding_point VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for better performance
    await postgres.query(`
      CREATE INDEX IF NOT EXISTS idx_routes_origin_dest ON routes(origin, destination);
      CREATE INDEX IF NOT EXISTS idx_routes_date ON routes(date);
      CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_route ON bookings(route_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_reference ON bookings(booking_reference);
    `);

    console.log('✅ Tables created successfully');

    // Migrate data
    console.log('📊 Migrating data...');

    // Migrate users
    const users = await new Promise((resolve, reject) => {
      sqlite.all("SELECT * FROM users", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    for (const user of users) {
      await postgres.query(`
        INSERT INTO users (id, email, password, name, role, company_name, phone, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (email) DO NOTHING
      `, [user.id, user.email, user.password, user.name, user.role, user.company_name, user.phone, user.created_at]);
    }

    // Migrate buses
    const buses = await new Promise((resolve, reject) => {
      sqlite.all("SELECT * FROM buses", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    for (const bus of buses) {
      await postgres.query(`
        INSERT INTO buses (id, company_id, name, license_plate, capacity, amenities, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO NOTHING
      `, [bus.id, bus.company_id, bus.name, bus.license_plate, bus.capacity, bus.amenities, bus.created_at]);
    }

    // Migrate routes
    const routes = await new Promise((resolve, reject) => {
      sqlite.all("SELECT * FROM routes", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    for (const route of routes) {
      await postgres.query(`
        INSERT INTO routes (id, bus_id, origin, destination, departure_time, arrival_time, price, date, available_seats, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO NOTHING
      `, [route.id, route.bus_id, route.origin, route.destination, route.departure_time, route.arrival_time, route.price, route.date, route.available_seats, route.created_at]);
    }

    // Migrate bookings
    const bookings = await new Promise((resolve, reject) => {
      sqlite.all("SELECT * FROM bookings", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    for (const booking of bookings) {
      await postgres.query(`
        INSERT INTO bookings (id, user_id, route_id, seats_booked, seat_numbers, total_amount, booking_reference, status, luggage_count, boarding_point, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (booking_reference) DO NOTHING
      `, [booking.id, booking.user_id, booking.route_id, booking.seats_booked, booking.seat_numbers, booking.total_amount, booking.booking_reference, booking.status, booking.luggage_count, booking.boarding_point, booking.created_at]);
    }

    // Update sequences to match the migrated data
    await postgres.query(`
      SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
      SELECT setval('buses_id_seq', (SELECT MAX(id) FROM buses));
      SELECT setval('routes_id_seq', (SELECT MAX(id) FROM routes));
      SELECT setval('bookings_id_seq', (SELECT MAX(id) FROM bookings));
    `);

    console.log('✅ Data migration completed successfully');
    console.log(`📊 Migrated ${users.length} users, ${buses.length} buses, ${routes.length} routes, ${bookings.length} bookings`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await postgres.end();
    sqlite.close();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateToPostgres().catch(console.error);
}

module.exports = migrateToPostgres;