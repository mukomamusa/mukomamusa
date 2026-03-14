'use client';

import { useState } from 'react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentComplete: (paymentResult: PaymentResult) => void;
  bookingId: number;
  amount: number;
  bookingReference: string;
}

interface PaymentResult {
  success: boolean;
  payment_id?: number;
  transaction_id?: string;
  message: string;
}

type PaymentMethod = 'mobile_money' | 'card' | 'cash';
type MobileProvider = 'MTN' | 'Airtel' | 'Zamtel';

export default function PaymentModal({
  isOpen,
  onClose,
  onPaymentComplete,
  bookingId,
  amount,
  bookingReference
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mobile_money');
  const [mobileProvider, setMobileProvider] = useState<MobileProvider>('MTN');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  
  // Card details
  const [cardNumber, setCardNumber] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');
  
  // UI state
  const [step, setStep] = useState<'method' | 'details' | 'otp' | 'processing' | 'result' | 'cash_confirm'>('method');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentId, setPaymentId] = useState<number | null>(null);

  if (!isOpen) return null;

  const formatPhoneNumber = (value: string) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, '');
    // Limit to 10 digits
    return digits.slice(0, 10);
  };

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    const groups = digits.match(/.{1,4}/g);
    return groups ? groups.join(' ').slice(0, 19) : '';
  };

  const validatePhoneNumber = (phone: string) => {
    const pattern = /^09[567]\d{7}$/;
    return pattern.test(phone);
  };

  const initiatePayment = async () => {
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          booking_id: bookingId,
          payment_method: paymentMethod,
          provider: paymentMethod === 'mobile_money' ? mobileProvider : undefined,
          phone_number: paymentMethod === 'mobile_money' ? phoneNumber : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initiate payment');
      }

      setPaymentId(data.payment_id);
      
      if (paymentMethod === 'mobile_money') {
        // Move to OTP step for mobile money
        setStep('otp');
      } else {
        // For card, go straight to processing
        await processCardPayment(data.payment_id);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const processCardPayment = async (pId: number) => {
    setStep('processing');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          payment_id: pId,
          payment_method: 'card',
          card_details: {
            card_number: cardNumber.replace(/\s/g, ''),
            expiry_month: expiryMonth,
            expiry_year: expiryYear,
            cvv: cvv,
            card_holder_name: cardHolderName,
          },
        }),
      });

      const data = await response.json();
      setStep('result');

      if (data.success) {
        onPaymentComplete({
          success: true,
          payment_id: pId,
          message: data.message,
        });
      } else {
        setError(data.error || 'Payment failed');
      }
    } catch (err: any) {
      setStep('result');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmMobileMoneyPayment = async () => {
    if (!paymentId) return;
    
    setStep('processing');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          payment_id: paymentId,
          payment_method: 'mobile_money',
          provider: mobileProvider,
          phone_number: phoneNumber,
          otp: otp,
        }),
      });

      const data = await response.json();
      setStep('result');

      if (data.success) {
        onPaymentComplete({
          success: true,
          payment_id: paymentId,
          message: data.message,
        });
      } else {
        setError(data.error || 'Payment failed');
      }
    } catch (err: any) {
      setStep('result');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCashPaymentConfirm = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      // Create a payment record with cash method (pending status)
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          booking_id: bookingId,
          payment_method: 'cash',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to confirm cash payment');
      }

      // Cash payment is confirmed as "pay at station" - booking remains with pending payment
      onPaymentComplete({
        success: true,
        payment_id: data.payment_id,
        transaction_id: data.transaction_id,
        message: 'Cash payment confirmed. Please pay K' + amount.toLocaleString() + ' at the bus station before departure.',
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDetails = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (paymentMethod === 'mobile_money') {
      if (!validatePhoneNumber(phoneNumber)) {
        setError('Please enter a valid Zambian phone number (09XXXXXXXX)');
        return;
      }
    } else {
      if (!cardNumber || cardNumber.replace(/\s/g, '').length < 13) {
        setError('Please enter a valid card number');
        return;
      }
      if (!expiryMonth || !expiryYear) {
        setError('Please enter card expiry date');
        return;
      }
      if (!cvv || cvv.length < 3) {
        setError('Please enter a valid CVV');
        return;
      }
      if (!cardHolderName) {
        setError('Please enter the cardholder name');
        return;
      }
    }

    initiatePayment();
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) {
      setError('Please enter the OTP code sent to your phone');
      return;
    }
    confirmMobileMoneyPayment();
  };

  const resetAndClose = () => {
    setStep('method');
    setPaymentMethod('mobile_money');
    setMobileProvider('MTN');
    setPhoneNumber('');
    setOtp('');
    setCardNumber('');
    setExpiryMonth('');
    setExpiryYear('');
    setCvv('');
    setCardHolderName('');
    setError('');
    setPaymentId(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Complete Payment</h2>
            {step !== 'processing' && (
              <button onClick={resetAndClose} className="text-white hover:text-gray-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <div className="mt-4 border border-white/30 bg-white/10 rounded-lg p-3">
            <p className="text-sm text-white/80">Booking Reference: <span className="font-mono font-bold text-white">{bookingReference}</span></p>
            <p className="text-2xl font-bold mt-1 text-white">K{amount.toLocaleString()}</p>
          </div>
        </div>

        <div className="p-6">
          {/* Step 1: Select Payment Method */}
          {step === 'method' && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-4">Select Payment Method</h3>
              
              <div className="space-y-3">
                {/* Mobile Money Option */}
                <button
                  onClick={() => { setPaymentMethod('mobile_money'); setStep('details'); }}
                  className="w-full p-4 border-2 rounded-xl flex items-center space-x-4 hover:border-primary-500 hover:bg-primary-50 transition"
                >
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-semibold text-gray-800">Mobile Money</p>
                    <p className="text-sm text-gray-500">MTN, Airtel, Zamtel</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Card Option */}
                <button
                  onClick={() => { setPaymentMethod('card'); setStep('details'); }}
                  className="w-full p-4 border-2 rounded-xl flex items-center space-x-4 hover:border-primary-500 hover:bg-primary-50 transition"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-semibold text-gray-800">Debit/Credit Card</p>
                    <p className="text-sm text-gray-500">Visa, Mastercard</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Cash Option */}
                <button
                  onClick={() => { setPaymentMethod('cash'); setStep('cash_confirm'); }}
                  className="w-full p-4 border-2 rounded-xl flex items-center space-x-4 hover:border-primary-500 hover:bg-primary-50 transition"
                >
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-semibold text-gray-800">Cash Payment</p>
                    <p className="text-sm text-gray-500">Pay at bus station</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <div className="mt-6 flex items-center justify-center space-x-2 text-gray-500 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Secure payment processing</span>
              </div>
            </div>
          )}

          {/* Step 2: Enter Payment Details */}
          {step === 'details' && (
            <form onSubmit={handleSubmitDetails}>
              <button
                type="button"
                onClick={() => setStep('method')}
                className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              {paymentMethod === 'mobile_money' ? (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-4">Mobile Money Payment</h3>
                  
                  {/* Provider Selection */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Provider</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['MTN', 'Airtel', 'Zamtel'] as MobileProvider[]).map((provider) => (
                        <button
                          key={provider}
                          type="button"
                          onClick={() => setMobileProvider(provider)}
                          className={`p-3 rounded-lg border-2 font-semibold transition ${
                            mobileProvider === provider
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {provider}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                      placeholder="09XXXXXXXX"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter your {mobileProvider} mobile money number</p>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-4">Card Payment</h3>
                  
                  {/* Card Number */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      placeholder="XXXX XXXX XXXX XXXX"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  {/* Expiry & CVV */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                      <select
                        value={expiryMonth}
                        onChange={(e) => setExpiryMonth(e.target.value)}
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">MM</option>
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i} value={String(i + 1).padStart(2, '0')}>
                            {String(i + 1).padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                      <select
                        value={expiryYear}
                        onChange={(e) => setExpiryYear(e.target.value)}
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">YY</option>
                        {Array.from({ length: 10 }, (_, i) => {
                          const year = new Date().getFullYear() + i;
                          return (
                            <option key={year} value={String(year).slice(-2)}>
                              {year}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                      <input
                        type="password"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="XXX"
                        maxLength={4}
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  {/* Cardholder Name */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cardholder Name</label>
                    <input
                      type="text"
                      value={cardHolderName}
                      onChange={(e) => setCardHolderName(e.target.value.toUpperCase())}
                      placeholder="JOHN DOE"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent uppercase"
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  `Pay K${amount.toLocaleString()}`
                )}
              </button>
            </form>
          )}

          {/* Step 3: OTP for Mobile Money */}
          {step === 'otp' && (
            <form onSubmit={handleOtpSubmit}>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Confirm Payment</h3>
                <p className="text-sm text-gray-600">
                  A payment request has been sent to <strong>{phoneNumber}</strong>.
                  Enter the confirmation code to complete payment.
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2 text-center">Confirmation Code</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter code"
                  className="w-full px-4 py-4 text-center text-2xl tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  maxLength={6}
                />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Confirming...
                  </span>
                ) : (
                  'Confirm Payment'
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep('details')}
                className="w-full mt-3 py-3 text-gray-600 hover:text-gray-800 transition"
              >
                Use different number
              </button>
            </form>
          )}

          {/* Step 4: Processing */}
          {step === 'processing' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-primary-600 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h3 className="font-semibold text-gray-800 text-lg mb-2">Processing Payment</h3>
              <p className="text-gray-600">Please wait while we confirm your payment...</p>
              <p className="text-sm text-gray-500 mt-4">Do not close this window</p>
            </div>
          )}

          {/* Step 5: Result */}
          {step === 'result' && error && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="font-semibold text-red-600 text-lg mb-2">Payment Failed</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              
              <button
                onClick={() => { setError(''); setStep('method'); }}
                className="w-full py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition"
              >
                Try Again
              </button>
              <button
                onClick={resetAndClose}
                className="w-full mt-3 py-3 text-gray-600 hover:text-gray-800 transition"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Step 6: Cash Payment Confirmation */}
          {step === 'cash_confirm' && (
            <div>
              <button
                type="button"
                onClick={() => setStep('method')}
                className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-800 text-lg mb-2">Cash Payment</h3>
                <p className="text-gray-600">
                  Pay <span className="font-bold text-primary-600">K{amount.toLocaleString()}</span> at the bus station before departure
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <svg className="w-6 h-6 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="text-sm text-yellow-800">
                    <p className="font-semibold mb-1">Important Instructions:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Arrive at least 30 minutes before departure</li>
                      <li>Bring your booking reference: <span className="font-mono font-bold">{bookingReference}</span></li>
                      <li>Pay exact amount in cash</li>
                      <li>Seat may be released if payment not made 15 mins before departure</li>
                    </ul>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleCashPaymentConfirm}
                disabled={loading}
                className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Confirming...
                  </span>
                ) : (
                  'Confirm Cash Payment'
                )}
              </button>
              
              <p className="text-center text-sm text-gray-500 mt-3">
                Your booking will be held pending cash payment at the station
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
