const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'bus_booking.db');
console.log('Database path:', dbPath);

try {
  const db = new Database(dbPath);
  
  console.log('\n=== ROUTES TABLE ANALYSIS ===');
  
  // First, let's check what tables exist
  const tables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' 
    ORDER BY name
  `).all();
  
  console.log('Available tables:', tables.map(t => t.name).join(', '));
  
  // Check routes table structure
  const routeColumns = db.prepare(`PRAGMA table_info(routes)`).all();
  if (routeColumns.length > 0) {
    console.log('\nRoutes table columns:');
    routeColumns.forEach(col => {
      console.log(`  ${col.name} (${col.type})`);
    });
  }
  
  // Get all routes (simplified query)
  const routes = db.prepare(`
    SELECT * FROM routes 
    ORDER BY date DESC, departure_time
  `).all();
  
  console.log(`\nTotal routes found: ${routes.length}`);
  
  if (routes.length > 0) {
    console.log('\n=== ROUTE DETAILS ===');
    routes.forEach(route => {
      console.log(`\nRoute ID: ${route.id}`);
      console.log(`  ${route.origin} → ${route.destination}`);
      console.log(`  Date: ${route.date}`);
      console.log(`  Time: ${route.departure_time} - ${route.arrival_time}`);
      console.log(`  Price: K${route.price}`);
      console.log(`  Available Seats: ${route.available_seats}`);
      if (route.bus_id) {
        console.log(`  Bus ID: ${route.bus_id}`);
      }
    });
    
    console.log('\n=== ROUTE STATISTICS ===');
    
    // Popular destinations
    const destinations = db.prepare(`
      SELECT destination, COUNT(*) as route_count
      FROM routes 
      GROUP BY destination 
      ORDER BY route_count DESC
    `).all();
    
    console.log('\nTop Destinations:');
    destinations.forEach(dest => {
      console.log(`  ${dest.destination}: ${dest.route_count} routes`);
    });
    
    // Popular origins
    const origins = db.prepare(`
      SELECT origin, COUNT(*) as route_count
      FROM routes 
      GROUP BY origin 
      ORDER BY route_count DESC
    `).all();
    
    console.log('\nTop Origins:');
    origins.forEach(orig => {
      console.log(`  ${orig.origin}: ${orig.route_count} routes`);
    });
    
    // Price analysis
    const priceStats = db.prepare(`
      SELECT 
        MIN(price) as min_price,
        MAX(price) as max_price,
        AVG(price) as avg_price
      FROM routes
    `).get();
    
    console.log('\nPrice Analysis:');
    console.log(`  Min Price: K${priceStats.min_price}`);
    console.log(`  Max Price: K${priceStats.max_price}`);
    console.log(`  Average Price: K${priceStats.avg_price?.toFixed(2)}`);
    
    // Available seats analysis
    const seatStats = db.prepare(`
      SELECT 
        SUM(available_seats) as total_seats,
        AVG(available_seats) as avg_seats_per_route
      FROM routes
    `).get();
    
    console.log('\nSeat Availability:');
    console.log(`  Total Available Seats: ${seatStats.total_seats}`);
    console.log(`  Average Seats per Route: ${seatStats.avg_seats_per_route?.toFixed(1)}`);
    
    console.log('\n=== BOOKING ANALYSIS FOR ROUTES ===');
    
    // Routes with bookings
    const routeBookings = db.prepare(`
      SELECT 
        r.id,
        r.origin,
        r.destination,
        r.date,
        COUNT(b.id) as booking_count,
        SUM(b.seats_booked) as total_seats_booked,
        r.available_seats + COALESCE(SUM(b.seats_booked), 0) as original_capacity
      FROM routes r
      LEFT JOIN bookings b ON r.id = b.route_id
      GROUP BY r.id
      ORDER BY booking_count DESC
    `).all();
    
    console.log('\nRoutes by Booking Activity:');
    routeBookings.forEach(rb => {
      const occupancyRate = rb.original_capacity > 0 ? 
        ((rb.total_seats_booked || 0) / rb.original_capacity * 100).toFixed(1) : '0.0';
      
      console.log(`  Route ${rb.id}: ${rb.origin} → ${rb.destination} (${rb.date})`);
      console.log(`    Bookings: ${rb.booking_count}, Seats Booked: ${rb.total_seats_booked || 0}`);
      console.log(`    Occupancy Rate: ${occupancyRate}%`);
    });
    
  } else {
    console.log('\n⚠️  No routes found in database!');
    
    // Check if tables exist
    const tables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name IN ('routes', 'buses', 'users', 'bookings')
    `).all();
    
    console.log('\nExisting tables:', tables.map(t => t.name).join(', '));
  }
  
  console.log('\n=== TEST COMPLETED ===');
  db.close();
  
} catch (error) {
  console.error('❌ Database error:', error.message);
  console.error('Full error:', error);
}
