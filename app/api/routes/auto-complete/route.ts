import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/database-schema';
import { verifyToken } from '@/app/lib/auth';

// POST - Auto-complete past routes (marks routes as completed when date has passed)
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    let query = `
      UPDATE routes 
      SET status = 'completed' 
      WHERE date < ? AND status = 'active'
    `;
    const params: any[] = [today];

    // If company user, only complete their routes
    if (decoded.user_type === 'company') {
      query = `
        UPDATE routes 
        SET status = 'completed' 
        WHERE date < ? 
        AND status = 'active'
        AND bus_id IN (SELECT id FROM buses WHERE company_id = ?)
      `;
      params.push(decoded.id);
    }

    const result = db.prepare(query).run(...params);

    // Also mark associated bookings as completed if they haven't departed yet
    let bookingQuery = `
      UPDATE bookings 
      SET status = 'completed' 
      WHERE route_id IN (
        SELECT r.id FROM routes r 
        WHERE r.date < ? AND r.status = 'completed'
      )
      AND status = 'confirmed'
    `;

    if (decoded.user_type === 'company') {
      bookingQuery = `
        UPDATE bookings 
        SET status = 'completed' 
        WHERE route_id IN (
          SELECT r.id FROM routes r 
          JOIN buses b ON r.bus_id = b.id
          WHERE r.date < ? AND r.status = 'completed' AND b.company_id = ?
        )
        AND status = 'confirmed'
      `;
    }

    const bookingResult = db.prepare(bookingQuery).run(...params);

    return NextResponse.json({ 
      message: 'Auto-completion successful',
      routesCompleted: result.changes,
      bookingsCompleted: bookingResult.changes
    });
    
  } catch (error: any) {
    console.error('Error auto-completing routes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Get count of routes that need auto-completion
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

    const today = new Date().toISOString().split('T')[0];

    let query = `
      SELECT COUNT(*) as count FROM routes 
      WHERE date < ? AND status = 'active'
    `;
    const params: any[] = [today];

    if (decoded.user_type === 'company') {
      query = `
        SELECT COUNT(*) as count FROM routes r
        JOIN buses b ON r.bus_id = b.id
        WHERE r.date < ? AND r.status = 'active' AND b.company_id = ?
      `;
      params.push(decoded.id);
    }

    const result = db.prepare(query).get(...params) as { count: number };

    return NextResponse.json({ 
      pendingCompletion: result.count
    });
    
  } catch (error: any) {
    console.error('Error getting pending completions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
