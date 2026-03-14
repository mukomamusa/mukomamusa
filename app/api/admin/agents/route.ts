// app/api/admin/agents/route.ts
// Admin API for managing agents

import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/database-schema';
import { verifyToken } from '@/app/lib/auth';
import { AuditHelpers } from '@/app/lib/audit';
import bcrypt from 'bcryptjs';

// GET - List all agents
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.user_type !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build query
    let whereConditions = [];
    let params: any[] = [];

    if (status) {
      whereConditions.push('status = ?');
      params.push(status);
    }

    if (search) {
      whereConditions.push('(business_name LIKE ? OR contact_name LIKE ? OR contact_email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM agents ${whereClause}`;
    const totalResult = db.prepare(countQuery).get(...params) as any;
    const total = totalResult?.total || 0;

    // Get agents
    const agentsQuery = `
      SELECT 
        id, business_name, business_type, contact_name, contact_email, 
        contact_phone, commission_rate, commission_type, can_sell_all_companies,
        status, verified, created_at, last_login,
        (SELECT COUNT(*) FROM bookings WHERE agent_id = agents.id) as total_bookings,
        (SELECT COALESCE(SUM(agent_commission), 0) FROM bookings WHERE agent_id = agents.id) as total_earnings
      FROM agents 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const agents = db.prepare(agentsQuery).all(...params, limit, offset) as any[];

    return NextResponse.json({
      agents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
  }
}

// POST - Create new agent directly (admin)
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.user_type !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      business_name,
      business_type,
      contact_name,
      contact_email,
      contact_phone,
      password,
      commission_rate,
      can_sell_all_companies,
      verified,
      address,
      city,
      province
    } = body;

    // Validation
    if (!business_name || !contact_name || !contact_email || !password || !contact_phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if email exists
    const existing = db.prepare('SELECT id FROM agents WHERE contact_email = ?').get(contact_email);
    if (existing) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create agent
    const result = db.prepare(`
      INSERT INTO agents (
        business_name, business_type, contact_name, contact_email, contact_phone,
        password, commission_rate, commission_type, can_sell_all_companies,
        status, verified, physical_address, city, province, address, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'percentage', ?, 'active', ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(
      business_name,
      business_type || 'independent',
      contact_name,
      contact_email,
      contact_phone,
      hashedPassword,
      commission_rate || 7.5,
      can_sell_all_companies ? 1 : 0,
      verified ? 1 : 1,
      address || contact_phone,  // Use address as physical_address
      city || 'Unknown',
      province || 'Unknown'
    );

    // Log (skip for now due to type complexity)
    // await AuditHelpers.agentApproved(
    //   { id: decoded.id, email: decoded.email || '', name: decoded.name || 'Admin', type: 'admin' },
    //   { id: result.lastInsertRowid, contact_email, contact_name, business_name }
    // );

    return NextResponse.json({
      message: 'Agent created successfully',
      agent_id: result.lastInsertRowid
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating agent:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create agent' },
      { status: 500 }
    );
  }
}
