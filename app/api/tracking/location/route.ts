import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/database-tracking';
import { verifyToken } from '@/app/lib/auth';
import { verifyDriverToken } from '@/app/lib/driver-auth';
import { createGPSProvider, GPSDataProcessor, type GPSLocation } from '@/app/lib/gps-providers';
import { processLocationUpdate } from '@/app/lib/tracking-engine';

function getAuthActor(authHeader: string | null) {
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  const driver = verifyDriverToken(token);
  if (driver) {
    return { kind: 'driver' as const, driverId: driver.id, companyId: driver.company_id };
  }
  const user = verifyToken(token);
  if (user) {
    return { kind: 'user' as const, userId: user.id, userType: user.user_type };
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authActor = getAuthActor(request.headers.get('authorization'));
    const webhookSecret = request.headers.get('x-webhook-secret');

    let tripId: number;
    let busId: number;
    let gpsDeviceId: number | null = null;
    let location: GPSLocation;

    if (webhookSecret || body.provider_device_id || body.device_id || body.imei) {
      const device = db.prepare(`
        SELECT gd.*, b.company_id
        FROM gps_devices gd
        JOIN buses b ON gd.bus_id = b.id
        WHERE (gd.provider_device_id = ? OR gd.device_imei = ?) AND gd.status = 'active'
      `).get(body.provider_device_id || body.device_id || body.imei, body.imei || body.device_id || '') as any;

      if (!device) {
        return NextResponse.json({ error: 'Unknown GPS device' }, { status: 404 });
      }

      const activeTrip = db.prepare(`
        SELECT id, bus_id FROM trips
        WHERE bus_id = ? AND status IN ('boarding', 'in_transit', 'delayed')
        ORDER BY created_at DESC LIMIT 1
      `).get(device.bus_id) as any;

      if (!activeTrip) {
        return NextResponse.json({ message: 'Location received but no active trip', device_id: device.id });
      }

      const provider = createGPSProvider({
        provider: device.provider,
        webhook_secret: process.env.GPS_WEBHOOK_SECRET,
      } as any);

      const parsed = provider.parseWebhookPayload(body, Object.fromEntries(request.headers));
      if (!parsed) {
        return NextResponse.json({ error: 'Failed to parse GPS data' }, { status: 400 });
      }

      tripId = activeTrip.id;
      busId = device.bus_id;
      gpsDeviceId = device.id;
      location = parsed.location;

      db.prepare(`UPDATE gps_devices SET last_seen_at = CURRENT_TIMESTAMP WHERE id = ?`).run(device.id);
    } else {
      if (!authActor) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }

      const { trip_id, latitude, longitude, altitude, speed, heading, accuracy } = body;
      if (!latitude || !longitude) {
        return NextResponse.json({ error: 'Missing required fields: latitude, longitude' }, { status: 400 });
      }

      let trip: any = null;
      if (trip_id) {
        trip = db.prepare(`
          SELECT t.*, b.company_id
          FROM trips t
          JOIN buses b ON t.bus_id = b.id
          WHERE t.id = ? AND t.status IN ('boarding', 'in_transit', 'delayed')
        `).get(trip_id);
      } else {
        if (authActor.kind === 'driver') {
          trip = db.prepare(`
            SELECT t.*, b.company_id
            FROM trips t
            JOIN buses b ON t.bus_id = b.id
            JOIN routes r ON t.route_id = r.id
            WHERE r.driver_id = ? AND t.status IN ('boarding', 'in_transit', 'delayed')
            ORDER BY t.created_at DESC LIMIT 1
          `).get(authActor.driverId);
        } else if (authActor.userType === 'company') {
          trip = db.prepare(`
            SELECT t.*, b.company_id
            FROM trips t
            JOIN buses b ON t.bus_id = b.id
            WHERE b.company_id = ? AND t.status IN ('boarding', 'in_transit', 'delayed')
            ORDER BY t.created_at DESC LIMIT 1
          `).get(authActor.userId);
        }
      }

      if (!trip) {
        return NextResponse.json({ error: 'Trip not found or not active' }, { status: 404 });
      }

      if (authActor.kind === 'driver' && authActor.companyId !== trip.company_id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      if (authActor.kind === 'user' && authActor.userType === 'company' && authActor.userId !== trip.company_id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      tripId = trip.id;
      busId = trip.bus_id;
      gpsDeviceId = trip.gps_device_id;
      location = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        altitude: altitude ? parseFloat(altitude) : undefined,
        speed: speed ? parseFloat(speed) : undefined,
        heading: heading ? parseFloat(heading) : undefined,
        accuracy: accuracy ? parseFloat(accuracy) : undefined,
        timestamp: body.timestamp || new Date().toISOString(),
        source: 'gps',
        provider: 'driver_app',
      };
    }

    if (!GPSDataProcessor.validateZambiaCoordinates(location.latitude, location.longitude)) {
      return NextResponse.json({ error: 'Coordinates outside Zambia boundary' }, { status: 400 });
    }

    const update = processLocationUpdate(tripId, busId, gpsDeviceId, location);
    if (!update) {
      return NextResponse.json({ error: 'Failed to process location update' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Location updated successfully',
      trip_id: tripId,
      status: update.status,
      eta: update.eta?.eta_iso,
      progress: update.progress_percent,
      nearest_city: update.nearest_city,
      distance_remaining_km: update.distance_to_destination_km,
      geofence_events: update.geofence_events.length,
    });
  } catch (error) {
    console.error('Error processing location:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authActor = getAuthActor(request.headers.get('authorization'));
    if (!authActor) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tripId = Number(searchParams.get('trip_id'));
    if (!tripId) {
      return NextResponse.json({ error: 'trip_id is required' }, { status: 400 });
    }

    const trip = db.prepare(`
      SELECT t.*, b.company_id, r.origin, r.destination
      FROM trips t
      JOIN buses b ON t.bus_id = b.id
      JOIN routes r ON t.route_id = r.id
      WHERE t.id = ?
    `).get(tripId) as any;

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    if (authActor.kind === 'driver' && authActor.companyId !== trip.company_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const location = db.prepare(`
      SELECT latitude, longitude, speed, heading, recorded_at
      FROM bus_locations
      WHERE trip_id = ?
      ORDER BY recorded_at DESC
      LIMIT 1
    `).get(tripId) as any;

    return NextResponse.json({
      trip: {
        id: trip.id,
        origin: trip.origin,
        destination: trip.destination,
        status: trip.status,
        scheduled_arrival: trip.scheduled_arrival,
        current_eta: trip.current_eta,
        delay_minutes: trip.delay_minutes,
      },
      location: location || null,
    });
  } catch (error) {
    console.error('Error getting location:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
