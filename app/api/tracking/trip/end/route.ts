import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/database-tracking';
import { verifyToken } from '@/app/lib/auth';
import { verifyDriverToken } from '@/app/lib/driver-auth';

/**
 * POST /api/tracking/trip/end
 * End an active trip
 * Called by driver/company when bus has reached destination
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

    const { trip_id } = await request.json();

    if (!trip_id) {
      return NextResponse.json(
        { error: 'Missing required field: trip_id' },
        { status: 400 }
      );
    }

    // Get trip and verify access
    const trip = db.prepare(`
      SELECT t.*, b.company_id, r.id as route_id, r.driver_id
      FROM trips t
      JOIN buses b ON t.bus_id = b.id
      JOIN routes r ON t.route_id = r.id
      WHERE t.id = ? AND t.status IN ('boarding', 'in_transit', 'delayed', 'arrived')
    `).get(trip_id) as any;

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found or already completed' }, { status: 404 });
    }

    if (userDecoded?.user_type === 'company' && userDecoded.id !== trip.company_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (driverDecoded) {
      if (driverDecoded.company_id !== trip.company_id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      if (trip.driver_id && Number(trip.driver_id) !== Number(driverDecoded.id)) {
        return NextResponse.json(
          { error: 'Trip can only be ended by the assigned driver' },
          { status: 403 }
        );
      }
    }

    const actorId = driverDecoded?.id ?? userDecoded?.id;
    if (!actorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // End the trip
    db.prepare(`
      UPDATE trips SET
        status = 'completed',
        actual_arrival = ?,
        ended_by = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(new Date().toISOString(), actorId, trip_id);

    // Update route status
    db.prepare(`UPDATE routes SET status = 'completed' WHERE id = ?`).run(trip.route_id);

    // Get updated trip info
    const updatedTrip = db.prepare(`
      SELECT * FROM trips WHERE id = ?
    `).get(trip_id) as any;

    return NextResponse.json({
      success: true,
      message: 'Trip ended successfully',
      trip_id,
      status: 'completed',
      actual_arrival: updatedTrip.actual_arrival,
      duration_minutes: updatedTrip.actual_arrival ? 
        Math.round((new Date(updatedTrip.actual_arrival).getTime() - new Date(updatedTrip.actual_departure).getTime()) / 60000) : 0,
    });

  } catch (error) {
    console.error('Error ending trip:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
