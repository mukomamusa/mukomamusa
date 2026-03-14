// app/api/company/drivers/[driverId]/audit-logs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/database-schema';
import { verifyToken } from '@/app/lib/auth';
import { AuditHelpers, Actor } from '@/app/lib/audit';

// Define a more specific type for company users
interface CompanyTokenPayload {
  id: number;
  email: string;
  user_type: string;
  name: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ driverId: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token) as CompanyTokenPayload | null;
    if (!decoded || decoded.user_type !== 'company') {
      return NextResponse.json({ error: 'Company access only' }, { status: 403 });
    }

    const { driverId } = await params;
    const driverIdNum = parseInt(driverId);

    if (isNaN(driverIdNum)) {
      return NextResponse.json(
        { error: 'Invalid driver ID' },
        { status: 400 }
      );
    }

    // Verify driver belongs to this company
    const driver = db.prepare(`
      SELECT id, name, email, company_id 
      FROM drivers 
      WHERE id = ? AND company_id = ?
    `).get(driverIdNum, decoded.id) as any;

    if (!driver) {
      return NextResponse.json(
        { error: 'Driver not found or does not belong to your company' },
        { status: 404 }
      );
    }

    // Get pagination parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    const filter = url.searchParams.get('filter') || 'all';

    // Query using driver_id column
    let query = `
      SELECT * FROM audit_logs 
      WHERE driver_id = ?
    `;
    
    const queryParams: any[] = [driverIdNum];
    
    if (filter !== 'all') {
      query += ` AND action_category = ?`;
      queryParams.push(filter);
    }
    
    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    queryParams.push(limit, offset);

    console.log('🔍 Executing query:', query, queryParams);
    const logs = db.prepare(query).all(...queryParams);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as count FROM audit_logs 
      WHERE driver_id = ?
    `;
    const countParams: any[] = [driverIdNum];
    
    if (filter !== 'all') {
      countQuery += ` AND action_category = ?`;
      countParams.push(filter);
    }
    
    const totalCount = db.prepare(countQuery).get(...countParams) as any;

    // ✅ FIXED: Now TypeScript knows decoded has name property
    const companyActor: Actor = {
      id: decoded.id,
      type: 'user',
      email: decoded.email,
      name: decoded.name || 'Company User'  // Fallback if name is missing
    };

    // Optional: Log this view action
    await AuditHelpers.userAction(
      { id: decoded.id, email: decoded.email, name: decoded.name || 'Company User' },
      'profile_updated',
      'admin',
      {
        entityType: 'driver',
        entityId: driverIdNum,
        metadata: {
          driver_name: driver.name,
          filter,
          page
        },
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined
      }
    ).catch(err => console.error('Failed to log audit:', err));

    return NextResponse.json({
      success: true,
      logs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil((totalCount?.count || 0) / limit),
        totalItems: totalCount?.count || 0,
        itemsPerPage: limit
      },
      filters: {
        current: filter,
        available: ['all', 'auth', 'profile', 'booking', 'route', 'payment']
      }
    });

  } catch (error) {
    console.error('Error fetching driver audit logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}