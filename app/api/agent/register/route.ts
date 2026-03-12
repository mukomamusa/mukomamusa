// app/api/agent/register/route.ts
// Agent registration endpoint - allows new agents to apply

import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/database-schema';
import bcrypt from 'bcryptjs';
import { AuditHelpers } from '@/app/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      business_name,
      business_type,
      contact_name,
      contact_email,
      contact_phone,
      password,
      nrc_number,
      address,
      city,
      province,
      physical_address
    } = body;

    // Validation
    if (!business_name || !business_type || !contact_name || !contact_email || !password || !contact_phone || !province || !nrc_number || !city || !physical_address) {
      return NextResponse.json(
        { error: 'Missing required fields: business_name, business_type, contact_name, contact_email, contact_phone, password, province, nrc_number, city, physical_address' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contact_email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate business type
    const validBusinessTypes = ['travel_agency', 'independent', 'retail_chain', 'station_kiosk'];
    if (!validBusinessTypes.includes(business_type)) {
      return NextResponse.json(
        { error: 'Invalid business_type. Must be: travel_agency, independent, retail_chain, or station_kiosk' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingAgent = db.prepare(`
      SELECT id FROM agents WHERE contact_email = ?
    `).get(contact_email);

    if (existingAgent) {
      return NextResponse.json(
        { error: 'An agent with this email already exists' },
        { status: 400 }
      );
    }

    // Check if phone already exists
    const existingPhone = db.prepare(`
      SELECT id FROM agents WHERE contact_phone = ?
    `).get(contact_phone);

    if (existingPhone) {
      return NextResponse.json(
        { error: 'An agent with this phone number already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get default commission rate from settings
    let defaultCommissionRate = 7.5;
    try {
      const setting = db.prepare(`
        SELECT setting_value FROM platform_settings WHERE setting_key = 'default_agent_commission_rate'
      `).get() as { setting_value: string } | undefined;
      if (setting) {
        defaultCommissionRate = parseFloat(setting.setting_value);
      }
    } catch (e) {
      // Table doesn't exist yet, use default
    }

    // Create agent (status: pending, verified: 0 - requires admin approval)
    const result = db.prepare(`
      INSERT INTO agents (
        business_name,
        business_type,
        contact_name,
        contact_email,
        contact_phone,
        password,
        nrc_number,
        address,
        physical_address,
        city,
        province,
        commission_rate,
        commission_type,
        can_sell_all_companies,
        status,
        verified,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'percentage', 1, 'pending', 0, datetime('now'), datetime('now'))
    `).run(
      business_name,
      business_type,
      contact_name,
      contact_email,
      contact_phone,
      hashedPassword,
      nrc_number,
      address || null,
      physical_address,
      city,
      province,
      defaultCommissionRate
    );

    const agentId = result.lastInsertRowid;

    // Log registration
    await AuditHelpers.agentAction(
      { id: agentId, contact_email, contact_name },
      'agent_registered',
      'agent'
    );

    return NextResponse.json({
      success: true,
      message: 'Registration submitted successfully! Your account is pending approval. You will be notified once an administrator reviews your application.',
      agent_id: agentId
    }, { status: 201 });

  } catch (error: any) {
    console.error('Agent registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
