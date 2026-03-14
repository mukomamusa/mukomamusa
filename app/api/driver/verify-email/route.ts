// app/api/driver/verify-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/database-schema';

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Find driver with this verification token
    const driver = db.prepare(`
      SELECT id, name, email, email_verified 
      FROM drivers 
      WHERE verification_token = ? AND status = 'active'
    `).get(token) as any;

    if (!driver) {
      return NextResponse.json(
        { error: 'Invalid verification token' },
        { status: 400 }
      );
    }

    if (driver.email_verified) {
      return NextResponse.json({
        success: true,
        message: 'Email already verified',
        alreadyVerified: true
      });
    }

    // Update driver as verified
    db.prepare(`
      UPDATE drivers 
      SET email_verified = 1, 
          email_verified_at = CURRENT_TIMESTAMP,
          verification_token = NULL
      WHERE id = ?
    `).run(driver.id);

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully! You can now log in.',
      driver: {
        name: driver.name,
        email: driver.email
      }
    });

  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}