// app/api/admin/agents/[id]/route.ts
// Admin API for managing individual agents

import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/database-schema';
import { verifyToken } from '@/app/lib/auth';

// GET - Get single agent
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.user_type !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const agentId = parseInt(id, 10);

    if (!Number.isInteger(agentId)) {
      return NextResponse.json({ error: 'Invalid agent ID' }, { status: 400 });
    }

    const agent = db.prepare(`
      SELECT 
        id, business_name, business_type, contact_name, contact_email, 
        contact_phone, commission_rate, commission_type, can_sell_all_companies,
        restricted_companies, status, verified, created_at, last_login,
        nrc_number, address, city
      FROM agents 
      WHERE id = ?
    `).get(agentId) as any;

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Get agent stats
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_bookings,
        COALESCE(SUM(total_price), 0) as total_revenue,
        COALESCE(SUM(agent_commission), 0) as total_commission
      FROM bookings 
      WHERE agent_id = ?
    `).get(agentId) as any;

    // Get recent bookings
    const recentBookings = db.prepare(`
      SELECT booking_reference, total_price, agent_commission, status, created_at
      FROM bookings 
      WHERE agent_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `).all(agentId);

    return NextResponse.json({
      agent,
      stats,
      recentBookings
    });

  } catch (error) {
    console.error('Error fetching agent:', error);
    return NextResponse.json({ error: 'Failed to fetch agent' }, { status: 500 });
  }
}

// PATCH - Update agent status (approve, reject, suspend, activate)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.user_type !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const agentId = parseInt(id, 10);

    if (!Number.isInteger(agentId)) {
      return NextResponse.json({ error: 'Invalid agent ID' }, { status: 400 });
    }

    const body = await request.json();
    const { action, commission_rate, can_sell_all_companies } = body;

    // Get current agent
    const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(agentId) as any;
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    switch (action) {
      case 'approve':
        db.prepare(`
          UPDATE agents SET verified = 1, status = 'active', updated_at = datetime('now') WHERE id = ?
        `).run(agentId);
        return NextResponse.json({ message: 'Agent approved successfully' });

      case 'reject':
        db.prepare(`
          UPDATE agents SET verified = 0, status = 'rejected', updated_at = datetime('now') WHERE id = ?
        `).run(agentId);
        return NextResponse.json({ message: 'Agent rejected' });

      case 'suspend':
        db.prepare(`
          UPDATE agents SET status = 'suspended', updated_at = datetime('now') WHERE id = ?
        `).run(agentId);
        return NextResponse.json({ message: 'Agent suspended' });

      case 'activate':
        db.prepare(`
          UPDATE agents SET status = 'active', verified = 1, updated_at = datetime('now') WHERE id = ?
        `).run(agentId);
        return NextResponse.json({ message: 'Agent activated' });

      case 'update_commission':
        if (commission_rate !== undefined) {
          db.prepare(`
            UPDATE agents SET commission_rate = ?, updated_at = datetime('now') WHERE id = ?
          `).run(commission_rate, agentId);
        }
        if (can_sell_all_companies !== undefined) {
          db.prepare(`
            UPDATE agents SET can_sell_all_companies = ?, updated_at = datetime('now') WHERE id = ?
          `).run(can_sell_all_companies ? 1 : 0, agentId);
        }
        return NextResponse.json({ message: 'Agent updated successfully' });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Error updating agent:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update agent' },
      { status: 500 }
    );
  }
}
