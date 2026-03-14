import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/database-schema';
import { generateToken, User } from '@/app/lib/auth';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.NEXTAUTH_URL 
  ? `${process.env.NEXTAUTH_URL}/api/auth/google/callback`
  : 'http://localhost:3000/api/auth/google/callback';

// GET - Redirect to Google OAuth
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userType = searchParams.get('user_type') || 'customer';
  
  if (!GOOGLE_CLIENT_ID) {
    return NextResponse.json(
      { error: 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.' },
      { status: 500 }
    );
  }

  const state = Buffer.from(JSON.stringify({ user_type: userType })).toString('base64');
  
  const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleAuthUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
  googleAuthUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  googleAuthUrl.searchParams.set('response_type', 'code');
  googleAuthUrl.searchParams.set('scope', 'email profile');
  googleAuthUrl.searchParams.set('access_type', 'offline');
  googleAuthUrl.searchParams.set('state', state);
  googleAuthUrl.searchParams.set('prompt', 'select_account');

  return NextResponse.redirect(googleAuthUrl.toString());
}

// POST - Handle Google OAuth token exchange (for frontend SDK approach)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { credential, user_type = 'customer' } = body;

    if (!credential) {
      return NextResponse.json(
        { error: 'Google credential is required' },
        { status: 400 }
      );
    }

    // Decode the JWT token from Google
    const payload = JSON.parse(
      Buffer.from(credential.split('.')[1], 'base64').toString()
    );

    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return NextResponse.json(
        { error: 'Email not provided by Google' },
        { status: 400 }
      );
    }

    // Check if user exists by Google ID or email
    let user = db.prepare(`
      SELECT id, email, name, phone, user_type, company_name, license_number, status, google_id
      FROM users WHERE google_id = ? OR email = ?
    `).get(googleId, email) as any;

    if (user) {
      // Existing user - check status
      if (user.status === 'suspended') {
        return NextResponse.json(
          { error: 'Your account has been suspended. Please contact support.' },
          { status: 403 }
        );
      }

      if (user.status === 'pending_verification') {
        return NextResponse.json(
          { error: 'Your account is pending verification by an administrator.' },
          { status: 403 }
        );
      }

      // Update Google ID if not set
      if (!user.google_id) {
        db.prepare('UPDATE users SET google_id = ?, auth_provider = ? WHERE id = ?')
          .run(googleId, 'google', user.id);
      }
    } else {
      // New user - create account
      // Companies via Google still need additional verification
      const status = user_type === 'company' ? 'pending_verification' : 'active';
      
      const result = db.prepare(`
        INSERT INTO users (email, password, name, phone, user_type, google_id, auth_provider, status)
        VALUES (?, ?, ?, ?, ?, ?, 'google', ?)
      `).run(
        email,
        '', // No password for Google auth users
        name || email.split('@')[0],
        '', // Phone can be updated later
        user_type,
        googleId,
        status
      );

      user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid) as any;

      if (status === 'pending_verification') {
        return NextResponse.json({
          message: 'Company account created! Please complete your profile with company details. Your account is pending verification.',
          requiresProfile: true,
          userId: user.id
        }, { status: 201 });
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
      },
    });

  } catch (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.json(
      { error: 'Failed to authenticate with Google' },
      { status: 500 }
    );
  }
}
