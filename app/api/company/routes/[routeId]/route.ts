import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/database-schema';
import { verifyToken } from '@/app/lib/auth';

// PUT update a route
export async function PUT(request: NextRequest, { params }: { params: Promise<{ routeId: string }> }) {
  try {
    const { routeId } = await params;
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.user_type !== 'company') {
      return NextResponse.json({ error: 'Company access only' }, { status: 403 });
    }

    // Verify route belongs to this company
    const route = db.prepare(`
      SELECT r.*, b.company_id FROM routes r
      JOIN buses b ON r.bus_id = b.id
      WHERE r.id = ?
    `).get(routeId) as any;
    
    if (!route) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }
    
    if (route.company_id !== decoded.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const body = await request.json();
    const { origin, destination, departure_time, arrival_time, date, price, intermediate_stops, driver_id, status } = body;

    const updates: string[] = [];
    const values: any[] = [];

    if (origin !== undefined) { updates.push('origin = ?'); values.push(origin); }
    if (destination !== undefined) { updates.push('destination = ?'); values.push(destination); }
    if (departure_time !== undefined) { updates.push('departure_time = ?'); values.push(departure_time); }
    if (arrival_time !== undefined) { updates.push('arrival_time = ?'); values.push(arrival_time); }
    if (date !== undefined) { updates.push('date = ?'); values.push(date); }
    if (price !== undefined) { updates.push('price = ?'); values.push(price); }
    if (intermediate_stops !== undefined) { updates.push('intermediate_stops = ?'); values.push(intermediate_stops); }
    if (driver_id !== undefined) { updates.push('driver_id = ?'); values.push(driver_id || null); }
    if (status !== undefined) { updates.push('status = ?'); values.push(status); }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(routeId);
    db.prepare(`UPDATE routes SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const updated = db.prepare(`
      SELECT r.*, b.bus_name, b.bus_number, d.name as driver_name
      FROM routes r
      JOIN buses b ON r.bus_id = b.id
      LEFT JOIN drivers d ON r.driver_id = d.id
      WHERE r.id = ?
    `).get(routeId);
    
    return NextResponse.json({ route: updated, message: 'Route updated successfully' });
  } catch (error) {
    console.error('Error updating route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE a route
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ routeId: string }> }) {
  try {
    const { routeId } = await params;
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.user_type !== 'company') {
      return NextResponse.json({ error: 'Company access only' }, { status: 403 });
    }

    // Verify route belongs to this company
    const route = db.prepare(`
      SELECT r.*, b.company_id FROM routes r
      JOIN buses b ON r.bus_id = b.id
      WHERE r.id = ?
    `).get(routeId) as any;
    
    if (!route) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }
    
    if (route.company_id !== decoded.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Check for active bookings
    const activeBookings = db.prepare(`
      SELECT COUNT(*) as count FROM bookings 
      WHERE route_id = ? AND status IN ('pending', 'confirmed')
    `).get(routeId) as any;
    
    if (activeBookings.count > 0) {
      return NextResponse.json({ 
        error: `Cannot delete route with ${activeBookings.count} active booking(s). Cancel bookings first.` 
      }, { status: 400 });
    }

    // Delete associated data
    db.prepare('DELETE FROM trip_manifests WHERE route_id = ?').run(routeId);
    db.prepare('DELETE FROM routes WHERE id = ?').run(routeId);

    return NextResponse.json({ message: 'Route deleted successfully' });
  } catch (error) {
    console.error('Error deleting route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
