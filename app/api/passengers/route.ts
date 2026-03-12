// app/api/passengers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/database-schema';
import { verifyToken } from '@/app/lib/auth';

// GET passengers for a booking
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

    const searchParams = request.nextUrl.searchParams;
    const bookingId = searchParams.get('booking_id');
    const routeId = searchParams.get('route_id');

    if (bookingId) {
      // Get passengers for a specific booking
      const booking = db.prepare(`
        SELECT b.*, bus.company_id
        FROM bookings b
        JOIN routes r ON b.route_id = r.id
        JOIN buses bus ON r.bus_id = bus.id
        WHERE b.id = ?
      `).get(bookingId) as any;

      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }

      // Authorization check
      const isOwner = decoded.user_type === 'customer' && booking.customer_id === decoded.id;
      const isCompany = decoded.user_type === 'company' && booking.company_id === decoded.id;
      const isAdmin = decoded.user_type === 'admin';

      if (!isOwner && !isCompany && !isAdmin) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
      }

      const passengers = db.prepare(`
        SELECT p.*
        FROM passengers p
        WHERE p.booking_id = ?
        ORDER BY p.seat_number
      `).all(bookingId);

      return NextResponse.json({ passengers });
    }

    if (routeId) {
      // Get all passengers for a route (manifest) - company only
      if (decoded.user_type !== 'company' && decoded.user_type !== 'admin') {
        return NextResponse.json({ error: 'Company access only' }, { status: 403 });
      }

      // Verify company owns this route
      const route = db.prepare(`
        SELECT r.*, bus.company_id
        FROM routes r
        JOIN buses bus ON r.bus_id = bus.id
        WHERE r.id = ?
      `).get(routeId) as any;

      if (!route) {
        return NextResponse.json({ error: 'Route not found' }, { status: 404 });
      }

      if (decoded.user_type === 'company' && route.company_id !== decoded.id) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
      }

      const passengers = db.prepare(`
        SELECT 
          p.*,
          t.ticket_number,
          t.boarding_status,
          b.booking_reference,
          b.boarding_point,
          b.dropping_point,
          u.name as booker_name,
          u.phone as booker_phone
        FROM passengers p
        JOIN bookings b ON p.booking_id = b.id
        JOIN users u ON b.customer_id = u.id
        LEFT JOIN tickets t ON t.passenger_id = p.id
        WHERE b.route_id = ? AND b.status IN ('pending', 'confirmed')
        ORDER BY p.seat_number
      `).all(routeId);

      return NextResponse.json({ 
        passengers,
        route: {
          id: route.id,
          origin: route.origin,
          destination: route.destination,
          date: route.date,
          departure_time: route.departure_time
        }
      });
    }

    return NextResponse.json({ error: 'Please provide booking_id or route_id' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching passengers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH update passenger details
export async function PATCH(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { passenger_id, name, nrc_or_passport, id_type, phone, email, date_of_birth, passenger_type, special_needs } = body;

    if (!passenger_id) {
      return NextResponse.json({ error: 'Passenger ID required' }, { status: 400 });
    }

    // Get passenger and verify ownership
    const passenger = db.prepare(`
      SELECT p.*, b.customer_id, bus.company_id
      FROM passengers p
      JOIN bookings b ON p.booking_id = b.id
      JOIN routes r ON b.route_id = r.id
      JOIN buses bus ON r.bus_id = bus.id
      WHERE p.id = ?
    `).get(passenger_id) as any;

    if (!passenger) {
      return NextResponse.json({ error: 'Passenger not found' }, { status: 404 });
    }

    const isOwner = decoded.user_type === 'customer' && passenger.customer_id === decoded.id;
    const isCompany = decoded.user_type === 'company' && passenger.company_id === decoded.id;
    const isAdmin = decoded.user_type === 'admin';

    if (!isOwner && !isCompany && !isAdmin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Update passenger
    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) { updates.push('full_name = ?'); values.push(name); }
    if (nrc_or_passport !== undefined) { updates.push('id_number = ?'); values.push(nrc_or_passport); }
    if (id_type !== undefined) { updates.push('id_type = ?'); values.push(id_type); }
    if (phone !== undefined) { updates.push('phone_number = ?'); values.push(phone); }
    if (email !== undefined) { updates.push('email = ?'); values.push(email); }
    if (date_of_birth !== undefined) { updates.push('date_of_birth = ?'); values.push(date_of_birth); }
    if (passenger_type !== undefined) { updates.push('passenger_type = ?'); values.push(passenger_type); }
    if (special_needs !== undefined) { updates.push('special_needs = ?'); values.push(special_needs); }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(passenger_id);
    db.prepare(`UPDATE passengers SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    return NextResponse.json({ message: 'Passenger updated successfully' });
  } catch (error) {
    console.error('Error updating passenger:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
