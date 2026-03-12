import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/database-schema';
import { verifyToken } from '@/app/lib/auth';

// GET dashboard statistics for company
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

    // Get comprehensive dashboard statistics
    const stats = {
      // Bus statistics
      ...db.prepare(`
        SELECT 
          COUNT(*) as totalBuses,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as activeBuses
        FROM buses WHERE company_id = ?
      `).get(companyId) as any,

      // Route statistics  
      ...db.prepare(`
        SELECT 
          COUNT(DISTINCT r.id) as totalRoutes,
          COUNT(DISTINCT CASE WHEN r.status = 'active' AND r.date >= date('now') THEN r.id END) as activeRoutes
        FROM routes r
        JOIN buses b ON r.bus_id = b.id
        WHERE b.company_id = ?
      `).get(companyId) as any,

      // Booking statistics
      ...db.prepare(`
        SELECT 
          COUNT(DISTINCT bk.id) as totalBookings,
          COUNT(DISTINCT CASE WHEN date(bk.created_at) = date('now') THEN bk.id END) as todayBookings,
          COUNT(DISTINCT CASE WHEN bk.status = 'cancelled' THEN bk.id END) as cancelledBookings,
          COUNT(DISTINCT CASE WHEN bk.refund_status = 'pending' THEN bk.id END) as pendingRefunds,
          COUNT(p.id) as totalPassengers,
          COUNT(CASE WHEN date(bk.created_at) = date('now') THEN p.id END) as todayPassengers
        FROM bookings bk
        JOIN routes r ON bk.route_id = r.id  
        JOIN buses b ON r.bus_id = b.id
        LEFT JOIN passengers p ON bk.id = p.booking_id
        WHERE b.company_id = ? AND bk.status IN ('confirmed', 'completed', 'cancelled')
      `).get(companyId) as any,

      // Revenue statistics
      ...db.prepare(`
        SELECT 
          COALESCE(SUM(bk.company_earnings), 0) as totalRevenue,
          COALESCE(SUM(CASE WHEN date(bk.created_at) >= date('now', 'start of month') THEN bk.company_earnings ELSE 0 END), 0) as thisMonthRevenue
        FROM bookings bk
        JOIN routes r ON bk.route_id = r.id
        JOIN buses b ON r.bus_id = b.id  
        WHERE b.company_id = ? AND bk.status IN ('confirmed', 'completed')
      `).get(companyId) as any
    };

    // Calculate average occupancy
    const occupancyData = db.prepare(`
      SELECT 
        AVG(CAST((b.total_seats - r.available_seats) AS FLOAT) / b.total_seats * 100) as averageOccupancy
      FROM routes r
      JOIN buses b ON r.bus_id = b.id
      WHERE b.company_id = ? AND r.status = 'active' AND r.date >= date('now')
    `).get(companyId) as any;

    stats.averageOccupancy = Math.round((occupancyData.averageOccupancy || 0) * 10) / 10;
    stats.totalPassengers = stats.totalPassengers || 0;
    stats.todayPassengers = stats.todayPassengers || 0;

    return NextResponse.json(stats);
    
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}