// Database Tracking Wrapper
// Uses the same database instance as database-schema.ts
// Re-exports common helper functions for tracking operations

import db from './database-schema';

// Export the database instance for use in tracking modules
export default db;

// Helper function to get a trip by ID with all related information
export function getTripById(tripId: number) {
  return db.prepare(`
    SELECT t.*,
      r.origin, r.destination, r.price,
      b.bus_name, b.bus_number,
      u.company_name
    FROM trips t
    JOIN routes r ON t.route_id = r.id
    JOIN buses b ON t.bus_id = b.id
    JOIN users u ON b.company_id = u.id
    WHERE t.id = ?
  `).get(tripId);
}

// Helper function to get active trip for a route
export function getActiveTripForRoute(routeId: number) {
  return db.prepare(`
    SELECT t.*,
      r.origin, r.destination, r.price,
      b.bus_name, b.bus_number,
      u.company_name
    FROM trips t
    JOIN routes r ON t.route_id = r.id
    JOIN buses b ON t.bus_id = b.id
    JOIN users u ON b.company_id = u.id
    WHERE t.route_id = ? AND t.status IN ('boarding', 'in_transit', 'delayed', 'arrived')
    ORDER BY t.created_at DESC
    LIMIT 1
  `).get(routeId);
}

// Helper function to log notifications
export function logNotification(params: {
  trip_id?: number | null;
  booking_id?: number | null;
  user_id: number;
  channel: string;
  event_type: string;
  recipient: string;
  message: string;
  subject?: string;
  provider?: string;
}) {
  const stmt = db.prepare(`
    INSERT INTO notification_log (
      trip_id, booking_id, user_id, channel, event_type, 
      recipient, subject, message, provider, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `);

  return stmt.run(
    params.trip_id || null,
    params.booking_id || null,
    params.user_id,
    params.channel,
    params.event_type,
    params.recipient,
    params.subject || null,
    params.message,
    params.provider || null
  );
}

// Helper function to save location data
export function saveLocation(params: {
  trip_id: number;
  bus_id: number;
  gps_device_id?: number | null;
  latitude: number;
  longitude: number;
  altitude?: number | null;
  speed?: number;
  heading?: number | null;
  accuracy?: number | null;
  source?: string;
  provider?: string;
  recorded_at: string;
}) {
  const stmt = db.prepare(`
    INSERT INTO bus_locations (
      trip_id, bus_id, gps_device_id, latitude, longitude, altitude,
      speed, heading, accuracy, source, provider, recorded_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  return stmt.run(
    params.trip_id,
    params.bus_id,
    params.gps_device_id || null,
    params.latitude,
    params.longitude,
    params.altitude || null,
    params.speed || 0,
    params.heading || null,
    params.accuracy || null,
    params.source || 'gps',
    params.provider || null,
    params.recorded_at
  );
}

// Helper function to update trip with current location
export function updateTripLocation(params: {
  trip_id: number;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number | null;
  eta?: string | null;
  delay_minutes?: number;
}) {
  const stmt = db.prepare(`
    UPDATE trips SET
      current_latitude = ?,
      current_longitude = ?,
      current_speed = ?,
      current_heading = ?,
      current_eta = ?,
      delay_minutes = ?,
      last_location_update = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  return stmt.run(
    params.latitude,
    params.longitude,
    params.speed || 0,
    params.heading || null,
    params.eta || null,
    params.delay_minutes || 0,
    params.trip_id
  );
}
