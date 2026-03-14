import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/database-schema';
import { verifyToken } from '@/app/lib/auth';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

// GET - Generate 2FA secret and QR code
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

    // Get user
    const user = db.prepare('SELECT id, email, name, two_factor_enabled FROM users WHERE id = ?').get(decoded.id) as any;
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.two_factor_enabled) {
      return NextResponse.json({ 
        error: 'Two-factor authentication is already enabled',
        enabled: true 
      }, { status: 400 });
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `VayaZed Bus Booking (${user.email})`,
      issuer: 'VayaZed Bus Booking'
    });

    // Store temporary secret (not enabled yet until verified)
    db.prepare(`
      UPDATE users SET two_factor_secret = ? WHERE id = ?
    `).run(secret.base32, user.id);

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');

    return NextResponse.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
      message: 'Scan the QR code with your authenticator app, then verify with a code to enable 2FA'
    });

  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Verify and enable 2FA
export async function POST(request: NextRequest) {
  try {
    const authToken = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(authToken);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ error: 'Verification code is required' }, { status: 400 });
    }

    // Get user with secret
    const user = db.prepare('SELECT id, two_factor_secret, two_factor_enabled FROM users WHERE id = ?').get(decoded.id) as any;
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.two_factor_secret) {
      return NextResponse.json({ error: 'Please generate a 2FA secret first' }, { status: 400 });
    }

    if (user.two_factor_enabled) {
      return NextResponse.json({ error: 'Two-factor authentication is already enabled' }, { status: 400 });
    }

    // Verify the code
    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: code,
      window: 2
    });

    if (!verified) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    // Enable 2FA
    db.prepare(`
      UPDATE users SET two_factor_enabled = 1 WHERE id = ?
    `).run(user.id);

    return NextResponse.json({
      message: 'Two-factor authentication has been enabled successfully',
      enabled: true
    });

  } catch (error) {
    console.error('2FA verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Disable 2FA
export async function DELETE(request: NextRequest) {
  try {
    const authToken = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(authToken);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json({ error: 'Password is required to disable 2FA' }, { status: 400 });
    }

    // Get user
    const user = db.prepare('SELECT id, password, two_factor_enabled FROM users WHERE id = ?').get(decoded.id) as any;
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify password
    const bcrypt = require('bcryptjs');
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    // Disable 2FA
    db.prepare(`
      UPDATE users SET two_factor_enabled = 0, two_factor_secret = NULL WHERE id = ?
    `).run(user.id);

    return NextResponse.json({
      message: 'Two-factor authentication has been disabled',
      enabled: false
    });

  } catch (error) {
    console.error('2FA disable error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
