import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/database-tracking';
import { verifyToken } from '@/app/lib/auth';
import { verifyDriverToken } from '@/app/lib/driver-auth';

/**
 * POST /api/tracking/trip/start
 * Start a new trip for a route
 * Called by driver/company when bus is ready to depart
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const userDecoded = verifyToken(token);
    const driverDecoded = userDecoded ? null : verifyDriverToken(token);

    if (!userDecoded && !driverDecoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { route_id, bus_id, gps_device_id, driver_name, driver_phone } = await request.json();

    if (!route_id || !bus_id) {
      return NextResponse.json(
        { error: 'Missing required fields: route_id, bus_id' },
        { status: 400 }
      );
    }

    // Verify route exists and user has access
    const route = db.prepare(`
      SELECT r.*, b.company_id, b.bus_name, b.bus_number
      FROM routes r
      JOIN buses b ON r.bus_id = b.id
      WHERE r.id = ? AND b.id = ?
    `).get(route_id, bus_id) as any;

    if (!route) {
      return NextResponse.json({ error: 'Route or bus not found' }, { status: 404 });
    }

    if (userDecoded?.user_type === 'company' && userDecoded.id !== route.company_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (driverDecoded) {
      if (driverDecoded.company_id !== route.company_id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      if (!route.driver_id || Number(route.driver_id) !== Number(driverDecoded.id)) {
        return NextResponse.json(
          { error: 'Trip can only be started by the assigned driver' },
          { status: 403 }
        );
      }
    }

    const actorId = driverDecoded?.id ?? userDecoded?.id;
    if (!actorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if active trip already exists
    const existingTrip = db.prepare(`
      SELECT id FROM trips
      WHERE route_id = ? AND status NOT IN ('completed', 'cancelled')
    `).get(route_id) as any;

    if (existingTrip) {
      return NextResponse.json(
        { error: 'Active trip already exists for this route' },
        { status: 400 }
      );
    }

    // Count confirmed passengers
    const passengerCount = db.prepare(`
      SELECT COUNT(*) as count FROM bookings
      WHERE route_id = ? AND status = 'confirmed'
    `).get(route_id) as any;

    // Build scheduled datetime
    const scheduledDeparture = `${route.date}T${route.departure_time}`;
    const scheduledArrival = `${route.date}T${route.arrival_time}`;

    // Create trip
    const stmt = db.prepare(`
      INSERT INTO trips (
        route_id, bus_id, gps_device_id, driver_name, driver_phone,
        status, scheduled_departure, scheduled_arrival,
        actual_departure, passenger_count, started_by
      ) VALUES (?, ?, ?, ?, ?, 'boarding', ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      route_id,
      bus_id,
      gps_device_id || null,
      driver_name || null,
      driver_phone || null,
      scheduledDeparture,
      scheduledArrival,
      new Date().toISOString(),
      passengerCount?.count || 0,
      actorId
    );

    const tripId = Number(result.lastInsertRowid);

    // Update route status to active
    db.prepare(`UPDATE routes SET status = 'active' WHERE id = ?`).run(route_id);

    return NextResponse.json(
      {
        success: true,
        message: 'Trip started successfully',
        trip_id: tripId,
        route_id,
        bus_id,
        bus_name: route.bus_name,
        bus_number: route.bus_number,
        status: 'boarding',
        scheduled_departure: scheduledDeparture,
        scheduled_arrival: scheduledArrival,
        passenger_count: passengerCount?.count || 0,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error starting trip:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
