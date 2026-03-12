// app/api/driver/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/database-schema';
import bcrypt from 'bcryptjs';
import { AuditHelpers, Actor } from '@/app/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Find driver with valid reset token
    const now = new Date().toISOString();
    const driver = db.prepare(`
      SELECT id, name, email, company_id
      FROM drivers 
      WHERE reset_password_token = ? 
        AND reset_password_expires > ?
        AND status = 'active'
    `).get(token, now) as any;

    if (!driver) {
      // Log failed reset attempt (no specific driver found)
      await AuditHelpers.loginFailed(
        'unknown', 
        'Invalid or expired reset token',
        request.headers.get('x-forwarded-for') || undefined,
        request.headers.get('user-agent') || undefined
      );
      
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Create actor for this driver
    const driverActor: Actor = {
      id: driver.id,
      type: 'driver',
      email: driver.email,
      name: driver.name
    };

    try {
      // Hash new password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password and clear reset token
      db.prepare(`
        UPDATE drivers 
        SET password = ?, reset_password_token = NULL, reset_password_expires = NULL
        WHERE id = ?
      `).run(hashedPassword, driver.id);

      // Log successful password reset
      await AuditHelpers.driverAction(
        driver,
        'password_reset',
        'auth',
        {
          ipAddress: request.headers.get('x-forwarded-for') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
          metadata: {
            method: 'email_reset',
            timestamp: new Date().toISOString()
          }
        }
      );

      return NextResponse.json({
        success: true,
        message: 'Password has been reset successfully. You can now login with your new password.'
      });

    } catch (error) {
      // Log system error
      await AuditHelpers.systemError(
        error as Error,
        { context: 'password_reset', driverId: driver.id }
      );
      
      throw error;
    }

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}