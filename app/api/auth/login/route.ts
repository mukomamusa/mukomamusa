// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/database-schema';
import { verifyPassword, generateToken, User } from '@/app/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, twoFactorCode } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user with status
    const user = db.prepare(`
      SELECT id, email, password, name, phone, user_type, company_name, license_number, status, two_factor_enabled, two_factor_secret
      FROM users
      WHERE email = ?
    `).get(email) as any;

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check account status
    if (user.status === 'suspended') {
      return NextResponse.json(
        { error: 'Your account has been suspended. Please contact support for assistance.' },
        { status: 403 }
      );
    }

    if (user.status === 'pending_verification') {
      return NextResponse.json(
        { error: 'Your account is pending verification. An administrator will review and approve your registration shortly.' },
        { status: 403 }
      );
    }

    // Check if 2FA is enabled
    if (user.two_factor_enabled && user.two_factor_secret) {
      if (!twoFactorCode) {
        return NextResponse.json(
          { 
            requires2FA: true,
            message: 'Two-factor authentication code required'
          },
          { status: 200 }
        );
      }

      // Verify 2FA code
      const speakeasy = require('speakeasy');
      const verified = speakeasy.totp.verify({
        secret: user.two_factor_secret,
        encoding: 'base32',
        token: twoFactorCode,
        window: 2
      });

      if (!verified) {
        return NextResponse.json(
          { error: 'Invalid two-factor authentication code' },
          { status: 401 }
        );
      }
    }

    // Generate token
    const userForToken: User = {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      user_type: user.user_type,
      company_name: user.company_name,
      license_number: user.license_number,
    };

    const token = generateToken(userForToken);

    return NextResponse.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        user_type: user.user_type,
        company_name: user.company_name,
        license_number: user.license_number,
        two_factor_enabled: !!user.two_factor_enabled,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}