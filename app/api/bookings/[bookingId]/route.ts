import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/database-schema';
import { verifyToken } from '@/app/lib/auth';

// GET single booking details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const booking = db.prepare(`
      SELECT 
        bk.*,
        r.origin,
        r.destination,
        r.date,
        r.departure_time,
        r.arrival_time,
        r.price,
        b.bus_name,
        b.bus_number,
        b.company_id,
        u.name as customer_name,
        u.phone as customer_phone,
        u.email as customer_email
      FROM bookings bk
      JOIN routes r ON bk.route_id = r.id
      JOIN buses b ON r.bus_id = b.id
      JOIN users u ON bk.customer_id = u.id
      WHERE bk.id = ?
    `).get(bookingId);

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check authorization - company can only view their own bookings
    if (decoded.user_type === 'company' && (booking as any).company_id !== decoded.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get passengers for this booking
    const passengers = db.prepare(`
      SELECT * FROM passengers WHERE booking_id = ? ORDER BY seat_number
    `).all(bookingId);

    return NextResponse.json({ 
      booking: { ...(booking as any), passengers } 
    });
    
  } catch (error: any) {
    console.error('Error fetching booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH update booking status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get current booking to check ownership
    const existingBooking = db.prepare(`
      SELECT bk.*, b.company_id
      FROM bookings bk
      JOIN routes r ON bk.route_id = r.id
      JOIN buses b ON r.bus_id = b.id
      WHERE bk.id = ?
    `).get(bookingId) as any;

    if (!existingBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check authorization
    if (decoded.user_type === 'company' && existingBooking.company_id !== decoded.id) {
      return NextResponse.json({ error: 'Unauthorized to modify this booking' }, { status: 403 });
    }

    const body = await request.json();
    const { status, payment_status } = body;

    // Validate status changes for completed bookings
    if (status === 'cancelled' && existingBooking.status === 'completed') {
      return NextResponse.json({ error: 'Cannot cancel a completed booking' }, { status: 400 });
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (status) {
      updates.push('status = ?');
      values.push(status);
      
      // Set appropriate timestamp based on status
      if (status === 'confirmed' || status === 'completed') {
        updates.push('confirmed_at = datetime(\'now\')');
      } else if (status === 'cancelled') {
        updates.push('cancelled_at = datetime(\'now\')');
      }
    }

    if (payment_status) {
      updates.push('payment_status = ?');
      values.push(payment_status);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    values.push(bookingId);

    const result = db.prepare(`
      UPDATE bookings 
      SET ${updates.join(', ')}
      WHERE id = ?
    `).run(...values);

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
    }

    // Get updated booking
    const updatedBooking = db.prepare(`
      SELECT * FROM bookings WHERE id = ?
    `).get(bookingId);

    return NextResponse.json({ 
      message: 'Booking updated successfully',
      booking: updatedBooking 
    });
    
  } catch (error: any) {
    console.error('Error updating booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
