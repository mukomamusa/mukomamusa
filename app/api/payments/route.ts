import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/database-schema';
import { verifyToken, generateTransactionId } from '@/app/lib/auth';

// GET payments for a booking or user
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const bookingId = searchParams.get('booking_id');
    const paymentId = searchParams.get('payment_id');

    if (paymentId) {
      // Get specific payment
      const payment = db.prepare(`
        SELECT p.*, b.customer_id, b.booking_reference, bus.company_id
        FROM payments p
        JOIN bookings b ON p.booking_id = b.id
        JOIN routes r ON b.route_id = r.id
        JOIN buses bus ON r.bus_id = bus.id
        WHERE p.id = ?
      `).get(paymentId) as any;

      if (!payment) {
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
      }

      const isOwner = decoded.user_type === 'customer' && payment.customer_id === decoded.id;
      const isCompany = decoded.user_type === 'company' && payment.company_id === decoded.id;
      const isAdmin = decoded.user_type === 'admin';

      if (!isOwner && !isCompany && !isAdmin) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
      }

      return NextResponse.json({ payment });
    }

    if (bookingId) {
      // Get payments for a booking
      const booking = db.prepare(`
        SELECT b.*, bus.company_id
        FROM bookings b
        JOIN routes r ON b.route_id = r.id
        JOIN buses bus ON r.bus_id = bus.id
        WHERE b.id = ?
      `).get(bookingId) as any;

      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }

      const isOwner = decoded.user_type === 'customer' && booking.customer_id === decoded.id;
      const isCompany = decoded.user_type === 'company' && booking.company_id === decoded.id;
      const isAdmin = decoded.user_type === 'admin';

      if (!isOwner && !isCompany && !isAdmin) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
      }

      const payments = db.prepare(`
        SELECT * FROM payments WHERE booking_id = ? ORDER BY created_at DESC
      `).all(bookingId);

      return NextResponse.json({ payments });
    }

    // Get all payments for current user's bookings
    if (decoded.user_type === 'customer') {
      const payments = db.prepare(`
        SELECT p.*, b.booking_reference, r.origin, r.destination, r.date
        FROM payments p
        JOIN bookings b ON p.booking_id = b.id
        JOIN routes r ON b.route_id = r.id
        WHERE b.customer_id = ?
        ORDER BY p.created_at DESC
      `).all(decoded.id);

      return NextResponse.json({ payments });
    } else if (decoded.user_type === 'company') {
      const payments = db.prepare(`
        SELECT p.*, b.booking_reference, r.origin, r.destination, r.date, u.name as customer_name
        FROM payments p
        JOIN bookings b ON p.booking_id = b.id
        JOIN routes r ON b.route_id = r.id
        JOIN buses bus ON r.bus_id = bus.id
        JOIN users u ON b.customer_id = u.id
        WHERE bus.company_id = ?
        ORDER BY p.created_at DESC
      `).all(decoded.id);

      return NextResponse.json({ payments });
    } else if (decoded.user_type === 'admin') {
      const payments = db.prepare(`
        SELECT p.*, b.booking_reference, u.name as customer_name, c.company_name
        FROM payments p
        JOIN bookings b ON p.booking_id = b.id
        JOIN users u ON b.customer_id = u.id
        JOIN routes r ON b.route_id = r.id
        JOIN buses bus ON r.bus_id = bus.id
        JOIN users c ON bus.company_id = c.id
        ORDER BY p.created_at DESC
        LIMIT 100
      `).all();

      return NextResponse.json({ payments });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create a payment (initiate payment)
export async function POST(request: NextRequest) {
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
    const { booking_id, payment_method, provider, phone_number } = body;

    if (!booking_id || !payment_method) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate payment method
    const validMethods = ['mobile_money', 'bank_transfer', 'card', 'cash', 'wallet'];
    if (!validMethods.includes(payment_method)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
    }

    // Get booking
    const booking = db.prepare(`
      SELECT b.*, bus.company_id
      FROM bookings b
      JOIN routes r ON b.route_id = r.id
      JOIN buses bus ON r.bus_id = bus.id
      WHERE b.id = ?
    `).get(booking_id) as any;

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Only booking owner or admin can create payment
    const isOwner = decoded.user_type === 'customer' && booking.customer_id === decoded.id;
    const isAdmin = decoded.user_type === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Check if already paid
    if (booking.payment_status === 'paid') {
      return NextResponse.json({ error: 'Booking already paid' }, { status: 400 });
    }

    const transactionId = generateTransactionId();

    // Create payment record
    const result = db.prepare(`
      INSERT INTO payments (booking_id, amount, currency, payment_method, provider, phone_number, transaction_id, status)
      VALUES (?, ?, 'ZMW', ?, ?, ?, ?, 'pending')
    `).run(
      booking_id,
      booking.total_price,
      payment_method,
      provider || null,
      phone_number || null,
      transactionId
    );

    // In a real implementation, here you would:
    // 1. Call the payment gateway API (MTN MoMo, Airtel Money, etc.)
    // 2. Get payment URL or USSD prompt
    // 3. Return instructions to user

    return NextResponse.json({
      message: 'Payment initiated',
      payment_id: result.lastInsertRowid,
      transaction_id: transactionId,
      amount: booking.total_price,
      currency: 'ZMW',
      status: 'pending',
      // Mock payment instructions
      instructions: payment_method === 'mobile_money' 
        ? `A payment request of K${booking.total_price} has been sent to ${phone_number}. Please approve on your phone.`
        : `Please complete payment of K${booking.total_price} using ${payment_method}.`
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH update payment status (webhook or admin)
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

    // Only admin can manually update payment status
    // In production, also allow webhooks from payment providers
    if (decoded.user_type !== 'admin') {
      return NextResponse.json({ error: 'Admin access only' }, { status: 403 });
    }

    const body = await request.json();
    const { payment_id, transaction_id, status } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status required' }, { status: 400 });
    }

    const validStatuses = ['pending', 'processing', 'completed', 'failed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Find payment
    let payment: any;
    if (payment_id) {
      payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(payment_id);
    } else if (transaction_id) {
      payment = db.prepare('SELECT * FROM payments WHERE transaction_id = ?').get(transaction_id);
    }

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    const transaction = db.transaction(() => {
      // Update payment
      if (status === 'completed') {
        db.prepare(`
          UPDATE payments SET status = 'completed', paid_at = CURRENT_TIMESTAMP WHERE id = ?
        `).run(payment.id);

        // Update booking payment status and confirm booking
        db.prepare(`
          UPDATE bookings SET payment_status = 'paid', status = 'confirmed', confirmed_at = CURRENT_TIMESTAMP WHERE id = ?
        `).run(payment.booking_id);
      } else {
        db.prepare('UPDATE payments SET status = ? WHERE id = ?').run(status, payment.id);

        if (status === 'failed' || status === 'cancelled') {
          db.prepare(`UPDATE bookings SET payment_status = 'pending' WHERE id = ?`).run(payment.booking_id);
        }
      }

      return { success: true };
    });

    transaction();

    return NextResponse.json({ 
      message: `Payment ${status}`,
      payment_id: payment.id,
      booking_id: payment.booking_id
    });
  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
