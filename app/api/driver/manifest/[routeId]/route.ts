// app/api/driver/manifest/[routeId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyDriverToken } from '@/app/lib/driver-auth';
import db from '@/app/lib/database-schema';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ routeId: string }> }
) {
  try {
    console.log('🔍 Manifest API called');
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      console.log('❌ No token provided');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyDriverToken(token);
    if (!decoded) {
      console.log('❌ Invalid driver token');
      return NextResponse.json({ error: 'Invalid driver token' }, { status: 401 });
    }

    console.log('✅ Driver authenticated:', { id: decoded.id, name: decoded.name });

    const { routeId } = await params;
    console.log('🔍 Fetching manifest for route:', routeId);

    const driverId = decoded.id;

    // First, check if route exists and is assigned to this driver
    const route = db.prepare(`
      SELECT 
        r.id,
        r.origin,
        r.destination,
        r.departure_time,
        r.arrival_time,
        r.date,
        r.status,
        b.bus_name,
        b.bus_number,
        b.company_id
      FROM routes r
      JOIN buses b ON r.bus_id = b.id
      WHERE r.id = ? AND r.driver_id = ?
    `).get(routeId, driverId) as any;

    console.log('🔍 Route check result:', route);

    if (!route) {
      console.log('❌ Route not found or not assigned to this driver');
      return NextResponse.json(
        { error: 'Route not found or not assigned to you' },
        { status: 404 }
      );
    }

    // Verify company matches (extra security)
    if (route.company_id !== decoded.company_id) {
      console.log('❌ Company mismatch:', { routeCompany: route.company_id, driverCompany: decoded.company_id });
      return NextResponse.json(
        { error: 'Unauthorized access to this route' },
        { status: 403 }
      );
    }

    console.log('✅ Route verified, fetching passengers...');

    // Get all passengers for this trip with their booking and ticket info
    // Using correct column names from your schema
    const passengers = db.prepare(`
      SELECT 
        p.id as passenger_id,
        p.full_name,
        p.phone_number,
        p.seat_number,
        p.special_needs,
        p.id_type,
        p.id_number,
        t.id as ticket_id,
        t.ticket_number,
        t.boarding_status,
        t.status as ticket_status,
        b.id as booking_id,
        b.booking_reference,
        b.boarding_point,
        b.luggage_count
      FROM bookings b
      JOIN passengers p ON b.id = p.booking_id
      LEFT JOIN tickets t ON p.id = t.passenger_id
      WHERE b.route_id = ? 
        AND b.status = 'confirmed'
      ORDER BY p.seat_number ASC
    `).all(routeId);

    console.log(`✅ Found ${passengers.length} passengers`);

    // Calculate summary
    const summary = {
      total_passengers: passengers.length,
      boarded: passengers.filter((p: any) => p.boarding_status === 'boarded').length,
      not_boarded: passengers.filter((p: any) => p.boarding_status === 'not_boarded').length,
      missed: passengers.filter((p: any) => p.boarding_status === 'missed').length
    };

    console.log('📊 Summary:', summary);

    return NextResponse.json({
      success: true,
      route: {
        id: route.id,
        origin: route.origin,
        destination: route.destination,
        departure_time: route.departure_time,
        arrival_time: route.arrival_time,
        date: route.date,
        bus_name: route.bus_name,
        bus_number: route.bus_number
      },
      passengers,
      summary
    });

  } catch (error) {
    console.error('❌ Error fetching manifest:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}