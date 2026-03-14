// Core Tracking Engine
// Handles ETA calculation, geofencing, trip management, and real-time updates

import db from './database-tracking';
import {
  calculateDistance,
  calculateBearing,
  findNearestCity,
  getCityCoordinates,
  calculateRouteMetrics,
  isWithinGeofence,
  estimateRouteProgress,
  type CityCoordinate,
} from './zambia-coordinates';
import { GPSDataProcessor, type GPSLocation } from './gps-providers';

// ============================================================
// TYPES
// ============================================================

export interface TripInfo {
  id: number;
  route_id: number;
  bus_id: number;
  gps_device_id: number | null;
  driver_name: string | null;
  driver_phone: string | null;
  status: string;
  scheduled_departure: string;
  scheduled_arrival: string;
  actual_departure: string | null;
  actual_arrival: string | null;
  current_latitude: number | null;
  current_longitude: number | null;
  current_speed: number;
  current_heading: number | null;
  current_eta: string | null;
  last_location_update: string | null;
  delay_minutes: number;
  delay_reason: string | null;
  distance_covered_km: number;
  total_distance_km: number | null;
  next_stop: string | null;
  next_stop_eta: string | null;
  passenger_count: number;
  // Joined fields
  origin?: string;
  destination?: string;
  bus_name?: string;
  bus_number?: string;
  company_name?: string;
  price?: number;
}

export interface ETAResult {
  eta: Date;
  eta_iso: string;
  remaining_distance_km: number;
  remaining_duration_minutes: number;
  confidence: 'high' | 'medium' | 'low';
  method: 'gps_realtime' | 'schedule_based' | 'historical' | 'interpolated';
  delay_minutes: number;
}

export interface GeofenceEvent {
  zone_id: number;
  zone_name: string;
  zone_type: string;
  event: 'entered' | 'exited' | 'approaching';
  distance_km: number;
  city?: string;
}

export interface TrackingUpdate {
  trip_id: number;
  location: GPSLocation;
  eta: ETAResult | null;
  progress_percent: number;
  nearest_city: string;
  distance_to_destination_km: number;
  geofence_events: GeofenceEvent[];
  is_delayed: boolean;
  delay_minutes: number;
  status: string;
}

// ============================================================
// TRIP MANAGEMENT
// ============================================================

/**
 * Start a new trip for a scheduled route
 */
