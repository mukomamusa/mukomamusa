// app/api/driver/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/database-schema';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '@/app/lib/jwt';
import { AuditHelpers, Actor } from '@/app/lib/audit';
const JWT_SECRET = getJwtSecret();

function isDriverEmailVerificationRequired() {
  const value = (process.env.REQUIRE_DRIVER_EMAIL_VERIFICATION || '').toLowerCase();
  if (!value) {
    return true;
  }

  return value !== 'false' && value !== '0' && value !== 'no';
}

export async function POST(request: NextRequest) {
  try {
    if (!JWT_SECRET) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { username, password, deviceId } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Email/Phone and password are required' },
        { status: 400 }
      );
    }

    // Find driver by email OR phone number
    const driver = db.prepare(`
      SELECT 
        d.*,
        u.company_name,
        u.id as company_user_id,
        u.email as company_email
      FROM drivers d
      JOIN users u ON d.company_id = u.id
      WHERE (d.email = ? OR d.phone = ?) AND d.status = 'active'
    `).get(username, username) as any;

    if (!driver) {
      // Log failed login - driver not found
      await AuditHelpers.loginFailed(
        username,
        'driver_not_found',
        request.headers.get('x-forwarded-for'),
        request.headers.get('user-agent')
      );
      
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create actor for this driver
    const driverActor: Actor = {
      id: driver.id,
      type: 'driver',
      email: driver.email,
      name: driver.name
    };

    // Allow temporary bypass in testing environments via env flag.
    const verificationRequired = isDriverEmailVerificationRequired();

    // Check if email is verified
    if (verificationRequired && !driver.email_verified) {
      await AuditHelpers.driverAction(
        driver,
        'login_failed',
        'auth',
        {
          ipAddress: request.headers.get('x-forwarded-for') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
          status: 'failure',
          errorMessage: 'Email not verified',
          metadata: { requiresVerification: true }
        }
      );

      return NextResponse.json({
        error: 'Email not verified',
        requiresVerification: true,
        email: driver.email
      }, { status: 403 });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, driver.password);
    if (!isValid) {
      // Log failed login - wrong password
      await AuditHelpers.driverAction(
        driver,
        'login_failed',
        'auth',
        {
          ipAddress: request.headers.get('x-forwarded-for') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
          status: 'failure',
          errorMessage: 'Invalid password'
        }
      );

      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Update last login and device ID
    db.prepare(`
      UPDATE drivers 
      SET last_login = CURRENT_TIMESTAMP, device_id = ?
      WHERE id = ?
    `).run(deviceId || null, driver.id);

    // Generate JWT token
    const token = jwt.sign(
      {
        id: driver.id,
        email: driver.email,
        phone: driver.phone,
        name: driver.name,
        company_id: driver.company_id,
        company_name: driver.company_name,
        role: 'driver',
        type: 'driver',
        verified: Boolean(driver.email_verified) || !verificationRequired
      },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Log successful login
    await AuditHelpers.loginSuccess(
      driverActor,
      request.headers.get('x-forwarded-for') || undefined,
      request.headers.get('user-agent') || undefined
    );

    // Remove sensitive data
    delete driver.password;

    const loginMethod = driver.email === username ? 'email' : 'phone';

    return NextResponse.json({
      success: true,
      token,
      loginMethod,
      driver: {
        id: driver.id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        license_number: driver.license_number,
        license_type: driver.license_type,
        license_expiry: driver.license_expiry,
        company_id: driver.company_id,
        company_name: driver.company_name,
        photo_url: driver.photo_url,
        email_verified: driver.email_verified
      }
    });

  } catch (error) {
    console.error('Driver login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}