import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/database-schema';
import { verifyToken } from '@/app/lib/auth';

// GET - Get single user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const userId = parseInt(id);
    
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Get user
    const user = db.prepare(`
      SELECT 
        id, email, name, phone, user_type, status, created_at, updated_at,
        company_name, license_number, company_registration_number, company_address,
        nrc, date_of_birth, gender, emergency_contact, emergency_phone
      FROM users WHERE id = ?
    `).get(userId) as any;

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get related data based on user type
    let relatedData = {};

    if (user.user_type === 'customer') {
      // Get booking count
      const bookingCount = db.prepare(
        'SELECT COUNT(*) as count FROM bookings WHERE customer_id = ?'
      ).get(userId) as any;
      relatedData = { bookingCount: bookingCount?.count || 0 };
    } else if (user.user_type === 'company') {
      // Get company stats
      const busCount = db.prepare(
        'SELECT COUNT(*) as count FROM buses WHERE company_id = ?'
      ).get(userId) as any;
      const routeCount = db.prepare(`
        SELECT COUNT(*) as count FROM routes r 
        JOIN buses b ON r.bus_id = b.id 
        WHERE b.company_id = ?
      `).get(userId) as any;
      const bookingCount = db.prepare(`
        SELECT COUNT(*) as count FROM bookings b
        JOIN routes r ON b.route_id = r.id
        JOIN buses bus ON r.bus_id = bus.id
        WHERE bus.company_id = ?
      `).get(userId) as any;
      
      relatedData = {
        busCount: busCount?.count || 0,
        routeCount: routeCount?.count || 0,
        bookingCount: bookingCount?.count || 0
      };
    } else if (user.user_type === 'driver') {
      // Get driver stats
      const tripCount = db.prepare(
        'SELECT COUNT(*) as count FROM trips WHERE driver_id = ?'
      ).get(userId) as any;
      relatedData = { tripCount: tripCount?.count || 0 };
    }

    return NextResponse.json({
      user,
      relatedData
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

// PATCH - Update user
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const userId = parseInt(id);
    
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Check if user exists
    const existingUser = db.prepare('SELECT id, user_type FROM users WHERE id = ?').get(userId) as any;
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      name,
      phone,
      email,
      company_name,
      license_number,
      company_registration_number,
      company_address,
      nrc,
      date_of_birth,
      gender,
      emergency_contact,
      emergency_phone
    } = body;

    // Build update query
    const updateFields: string[] = [];
    const updateParams: any[] = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateParams.push(name);
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateParams.push(phone);
    }
    if (email !== undefined) {
      // Check if new email already exists
      const emailExists = db.prepare(
        'SELECT id FROM users WHERE email = ? AND id != ?'
      ).get(email, userId);
      if (emailExists) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
      }
      updateFields.push('email = ?');
      updateParams.push(email);
    }

    // Type-specific fields
    if (existingUser.user_type === 'company') {
      if (company_name !== undefined) {
        updateFields.push('company_name = ?');
        updateParams.push(company_name);
      }
      if (license_number !== undefined) {
        updateFields.push('license_number = ?');
        updateParams.push(license_number);
      }
      if (company_registration_number !== undefined) {
        updateFields.push('company_registration_number = ?');
        updateParams.push(company_registration_number);
      }
      if (company_address !== undefined) {
        updateFields.push('company_address = ?');
        updateParams.push(company_address);
      }
    }

    if (existingUser.user_type === 'customer') {
      if (nrc !== undefined) {
        updateFields.push('nrc = ?');
        updateParams.push(nrc);
      }
      if (date_of_birth !== undefined) {
        updateFields.push('date_of_birth = ?');
        updateParams.push(date_of_birth);
      }
      if (gender !== undefined) {
        updateFields.push('gender = ?');
        updateParams.push(gender);
      }
      if (emergency_contact !== undefined) {
        updateFields.push('emergency_contact = ?');
        updateParams.push(emergency_contact);
      }
      if (emergency_phone !== undefined) {
        updateFields.push('emergency_phone = ?');
        updateParams.push(emergency_phone);
      }
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updateFields.push('updated_at = datetime("now")');
    updateParams.push(userId);

    const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
    db.prepare(updateQuery).run(...updateParams);

    // Get updated user
    const updatedUser = db.prepare(`
      SELECT 
        id, email, name, phone, user_type, status, created_at, updated_at,
        company_name, license_number, company_registration_number
      FROM users WHERE id = ?
    `).get(userId) as any;

    return NextResponse.json({
      message: 'User updated successfully',
      user: updatedUser
    });

  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json({ 
      error: error?.message || 'Failed to update user' 
    }, { status: 500 });
  }
}

// DELETE - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const userId = parseInt(id);
    
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Prevent admin from deleting themselves
    if (userId === decoded.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    // Check if user exists
    const existingUser = db.prepare('SELECT id, user_type FROM users WHERE id = ?').get(userId) as any;
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent deleting other admins
    if (existingUser.user_type === 'admin') {
      return NextResponse.json({ error: 'Cannot delete admin accounts' }, { status: 400 });
    }

    // Delete user
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);

    return NextResponse.json({
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
