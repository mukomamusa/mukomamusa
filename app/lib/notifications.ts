// Multi-Channel Notification Engine
// Supports: SMS (Africa's Talking), Push (FCM), In-App, WhatsApp, Email
// Designed for Zambia's mobile landscape with fallback chains

import db from './database-tracking';
import {
  getNotificationMessage,
  getAllChannelMessages,
  generateTrackingURL,
  type NotificationEvent,
  type TemplateData,
  type Language,
} from './notification-templates';

// ============================================================
// TYPES & CONFIGURATION
// ============================================================

export type NotificationChannel = 'sms' | 'push' | 'whatsapp' | 'email' | 'in_app' | 'ussd';

export interface NotificationResult {
  channel: NotificationChannel;
  status: 'sent' | 'failed' | 'skipped';
  provider?: string;
  provider_message_id?: string;
  cost?: number;
  error?: string;
}

export interface NotificationRecipient {
  user_id: number;
  name: string;
  phone?: string;
  email?: string;
  booking_id?: number;
  booking_reference?: string;
  seat_numbers?: string;
}

// SMS Provider Configuration
const SMS_CONFIG = {
  provider: process.env.SMS_PROVIDER || 'africastalking',
  africastalking: {
    api_key: process.env.AT_API_KEY || '',
    username: process.env.AT_USERNAME || 'sandbox',
    sender_id: process.env.AT_SENDER_ID || 'CityToCity',
    base_url: process.env.AT_BASE_URL || 'https://api.africastalking.com/version1/messaging',
    cost_per_sms_zmw: 0.11,
  },
};

// Push Notification Configuration (Firebase Cloud Messaging)
const PUSH_CONFIG = {
  fcm_server_key: process.env.FCM_SERVER_KEY || '',
  fcm_url: 'https://fcm.googleapis.com/fcm/send',
};

// WhatsApp Configuration
const WHATSAPP_CONFIG = {
  api_url: process.env.WHATSAPP_API_URL || '',
  api_token: process.env.WHATSAPP_API_TOKEN || '',
  phone_number_id: process.env.WHATSAPP_PHONE_ID || '',
};

// ============================================================
// NOTIFICATION PREFERENCES
// ============================================================

/**
 * Get notification preferences for a user
 */
export function getUserNotificationPreferences(userId: number): any {
  try {
    let prefs = db.prepare(`
      SELECT * FROM notification_preferences WHERE user_id = ?
    `).get(userId) as any;

    // Create default preferences if none exist
    if (!prefs) {
      db.prepare(`
        INSERT INTO notification_preferences (user_id, channel_sms, channel_push, notify_departure, notify_delay, notify_approaching, notify_arrived, notify_eta_change)
        VALUES (?, 1, 1, 1, 1, 1, 1, 1)
      `).run(userId);

      prefs = db.prepare(`
        SELECT * FROM notification_preferences WHERE user_id = ?
      `).get(userId);
    }

    return prefs;
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    return null;
  }
}

/**
 * Update notification preferences
 */
export function updateNotificationPreferences(userId: number, updates: {
  channel_sms?: boolean;
  channel_push?: boolean;
  channel_whatsapp?: boolean;
  channel_email?: boolean;
  notify_departure?: boolean;
  notify_delay?: boolean;
  notify_approaching?: boolean;
  notify_arrived?: boolean;
  notify_eta_change?: boolean;
  sms_phone?: string;
  whatsapp_phone?: string;
  preferred_language?: Language;
}): boolean {
  try {
    // Ensure preferences exist
    getUserNotificationPreferences(userId);

    const fields: string[] = [];
    const values: any[] = [];

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(typeof value === 'boolean' ? (value ? 1 : 0) : value);
      }
    }

    if (fields.length === 0) return true;

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(userId);

    db.prepare(`
      UPDATE notification_preferences SET ${fields.join(', ')} WHERE user_id = ?
    `).run(...values);

    return true;
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return false;
  }
}

// ============================================================
// CORE NOTIFICATION DISPATCHER
// ============================================================

/**
 * Send notification to a single recipient across their preferred channels
 * Implements fallback chain: Push → SMS → WhatsApp → Email
 */
