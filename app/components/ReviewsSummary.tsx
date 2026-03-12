// /app/components/ReviewsSummary.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ReviewsSummaryProps {
  companyId: number;
  onViewAllClick?: () => void;
}

export default function ReviewsSummary({ companyId, onViewAllClick }: ReviewsSummaryProps) {
  const [summary, setSummary] = useState({
    average: 0,
    total: 0,
    responded: 0,
    responseRate: 0,
    recent: [] as any[],
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, [companyId]);

  const fetchSummary = async () => {
    try {
      const res = await fetch(`/api/reviews?company_id=${companyId}&status=approved`);
      const reviews = await res.json();
      
      if (Array.isArray(reviews)) {
        const total = reviews.length;
        
        // Calculate average
        const avg = total > 0 
          ? (reviews.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1)
          : 0;
        
        // Calculate response stats
        const responded = reviews.filter((r: any) => r.company_response).length;
        const responseRate = total > 0 ? Math.round((responded / total) * 100) : 0;

        // Calculate distribution
        const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        reviews.forEach((r: any) => {
          dist[r.rating as keyof typeof dist]++;
        });

        setSummary({
          average: Number(avg),
          total,
          responded,
          responseRate,
          recent: reviews.slice(0, 3),
          distribution: dist
        });
      }
    } catch (error) {
      console.error('Error fetching review summary:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (summary.total === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">📊</span>
          <h3 className="text-lg font-semibold text-gray-800">Reviews Summary</h3>
        </div>
        <p className="text-gray-500 text-sm">No reviews yet. They'll appear here when customers leave feedback.</p>
        <button
          onClick={onViewAllClick}
          className="mt-4 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
        >
          Go to Reviews
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
      {/* Header with Rating */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">⭐</span>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Reviews Summary</h3>
            <p className="text-sm text-gray-500">Based on {summary.total} review{summary.total !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-yellow-500">{summary.average}</div>
          <div className="text-sm text-gray-500">out of 5</div>
        </div>
      </div>

      {/* Rating Distribution Bars */}
      <div className="space-y-2 mb-4">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = summary.distribution[star as keyof typeof summary.distribution];
          const percentage = summary.total > 0 ? (count / summary.total) * 100 : 0;
          
          return (
            <div key={star} className="flex items-center gap-2 text-sm">
              <span className="w-8 text-gray-600">{star}★</span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-400 rounded-full"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="w-8 text-xs text-gray-500">{count}</span>
            </div>
          );
        })}
      </div>

      {/* Response Rate Card */}
      <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">💬</span>
            <span className="font-medium text-gray-700">Response Rate</span>
          </div>
          <span className="text-2xl font-bold text-green-600">{summary.responseRate}%</span>
        </div>
        
        {/* Progress Bar */}
        <div className="h-2.5 bg-green-200 rounded-full overflow-hidden mb-2">
          <div 
            className="h-full bg-green-600 rounded-full transition-all duration-500"
            style={{ width: `${summary.responseRate}%` }}
          />
        </div>
        
        <div className="flex justify-between text-xs">
          <span className="text-green-700">Responded: {summary.responded}</span>
          <span className="text-gray-500">Pending: {summary.total - summary.responded}</span>
        </div>

        {/* Feedback based on response rate */}
        <p className="text-xs mt-2 text-gray-600">
          {summary.responseRate >= 80 ? '🌟 Excellent! You respond to most reviews.' :
           summary.responseRate >= 50 ? '👍 Good start. Keep responding to more reviews.' :
           '💡 Responding to reviews helps build trust with customers.'}
        </p>
      </div>

      {/* Recent Reviews Preview */}
      {summary.recent.length > 0 && (
        <div className="space-y-3 mb-4">
          <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <span className="w-1 h-4 bg-yellow-400 rounded-full"></span>
            Recent Reviews:
          </p>
          {summary.recent.map((review, idx) => (
            <div key={idx} className="text-sm border-l-2 border-gray-200 pl-3 hover:border-yellow-400 transition">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className={`text-xs ${star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-gray-600 truncate">{review.review_text}</p>
              {review.company_response ? (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Responded
                </p>
              ) : (
                <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Awaiting response
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={onViewAllClick}
          className="flex-1 px-4 py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 transition text-sm font-medium flex items-center justify-center gap-2"
        >
          <span>View All Reviews</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        
        {summary.responded < summary.total && (
          <button
            onClick={onViewAllClick}
            className="px-4 py-2.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition text-sm font-medium flex items-center justify-center gap-2"
            title="Respond to pending reviews"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span className="hidden sm:inline">Respond</span>
            {summary.total - summary.responded > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-indigo-200 text-indigo-700 rounded-full text-xs">
                {summary.total - summary.responded}
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}