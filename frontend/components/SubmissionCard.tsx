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
  return (
    <article className="surface flex min-w-0 flex-col justify-between p-4 sm:p-5">
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed inset-x-4 top-20 z-[60] mx-auto flex max-w-xl items-start justify-between gap-4 rounded-xl border border-[#efd2ce] bg-[#fbefed] px-4 py-3 text-sm font-medium text-[#8e3c35] shadow-lg"
        >
          <span>{error}</span>
          <button
            type="button"
            aria-label="Dismiss error notification"
            onClick={() => setError(null)}
            className="shrink-0 px-1 text-lg leading-none"
          >
            ×
          </button>
        </div>
      )}

      <div>

        <div className="mb-3 flex items-start justify-between gap-2">
          <h4 className="line-clamp-2 break-words text-base font-medium leading-snug tracking-[-.025em] sm:text-lg">
            {submission.campaign?.name || 'Campaign Post'}
          </h4>
          <span className="platform-label shrink-0">
            {platform}
          </span>
        </div>

        <div className="mb-3">
          <a
            href={submission.postLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex max-w-full items-center gap-1.5 truncate rounded-lg bg-[#f5f5f2] px-3 py-2.5 font-mono text-[11px] text-[#5b5b56] transition-colors hover:bg-[#efefeb]"
          >
            <span className="truncate">{submission.postLink}</span>
            <span className="flex-shrink-0 font-sans font-black">↗</span>
          </a>
        </div>

        {submission.isFlagged && (
          <div className="notice mb-3 flex items-start gap-2 border border-[#eadfc7] bg-[#f8f3e9] text-xs text-[#75603b]">
            <span className="leading-none">!</span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider">
                Flagged: View Spike Detected
              </p>
              <p className="mt-0.5 text-[11px]">
                {submission.flagReason || 'Unusually rapid view increase detected.'}
              </p>
            </div>
          </div>
        )}

        <div className="mb-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-[#f5f5f2] p-3.5">
            <p className="eyebrow !text-[9px]">
              Views
            </p>
            <p className="mt-1 text-xl font-medium tracking-[-.04em]">
              {formatNumber(submission.views || 0)}
            </p>
          </div>

          <div className="rounded-xl bg-[#e9eee7] p-3.5">
            <p className="eyebrow !text-[9px]">
              Earned
            </p>
            <p className="mt-1 text-xl font-medium tracking-[-.04em]">
              ₹{formatNumber(submission.currentPayout || 0)}
            </p>
          </div>
        </div>

        <div className="mb-3 rounded-xl bg-[#f8f8f6] p-3.5">
          <p className="mb-2 text-[11px] font-medium text-[#777773]">
            Update view count (simulates platform data)
          </p>
          <form onSubmit={handleUpdateViews} className="flex min-w-0 gap-2">
            <input
              type="number"
              min={submission.views || 0}
              step="1"
              value={newViews}
              onChange={(e) => setNewViews(Number(e.target.value))}
              className="field min-w-0 !min-h-10 !px-3 !py-1 text-xs"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-sm shrink-0 disabled:opacity-50"
            >
              {loading ? '...' : 'Update'}
            </button>
          </form>
          {success && (
            <p className="mt-2 text-xs text-[#526b50]">
              Views and payout updated.
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-[#efefec] pt-3 text-[11px] text-[#85857f]">
        <span>
          Submitted{' '}
          {submission.createdAt
            ? new Date(submission.createdAt).toLocaleDateString()
            : 'Recently'}
        </span>
      </div>
    </article>
  );
}
