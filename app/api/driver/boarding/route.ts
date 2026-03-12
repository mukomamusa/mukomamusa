// app/api/driver/boarding/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyDriverToken } from '@/app/lib/driver-auth';
import db from '@/app/lib/database-schema';
import { sendNotification } from '@/app/lib/push-notifications';

export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = verifyDriverToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Invalid driver token' }, { status: 401 });
        }

        const body = await request.json();
        let { ticketNumber, passengerId, bookingRef, seatNumber, method = 'manual' } = body;

        console.log('🔍 Boarding request:', {
            ticketNumber,
            passengerId,
            bookingRef,
            seatNumber,
            method,
            driverId: decoded.id
        });

        if (!ticketNumber && !passengerId && !bookingRef) {
            return NextResponse.json(
                { error: 'Either ticket number, passenger ID, or booking reference is required' },
                { status: 400 }
            );
        }

        // Try to parse JSON if it looks like JSON (this updates bookingRef and seatNumber)
        if (ticketNumber && ticketNumber.startsWith('{')) {
            try {
                const qrData = JSON.parse(ticketNumber);
                bookingRef = qrData.ref || qrData.bookingReference || qrData.booking_ref || bookingRef;
                seatNumber = qrData.seat || qrData.seatNumber || seatNumber;
                console.log('🔍 Parsed QR data:', { bookingRef, seats: qrData.seats });
            } catch (e) {
                console.log('🔍 Failed to parse JSON, using as plain text');
            }
        }

        // Start transaction
        const transaction = db.transaction(() => {
            let passengers = [];
            let bookingInfo = null;

            if (bookingRef) {
                // Search by booking reference (may have multiple passengers)
                console.log('🔍 Searching by booking reference:', bookingRef);

                bookingInfo = db.prepare(`
                    SELECT 
                        b.id as booking_id,
                        b.booking_reference,
                        b.customer_id,
                        r.origin,
                        r.destination,
                        r.departure_time,
                        r.id as route_id
                    FROM bookings b
                    JOIN routes r ON b.route_id = r.id
                    WHERE b.booking_reference = ?
                `).get(bookingRef) as any;

                if (!bookingInfo) {
                    throw new Error(`Booking ${bookingRef} not found`);
                }

                // Get all passengers for this booking
                passengers = db.prepare(`
                    SELECT 
                        p.id as passenger_id,
                        p.full_name,
                        p.phone_number,
                        p.seat_number,
                        p.special_needs,
                        t.id as ticket_id,
                        t.ticket_number,
                        t.boarding_status,
                        t.status as ticket_status
                    FROM passengers p
                    LEFT JOIN tickets t ON p.id = t.passenger_id
                    WHERE p.booking_id = ?
                    ORDER BY p.seat_number ASC
                `).all(bookingInfo.booking_id) as any[];

                console.log(`🔍 Found ${passengers.length} passengers for booking ${bookingRef}`);

            } else if (ticketNumber) {
                // Search by ticket number (single passenger)
                console.log('🔍 Searching by ticket number:', ticketNumber);

                const passenger = db.prepare(`
                    SELECT 
                        p.id as passenger_id,
                        p.full_name,
                        p.phone_number,
                        p.seat_number,
                        p.special_needs,
                        t.id as ticket_id,
                        t.ticket_number,
                        t.boarding_status,
                        t.status as ticket_status,
                        b.id as booking_id,
                        b.booking_reference,
                        b.customer_id,
                        r.origin,
                        r.destination,
                        r.departure_time,
                        r.id as route_id
                    FROM passengers p
                    JOIN tickets t ON p.id = t.passenger_id
                    JOIN bookings b ON p.booking_id = b.id
                    JOIN routes r ON b.route_id = r.id
                    WHERE t.ticket_number = ?
                `).get(ticketNumber) as any;

                if (passenger) {
                    passengers = [passenger];
                    bookingInfo = passenger;
                }

            } else if (passengerId) {
                // Search by passenger ID (single passenger)
                console.log('🔍 Searching by passenger ID:', passengerId);

                const passenger = db.prepare(`
                    SELECT 
                        p.id as passenger_id,
                        p.full_name,
                        p.phone_number,
                        p.seat_number,
                        p.special_needs,
                        t.id as ticket_id,
                        t.ticket_number,
                        t.boarding_status,
                        t.status as ticket_status,
                        b.id as booking_id,
                        b.booking_reference,
                        b.customer_id,
                        r.origin,
                        r.destination,
                        r.departure_time,
                        r.id as route_id
                    FROM passengers p
                    LEFT JOIN tickets t ON p.id = t.passenger_id
                    JOIN bookings b ON p.booking_id = b.id
                    JOIN routes r ON b.route_id = r.id
                    WHERE p.id = ?
                `).get(passengerId) as any;

                if (passenger) {
                    passengers = [passenger];
                    bookingInfo = passenger;
                }
            }

            if (!passengers || passengers.length === 0) {
                throw new Error('No passengers found');
            }

            if (!bookingInfo) {
                throw new Error('Booking information not found');
            }

            // Verify this route is assigned to this driver (using first passenger's route)
            const routeCheck = db.prepare(`
                SELECT id FROM routes WHERE id = ? AND driver_id = ?
            `).get(bookingInfo.route_id, decoded.id) as any;

            console.log('🔍 Route check:', {
                routeId: bookingInfo.route_id,
                driverId: decoded.id,
                result: routeCheck
            });

            if (!routeCheck) {
                throw new Error('You are not authorized to board passengers for this trip');
            }

            // If seat number is provided, filter to only that passenger
            if (seatNumber && passengers.length > 1) {
                const filteredPassengers = passengers.filter(p =>
                    String(p.seat_number) === String(seatNumber)
                );

                if (filteredPassengers.length === 0) {
                    throw new Error(`No passenger found with seat number ${seatNumber}`);
                }

                passengers = filteredPassengers;
                console.log(`🔍 Filtered to seat ${seatNumber}: ${passengers.length} passenger`);
            }

            // Update tickets for selected passengers
            const boardedPassengers = [];
            for (const passenger of passengers) {
                if (passenger.ticket_id) {
                    console.log('🔍 Updating ticket:', passenger.ticket_id);
                    db.prepare(`
                        UPDATE tickets 
                        SET boarding_status = 'boarded', 
                            boarded_at = CURRENT_TIMESTAMP, 
                            status = 'used'
                        WHERE id = ?
                    `).run(passenger.ticket_id);
                }

                // Create boarding log
                db.prepare(`
                    INSERT INTO boarding_logs (
                        passenger_id, ticket_number, boarded_by, boarding_method, timestamp
                    ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
                `).run(
                    passenger.passenger_id,
                    passenger.ticket_number || ticketNumber,
                    decoded.id,
                    method
                );

                boardedPassengers.push({
                    name: passenger.full_name,
                    seat: passenger.seat_number
                });
            }

            return {
                bookingInfo,
                passengers: boardedPassengers,
                count: boardedPassengers.length,
                totalInBooking: passengers.length
            };
        });

        const result = transaction();

        // Send notification to customer
        try {
            const passengerCount = result.count;
            const message = passengerCount === 1
                ? `${result.passengers[0].name} has boarded the bus`
                : `${passengerCount} passengers have boarded the bus`;

            await sendNotification(
                result.bookingInfo.customer_id,
                {
                    title: '✅ Boarding Confirmed',
                    body: message,
                    icon: '/icons/icon-192x192.png',
                    data: {
                        url: `/customer/ticket/${result.bookingInfo.booking_id}`,
                        bookingRef: result.bookingInfo.booking_reference,
                        type: 'boarding_confirmation'
                    }
                },
                'boarding'
            );
        } catch (error) {
            console.error('Error sending boarding notification:', error);
        }

        // Prepare response message based on how many were boarded
        let responseMessage;
        if (result.count === 1) {
            responseMessage = `${result.passengers[0].name} boarded successfully`;
        } else {
            responseMessage = `${result.count} passengers boarded successfully`;
        }

        return NextResponse.json({
            success: true,
            message: responseMessage,
            boardedCount: result.count,
            totalInBooking: result.totalInBooking,
            passengers: result.passengers,
            bookingRef: result.bookingInfo.booking_reference
        });

    } catch (error: any) {
        console.error('❌ Error marking boarding:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}