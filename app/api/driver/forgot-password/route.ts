// app/api/driver/forgot-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/database-schema';
import crypto from 'crypto';
import { sendEmail, getPasswordResetEmail } from '@/app/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find driver by email
    const driver = db.prepare(`
      SELECT id, name, email, email_verified 
      FROM drivers 
      WHERE email = ? AND status = 'active'
    `).get(email) as any;

    if (!driver) {
      // Return success even if email not found (security best practice)
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token valid for 1 hour

    // Store token in database
    db.prepare(`
      UPDATE drivers 
      SET reset_password_token = ?, reset_password_expires = ?
      WHERE id = ?
    `).run(resetToken, expiresAt.toISOString(), driver.id);

    // Create reset link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const resetLink = `${baseUrl}/driver/reset-password?token=${resetToken}`;

    // Send email
    const emailResult = await sendEmail({
      to: driver.email,
      subject: '🔐 Reset Your VayaZed Driver Password',
      html: getPasswordResetEmail(resetLink, driver.name)
    });

    if (!emailResult.success) {
      console.error('Failed to send reset email:', emailResult.error);
      return NextResponse.json(
        { error: 'Failed to send reset email. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset link has been sent to your email.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}