export async function sendNotification(
  recipient: NotificationRecipient,
  event: NotificationEvent,
  templateData: TemplateData,
  tripId?: number,
  forceSMS: boolean = false
): Promise<NotificationResult[]> {
  const results: NotificationResult[] = [];

  try {
    // Get user preferences
    const prefs = getUserNotificationPreferences(recipient.user_id);
    if (!prefs) {
      return [{ channel: 'sms', status: 'failed', error: 'No notification preferences found' }];
    }

    // Check if user wants this type of notification
    if (!shouldSendNotification(prefs, event)) {
      return [{ channel: 'sms', status: 'skipped', error: 'User opted out of this notification type' }];
    }

    const language = (prefs.preferred_language as Language) || 'en';
    const messages = getAllChannelMessages(event, templateData, language);

    // Always send in-app notification
    const inAppResult = await sendInAppNotification(
      recipient.user_id,
      event,
      messages.push,
      messages.full,
      tripId,
      recipient.booking_id
    );
    results.push(inAppResult);

    // Channel priority: Push (free) → SMS (paid) → WhatsApp → Email
    let delivered = false;

    // 1. Push notification (free - try first)
    if (prefs.channel_push && !forceSMS) {
      const pushResult = await sendPushNotification(
        recipient.user_id,
        event,
        messages.push,
        { trip_id: tripId, booking_ref: recipient.booking_reference }
      );
      results.push(pushResult);
      if (pushResult.status === 'sent') delivered = true;

      // Log notification
      logNotification(tripId || null, recipient.booking_id || null, recipient.user_id,
        'push', event, '', messages.push, pushResult);
    }

    // 2. SMS (if push failed or user prefers SMS, or forced)
    if ((prefs.channel_sms && (!delivered || forceSMS)) || forceSMS) {
      const phone = prefs.sms_phone || recipient.phone;
      if (phone) {
        const smsResult = await sendSMS(phone, messages.sms);
        results.push(smsResult);
        if (smsResult.status === 'sent') delivered = true;

        logNotification(tripId || null, recipient.booking_id || null, recipient.user_id,
          'sms', event, phone, messages.sms, smsResult);
      }
    }

    // 3. WhatsApp (if enabled and previous channels failed)
    if (prefs.channel_whatsapp && !delivered) {
      const waPhone = prefs.whatsapp_phone || recipient.phone;
      if (waPhone) {
        const waResult = await sendWhatsApp(waPhone, messages.full);
        results.push(waResult);
        if (waResult.status === 'sent') delivered = true;

        logNotification(tripId || null, recipient.booking_id || null, recipient.user_id,
          'whatsapp', event, waPhone, messages.full, waResult);
      }
    }

    // 4. Email (lowest priority, for detailed notifications)
    if (prefs.channel_email && recipient.email) {
      const emailResult = await sendEmail(
        recipient.email,
        `Vayazed - ${formatEventName(event)}`,
        messages.full
      );
      results.push(emailResult);

      logNotification(tripId || null, recipient.booking_id || null, recipient.user_id,
        'email', event, recipient.email, messages.full, emailResult);
    }

  } catch (error) {
    console.error('Error sending notification:', error);
    results.push({ channel: 'sms', status: 'failed', error: String(error) });
  }

  return results;
}

/**
 * Send notification to all passengers on a trip
 */
