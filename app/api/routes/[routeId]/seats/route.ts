import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/database-schema';
import { getRouteSeatSnapshot } from '@/app/lib/seat-controls';

export async function GET(request: NextRequest, { params }: { params: Promise<{ routeId: string }> }) {
  try {
    const { routeId } = await params;
    const routeIdNum = parseInt(routeId, 10);

    if (!Number.isInteger(routeIdNum) || routeIdNum <= 0) {
      return NextResponse.json({ error: 'Invalid route id' }, { status: 400 });
    }

    const route = db.prepare(`
      SELECT r.id, r.origin, r.destination, r.date, r.departure_time, r.arrival_time,
             r.status, b.bus_name, b.bus_number
      FROM routes r
      JOIN buses b ON r.bus_id = b.id
      WHERE r.id = ?
    `).get(routeIdNum) as any;

    if (!route) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }

    const snapshot = getRouteSeatSnapshot(routeIdNum);
    if (!snapshot) {
      return NextResponse.json({ error: 'Unable to build seat map' }, { status: 500 });
    }

    return NextResponse.json({
      route: {
        id: route.id,
        origin: route.origin,
        destination: route.destination,
        date: route.date,
        departure_time: route.departure_time,
        arrival_time: route.arrival_time,
        status: route.status,
        bus_name: route.bus_name,
        bus_number: route.bus_number,
        total_seats: snapshot.totalSeats,
        base_price: snapshot.basePrice,
        dynamic_pricing_enabled: snapshot.dynamicPricingEnabled,
        dynamic_price_multiplier: snapshot.dynamicPriceMultiplier,
      },
      summary: {
        available: snapshot.availableSeats,
        booked: snapshot.bookedCount,
        blocked: snapshot.blockedCount,
        reserved: snapshot.reservedCount,
        occupancy_rate: Math.round(snapshot.occupancyRate * 1000) / 10,
      },
      seats: snapshot.seats,
    });
  } catch (error) {
    console.error('Error fetching route seats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
