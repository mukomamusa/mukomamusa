import React, { useState } from 'react';

interface CancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, refundAmount: number) => void;
  booking: any;
  loading: boolean;
}

export default function CancellationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  booking, 
  loading 
}: CancellationModalProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [acceptPolicy, setAcceptPolicy] = useState(false);

  if (!isOpen || !booking) return null;

  // Calculate cancellation policy and refunds
  const calculateRefund = () => {
    const bookingDate = new Date(booking.date);
    const currentDate = new Date();
    const hoursUntilDeparture = (bookingDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60);
    
    let refundPercentage = 0;
    let cancellationFee = 0;

    if (hoursUntilDeparture >= 48) {
      refundPercentage = 90; // 90% refund, 10% cancellation fee
      cancellationFee = booking.total_price * 0.1;
    } else if (hoursUntilDeparture >= 24) {
      refundPercentage = 70; // 70% refund, 30% cancellation fee
      cancellationFee = booking.total_price * 0.3;
    } else if (hoursUntilDeparture >= 6) {
      refundPercentage = 50; // 50% refund, 50% cancellation fee
      cancellationFee = booking.total_price * 0.5;
    } else {
      refundPercentage = 0; // No refund for cancellations within 6 hours
      cancellationFee = booking.total_price;
    }

    return {
      refundPercentage,
      refundAmount: booking.total_price * (refundPercentage / 100),
      cancellationFee,
      hoursUntilDeparture
    };
  };

  const refundInfo = calculateRefund();

  const cancellationReasons = [
    'Change in travel plans',
    'Emergency/Family situation',
    'Medical reasons',
    'Work/Business conflict', 
    'Weather concerns',
    'Found alternative transport',
    'Financial reasons',
    'Other (please specify)'
  ];

  const handleConfirm = () => {
    const reason = selectedReason === 'Other (please specify)' ? customReason : selectedReason;
    if (!reason.trim()) {
      alert('Please select or provide a cancellation reason');
      return;
    }
    
    if (!acceptPolicy) {
      alert('Please accept the cancellation policy to proceed');
      return;
    }

    onConfirm(reason, refundInfo.refundAmount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-red-50 border-b border-red-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Cancel Booking</h3>
                <p className="text-red-600 font-medium">Ref: {booking.booking_reference}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition"
              disabled={loading}
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Booking Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-3">Booking Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Route:</span>
                <p className="font-medium">{booking.origin} → {booking.destination}</p>
              </div>
              <div>
                <span className="text-gray-600">Date & Time:</span>
                <p className="font-medium">{booking.date} at {booking.departure_time}</p>
              </div>
              <div>
                <span className="text-gray-600">Passengers:</span>
                <p className="font-medium">{booking.passengers?.length || booking.num_seats}</p>
              </div>
              <div>
                <span className="text-gray-600">Total Amount:</span>
                <p className="font-medium">K{booking.total_price}</p>
              </div>
            </div>
          </div>

          {/* Cancellation Policy & Refund Info */}
          <div className={`rounded-lg p-4 ${
            refundInfo.refundPercentage > 0 ? 'bg-yellow-50 border border-yellow-200' : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-start space-x-3">
              <svg className={`w-6 h-6 mt-0.5 ${
                refundInfo.refundPercentage > 0 ? 'text-yellow-600' : 'text-red-600'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800 mb-2">Cancellation Policy</h4>
                <div className="text-sm text-gray-700 space-y-1">
                  <p><strong>Time until departure:</strong> {Math.round(refundInfo.hoursUntilDeparture)} hours</p>
                  
                  {refundInfo.refundPercentage > 0 ? (
                    <div className="space-y-1">
                      <p><strong>Refund Amount:</strong> <span className="text-green-600 font-semibold">K{refundInfo.refundAmount.toFixed(2)}</span> ({refundInfo.refundPercentage}% of total)</p>
                      <p><strong>Cancellation Fee:</strong> <span className="text-red-600">K{refundInfo.cancellationFee.toFixed(2)}</span></p>
                    </div>
                  ) : (
                    <p className="text-red-600 font-medium">
                      <strong>No refund available</strong> - Cancellations within 6 hours of departure are non-refundable
                    </p>
                  )}
                </div>

                <div className="mt-3 text-xs text-gray-600 bg-white rounded p-2">
                  <p className="font-medium mb-1">Cancellation Policy:</p>
                  <ul className="space-y-0.5">
                    <li>• 48+ hours before: 90% refund</li>
                    <li>• 24-48 hours before: 70% refund</li>
                    <li>• 6-24 hours before: 50% refund</li>
                    <li>• Less than 6 hours: No refund</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Cancellation Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Reason for Cancellation <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {cancellationReasons.map((reason) => (
                <label key={reason} className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="cancellation_reason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="w-4 h-4 text-red-600 focus:ring-red-500"
                    disabled={loading}
                  />
                  <span className="text-sm text-gray-700">{reason}</span>
                </label>
              ))}
            </div>

            {selectedReason === 'Other (please specify)' && (
              <div className="mt-3">
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Please provide more details about your cancellation reason..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows={3}
                  disabled={loading}
                />
              </div>
            )}
          </div>

          {/* Policy Acceptance */}
          <div className="bg-gray-50 rounded-lg p-4">
            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={acceptPolicy}
                onChange={(e) => setAcceptPolicy(e.target.checked)}
                className="w-5 h-5 text-red-600 focus:ring-red-500 mt-0.5"
                disabled={loading}
              />
              <div className="text-sm text-gray-700">
                <p className="font-medium mb-1">I understand and accept the cancellation policy</p>
                <ul className="text-xs text-gray-600 space-y-0.5">
                  <li>• Refunds will be processed within 3-5 business days</li>
                  <li>• Cancellation fees are non-negotiable based on timing</li>
                  <li>• This action cannot be undone once confirmed</li>
                  <li>• Refunds will be credited to the original payment method</li>
                </ul>
              </div>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-gray-50 border-t border-gray-200 p-6 flex space-x-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition disabled:opacity-50"
          >
            Keep Booking
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !selectedReason || !acceptPolicy}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                <span>Cancelling...</span>
              </>
            ) : (
              <span>Confirm Cancellation</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}