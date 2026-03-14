import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/database-schema';
import { verifyToken } from '@/app/lib/auth';

// GET company buses with enhanced details
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

    // Get buses with performance metrics
    const buses = db.prepare(`
      SELECT 
        b.*,
        COUNT(DISTINCT r.id) as activeRoutes,
        COUNT(DISTINCT bk.id) as totalBookings,
        COALESCE(SUM(bk.company_earnings), 0) as revenue,
        AVG(CASE WHEN r.status = 'active' THEN 
          CAST((b.total_seats - r.available_seats) AS FLOAT) / b.total_seats * 100 
          ELSE NULL END) as averageOccupancy
      FROM buses b
      LEFT JOIN routes r ON b.id = r.bus_id AND r.date >= date('now', '-30 days')
      LEFT JOIN bookings bk ON r.id = bk.route_id AND bk.status = 'confirmed'
      WHERE b.company_id = ?
      GROUP BY b.id
      ORDER BY b.created_at DESC
    `).all(companyId);

    // Format the results
    const formattedBuses = buses.map((bus: any) => ({
      ...bus,
      activeRoutes: bus.activeRoutes || 0,
      totalBookings: bus.totalBookings || 0,
      revenue: Math.round((bus.revenue || 0) * 100) / 100,
      averageOccupancy: Math.round((bus.averageOccupancy || 0) * 10) / 10
    }));

    return NextResponse.json({ buses: formattedBuses });
    
  } catch (error: any) {
    console.error('Error fetching company buses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create new bus
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
    const { bus_number, bus_name, total_seats, bus_type, amenities } = body;

    if (!bus_number || !bus_name || !total_seats) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const companyId = decoded.id;

    // Check if bus number already exists for this company
    const existingBus = db.prepare(`
      SELECT id FROM buses WHERE company_id = ? AND bus_number = ?
    `).get(companyId, bus_number);

    if (existingBus) {
      return NextResponse.json({ error: 'Bus number already exists' }, { status: 400 });
    }

    // Calculate trial end date (14 days from now)
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14);
    const trialEndDateStr = trialEndDate.toISOString().split('T')[0];

    // Create new bus with trial period
    const result = db.prepare(`
      INSERT INTO buses (
        company_id, bus_number, bus_name, total_seats, bus_type, 
        amenities, status, subscription_status, trial_end_date
      ) VALUES (?, ?, ?, ?, ?, ?, 'active', 'trial', ?)
    `).run(companyId, bus_number, bus_name, total_seats, bus_type || 'Standard Coach', amenities || '', trialEndDateStr);

    return NextResponse.json({ 
      message: 'Bus created successfully',
      busId: result.lastInsertRowid 
    });
    
  } catch (error: any) {
    console.error('Error creating bus:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}