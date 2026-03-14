// /app/components/CompanyReviews.tsx
"use client";
import { useEffect, useState } from "react";

interface Review {
  id: number;
  customer_id: number;
  customer_name?: string;  // Added from API join
  rating: number;
  review_text: string;
  created_at: string;
  status: string;
  company_response?: string | null;  // New field
  responded_at?: string | null;      // New field
}

interface CompanyReviewsProps {
  companyId: number;
  onResponseAdded?: () => void;  // Optional callback
}

export default function CompanyReviews({ companyId, onResponseAdded }: CompanyReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<"newest" | "highest" | "lowest">("newest");

  // Response modal state
  const [respondingTo, setRespondingTo] = useState<number | null>(null);
  const [responseText, setResponseText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Stats state
  const [stats, setStats] = useState({
    average: 0,
    total: 0,
    responded: 0,
    responseRate: 0
  });

  const REVIEWS_PER_PAGE = 10;

  useEffect(() => {
    async function fetchReviews() {
      setLoading(true);
      try {
        // Fetch approved reviews for this company
        const res = await fetch(`/api/reviews?company_id=${companyId}&status=approved`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();

        // Data now includes customer_name from the JOIN in your API
        setReviews(data);

        // Calculate stats
        if (data.length > 0) {
          const total = data.length;
          const sum = data.reduce((acc: number, r: Review) => acc + r.rating, 0);
          const avg = sum / total;
          const responded = data.filter((r: Review) => r.company_response).length;

          setStats({
            average: parseFloat(avg.toFixed(1)),
            total,
            responded,
            responseRate: Math.round((responded / total) * 100)
          });
        }
      } catch (err) {
        console.error("Reviews fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchReviews();
  }, [companyId]);

  // Handle response submission
  // In CompanyReviews.tsx - handleSubmitResponse function
  const handleSubmitResponse = async () => {
    if (!respondingTo || !responseText.trim()) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token'); // Make sure token exists

      if (!token) {
        alert('You must be logged in to respond');
        return;
      }

      const res = await fetch(`/api/reviews/${respondingTo}/response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ response_text: responseText })
      });

      const data = await res.json();

      if (res.ok) {
        // Refresh reviews
        const refreshRes = await fetch(`/api/reviews?company_id=${companyId}&status=approved`);
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          setReviews(data);
        }

        setRespondingTo(null);
        setResponseText("");
        if (onResponseAdded) onResponseAdded();

        // Show success message
        alert('Response submitted successfully!');
      } else {
        alert(data.error || 'Failed to submit response');
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      alert('Failed to submit response. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  // Sorted version of reviews
  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    if (sortBy === "highest") return b.rating - a.rating;
    if (sortBy === "lowest") return a.rating - b.rating;
    return 0;
  });

  // Pagination math
  const totalReviews = sortedReviews.length;
  const totalPages = Math.ceil(totalReviews / REVIEWS_PER_PAGE) || 1;
  const startIndex = (page - 1) * REVIEWS_PER_PAGE;
  const currentPageReviews = sortedReviews.slice(startIndex, startIndex + REVIEWS_PER_PAGE);

  // Reset to page 1 when sort or data changes
  useEffect(() => {
    setPage(1);
  }, [sortBy, reviews.length]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header with stats + sort */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          {/* Left side - Rating */}
          <div>
            <h3 className="text-xl font-bold text-gray-800">Customer Reviews</h3>
            {stats.total > 0 ? (
              <div className="mt-3 space-y-3">
                {/* Main rating display */}
                <div className="flex items-center gap-4">
                  <span className="text-4xl font-extrabold text-amber-600">{stats.average}</span>
                  <div>
                    <div className="flex text-2xl text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={i < Math.floor(stats.average) ? "text-amber-400" : "text-gray-300"}>
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      {stats.total} {stats.total === 1 ? "review" : "reviews"} • {stats.responseRate}% response rate
                    </span>
                  </div>
                </div>

                {/* Response rate progress bar */}
                <div className="w-full max-w-xs">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Response Rate</span>
                    <span className="font-medium">{stats.responseRate}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all duration-500"
                      style={{ width: `${stats.responseRate}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-gray-500">No reviews yet</p>
            )}
          </div>

          {/* Right side - Sort and stats summary */}
          {stats.total > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex gap-4 text-sm bg-white px-4 py-2 rounded-lg border border-gray-200">
                <div>
                  <span className="text-gray-500">Responded:</span>
                  <span className="ml-2 font-medium text-green-600">{stats.responded}</span>
                </div>
                <div className="w-px h-4 bg-gray-300 self-center"></div>
                <div>
                  <span className="text-gray-500">Pending:</span>
                  <span className="ml-2 font-medium text-yellow-600">{stats.total - stats.responded}</span>
                </div>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white min-w-[140px]"
              >
                <option value="newest">Newest First</option>
                <option value="highest">Highest Rated</option>
                <option value="lowest">Lowest Rated</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="p-12 text-center">
          <div className="animate-spin w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading customer feedback...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && totalReviews === 0 && (
        <div className="p-12 text-center text-gray-600">
          <div className="text-7xl mb-4 opacity-40">⭐</div>
          <h4 className="text-xl font-medium mb-3">No reviews yet</h4>
          <p>When passengers share their experience, it will appear here.</p>
        </div>
      )}

      {/* Reviews + Pagination */}
      {!loading && totalReviews > 0 && (
        <>
          <div className="divide-y divide-gray-200">
            {currentPageReviews.map((review) => (
              <div key={review.id} className="p-6 hover:bg-gray-50 transition">
                {/* Review Header */}
                <div className="flex justify-between items-start mb-3 flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    {/* Customer Avatar */}
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {review.customer_name?.charAt(0) || 'C'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        {review.customer_name || 'Anonymous Customer'}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex text-lg">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={i < review.rating ? "text-amber-400" : "text-gray-300"}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.created_at).toLocaleDateString("en-GB", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Response Button - Only show if no response yet */}
                  {!review.company_response && (
                    <button
                      onClick={() => {
                        setRespondingTo(review.id);
                        setResponseText("");
                      }}
                      className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition text-sm font-medium flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      Respond
                    </button>
                  )}
                </div>

                {/* Review Text */}
                <p className="text-gray-700 leading-relaxed whitespace-pre-line pl-14">
                  {review.review_text}
                </p>

                {/* Company Response */}
                {review.company_response && (
                  <div className="mt-4 ml-14 pl-4 border-l-4 border-green-500 bg-green-50 p-4 rounded-r-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-green-600 font-semibold text-sm flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        Your Response
                      </span>
                      {review.responded_at && (
                        <span className="text-xs text-gray-500">
                          {new Date(review.responded_at).toLocaleDateString("en-GB", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700">{review.company_response}</p>

                    {/* Edit Response Button */}
                    <button
                      onClick={() => {
                        setRespondingTo(review.id);
                        setResponseText(review.company_response || "");
                      }}
                      className="mt-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Edit Response
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination footer */}
          {totalPages > 1 && (
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-6 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>

              <span className="text-gray-700 font-medium text-center">
                Page {page} of {totalPages} • {totalReviews} reviews total
              </span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-6 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium w-full sm:w-auto flex items-center justify-center gap-2"
              >
                Next
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </>
      )}

      {/* Response Modal */}
      {respondingTo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  {reviews.find(r => r.id === respondingTo)?.company_response ? 'Edit Response' : 'Respond to Review'}
                </h3>
                <button
                  onClick={() => {
                    setRespondingTo(null);
                    setResponseText("");
                  }}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Original Review Preview */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex text-sm">
                    {[...Array(5)].map((_, i) => {
                      const review = reviews.find(r => r.id === respondingTo);
                      return (
                        <span key={i} className={i < (review?.rating || 0) ? "text-amber-400" : "text-gray-300"}>
                          ★
                        </span>
                      );
                    })}
                  </div>
                  <span className="text-xs text-gray-500">
                    {reviews.find(r => r.id === respondingTo)?.customer_name || 'Customer'}
                  </span>
                </div>
                <p className="text-sm text-gray-700">
                  {reviews.find(r => r.id === respondingTo)?.review_text}
                </p>
              </div>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Response
              </label>
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Write a thoughtful response to this customer..."
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1 flex justify-between">
                <span>Be respectful and helpful in your response.</span>
                <span>{responseText.length}/500</span>
              </p>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  setRespondingTo(null);
                  setResponseText("");
                }}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitResponse}
                disabled={submitting || !responseText.trim()}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  'Submit Response'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}