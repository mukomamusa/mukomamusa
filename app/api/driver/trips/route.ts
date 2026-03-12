// app/api/driver/trips/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyDriverToken } from '@/app/lib/driver-auth';
import db from '@/app/lib/database-schema';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyDriverToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid driver token' }, { status: 401 });
    }

    const driverId = decoded.id;

    // Get ALL trips for this driver (past, present, future)
    const trips = db.prepare(`
      SELECT 
        r.id,
        r.bus_id,
        r.origin,
        r.destination,
        r.departure_time,
        r.arrival_time,
        r.date,
        r.status,
        b.bus_name,
        b.bus_number,
        (
          SELECT COUNT(*) 
          FROM bookings bk 
          WHERE bk.route_id = r.id AND bk.status = 'confirmed'
        ) as total_bookings,
        (
          SELECT COUNT(*) 
          FROM tickets t 
          JOIN passengers p ON t.passenger_id = p.id 
          JOIN bookings bk ON p.booking_id = bk.id
          WHERE bk.route_id = r.id AND t.boarding_status = 'boarded'
        ) as boarded_count
      FROM routes r
      JOIN buses b ON r.bus_id = b.id
      WHERE r.driver_id = ?
      ORDER BY r.date DESC, r.departure_time DESC
    `).all(driverId);

    return NextResponse.json({
      success: true,
      trips,
      count: trips.length
    });

  } catch (error) {
    console.error('Error fetching driver trips:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}