import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/database-schema';
import { hashPassword } from '@/app/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      email, password, name, phone, user_type, 
      company_name, license_number, 
      company_registration_number, company_address 
    } = body;

    // Validate required fields
    if (!email || !password || !name || !phone || !user_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate user type
    if (!['customer', 'company'].includes(user_type)) {
      return NextResponse.json(
        { error: 'Invalid user type' },
        { status: 400 }
      );
    }

    // Additional validation for company registration
    if (user_type === 'company') {
      if (!company_name || !license_number || !company_registration_number || !company_address) {
        return NextResponse.json(
          { error: 'Company registration requires: company name, RTSA license number, PACRA registration number, and company address' },
          { status: 400 }
        );
      }
    }

    // Check if user already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Companies require approval, customers are active immediately
    const status = user_type === 'company' ? 'pending_verification' : 'active';

    // Insert user
    const stmt = db.prepare(`
      INSERT INTO users (email, password, name, phone, user_type, company_name, license_number, company_registration_number, company_address, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      email,
      hashedPassword,
      name,
      phone,
      user_type,
      company_name || null,
      license_number || null,
      company_registration_number || null,
      company_address || null,
      status
    );

    const responseMessage = user_type === 'company' 
      ? 'Company registered successfully! Your account is pending verification. An admin will review your documents and activate your account.'
      : 'Registration successful!';

    return NextResponse.json(
      {
        message: responseMessage,
        userId: result.lastInsertRowid,
        status: status
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}