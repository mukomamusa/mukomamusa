import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/database-schema';
import { verifyToken } from '@/app/lib/auth';

// GET tickets - by booking_id, ticket_number, or route_id 
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
    const ticketNumber = searchParams.get('ticket_number');
    const routeId = searchParams.get('route_id');

    if (ticketNumber) {
      // Get single ticket by number (for validation/scanning)
      const ticket = db.prepare(`
        SELECT 
          t.*,
          p.full_name as passenger_name,
          p.phone_number,
          p.email,
          p.date_of_birth,
          p.gender,
          p.id_type,
          p.id_number,
          p.emergency_contact_name,
          p.emergency_contact_phone,
          p.emergency_contact_relationship,
          p.special_needs,
          p.luggage_count,
          b.booking_reference,
          b.boarding_point,
          b.dropping_point,
          r.origin,
          r.destination,
          r.date,
          r.departure_time,
          r.arrival_time,
          bus.bus_name,
          bus.bus_number,
          u.company_name
        FROM tickets t
        JOIN passengers p ON t.passenger_id = p.id
        JOIN bookings b ON t.booking_id = b.id
        JOIN routes r ON b.route_id = r.id
        JOIN buses bus ON r.bus_id = bus.id
        JOIN users u ON bus.company_id = u.id
        WHERE t.ticket_number = ?
      `).get(ticketNumber);

      if (!ticket) {
        return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
      }

      return NextResponse.json({ ticket });
    }

    if (bookingId) {
      // Get all tickets for a booking
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

      const isOwner = decoded.user_type === 'customer' && booking.customer_id === decoded.id;
      const isCompany = decoded.user_type === 'company' && booking.company_id === decoded.id;
      const isAdmin = decoded.user_type === 'admin';

      if (!isOwner && !isCompany && !isAdmin) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
      }

      const tickets = db.prepare(`
        SELECT 
          t.*,
          p.full_name as passenger_name,
          p.phone_number,
          p.email,
          p.id_type,
          p.id_number,
          p.emergency_contact_name,
          p.emergency_contact_phone,
          p.special_needs,
          p.luggage_count,
          b.booking_reference,
          r.origin,
          r.destination,
          r.date,
          r.departure_time,
          bus.bus_name,
          bus.bus_number,
          u.company_name
        FROM tickets t
        JOIN passengers p ON t.passenger_id = p.id
        JOIN bookings b ON t.booking_id = b.id
        JOIN routes r ON b.route_id = r.id
        JOIN buses bus ON r.bus_id = bus.id
        JOIN users u ON bus.company_id = u.id
        WHERE t.booking_id = ?
        ORDER BY t.seat_number
      `).all(bookingId);

      return NextResponse.json({ tickets });
    }

    if (routeId) {
      // Get all tickets for a route (company/admin only)
      if (decoded.user_type !== 'company' && decoded.user_type !== 'admin') {
        return NextResponse.json({ error: 'Company access only' }, { status: 403 });
      }

      const route = db.prepare(`
        SELECT r.*, bus.company_id FROM routes r
        JOIN buses bus ON r.bus_id = bus.id
        WHERE r.id = ?
      `).get(routeId) as any;

      if (!route) {
        return NextResponse.json({ error: 'Route not found' }, { status: 404 });
      }

      if (decoded.user_type === 'company' && route.company_id !== decoded.id) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
      }

      const tickets = db.prepare(`
        SELECT 
          t.*,
          p.full_name as passenger_name,
          p.phone_number as passenger_phone,
          p.id_type,
          p.id_number,
          p.emergency_contact_name,
          p.emergency_contact_phone,
          b.booking_reference,
          b.boarding_point
        FROM tickets t
        JOIN passengers p ON t.passenger_id = p.id
        JOIN bookings b ON t.booking_id = b.id
        WHERE b.route_id = ? AND b.status IN ('pending', 'confirmed')
        ORDER BY t.seat_number
      `).all(routeId);

      return NextResponse.json({ tickets });
    }

    return NextResponse.json({ error: 'Please provide booking_id, ticket_number, or route_id' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH update ticket status (for boarding, validation)
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

    // Only company or admin can update ticket status
    if (decoded.user_type !== 'company' && decoded.user_type !== 'admin') {
      return NextResponse.json({ error: 'Company access only' }, { status: 403 });
    }

    const body = await request.json();
    const { ticket_id, ticket_number, boarding_status, status } = body;

    // Find ticket
    let ticket: any;
    if (ticket_id) {
      ticket = db.prepare(`
        SELECT t.*, b.route_id, bus.company_id
        FROM tickets t
        JOIN bookings b ON t.booking_id = b.id
        JOIN routes r ON b.route_id = r.id
        JOIN buses bus ON r.bus_id = bus.id
        WHERE t.id = ?
      `).get(ticket_id);
    } else if (ticket_number) {
      ticket = db.prepare(`
        SELECT t.*, b.route_id, bus.company_id
        FROM tickets t
        JOIN bookings b ON t.booking_id = b.id
        JOIN routes r ON b.route_id = r.id
        JOIN buses bus ON r.bus_id = bus.id
        WHERE t.ticket_number = ?
      `).get(ticket_number);
    }

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Verify company ownership
    if (decoded.user_type === 'company' && ticket.company_id !== decoded.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (boarding_status) {
      updates.push('boarding_status = ?');
      values.push(boarding_status);
      if (boarding_status === 'boarded') {
        updates.push('boarded_at = CURRENT_TIMESTAMP');
      }
    }

    if (status) {
      updates.push('status = ?');
      values.push(status);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(ticket.id);
    db.prepare(`UPDATE tickets SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    return NextResponse.json({ 
      message: 'Ticket updated successfully',
      ticket_number: ticket.ticket_number,
      boarding_status: boarding_status || ticket.boarding_status
    });
  } catch (error) {
    console.error('Error updating ticket:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST validate ticket by QR code
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
    const { qr_code } = body;

    if (!qr_code) {
      return NextResponse.json({ error: 'QR code required' }, { status: 400 });
    }

    // Decode QR and find ticket
    let ticketNumber: string;
    try {
      const decoded_qr = Buffer.from(qr_code, 'base64').toString('utf-8');
      const parts = decoded_qr.split('|');
      ticketNumber = parts[0];
    } catch {
      return NextResponse.json({ error: 'Invalid QR code' }, { status: 400 });
    }

    const ticket = db.prepare(`
      SELECT 
        t.*,
        p.full_name as passenger_name,
        p.phone_number,
        p.id_type,
        p.id_number,
        b.booking_reference,
        b.status as booking_status,
        b.payment_status,
        r.origin,
        r.destination,
        r.date,
        r.departure_time,
        bus.company_id
      FROM tickets t
      JOIN passengers p ON t.passenger_id = p.id
      JOIN bookings b ON t.booking_id = b.id
      JOIN routes r ON b.route_id = r.id
      JOIN buses bus ON r.bus_id = bus.id
      WHERE t.ticket_number = ?
    `).get(ticketNumber) as any;

    if (!ticket) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Ticket not found' 
      }, { status: 404 });
    }

    // Verify company
    if (decoded.user_type === 'company' && ticket.company_id !== decoded.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Check validity
    const validationResult = {
      valid: true,
      ticket_number: ticket.ticket_number,
      passenger_name: ticket.passenger_name,
      seat_number: ticket.seat_number,
      origin: ticket.origin,
      destination: ticket.destination,
      date: ticket.date,
      departure_time: ticket.departure_time,
      status: ticket.status,
      boarding_status: ticket.boarding_status,
      booking_status: ticket.booking_status,
      payment_status: ticket.payment_status,
      warnings: [] as string[]
    };

    if (ticket.status === 'cancelled') {
      validationResult.valid = false;
      validationResult.warnings.push('Ticket has been cancelled');
    }

    if (ticket.status === 'used') {
      validationResult.valid = false;
      validationResult.warnings.push('Ticket has already been used');
    }

    if (ticket.booking_status === 'cancelled') {
      validationResult.valid = false;
      validationResult.warnings.push('Booking has been cancelled');
    }

    if (ticket.payment_status !== 'paid') {
      validationResult.warnings.push(`Payment status: ${ticket.payment_status}`);
    }

    if (ticket.boarding_status === 'boarded') {
      validationResult.warnings.push('Passenger already boarded');
    }

    return NextResponse.json(validationResult);
  } catch (error) {
    console.error('Error validating ticket:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
