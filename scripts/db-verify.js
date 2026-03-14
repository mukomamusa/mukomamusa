const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dbPath = path.join(process.cwd(), 'bus_booking.db');

const requiredTables = [
  'users',
  'buses',
  'routes',
  'bookings',
  'drivers',
  'gps_devices',
  'trips',
  'bus_locations',
  'notification_preferences',
  'notification_log',
  'geofence_zones'
];

const requiredIndexes = [
  'idx_gps_devices_bus',
  'idx_gps_devices_provider',
  'idx_trips_bus',
  'idx_trips_route',
  'idx_trips_status',
  'idx_bus_locations_trip',
  'idx_bus_locations_bus',
  'idx_bus_locations_recorded',
  'idx_notification_log_trip',
  'idx_notification_log_user'
];

function queryNames(sql) {
  const escaped = sql.replace(/"/g, '\\"');
  const out = execSync(`sqlite3 -csv \"${dbPath}\" \"${escaped}\"`, {
    stdio: 'pipe',
    encoding: 'utf8'
  }).trim();

  if (!out) return new Set();
  return new Set(out.split('\n').map((line) => line.trim()).filter(Boolean));
}

console.log('Verifying DB schema...');
console.log(`DB path: ${dbPath}`);

if (!fs.existsSync(dbPath)) {
  console.error('DB file not found. Run: npm run db:init');
  process.exit(1);
}

try {
  const tableSet = queryNames("SELECT name FROM sqlite_master WHERE type='table'");
  const indexSet = queryNames("SELECT name FROM sqlite_master WHERE type='index'");

  const missingTables = requiredTables.filter((name) => !tableSet.has(name));
  const missingIndexes = requiredIndexes.filter((name) => !indexSet.has(name));

  if (missingTables.length === 0 && missingIndexes.length === 0) {
    console.log('DB verify passed. All required tables/indexes are present.');
    process.exit(0);
  }

  if (missingTables.length > 0) {
    console.error('Missing tables:');
    for (const table of missingTables) {
      console.error(`- ${table}`);
    }
  }

  if (missingIndexes.length > 0) {
    console.error('Missing indexes:');
    for (const index of missingIndexes) {
      console.error(`- ${index}`);
    }
  }

  console.error('DB verify failed. Run: npm run db:init');
  process.exit(1);
} catch (error) {
  console.error('DB verify failed:', error.message);
  process.exit(1);
}
