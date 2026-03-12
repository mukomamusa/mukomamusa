// app/api/notifications/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/app/lib/auth';
import db from '@/app/lib/database-schema';

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

    // Get user settings
    const settings = db.prepare(`
      SELECT * FROM notification_settings WHERE user_id = ?
    `).get(decoded.id) as any;

    if (!settings) {
      // Create default settings
      db.prepare(`
        INSERT INTO notification_settings (user_id)
        VALUES (?)
      `).run(decoded.id);
      
      return NextResponse.json({
        trip_reminders: true,
        booking_updates: true,
        promotions: false,
        reminder_hours: 24
      });
    }

    return NextResponse.json({
      trip_reminders: Boolean(settings.trip_reminders),
      booking_updates: Boolean(settings.booking_updates),
      promotions: Boolean(settings.promotions),
      reminder_hours: settings.reminder_hours
    });
  } catch (error) {
    console.error('Error getting notification settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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
    const { trip_reminders, booking_updates, promotions, reminder_hours } = body;

    // Update settings
    db.prepare(`
      UPDATE notification_settings 
      SET trip_reminders = ?, booking_updates = ?, promotions = ?, reminder_hours = ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(
      trip_reminders ? 1 : 0,
      booking_updates ? 1 : 0,
      promotions ? 1 : 0,
      reminder_hours || 24,
      decoded.id
    );

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}