export function startTrip(params: {
  route_id: number;
  bus_id: number;
  gps_device_id?: number;
  driver_name?: string;
  driver_phone?: string;
  started_by: number;
}): TripInfo | null {
  try {
    // Get route details
    const route = db.prepare(`
      SELECT r.*, b.bus_name, b.bus_number, u.company_name
      FROM routes r
      JOIN buses b ON r.bus_id = b.id
      JOIN users u ON b.company_id = u.id
      WHERE r.id = ? AND r.status = 'active'
    `).get(params.route_id) as any;

    if (!route) {
      console.error('Route not found or inactive');
      return null;
    }

    // Calculate total distance
    const metrics = calculateRouteMetrics(route.origin, route.destination);
    const totalDistance = metrics?.total_distance_km || null;

    // Build scheduled datetime from route date + time
    const scheduledDeparture = `${route.date}T${route.departure_time}`;
    const scheduledArrival = `${route.date}T${route.arrival_time}`;

    // Count passengers for this route
    const passengerCount = db.prepare(`
      SELECT COUNT(*) as count FROM bookings
      WHERE route_id = ? AND status = 'confirmed'
    `).get(params.route_id) as any;

    // Check if trip already exists for this route
    const existingTrip = db.prepare(`
      SELECT id FROM trips WHERE route_id = ? AND status NOT IN ('completed', 'cancelled')
    `).get(params.route_id) as any;

    if (existingTrip) {
      console.error('Active trip already exists for this route');
      return null;
    }

    const stmt = db.prepare(`
      INSERT INTO trips (
        route_id, bus_id, gps_device_id, driver_name, driver_phone,
        status, scheduled_departure, scheduled_arrival,
        actual_departure, total_distance_km, passenger_count, started_by
      ) VALUES (?, ?, ?, ?, ?, 'boarding', ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      params.route_id,
      params.bus_id,
      params.gps_device_id || null,
      params.driver_name || null,
      params.driver_phone || null,
      scheduledDeparture,
      scheduledArrival,
      new Date().toISOString(),
      totalDistance,
      passengerCount?.count || 0,
      params.started_by
    );

    // Update route status
    db.prepare(`UPDATE routes SET status = 'active' WHERE id = ?`).run(params.route_id);

    return getTripById(Number(result.lastInsertRowid));
  } catch (error) {
    console.error('Error starting trip:', error);
    return null;
  }
}

/**
 * Mark trip as departed (in transit)
 */
export function departTrip(tripId: number): TripInfo | null {
  try {
    db.prepare(`
      UPDATE trips SET
        status = 'in_transit',
        actual_departure = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND status = 'boarding'
    `).run(new Date().toISOString(), tripId);

    return getTripById(tripId);
  } catch (error) {
    console.error('Error departing trip:', error);
    return null;
  }
}

/**
 * End a trip
 */
export function endTrip(tripId: number, endedBy: number): TripInfo | null {
  try {
    db.prepare(`
      UPDATE trips SET
        status = 'completed',
        actual_arrival = ?,
        ended_by = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND status IN ('in_transit', 'delayed', 'arrived')
    `).run(new Date().toISOString(), endedBy, tripId);

    // Update route status
    const trip = getTripById(tripId);
    if (trip) {
      db.prepare(`UPDATE routes SET status = 'completed' WHERE id = ?`).run(trip.route_id);
    }

    return trip;
  } catch (error) {
    console.error('Error ending trip:', error);
    return null;
  }
}

/**
 * Cancel a trip
 */
export function cancelTrip(tripId: number, reason: string, cancelledBy: number): TripInfo | null {
  try {
    db.prepare(`
      UPDATE trips SET
        status = 'cancelled',
        delay_reason = ?,
        ended_by = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND status NOT IN ('completed', 'cancelled')
    `).run(reason, cancelledBy, tripId);

    return getTripById(tripId);
  } catch (error) {
    console.error('Error cancelling trip:', error);
    return null;
  }
}

/**
 * Get trip by ID with full details
 */
export function getTripById(tripId: number): TripInfo | null {
  try {
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
    `).get(tripId) as TripInfo | null;
  } catch (error) {
    console.error('Error getting trip:', error);
    return null;
  }
}

/**
 * Get active trip for a route
 */
