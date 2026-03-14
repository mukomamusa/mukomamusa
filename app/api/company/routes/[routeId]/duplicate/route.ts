import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/database-schema';
import { verifyToken } from '@/app/lib/auth';

// POST - Duplicate a route or create recurring routes
export async function POST(request: NextRequest, { params }: { params: Promise<{ routeId: string }> }) {
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

    // Get the original route
    const originalRoute = db.prepare(`
      SELECT r.*, b.company_id, b.total_seats FROM routes r
      JOIN buses b ON r.bus_id = b.id
      WHERE r.id = ?
    `).get(routeId) as any;

    if (!originalRoute) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }

    if (originalRoute.company_id !== decoded.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      dates,          // Array of dates for recurring routes: ['2026-02-13', '2026-02-14', ...]
      recurrence,     // OR use recurrence: 'daily' | 'weekly' | 'specific_days'
      start_date,     // Start date for recurrence
      end_date,       // End date for recurrence  
      days_of_week,   // For weekly: [0, 1, 2, 3, 4, 5, 6] where 0=Sunday
      new_bus_id,     // Optional: use a different bus
      new_price,      // Optional: different price
      new_departure_time, // Optional: different departure time
      new_arrival_time    // Optional: different arrival time
    } = body;

    // Use provided values or original route values
    const busId = new_bus_id || originalRoute.bus_id;
    const price = new_price || originalRoute.price;
    const departureTime = new_departure_time || originalRoute.departure_time;
    const arrivalTime = new_arrival_time || originalRoute.arrival_time;

    // Get bus total seats
    const bus = db.prepare('SELECT total_seats FROM buses WHERE id = ? AND company_id = ?')
      .get(busId, decoded.id) as { total_seats: number } | undefined;

    if (!bus) {
      return NextResponse.json({ error: 'Bus not found or not authorized' }, { status: 404 });
    }

    // Generate dates based on recurrence type
    let targetDates: string[] = [];

    if (dates && dates.length > 0) {
      // Explicit dates provided
      targetDates = dates;
    } else if (recurrence && start_date && end_date) {
      // Generate dates based on recurrence pattern
      const start = new Date(start_date);
      const end = new Date(end_date);
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.getDay();
        
        if (recurrence === 'daily') {
          targetDates.push(d.toISOString().split('T')[0]);
        } else if (recurrence === 'weekly' && days_of_week) {
          if (days_of_week.includes(dayOfWeek)) {
            targetDates.push(d.toISOString().split('T')[0]);
          }
        } else if (recurrence === 'weekdays') {
          // Monday to Friday (1-5)
          if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            targetDates.push(d.toISOString().split('T')[0]);
          }
        } else if (recurrence === 'weekends') {
          // Saturday and Sunday (0, 6)
          if (dayOfWeek === 0 || dayOfWeek === 6) {
            targetDates.push(d.toISOString().split('T')[0]);
          }
        }
      }
    } else {
      // Single duplicate - tomorrow by default
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      targetDates = [tomorrow.toISOString().split('T')[0]];
    }

    // Create routes for each date
    const createdRoutes: number[] = [];
    const skippedDates: string[] = [];

    const insertStmt = db.prepare(`
      INSERT INTO routes (
        bus_id, origin, destination, departure_time, arrival_time,
        price, date, intermediate_stops, available_seats, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `);

    const checkConflict = db.prepare(`
      SELECT id FROM routes 
      WHERE bus_id = ? AND date = ? AND departure_time = ? AND status = 'active'
    `);

    for (const date of targetDates) {
      // Check for existing route at same bus/date/time
      const conflict = checkConflict.get(busId, date, departureTime);
      
      if (conflict) {
        skippedDates.push(date);
        continue;
      }

      const result = insertStmt.run(
        busId,
        originalRoute.origin,
        originalRoute.destination,
        departureTime,
        arrivalTime,
        price,
        date,
        originalRoute.intermediate_stops || '',
        bus.total_seats
      );
      
      createdRoutes.push(Number(result.lastInsertRowid));
    }

    return NextResponse.json({ 
      message: `Created ${createdRoutes.length} route(s)`,
      created: createdRoutes.length,
      skipped: skippedDates.length,
      skippedDates: skippedDates,
      routeIds: createdRoutes
    });
    
  } catch (error: any) {
    console.error('Error duplicating route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
