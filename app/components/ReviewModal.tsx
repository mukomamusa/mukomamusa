"use client";
import { useState } from "react";
import ReviewForm from "./ReviewForm";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: number;
  customerId: number;
  bookingId?: number;
  onSubmitted?: (reviewData?: any) => void; // Changed to accept review data
}

export default function ReviewModal({ 
  isOpen, 
  onClose, 
  companyId, 
  customerId, 
  bookingId, 
  onSubmitted 
}: ReviewModalProps) {
  if (!isOpen) return null;

  const handleSubmitSuccess = (reviewData?: any) => {
    if (onSubmitted) {
      onSubmitted(reviewData); // Pass the review data back
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold"
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className="text-xl font-bold mb-4">Leave a Review</h2>
        <ReviewForm
          companyId={companyId}
          customerId={customerId}
          bookingId={bookingId}
          onSubmitted={handleSubmitSuccess} // Updated handler
        />
      </div>
    </div>
  );
}