export async function notifyTripPassengers(
  tripId: number,
  event: NotificationEvent,
  extraData?: Partial<TemplateData>
): Promise<{ total: number; sent: number; failed: number }> {
  const stats = { total: 0, sent: 0, failed: 0 };

  try {
    // Get trip details
    const trip = db.prepare(`
      SELECT t.*, r.origin, r.destination, r.price, r.date,
        b.bus_name, b.bus_number, u.company_name
      FROM trips t
      JOIN routes r ON t.route_id = r.id
      JOIN buses b ON t.bus_id = b.id
      JOIN users u ON b.company_id = u.id
      WHERE t.id = ?
    `).get(tripId) as any;

    if (!trip) return stats;

    // Get all passengers with bookings for this route
    const passengers = db.prepare(`
      SELECT 
        bk.id as booking_id,
        bk.booking_reference,
        bk.seat_numbers,
        bk.customer_id as user_id,
        u.name,
        u.phone,
        u.email
      FROM bookings bk
      JOIN users u ON bk.customer_id = u.id
      WHERE bk.route_id = ? AND bk.status = 'confirmed'
    `).all(trip.route_id) as any[];

    stats.total = passengers.length;

    // Format ETA time
    const etaFormatted = trip.current_eta
      ? new Date(trip.current_eta).toLocaleTimeString('en-ZM', { hour: '2-digit', minute: '2-digit' })
      : trip.scheduled_arrival?.split('T')[1]?.substring(0, 5) || 'TBD';

    // Generate tracking URL base
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://citytocity.zm';

    for (const passenger of passengers) {
      const templateData: TemplateData = {
        passenger_name: passenger.name,
        booking_reference: passenger.booking_reference,
        bus_name: trip.bus_name,
        bus_number: trip.bus_number,
        company_name: trip.company_name,
        origin: trip.origin,
        destination: trip.destination,
        departure_time: trip.scheduled_departure?.split('T')[1]?.substring(0, 5) || '',
        arrival_time: trip.scheduled_arrival?.split('T')[1]?.substring(0, 5) || '',
        eta: etaFormatted,
        delay_minutes: trip.delay_minutes || 0,
        delay_reason: trip.delay_reason || undefined,
        next_stop: trip.next_stop || undefined,
        distance_remaining_km: extraData?.distance_remaining_km,
        tracking_url: generateTrackingURL(passenger.booking_reference, baseUrl),
        date: trip.date || trip.scheduled_departure?.split('T')[0],
        seat_numbers: passenger.seat_numbers,
        ...extraData,
      };

      const results = await sendNotification(
        {
          user_id: passenger.user_id,
          name: passenger.name,
          phone: passenger.phone,
          email: passenger.email,
          booking_id: passenger.booking_id,
          booking_reference: passenger.booking_reference,
          seat_numbers: passenger.seat_numbers,
        },
        event,
        templateData,
        tripId
      );

      const anySent = results.some(r => r.status === 'sent');
      if (anySent) stats.sent++;
      else stats.failed++;
    }
  } catch (error) {
    console.error('Error notifying trip passengers:', error);
  }

  return stats;
}

// ============================================================
// CHANNEL IMPLEMENTATIONS
// ============================================================

/**
 * Send SMS via Africa's Talking
 */
async function sendSMS(phone: string, message: string): Promise<NotificationResult> {
  try {
    // Format Zambian phone number
    const formattedPhone = formatZambianPhone(phone);

    // Truncate to SMS limit (160 chars for single SMS, 306 for concatenated)
    const truncatedMessage = message.length > 306 ? message.substring(0, 303) + '...' : message;

    if (!SMS_CONFIG.africastalking.api_key) {
      // Development mode — log instead of sending
      console.log(`[SMS DEV] To: ${formattedPhone} | Message: ${truncatedMessage}`);
      return {
        channel: 'sms',
        status: 'sent',
        provider: 'africastalking_dev',
        cost: SMS_CONFIG.africastalking.cost_per_sms_zmw,
      };
    }

    const response = await fetch(SMS_CONFIG.africastalking.base_url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'apiKey': SMS_CONFIG.africastalking.api_key,
      },
      body: new URLSearchParams({
        username: SMS_CONFIG.africastalking.username,
        to: formattedPhone,
        message: truncatedMessage,
        from: SMS_CONFIG.africastalking.sender_id,
      }),
    });

    const data = await response.json();

    if (data.SMSMessageData?.Recipients?.[0]?.status === 'Success') {
      return {
        channel: 'sms',
        status: 'sent',
        provider: 'africastalking',
        provider_message_id: data.SMSMessageData.Recipients[0].messageId,
        cost: SMS_CONFIG.africastalking.cost_per_sms_zmw,
      };
    }

    return {
      channel: 'sms',
      status: 'failed',
      provider: 'africastalking',
      error: data.SMSMessageData?.Recipients?.[0]?.status || 'Unknown error',
    };
  } catch (error) {
    console.error('SMS send error:', error);
    return {
      channel: 'sms',
      status: 'failed',
      provider: 'africastalking',
      error: String(error),
    };
  }
}

/**
 * Send Push Notification via Firebase Cloud Messaging
 */
