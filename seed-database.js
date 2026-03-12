const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'bus_booking.db');
const db = new Database(dbPath);

console.log('🌱 Starting enhanced database seed...\n');

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables with enhanced schema
console.log('Creating enhanced tables...');

db.exec(`
  -- Users table with improved fields
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    user_type TEXT NOT NULL CHECK(user_type IN ('customer', 'company', 'admin')),
    
    -- Customer-specific fields
    nrc_number TEXT,
    date_of_birth TEXT,
    gender TEXT CHECK(gender IN ('male', 'female', 'other')),
    address TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    
    -- Company-specific fields
    company_name TEXT,
    license_number TEXT,
    company_registration_number TEXT,
    company_address TEXT,
    company_logo_url TEXT,
    
    -- Account status
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'suspended', 'pending_verification')),
    email_verified INTEGER DEFAULT 0,
    phone_verified INTEGER DEFAULT 0,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Drivers table
  CREATE TABLE IF NOT EXISTS drivers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    license_number TEXT NOT NULL,
    license_type TEXT NOT NULL,
    license_expiry TEXT NOT NULL,
    nrc_number TEXT NOT NULL,
    date_of_birth TEXT,
    address TEXT,
    photo_url TEXT,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'suspended')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Buses table
  CREATE TABLE IF NOT EXISTS buses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    bus_number TEXT NOT NULL,
    bus_name TEXT NOT NULL,
    total_seats INTEGER NOT NULL,
    bus_type TEXT NOT NULL,
    amenities TEXT,
    seat_layout TEXT,
    insurance_expiry TEXT,
    fitness_expiry TEXT,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'maintenance', 'retired')),
    -- Subscription fields
    subscription_status TEXT DEFAULT 'trial' CHECK(subscription_status IN ('trial', 'active', 'expired', 'suspended')),
    trial_end_date TEXT,
    subscription_start_date TEXT,
    subscription_end_date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Routes table
  CREATE TABLE IF NOT EXISTS routes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bus_id INTEGER NOT NULL,
    driver_id INTEGER,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    departure_time TEXT NOT NULL,
    arrival_time TEXT NOT NULL,
    price REAL NOT NULL,
    date TEXT NOT NULL,
    intermediate_stops TEXT,
    available_seats INTEGER NOT NULL,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'cancelled', 'completed', 'departed', 'delayed')),
    cancellation_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL
  );

  -- Bookings table
  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    route_id INTEGER NOT NULL,
    seat_numbers TEXT NOT NULL,
    num_seats INTEGER NOT NULL,
    luggage_count INTEGER DEFAULT 0,
    boarding_point TEXT NOT NULL,
    dropping_point TEXT,
    total_price REAL NOT NULL,
    -- Commission fields
    commission_rate REAL DEFAULT 0.075,
    commission_amount REAL DEFAULT 0,
    company_earnings REAL DEFAULT 0,
    booking_reference TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
    payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending', 'paid', 'refunded', 'partial_refund')),
    booked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    confirmed_at DATETIME,
    cancelled_at DATETIME,
    cancellation_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE
  );

  -- Passengers table
  CREATE TABLE IF NOT EXISTS passengers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    nrc_or_passport TEXT,
    id_type TEXT CHECK(id_type IN ('nrc', 'passport', 'drivers_license', 'other')),
    phone TEXT,
    email TEXT,
    date_of_birth TEXT,
    passenger_type TEXT DEFAULT 'adult' CHECK(passenger_type IN ('adult', 'child', 'infant', 'senior')),
    seat_number INTEGER NOT NULL,
    special_needs TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
  );

  -- Tickets table
  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER NOT NULL,
    passenger_id INTEGER NOT NULL,
    ticket_number TEXT UNIQUE NOT NULL,
    qr_code TEXT,
    seat_number INTEGER NOT NULL,
    status TEXT DEFAULT 'valid' CHECK(status IN ('valid', 'used', 'cancelled', 'expired')),
    boarding_status TEXT DEFAULT 'not_boarded' CHECK(boarding_status IN ('not_boarded', 'boarded', 'missed')),
    boarded_at DATETIME,
    issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (passenger_id) REFERENCES passengers(id) ON DELETE CASCADE
  );

  -- Payments table
  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'ZMW',
    payment_method TEXT NOT NULL CHECK(payment_method IN ('mobile_money', 'bank_transfer', 'card', 'cash', 'wallet')),
    provider TEXT,
    transaction_id TEXT,
    phone_number TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    paid_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
  );

  -- Refunds table
  CREATE TABLE IF NOT EXISTS refunds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER NOT NULL,
    payment_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'processed', 'rejected')),
    processed_by INTEGER,
    refund_method TEXT,
    transaction_id TEXT,
    requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
    FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL
  );

  -- Trip manifests table
  CREATE TABLE IF NOT EXISTS trip_manifests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    route_id INTEGER NOT NULL,
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_passengers INTEGER DEFAULT 0,
    total_boarded INTEGER DEFAULT 0,
    notes TEXT,
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE
  );

  -- Notifications table
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('booking_confirmed', 'booking_cancelled', 'payment_received', 'trip_reminder', 'trip_delayed', 'trip_cancelled', 'refund_processed')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read INTEGER DEFAULT 0,
    sent_via TEXT DEFAULT 'app' CHECK(sent_via IN ('app', 'sms', 'email', 'push')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Create indexes
  CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);
  CREATE INDEX IF NOT EXISTS idx_bookings_route ON bookings(route_id);
  CREATE INDEX IF NOT EXISTS idx_bookings_reference ON bookings(booking_reference);
  CREATE INDEX IF NOT EXISTS idx_routes_date ON routes(date);
  CREATE INDEX IF NOT EXISTS idx_routes_origin_dest ON routes(origin, destination);
  CREATE INDEX IF NOT EXISTS idx_passengers_booking ON passengers(booking_id);
  CREATE INDEX IF NOT EXISTS idx_tickets_booking ON tickets(booking_id);
  CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
  CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

  -- Platform settings table
  CREATE TABLE IF NOT EXISTS platform_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Bus subscriptions table (payment history)
  CREATE TABLE IF NOT EXISTS bus_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bus_id INTEGER NOT NULL,
    company_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    payment_method TEXT DEFAULT 'mobile_money',
    transaction_id TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'failed', 'refunded')),
    paid_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

console.log('✅ Enhanced tables created\n');

// Tracking + notification tables used by realtime GPS features
db.exec(`
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
  );

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
  );

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
  );

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
  );

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

