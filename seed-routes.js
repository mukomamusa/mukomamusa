const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');
const db = new Database(dbPath);

console.log('🚌 Adding routes to database...\n');

// Get all buses
const buses = db.prepare('SELECT id, bus_number, capacity FROM buses').all();

if (buses.length === 0) {
  console.log('❌ No buses found. Please run seed-database.js first.');
  process.exit(1);
}

// Popular routes in Zambia
const routeTemplates = [
  { origin: 'Lusaka', destination: 'Ndola', departure: '06:00', arrival: '10:00', price: 250 },
  { origin: 'Lusaka', destination: 'Kitwe', departure: '07:00', arrival: '11:30', price: 280 },
  { origin: 'Lusaka', destination: 'Livingstone', departure: '05:00', arrival: '11:00', price: 350 },
  { origin: 'Ndola', destination: 'Lusaka', departure: '14:00', arrival: '18:00', price: 250 },
  { origin: 'Kitwe', destination: 'Lusaka', departure: '15:00', arrival: '19:30', price: 280 },
  { origin: 'Livingstone', destination: 'Lusaka', departure: '13:00', arrival: '19:00', price: 350 },
  { origin: 'Lusaka', destination: 'Chipata', departure: '06:30', arrival: '14:30', price: 400 },
  { origin: 'Lusaka', destination: 'Mongu', departure: '05:30', arrival: '13:30', price: 380 },
  { origin: 'Lusaka', destination: 'Kasama', departure: '04:00', arrival: '16:00', price: 500 },
  { origin: 'Ndola', destination: 'Kitwe', departure: '08:00', arrival: '09:00', price: 80 },
];

const insertRoute = db.prepare(`
  INSERT INTO routes (bus_id, origin, destination, departure_time, arrival_time, price, available_seats, date)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

let routeCount = 0;

// Create routes for the next 7 days
const today = new Date();
for (let day = 0; day < 7; day++) {
  const date = new Date(today);
  date.setDate(date.getDate() + day);
  const dateStr = date.toISOString().split('T')[0];
  
  console.log(`Adding routes for ${dateStr}...`);
  
  // Assign routes to buses
  routeTemplates.forEach((route, index) => {
    const bus = buses[index % buses.length];
    insertRoute.run(
      bus.id,
      route.origin,
      route.destination,
      route.departure,
      route.arrival,
      route.price,
      bus.capacity,
      dateStr
    );
    routeCount++;
  });
}

console.log(`\n✅ Added ${routeCount} routes successfully!\n`);

// Show summary
const routeSummary = db.prepare(`
  SELECT origin, destination, COUNT(*) as count
  FROM routes
  GROUP BY origin, destination
  ORDER BY count DESC
  LIMIT 5
`).all();

console.log('📊 Top Routes:');
routeSummary.forEach(route => {
  console.log(`   ${route.origin} → ${route.destination}: ${route.count} trips`);
});

db.close();