async function sendPushNotification(
  userId: number,
  event: NotificationEvent,
  message: string,
  data?: Record<string, any>
): Promise<NotificationResult> {
  try {
    // In production: look up user's FCM token from database
    // For now, log in development mode
    if (!PUSH_CONFIG.fcm_server_key) {
      console.log(`[PUSH DEV] To user ${userId} | ${message}`);
      return {
        channel: 'push',
        status: 'sent',
        provider: 'fcm_dev',
        cost: 0,
      };
    }

    // Get user's FCM token (would be stored in a user_devices table)
    // const fcmToken = getUserFCMToken(userId);
    // if (!fcmToken) return { channel: 'push', status: 'skipped', error: 'No FCM token' };

    const response = await fetch(PUSH_CONFIG.fcm_url, {
      method: 'POST',
      headers: {
        'Authorization': `key=${PUSH_CONFIG.fcm_server_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // to: fcmToken,
        notification: {
          title: 'Vayazed',
          body: message,
          icon: '/icons/bus-icon.png',
          click_action: data?.booking_ref ? `/customer/track/${data.booking_ref}` : '/customer/dashboard',
        },
        data: {
          event_type: event,
          ...data,
        },
      }),
    });

    if (response.ok) {
      const result = await response.json();
      return {
        channel: 'push',
        status: 'sent',
        provider: 'fcm',
        provider_message_id: result.message_id,
        cost: 0,
      };
    }

    return { channel: 'push', status: 'failed', provider: 'fcm', error: `HTTP ${response.status}` };
  } catch (error) {
    console.error('Push notification error:', error);
    return { channel: 'push', status: 'failed', provider: 'fcm', error: String(error) };
  }
}

/**
 * Send WhatsApp message via WhatsApp Business API
 */
async function sendWhatsApp(phone: string, message: string): Promise<NotificationResult> {
  try {
    const formattedPhone = formatZambianPhone(phone).replace('+', '');

    if (!WHATSAPP_CONFIG.api_token) {
      console.log(`[WHATSAPP DEV] To: ${formattedPhone} | Message: ${message.substring(0, 100)}...`);
      return { channel: 'whatsapp', status: 'sent', provider: 'whatsapp_dev', cost: 0 };
    }

    const response = await fetch(
      `${WHATSAPP_CONFIG.api_url}/${WHATSAPP_CONFIG.phone_number_id}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_CONFIG.api_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'text',
          text: { body: message },
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      return {
        channel: 'whatsapp',
        status: 'sent',
        provider: 'whatsapp_business',
        provider_message_id: data.messages?.[0]?.id,
        cost: 0,
      };
    }

    return { channel: 'whatsapp', status: 'failed', provider: 'whatsapp_business', error: `HTTP ${response.status}` };
  } catch (error) {
    return { channel: 'whatsapp', status: 'failed', provider: 'whatsapp_business', error: String(error) };
  }
}

/**
 * Send Email notification
 */
async function sendEmail(to: string, subject: string, body: string): Promise<NotificationResult> {
  try {
    // In production: integrate with email provider (SendGrid, Mailgun, etc.)
    console.log(`[EMAIL DEV] To: ${to} | Subject: ${subject}`);
    return { channel: 'email', status: 'sent', provider: 'email_dev', cost: 0 };
  } catch (error) {
    return { channel: 'email', status: 'failed', error: String(error) };
  }
}

/**
 * Store in-app notification
 */
async function sendInAppNotification(
  userId: number,
  event: NotificationEvent,
  shortMessage: string,
  fullMessage: string,
  tripId?: number,
  bookingId?: number
): Promise<NotificationResult> {
  try {
    logNotification(
      tripId || null,
      bookingId || null,
      userId,
      'in_app',
      event,
      `user:${userId}`,
      fullMessage,
      { channel: 'in_app', status: 'sent' }
    );

    return { channel: 'in_app', status: 'sent', provider: 'internal', cost: 0 };
  } catch (error) {
    return { channel: 'in_app', status: 'failed', error: String(error) };
  }
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Check if a notification should be sent based on user preferences
 */
function shouldSendNotification(prefs: any, event: NotificationEvent): boolean {
  const eventPreferenceMap: Record<string, string> = {
    'trip_started': 'notify_departure',
    'departure_reminder': 'notify_departure',
    'boarding_open': 'notify_departure',
    'bus_departed': 'notify_departure',
    'delay_alert': 'notify_delay',
    'eta_update': 'notify_eta_change',
    'approaching_destination': 'notify_approaching',
    'arrived': 'notify_arrived',
    'trip_completed': 'notify_arrived',
    'trip_cancelled': 'notify_departure', // Always send cancellations
    'schedule_change': 'notify_departure', // Always send schedule changes
    'general': 'notify_departure',
  };

  const prefKey = eventPreferenceMap[event];
  if (!prefKey) return true; // Default to sending

  // Always send cancellations and schedule changes
  if (['trip_cancelled', 'schedule_change'].includes(event)) return true;

  return prefs[prefKey] === 1 || prefs[prefKey] === true;
}

/**
 * Format Zambian phone number to international format
 * Handles: 0977123456, +260977123456, 260977123456, 977123456
 */
function formatZambianPhone(phone: string): string {
  // Remove spaces, dashes, and parentheses
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');

  // Remove leading + if present
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  // If starts with 0, replace with 260
  if (cleaned.startsWith('0')) {
    cleaned = '260' + cleaned.substring(1);
  }

  // If doesn't start with 260, add it
  if (!cleaned.startsWith('260')) {
    cleaned = '260' + cleaned;
  }

  return '+' + cleaned;
}

/**
 * Format event name for display
 */
function formatEventName(event: NotificationEvent): string {
  const names: Record<NotificationEvent, string> = {
    'trip_started': 'Trip Started',
    'departure_reminder': 'Departure Reminder',
    'boarding_open': 'Boarding Open',
    'bus_departed': 'Bus Departed',
    'delay_alert': 'Delay Alert',
    'eta_update': 'ETA Update',
    'approaching_destination': 'Approaching Destination',
    'arrived': 'Arrived',
    'trip_completed': 'Trip Completed',
    'trip_cancelled': 'Trip Cancelled',
    'schedule_change': 'Schedule Change',
    'general': 'Notification',
  };
  return names[event] || 'Notification';
}

/**
 * Log notification to database
 */
function logNotification(
  tripId: number | null,
  bookingId: number | null,
  userId: number,
  channel: NotificationChannel,
  event: NotificationEvent,
  recipient: string,
  message: string,
  result: NotificationResult
): void {
  try {
    db.prepare(`
      INSERT INTO notification_log (
        trip_id, booking_id, user_id, channel, event_type,
        recipient, message, status, provider, provider_message_id,
        cost, error_message, sent_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      tripId,
      bookingId,
      userId,
      channel,
      event,
      recipient,
      message,
      result.status,
      result.provider || null,
      result.provider_message_id || null,
      result.cost || 0,
      result.error || null,
      result.status === 'sent' ? new Date().toISOString() : null
    );
  } catch (error) {
    console.error('Error logging notification:', error);
  }
}

/**
 * Get notification history for a user
 */
export function getUserNotifications(userId: number, limit: number = 50): any[] {
  try {
    return db.prepare(`
      SELECT * FROM notification_log
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(userId, limit);
  } catch (error) {
    console.error('Error getting user notifications:', error);
    return [];
  }
}

/**
 * Get notification stats for a trip
 */
export function getTripNotificationStats(tripId: number): {
  total: number;
  sent: number;
  failed: number;
  cost_zmw: number;
  by_channel: Record<string, number>;
} {
  try {
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'sent' OR status = 'delivered' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(COALESCE(cost, 0)) as total_cost
      FROM notification_log
      WHERE trip_id = ?
    `).get(tripId) as any;

    const byChannel = db.prepare(`
      SELECT channel, COUNT(*) as count
      FROM notification_log
      WHERE trip_id = ?
      GROUP BY channel
    `).all(tripId) as any[];

    const channelMap: Record<string, number> = {};
    byChannel.forEach((row: any) => { channelMap[row.channel] = row.count; });

    return {
      total: stats?.total || 0,
      sent: stats?.sent || 0,
      failed: stats?.failed || 0,
      cost_zmw: stats?.total_cost || 0,
      by_channel: channelMap,
    };
  } catch (error) {
    console.error('Error getting trip notification stats:', error);
    return { total: 0, sent: 0, failed: 0, cost_zmw: 0, by_channel: {} };
  }
}