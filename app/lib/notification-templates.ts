// Notification Message Templates
// Supports English + Bemba + Nyanja for Zambian market
// All templates use simple language for SMS compatibility (160 char limit)

export type NotificationEvent =
  | 'trip_started'
  | 'departure_reminder'
  | 'boarding_open'
  | 'bus_departed'
  | 'delay_alert'
  | 'eta_update'
  | 'approaching_destination'
  | 'arrived'
  | 'trip_completed'
  | 'trip_cancelled'
  | 'schedule_change'
  | 'general';

export type Language = 'en' | 'bem' | 'nya' | 'ton' | 'loz';

export interface TemplateData {
  passenger_name?: string;
  booking_reference?: string;
  bus_name?: string;
  bus_number?: string;
  company_name?: string;
  origin?: string;
  destination?: string;
  departure_time?: string;
  arrival_time?: string;
  eta?: string;
  delay_minutes?: number;
  delay_reason?: string;
  next_stop?: string;
  distance_remaining_km?: number;
  tracking_url?: string;
  date?: string;
  seat_numbers?: string;
  new_departure_time?: string;
  cancellation_reason?: string;
}

// ============================================================
// ENGLISH TEMPLATES
// ============================================================

const englishTemplates: Record<NotificationEvent, (data: TemplateData) => { sms: string; push: string; full: string }> = {
  
  trip_started: (data) => ({
    sms: `City2City: Your bus ${data.bus_number} (${data.origin} to ${data.destination}) is now boarding. Departs at ${data.departure_time}. Ref: ${data.booking_reference}`,
    push: `🚌 Your bus is boarding! ${data.bus_number} departs at ${data.departure_time}`,
    full: `Dear ${data.passenger_name}, your bus ${data.bus_name} (${data.bus_number}) on the ${data.origin} to ${data.destination} route is now boarding at the station. Scheduled departure: ${data.departure_time}. Your seat: ${data.seat_numbers}. Booking ref: ${data.booking_reference}. Track your bus: ${data.tracking_url}`,
  }),

  departure_reminder: (data) => ({
    sms: `City2City: Reminder - Your bus ${data.bus_number} departs at ${data.departure_time} from ${data.origin} on ${data.date}. Seat: ${data.seat_numbers}. Ref: ${data.booking_reference}`,
    push: `⏰ Departure reminder: ${data.bus_number} leaves ${data.origin} at ${data.departure_time}`,
    full: `Dear ${data.passenger_name}, this is a reminder that your bus ${data.bus_name} (${data.bus_number}) departs from ${data.origin} at ${data.departure_time} on ${data.date}. Please arrive at the station at least 30 minutes before departure. Your seat: ${data.seat_numbers}. Booking ref: ${data.booking_reference}.`,
  }),

  boarding_open: (data) => ({
    sms: `City2City: Boarding is now open for ${data.bus_number} (${data.origin} to ${data.destination}). Please proceed to the bus. Ref: ${data.booking_reference}`,
    push: `🎫 Boarding open! Proceed to bus ${data.bus_number}`,
    full: `Dear ${data.passenger_name}, boarding is now open for your bus ${data.bus_name} (${data.bus_number}) heading to ${data.destination}. Please present your booking reference ${data.booking_reference} at the gate. Seat: ${data.seat_numbers}.`,
  }),

  bus_departed: (data) => ({
    sms: `City2City: Bus ${data.bus_number} has departed ${data.origin}. ETA at ${data.destination}: ${data.eta}. Track: ${data.tracking_url}`,
    push: `🚌 Bus departed! ${data.bus_number} is on its way. ETA: ${data.eta}`,
    full: `Dear ${data.passenger_name}, your bus ${data.bus_name} (${data.bus_number}) has departed from ${data.origin}. Estimated arrival at ${data.destination}: ${data.eta}. Track your bus live: ${data.tracking_url}`,
  }),

  delay_alert: (data) => ({
    sms: `City2City: Bus ${data.bus_number} is delayed by ${data.delay_minutes} min. New ETA at ${data.destination}: ${data.eta}. ${data.delay_reason || ''}`,
    push: `⚠️ Delay alert: ${data.bus_number} delayed ${data.delay_minutes} min. New ETA: ${data.eta}`,
    full: `Dear ${data.passenger_name}, we regret to inform you that bus ${data.bus_name} (${data.bus_number}) is experiencing a delay of approximately ${data.delay_minutes} minutes. ${data.delay_reason ? `Reason: ${data.delay_reason}.` : ''} Updated ETA at ${data.destination}: ${data.eta}. Track: ${data.tracking_url}`,
  }),

  eta_update: (data) => ({
    sms: `City2City: Updated ETA for ${data.bus_number} at ${data.destination}: ${data.eta}. ${data.distance_remaining_km}km remaining.`,
    push: `📍 ETA update: Arriving ${data.destination} at ${data.eta} (${data.distance_remaining_km}km left)`,
    full: `Dear ${data.passenger_name}, updated arrival information for bus ${data.bus_name} (${data.bus_number}): ETA at ${data.destination} is ${data.eta}. Distance remaining: ${data.distance_remaining_km}km. Next stop: ${data.next_stop || 'N/A'}. Track: ${data.tracking_url}`,
  }),

  approaching_destination: (data) => ({
    sms: `City2City: Bus ${data.bus_number} is approaching ${data.destination}! ${data.distance_remaining_km}km away. ETA: ${data.eta}. Please prepare to alight.`,
    push: `📍 Almost there! ${data.distance_remaining_km}km to ${data.destination}. Prepare to alight.`,
    full: `Dear ${data.passenger_name}, your bus ${data.bus_name} (${data.bus_number}) is now approaching ${data.destination}, approximately ${data.distance_remaining_km}km away. Estimated arrival: ${data.eta}. Please gather your belongings and prepare to alight.`,
  }),

  arrived: (data) => ({
    sms: `City2City: Bus ${data.bus_number} has arrived at ${data.destination}! Thank you for travelling with ${data.company_name}. Ref: ${data.booking_reference}`,
    push: `✅ Arrived! Bus ${data.bus_number} is at ${data.destination}. Safe travels!`,
    full: `Dear ${data.passenger_name}, your bus ${data.bus_name} (${data.bus_number}) has arrived at ${data.destination}. Thank you for travelling with ${data.company_name} via Vayazed. We hope you had a pleasant journey. Booking ref: ${data.booking_reference}.`,
  }),

  trip_completed: (data) => ({
    sms: `City2City: Trip complete! ${data.origin} to ${data.destination} on ${data.bus_number}. Thank you for choosing Vayazed!`,
    push: `🎉 Trip complete! Thank you for travelling with Vayazed.`,
    full: `Dear ${data.passenger_name}, your trip from ${data.origin} to ${data.destination} on ${data.bus_name} (${data.bus_number}) is now complete. Thank you for choosing Vayazed. We look forward to serving you again!`,
  }),

  trip_cancelled: (data) => ({
    sms: `City2City: IMPORTANT - Bus ${data.bus_number} (${data.origin} to ${data.destination}) on ${data.date} has been CANCELLED. ${data.cancellation_reason || 'Contact support for refund.'}`,
    push: `❌ Trip cancelled: ${data.bus_number} on ${data.date}. Check app for details.`,
    full: `Dear ${data.passenger_name}, we regret to inform you that bus ${data.bus_name} (${data.bus_number}) from ${data.origin} to ${data.destination} scheduled for ${data.date} has been cancelled. ${data.cancellation_reason ? `Reason: ${data.cancellation_reason}.` : ''} Your booking ${data.booking_reference} is eligible for a full refund. Please contact support at support@citytocity.zm or call +260977000000.`,
  }),

  schedule_change: (data) => ({
    sms: `City2City: Schedule change - Bus ${data.bus_number} on ${data.date} now departs at ${data.new_departure_time} (was ${data.departure_time}). Ref: ${data.booking_reference}`,
    push: `🔄 Schedule change: ${data.bus_number} now departs at ${data.new_departure_time}`,
    full: `Dear ${data.passenger_name}, please note a schedule change for your bus ${data.bus_name} (${data.bus_number}) on ${data.date}. New departure time: ${data.new_departure_time} (previously ${data.departure_time}). All other details remain the same. Booking ref: ${data.booking_reference}.`,
  }),

  general: (data) => ({
    sms: `City2City: ${data.booking_reference ? `Ref ${data.booking_reference} - ` : ''}Important update regarding your trip.`,
    push: `ℹ️ Vayazed: You have a new notification`,
    full: `Dear ${data.passenger_name}, you have an important update regarding your booking. Please check the Vayazed app for details.`,
  }),
};

