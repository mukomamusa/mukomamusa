import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/database-schema';
import { verifyToken } from '@/app/lib/auth';

// PATCH - Update user status (suspend/activate/pending)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.user_type !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const userId = parseInt(id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const body = await request.json();
    const { status } = body;

    // Validate status
    const validStatuses = ['active', 'suspended', 'pending_verification'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: 'Invalid status. Must be one of: active, suspended, pending_verification' 
      }, { status: 400 });
    }

    // Check if user exists
    const user = db.prepare('SELECT id, user_type, email, name FROM users WHERE id = ?').get(userId) as any;
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent admins from suspending themselves
    if (user.id === decoded.id) {
      return NextResponse.json({ error: 'Cannot modify your own account status' }, { status: 400 });
    }

    // Prevent suspending other admins (optional safety measure)
    if (user.user_type === 'admin' && status === 'suspended') {
      return NextResponse.json({ error: 'Cannot suspend admin accounts' }, { status: 400 });
    }

    // Update user status
    db.prepare(`
      UPDATE users 
      SET status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(status, userId);

    // Get updated user
    const updatedUser = db.prepare(`
      SELECT id, email, name, phone, user_type, status, created_at
      FROM users WHERE id = ?
    `).get(userId) as any;

    return NextResponse.json({
      success: true,
      message: `User ${status === 'suspended' ? 'suspended' : status === 'active' ? 'activated' : 'set to pending verification'} successfully`,
      user: updatedUser
    });

  } catch (error) {
    console.error('Error updating user status:', error);
    return NextResponse.json(
      { error: 'Failed to update user status' },
      { status: 500 }
    );
  }
}
