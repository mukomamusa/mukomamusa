import { NextResponse } from 'next/server';
import db from '../../lib/database-schema';
import { verifyToken } from '../../lib/auth';
import bcrypt from 'bcryptjs';

interface UserPayload {
  id: number;
  email: string;
  user_type: 'customer' | 'company' | 'admin';
}

// GET - Fetch user profile
export async function GET(request: Request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = verifyToken(token) as UserPayload | null;
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const user = db.prepare(`
      SELECT 
        id, email, name, phone, user_type,
        nrc_number, date_of_birth, gender, address,
        emergency_contact_name, emergency_contact_phone,
        company_name, license_number, company_registration_number,
        company_address, company_logo_url,
        status, email_verified, phone_verified,
        created_at
      FROM users WHERE id = ?
    `).get(decoded.id) as any;

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      profile: user 
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

// PATCH - Update user profile
export async function PATCH(request: Request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = verifyToken(token) as UserPayload | null;
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      name, phone, 
      nrc_number, date_of_birth, gender, address,
      emergency_contact_name, emergency_contact_phone,
      company_name, license_number, company_registration_number,
      company_address, company_logo_url,
      current_password, new_password
    } = body;

    // Get current user
    const currentUser = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id) as any;
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Handle password change if requested
    if (new_password) {
      if (!current_password) {
        return NextResponse.json({ error: 'Current password is required to change password' }, { status: 400 });
      }

      const isValidPassword = await bcrypt.compare(current_password, currentUser.password);
      if (!isValidPassword) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }

      if (new_password.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
      }

      const hashedPassword = await bcrypt.hash(new_password, 10);
      db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, decoded.id);
    }

    // Build dynamic update query based on user type
    let updateFields: string[] = [];
    let updateValues: any[] = [];

    // Common fields
    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(phone);
    }

    // Customer-specific fields
    if (decoded.user_type === 'customer') {
      if (nrc_number !== undefined) {
        updateFields.push('nrc_number = ?');
        updateValues.push(nrc_number);
      }
      if (date_of_birth !== undefined) {
        updateFields.push('date_of_birth = ?');
        updateValues.push(date_of_birth);
      }
      if (gender !== undefined) {
        updateFields.push('gender = ?');
        updateValues.push(gender);
      }
      if (address !== undefined) {
        updateFields.push('address = ?');
        updateValues.push(address);
      }
      if (emergency_contact_name !== undefined) {
        updateFields.push('emergency_contact_name = ?');
        updateValues.push(emergency_contact_name);
      }
      if (emergency_contact_phone !== undefined) {
        updateFields.push('emergency_contact_phone = ?');
        updateValues.push(emergency_contact_phone);
      }
    }

    // Company-specific fields
    if (decoded.user_type === 'company') {
      if (company_name !== undefined) {
        updateFields.push('company_name = ?');
        updateValues.push(company_name);
      }
      if (license_number !== undefined) {
        updateFields.push('license_number = ?');
        updateValues.push(license_number);
      }
      if (company_registration_number !== undefined) {
        updateFields.push('company_registration_number = ?');
        updateValues.push(company_registration_number);
      }
      if (company_address !== undefined) {
        updateFields.push('company_address = ?');
        updateValues.push(company_address);
      }
      if (company_logo_url !== undefined) {
        updateFields.push('company_logo_url = ?');
        updateValues.push(company_logo_url);
      }
    }

    // Execute update if there are fields to update
    if (updateFields.length > 0) {
      updateValues.push(decoded.id);
      db.prepare(`
        UPDATE users 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `).run(...updateValues);
    }

    // Fetch updated profile
    const updatedUser = db.prepare(`
      SELECT 
        id, email, name, phone, user_type,
        nrc_number, date_of_birth, gender, address,
        emergency_contact_name, emergency_contact_phone,
        company_name, license_number, company_registration_number,
        company_address, company_logo_url,
        status, email_verified, phone_verified,
        created_at
      FROM users WHERE id = ?
    `).get(decoded.id);

    return NextResponse.json({ 
      success: true, 
      message: 'Profile updated successfully',
      profile: updatedUser 
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
