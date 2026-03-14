// app/api/drivers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/database-schema';
import { verifyToken } from '@/app/lib/auth';

// GET drivers for a company
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

    // Only company or admin can view drivers
    if (decoded.user_type !== 'company' && decoded.user_type !== 'admin') {
      return NextResponse.json({ error: 'Company access only' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const driverId = searchParams.get('driver_id');
    const companyId = searchParams.get('company_id');

    if (driverId) {
      const driver = db.prepare(`
        SELECT d.*, u.company_name
        FROM drivers d
        JOIN users u ON d.company_id = u.id
        WHERE d.id = ?
      `).get(driverId) as any;

      if (!driver) {
        return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
      }

      // Check authorization
      if (decoded.user_type === 'company' && driver.company_id !== decoded.id) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
      }

      // Get assigned routes
      const assignedRoutes = db.prepare(`
        SELECT r.id, r.origin, r.destination, r.date, r.departure_time, r.status,
               b.bus_name, b.bus_number
        FROM routes r
        JOIN buses b ON r.bus_id = b.id
        WHERE r.driver_id = ?
        ORDER BY r.date DESC, r.departure_time DESC
        LIMIT 20
      `).all(driverId);

      return NextResponse.json({ 
        driver,
        assigned_routes: assignedRoutes
      });
    }

    // Get all drivers for company
    let drivers;
    if (decoded.user_type === 'admin' && companyId) {
      drivers = db.prepare(`
        SELECT d.*, u.company_name
        FROM drivers d
        JOIN users u ON d.company_id = u.id
        WHERE d.company_id = ?
        ORDER BY d.name
      `).all(companyId);
    } else if (decoded.user_type === 'admin') {
      drivers = db.prepare(`
        SELECT d.*, u.company_name
        FROM drivers d
        JOIN users u ON d.company_id = u.id
        ORDER BY u.company_name, d.name
      `).all();
    } else {
      drivers = db.prepare(`
        SELECT * FROM drivers WHERE company_id = ? ORDER BY name
      `).all(decoded.id);
    }

    return NextResponse.json({ drivers });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create a new driver (company only)
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.user_type !== 'company') {
      return NextResponse.json({ error: 'Company access only' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      phone,
      license_number,
      license_type,
      license_expiry,
      nrc_number,
      date_of_birth,
      address,
      photo_url
    } = body;

    // Validate required fields
    if (!name || !phone || !license_number || !license_type || !license_expiry || !nrc_number) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check for duplicate license number
    const existing = db.prepare('SELECT id FROM drivers WHERE license_number = ?').get(license_number);
    if (existing) {
      return NextResponse.json({ error: 'Driver with this license already exists' }, { status: 409 });
    }

    const result = db.prepare(`
      INSERT INTO drivers (
        company_id, name, phone, license_number, license_type, license_expiry,
        nrc_number, date_of_birth, address, photo_url, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `).run(
      decoded.id,
      name,
      phone,
      license_number,
      license_type,
      license_expiry,
      nrc_number,
      date_of_birth || null,
      address || null,
      photo_url || null
    );

    return NextResponse.json({
      message: 'Driver created successfully',
      driver_id: result.lastInsertRowid
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating driver:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH update driver
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

    if (decoded.user_type !== 'company' && decoded.user_type !== 'admin') {
      return NextResponse.json({ error: 'Company access only' }, { status: 403 });
    }

    const body = await request.json();
    const { driver_id, ...updates } = body;

    if (!driver_id) {
      return NextResponse.json({ error: 'Driver ID required' }, { status: 400 });
    }

    // Get driver and verify ownership
    const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(driver_id) as any;

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    if (decoded.user_type === 'company' && driver.company_id !== decoded.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const allowedFields = [
      'name', 'phone', 'license_number', 'license_type', 'license_expiry',
      'nrc_number', 'date_of_birth', 'address', 'photo_url', 'status'
    ];

    const updateParts: string[] = [];
    const values: any[] = [];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateParts.push(`${field} = ?`);
        values.push(updates[field]);
      }
    }

    if (updateParts.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(driver_id);
    db.prepare(`UPDATE drivers SET ${updateParts.join(', ')} WHERE id = ?`).run(...values);

    return NextResponse.json({ message: 'Driver updated successfully' });
  } catch (error) {
    console.error('Error updating driver:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE driver (soft delete by setting status)
export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (decoded.user_type !== 'company' && decoded.user_type !== 'admin') {
      return NextResponse.json({ error: 'Company access only' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const driverId = searchParams.get('driver_id');

    if (!driverId) {
      return NextResponse.json({ error: 'Driver ID required' }, { status: 400 });
    }

    const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(driverId) as any;

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    if (decoded.user_type === 'company' && driver.company_id !== decoded.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Check if driver has future assigned routes
    const futureRoutes = db.prepare(`
      SELECT COUNT(*) as count FROM routes 
      WHERE driver_id = ? AND date >= date('now') AND status = 'active'
    `).get(driverId) as any;

    if (futureRoutes.count > 0) {
      return NextResponse.json({ 
        error: `Driver has ${futureRoutes.count} future route(s) assigned. Please reassign before removing.` 
      }, { status: 400 });
    }

    // Soft delete
    db.prepare(`UPDATE drivers SET status = 'inactive' WHERE id = ?`).run(driverId);

    return NextResponse.json({ message: 'Driver removed successfully' });
  } catch (error) {
    console.error('Error deleting driver:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
