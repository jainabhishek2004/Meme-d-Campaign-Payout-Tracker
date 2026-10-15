'use client';

import React, { useEffect, useState } from 'react';
import { Submission } from '@/types';
import { submissionApi } from '@/lib/api';

interface SubmissionCardProps {
  submission: Submission;
  onViewsUpdated?: () => void;
}

export default function SubmissionCard({
  submission,
  onViewsUpdated,
}: SubmissionCardProps) {
  const [newViews, setNewViews] = useState<number>(submission.views || 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setNewViews(submission.views || 0);
  }, [submission._id, submission.views]);

  useEffect(() => {
    if (!error) return;
    const timeout = window.setTimeout(() => setError(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [error]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  const handleUpdateViews = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentViews = submission.views || 0;
    const requestedViews = Number(newViews);
    if (!Number.isSafeInteger(requestedViews) || requestedViews < currentViews) {
      setError(`Views cannot be lower than the current count of ${formatNumber(currentViews)}.`);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await submissionApi.updateViews(submission._id, Number(newViews));
      setSuccess(true);
      if (onViewsUpdated) {
        onViewsUpdated();
      }
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update views');
    } finally {
      setLoading(false);
    }
  };

  const platform = submission.campaign?.platform || 'Instagram';
  const platformColor = platform === 'Instagram' ? 'bg-[#E1306C]' : 'bg-[#FF0000]';

  return (
    <div className="neo-card p-5 bg-white flex flex-col justify-between">
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed inset-x-4 top-20 z-[60] mx-auto flex max-w-xl items-start justify-between gap-4 border-2 border-red-600 bg-red-100 px-4 py-3 text-sm font-bold text-red-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          <span>{error}</span>
          <button
            type="button"
            aria-label="Dismiss error notification"
            onClick={() => setError(null)}
            className="shrink-0 px-1 text-lg leading-none hover:text-black"
          >
            ×
          </button>
        </div>
      )}

      <div>
        {/* Top: Campaign name + platform badge */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="font-bold text-base text-[#1a1a1a] leading-tight line-clamp-1">
            {submission.campaign?.name || 'Campaign Post'}
          </h4>
          <span className={`neo-badge ${platformColor} text-white flex-shrink-0`}>
            {platform}
          </span>
        </div>

        {/* Post link: truncated with external link icon */}
        <div className="mb-3">
          <a
            href={submission.postLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-black bg-gray-100 hover:bg-[#FFDC58] px-2.5 py-1.5 border-2 border-black rounded-sm truncate max-w-full transition-colors"
          >
            <span className="truncate">{submission.postLink}</span>
            <span className="flex-shrink-0 font-sans font-black">↗</span>
          </a>
        </div>

        {/* Spike Detection Flag (Bonus Feature) */}
        {submission.isFlagged && (
          <div className="mb-3 p-2 bg-amber-100 border-2 border-amber-600 text-amber-950 text-xs font-bold rounded-sm flex items-start gap-1.5 shadow-[2px_2px_0px_0px_rgba(217,119,6,1)]">
            <span className="text-base leading-none">🚩</span>
            <div>
              <p className="font-black uppercase tracking-wider text-[10px] text-amber-800">
                Flagged: View Spike Detected
              </p>
              <p className="text-[11px] font-semibold text-amber-900 mt-0.5">
                {submission.flagReason || 'Unusually rapid view increase detected.'}
              </p>
            </div>
          </div>
        )}

        {/* Two stat boxes side by side */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 bg-white border-2 border-black rounded-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">
              👁 Views
            </p>
            <p className="text-xl font-black text-[#1a1a1a] mt-0.5">
              {formatNumber(submission.views || 0)}
            </p>
          </div>

          <div className="p-3 bg-[#FFDC58] border-2 border-black rounded-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-[10px] font-black uppercase tracking-wider text-black">
              💰 Earned
            </p>
            <p className="text-xl font-black text-black mt-0.5">
              ₹{formatNumber(submission.currentPayout || 0)}
            </p>
          </div>
        </div>

        {/* Simulate Views section */}
        <div className="p-3 bg-gray-50 border-2 border-black rounded-sm mb-3">
          <p className="text-[11px] font-bold text-gray-700 mb-2">
            Update view count (simulates platform data)
          </p>
          <form onSubmit={handleUpdateViews} className="flex gap-2">
            <input
              type="number"
              min={submission.views || 0}
              step="1"
              value={newViews}
              onChange={(e) => setNewViews(Number(e.target.value))}
              className="neo-input !py-1 !px-2.5 text-xs font-bold"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="neo-btn bg-[#FFDC58] text-black px-3 py-1 text-xs font-black flex-shrink-0 disabled:opacity-50"
            >
              {loading ? '...' : 'Update'}
            </button>
          </form>
          {success && (
            <p className="text-green-700 text-xs font-bold mt-2">
              ✓ Views updated & payout refreshed!
            </p>
          )}
        </div>
      </div>

      {/* Timestamp at bottom */}
      <div className="pt-2 border-t-2 border-black/10 text-[11px] font-bold text-gray-500 flex items-center justify-between">
        <span>
          Submitted{' '}
          {submission.createdAt
            ? new Date(submission.createdAt).toLocaleDateString()
            : 'Recently'}
        </span>
      </div>
    </div>
  );
}
