// app/lib/push-notifications.ts
import webpush from 'web-push';
import db from '@/app/lib/database-schema';

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:info@vayazed.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: {
    url?: string;
    bookingId?: number;
    [key: string]: any;
  };
  actions?: {
    action: string;
    title: string;
    icon?: string;
  }[];
  tag?: string;
}

// Database functions
export async function addSubscription(
  userId: number,
  subscription: PushSubscription,
  userAgent?: string
): Promise<boolean> {
  try {
    // Check if subscription already exists
    const existing = db.prepare(`
      SELECT id FROM push_subscriptions 
      WHERE user_id = ? AND endpoint = ?
    `).get(userId, subscription.endpoint);

    if (existing) {
      // Update existing subscription
      db.prepare(`
        UPDATE push_subscriptions 
        SET p256dh = ?, auth = ?, user_agent = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND endpoint = ?
      `).run(
        subscription.keys.p256dh,
        subscription.keys.auth,
        userAgent || null,
        userId,
        subscription.endpoint
      );
    } else {
      // Insert new subscription
      db.prepare(`
        INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        userId,
        subscription.endpoint,
        subscription.keys.p256dh,
        subscription.keys.auth,
        userAgent || null
      );
    }

    console.log(`✅ Subscription saved for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error saving subscription:', error);
    return false;
  }
}

export async function removeSubscription(userId: number, endpoint: string): Promise<boolean> {
  try {
    db.prepare(`
      DELETE FROM push_subscriptions 
      WHERE user_id = ? AND endpoint = ?
    `).run(userId, endpoint);
    
    console.log(`🗑️ Subscription removed for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error removing subscription:', error);
    return false;
  }
}

export async function getUserSubscriptions(userId: number): Promise<PushSubscription[]> {
  try {
    const rows = db.prepare(`
      SELECT endpoint, p256dh, auth 
      FROM push_subscriptions 
      WHERE user_id = ?
    `).all(userId) as any[];

    return rows.map(row => ({
      endpoint: row.endpoint,
      keys: {
        p256dh: row.p256dh,
        auth: row.auth
      }
    }));
  } catch (error) {
    console.error('Error getting subscriptions:', error);
    return [];
  }
}

export async function getUserNotificationSettings(userId: number): Promise<any> {
  try {
    const settings = db.prepare(`
      SELECT * FROM notification_settings WHERE user_id = ?
    `).get(userId);
    
    return settings || {
      trip_reminders: 1,
      booking_updates: 1,
      promotions: 0,
      reminder_hours: 24
    };
  } catch (error) {
    console.error('Error getting notification settings:', error);
    return {
      trip_reminders: 1,
      booking_updates: 1,
      promotions: 0,
      reminder_hours: 24
    };
  }
}

export async function logNotification(
  userId: number,
  type: string,
  title: string,
  message: string,
  data?: any,
  sentVia: string = 'push'  // Default to 'push', but can be overridden
): Promise<void> {
  try {
    // Validate type against allowed values
    const allowedTypes = [
      'booking_confirmed',
      'booking_cancelled',
      'payment_received',
      'trip_reminder',
      'trip_delayed',
      'trip_cancelled',
      'refund_processed',
      'boarding',
      'test'
    ];
    
    if (!allowedTypes.includes(type)) {
      console.warn(`⚠️ Notification type "${type}" not in allowed list, using "trip_reminder" as fallback`);
      type = 'trip_reminder';
    }

    // Validate sent_via
    const allowedChannels = [
      'app', 'sms', 'email', 'push', 'whatsapp', 
      'telegram', 'messenger', 'signal', 'slack', 'webhook'
    ];
    
    if (!allowedChannels.includes(sentVia)) {
      console.warn(`⚠️ Notification channel "${sentVia}" not recognized, using "push" as fallback`);
      sentVia = 'push';
    }

    const now = new Date().toISOString();
    
    db.prepare(`
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        data,
        sent_via,
        created_at,
        sent_at,
        delivered,
        read
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      type,
      title,
      message,
      data ? JSON.stringify(data) : null,
      sentVia,
      now,  // created_at
      now,  // sent_at (same as created_at for immediate sends)
      1,    // delivered (assuming success)
      0     // read (false by default)
    );
    
    console.log(`📝 Notification logged for user ${userId} (type: ${type}, via: ${sentVia})`);
  } catch (error) {
    console.error('Error logging notification:', error);
  }
}
export async function sendNotification(
  userId: number,
  payload: NotificationPayload,
  type: string = 'general'
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Check user settings
    const settings = await getUserNotificationSettings(userId);
    
    // Determine if this notification type is allowed
    if (
      (type === 'trip_reminder' && !settings.trip_reminders) ||
      (type === 'booking_update' && !settings.booking_updates) ||
      (type === 'promotion' && !settings.promotions)
    ) {
      console.log(`ℹ️ User ${userId} has disabled ${type} notifications`);
      return { success: false, error: 'Notification type disabled' };
    }

    const subscriptions = await getUserSubscriptions(userId);
    if (subscriptions.length === 0) {
      console.log(`ℹ️ No subscriptions for user ${userId}`);
      return { success: false, error: 'No subscriptions' };
    }

    let success = false;
    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(
          subscription,
          JSON.stringify(payload)
        );
        success = true;
      } catch (error: any) {
        console.error('Error sending push notification:', error);
        
        // Remove invalid subscriptions
        if (error.statusCode === 410) {
          await removeSubscription(userId, subscription.endpoint);
        }
      }
    }

    // Log notification
    await logNotification(userId, type, payload.title, payload.body, payload.data);

    console.log(`📨 Notification sent to user ${userId}`);
    return { success };
  } catch (error) {
    console.error('Error in sendNotification:', error);
    return { success: false, error: String(error) };
  }
}

