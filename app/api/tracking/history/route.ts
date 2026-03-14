import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/database-tracking';
import { verifyToken } from '@/app/lib/auth';

/**
 * GET /api/tracking/history?trip_id=X&limit=100&offset=0
 * Get location history for a trip
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get('trip_id');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
    const offset = parseInt(searchParams.get('offset') || '0');
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (!tripId) {
      return NextResponse.json({ error: 'trip_id required' }, { status: 400 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get trip and verify access
    const trip = db.prepare(`
      SELECT t.*, b.company_id FROM trips t
      JOIN buses b ON t.bus_id = b.id
      WHERE t.id = ?
    `).get(tripId) as any;

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    if (decoded.user_type === 'company' && decoded.id !== trip.company_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get location history
    const locations = db.prepare(`
      SELECT
        id, latitude, longitude, altitude, speed, heading,
        accuracy, source, provider, recorded_at
      FROM bus_locations
      WHERE trip_id = ?
      ORDER BY recorded_at DESC
      LIMIT ? OFFSET ?
    `).all(tripId, limit, offset) as any[];

    // Get total count
    const countResult = db.prepare(`
      SELECT COUNT(*) as total FROM bus_locations WHERE trip_id = ?
    `).get(tripId) as any;

    return NextResponse.json({
      success: true,
      trip_id: tripId,
      locations: locations.reverse(), // Reverse to get chronological order
      pagination: {
        limit,
        offset,
        total: countResult.total,
        has_more: offset + limit < countResult.total,
      },
    });

  } catch (error) {
    console.error('Error getting location history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
