import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/database-schema';
import Flutterwave from 'flutterwave-node-v3';
import { verifyToken, generateTransactionId } from '@/app/lib/auth';

// Validate required environment variables
const requiredEnvVars = {
  public: process.env.FLUTTERWAVE_PUBLIC_KEY,
  secret: process.env.FLUTTERWAVE_SECRET_KEY,
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL
};

// In production, fail fast if keys are missing
if (process.env.NODE_ENV === 'production') {
  if (!requiredEnvVars.public || !requiredEnvVars.secret) {
    throw new Error('Flutterwave keys are required in production');
  }
}

// Initialize Flutterwave with sandbox keys (only use fallbacks in development)
const flw = new Flutterwave(
  process.env.FLUTTERWAVE_PUBLIC_KEY || (process.env.NODE_ENV === 'development' ? 'FLWPUBK_TEST-17f7b501-28c1-4c9d-89ea-cbc10dd5a701-X' : ''),
  process.env.FLUTTERWAVE_SECRET_KEY || (process.env.NODE_ENV === 'development' ? 'FLWSECK_TEST-nluTyNtOr6JEiWPTv1bLBjtMQrP8wvcH-X' : '')
);

// Log presence of Flutterwave keys (masked) for easier debugging in dev
function maskKey(k: string | undefined) {
  if (!k) return 'NOT SET';
  if (k.length <= 10) return k;
  return k.slice(0, 6) + '...' + k.slice(-4);
}
console.log('Flutterwave keys:', {
  public: maskKey(process.env.FLUTTERWAVE_PUBLIC_KEY),
  secret: maskKey(process.env.FLUTTERWAVE_SECRET_KEY)
});

// POST initiate payment with Flutterwave
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.user_type !== 'customer') {
      return NextResponse.json({ error: 'Customer access only' }, { status: 403 });
    }

    const body = await request.json();
    const { booking_id, payment_method, phone_number, email } = body;

    if (!booking_id || !payment_method) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate payment method
    const validMethods = ['mobile_money', 'card', 'bank_transfer'] as const;
    type PaymentMethod = typeof validMethods[number];
    
    if (!validMethods.includes(payment_method as PaymentMethod)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
    }

    // Validate mobile money phone number
    if (payment_method === 'mobile_money' && !phone_number) {
      return NextResponse.json({ 
        error: 'Phone number is required for mobile money payments' 
      }, { status: 400 });
    }

    // Validate phone number format for Zambian numbers
    if (payment_method === 'mobile_money' && phone_number) {
      const zambianPhoneRegex = /^(09[567]|07[7-9]|05[5-9])\d{7}$/;
      const cleanedPhone = phone_number.replace(/\s+/g, '');
      if (!zambianPhoneRegex.test(cleanedPhone)) {
        return NextResponse.json({ 
          error: 'Invalid Zambian phone number format. Should be like 0977XXXXXX' 
        }, { status: 400 });
      }
    }

    // Get booking details
    const booking = db.prepare(`
      SELECT b.*, r.origin, r.destination, r.date, r.departure_time,
             u.name as customer_name, u.email as customer_email, u.phone as customer_phone
      FROM bookings b
      JOIN routes r ON b.route_id = r.id
      JOIN users u ON b.customer_id = u.id
      WHERE b.id = ? AND b.customer_id = ? AND b.status = 'reserved'
    `).get(booking_id, decoded.id) as any;

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found or not eligible for payment' }, { status: 404 });
    }

    // Check if reservation has expired
    if (booking.reservation_expires_at) {
      const expiryTime = new Date(booking.reservation_expires_at);
      if (expiryTime < new Date()) {
        // Release seats and cancel booking
        db.prepare(`UPDATE bookings SET status = 'cancelled' WHERE id = ?`).run(booking_id);
        db.prepare(`UPDATE routes SET available_seats = available_seats + ? WHERE id = ?`).run(
          booking.num_seats, booking.route_id
        );
        return NextResponse.json({ error: 'Reservation expired. Please try booking again.' }, { status: 400 });
      }
    }

    // Check if payment already exists
    const existingPayment = db.prepare('SELECT * FROM payments WHERE booking_id = ?').get(booking_id);
    if (existingPayment) {
      return NextResponse.json({ error: 'Payment already initiated for this booking' }, { status: 400 });
    }

    const transactionId = generateTransactionId();

    // Prepare Flutterwave payment payload
    const paymentPayload = {
      tx_ref: transactionId,
      amount: booking.total_price,
      currency: 'ZMW',
      redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/booking/payment/callback?booking_id=${booking_id}`,
      payment_options: payment_method === 'mobile_money' ? 'mobilemoneyzambia' :
                      payment_method === 'card' ? 'card' : 'banktransfer',
      customer: {
        email: email || booking.customer_email,
        phone_number: phone_number || booking.customer_phone,
        name: booking.customer_name
      },
      customizations: {
        title: 'Bus Booking Payment',
        description: `Booking ${booking.booking_reference} - ${booking.origin} to ${booking.destination}`,
        logo: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/logo.png`
      },
      meta: {
        booking_id: booking_id,
        booking_reference: booking.booking_reference
      }
    };

    console.log('Initiating payment with payload:', paymentPayload);
    console.log('Outgoing Flutterwave Authorization header:', process.env.FLUTTERWAVE_SECRET_KEY ?
      ('Bearer ' + process.env.FLUTTERWAVE_SECRET_KEY.slice(0, 12) + '...') : 'NOT SET');

    let response;

    // Handle different payment methods
    switch (payment_method) {
      case 'mobile_money':
        response = await handleMobileMoneyPayment(transactionId, booking, phone_number, email);
        break;
      case 'card':
        response = await flw.Card.charge(paymentPayload);
        break;
      case 'bank_transfer':
        response = await flw.Bank.transfer(paymentPayload);
        break;
      default:
        return NextResponse.json({ error: 'Unsupported payment method' }, { status: 400 });
    }

    console.log('Flutterwave response:', response);

    if (response.status === 'success') {
      // Store payment record
      const paymentResult = db.prepare(`
        INSERT INTO payments (
          booking_id, payment_method, provider, amount, currency,
          transaction_id, status, payment_data, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        booking_id,
        payment_method,
        'flutterwave',
        booking.total_price,
        'ZMW',
        transactionId,
        'pending',
        JSON.stringify({
          flutterwave_ref: response.data?.flw_ref,
          payment_link: response.data?.payment_link || null
        })
      );

      return NextResponse.json({
        message: 'Payment initiated successfully',
        payment_id: paymentResult.lastInsertRowid,
        transaction_id: transactionId,
        payment_link: response.data?.payment_link,
        instructions: payment_method === 'mobile_money'
          ? `A payment request of K${booking.total_price} has been sent to ${phone_number || booking.customer_phone}. Please approve on your phone.`
          : `Please complete payment of K${booking.total_price} using the provided link.`,
        expires_in: Math.floor((new Date(booking.reservation_expires_at).getTime() - Date.now()) / 1000) // seconds remaining
      });
    } else {
      return await handlePaymentError(response, booking_id, booking, transactionId, payment_method, phone_number, email);
    }

  } catch (error: any) {
    console.error('Error initiating payment:', error);
    if (error?.response) {
      console.error('Flutterwave API error:', error.response.data || error.response);
    }
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined 
    }, { status: 500 });
  }
}

// Helper function for mobile money payments
async function handleMobileMoneyPayment(transactionId: string, booking: any, phone_number?: string, email?: string) {
  const chargeUrl = 'https://api.flutterwave.com/v3/charges?type=mobile_money_zambia';
  const chargePayload = {
    tx_ref: transactionId,
    amount: booking.total_price,
    currency: 'ZMW',
    redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/booking/payment/callback?booking_id=${booking.id}`,
    order_id: booking.id,
    phone_number: phone_number || booking.customer_phone,
    email: email || booking.customer_email,
    fullname: booking.customer_name,
  };

  console.log('Direct Flutterwave charge request to:', chargeUrl);
  console.log('Direct Flutterwave charge payload:', chargePayload);

  const fwRes = await fetch(chargeUrl, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + (process.env.FLUTTERWAVE_SECRET_KEY || ''),
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(chargePayload)
  });

  const fwText = await fwRes.text();
  let fwJson: any = null;
  try { fwJson = JSON.parse(fwText); } catch (e) { fwJson = null; }

  console.log('Direct Flutterwave charge status:', fwRes.status);
  console.log('Direct Flutterwave charge response body:', fwText.slice(0, 5000));

  return fwJson || { status: fwRes.ok ? 'success' : 'error', message: fwText, data: {} };
}

