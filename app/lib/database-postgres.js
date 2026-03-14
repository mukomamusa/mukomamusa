import { Client } from 'pg';

let client = null;

export async function getDatabase() {
  if (!client) {
    client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    try {
      await client.connect();
      console.log('✅ Connected to PostgreSQL database');
    } catch (error) {
      console.error('❌ Failed to connect to PostgreSQL:', error);
      throw error;
    }
  }
  
  return client;
}

export async function query(text, params = []) {
  const db = await getDatabase();
  try {
    const result = await db.query(text, params);
    return result.rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export async function queryOne(text, params = []) {
  const rows = await query(text, params);
  return rows[0] || null;
}

// Initialize database tables
export async function initializeDatabase() {
  console.log('🔄 Initializing PostgreSQL database...');
  
  try {
    // Create users table
    await query(`
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

    // Create buses table
    await query(`
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

    // Create routes table
    await query(`
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

    // Create bookings table
    await query(`
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
    await query(`
      CREATE INDEX IF NOT EXISTS idx_routes_origin_dest ON routes(origin, destination);
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_routes_date ON routes(date);
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_route ON bookings(route_id);
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_reference ON bookings(booking_reference);
    `);

    console.log('✅ PostgreSQL database initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize PostgreSQL database:', error);
    throw error;
  }
}