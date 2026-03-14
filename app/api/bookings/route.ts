import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/database-schema';
import { verifyToken, generateBookingReference, generateTicketNumber, generateQRCode } from '@/app/lib/auth';
import { ensureSeatControlSchema, getRouteSeatSnapshot, calculateSeatPrice } from '@/app/lib/seat-controls';

// Define interfaces for database results
interface CountResult {
  count: number;
}

interface RouteResult {
  id: number;
  total_seats: number;
  available_seats: number;
  price: number;
  subscription_status?: string;
  trial_end_date?: string;
  subscription_end_date?: string;
  [key: string]: any;
}

interface BookingResult {
  id: number;
  customer_id: number;
  route_id: number;
  total_price: number;
  num_seats: number;
  status: string;
  [key: string]: any;
}

// GET bookings for user
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Pagination
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    const offset = (page - 1) * limit;
    let bookings, totalCount;
    
    if (decoded.user_type === 'customer') {
      const countResult = db.prepare(`SELECT COUNT(*) as count FROM bookings WHERE customer_id = ?`).get(decoded.id) as CountResult | undefined;
      totalCount = countResult?.count || 0;
      
      bookings = db.prepare(`
        SELECT 
          b.*,
          r.origin,
          r.destination,
          r.departure_time,
          r.arrival_time,
          r.date,
          bus.bus_name,
          bus.bus_number,
          bus.company_id,
          u.company_name
        FROM bookings b
        JOIN routes r ON b.route_id = r.id
        JOIN buses bus ON r.bus_id = bus.id
        JOIN users u ON bus.company_id = u.id
        WHERE b.customer_id = ?
        ORDER BY r.date DESC, r.departure_time DESC
        LIMIT ? OFFSET ?
      `).all(decoded.id, limit, offset);

      // Get passengers and tickets for each booking
      for (const booking of bookings as any[]) {
        booking.passengers = db.prepare(`
          SELECT p.*, t.ticket_number, t.qr_code, t.status as ticket_status, t.boarding_status
          FROM passengers p
          LEFT JOIN tickets t ON t.passenger_id = p.id
          WHERE p.booking_id = ?
        `).all(booking.id);
      }
    } else {
      const countResult = db.prepare(`
        SELECT COUNT(*) as count
        FROM bookings b
        JOIN routes r ON b.route_id = r.id
        JOIN buses bus ON r.bus_id = bus.id
        WHERE bus.company_id = ?
      `).get(decoded.id) as CountResult | undefined;
      totalCount = countResult?.count || 0;
      
      bookings = db.prepare(`
        SELECT 
          b.*,
          r.origin,
          r.destination,
          r.departure_time,
          r.arrival_time,
          r.date,
          bus.bus_name,
          bus.bus_number,
          u.name as customer_name,
          u.phone as customer_phone,
          u.email as customer_email
        FROM bookings b
        JOIN routes r ON b.route_id = r.id
        JOIN buses bus ON r.bus_id = bus.id
        JOIN users u ON b.customer_id = u.id
        WHERE bus.company_id = ?
        ORDER BY r.date DESC, r.departure_time DESC
        LIMIT ? OFFSET ?
      `).all(decoded.id, limit, offset);

      // Get passengers for each booking (for manifest)
      for (const booking of bookings as any[]) {
        booking.passengers = db.prepare(`
          SELECT p.*, t.ticket_number, t.boarding_status
          FROM passengers p
          LEFT JOIN tickets t ON t.passenger_id = p.id
          WHERE p.booking_id = ?
        `).all(booking.id);
      }
    }

    const totalPages = Math.ceil(totalCount / limit);
    return NextResponse.json({ bookings, totalPages });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST create new booking with passengers and tickets (customer only)
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.user_type !== 'customer') {
      return NextResponse.json(
        { error: 'Unauthorized - Customer access only' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { 
      route_id, 
      num_seats, 
      luggage_count, 
      boarding_point, 
      dropping_point,
      passengers, // Array of passenger details
      selected_seats
    } = body;

    if (!route_id || !num_seats || !boarding_point) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate passengers if provided
    if (passengers && passengers.length !== num_seats) {
      return NextResponse.json(
        { error: 'Number of passengers must match number of seats' },
        { status: 400 }
      );
    }

    // Start transaction
    const transaction = db.transaction(() => {
      ensureSeatControlSchema();

      // Get route details with bus subscription status (backward compatible)
      let route: RouteResult | undefined;
      let hasSubscriptionColumns = true;
      try {
        route = db.prepare(`
          SELECT r.*, b.total_seats, b.subscription_status, b.trial_end_date, b.subscription_end_date
          FROM routes r
          JOIN buses b ON r.bus_id = b.id
          WHERE r.id = ? AND r.status = 'active'
        `).get(route_id) as RouteResult | undefined;
      } catch (e) {
        // Fallback: no subscription columns
        hasSubscriptionColumns = false;
        route = db.prepare(`
          SELECT r.*, b.total_seats
          FROM routes r
          JOIN buses b ON r.bus_id = b.id
          WHERE r.id = ? AND r.status = 'active'
        `).get(route_id) as RouteResult | undefined;
      }

      if (!route) {
        throw new Error('Route not found or inactive');
      }

      // Check bus subscription status - block booking if expired (only if columns exist)
      if (hasSubscriptionColumns && route.subscription_status) {
        const now = new Date();
        const isSubscriptionValid = 
          (route.subscription_status === 'trial' && route.trial_end_date && new Date(route.trial_end_date) > now) ||
          (route.subscription_status === 'active' && route.subscription_end_date && new Date(route.subscription_end_date) > now);
        
        if (!isSubscriptionValid) {
          throw new Error('This bus service is temporarily unavailable. Please choose another option.');
        }
      }

      // Check seat availability
      if (route.available_seats < num_seats) {
        throw new Error('Not enough seats available');
      }

      // Build seat map snapshot with blocked/reserved seats + dynamic pricing settings
      const seatSnapshot = getRouteSeatSnapshot(Number(route_id));
      if (!seatSnapshot) {
        throw new Error('Unable to evaluate seat availability for this route');
      }

      const unavailableSeats = new Set<number>(
        seatSnapshot.seats
          .filter((seat) => seat.status !== 'available')
          .map((seat) => seat.seat_number)
      );

      let selectedSeats: number[] = [];
      if (Array.isArray(selected_seats) && selected_seats.length > 0) {
        const normalized = selected_seats
          .map((value: any) => Number(value))
          .filter((value: number) => Number.isInteger(value));

        if (normalized.length !== num_seats) {
          throw new Error('Selected seats must match the requested number of seats');
        }

        const unique = new Set(normalized);
        if (unique.size !== normalized.length) {
          throw new Error('Duplicate seat numbers are not allowed');
        }

        const invalidSeat = normalized.find((seat: number) => seat < 1 || seat > route.total_seats);
        if (invalidSeat) {
          throw new Error(`Seat ${invalidSeat} is out of range for this bus`);
        }

        const blockedSeat = normalized.find((seat: number) => unavailableSeats.has(seat));
        if (blockedSeat) {
          throw new Error(`Seat ${blockedSeat} is unavailable. Please select a different seat.`);
        }

        selectedSeats = [...normalized].sort((a: number, b: number) => a - b);
      } else {
        const availableSeats = seatSnapshot.seats
          .filter((seat) => seat.status === 'available')
          .map((seat) => seat.seat_number);

        if (availableSeats.length < num_seats) {
          throw new Error('Not enough seats available');
        }

        selectedSeats = availableSeats.slice(0, num_seats);
      }

      const seat_numbers = selectedSeats.join(',');

      // Calculate total with dynamic pricing by seat
      const seatPrices = selectedSeats.map((seatNumber) =>
        calculateSeatPrice(
          route.price,
          seatNumber,
          seatSnapshot.occupancyRate,
          seatSnapshot.dynamicPricingEnabled,
          seatSnapshot.dynamicPriceMultiplier
        )
      );
      const total_price = Math.round(seatPrices.reduce((sum, value) => sum + value, 0) * 100) / 100;

      // Get platform commission rate (backward compatible)
      let commission_rate = 0.075;
      try {
        const platformSettings = db.prepare(`
          SELECT setting_value FROM platform_settings WHERE setting_key = 'commission_rate'
        `).get() as { setting_value: string } | undefined;
        if (platformSettings) {
          commission_rate = parseFloat(platformSettings.setting_value);
        }
      } catch (e) { /* Table doesn't exist yet */ }
      
      // Calculate commission
      const commission_amount = Math.round(total_price * commission_rate * 100) / 100;
      const company_earnings = Math.round((total_price - commission_amount) * 100) / 100;

      // Create booking (backward compatible - try with commission columns, fallback without)
      const bookingRef = generateBookingReference();
      let bookingResult: { lastInsertRowid: number };
      
      try {
        const bookingStmt = db.prepare(`
          INSERT INTO bookings (
            customer_id, route_id, seat_numbers, num_seats, luggage_count, 
            boarding_point, dropping_point, total_price, commission_rate,
            commission_amount, company_earnings, booking_reference, 
            status, payment_status, confirmed_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', 'pending', CURRENT_TIMESTAMP)
        `);

        bookingResult = bookingStmt.run(
          decoded.id,
          route_id,
          seat_numbers,
          num_seats,
          luggage_count || 0,
          boarding_point,
          dropping_point || route.destination,
          total_price,
          commission_rate,
          commission_amount,
          company_earnings,
          bookingRef
        ) as { lastInsertRowid: number };
      } catch (e) {
        // Fallback: no commission columns
        const bookingStmt = db.prepare(`
          INSERT INTO bookings (
            customer_id, route_id, seat_numbers, num_seats, luggage_count, 
            boarding_point, dropping_point, total_price, booking_reference, 
            status, payment_status, confirmed_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', 'pending', CURRENT_TIMESTAMP)
        `);

        bookingResult = bookingStmt.run(
          decoded.id,
          route_id,
          seat_numbers,
          num_seats,
          luggage_count || 0,
          boarding_point,
          dropping_point || route.destination,
          total_price,
          bookingRef
        ) as { lastInsertRowid: number };
      }

      const bookingId = bookingResult.lastInsertRowid;

      // Create passengers and tickets
      const passengerStmt = db.prepare(`
        INSERT INTO passengers (
          booking_id, seat_number, full_name, phone_number, email, 
          date_of_birth, gender, id_type, id_number, emergency_contact_name,
          emergency_contact_phone, emergency_contact_relationship, special_needs, luggage_count
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const ticketStmt = db.prepare(`
        INSERT INTO tickets (
          booking_id, passenger_id, ticket_number, qr_code, seat_number, status, boarding_status
        )
        VALUES (?, ?, ?, ?, ?, 'valid', 'not_boarded')
      `);

      const createdTickets: any[] = [];

      selectedSeats.forEach((seatNum, index) => {
        // Get passenger details or use defaults
        const passengerData = passengers?.[index] || {
          full_name: `Passenger ${index + 1}`,
          phone_number: null,
          email: null,
          date_of_birth: null,
          gender: null,
          id_type: null,
          id_number: null,
          emergency_contact_name: null,
          emergency_contact_phone: null,
          emergency_contact_relationship: null,
          special_needs: null,
          luggage_count: 1
        };

        // Create passenger
        const passengerResult = passengerStmt.run(
          bookingId,
          seatNum,
          passengerData.full_name,
          passengerData.phone_number || null,
          passengerData.email || null,
          passengerData.date_of_birth || null,
          passengerData.gender || null,
          passengerData.id_type || null,
          passengerData.id_number || null,
          passengerData.emergency_contact_name || null,
          passengerData.emergency_contact_phone || null,
          passengerData.emergency_contact_relationship || null,
          passengerData.special_needs || null,
          passengerData.luggage_count || 1
        ) as { lastInsertRowid: number };

        const passengerId = passengerResult.lastInsertRowid;
        const ticketNumber = generateTicketNumber();
        const qrCode = generateQRCode(
          ticketNumber, 
          bookingRef, 
          seatNum, 
          passengerData.full_name,
          passengerData.id_number
        );

        // Create ticket
        ticketStmt.run(bookingId, passengerId, ticketNumber, qrCode, seatNum);

        createdTickets.push({
          ticketNumber,
          seatNumber: seatNum,
          passengerName: passengerData.full_name
        });
      });

      // Update available seats
      const updateSeats = db.prepare(`
        UPDATE routes SET available_seats = available_seats - ? WHERE id = ?
      `);
      updateSeats.run(num_seats, route_id);

      return {
        bookingId,
        bookingReference: bookingRef,
        seatNumbers: seat_numbers,
        totalPrice: total_price,
        tickets: createdTickets,
        status: 'confirmed',
        paymentStatus: 'paid'
      };
    });

    const result = transaction();

    return NextResponse.json(
      {
        message: 'Booking created successfully',
        ...result,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH update booking status
export async function PATCH(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { booking_id, status, cancellation_reason } = body;

    if (!booking_id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify ownership
    const booking = db.prepare(`
      SELECT b.*, r.id as route_id, bus.company_id
      FROM bookings b
      JOIN routes r ON b.route_id = r.id
      JOIN buses bus ON r.bus_id = bus.id
      WHERE b.id = ?
    `).get(booking_id) as BookingResult | undefined;

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const isOwner = decoded.user_type === 'customer' && booking.customer_id === decoded.id;
    const isCompany = decoded.user_type === 'company' && booking.company_id === decoded.id;
    const isAdmin = decoded.user_type === 'admin';

    if (!isOwner && !isCompany && !isAdmin) {
      return NextResponse.json({ error: 'Not authorized to modify this booking' }, { status: 403 });
    }

    const transaction = db.transaction(() => {
      if (status === 'cancelled') {
        // Check if booking is already cancelled
        if (booking.status === 'cancelled') {
          throw new Error('Booking is already cancelled');
        }

        // Check if booking is completed (trip already taken)
        if (booking.status === 'completed') {
          throw new Error('Cannot cancel a completed booking');
        }

        // Calculate refund based on cancellation policy
        const routeInfo = db.prepare(`
          SELECT r.date, r.departure_time 
          FROM routes r WHERE r.id = ?
        `).get(booking.route_id) as { date: string; departure_time: string } | undefined;
        
        if (!routeInfo) {
          throw new Error('Route information not found');
        }

        const departureDateTime = new Date(`${routeInfo.date}T${routeInfo.departure_time}`);
        const currentDateTime = new Date();
        const hoursUntilDeparture = (departureDateTime.getTime() - currentDateTime.getTime()) / (1000 * 60 * 60);
        
        let refundPercentage = 0;
        if (hoursUntilDeparture >= 48) {
          refundPercentage = 90;
        } else if (hoursUntilDeparture >= 24) {
          refundPercentage = 70;
        } else if (hoursUntilDeparture >= 6) {
          refundPercentage = 50;
        } else {
          refundPercentage = 0;
        }
        
        const refundAmount = booking.total_price * (refundPercentage / 100);
        const cancellationFee = booking.total_price - refundAmount;

        // Cancel booking with refund info
        db.prepare(`
          UPDATE bookings 
          SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP, cancellation_reason = ?,
              refund_amount = ?, cancellation_fee = ?, refund_status = ?
          WHERE id = ?
        `).run(
          cancellation_reason || 'Cancelled by user', 
          refundAmount, 
          cancellationFee, 
          refundAmount > 0 ? 'pending' : null,
          booking_id
        );

        // Log cancellation for audit trail
        db.prepare(`
          INSERT INTO cancellation_logs (
            booking_id, cancelled_by, cancellation_reason, original_amount,
            refund_amount, cancellation_fee, hours_before_departure, refund_percentage
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          booking_id,
          decoded.id,
          cancellation_reason || 'Cancelled by user',
          booking.total_price,
          refundAmount,
          cancellationFee,
          hoursUntilDeparture,
          refundPercentage
        );

        // Cancel all tickets
        db.prepare(`UPDATE tickets SET status = 'cancelled' WHERE booking_id = ?`).run(booking_id);

        // Restore seats
        db.prepare(`
          UPDATE routes SET available_seats = available_seats + ? WHERE id = ?
        `).run(booking.num_seats, booking.route_id);
        
        return { success: true, refundAmount, cancellationFee, refundPercentage };
      } else if (status === 'confirmed') {
        db.prepare(`
          UPDATE bookings SET status = 'confirmed', confirmed_at = CURRENT_TIMESTAMP WHERE id = ?
        `).run(booking_id);
      } else {
        db.prepare(`UPDATE bookings SET status = ? WHERE id = ?`).run(status, booking_id);
      }

      return { success: true };
    });

    const result = transaction();

    // Return enhanced response with refund details for cancellations
    if (status === 'cancelled' && result.refundAmount !== undefined) {
      return NextResponse.json({ 
        message: 'Booking cancelled successfully',
        refund: {
          amount: result.refundAmount,
          fee: result.cancellationFee,
          percentage: result.refundPercentage,
          processingTime: '3-5 business days'
        }
      });
    }

    return NextResponse.json({ message: `Booking ${status}` });
  } catch (error: any) {
    console.error('Error updating booking:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}