// ============================================================
// BEMBA TEMPLATES (Northern/Copperbelt Zambia)
// ============================================================

const bembaTemplates: Record<NotificationEvent, (data: TemplateData) => { sms: string; push: string; full: string }> = {
  
  trip_started: (data) => ({
    sms: `City2City: Basi ${data.bus_number} (${data.origin} ku ${data.destination}) yatendeka ukwingisha abantu. Ikafuma pa ${data.departure_time}. Ref: ${data.booking_reference}`,
    push: `🚌 Basi yenu yatendeka! ${data.bus_number} ikafuma pa ${data.departure_time}`,
    full: englishTemplates.trip_started(data).full,
  }),

  departure_reminder: (data) => ({
    sms: `City2City: Icibukisho - Basi ${data.bus_number} ikafuma pa ${data.departure_time} ukufuma ku ${data.origin} pa ${data.date}. Ref: ${data.booking_reference}`,
    push: `⏰ Icibukisho: ${data.bus_number} ikafuma ku ${data.origin} pa ${data.departure_time}`,
    full: englishTemplates.departure_reminder(data).full,
  }),

  boarding_open: (data) => ({
    sms: `City2City: Ingisheni mu basi ${data.bus_number} (${data.origin} ku ${data.destination}). Iseni ku basi. Ref: ${data.booking_reference}`,
    push: `🎫 Ingisheni! Iseni ku basi ${data.bus_number}`,
    full: englishTemplates.boarding_open(data).full,
  }),

  bus_departed: (data) => ({
    sms: `City2City: Basi ${data.bus_number} yafuma ku ${data.origin}. Ikafika ku ${data.destination}: ${data.eta}. Track: ${data.tracking_url}`,
    push: `🚌 Basi yafuma! ${data.bus_number} ili mu musebo. ETA: ${data.eta}`,
    full: englishTemplates.bus_departed(data).full,
  }),

  delay_alert: (data) => ({
    sms: `City2City: Basi ${data.bus_number} yacedwa na minutes ${data.delay_minutes}. ETA ku ${data.destination}: ${data.eta}.`,
    push: `⚠️ Basi yacedwa: ${data.bus_number} yacedwa minutes ${data.delay_minutes}`,
    full: englishTemplates.delay_alert(data).full,
  }),

  eta_update: (data) => ({
    sms: `City2City: Basi ${data.bus_number} ikafika ku ${data.destination}: ${data.eta}. ${data.distance_remaining_km}km yashalako.`,
    push: `📍 ETA: Ukufika ku ${data.destination} pa ${data.eta}`,
    full: englishTemplates.eta_update(data).full,
  }),

  approaching_destination: (data) => ({
    sms: `City2City: Basi ${data.bus_number} yafika panono ku ${data.destination}! ${data.distance_remaining_km}km yashalako. Balilenipo.`,
    push: `📍 Mwafika panono! ${data.distance_remaining_km}km ku ${data.destination}`,
    full: englishTemplates.approaching_destination(data).full,
  }),

  arrived: (data) => ({
    sms: `City2City: Basi ${data.bus_number} yafika ku ${data.destination}! Natotela ukwendela na ${data.company_name}. Ref: ${data.booking_reference}`,
    push: `✅ Mwafika! Basi ${data.bus_number} ili ku ${data.destination}`,
    full: englishTemplates.arrived(data).full,
  }),

  trip_completed: (data) => ({
    sms: `City2City: Ulwendo lwapwa! ${data.origin} ku ${data.destination}. Natotela ukukonka Vayazed!`,
    push: `🎉 Ulwendo lwapwa! Natotela!`,
    full: englishTemplates.trip_completed(data).full,
  }),

  trip_cancelled: (data) => ({
    sms: `City2City: ICACINDAMA - Basi ${data.bus_number} (${data.origin} ku ${data.destination}) pa ${data.date} YAKANISHIWA. Belengeni support.`,
    push: `❌ Ulwendo lwakanishiwa: ${data.bus_number} pa ${data.date}`,
    full: englishTemplates.trip_cancelled(data).full,
  }),

  schedule_change: (data) => ({
    sms: `City2City: Ukwalula - Basi ${data.bus_number} pa ${data.date} nomba ikafuma pa ${data.new_departure_time}. Ref: ${data.booking_reference}`,
    push: `🔄 Ukwalula: ${data.bus_number} ikafuma pa ${data.new_departure_time}`,
    full: englishTemplates.schedule_change(data).full,
  }),

  general: (data) => ({
    sms: englishTemplates.general(data).sms,
    push: englishTemplates.general(data).push,
    full: englishTemplates.general(data).full,
  }),
};

