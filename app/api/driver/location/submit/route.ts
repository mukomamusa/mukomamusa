import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/database-tracking';
import { verifyDriverToken } from '@/app/lib/driver-auth';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const driver = verifyDriverToken(token);
    if (!driver) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const trip = db.prepare(`
      SELECT t.*, r.origin, r.destination, b.bus_name, b.bus_number
      FROM trips t
      JOIN routes r ON t.route_id = r.id
      JOIN buses b ON t.bus_id = b.id
      WHERE b.company_id = ? AND t.status IN ('boarding', 'in_transit', 'delayed')
      ORDER BY t.created_at DESC LIMIT 1
    `).get(driver.company_id) as any;

    if (!trip) {
      return NextResponse.json({ has_active_trip: false, message: 'No active trip found' });
    }

    return NextResponse.json({
      has_active_trip: true,
      trip: {
        id: trip.id,
        bus_name: trip.bus_name,
        bus_number: trip.bus_number,
        origin: trip.origin,
        destination: trip.destination,
        status: trip.status,
        current_eta: trip.current_eta,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
