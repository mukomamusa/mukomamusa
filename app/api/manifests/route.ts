// app/api/manifests/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/database-schema';
import { verifyToken } from '@/app/lib/auth';

// GET manifest for a route/trip
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Only company or admin can view manifests
    if (decoded.user_type !== 'company' && decoded.user_type !== 'admin') {
      return NextResponse.json({ error: 'Company access only' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const routeId = searchParams.get('route_id');

    if (!routeId) {
      return NextResponse.json({ error: 'Route ID required' }, { status: 400 });
    }

    // Get route details
    const route = db.prepare(`
      SELECT r.*, 
             bus.bus_name, bus.bus_number, bus.total_seats,
             u.company_name,
             d.name as driver_name, d.phone as driver_phone
      FROM routes r
      JOIN buses bus ON r.bus_id = bus.id
      JOIN users u ON bus.company_id = u.id
      LEFT JOIN drivers d ON r.driver_id = d.id
      WHERE r.id = ?
    `).get(routeId) as any;

    if (!route) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }

    // Verify company ownership
    if (decoded.user_type === 'company') {
      const bus = db.prepare('SELECT company_id FROM buses WHERE id = ?').get(route.bus_id) as any;
      if (bus.company_id !== decoded.id) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
      }
    }

    // Get all passengers for this route
    const passengers = db.prepare(`
      SELECT 
        p.id as passenger_id,
        p.full_name as passenger_name,
        p.id_number as nrc_or_passport,
        p.phone_number as passenger_phone,
        CASE 
          WHEN p.date_of_birth IS NOT NULL AND 
               DATE('now', '-18 years') > p.date_of_birth THEN 'child'
          WHEN p.date_of_birth IS NOT NULL AND 
               DATE('now', '-60 years') < p.date_of_birth THEN 'senior'
          ELSE 'adult'
        END as passenger_type,
        p.seat_number,
        p.special_needs,
        t.ticket_number,
        t.boarding_status,
        t.boarded_at,
        b.booking_reference,
        b.boarding_point,
        b.dropping_point,
        b.luggage_count,
        b.status as booking_status,
        b.payment_status,
        u.name as booked_by,
        u.phone as booker_phone
      FROM passengers p
      JOIN bookings b ON p.booking_id = b.id
      JOIN users u ON b.customer_id = u.id
      LEFT JOIN tickets t ON t.passenger_id = p.id
      WHERE b.route_id = ? AND b.status IN ('pending', 'confirmed')
      ORDER BY p.seat_number
    `).all(routeId);

    // Get or create manifest record
    let manifest = db.prepare('SELECT * FROM trip_manifests WHERE route_id = ?').get(routeId) as any;
    
    if (!manifest) {
      const result = db.prepare(`
        INSERT INTO trip_manifests (route_id, total_passengers, total_boarded)
        VALUES (?, ?, ?)
      `).run(routeId, passengers.length, 0);
      manifest = { id: result.lastInsertRowid, total_passengers: passengers.length, total_boarded: 0 };
    } else {
      // Update counts
      const boardedCount = passengers.filter((p: any) => p.boarding_status === 'boarded').length;
      db.prepare(`
        UPDATE trip_manifests SET total_passengers = ?, total_boarded = ? WHERE id = ?
      `).run(passengers.length, boardedCount, manifest.id);
      manifest.total_passengers = passengers.length;
      manifest.total_boarded = boardedCount;
    }

    // Calculate statistics
    const stats = {
      total_seats: route.total_seats,
      booked_seats: passengers.length,
      available_seats: route.available_seats,
      boarded: passengers.filter((p: any) => p.boarding_status === 'boarded').length,
      not_boarded: passengers.filter((p: any) => p.boarding_status === 'not_boarded').length,
      missed: passengers.filter((p: any) => p.boarding_status === 'missed').length,
      paid: passengers.filter((p: any) => p.payment_status === 'paid').length,
      pending_payment: passengers.filter((p: any) => p.payment_status === 'pending').length,
      adults: passengers.filter((p: any) => p.passenger_type === 'adult').length,
      children: passengers.filter((p: any) => p.passenger_type === 'child').length,
      infants: passengers.filter((p: any) => p.passenger_type === 'infant').length,
      seniors: passengers.filter((p: any) => p.passenger_type === 'senior').length,
      special_needs: passengers.filter((p: any) => p.special_needs).length,
      total_luggage: passengers.reduce((sum: number, p: any) => sum + (p.luggage_count || 0), 0)
    };

    // Group by boarding point
    const boardingPoints: { [key: string]: any[] } = {};
    passengers.forEach((p: any) => {
      if (!boardingPoints[p.boarding_point]) {
        boardingPoints[p.boarding_point] = [];
      }
      boardingPoints[p.boarding_point].push(p);
    });

    return NextResponse.json({
      manifest: {
        id: manifest.id,
        generated_at: new Date().toISOString(),
        route: {
          id: route.id,
          origin: route.origin,
          destination: route.destination,
          date: route.date,
          departure_time: route.departure_time,
          arrival_time: route.arrival_time,
          status: route.status,
          intermediate_stops: route.intermediate_stops
        },
        bus: {
          name: route.bus_name,
          number: route.bus_number,
          total_seats: route.total_seats
        },
        driver: route.driver_name ? {
          name: route.driver_name,
          phone: route.driver_phone
        } : null,
        company: route.company_name,
        statistics: stats,
        boarding_points: boardingPoints,
        passengers
      }
    });
  } catch (error) {
    console.error('Error fetching manifest:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST add notes to manifest
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || (decoded.user_type !== 'company' && decoded.user_type !== 'admin')) {
      return NextResponse.json({ error: 'Company access only' }, { status: 403 });
    }

    const body = await request.json();
    const { route_id, notes } = body;

    if (!route_id) {
      return NextResponse.json({ error: 'Route ID required' }, { status: 400 });
    }

    // Verify authorization
    const route = db.prepare(`
      SELECT r.*, bus.company_id FROM routes r
      JOIN buses bus ON r.bus_id = bus.id
      WHERE r.id = ?
    `).get(route_id) as any;

    if (!route) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }

    if (decoded.user_type === 'company' && route.company_id !== decoded.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Update or create manifest with notes
    const existing = db.prepare('SELECT id FROM trip_manifests WHERE route_id = ?').get(route_id);
    
    if (existing) {
      db.prepare('UPDATE trip_manifests SET notes = ? WHERE route_id = ?').run(notes, route_id);
    } else {
      db.prepare(`
        INSERT INTO trip_manifests (route_id, notes, total_passengers, total_boarded)
        VALUES (?, ?, 0, 0)
      `).run(route_id, notes);
    }

    return NextResponse.json({ message: 'Manifest notes updated' });
  } catch (error) {
    console.error('Error updating manifest:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