// ============================================================
// NYANJA TEMPLATES (Lusaka/Eastern Zambia)
// ============================================================

const nyanjaTemplates: Record<NotificationEvent, (data: TemplateData) => { sms: string; push: string; full: string }> = {
  
  trip_started: (data) => ({
    sms: `City2City: Basi ${data.bus_number} (${data.origin} ku ${data.destination}) yayamba kulandila anthu. Ichoka pa ${data.departure_time}. Ref: ${data.booking_reference}`,
    push: `🚌 Basi yanu yayamba! ${data.bus_number} ichoka pa ${data.departure_time}`,
    full: englishTemplates.trip_started(data).full,
  }),

  departure_reminder: (data) => ({
    sms: `City2City: Kukumbukitsa - Basi ${data.bus_number} ichoka pa ${data.departure_time} kuchoka ku ${data.origin} pa ${data.date}. Ref: ${data.booking_reference}`,
    push: `⏰ Kukumbukitsa: ${data.bus_number} ichoka pa ${data.departure_time}`,
    full: englishTemplates.departure_reminder(data).full,
  }),

  boarding_open: (data) => ({
    sms: `City2City: Lowani mu basi ${data.bus_number} (${data.origin} ku ${data.destination}). Pitani ku basi. Ref: ${data.booking_reference}`,
    push: `🎫 Lowani! Pitani ku basi ${data.bus_number}`,
    full: englishTemplates.boarding_open(data).full,
  }),

  bus_departed: (data) => ({
    sms: `City2City: Basi ${data.bus_number} yachoka ku ${data.origin}. Ikafika ku ${data.destination}: ${data.eta}. Track: ${data.tracking_url}`,
    push: `🚌 Basi yachoka! ${data.bus_number} ili mu msewu. ETA: ${data.eta}`,
    full: englishTemplates.bus_departed(data).full,
  }),

  delay_alert: (data) => ({
    sms: `City2City: Basi ${data.bus_number} yachedwa ndi mphindi ${data.delay_minutes}. ETA ku ${data.destination}: ${data.eta}.`,
    push: `⚠️ Basi yachedwa: ${data.bus_number} mphindi ${data.delay_minutes}`,
    full: englishTemplates.delay_alert(data).full,
  }),

  eta_update: (data) => ({
    sms: `City2City: Basi ${data.bus_number} ikafika ku ${data.destination}: ${data.eta}. ${data.distance_remaining_km}km yasala.`,
    push: `📍 ETA: Kufika ku ${data.destination} pa ${data.eta}`,
    full: englishTemplates.eta_update(data).full,
  }),

  approaching_destination: (data) => ({
    sms: `City2City: Basi ${data.bus_number} yakufika ku ${data.destination}! ${data.distance_remaining_km}km yasala. Konzekerani.`,
    push: `📍 Mwafika pafupi! ${data.distance_remaining_km}km ku ${data.destination}`,
    full: englishTemplates.approaching_destination(data).full,
  }),

  arrived: (data) => ({
    sms: `City2City: Basi ${data.bus_number} yafika ku ${data.destination}! Zikomo kwayenda ndi ${data.company_name}. Ref: ${data.booking_reference}`,
    push: `✅ Mwafika! Basi ${data.bus_number} ili ku ${data.destination}`,
    full: englishTemplates.arrived(data).full,
  }),

  trip_completed: (data) => ({
    sms: `City2City: Ulendo watha! ${data.origin} ku ${data.destination}. Zikomo kusankha Vayazed!`,
    push: `🎉 Ulendo watha! Zikomo!`,
    full: englishTemplates.trip_completed(data).full,
  }),

  trip_cancelled: (data) => ({
    sms: `City2City: CHOFUNIKA - Basi ${data.bus_number} (${data.origin} ku ${data.destination}) pa ${data.date} YAKANISHIDWA. Imbani support.`,
    push: `❌ Ulendo wakanishidwa: ${data.bus_number} pa ${data.date}`,
    full: englishTemplates.trip_cancelled(data).full,
  }),

  schedule_change: (data) => ({
    sms: `City2City: Kusintha - Basi ${data.bus_number} pa ${data.date} tsopano ichoka pa ${data.new_departure_time}. Ref: ${data.booking_reference}`,
    push: `🔄 Kusintha: ${data.bus_number} ichoka pa ${data.new_departure_time}`,
    full: englishTemplates.schedule_change(data).full,
  }),

  general: (data) => ({
    sms: englishTemplates.general(data).sms,
    push: englishTemplates.general(data).push,
    full: englishTemplates.general(data).full,
  }),
};

