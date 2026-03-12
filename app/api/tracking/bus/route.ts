import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/database-tracking';
import { verifyToken } from '@/app/lib/auth';
import { verifyDriverToken } from '@/app/lib/driver-auth';
import { getTripForBooking } from '@/app/lib/tracking-engine';
import { estimateRouteProgress, getCityCoordinates, calculateDistance } from '@/app/lib/zambia-coordinates';

/**
 * GET /api/tracking/bus
 * Public mode: ?booking_ref=ABC123 (customer tracking)
 * Auth mode: ?bus_id=X (company/driver internal tracking)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const busId = searchParams.get('bus_id');
    const bookingRef = searchParams.get('booking_ref');
    const authHeader = request.headers.get('authorization');

    // Public mode: customer tracking by booking reference
    if (bookingRef) {
      const normalizedRef = bookingRef.trim().toUpperCase();
      const trip = getTripForBooking(normalizedRef);

      if (!trip) {
        const booking = db.prepare(`
          SELECT bk.*, r.origin, r.destination, r.departure_time, r.arrival_time, r.date,
            b.bus_name, b.bus_number, u.company_name
          FROM bookings bk
          JOIN routes r ON bk.route_id = r.id
          JOIN buses b ON r.bus_id = b.id
          JOIN users u ON b.company_id = u.id
          WHERE bk.booking_reference = ?
        `).get(normalizedRef) as any;

        if (!booking) {
          return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        const latestTripForRoute = db.prepare(`
          SELECT t.status
          FROM trips t
          JOIN routes r ON t.route_id = r.id
          JOIN bookings bk ON bk.route_id = r.id
          WHERE bk.booking_reference = ?
          ORDER BY t.created_at DESC
          LIMIT 1
        `).get(normalizedRef) as any;

        const hasEnded = latestTripForRoute && ['completed', 'cancelled'].includes(latestTripForRoute.status);
        const trackingMessage = hasEnded
          ? 'This trip has ended and live tracking is no longer available for this booking.'
          : 'Bus tracking is not yet active for this trip. Tracking starts when the bus begins boarding.';

        return NextResponse.json({
          tracking_available: false,
          message: trackingMessage,
          trip_status: latestTripForRoute?.status || 'scheduled',
          booking: {
            reference: booking.booking_reference,
            origin: booking.origin,
            destination: booking.destination,
            date: booking.date,
            departure_time: booking.departure_time,
            arrival_time: booking.arrival_time,
            bus_name: booking.bus_name,
            bus_number: booking.bus_number,
            company_name: booking.company_name,
            status: booking.status,
            seat_numbers: booking.seat_numbers,
          },
        });
      }

      const progress = trip.origin && trip.destination && trip.current_latitude
        ? estimateRouteProgress(trip.current_latitude, trip.current_longitude!, trip.origin, trip.destination)
        : 0;

      const destinationCoordinates = trip.destination ? getCityCoordinates(trip.destination) : null;
      const distanceToDestination = destinationCoordinates && trip.current_latitude
        ? calculateDistance(
            trip.current_latitude,
            trip.current_longitude!,
            destinationCoordinates.latitude,
            destinationCoordinates.longitude
          )
        : null;

      const etaFormatted = trip.current_eta
        ? new Date(trip.current_eta).toLocaleTimeString('en-ZM', { hour: '2-digit', minute: '2-digit', hour12: true })
        : null;

      return NextResponse.json({
        tracking_available: true,
        trip: {
          id: trip.id,
          status: trip.status,
          origin: trip.origin,
          destination: trip.destination,
          bus_name: trip.bus_name,
          bus_number: trip.bus_number,
          company_name: trip.company_name,
          driver_name: trip.driver_name,
          scheduled_departure: trip.scheduled_departure,
          scheduled_arrival: trip.scheduled_arrival,
          actual_departure: trip.actual_departure,
        },
        location: trip.current_latitude ? {
          latitude: trip.current_latitude,
          longitude: trip.current_longitude,
          speed_kmh: trip.current_speed,
          heading: trip.current_heading,
          last_updated: trip.last_location_update,
        } : null,
        eta: {
          estimated_arrival: trip.current_eta,
          formatted: etaFormatted,
          delay_minutes: trip.delay_minutes,
          is_delayed: trip.delay_minutes > 10,
          delay_reason: trip.delay_reason,
        },
        progress: {
          percent: progress,
          distance_covered_km: trip.distance_covered_km,
          total_distance_km: trip.total_distance_km,
          distance_remaining_km: distanceToDestination ? Math.round(distanceToDestination * 10) / 10 : null,
          next_stop: trip.next_stop,
          next_stop_eta: trip.next_stop_eta,
        },
      });
    }

    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (!busId) {
      return NextResponse.json({ error: 'bus_id required (or use booking_ref for public customer tracking)' }, { status: 400 });
    }

    const token = authHeader.replace('Bearer ', '');
    const userDecoded = verifyToken(token);
    const driverDecoded = userDecoded ? null : verifyDriverToken(token);

    if (!userDecoded && !driverDecoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get bus info
    const bus = db.prepare(`
      SELECT b.*, u.company_name
      FROM buses b
      JOIN users u ON b.company_id = u.id
      WHERE b.id = ?
    `).get(busId) as any;

    if (!bus) {
      return NextResponse.json({ error: 'Bus not found' }, { status: 404 });
    }

    // Verify access
    if (userDecoded?.user_type === 'company' && userDecoded.id !== bus.company_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (driverDecoded && driverDecoded.company_id !== bus.company_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get active trip
    const trip = db.prepare(`
      SELECT t.*, r.origin, r.destination
      FROM trips t
      JOIN routes r ON t.route_id = r.id
      WHERE t.bus_id = ? AND t.status IN ('boarding', 'in_transit', 'delayed', 'arrived')
      ORDER BY t.created_at DESC
      LIMIT 1
    `).get(busId) as any;

    // Get latest location
    const location = trip ? db.prepare(`
      SELECT * FROM bus_locations
      WHERE trip_id = ?
      ORDER BY recorded_at DESC
      LIMIT 1
    `).get(trip.id) : null;

    // Get GPS device info
    const device = db.prepare(`
      SELECT * FROM gps_devices WHERE bus_id = ? AND status = 'active'
    `).get(busId) as any;

    return NextResponse.json({
      bus: {
        id: bus.id,
        name: bus.bus_name,
        number: bus.bus_number,
        type: bus.bus_type,
        total_seats: bus.total_seats,
        company: bus.company_name,
      },
      gps_device: device ? {
        id: device.id,
        provider: device.provider,
        status: device.status,
        last_seen: device.last_seen_at,
      } : null,
      current_trip: trip ? {
        id: trip.id,
        origin: trip.origin,
        destination: trip.destination,
        status: trip.status,
        scheduled_departure: trip.scheduled_departure,
        scheduled_arrival: trip.scheduled_arrival,
        actual_departure: trip.actual_departure,
        current_eta: trip.current_eta,
        delay_minutes: trip.delay_minutes,
        passenger_count: trip.passenger_count,
      } : null,
      location: location ? {
        latitude: (location as any).latitude,
        longitude: (location as any).longitude,
        altitude: (location as any).altitude,
        speed: (location as any).speed,
        heading: (location as any).heading,
        recorded_at: (location as any).recorded_at,
      } : null,
    });

  } catch (error) {
    console.error('Error getting bus tracking:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
