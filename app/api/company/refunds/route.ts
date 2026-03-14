import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, TokenPayload } from '@/app/lib/auth';

const Database = require('better-sqlite3');
const db = new Database('./bus_booking.db');

// Define interfaces for database results
interface RefundStats {
  total_refunds: number;
  pending_refunds: number;
  processed_refunds: number;
  rejected_refunds: number;
  pending_amount: number;
  processed_amount: number;
}

// GET - Fetch refunds for company
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token) as TokenPayload | null;
    if (!decoded || decoded.user_type !== 'company') {
      return NextResponse.json({ error: 'Company access only' }, { status: 403 });
    }

    const companyId = decoded.id;
    const searchParams = request.nextUrl.searchParams;
    const statusFilter = searchParams.get('status') || '';

    // Get refunds for company's bookings - FIXED: Use proper parameterized query
    let query = `
      SELECT 
        r.*,
        b.booking_reference,
        b.total_price as original_amount,
        bk.origin,
        bk.destination,
        bk.date,
        u.name as customer_name,
        u.phone as customer_phone,
        u.email as customer_email
      FROM refunds r
      JOIN bookings b ON r.booking_id = b.id
      JOIN routes rt ON b.route_id = rt.id
      JOIN buses bus ON rt.bus_id = bus.id
      JOIN routes bk ON b.route_id = bk.id
      JOIN users u ON b.customer_id = u.id
      WHERE bus.company_id = ?
    `;
    
    const params: (string | number)[] = [companyId];

    if (statusFilter) {
      query += ` AND r.status = ?`;
      params.push(statusFilter); // Now TypeScript knows this can be a string
    }

    query += ` ORDER BY r.requested_at DESC`;

    const refunds = db.prepare(query).all(...params);

    // Get refund statistics
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_refunds,
        SUM(CASE WHEN r.status = 'pending' THEN 1 ELSE 0 END) as pending_refunds,
        SUM(CASE WHEN r.status = 'processed' THEN 1 ELSE 0 END) as processed_refunds,
        SUM(CASE WHEN r.status = 'rejected' THEN 1 ELSE 0 END) as rejected_refunds,
        SUM(CASE WHEN r.status = 'pending' THEN r.amount ELSE 0 END) as pending_amount,
        SUM(CASE WHEN r.status = 'processed' THEN r.amount ELSE 0 END) as processed_amount
      FROM refunds r
      JOIN bookings b ON r.booking_id = b.id
      JOIN routes rt ON b.route_id = rt.id
      JOIN buses bus ON rt.bus_id = bus.id
      WHERE bus.company_id = ?
    `).get(companyId) as RefundStats | undefined;

    return NextResponse.json({ 
      refunds: refunds || [],
      statistics: stats || {
        total_refunds: 0,
        pending_refunds: 0,
        processed_refunds: 0,
        rejected_refunds: 0,
        pending_amount: 0,
        processed_amount: 0
      }
    });

  } catch (error) {
    console.error('Error fetching refunds:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update refund status (approve/reject)
export async function PATCH(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token) as TokenPayload | null;
    if (!decoded || decoded.user_type !== 'company') {
      return NextResponse.json({ error: 'Company access only' }, { status: 403 });
    }

    const body = await request.json();
    const { refundId, status, rejectionReason } = body;

    if (!refundId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['processed', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Verify refund belongs to company
    const refund = db.prepare(`
      SELECT r.*, b.booking_reference, b.id as booking_id
      FROM refunds r
      JOIN bookings b ON r.booking_id = b.id
      JOIN routes rt ON b.route_id = rt.id
      JOIN buses bus ON rt.bus_id = bus.id
      WHERE r.id = ? AND bus.company_id = ?
    `).get(refundId, decoded.id) as any;

    if (!refund) {
      return NextResponse.json({ error: 'Refund not found or unauthorized' }, { status: 404 });
    }

    if (refund.status !== 'pending') {
      return NextResponse.json({ error: 'Refund has already been processed' }, { status: 400 });
    }

    // Update refund status
    const updateData: any[] = [status];
    let updateQuery = `UPDATE refunds SET status = ?, processed_at = datetime('now'), processed_by = ?`;
    updateData.push(decoded.id);

    if (status === 'rejected' && rejectionReason) {
      updateQuery += `, reason = ?`;
      updateData.push(`REJECTED: ${rejectionReason}`);
    }

    updateQuery += ` WHERE id = ?`;
    updateData.push(refundId);

    db.prepare(updateQuery).run(...updateData);

    // Update booking refund status
    db.prepare(`UPDATE bookings SET refund_status = ? WHERE id = ?`)
      .run(status, refund.booking_id);

    return NextResponse.json({ 
      message: `Refund ${status === 'processed' ? 'approved' : 'rejected'} successfully`,
      refund: { id: refundId, status }
    });

  } catch (error) {
    console.error('Error updating refund:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}