// ============================================================
// TEMPLATE REGISTRY
// ============================================================

const templateRegistry: Record<Language, Record<NotificationEvent, (data: TemplateData) => { sms: string; push: string; full: string }>> = {
  en: englishTemplates,
  bem: bembaTemplates,
  nya: nyanjaTemplates,
  ton: englishTemplates, // Fallback to English for Tonga (TODO: add Tonga templates)
  loz: englishTemplates, // Fallback to English for Lozi (TODO: add Lozi templates)
};

// ============================================================
// PUBLIC API
// ============================================================

/**
 * Get a formatted notification message
 */
export function getNotificationMessage(
  event: NotificationEvent,
  data: TemplateData,
  language: Language = 'en',
  channel: 'sms' | 'push' | 'full' = 'sms'
): string {
  const templates = templateRegistry[language] || templateRegistry.en;
  const template = templates[event];
  
  if (!template) {
    return `Vayazed: You have a notification regarding your booking ${data.booking_reference || ''}.`;
  }

  const messages = template(data);
  return messages[channel] || messages.sms;
}

/**
 * Get all channel messages for an event
 */
export function getAllChannelMessages(
  event: NotificationEvent,
  data: TemplateData,
  language: Language = 'en'
): { sms: string; push: string; full: string } {
  const templates = templateRegistry[language] || templateRegistry.en;
  const template = templates[event];
  
  if (!template) {
    const fallback = `Vayazed notification for booking ${data.booking_reference || 'N/A'}`;
    return { sms: fallback, push: fallback, full: fallback };
  }

  return template(data);
}

/**
 * Generate tracking URL for a booking
 */
export function generateTrackingURL(bookingReference: string, baseUrl: string = 'https://citytocity.zm'): string {
  return `${baseUrl}/customer/track/${bookingReference}`;
}