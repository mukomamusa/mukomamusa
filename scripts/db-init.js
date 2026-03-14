const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dbPath = path.join(process.cwd(), 'bus_booking.db');

function runSql(sql) {
  const escaped = sql.replace(/"/g, '\\"');
  execSync(`sqlite3 \"${dbPath}\" \"${escaped}\"`, { stdio: 'pipe' });
}

function queryRows(sql) {
  const escaped = sql.replace(/"/g, '\\"');
  const out = execSync(`sqlite3 -header -csv \"${dbPath}\" \"${escaped}\"`, {
    stdio: 'pipe',
    encoding: 'utf8'
  }).trim();

  if (!out) return [];

  const lines = out.split('\n');
  if (lines.length <= 1) return [];

  const headers = lines[0].split(',');
  return lines.slice(1).map((line) => {
    const values = line.split(',');
    const row = {};
    headers.forEach((h, i) => {
      row[h] = values[i] ?? '';
    });
    return row;
  });
}

function tableExists(tableName) {
  const rows = queryRows(`SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`);
  return rows.length > 0;
}

function columnExists(tableName, columnName) {
  const rows = queryRows(`PRAGMA table_info(${tableName})`);
  return rows.some((r) => r.name === columnName);
}

function addColumnIfMissing(tableName, columnName, alterSql) {
  if (!tableExists(tableName)) return;
  if (!columnExists(tableName, columnName)) {
    runSql(alterSql);
    console.log(`+ ${tableName}.${columnName}`);
  }
}

console.log('Initializing/migrating DB...');
console.log(`DB path: ${dbPath}`);

try {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, '');
  }

  runSql('PRAGMA foreign_keys = ON');

  if (tableExists('bookings')) {
    addColumnIfMissing('bookings', 'commission_rate', "ALTER TABLE bookings ADD COLUMN commission_rate REAL DEFAULT 0.075");
    addColumnIfMissing('bookings', 'commission_amount', "ALTER TABLE bookings ADD COLUMN commission_amount REAL DEFAULT 0");
    addColumnIfMissing('bookings', 'company_earnings', "ALTER TABLE bookings ADD COLUMN company_earnings REAL DEFAULT 0");
  }

  if (tableExists('buses')) {
    addColumnIfMissing('buses', 'subscription_status', "ALTER TABLE buses ADD COLUMN subscription_status TEXT DEFAULT 'trial'");
    addColumnIfMissing('buses', 'subscription_start_date', "ALTER TABLE buses ADD COLUMN subscription_start_date DATETIME");
    addColumnIfMissing('buses', 'subscription_end_date', "ALTER TABLE buses ADD COLUMN subscription_end_date DATETIME");
    addColumnIfMissing('buses', 'trial_end_date', "ALTER TABLE buses ADD COLUMN trial_end_date DATETIME");
  }

  if (tableExists('users')) {
    addColumnIfMissing('users', 'two_factor_enabled', "ALTER TABLE users ADD COLUMN two_factor_enabled INTEGER DEFAULT 0");
    addColumnIfMissing('users', 'two_factor_secret', "ALTER TABLE users ADD COLUMN two_factor_secret TEXT");
    addColumnIfMissing('users', 'password_reset_token', "ALTER TABLE users ADD COLUMN password_reset_token TEXT");
    addColumnIfMissing('users', 'password_reset_expires', "ALTER TABLE users ADD COLUMN password_reset_expires DATETIME");
    addColumnIfMissing('users', 'google_id', "ALTER TABLE users ADD COLUMN google_id TEXT");
    addColumnIfMissing('users', 'auth_provider', "ALTER TABLE users ADD COLUMN auth_provider TEXT DEFAULT 'local'");
  }

  runSql(`
    CREATE TABLE IF NOT EXISTS gps_devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL,
      bus_id INTEGER NOT NULL,
      device_imei TEXT UNIQUE,
      device_serial TEXT,
      provider TEXT DEFAULT 'ctrack' CHECK(provider IN ('ctrack', 'tramigo', 'ruptela', 'teltonika', 'custom_api', 'driver_app')),
      provider_device_id TEXT,
      sim_number TEXT,
      sim_provider TEXT,
      installation_date TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'maintenance', 'offline')),
      last_heartbeat DATETIME,
      config_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE,
      UNIQUE(bus_id, provider)
    )
  `);

  runSql(`
    CREATE TABLE IF NOT EXISTS trips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      route_id INTEGER NOT NULL,
      bus_id INTEGER NOT NULL,
      driver_id INTEGER,
      gps_device_id INTEGER,
      booking_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'boarding', 'in_transit', 'delayed', 'arrived', 'completed', 'cancelled')),
      scheduled_departure DATETIME,
      actual_departure DATETIME,
      estimated_arrival DATETIME,
      actual_arrival DATETIME,
      current_latitude REAL,
      current_longitude REAL,
      current_speed REAL,
      heading REAL,
      last_location_update DATETIME,
      delay_minutes INTEGER DEFAULT 0,
      distance_covered_km REAL DEFAULT 0,
      distance_remaining_km REAL,
      progress_percentage REAL DEFAULT 0,
      weather_conditions TEXT,
      traffic_conditions TEXT,
      geofence_status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
      FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE,
      FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL,
      FOREIGN KEY (gps_device_id) REFERENCES gps_devices(id)
    )
  `);

  runSql(`
    CREATE TABLE IF NOT EXISTS bus_locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL,
      bus_id INTEGER NOT NULL,
      gps_device_id INTEGER,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      speed REAL DEFAULT 0,
      heading REAL,
      altitude REAL,
      accuracy REAL,
      battery_level REAL,
      signal_strength REAL,
      timestamp DATETIME NOT NULL,
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      location_source TEXT DEFAULT 'gps' CHECK(location_source IN ('gps', 'cell_tower', 'wifi', 'manual')),
      metadata TEXT,
      FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
      FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE,
      FOREIGN KEY (gps_device_id) REFERENCES gps_devices(id)
    )
  `);

  runSql(`
    CREATE TABLE IF NOT EXISTS notification_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      trip_updates BOOLEAN DEFAULT 1,
      delay_alerts BOOLEAN DEFAULT 1,
      arrival_notifications BOOLEAN DEFAULT 1,
      geofence_alerts BOOLEAN DEFAULT 0,
      sms_enabled BOOLEAN DEFAULT 1,
      push_enabled BOOLEAN DEFAULT 1,
      whatsapp_enabled BOOLEAN DEFAULT 0,
      email_enabled BOOLEAN DEFAULT 0,
      preferred_language TEXT DEFAULT 'en' CHECK(preferred_language IN ('en', 'bem', 'nya')),
      quiet_hours_start TIME,
      quiet_hours_end TIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  runSql(`
    CREATE TABLE IF NOT EXISTS notification_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER,
      booking_id INTEGER,
      user_id INTEGER NOT NULL,
      channel TEXT NOT NULL CHECK(channel IN ('sms', 'push', 'whatsapp', 'email', 'in_app')),
      event_type TEXT NOT NULL,
      recipient TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'sent', 'delivered', 'failed', 'read')),
      external_id TEXT,
      sent_at DATETIME,
      delivered_at DATETIME,
      read_at DATETIME,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (trip_id) REFERENCES trips(id),
      FOREIGN KEY (booking_id) REFERENCES bookings(id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  runSql(`
    CREATE TABLE IF NOT EXISTS geofence_zones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('terminal', 'pickup', 'dropoff', 'checkpoint', 'city_boundary')),
      center_latitude REAL NOT NULL,
      center_longitude REAL NOT NULL,
      radius_meters REAL NOT NULL,
      route_id INTEGER,
      city TEXT,
      is_active BOOLEAN DEFAULT 1,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  runSql(`
    CREATE INDEX IF NOT EXISTS idx_gps_devices_bus ON gps_devices(bus_id);
    CREATE INDEX IF NOT EXISTS idx_gps_devices_provider ON gps_devices(provider);
    CREATE INDEX IF NOT EXISTS idx_trips_bus ON trips(bus_id);
    CREATE INDEX IF NOT EXISTS idx_trips_route ON trips(route_id);
    CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
    CREATE INDEX IF NOT EXISTS idx_bus_locations_trip ON bus_locations(trip_id);
    CREATE INDEX IF NOT EXISTS idx_bus_locations_bus ON bus_locations(bus_id);
    CREATE INDEX IF NOT EXISTS idx_bus_locations_recorded ON bus_locations(recorded_at);
    CREATE INDEX IF NOT EXISTS idx_notification_log_trip ON notification_log(trip_id);
    CREATE INDEX IF NOT EXISTS idx_notification_log_user ON notification_log(user_id);
  `);

  console.log('DB init/migration complete.');
} catch (error) {
  console.error('DB init failed:', error.message);
  process.exit(1);
}