// Insert platform settings
console.log('Inserting platform settings...');

db.exec(`
  INSERT OR IGNORE INTO platform_settings (setting_key, setting_value, description) 
  VALUES ('commission_rate', '0.075', 'Platform commission rate (7.5%)');
  
  INSERT OR IGNORE INTO platform_settings (setting_key, setting_value, description) 
  VALUES ('subscription_price_per_bus', '500', 'Monthly subscription price per bus in ZMW');
  
  INSERT OR IGNORE INTO platform_settings (setting_key, setting_value, description) 
  VALUES ('subscription_trial_days', '14', 'Free trial period in days for new buses');
`);
console.log('✅ Platform settings created\n');

// Hash password
const hashedPassword = bcrypt.hashSync('password123', 10);

// Insert users
console.log('Inserting users...');

const insertCustomer = db.prepare(`
  INSERT OR IGNORE INTO users (email, password, name, phone, user_type, nrc_number, gender, address, emergency_contact_name, emergency_contact_phone, status, email_verified)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertCompany = db.prepare(`
  INSERT OR IGNORE INTO users (email, password, name, phone, user_type, company_name, license_number, company_registration_number, company_address, status, email_verified)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertAdmin = db.prepare(`
  INSERT OR IGNORE INTO users (email, password, name, phone, user_type, status, email_verified)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

// Customer with full details
insertCustomer.run(
  'customer@example.com', hashedPassword, 'John Mwansa', '+260971234567', 'customer',
  '123456/78/1', 'male', '123 Cairo Road, Lusaka',
  'Mary Mwansa', '+260972345678', 'active', 1
);
console.log('✅ Customer user created');

// Companies with registration details
insertCompany.run(
  'info@mazhindubuses.com', hashedPassword, 'Mazhindu Buses', '+260977123456', 'company',
  'Mazhindu Bus Services', 'RTSA-2024-MBS001', 'PACRA-120234567',
  'Plot 1234, Great East Road, Lusaka', 'active', 1
);
console.log('✅ Mazhindu Buses created');

insertCompany.run(
  'info@powertoolstransport.com', hashedPassword, 'Power Tools Transport', '+260966789012', 'company',
  'Power Tools Transport Ltd', 'RTSA-2024-PTT002', 'PACRA-120345678',
  'Shop 45, Independence Ave, Kitwe', 'active', 1
);
console.log('✅ Power Tools Transport created');

insertCompany.run(
  'info@juldanmotors.com', hashedPassword, 'Juldan Motors', '+260955678901', 'company',
  'Juldan Motors Ltd', 'RTSA-2024-JDM003', 'PACRA-120456789',
  'Stand 789, Freedom Way, Ndola', 'active', 1
);
console.log('✅ Juldan Motors created');

// Admin
insertAdmin.run('admin@zambiabus.com', hashedPassword, 'Admin User', '+260977000000', 'admin', 'active', 1);
console.log('✅ Admin user created\n');

// Get company IDs
const companies = db.prepare('SELECT id, company_name FROM users WHERE user_type = ?').all('company');

// Insert drivers for each company
console.log('Inserting drivers...');

const insertDriver = db.prepare(`
  INSERT OR IGNORE INTO drivers (company_id, name, phone, license_number, license_type, license_expiry, nrc_number, date_of_birth, address, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const driverNames = [
  { name: 'Peter Banda', phone: '+260976111222', nrc: '234567/89/1' },
  { name: 'Joseph Mulenga', phone: '+260976222333', nrc: '345678/90/1' },
  { name: 'Michael Tembo', phone: '+260976333444', nrc: '456789/01/1' }
];

companies.forEach((company, index) => {
  const driver = driverNames[index % driverNames.length];
  insertDriver.run(
    company.id, driver.name, driver.phone,
    `PSV-${2024000 + index}`, 'PSV', '2027-12-31',
    driver.nrc, '1985-06-15', 'Lusaka, Zambia', 'active'
  );
  console.log(`✅ Driver ${driver.name} created for ${company.company_name}`);
});

const driverColumns = db.prepare('PRAGMA table_info(drivers)').all().map((column) => column.name);
if (driverColumns.includes('email_verified')) {
  const setClauses = ['email_verified = 1'];
  if (driverColumns.includes('email_verified_at')) {
    setClauses.push('email_verified_at = COALESCE(email_verified_at, CURRENT_TIMESTAMP)');
  }
  if (driverColumns.includes('verification_token')) {
    setClauses.push('verification_token = NULL');
  }

  db.prepare(`
    UPDATE drivers
    SET ${setClauses.join(', ')}
    WHERE status = 'active'
  `).run();

  console.log('✅ Active drivers pre-verified for testing');
}

// Insert buses
console.log('\nInserting buses...');

const busTypes = ['Luxury Coach', 'Semi-Luxury', 'Executive'];

// Calculate trial end date (14 days from now)
const trialEndDate = new Date();
trialEndDate.setDate(trialEndDate.getDate() + 14);
const trialEndDateStr = trialEndDate.toISOString();

const insertBus = db.prepare(`
  INSERT OR IGNORE INTO buses (company_id, bus_number, bus_name, total_seats, bus_type, amenities, seat_layout, insurance_expiry, fitness_expiry, status, subscription_status, trial_end_date)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'trial', ?)
`);

companies.forEach((company, index) => {
  const busNumber = `ABZ ${1000 + index} ZM`;
  const busName = `${company.company_name.split(' ')[0]} Express`;
  const amenities = JSON.stringify(['WiFi', 'AC', 'Reclining Seats', 'USB Charging', 'Blankets']);
  const seatLayout = JSON.stringify({ rows: 13, columns: 4, aisle: 2 });
  const busType = busTypes[index % busTypes.length];
  insertBus.run(
    company.id, busNumber, busName, 52, busType,
    amenities, seatLayout, '2027-03-15', '2026-12-31', 'active', trialEndDateStr
  );
  console.log(`✅ Bus ${busNumber} (${busName}) created for ${company.company_name} with 14-day trial`);
});

// Seed a very small tracking demo set (max 3 buses) for dashboard/API demos
console.log('\nInserting tracking demo data...');

const demoBuses = db.prepare(`
  SELECT b.id, b.company_id, b.bus_number
  FROM buses b
  ORDER BY b.id ASC
  LIMIT 3
`).all();

const routeTemplates = [
  { origin: 'Lusaka', destination: 'Kitwe', depart: '06:30', arrive: '11:30', price: 320 },
  { origin: 'Ndola', destination: 'Lusaka', depart: '07:00', arrive: '12:00', price: 300 },
  { origin: 'Livingstone', destination: 'Lusaka', depart: '05:45', arrive: '12:45', price: 450 },
];

const locationTemplates = [
  [
    { lat: -15.3875, lng: 28.3228, speed: 25, heading: 25 },
    { lat: -15.3102, lng: 28.4101, speed: 48, heading: 31 },
  ],
  [
    { lat: -12.9683, lng: 28.6366, speed: 22, heading: 180 },
    { lat: -13.1514, lng: 28.3450, speed: 55, heading: 186 },
  ],
  [
    { lat: -17.8419, lng: 25.8544, speed: 30, heading: 35 },
    { lat: -16.9765, lng: 27.3311, speed: 60, heading: 41 },
  ],
];

const demoDate = new Date().toISOString().slice(0, 10);
let trackingSeeded = 0;

const selectCompanyDriver = db.prepare(`
  SELECT id, name, phone
  FROM drivers
  WHERE company_id = ?
  ORDER BY id ASC
  LIMIT 1
`);

const selectRoute = db.prepare(`
  SELECT id FROM routes
  WHERE bus_id = ? AND date = ?
  ORDER BY id DESC
  LIMIT 1
`);

const insertRoute = db.prepare(`
  INSERT INTO routes (
    bus_id, driver_id, origin, destination, departure_time,
    arrival_time, price, date, intermediate_stops, available_seats, status
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const selectGpsDevice = db.prepare(`
  SELECT id FROM gps_devices
  WHERE bus_id = ? AND provider = 'ctrack'
  LIMIT 1
`);

const insertGpsDevice = db.prepare(`
  INSERT INTO gps_devices (
    company_id, bus_id, device_imei, device_serial, provider,
    provider_device_id, sim_number, sim_provider, installation_date, status
  ) VALUES (?, ?, ?, ?, 'ctrack', ?, ?, 'airtel', ?, 'active')
`);

const selectTrip = db.prepare(`
  SELECT id FROM trips
  WHERE route_id = ? AND bus_id = ?
    AND status IN ('boarding', 'in_transit', 'delayed')
  ORDER BY id DESC
  LIMIT 1
`);

const insertTrip = db.prepare(`
  INSERT INTO trips (
    route_id, bus_id, driver_id, gps_device_id, booking_count, status,
    scheduled_departure, actual_departure, estimated_arrival,
    current_latitude, current_longitude, current_speed, heading,
    last_location_update, distance_covered_km, distance_remaining_km,
    progress_percentage, weather_conditions, traffic_conditions, geofence_status
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const locationCountForTrip = db.prepare('SELECT COUNT(*) as count FROM bus_locations WHERE trip_id = ?');
const insertLocation = db.prepare(`
  INSERT INTO bus_locations (
    trip_id, bus_id, gps_device_id, latitude, longitude,
    speed, heading, altitude, accuracy, battery_level,
    signal_strength, timestamp, location_source, metadata
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'gps', ?)
`);

const logExists = db.prepare(`
  SELECT id FROM notification_log
  WHERE trip_id = ? AND event_type = 'trip_started' AND user_id = ?
  LIMIT 1
`);

const insertNotificationLog = db.prepare(`
  INSERT INTO notification_log (
    trip_id, user_id, channel, event_type, recipient, message, status, sent_at
  ) VALUES (?, ?, 'in_app', 'trip_started', ?, ?, 'sent', CURRENT_TIMESTAMP)
`);

demoBuses.forEach((bus, index) => {
  const tpl = routeTemplates[index % routeTemplates.length];
  const driver = selectCompanyDriver.get(bus.company_id);
  const user = db.prepare('SELECT id, phone FROM users WHERE id = ?').get(bus.company_id);

  if (!driver || !user) {
    return;
  }

  let route = selectRoute.get(bus.id, demoDate);
  if (!route) {
    const routeRes = insertRoute.run(
      bus.id,
      driver.id,
      tpl.origin,
      tpl.destination,
      tpl.depart,
      tpl.arrive,
      tpl.price,
      demoDate,
      JSON.stringify(['Kapiri Mposhi']),
      52,
      'scheduled'
    );
    route = { id: Number(routeRes.lastInsertRowid) };
  }

  let gpsDevice = selectGpsDevice.get(bus.id);
  if (!gpsDevice) {
    const imei = `35700000000${String(bus.id).padStart(3, '0')}`;
    const serial = `CTRACK-${String(bus.id).padStart(4, '0')}`;
    const providerDeviceId = `ct-${bus.id}`;
    const sim = `26097${String(bus.id).padStart(6, '0')}`;
    const deviceRes = insertGpsDevice.run(
      bus.company_id,
      bus.id,
      imei,
      serial,
      providerDeviceId,
      sim,
      demoDate
    );
    gpsDevice = { id: Number(deviceRes.lastInsertRowid) };
  }

  const coords = locationTemplates[index % locationTemplates.length];
  let trip = selectTrip.get(route.id, bus.id);
  if (!trip) {
    const tripRes = insertTrip.run(
      route.id,
      bus.id,
      driver.id,
      gpsDevice.id,
      0,
      'in_transit',
      `${demoDate}T${tpl.depart}:00`,
      `${demoDate}T${tpl.depart}:10`,
      `${demoDate}T${tpl.arrive}:00`,
      coords[1].lat,
      coords[1].lng,
      coords[1].speed,
      coords[1].heading,
      new Date().toISOString(),
      45,
      155,
      22,
      'clear',
      'normal',
      'en_route'
    );
    trip = { id: Number(tripRes.lastInsertRowid) };
  }

  const locCount = locationCountForTrip.get(trip.id).count;
  if (locCount === 0) {
    const now = Date.now();
    coords.forEach((point, pIdx) => {
      const ts = new Date(now - (coords.length - pIdx) * 5 * 60 * 1000).toISOString();
      insertLocation.run(
        trip.id,
        bus.id,
        gpsDevice.id,
        point.lat,
        point.lng,
        point.speed,
        point.heading,
        1250,
        8,
        78,
        4,
        ts,
        JSON.stringify({ demo: true, source: 'seed' })
      );
    });
  }

  if (!logExists.get(trip.id, user.id)) {
    insertNotificationLog.run(
      trip.id,
      user.id,
      user.phone || `company-${user.id}`,
      `Trip started for bus ${bus.bus_number} from ${tpl.origin} to ${tpl.destination}`
    );
  }

  trackingSeeded += 1;
});

console.log(`✅ Tracking demo seeded for ${trackingSeeded} buses (max 3)`);
console.log('\n✅ Database seeded successfully!\n');

// Show summary
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
const busCount = db.prepare('SELECT COUNT(*) as count FROM buses').get();
const driverCount = db.prepare('SELECT COUNT(*) as count FROM drivers').get();
const gpsDeviceCount = db.prepare('SELECT COUNT(*) as count FROM gps_devices').get();
const trackingTripCount = db.prepare('SELECT COUNT(*) as count FROM trips').get();
const locationCount = db.prepare('SELECT COUNT(*) as count FROM bus_locations').get();
const notificationLogCount = db.prepare('SELECT COUNT(*) as count FROM notification_log').get();

console.log('📊 Summary:');
console.log(`   Users: ${userCount.count}`);
console.log(`   Drivers: ${driverCount.count}`);
console.log(`   Buses: ${busCount.count}`);
console.log(`   GPS Devices: ${gpsDeviceCount.count}`);
console.log(`   Tracking Trips: ${trackingTripCount.count}`);
console.log(`   Bus Locations: ${locationCount.count}`);
console.log(`   Notification Logs: ${notificationLogCount.count}`);
console.log('\n📋 Tables Created:');
console.log('   • users (customers, companies, admins)');
console.log('   • drivers (PSV licensed drivers)');
console.log('   • buses (fleet with layouts + subscriptions)');
console.log('   • routes (trips with driver assignments)');
console.log('   • bookings (reservations + commission tracking)');
console.log('   • passengers (individual traveler details)');
console.log('   • tickets (individual tickets with QR)');
console.log('   • payments (transactions)');
console.log('   • refunds (cancellation handling)');
console.log('   • trip_manifests (boarding lists)');
console.log('   • notifications (user alerts)');
console.log('   • platform_settings (commission rate, subscription pricing)');
console.log('   • bus_subscriptions (payment history)');
console.log('\n🔐 Demo Credentials:');
console.log('   Customer: customer@example.com / password123');
console.log('     NRC: 123456/78/1');
console.log('   Company: info@mazhindubuses.com / password123');
console.log('     License: RTSA-2024-MBS001');
console.log('   Admin: admin@zambiabus.com / password123');
console.log('\n💰 Platform Settings:');
console.log('   Commission Rate: 7.5%');
console.log('   Subscription Price: K500/bus/month');
console.log('   Trial Period: 14 days');

db.close();
console.log('\n✨ Database ready for use!');