import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/database-schema';
import crypto from 'crypto';

// POST - Request password reset
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

    // Find user
    const user = db.prepare('SELECT id, email, name FROM users WHERE email = ?').get(email) as any;

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Token expires in 1 hour
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    // Save reset token to database
    db.prepare(`
      UPDATE users 
      SET password_reset_token = ?, password_reset_expires = ?
      WHERE id = ?
    `).run(hashedToken, expiresAt, user.id);

    // In production, send email here with reset link
    // For demo purposes, we'll include the token in the response
    // REMOVE THIS IN PRODUCTION - only for development/demo
    const resetUrl = `/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    console.log(`Password reset requested for ${email}`);
    console.log(`Reset URL (DEV ONLY): ${resetUrl}`);

    return NextResponse.json({
      message: 'If an account with that email exists, a password reset link has been sent.',
      // DEV ONLY - Remove in production
      devResetUrl: resetUrl,
      devToken: resetToken
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
