// app/api/reviews/[id]/response/route.ts - DEBUG VERSION
import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/database-schema';
import { verifyToken } from '@/app/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('=== DEBUG: Response API Called ===');
    
    const { id } = await params;
    console.log('Review ID from params:', id);
    
    const reviewId = parseInt(id);
    const body = await request.json();
    console.log('Request body:', body);
    
    const { response_text } = body;

    // Check token
    const authHeader = request.headers.get('authorization');
    console.log('Auth header:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Token extracted:', token ? 'Present' : 'Missing');

    // Verify token using your function
    const decoded = verifyToken(token);
    console.log('Decoded token result:', decoded);

    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Type assertion
    const user = decoded as { id: number; user_type: string; email: string };
    console.log('User from token:', user);

    // Get review
    const review = db
      .prepare('SELECT * FROM reviews WHERE id = ?')
      .get(reviewId) as any;
    
    console.log('Found review:', review);

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Check ownership
    console.log('Company ID from review:', review.company_id);
    console.log('User ID from token:', user.id);

    if (review.company_id !== user.id) {
      return NextResponse.json(
        { error: 'Not your review' },
        { status: 403 }
      );
    }

    // Check user type
    console.log('User type from token:', user.user_type);
    if (user.user_type !== 'company') {
      return NextResponse.json(
        { error: 'Not a company account' },
        { status: 403 }
      );
    }

    // Check status
    console.log('Review status:', review.status);
    if (review.status !== 'approved') {
      return NextResponse.json(
        { error: 'Review not approved' },
        { status: 400 }
      );
    }

    // Update
    const stmt = db.prepare(`
      UPDATE reviews 
      SET company_response = ?, 
          responded_at = CURRENT_TIMESTAMP
      WHERE id = ? AND company_id = ?
    `);
    
    stmt.run(response_text, reviewId, user.id);

    return NextResponse.json({
      success: true,
      message: 'Response added successfully'
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}