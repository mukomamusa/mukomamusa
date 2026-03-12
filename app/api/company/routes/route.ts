import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/database-schema';
import { verifyToken } from '@/app/lib/auth';

// GET company routes with performance metrics
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.user_type !== 'company') {
      return NextResponse.json({ error: 'Invalid token or unauthorized' }, { status: 401 });
    }

    const companyId = decoded.id;
    const searchParams = request.nextUrl.searchParams;
    const dateFilter = searchParams.get('date') || '';
    const statusFilter = searchParams.get('status') || '';

    let query = `
      SELECT 
        r.*,
        b.bus_name,
        b.bus_number,
        COUNT(DISTINCT bk.id) as bookings_count,
        COALESCE(SUM(bk.company_earnings), 0) as revenue,
        COUNT(DISTINCT p.id) as passengers_count,
        CAST((b.total_seats - r.available_seats) AS FLOAT) / b.total_seats * 100 as occupancy_rate
      FROM routes r
      JOIN buses b ON r.bus_id = b.id
      LEFT JOIN bookings bk ON r.id = bk.route_id AND bk.status = 'confirmed'
      LEFT JOIN passengers p ON bk.id = p.booking_id
      WHERE b.company_id = ?
    `;
    
    const params: any[] = [companyId];

    if (dateFilter) {
      query += ` AND r.date = ?`;
      params.push(dateFilter);
    }

    if (statusFilter) {
      query += ` AND r.status = ?`;
      params.push(statusFilter);
    }

    query += ` 
      GROUP BY r.id, b.id
      ORDER BY r.date DESC, r.departure_time ASC
    `;

    const routes = db.prepare(query).all(...params);

    // Format the results
    const formattedRoutes = routes.map((route: any) => ({
      ...route,
      bookings_count: route.bookings_count || 0,
      revenue: Math.round((route.revenue || 0) * 100) / 100,
      passengers_count: route.passengers_count || 0,
      occupancy_rate: Math.round((route.occupancy_rate || 0) * 10) / 10
    }));

    return NextResponse.json({ routes: formattedRoutes });
    
  } catch (error: any) {
    console.error('Error fetching company routes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create new route
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.user_type !== 'company') {
      return NextResponse.json({ error: 'Invalid token or unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      bus_id, origin, destination, departure_time, arrival_time, 
      price, date, intermediate_stops 
    } = body;

    if (!bus_id || !origin || !destination || !departure_time || !arrival_time || !price || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const companyId = decoded.id;

    // Verify bus belongs to company
    const bus = db.prepare(`
      SELECT id, total_seats FROM buses WHERE id = ? AND company_id = ?
    `).get(bus_id, companyId) as { id: number; total_seats: number } | undefined;

    if (!bus) {
      return NextResponse.json({ error: 'Bus not found or not authorized' }, { status: 404 });
    }

    // Validate bus has a valid seat count
    if (!bus.total_seats || bus.total_seats <= 0) {
      return NextResponse.json({ error: 'Bus does not have a valid seat capacity configured' }, { status: 400 });
    }

    // Check for conflicting routes (same bus, same date/time)
    const conflictingRoute = db.prepare(`
      SELECT id FROM routes 
      WHERE bus_id = ? AND date = ? AND departure_time = ? AND status = 'active'
    `).get(bus_id, date, departure_time);

    if (conflictingRoute) {
      return NextResponse.json({ error: 'Bus already has a route at this time' }, { status: 400 });
    }

    // Create new route - use actual bus capacity
    const result = db.prepare(`
      INSERT INTO routes (
        bus_id, origin, destination, departure_time, arrival_time,
        price, date, intermediate_stops, available_seats, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `).run(
      bus_id, origin, destination, departure_time, arrival_time,
      price, date, intermediate_stops || '', bus.total_seats
    );

    return NextResponse.json({ 
      message: 'Route created successfully',
      routeId: result.lastInsertRowid 
    });
    
  } catch (error: any) {
    console.error('Error creating route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}