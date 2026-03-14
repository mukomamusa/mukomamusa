import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/database-schema';
import { verifyToken } from '@/app/lib/auth';
import bcrypt from 'bcryptjs';

// GET - List users with filters and pagination
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.user_type !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Filters
    const search = searchParams.get('search') || '';
    const userType = searchParams.get('user_type');
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query
    let whereConditions = [];
    let params: any[] = [];

    if (search) {
      whereConditions.push('(name LIKE ? OR email LIKE ? OR phone LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (userType) {
      whereConditions.push('user_type = ?');
      params.push(userType);
    }

    if (status) {
      whereConditions.push('status = ?');
      params.push(status);
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    // Validate sort column
    const validSortColumns = ['id', 'name', 'email', 'user_type', 'status', 'created_at'];
    const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const safeSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
    const totalResult = db.prepare(countQuery).get(...params) as any;
    const total = totalResult?.total || 0;

    // Get users with pagination
    const dataQuery = `
      SELECT 
        id, 
        email, 
        name, 
        phone, 
        user_type, 
        status, 
        created_at,
        company_name,
        license_number,
        company_registration_number
      FROM users 
      ${whereClause}
      ORDER BY ${safeSortBy} ${safeSortOrder}
      LIMIT ? OFFSET ?
    `;
    
    const users = db.prepare(dataQuery).all(...params, limit, offset) as any[];

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.user_type !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      email, 
      password, 
      name, 
      phone, 
      user_type,
      company_name,
      license_number,
      company_registration_number,
      company_address,
      nrc,
      date_of_birth,
      gender,
      emergency_contact,
      emergency_phone
    } = body;

    // Validation
    if (!email || !password || !name || !phone || !user_type) {
      return NextResponse.json({ 
        error: 'Missing required fields: email, password, name, phone, user_type' 
      }, { status: 400 });
    }

    const validUserTypes = ['customer', 'company', 'driver', 'admin'];
    if (!validUserTypes.includes(user_type)) {
      return NextResponse.json({ 
        error: 'Invalid user_type. Must be: customer, company, driver, or admin' 
      }, { status: 400 });
    }

    // Check if email already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Build insert query based on user type
    let insertQuery = `
      INSERT INTO users (
        email, password, name, phone, user_type, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'active', datetime('now'), datetime('now'))
    `;
    let insertParams = [email, hashedPassword, name, phone, user_type];

    // Add type-specific fields
    if (user_type === 'company') {
      insertQuery = `
        INSERT INTO users (
          email, password, name, phone, user_type, status, 
          company_name, license_number, company_registration_number, company_address,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, datetime('now'), datetime('now'))
      `;
      insertParams = [
        email, hashedPassword, name, phone, user_type,
        company_name || null,
        license_number || null,
        company_registration_number || null,
        company_address || null
      ];
    } else if (user_type === 'customer') {
      insertQuery = `
        INSERT INTO users (
          email, password, name, phone, user_type, status,
          nrc, date_of_birth, gender, emergency_contact, emergency_phone,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `;
      insertParams = [
        email, hashedPassword, name, phone, user_type,
        nrc || null,
        date_of_birth || null,
        gender || null,
        emergency_contact || null,
        emergency_phone || null
      ];
    }

    const result = db.prepare(insertQuery).run(...insertParams);
    const userId = result.lastInsertRowid;

    // Get created user
    const newUser = db.prepare(`
      SELECT id, email, name, phone, user_type, status, created_at
      FROM users WHERE id = ?
    `).get(userId) as any;

    return NextResponse.json({
      message: 'User created successfully',
      user: newUser
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json({ 
      error: error?.message || 'Failed to create user' 
    }, { status: 500 });
  }
}