export function getActiveTripForRoute(routeId: number): TripInfo | null {
  try {
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
    `).get(routeId) as TripInfo | null;
  } catch (error) {
    console.error('Error getting active trip:', error);
    return null;
  }
}

/**
 * Get all active trips for a company
 */
export function getActiveTripsForCompany(companyId: number): TripInfo[] {
  try {
    return db.prepare(`
      SELECT t.*,
        r.origin, r.destination, r.price,
        b.bus_name, b.bus_number,
        u.company_name
      FROM trips t
      JOIN routes r ON t.route_id = r.id
      JOIN buses b ON t.bus_id = b.id
      JOIN users u ON b.company_id = u.id
      WHERE b.company_id = ? AND t.status IN ('boarding', 'in_transit', 'delayed', 'arrived')
      ORDER BY t.scheduled_departure ASC
    `).all(companyId) as TripInfo[];
  } catch (error) {
    console.error('Error getting active trips:', error);
    return [];
  }
}

/**
 * Get trip for a booking reference (for customer tracking)
 */
export function getTripForBooking(bookingReference: string): TripInfo | null {
  try {
    return db.prepare(`
      SELECT t.*,
        r.origin, r.destination, r.price,
        b.bus_name, b.bus_number,
        u.company_name
      FROM trips t
      JOIN routes r ON t.route_id = r.id
      JOIN buses b ON t.bus_id = b.id
      JOIN users u ON b.company_id = u.id
      JOIN bookings bk ON bk.route_id = r.id
      WHERE bk.booking_reference = ?
        AND t.status IN ('boarding', 'in_transit', 'delayed', 'arrived')
      ORDER BY t.created_at DESC
      LIMIT 1
    `).get(bookingReference) as TripInfo | null;
  } catch (error) {
    console.error('Error getting trip for booking:', error);
    return null;
  }
}

// ============================================================
// LOCATION PROCESSING
// ============================================================

/**
 * Process incoming GPS location data
 * This is the main entry point for all GPS data
 */
export function processLocationUpdate(
  tripId: number,
  busId: number,
  gpsDeviceId: number | null,
  location: GPSLocation
): TrackingUpdate | null {
  try {
    const trip = getTripById(tripId);
    if (!trip || !['in_transit', 'delayed', 'boarding'].includes(trip.status)) {
      return null;
    }

    // Validate location
    const validation = GPSDataProcessor.validateLocation(location);
    if (!validation.valid) {
      console.warn(`Invalid GPS data for trip ${tripId}:`, validation.issues);
      // Still store but flag it
    }

    // Store location in history
    const insertLocation = db.prepare(`
      INSERT INTO bus_locations (
        trip_id, bus_id, gps_device_id,
        latitude, longitude, altitude, speed, heading,
        accuracy, source, provider, satellites_used, hdop,
        recorded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertLocation.run(
      tripId,
      busId,
      gpsDeviceId,
      location.latitude,
      location.longitude,
      location.altitude || null,
      location.speed || 0,
      location.heading || null,
      location.accuracy || null,
      location.source,
      location.provider,
      location.satellites || null,
      location.hdop || null,
      location.timestamp
    );

    // Calculate ETA
    const eta = calculateETA(trip, location);

    // Calculate progress
    const progress = trip.origin && trip.destination
      ? estimateRouteProgress(location.latitude, location.longitude, trip.origin, trip.destination)
      : 0;

    // Check geofences
    const geofenceEvents = checkGeofences(location.latitude, location.longitude, tripId);

    // Calculate distance to destination
    const destCoords = trip.destination ? getCityCoordinates(trip.destination) : null;
    const distToDestination = destCoords
      ? calculateDistance(location.latitude, location.longitude, destCoords.latitude, destCoords.longitude)
      : 0;

    // Determine delay
    const delayMinutes = eta ? eta.delay_minutes : 0;
    const isDelayed = delayMinutes > 10; // More than 10 minutes late

    // Determine new status based on location
    let newStatus = trip.status;
    if (destCoords && distToDestination < 2) {
      newStatus = 'arrived';
    } else if (isDelayed && trip.status === 'in_transit') {
      newStatus = 'delayed';
    } else if (trip.status === 'boarding' && (location.speed || 0) > 10) {
      newStatus = 'in_transit';
    }

    // Find nearest city
    const nearest = findNearestCity(location.latitude, location.longitude);

    // Calculate distance covered
    const distanceCovered = trip.origin
      ? calculateDistanceCovered(tripId, trip.origin)
      : trip.distance_covered_km;

    // Determine next stop
    const nextStopInfo = trip.origin && trip.destination
      ? determineNextStop(location.latitude, location.longitude, trip.origin, trip.destination)
      : null;

    // Update trip record
    db.prepare(`
      UPDATE trips SET
        current_latitude = ?,
        current_longitude = ?,
        current_speed = ?,
        current_heading = ?,
        current_eta = ?,
        last_location_update = ?,
        delay_minutes = ?,
        distance_covered_km = ?,
        next_stop = ?,
        next_stop_eta = ?,
        status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      location.latitude,
      location.longitude,
      location.speed || 0,
      location.heading || null,
      eta?.eta_iso || null,
      new Date().toISOString(),
      delayMinutes,
      distanceCovered,
      nextStopInfo?.name || null,
      nextStopInfo?.eta || null,
      newStatus,
      tripId
    );

    return {
      trip_id: tripId,
      location,
      eta,
      progress_percent: progress,
      nearest_city: nearest.city.name,
      distance_to_destination_km: Math.round(distToDestination * 10) / 10,
      geofence_events: geofenceEvents,
      is_delayed: isDelayed,
      delay_minutes: delayMinutes,
      status: newStatus,
    };
  } catch (error) {
    console.error('Error processing location update:', error);
    return null;
  }
}

// ============================================================
// ETA CALCULATION
// ============================================================

/**
 * Calculate ETA using a multi-method approach:
 * 1. GPS real-time (if bus is moving with good GPS data)
 * 2. Schedule-based (fallback using original schedule)
 * 3. Historical (using past trip data for same route)
 */
export function calculateETA(trip: TripInfo, currentLocation: GPSLocation): ETAResult | null {
  if (!trip.destination) return null;

  const destCoords = getCityCoordinates(trip.destination);
  if (!destCoords) return null;

  const remainingDistance = calculateDistance(
    currentLocation.latitude, currentLocation.longitude,
    destCoords.latitude, destCoords.longitude
  );

  // Method 1: GPS Real-time (preferred when bus is moving)
  if (currentLocation.speed && currentLocation.speed > 10) {
    const avgSpeed = getAverageSpeed(trip.id, 15); // Last 15 minutes
    const effectiveSpeed = avgSpeed > 0 ? avgSpeed : currentLocation.speed;

    // Apply road quality factor
    const routeMetrics = trip.origin ? calculateRouteMetrics(trip.origin, trip.destination) : null;
    const roadFactor = getRoadQualityFactor(routeMetrics);

    const remainingHours = remainingDistance / (effectiveSpeed * roadFactor);
    const remainingMinutes = Math.round(remainingHours * 60);

    const eta = new Date(Date.now() + remainingMinutes * 60000);

    // Calculate delay vs schedule
    const scheduledArrival = new Date(trip.scheduled_arrival);
    const delayMinutes = Math.max(0, Math.round((eta.getTime() - scheduledArrival.getTime()) / 60000));

    return {
      eta,
      eta_iso: eta.toISOString(),
      remaining_distance_km: Math.round(remainingDistance * 10) / 10,
      remaining_duration_minutes: remainingMinutes,
      confidence: currentLocation.accuracy && currentLocation.accuracy < 50 ? 'high' : 'medium',
      method: 'gps_realtime',
      delay_minutes: delayMinutes,
    };
  }

  // Method 2: Schedule-based (when bus is stopped or no speed data)
  if (trip.scheduled_arrival) {
    const scheduledArrival = new Date(trip.scheduled_arrival);
    const scheduledDeparture = new Date(trip.scheduled_departure);
    const totalScheduledMinutes = (scheduledArrival.getTime() - scheduledDeparture.getTime()) / 60000;

    // Estimate progress based on position
    const progress = trip.origin
      ? estimateRouteProgress(currentLocation.latitude, currentLocation.longitude, trip.origin, trip.destination) / 100
      : 0;

    const remainingMinutes = Math.round(totalScheduledMinutes * (1 - progress));
    const eta = new Date(Date.now() + remainingMinutes * 60000);

    const delayMinutes = Math.max(0, Math.round((eta.getTime() - scheduledArrival.getTime()) / 60000));

    return {
      eta,
      eta_iso: eta.toISOString(),
      remaining_distance_km: Math.round(remainingDistance * 10) / 10,
      remaining_duration_minutes: remainingMinutes,
      confidence: 'low',
      method: 'schedule_based',
      delay_minutes: delayMinutes,
    };
  }

  return null;
}

/**
 * Get average speed over the last N minutes from location history
 */
function getAverageSpeed(tripId: number, minutes: number): number {
  try {
    const cutoff = new Date(Date.now() - minutes * 60000).toISOString();
    const result = db.prepare(`
      SELECT AVG(speed) as avg_speed
      FROM bus_locations
      WHERE trip_id = ? AND recorded_at > ? AND speed > 0
    `).get(tripId, cutoff) as any;

    return result?.avg_speed || 0;
  } catch {
    return 0;
  }
}

/**
 * Get road quality factor for ETA adjustment
 * Poor roads = slower effective speed
 */
function getRoadQualityFactor(routeMetrics: any): number {
  if (!routeMetrics || !routeMetrics.segments) return 0.8; // Default conservative

  const qualityFactors: Record<string, number> = {
    'excellent': 1.0,
    'good': 0.9,
    'fair': 0.75,
    'poor': 0.6,
  };

  // Weighted average based on remaining segments
  let totalWeight = 0;
  let weightedFactor = 0;

  for (const seg of routeMetrics.segments) {
    const factor = qualityFactors[seg.road_quality] || 0.75;
    weightedFactor += factor * seg.distance_km;
    totalWeight += seg.distance_km;
  }

  return totalWeight > 0 ? weightedFactor / totalWeight : 0.8;
}

/**
 * Calculate total distance covered from trip start
 */
function calculateDistanceCovered(tripId: number, origin: string): number {
  try {
    const originCoords = getCityCoordinates(origin);
    if (!originCoords) return 0;

    // Get latest location
    const latest = db.prepare(`
      SELECT latitude, longitude FROM bus_locations
      WHERE trip_id = ?
      ORDER BY recorded_at DESC
      LIMIT 1
    `).get(tripId) as any;

    if (!latest) return 0;

    return Math.round(
      calculateDistance(originCoords.latitude, originCoords.longitude, latest.latitude, latest.longitude) * 10
    ) / 10;
  } catch {
    return 0;
  }
}

/**
 * Determine the next stop along the route
 */
function determineNextStop(
  currentLat: number, currentLon: number,
  origin: string, destination: string
): { name: string; eta: string } | null {
  const metrics = calculateRouteMetrics(origin, destination);
  if (!metrics) return null;

  // Find the next stop the bus hasn't passed yet
  for (const stop of metrics.stops) {
    const stopCoords = getCityCoordinates(stop);
    if (!stopCoords) continue;

    const distToStop = calculateDistance(currentLat, currentLon, stopCoords.latitude, stopCoords.longitude);
    const distFromOrigin = calculateDistance(
      getCityCoordinates(origin)!.latitude, getCityCoordinates(origin)!.longitude,
      stopCoords.latitude, stopCoords.longitude
    );
    const currentDistFromOrigin = calculateDistance(
      getCityCoordinates(origin)!.latitude, getCityCoordinates(origin)!.longitude,
      currentLat, currentLon
    );

    // If this stop is ahead of us
    if (distFromOrigin > currentDistFromOrigin && distToStop > 2) {
      // Rough ETA to this stop (assuming 60 km/h average)
      const minutesToStop = Math.round((distToStop / 60) * 60);
      const stopEta = new Date(Date.now() + minutesToStop * 60000);

      return {
        name: stop,
        eta: stopEta.toISOString(),
      };
    }
  }

  return { name: destination, eta: new Date().toISOString() };
}

// ============================================================
// GEOFENCING
// ============================================================

/**
 * Check if current position triggers any geofence events
 */
export function checkGeofences(
  latitude: number,
  longitude: number,
  tripId: number
): GeofenceEvent[] {
  const events: GeofenceEvent[] = [];

  try {
    // Get all active geofence zones
    const zones = db.prepare(`
      SELECT * FROM geofence_zones WHERE is_active = 1
    `).all() as any[];

    for (const zone of zones) {
      const distance = calculateDistance(latitude, longitude, zone.latitude, zone.longitude);
      const radiusKm = zone.radius_meters / 1000;

      // Check if within zone
      if (distance <= radiusKm) {
        events.push({
          zone_id: zone.id,
          zone_name: zone.name,
          zone_type: zone.zone_type,
          event: 'entered',
          distance_km: Math.round(distance * 10) / 10,
          city: zone.city,
        });
      }
      // Check if approaching (within 10km)
      else if (distance <= 10) {
        events.push({
          zone_id: zone.id,
          zone_name: zone.name,
          zone_type: zone.zone_type,
          event: 'approaching',
          distance_km: Math.round(distance * 10) / 10,
          city: zone.city,
        });
      }
    }
  } catch (error) {
    console.error('Error checking geofences:', error);
  }

  return events;
}

// ============================================================
// LOCATION HISTORY
// ============================================================

/**
 * Get location history for a trip
 */
export function getLocationHistory(tripId: number, limit: number = 100): any[] {
  try {
    return db.prepare(`
      SELECT latitude, longitude, speed, heading, accuracy,
             source, recorded_at
      FROM bus_locations
      WHERE trip_id = ?
      ORDER BY recorded_at DESC
      LIMIT ?
    `).all(tripId, limit);
  } catch (error) {
    console.error('Error getting location history:', error);
    return [];
  }
}

/**
 * Get the latest location for a trip
 */
export function getLatestLocation(tripId: number): any | null {
  try {
    return db.prepare(`
      SELECT latitude, longitude, speed, heading, accuracy,
             source, provider, recorded_at
      FROM bus_locations
      WHERE trip_id = ?
      ORDER BY recorded_at DESC
      LIMIT 1
    `).get(tripId);
  } catch (error) {
    console.error('Error getting latest location:', error);
    return null;
  }
}

// ============================================================
// GPS DEVICE MANAGEMENT
// ============================================================

/**
 * Register a GPS device to a bus
 */
export function registerGPSDevice(params: {
  bus_id: number;
  device_imei?: string;
  device_serial?: string;
  provider: string;
  provider_device_id?: string;
  sim_number?: string;
  sim_provider?: string;
}): any {
  try {
    const stmt = db.prepare(`
      INSERT INTO gps_devices (
        bus_id, device_imei, device_serial, provider,
        provider_device_id, sim_number, sim_provider,
        status, installed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP)
    `);

    const result = stmt.run(
      params.bus_id,
      params.device_imei || null,
      params.device_serial || null,
      params.provider,
      params.provider_device_id || null,
      params.sim_number || null,
      params.sim_provider || null
    );

    return { id: result.lastInsertRowid, ...params };
  } catch (error) {
    console.error('Error registering GPS device:', error);
    return null;
  }
}

/**
 * Get GPS device for a bus
 */
export function getGPSDeviceForBus(busId: number): any | null {
  try {
    return db.prepare(`
      SELECT * FROM gps_devices
      WHERE bus_id = ? AND status = 'active'
      ORDER BY created_at DESC
      LIMIT 1
    `).get(busId);
  } catch (error) {
    console.error('Error getting GPS device:', error);
    return null;
  }
}

/**
 * Get GPS device by provider device ID
 */
export function getGPSDeviceByProviderId(providerDeviceId: string): any | null {
  try {
    return db.prepare(`
      SELECT gd.*, b.bus_number, b.bus_name, b.company_id
      FROM gps_devices gd
      JOIN buses b ON gd.bus_id = b.id
      WHERE gd.provider_device_id = ? AND gd.status = 'active'
    `).get(providerDeviceId);
  } catch (error) {
    console.error('Error getting GPS device by provider ID:', error);
    return null;
  }
}

/**
 * Get all GPS devices for a company
 */
export function getGPSDevicesForCompany(companyId: number): any[] {
  try {
    return db.prepare(`
      SELECT gd.*, b.bus_number, b.bus_name
      FROM gps_devices gd
      JOIN buses b ON gd.bus_id = b.id
      WHERE b.company_id = ?
      ORDER BY gd.created_at DESC
    `).all(companyId);
  } catch (error) {
    console.error('Error getting GPS devices:', error);
    return [];
  }
}

/**
 * Update GPS device last seen timestamp
 */
export function updateDeviceLastSeen(deviceId: number): void {
  try {
    db.prepare(`
      UPDATE gps_devices SET last_seen_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(deviceId);
  } catch (error) {
    console.error('Error updating device last seen:', error);
  }
}