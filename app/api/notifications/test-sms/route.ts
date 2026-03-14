import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/app/lib/auth';

const AT_CONFIG = {
  username: process.env.AT_USERNAME || 'sandbox',
  apiKey: process.env.AT_API_KEY || '',
  senderId: process.env.AT_SENDER_ID || 'VayaZed',
  baseUrl: process.env.AT_BASE_URL || 'https://api.sandbox.africastalking.com/version1/messaging',
};

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded || !['company', 'admin'].includes(decoded.user_type)) {
      return NextResponse.json({ error: 'Company or admin access required' }, { status: 403 });
    }

    const { phone, message } = await request.json();
    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const formattedPhone = formatZambianPhone(phone);
    if (!formattedPhone) {
      return NextResponse.json({ error: 'Invalid Zambian phone number' }, { status: 400 });
    }

    const smsText = message || 'VayaZed test SMS. Tracking alerts are configured.';

    if (!AT_CONFIG.apiKey) {
      return NextResponse.json({
        success: true,
        simulated: true,
        provider: 'africastalking',
        message: 'AT_API_KEY is not configured. SMS simulated only.',
        phone: formattedPhone,
        text: smsText,
      });
    }

    const result = await sendATSMS(formattedPhone, smsText);
    return NextResponse.json({ provider: 'africastalking', ...result });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    configured: !!process.env.AT_API_KEY,
    environment: AT_CONFIG.username === 'sandbox' ? 'sandbox' : 'production',
    sender_id: AT_CONFIG.senderId,
  });
}

async function sendATSMS(phone: string, message: string) {
  try {
    const params = new URLSearchParams({
      username: AT_CONFIG.username,
      to: phone,
      message,
      from: AT_CONFIG.senderId,
    });

    const response = await fetch(AT_CONFIG.baseUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        apiKey: AT_CONFIG.apiKey,
      },
      body: params.toString(),
    });

    const data = await response.json();
    const recipient = data?.SMSMessageData?.Recipients?.[0];
    return {
      success: !!recipient && recipient.status === 'Success',
      messageId: recipient?.messageId,
      cost: recipient?.cost,
      status: recipient?.status,
      error: response.ok ? undefined : `AT API returned ${response.status}`,
    };
  } catch (error: any) {
    return { success: false, error: error?.message || 'SMS send failed' };
  }
}

function formatZambianPhone(phone: string): string | null {
  const cleaned = String(phone).replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('+260') && cleaned.length === 13) return cleaned;
  if (cleaned.startsWith('260') && cleaned.length === 12) return `+${cleaned}`;
  if (cleaned.startsWith('0') && cleaned.length === 10) return `+260${cleaned.slice(1)}`;
  if (/^[679]\d{8}$/.test(cleaned)) return `+260${cleaned}`;
  return null;
}
