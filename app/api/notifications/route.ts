import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/database-schema';
import { verifyToken } from '@/app/lib/auth';

// GET notifications for user
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

    const searchParams = request.nextUrl.searchParams;
    const unreadOnly = searchParams.get('unread') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = `SELECT * FROM notifications WHERE user_id = ?`;
    if (unreadOnly) {
      query += ` AND read = 0`;
    }
    query += ` ORDER BY created_at DESC LIMIT ?`;

    const notifications = db.prepare(query).all(decoded.id, limit);

    // Get unread count
    const unreadCount = db.prepare(`
      SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0
    `).get(decoded.id) as any;

    return NextResponse.json({ 
      notifications,
      unread_count: unreadCount.count
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create notification (internal use / admin)
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Only admin or system can create notifications
    if (decoded.user_type !== 'admin') {
      return NextResponse.json({ error: 'Admin access only' }, { status: 403 });
    }

    const body = await request.json();
    const { user_id, type, title, message, sent_via } = body;

    if (!user_id || !type || !title || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const validTypes = [
      'booking_confirmed', 'booking_cancelled', 'payment_received',
      'trip_reminder', 'trip_delayed', 'trip_cancelled', 'refund_processed'
    ];

    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
    }

    const result = db.prepare(`
      INSERT INTO notifications (user_id, type, title, message, sent_via)
      VALUES (?, ?, ?, ?, ?)
    `).run(user_id, type, title, message, sent_via || 'app');

    return NextResponse.json({
      message: 'Notification created',
      notification_id: result.lastInsertRowid
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH mark notification as read
export async function PATCH(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { notification_id, mark_all_read } = body;

    if (mark_all_read) {
      db.prepare(`UPDATE notifications SET read = 1 WHERE user_id = ?`).run(decoded.id);
      return NextResponse.json({ message: 'All notifications marked as read' });
    }

    if (!notification_id) {
      return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
    }

    // Verify ownership
    const notification = db.prepare(`
      SELECT * FROM notifications WHERE id = ?
    `).get(notification_id) as any;

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    if (notification.user_id !== decoded.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    db.prepare(`UPDATE notifications SET read = 1 WHERE id = ?`).run(notification_id);

    return NextResponse.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE notification
export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const notificationId = searchParams.get('notification_id');
    const deleteAll = searchParams.get('delete_all') === 'true';

    if (deleteAll) {
      db.prepare(`DELETE FROM notifications WHERE user_id = ?`).run(decoded.id);
      return NextResponse.json({ message: 'All notifications deleted' });
    }

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID required' }, { status: 400 });
    }

    const notification = db.prepare(`
      SELECT * FROM notifications WHERE id = ?
    `).get(notificationId) as any;

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    if (notification.user_id !== decoded.id && decoded.user_type !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    db.prepare(`DELETE FROM notifications WHERE id = ?`).run(notificationId);

    return NextResponse.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to send notification (for internal use)
export function sendNotification(
  userId: number,
  type: string,
  title: string,
  message: string,
  sentVia: string = 'app'
) {
  try {
    db.prepare(`
      INSERT INTO notifications (user_id, type, title, message, sent_via)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, type, title, message, sentVia);
    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
}
