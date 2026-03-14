// app/api/company/drivers/[driverId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/database-schema';
import { verifyToken } from '@/app/lib/auth';
import bcrypt from 'bcryptjs'; // Add this import

// PUT update a driver
export async function PUT(request: NextRequest, { params }: { params: Promise<{ driverId: string }> }) {
  try {
    const { driverId } = await params;
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.user_type !== 'company') {
      return NextResponse.json({ error: 'Company access only' }, { status: 403 });
    }

    // Verify driver belongs to this company
    const driver = db.prepare('SELECT * FROM drivers WHERE id = ? AND company_id = ?').get(driverId, decoded.id) as any;
    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    const body = await request.json();
    const { 
      name, 
      phone, 
      email,                // Added email field
      password,             // Added password field (optional)
      license_number, 
      license_type, 
      license_expiry, 
      nrc_number, 
      date_of_birth, 
      address, 
      status 
    } = body;

    const updates: string[] = [];
    const values: any[] = [];

    // Add basic fields if provided
    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (phone !== undefined) { updates.push('phone = ?'); values.push(phone); }
    if (license_number !== undefined) { updates.push('license_number = ?'); values.push(license_number); }
    if (license_type !== undefined) { updates.push('license_type = ?'); values.push(license_type); }
    if (license_expiry !== undefined) { updates.push('license_expiry = ?'); values.push(license_expiry); }
    if (nrc_number !== undefined) { updates.push('nrc_number = ?'); values.push(nrc_number); }
    if (date_of_birth !== undefined) { updates.push('date_of_birth = ?'); values.push(date_of_birth); }
    if (address !== undefined) { updates.push('address = ?'); values.push(address); }
    if (status !== undefined) { updates.push('status = ?'); values.push(status); }

    // NEW: Handle email update with uniqueness check
    if (email !== undefined) {
      // Check if email is already used by another driver
      const existingDriver = db.prepare('SELECT id FROM drivers WHERE email = ? AND id != ?').get(email, driverId) as any;
      if (existingDriver) {
        return NextResponse.json({ 
          error: 'Email already in use by another driver' 
        }, { status: 400 });
      }
      updates.push('email = ?');
      values.push(email);
    }

    // NEW: Handle password update (if provided)
    if (password !== undefined && password.length > 0) {
      // Validate password length
      if (password.length < 6) {
        return NextResponse.json({ 
          error: 'Password must be at least 6 characters long' 
        }, { status: 400 });
      }

      // Hash the new password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      updates.push('password = ?');
      values.push(hashedPassword);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(driverId);
    db.prepare(`UPDATE drivers SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    // Fetch updated driver (excluding password)
    const updated = db.prepare(`
      SELECT 
        id, company_id, name, phone, email, 
        license_number, license_type, license_expiry,
        nrc_number, date_of_birth, address, photo_url,
        status, created_at, last_login
      FROM drivers 
      WHERE id = ?
    `).get(driverId);

    return NextResponse.json({ 
      driver: updated, 
      message: 'Driver updated successfully' 
    });
  } catch (error) {
    console.error('Error updating driver:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE a driver
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ driverId: string }> }) {
  try {
    const { driverId } = await params;
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.user_type !== 'company') {
      return NextResponse.json({ error: 'Company access only' }, { status: 403 });
    }

    // Verify driver belongs to this company
    const driver = db.prepare('SELECT * FROM drivers WHERE id = ? AND company_id = ?').get(driverId, decoded.id) as any;
    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    // Check if driver has active routes
    const activeRoutes = db.prepare('SELECT COUNT(*) as count FROM routes WHERE driver_id = ? AND status = ?').get(driverId, 'active') as any;
    if (activeRoutes.count > 0) {
      return NextResponse.json({ 
        error: `Driver has ${activeRoutes.count} active route(s). Reassign routes before deleting.` 
      }, { status: 400 });
    }

    // Remove driver from any future routes
    db.prepare("UPDATE routes SET driver_id = NULL WHERE driver_id = ? AND status != 'active'").run(driverId);
    
    // Delete driver
    db.prepare('DELETE FROM drivers WHERE id = ?').run(driverId);

    return NextResponse.json({ message: 'Driver deleted successfully' });
  } catch (error) {
    console.error('Error deleting driver:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}