// app/api/agent/bookings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/database-schema';
import { verifyAgentToken } from '@/app/lib/agent-auth'; // You'll need this helper
import { calculateAgentCommission, canAgentSellForCompany } from '@/app/lib/agent-types';
import { generateBookingReference, generateTicketNumber, generateQRCode } from '@/app/lib/auth';
import { AuditHelpers } from '@/app/lib/audit';

export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = verifyAgentToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // Get agent details
        const agent = db.prepare(`
            SELECT * FROM agents WHERE id = ?
        `).get(decoded.id) as any;

        if (!agent || agent.status !== 'active') {
            return NextResponse.json({ error: 'Agent not active' }, { status: 403 });
        }

        const body = await request.json();
        const { 
            route_id, 
            num_seats, 
            luggage_count, 
            boarding_point,
            passengers,
            location_id 
        } = body;

        // Validate
        if (!route_id || !num_seats || !boarding_point) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Get route details with company
        const route = db.prepare(`
            SELECT r.*, b.company_id, u.company_name
            FROM routes r
            JOIN buses b ON r.bus_id = b.id
            JOIN users u ON b.company_id = u.id
            WHERE r.id = ? AND r.status = 'active'
        `).get(route_id) as any;

        if (!route) {
            return NextResponse.json(
                { error: 'Route not found' },
                { status: 404 }
            );
        }

        // Check if agent can sell for this company
        if (!canAgentSellForCompany(agent, route.company_id)) {
            return NextResponse.json(
                { error: 'Not authorized to sell tickets for this company' },
                { status: 403 }
            );
        }

        // Start transaction
        const transaction = db.transaction(() => {
            // Calculate total price
            const total_price = route.price * num_seats;

            // Calculate agent commission
            const commission = calculateAgentCommission(agent, total_price);

            // Create booking (similar to customer booking)
            const bookingRef = generateBookingReference();
            
            const bookingResult = db.prepare(`
                INSERT INTO bookings (
                    customer_id, route_id, seat_numbers, num_seats, luggage_count,
                    boarding_point, total_price, booking_reference, status, payment_status,
                    agent_id, agent_location_id, agent_commission
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', 'pending', ?, ?, ?)
            `).run(
                null, // No customer ID for agent bookings (walk-in)
                route_id,
                generateSeatNumbers(route_id, num_seats),
                num_seats,
                luggage_count || 0,
                boarding_point,
                total_price,
                bookingRef,
                agent.id,
                location_id || null,
                commission.amount
            );

            const bookingId = bookingResult.lastInsertRowid;

            // Create passengers and tickets (similar to existing)
            // ... passenger creation logic ...

            // Log commission
            db.prepare(`
                INSERT INTO agent_commission_logs (
                    agent_id, booking_id, booking_reference, amount,
                    commission_rate, commission_amount, status
                ) VALUES (?, ?, ?, ?, ?, ?, 'pending')
            `).run(
                agent.id,
                bookingId,
                bookingRef,
                total_price,
                commission.rate,
                commission.amount
            );

            return {
                bookingId,
                bookingRef,
                total_price,
                commission: commission.amount
            };
        });

        const result = transaction();

        // Audit log
        await AuditHelpers.bookingCreated(
            {
                id: agent.id,
                user_type: 'agent',
                email: agent.contact_email,
                name: agent.contact_name
            },
            { id: result.bookingId, booking_reference: result.bookingRef },
            request.headers.get('x-forwarded-for'),
            request.headers.get('user-agent')
        );

        return NextResponse.json({
            success: true,
            message: 'Booking created successfully',
            ...result
        });

    } catch (error: any) {
        console.error('Agent booking error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}