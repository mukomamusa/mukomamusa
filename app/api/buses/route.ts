import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/database-schema';
import { verifyToken } from '@/app/lib/auth';

// GET all buses (filtered by company for company users, all for admin)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('company_id');
    
    // Check if user is authenticated
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    let decoded: any = null;
    if (token) {
      decoded = verifyToken(token);
    }

    let query = `
      SELECT b.*, u.company_name, u.name as owner_name
      FROM buses b
      JOIN users u ON b.company_id = u.id
    `;

    let buses;
    
    // If company user is logged in, only show their buses
    if (decoded && decoded.user_type === 'company') {
      query += ' WHERE b.company_id = ?';
      buses = db.prepare(query).all(decoded.id);
    } else if (companyId) {
      query += ' WHERE b.company_id = ?';
      buses = db.prepare(query).all(companyId);
    } else {
      // Admin or public - show all
      buses = db.prepare(query).all();
    }

    return NextResponse.json({ buses });
  } catch (error) {
    console.error('Error fetching buses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST create new bus (company only)
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
    if (!decoded || decoded.user_type !== 'company') {
      return NextResponse.json(
        { error: 'Unauthorized - Company access only' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { bus_number, bus_name, total_seats, bus_type, amenities } = body;

    if (!bus_number || !bus_name || !total_seats || !bus_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get trial period from settings (backward compatible)
    let trialDays = 14;
    try {
      const trialSetting = db.prepare(`
        SELECT setting_value FROM platform_settings WHERE setting_key = 'subscription_trial_days'
      `).get() as any;
      if (trialSetting) {
        trialDays = parseInt(trialSetting.setting_value);
      }
    } catch (e) { /* Table doesn't exist yet */ }
    
    // Calculate trial end date
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + trialDays);

    // Try insert with subscription columns, fallback to basic insert
    let result;
    try {
      const stmt = db.prepare(`
        INSERT INTO buses (company_id, bus_number, bus_name, total_seats, bus_type, amenities, subscription_status, trial_end_date)
        VALUES (?, ?, ?, ?, ?, ?, 'trial', ?)
      `);

      result = stmt.run(
        decoded.id,
        bus_number,
        bus_name,
        total_seats,
        bus_type,
        amenities || '',
        trialEndDate.toISOString()
      );
    } catch (e) {
      // Fallback: no subscription columns
      const stmt = db.prepare(`
        INSERT INTO buses (company_id, bus_number, bus_name, total_seats, bus_type, amenities)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      result = stmt.run(
        decoded.id,
        bus_number,
        bus_name,
        total_seats,
        bus_type,
        amenities || ''
      );
    }

    return NextResponse.json(
      {
        message: 'Bus created successfully',
        busId: result.lastInsertRowid,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating bus:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}