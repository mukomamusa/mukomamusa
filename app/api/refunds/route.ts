import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/database-schema';
import { verifyToken, generateTransactionId } from '@/app/lib/auth';

// GET refunds
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
    const refundId = searchParams.get('refund_id');
    const bookingId = searchParams.get('booking_id');
    const status = searchParams.get('status');

    if (refundId) {
      const refund = db.prepare(`
        SELECT r.*, b.booking_reference, b.customer_id, p.amount as original_amount,
               bus.company_id, u.name as customer_name
        FROM refunds r
        JOIN bookings b ON r.booking_id = b.id
        JOIN payments p ON r.payment_id = p.id
        JOIN routes rt ON b.route_id = rt.id
        JOIN buses bus ON rt.bus_id = bus.id
        JOIN users u ON b.customer_id = u.id
        WHERE r.id = ?
      `).get(refundId) as any;

      if (!refund) {
        return NextResponse.json({ error: 'Refund not found' }, { status: 404 });
      }

      const isOwner = decoded.user_type === 'customer' && refund.customer_id === decoded.id;
      const isCompany = decoded.user_type === 'company' && refund.company_id === decoded.id;
      const isAdmin = decoded.user_type === 'admin';

      if (!isOwner && !isCompany && !isAdmin) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
      }

      return NextResponse.json({ refund });
    }

    // Get refunds based on user type
    let refunds;
    let query = `
      SELECT r.*, b.booking_reference, p.amount as original_amount,
             u.name as customer_name, u.email as customer_email
      FROM refunds r
      JOIN bookings b ON r.booking_id = b.id
      JOIN payments p ON r.payment_id = p.id
      JOIN users u ON b.customer_id = u.id
    `;

    if (decoded.user_type === 'customer') {
      if (bookingId) {
        refunds = db.prepare(query + ` WHERE b.customer_id = ? AND b.id = ? ORDER BY r.requested_at DESC`).all(decoded.id, bookingId);
      } else {
        refunds = db.prepare(query + ` WHERE b.customer_id = ? ORDER BY r.requested_at DESC`).all(decoded.id);
      }
    } else if (decoded.user_type === 'company') {
      query = `
        SELECT r.*, b.booking_reference, p.amount as original_amount,
               u.name as customer_name
        FROM refunds r
        JOIN bookings b ON r.booking_id = b.id
        JOIN payments p ON r.payment_id = p.id
        JOIN routes rt ON b.route_id = rt.id
        JOIN buses bus ON rt.bus_id = bus.id
        JOIN users u ON b.customer_id = u.id
        WHERE bus.company_id = ?
      `;
      if (status) {
        query += ` AND r.status = ?`;
        refunds = db.prepare(query + ` ORDER BY r.requested_at DESC`).all(decoded.id, status);
      } else {
        refunds = db.prepare(query + ` ORDER BY r.requested_at DESC`).all(decoded.id);
      }
    } else if (decoded.user_type === 'admin') {
      if (status) {
        refunds = db.prepare(query + ` WHERE r.status = ? ORDER BY r.requested_at DESC`).all(status);
      } else {
        refunds = db.prepare(query + ` ORDER BY r.requested_at DESC LIMIT 100`).all();
      }
    }

    return NextResponse.json({ refunds });
  } catch (error) {
    console.error('Error fetching refunds:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST request a refund (customer)
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
    const { booking_id, reason, refund_method } = body;

    if (!booking_id || !reason) {
      return NextResponse.json({ error: 'Booking ID and reason required' }, { status: 400 });
    }

    // Get booking and payment
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

    // Only owner or admin can request refund
    const isOwner = decoded.user_type === 'customer' && booking.customer_id === decoded.id;
    const isAdmin = decoded.user_type === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Check if already refunded or not paid
    if (booking.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Booking not paid, no refund needed' }, { status: 400 });
    }

    // Check for existing refund request
    const existingRefund = db.prepare(`
      SELECT id FROM refunds WHERE booking_id = ? AND status IN ('pending', 'approved')
    `).get(booking_id);

    if (existingRefund) {
      return NextResponse.json({ error: 'Refund request already exists' }, { status: 409 });
    }

    // Get the payment
    const payment = db.prepare(`
      SELECT * FROM payments WHERE booking_id = ? AND status = 'completed' ORDER BY paid_at DESC LIMIT 1
    `).get(booking_id) as any;

    if (!payment) {
      return NextResponse.json({ error: 'No completed payment found' }, { status: 404 });
    }

    // Calculate refund amount (could apply penalties based on timing)
    // For now, full refund
    const refundAmount = payment.amount;

    const result = db.prepare(`
      INSERT INTO refunds (booking_id, payment_id, amount, reason, status, refund_method)
      VALUES (?, ?, ?, ?, 'pending', ?)
    `).run(
      booking_id,
      payment.id,
      refundAmount,
      reason,
      refund_method || payment.payment_method
    );

    return NextResponse.json({
      message: 'Refund request submitted',
      refund_id: result.lastInsertRowid,
      amount: refundAmount,
      status: 'pending'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating refund:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH process refund (admin/company)
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

    // Only admin can process refunds
    if (decoded.user_type !== 'admin') {
      return NextResponse.json({ error: 'Admin access only' }, { status: 403 });
    }

    const body = await request.json();
    const { refund_id, status, transaction_id } = body;

    if (!refund_id || !status) {
      return NextResponse.json({ error: 'Refund ID and status required' }, { status: 400 });
    }

    const validStatuses = ['approved', 'processed', 'rejected'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const refund = db.prepare('SELECT * FROM refunds WHERE id = ?').get(refund_id) as any;

    if (!refund) {
      return NextResponse.json({ error: 'Refund not found' }, { status: 404 });
    }

    const transaction = db.transaction(() => {
      if (status === 'processed') {
        const txnId = transaction_id || generateTransactionId();
        db.prepare(`
          UPDATE refunds 
          SET status = 'processed', processed_by = ?, transaction_id = ?, processed_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(decoded.id, txnId, refund_id);

        // Update booking payment status
        db.prepare(`UPDATE bookings SET payment_status = 'refunded' WHERE id = ?`).run(refund.booking_id);

        return { transaction_id: txnId };
      } else if (status === 'approved') {
        db.prepare(`
          UPDATE refunds SET status = 'approved', processed_by = ? WHERE id = ?
        `).run(decoded.id, refund_id);
        return {};
      } else if (status === 'rejected') {
        db.prepare(`
          UPDATE refunds SET status = 'rejected', processed_by = ?, processed_at = CURRENT_TIMESTAMP WHERE id = ?
        `).run(decoded.id, refund_id);
        return {};
      }
      return {};
    });

    const result = transaction();

    return NextResponse.json({
      message: `Refund ${status}`,
      refund_id,
      ...result
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
