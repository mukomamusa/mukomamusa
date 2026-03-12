import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/database-schema';
import { verifyToken } from '@/app/lib/auth';
import { ensureSeatControlSchema, getRouteSeatSnapshot } from '@/app/lib/seat-controls';

function getCompanyRoute(routeId: number, companyId: number) {
  return db.prepare(`
    SELECT r.id, r.origin, r.destination, r.date, r.departure_time, r.arrival_time,
           r.dynamic_pricing_enabled, r.dynamic_price_multiplier,
           b.bus_name, b.bus_number, b.company_id
    FROM routes r
    JOIN buses b ON r.bus_id = b.id
    WHERE r.id = ?
  `).get(routeId) as any;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ routeId: string }> }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded || decoded.user_type !== 'company') {
      return NextResponse.json({ error: 'Company access only' }, { status: 403 });
    }

    const { routeId } = await params;
    const routeIdNum = parseInt(routeId, 10);
    if (!Number.isInteger(routeIdNum) || routeIdNum <= 0) {
      return NextResponse.json({ error: 'Invalid route id' }, { status: 400 });
    }

    ensureSeatControlSchema();
    const route = getCompanyRoute(routeIdNum, decoded.id);
    if (!route) return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    if (route.company_id !== decoded.id) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

    const snapshot = getRouteSeatSnapshot(routeIdNum);
    if (!snapshot) {
      return NextResponse.json({ error: 'Unable to build seat map' }, { status: 500 });
    }

    return NextResponse.json({
      route: {
        id: route.id,
        origin: route.origin,
        destination: route.destination,
        date: route.date,
        departure_time: route.departure_time,
        arrival_time: route.arrival_time,
        bus_name: route.bus_name,
        bus_number: route.bus_number,
        dynamic_pricing_enabled: snapshot.dynamicPricingEnabled,
        dynamic_price_multiplier: snapshot.dynamicPriceMultiplier,
        base_price: snapshot.basePrice,
        total_seats: snapshot.totalSeats,
      },
      summary: {
        available: snapshot.availableSeats,
        booked: snapshot.bookedCount,
        blocked: snapshot.blockedCount,
        reserved: snapshot.reservedCount,
        occupancy_rate: Math.round(snapshot.occupancyRate * 1000) / 10,
      },
      seats: snapshot.seats,
    });
  } catch (error) {
    console.error('Error fetching company route seats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ routeId: string }> }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded || decoded.user_type !== 'company') {
      return NextResponse.json({ error: 'Company access only' }, { status: 403 });
    }

    const { routeId } = await params;
    const routeIdNum = parseInt(routeId, 10);
    if (!Number.isInteger(routeIdNum) || routeIdNum <= 0) {
      return NextResponse.json({ error: 'Invalid route id' }, { status: 400 });
    }

    ensureSeatControlSchema();
    const route = getCompanyRoute(routeIdNum, decoded.id);
    if (!route) return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    if (route.company_id !== decoded.id) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

    const body = await request.json();
    const updates = Array.isArray(body?.updates) ? body.updates : [];

    if (body.dynamic_pricing_enabled !== undefined || body.dynamic_price_multiplier !== undefined) {
      const enabled = body.dynamic_pricing_enabled ? 1 : 0;
      const multiplier = Number(body.dynamic_price_multiplier ?? route.dynamic_price_multiplier ?? 1);
      if (!Number.isFinite(multiplier) || multiplier <= 0 || multiplier > 3) {
        return NextResponse.json({ error: 'dynamic_price_multiplier must be between 0 and 3' }, { status: 400 });
      }

      db.prepare(`
        UPDATE routes
        SET dynamic_pricing_enabled = ?, dynamic_price_multiplier = ?
        WHERE id = ?
      `).run(enabled, multiplier, routeIdNum);
    }

    if (updates.length > 0) {
      const upsert = db.prepare(`
        INSERT INTO route_seat_controls (route_id, seat_number, status, reason, reserved_until, updated_by, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(route_id, seat_number)
        DO UPDATE SET
          status = excluded.status,
          reason = excluded.reason,
          reserved_until = excluded.reserved_until,
          updated_by = excluded.updated_by,
          updated_at = CURRENT_TIMESTAMP
      `);

      const clear = db.prepare(`DELETE FROM route_seat_controls WHERE route_id = ? AND seat_number = ?`);
      const tx = db.transaction(() => {
        for (const update of updates) {
          const seatNumber = Number(update.seat_number);
          if (!Number.isInteger(seatNumber) || seatNumber < 1 || seatNumber > 500) {
            throw new Error(`Invalid seat number: ${update.seat_number}`);
          }

          const status = update.status;
          if (status === 'available') {
            clear.run(routeIdNum, seatNumber);
            continue;
          }

          if (status !== 'blocked' && status !== 'reserved') {
            throw new Error(`Invalid status for seat ${seatNumber}`);
          }

          const reason = typeof update.reason === 'string' ? update.reason.trim() : null;
          const reservedUntil = status === 'reserved' && update.reserved_until ? String(update.reserved_until) : null;

          upsert.run(
            routeIdNum,
            seatNumber,
            status,
            reason || null,
            reservedUntil,
            decoded.id
          );
        }
      });

      tx();
    }

    const snapshot = getRouteSeatSnapshot(routeIdNum);
    return NextResponse.json({
      message: 'Seat controls updated successfully',
      summary: snapshot
        ? {
            available: snapshot.availableSeats,
            booked: snapshot.bookedCount,
            blocked: snapshot.blockedCount,
            reserved: snapshot.reservedCount,
            occupancy_rate: Math.round(snapshot.occupancyRate * 1000) / 10,
          }
        : null,
    });
  } catch (error: any) {
    console.error('Error updating company route seats:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
