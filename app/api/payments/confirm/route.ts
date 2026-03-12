import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/database-schema';
import { verifyToken } from '@/app/lib/auth';

// Simulated payment confirmation for Mobile Money and Card payments
// In production, integrate with:
// - MTN Mobile Money API
// - Airtel Money API  
// - Zamtel Kwacha API
// - Card processor (Stripe, PayStack, etc.)

interface ConfirmPaymentRequest {
  payment_id: number;
  payment_method: 'mobile_money' | 'card';
  provider?: string; // MTN, Airtel, Zamtel
  phone_number?: string;
  otp?: string; // For mobile money confirmation
  card_details?: {
    card_number: string;
    expiry_month: string;
    expiry_year: string;
    cvv: string;
    card_holder_name: string;
  };
}

// Simulate mobile money payment confirmation
async function confirmMobileMoneyPayment(
  provider: string,
  phoneNumber: string,
  amount: number,
  otp: string
): Promise<{ success: boolean; message: string }> {
  // Simulate API delay (real API would wait for callback)
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Validate OTP (in demo, accept any 4-6 digit code)
  if (!otp || otp.length < 4 || otp.length > 6 || !/^\d+$/.test(otp)) {
    return {
      success: false,
      message: 'Invalid OTP code. Please enter the code sent to your phone.'
    };
  }
  
  // Simulate success (90% success rate for demo)
  const isSuccess = Math.random() > 0.1;
  
  if (isSuccess) {
    return {
      success: true,
      message: `Payment of K${amount} confirmed via ${provider} Mobile Money`
    };
  } else {
    return {
      success: false,
      message: 'Payment failed. Insufficient balance or transaction declined.'
    };
  }
}

// Simulate card payment confirmation
async function confirmCardPayment(
  cardDetails: ConfirmPaymentRequest['card_details'],
  amount: number
): Promise<{ success: boolean; message: string }> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2500));
  
  if (!cardDetails) {
    return { success: false, message: 'Card details are required' };
  }
  
  // Basic card validation
  const cardNumber = cardDetails.card_number.replace(/\s/g, '');
  if (cardNumber.length < 13 || cardNumber.length > 19) {
    return { success: false, message: 'Invalid card number' };
  }
  
  if (cardDetails.cvv.length < 3 || cardDetails.cvv.length > 4) {
    return { success: false, message: 'Invalid CVV' };
  }
  
  // Simulate success (95% success rate for demo)
  const isSuccess = Math.random() > 0.05;
  
  if (isSuccess) {
    return {
      success: true,
      message: `Card payment of K${amount} processed successfully`
    };
  } else {
    return {
      success: false,
      message: 'Card declined. Please check your details and try again.'
    };
  }
}

// POST - Confirm a pending payment
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.user_type !== 'customer') {
      return NextResponse.json({ error: 'Unauthorized - Customer access only' }, { status: 403 });
    }

    const body: ConfirmPaymentRequest = await request.json();
    const { payment_id, payment_method, provider, phone_number, otp, card_details } = body;

    if (!payment_id || !payment_method) {
      return NextResponse.json(
        { error: 'Missing required fields: payment_id, payment_method' },
        { status: 400 }
      );
    }

    // Get payment and verify ownership
    const payment = db.prepare(`
      SELECT p.*, b.customer_id, b.total_price
      FROM payments p
      JOIN bookings b ON p.booking_id = b.id
      WHERE p.id = ?
    `).get(payment_id) as any;

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    if (payment.customer_id !== decoded.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    if (payment.status === 'completed') {
      return NextResponse.json({ error: 'Payment already completed' }, { status: 400 });
    }

    // Process payment based on method
    let result;
    if (payment_method === 'mobile_money') {
      if (!provider || !phone_number) {
        return NextResponse.json(
          { error: 'Mobile money requires provider and phone_number' },
          { status: 400 }
        );
      }
      result = await confirmMobileMoneyPayment(provider, phone_number, payment.amount, otp || '');
    } else if (payment_method === 'card') {
      if (!card_details) {
        return NextResponse.json({ error: 'Card details required' }, { status: 400 });
      }
      result = await confirmCardPayment(card_details, payment.amount);
    } else {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
    }

    if (result.success) {
      // Update payment to completed
      db.prepare(`
        UPDATE payments 
        SET status = 'completed', 
            payment_method = ?,
            provider = ?,
            phone_number = ?
        WHERE id = ?
      `).run(payment_method, provider || 'card', phone_number || null, payment_id);

      // Update booking payment status
      db.prepare(`
        UPDATE bookings 
        SET payment_status = 'paid', 
            status = 'confirmed'
        WHERE id = ?
      `).run(payment.booking_id);

      return NextResponse.json({
        success: true,
        message: result.message,
        payment: {
          id: payment_id,
          status: 'completed',
          booking_id: payment.booking_id
        }
      });
    } else {
      // Update payment status to failed
      db.prepare(`UPDATE payments SET status = 'failed' WHERE id = ?`).run(payment_id);

      return NextResponse.json({
        success: false,
        error: result.message,
        payment: {
          id: payment_id,
          status: 'failed'
        }
      }, { status: 402 });
    }
  } catch (error) {
    console.error('Payment confirmation error:', error);
    return NextResponse.json(
      { error: 'Payment confirmation failed. Please try again.' },
      { status: 500 }
    );
  }
}
