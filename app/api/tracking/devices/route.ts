import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/database-tracking';
import { verifyToken } from '@/app/lib/auth';

/**
 * GET /api/tracking/devices
 * Get all GPS devices for a company
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (decoded.user_type !== 'company') {
      return NextResponse.json({ error: 'Only companies can view devices' }, { status: 403 });
    }

    const devices = db.prepare(`
      SELECT gd.*, b.bus_name, b.bus_number
      FROM gps_devices gd
      JOIN buses b ON gd.bus_id = b.id
      WHERE b.company_id = ?
      ORDER BY gd.updated_at DESC
    `).all(decoded.id) as any[];

    return NextResponse.json({
      success: true,
      devices: devices.map(d => ({
        id: d.id,
        bus_id: d.bus_id,
        bus_name: d.bus_name,
        bus_number: d.bus_number,
        provider: d.provider,
        device_imei: d.device_imei,
        device_serial: d.device_serial,
        status: d.status,
        last_seen: d.last_seen_at,
        sim_provider: d.sim_provider,
        firmware_version: d.firmware_version,
      })),
      total: devices.length,
    });

  } catch (error) {
    console.error('Error getting devices:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tracking/devices
 * Register a new GPS device for a bus
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = verifyToken(token);

    if (!decoded || decoded.user_type !== 'company') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const {
      bus_id,
      device_imei,
      device_serial,
      provider,
      provider_device_id,
      sim_number,
      sim_provider,
    } = await request.json();

    if (!bus_id || !device_imei || !provider) {
      return NextResponse.json(
        { error: 'Missing required fields: bus_id, device_imei, provider' },
        { status: 400 }
      );
    }

    // Verify bus belongs to company
    const bus = db.prepare(`
      SELECT id FROM buses WHERE id = ? AND company_id = ?
    `).get(bus_id, decoded.id) as any;

    if (!bus) {
      return NextResponse.json({ error: 'Bus not found or unauthorized' }, { status: 404 });
    }

    const stmt = db.prepare(`
      INSERT INTO gps_devices (
        bus_id, device_imei, device_serial, provider,
        provider_device_id, sim_number, sim_provider, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
    `);

    const result = stmt.run(
      bus_id,
      device_imei,
      device_serial || null,
      provider,
      provider_device_id || null,
      sim_number || null,
      sim_provider || null
    );

    return NextResponse.json(
      {
        success: true,
        message: 'GPS device registered successfully',
        device_id: Number(result.lastInsertRowid),
        bus_id,
        provider,
        device_imei,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error registering device:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
