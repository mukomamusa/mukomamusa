// Database abstraction layer - automatically uses PostgreSQL in production, SQLite in development
import { initializeDatabase as initPostgres, query as queryPostgres, queryOne as queryOnePostgres } from './database-postgres.js';
import Database from 'better-sqlite3';
import path from 'path';

const isProduction = process.env.NODE_ENV === 'production';
const usePostgres = isProduction || process.env.DATABASE_URL;

// Fix: Add proper type annotation
let sqliteDb: Database.Database | null = null;

function getSQLiteDatabase() {
  if (!sqliteDb) {
    const dbPath = path.join(process.cwd(), 'bus_booking.db');
    sqliteDb = new Database(dbPath);
    console.log('✅ Connected to SQLite database');
  }
  return sqliteDb;
}

// Remove 'export' from here - we'll export at the bottom
async function initializeDatabase() {
  if (usePostgres) {
    return await initPostgres();
  } else {
    const db = getSQLiteDatabase();
    
    // Create tables
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'customer',
        company_name TEXT,
        phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS buses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id INTEGER,
        name TEXT NOT NULL,
        license_plate TEXT NOT NULL,
        capacity INTEGER NOT NULL,
        amenities TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (company_id) REFERENCES users (id)
      );
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS routes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bus_id INTEGER,
        driver_id INTEGER,
        origin TEXT NOT NULL,
        destination TEXT NOT NULL,
        departure_time TEXT NOT NULL,
        arrival_time TEXT NOT NULL,
        price REAL NOT NULL,
        date TEXT NOT NULL,
        intermediate_stops TEXT,
        available_seats INTEGER NOT NULL,
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'scheduled', 'cancelled', 'completed', 'departed', 'delayed')),
        cancellation_reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (bus_id) REFERENCES buses (id)
      );
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        route_id INTEGER,
        seats_booked INTEGER NOT NULL,
        seat_numbers TEXT,
        total_amount REAL NOT NULL,
        booking_reference TEXT UNIQUE NOT NULL,
        status TEXT DEFAULT 'confirmed',
        luggage_count INTEGER DEFAULT 0,
        boarding_point TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (route_id) REFERENCES routes (id)
      );
    `);

    console.log('✅ SQLite database initialized successfully');
    return true;
  }
}

// Remove 'export' from here
async function query(sql: string, params: any[] = []) {
  if (usePostgres) {
    return await queryPostgres(sql, params);
  } else {
    const db = getSQLiteDatabase();
    try {
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        return db.prepare(sql).all(params);
      } else {
        const result = db.prepare(sql).run(params);
        return { changes: result.changes, lastInsertRowid: result.lastInsertRowid };
      }
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }
}

// Remove 'export' from here
async function queryOne(sql: string, params: any[] = []) {
  if (usePostgres) {
    return await queryOnePostgres(sql, params);
  } else {
    const db = getSQLiteDatabase();
    try {
      return db.prepare(sql).get(params) || null;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }
}

// Remove 'export' from here
function getSQL() {
  if (usePostgres) {
    return {
      paramPlaceholder: (index: number) => `$${index}`,
      autoIncrement: 'SERIAL PRIMARY KEY',
      datetime: 'TIMESTAMP',
      text: 'VARCHAR(255)',
      real: 'DECIMAL(10,2)',
      currentTimestamp: 'CURRENT_TIMESTAMP'
    };
  } else {
    return {
      paramPlaceholder: () => '?',
      autoIncrement: 'INTEGER PRIMARY KEY AUTOINCREMENT',
      datetime: 'DATETIME',
      text: 'TEXT',
      real: 'REAL',
      currentTimestamp: 'CURRENT_TIMESTAMP'
    };
  }
}

// Create the default db object
const db = {
  prepare: (sql: string) => {
    if (usePostgres) {
      return {
        run: async (...params: any[]) => {
          const result = await queryPostgres(sql, params);
          return { lastInsertRowid: result.insertId, changes: result.rowCount };
        },
        get: async (...params: any[]) => {
          const result = await queryOnePostgres(sql, params);
          return result;
        },
        all: async (...params: any[]) => {
          const result = await queryPostgres(sql, params);
          return result.rows || result;
        }
      };
    } else {
      return getSQLiteDatabase().prepare(sql);
    }
  },
  // FIX: Properly typed transaction function
  transaction: <T>(fn: () => T): T => {
    if (usePostgres) {
      return fn();
    } else {
      return getSQLiteDatabase().transaction(fn)();
    }
  },
  // Add these methods to the db object for convenience
  initializeDatabase,
  query,
  queryOne,
  getSQL
};

// Export everything in one clean section at the end
export {
  initializeDatabase,
  query,
  queryOne,
  getSQL
};

// Default export
export default db;