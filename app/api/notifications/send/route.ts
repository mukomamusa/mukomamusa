// app/api/notifications/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/app/lib/auth';
import { 
  sendNotification, 
  sendBulkNotification, 
  NotificationTemplates 
} from '@/app/lib/push-notifications';
import db from '@/app/lib/database-schema';

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for automated jobs
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      const token = authHeader?.replace('Bearer ', '');
      if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const decoded = verifyToken(token);
      if (!decoded || decoded.user_type !== 'admin') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }
    }

    const body = await request.json();
    const { type, userId, userIds, data } = body;

    let result;

    switch (type) {
      case 'trip-reminders':
        result = await sendTripReminders(data?.hoursBefore || 24);
        break;
      
      case 'booking-confirmed':
        if (!data?.userId || !data?.bookingRef || !data?.route) {
          return NextResponse.json(
            { error: 'Missing required data for booking confirmation' },
            { status: 400 }
          );
        }
        result = await sendNotification(
          data.userId,
          NotificationTemplates.bookingConfirmed(data.bookingRef, data.route),
          'booking_update'
        );
        break;
      
      case 'trip-delayed':
        if (!data?.userId || !data?.route || !data?.originalTime || !data?.newTime) {
          return NextResponse.json(
            { error: 'Missing required data for delay notification' },
            { status: 400 }
          );
        }
        result = await sendNotification(
          data.userId,
          NotificationTemplates.tripDelayed(data.route, data.originalTime, data.newTime),
          'trip_reminder'
        );
        break;
      
      case 'payment-received':
        if (!data?.userId || !data?.bookingRef || !data?.amount) {
          return NextResponse.json(
            { error: 'Missing required data for payment notification' },
            { status: 400 }
          );
        }
        result = await sendNotification(
          data.userId,
          NotificationTemplates.paymentReceived(data.bookingRef, data.amount),
          'booking_update'
        );
        break;
      
      case 'booking-cancelled':
        if (!data?.userId || !data?.bookingRef) {
          return NextResponse.json(
            { error: 'Missing required data for cancellation notification' },
            { status: 400 }
          );
        }
        result = await sendNotification(
          data.userId,
          NotificationTemplates.bookingCancelled(data.bookingRef, data.refundAmount),
          'booking_update'
        );
        break;
      
      case 'review-reminder':
        if (!data?.userId || !data?.companyName || !data?.bookingRef) {
          return NextResponse.json(
            { error: 'Missing required data for review reminder' },
            { status: 400 }
          );
        }
        result = await sendNotification(
          data.userId,
          NotificationTemplates.reviewReminder(data.companyName, data.bookingRef),
          'promotion'
        );
        break;
      
      case 'bulk':
        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
          return NextResponse.json(
            { error: 'User IDs array is required for bulk send' },
            { status: 400 }
          );
        }
        if (!data?.template || !data?.templateData) {
          return NextResponse.json(
            { error: 'Template and template data required for bulk send' },
            { status: 400 }
          );
        }
        
        // Use template
        const templateFn = NotificationTemplates[data.template as keyof typeof NotificationTemplates];
        if (!templateFn) {
          return NextResponse.json(
            { error: 'Invalid template' },
            { status: 400 }
          );
        }
        
        const payload = templateFn(...data.templateData);
        result = await sendBulkNotification(userIds, payload, data.notificationType || 'general');
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid notification type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      result
    });

  } catch (error) {
    console.error('Error sending notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// In app/api/notifications/send/route.ts, replace the sendTripReminders function:

async function sendTripReminders(hoursBefore: number = 24, targetDate?: string) {
  // Use provided target date or calculate tomorrow
  let dateStr: string;
  
  if (targetDate) {
    dateStr = targetDate;
    console.log(`📅 Using provided target date: ${dateStr}`);
  } else {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Format as YYYY-MM-DD
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    dateStr = `${year}-${month}-${day}`;
    console.log(`📅 Calculated tomorrow as: ${dateStr}`);
  }

  // First, let's debug what routes exist for this date
  const debugRoutes = db.prepare(`
    SELECT id, origin, destination, date 
    FROM routes 
    WHERE date = ?
  `).all(dateStr);
  
  console.log(`🗺️ Found ${debugRoutes.length} routes on ${dateStr}:`, debugRoutes);

  if (debugRoutes.length === 0) {
    console.log(`⚠️ No routes found on ${dateStr}. Check date format in database.`);
    
    // Let's check what dates actually exist
    const sampleDates = db.prepare(`
      SELECT DISTINCT date FROM routes ORDER BY date LIMIT 5
    `).all();
    console.log('📅 Sample dates in database:', sampleDates);
  }

  // Get all bookings for the target date
  const bookings = db.prepare(`
    SELECT 
      b.id,
      b.customer_id,
      b.booking_reference,
      r.origin,
      r.destination,
      r.departure_time,
      r.date,
      u.name as customer_name,
      u.email as customer_email
    FROM bookings b
    JOIN routes r ON b.route_id = r.id
    JOIN users u ON b.customer_id = u.id
    WHERE r.date = ? 
      AND b.status = 'confirmed'
      AND b.payment_status = 'paid'
  `).all(dateStr) as any[];

  console.log(`📅 Found ${bookings.length} bookings for ${dateStr}`);

  const results = [];
  for (const booking of bookings) {
    const route = `${booking.origin} → ${booking.destination}`;
    console.log(`📧 Sending reminder to ${booking.customer_name} for ${route}`);
    
    const result = await sendNotification(
      booking.customer_id,
      NotificationTemplates.tripReminder(route, booking.departure_time, hoursBefore),
      'trip_reminder'
    );
    results.push({
      userId: booking.customer_id,
      bookingRef: booking.booking_reference,
      ...result
    });
  }

  return {
    total: bookings.length,
    sent: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results,
    debug: {
      targetDate: dateStr,
      routesFound: debugRoutes.length
    }
  };
}