"use client";
import { useState } from "react";

interface ReviewFormProps {
  companyId: number;
  customerId: number;
  bookingId?: number;
  onSubmitted?: () => void;
}

export default function ReviewForm({ companyId, customerId, bookingId, onSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess(false);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: companyId,
          customer_id: customerId,
          booking_id: bookingId,
          rating,
          review_text: reviewText
        })
      });
      if (!res.ok) throw new Error("Failed to submit review");
      setSuccess(true);
      setReviewText("");
      setRating(0);
      onSubmitted && onSubmitted();
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded bg-white max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-2">Leave a Review</h3>
      <div className="flex items-center mb-2">
        {[1,2,3,4,5].map(star => (
          <button
            type="button"
            key={star}
            onClick={() => setRating(star)}
            className={star <= rating ? "text-yellow-400" : "text-gray-300"}
            aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
          >
            ★
          </button>
        ))}
        <span className="ml-2">{rating > 0 ? `${rating} / 5` : "No rating"}</span>
      </div>
      <textarea
        className="w-full border rounded p-2 mb-2"
        rows={3}
        placeholder="Write your review..."
        value={reviewText}
        onChange={e => setReviewText(e.target.value)}
        required
      />
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        disabled={submitting || rating === 0}
      >
        {submitting ? "Submitting..." : "Submit Review"}
      </button>
      {error && <div className="text-red-600 mt-2">{error}</div>}
      {success && <div className="text-green-600 mt-2">Review submitted! Pending approval.</div>}
    </form>
  );
}
