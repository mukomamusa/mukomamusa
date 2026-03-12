// app/api/company/drivers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/database-schema';
import { verifyToken } from '@/app/lib/auth';
import bcrypt from 'bcryptjs'; // Add this import
import { sendEmail, getVerificationEmail } from '@/app/lib/email';
import crypto from 'crypto';

// GET all drivers for the company
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.user_type !== 'company') {
      return NextResponse.json({ error: 'Company access only' }, { status: 403 });
    }

    // IMPORTANT: Exclude password field from SELECT
    const drivers = db.prepare(`
      SELECT 
        d.id, 
        d.company_id, 
        d.name, 
        d.phone, 
        d.email,  -- Include email
        d.license_number, 
        d.license_type, 
        d.license_expiry, 
        d.nrc_number, 
        d.date_of_birth, 
        d.address, 
        d.photo_url, 
        d.status, 
        d.created_at,
        d.last_login,
        d.device_id,
        (SELECT COUNT(*) FROM routes r WHERE r.driver_id = d.id AND r.status = 'active') as active_routes
      FROM drivers d 
      WHERE d.company_id = ? 
      ORDER BY d.created_at DESC
    `).all(decoded.id);

    return NextResponse.json({ drivers });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create a new driver
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.user_type !== 'company') {
      return NextResponse.json({ error: 'Company access only' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      phone,
      email,              // NEW: Email field
      password,           // NEW: Password field
      license_number,
      license_type,
      license_expiry,
      nrc_number,
      date_of_birth,
      address
    } = body;

    // Validate required fields including email and password
    if (!name || !phone || !license_number || !email || !password) {
      return NextResponse.json({
        error: 'Name, phone, license number, email, and password are required'
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        error: 'Please enter a valid email address'
      }, { status: 400 });
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json({
        error: 'Password must be at least 6 characters long'
      }, { status: 400 });
    }

    // Check for duplicate license number
    const existingLicense = db.prepare(
      'SELECT id FROM drivers WHERE license_number = ? AND company_id = ?'
    ).get(license_number, decoded.id);

    if (existingLicense) {
      return NextResponse.json({
        error: 'A driver with this license number already exists'
      }, { status: 409 });
    }

    // Check for duplicate email (across all companies)
    const existingEmail = db.prepare(
      'SELECT id FROM drivers WHERE email = ?'
    ).get(email);

    if (existingEmail) {
      return NextResponse.json({
        error: 'This email is already registered. Please use a different email.'
      }, { status: 409 });
    }

    // 🔐 HASH THE PASSWORD
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert driver with email and hashed password
    const result = db.prepare(`
      INSERT INTO drivers (
        company_id, 
        name, 
        phone, 
        email,                    -- Add email
        password,                 -- Add hashed password
        license_number, 
        license_type, 
        license_expiry, 
        nrc_number, 
        date_of_birth, 
        address, 
        status, 
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'))
    `).run(
      decoded.id,
      name,
      phone,
      email,                    // Email
      hashedPassword,           // Hashed password (NOT plain text)
      license_number,
      license_type || 'Class B',
      license_expiry || null,
      nrc_number || null,
      date_of_birth || null,
      address || null
    );
    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Store token in database
    db.prepare(`
  UPDATE drivers SET verification_token = ? WHERE id = ?
`).run(verificationToken, result.lastInsertRowid);

    // Send verification email
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const verifyLink = `${baseUrl}/driver/verify-email?token=${verificationToken}`;

    await sendEmail({
      to: email,
      subject: '📧 Verify Your VayaZed Driver Account',
      html: getVerificationEmail(verifyLink, name)
    });

    // Fetch the newly created driver (excluding password)
    const driver = db.prepare(`
      SELECT 
        id, 
        company_id, 
        name, 
        phone, 
        email, 
        license_number, 
        license_type, 
        license_expiry, 
        nrc_number, 
        date_of_birth, 
        address, 
        photo_url, 
        status, 
        created_at,
        last_login
      FROM drivers 
      WHERE id = ?
    `).get(result.lastInsertRowid);

    return NextResponse.json({
      driver,
      message: 'Driver added successfully. They can now login with their email and password.'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating driver:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