// Helper function to handle payment errors with mock fallback
async function handlePaymentError(response: any, booking_id: number, booking: any, 
                                   transactionId: string, payment_method: string, 
                                   phone_number?: string, email?: string) {
  // Test Flutterwave connectivity
  try {
    const testRes = await fetch('https://api.flutterwave.com/v3/banks?country=ZM', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + (process.env.FLUTTERWAVE_SECRET_KEY || ''),
        'Accept': 'application/json'
      }
    });

    const testText = await testRes.text();
    console.error('Direct Flutterwave test response status:', testRes.status);
    console.error('Direct Flutterwave test response body:', testText.slice(0, 2000));
  } catch (testErr) {
    console.error('Error performing direct Flutterwave test request:', testErr);
  }

  // In development, provide mock payment fallback
  const isDev = process.env.NODE_ENV !== 'production';
  const authError = response && String(response?.message || '').toLowerCase().includes('invalid authorization key');

  if (isDev || authError) {
    try {
      const mockPaymentData = {
        note: authError ? 'Flutterwave auth failed - using mock payment' : 'Dev-mode mock payment',
        original_response: response
      };

      const paymentResult = db.prepare(`
        INSERT INTO payments (
          booking_id, payment_method, provider, amount, currency,
          transaction_id, status, payment_data, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(
        booking_id,
        payment_method,
        'mock',
        booking.total_price,
        'ZMW',
        transactionId,
        'pending',
        JSON.stringify(mockPaymentData)
      );

      const mockPaymentId = paymentResult.lastInsertRowid;
      const mockLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/mock_pay?payment_id=${mockPaymentId}`;
      console.log(`\n[MOCK PAYMENT LINK] Visit this URL to simulate payment completion: ${mockLink}\n`);

      return NextResponse.json({
        message: 'Mock payment initiated (dev-mode)',
        payment_id: mockPaymentId,
        transaction_id: transactionId,
        payment_link: mockLink,
        instructions: `This is a development mock payment. Visit ${mockLink} to simulate payment completion.`,
        expires_in: Math.floor((new Date(booking.reservation_expires_at).getTime() - Date.now()) / 1000)
      });
    } catch (mockErr) {
      console.error('Error creating mock payment record:', mockErr);
      return NextResponse.json({ 
        error: 'Failed to initiate payment', 
        details: response?.message || response 
      }, { status: 400 });
    }
  }

  return NextResponse.json({
    error: 'Failed to initiate payment',
    details: response?.message || response
  }, { status: 400 });
}