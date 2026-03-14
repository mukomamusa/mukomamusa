import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/database-schema';
import { verifyToken } from '@/app/lib/auth';

// GET company bookings with detailed information
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
    const recent = searchParams.get('recent') === 'true';
    const statusFilter = searchParams.get('status') || '';
    const dateFilter = searchParams.get('date') || '';

    let query = `
      SELECT 
        bk.*,
        r.origin,
        r.destination,
        r.date,
        r.departure_time,
        r.arrival_time,
        b.bus_name,
        b.bus_number,
        u.name as customer_name,
        u.phone as customer_phone,
        u.email as customer_email,
        COUNT(p.id) as passenger_count
      FROM bookings bk
      JOIN routes r ON bk.route_id = r.id
      JOIN buses b ON r.bus_id = b.id
      JOIN users u ON bk.customer_id = u.id
      LEFT JOIN passengers p ON bk.id = p.booking_id
      WHERE b.company_id = ?
    `;
    
    const params: any[] = [companyId];

    if (statusFilter) {
      query += ` AND bk.status = ?`;
      params.push(statusFilter);
    }

    if (dateFilter) {
      query += ` AND r.date = ?`;
      params.push(dateFilter);
    }

    query += ` GROUP BY bk.id`;

    if (recent) {
      query += ` ORDER BY bk.created_at DESC LIMIT 10`;
    } else {
      query += ` ORDER BY r.date DESC, r.departure_time ASC`;
    }

    const bookings = db.prepare(query).all(...params);

    // Get passengers for each booking if not recent
    if (!recent) {
      for (const booking of bookings as any[]) {
        booking.passengers = db.prepare(`
          SELECT * FROM passengers WHERE booking_id = ? ORDER BY seat_number
        `).all(booking.id);
      }
    }

    return NextResponse.json({ bookings });
    
  } catch (error: any) {
    console.error('Error fetching company bookings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}