export async function sendBulkNotification(
  userIds: number[],
  payload: NotificationPayload,
  type: string = 'general'
): Promise<{
  total: number;
  success: number;
  failed: number;
  results: { userId: number; success: boolean; error?: string }[];
}> {
  const results = [];
  let success = 0;
  let failed = 0;
  
  for (const userId of userIds) {
    const result = await sendNotification(userId, payload, type);
    if (result.success) {
      success++;
    } else {
      failed++;
    }
    results.push({ userId, ...result });
  }
  
  return { total: userIds.length, success, failed, results };
}

// Notification templates
export const NotificationTemplates = {
  bookingConfirmed: (bookingRef: string, route: string): NotificationPayload => ({
    title: '✅ Booking Confirmed!',
    body: `Your booking ${bookingRef} from ${route} is confirmed.`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: { url: '/customer/dashboard' },
    actions: [
      { action: 'view', title: 'View Booking' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    tag: 'booking-confirmed'
  }),

  tripReminder: (route: string, departureTime: string, hoursBefore: number): NotificationPayload => ({
    title: `🚌 Trip Reminder (${hoursBefore}h)`,
    body: `Your bus to ${route} departs at ${departureTime}.`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: { url: '/customer/dashboard' },
    actions: [
      { action: 'view', title: 'View Details' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    tag: 'trip-reminder'
  }),

  tripDelayed: (route: string, originalTime: string, newTime: string): NotificationPayload => ({
    title: '⏰ Trip Delayed',
    body: `Your bus to ${route} originally at ${originalTime} is now departing at ${newTime}.`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: { url: '/customer/dashboard' },
    tag: 'trip-delayed'
  }),

  paymentReceived: (bookingRef: string, amount: number): NotificationPayload => ({
    title: '💰 Payment Received',
    body: `Payment of K${amount} for booking ${bookingRef} has been received.`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: { url: '/customer/dashboard' },
    tag: 'payment-received'
  }),

  bookingCancelled: (bookingRef: string, refundAmount?: number): NotificationPayload => ({
    title: '❌ Booking Cancelled',
    body: refundAmount 
      ? `Booking ${bookingRef} cancelled. Refund of K${refundAmount} will be processed.`
      : `Booking ${bookingRef} cancelled.`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: { url: '/customer/dashboard' },
    tag: 'booking-cancelled'
  }),

  reviewReminder: (companyName: string, bookingRef: string): NotificationPayload => ({
    title: '⭐ Rate Your Trip',
    body: `How was your trip with ${companyName}? Leave a review for booking ${bookingRef}!`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: { url: `/customer/review/${bookingRef}` },
    actions: [
      { action: 'review', title: 'Write Review' },
      { action: 'later', title: 'Later' }
    ],
    tag: 'review-reminder'
  })
};