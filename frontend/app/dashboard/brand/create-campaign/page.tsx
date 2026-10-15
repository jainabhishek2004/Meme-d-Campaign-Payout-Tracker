'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { campaignApi } from '@/lib/api';
import { getUser, isAuthenticated } from '@/lib/auth';
import { Milestone } from '@/types';
import MilestoneInput from '@/components/MilestoneInput';

export default function CreateCampaignPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState<'Instagram' | 'YouTube'>('Instagram');
  const [totalBudget, setTotalBudget] = useState<number | ''>(50000);
  const [milestones, setMilestones] = useState<Milestone[]>([
    { viewThreshold: 10000, payout: 1500 },
    { viewThreshold: 50000, payout: 6000 },
    { viewThreshold: 100000, payout: 12000 },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }
    const user = getUser();
    if (user?.role !== 'brand') {
      router.replace('/dashboard/creator');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please provide a campaign name.');
      return;
    }

    const budgetNum = Number(totalBudget);
    if (!budgetNum || budgetNum <= 0) {
      setError('Please enter a valid total budget greater than ₹0.');
      return;
    }

    if (!milestones.length) {
      setError('Please add at least one milestone tier.');
      return;
    }

    for (let i = 0; i < milestones.length; i++) {
      const m = milestones[i];
      if (!m.viewThreshold || m.viewThreshold <= 0) {
        setError(`Milestone tier #${i + 1} views must be greater than 0.`);
        return;
      }
      if (!m.payout || m.payout <= 0) {
        setError(`Milestone tier #${i + 1} payout must be greater than ₹0.`);
        return;
      }
      if (m.payout > budgetNum) {
        setError(
          `Milestone tier #${i + 1} payout (₹${m.payout}) exceeds the total budget (₹${budgetNum}).`
        );
        return;
      }
    }

    setLoading(true);
    try {
      await campaignApi.create({
        name: name.trim(),
        platform,
        totalBudget: budgetNum,
        milestones,
      });

      router.push('/dashboard/brand');
    } catch (err: any) {
      setError(err.message || 'Failed to create campaign. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed inset-x-4 top-20 z-[60] mx-auto flex max-w-2xl items-start justify-between gap-4 border-2 border-red-600 bg-red-100 px-4 py-3 text-sm font-bold text-red-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          <div className="flex items-start gap-3">
            <span aria-hidden="true" className="font-black">!</span>
            <span>{error}</span>
          </div>
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
      {/* 7. Back link "← Back to Dashboard" */}
      <Link
        href="/dashboard/brand"
        className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-black hover:underline mb-4 select-none"
      >
        ← Back to Dashboard
      </Link>

      {/* Form container: Center the form, max-w-2xl, white neo-card container */}
      <div className="neo-card bg-white p-6 sm:p-8">
        {/* 1. Page title: "Launch a New Campaign" with yellow left-border accent */}
        <div className="border-l-4 border-[#FFDC58] pl-3.5 mb-6">
          <h1 className="text-2xl sm:text-3xl font-black text-[#1a1a1a] tracking-tight">
            Launch a New Campaign
          </h1>
          <p className="text-xs font-semibold text-gray-600 mt-1">
            Deposit campaign funds to incentivize viral creators with guaranteed view milestones.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 2. Campaign name input */}
          <div>
            <label
              className="block text-xs font-black uppercase tracking-wider text-[#1a1a1a] mb-1.5"
              htmlFor="name"
            >
              Campaign Name
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Swiggy Instamart Midnight Craving Memes"
              className="neo-input"
            />
          </div>

          {/* 3. Platform selector: two large card buttons (Instagram pink card vs YouTube red card) */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-[#1a1a1a] mb-2">
              Select Platform
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPlatform('Instagram')}
                className={`p-4 rounded-sm text-left font-black transition-all text-white flex items-center justify-between ${
                  platform === 'Instagram'
                    ? 'bg-[#E1306C] border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-[#E1306C] opacity-80 border-2 border-black hover:opacity-100'
                }`}
              >
                <div>
                  <div className="text-xl mb-1">📸</div>
                  <div className="text-sm font-black tracking-wide">Instagram</div>
                  <div className="text-[11px] font-semibold text-white/90">
                    Reels & Posts
                  </div>
                </div>
                {platform === 'Instagram' && (
                  <span className="text-xl bg-white text-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-black">
                    ✓
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setPlatform('YouTube')}
                className={`p-4 rounded-sm text-left font-black transition-all text-white flex items-center justify-between ${
                  platform === 'YouTube'
                    ? 'bg-[#FF0000] border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                    : 'bg-[#FF0000] opacity-80 border-2 border-black hover:opacity-100'
                }`}
              >
                <div>
                  <div className="text-xl mb-1">▶️</div>
                  <div className="text-sm font-black tracking-wide">YouTube</div>
                  <div className="text-[11px] font-semibold text-white/90">
                    Shorts & Videos
                  </div>
                </div>
                {platform === 'YouTube' && (
                  <span className="text-xl bg-white text-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-black">
                    ✓
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* 4. Total Budget (₹) number input */}
          <div>
            <label
              className="block text-xs font-black uppercase tracking-wider text-[#1a1a1a] mb-1.5"
              htmlFor="totalBudget"
            >
              Total Budget (₹)
            </label>
            <input
              id="totalBudget"
              type="number"
              min="1"
              step="any"
              required
              value={totalBudget}
              onChange={(e) =>
                setTotalBudget(e.target.value === '' ? '' : Number(e.target.value))
              }
              placeholder="50000"
              className="neo-input"
            />
            <p className="text-[11px] font-semibold text-gray-500 mt-1">
              Maximum total milestone payouts disbursed to viral submissions.
            </p>
          </div>

          {/* 5. Milestone Ladder section (using MilestoneInput component) */}
          <div className="pt-2 border-t-2 border-black">
            <MilestoneInput
              milestones={milestones}
              onChange={setMilestones}
              totalBudget={typeof totalBudget === 'number' ? totalBudget : undefined}
            />
          </div>

          {/* 6. Full-width "Launch Campaign 🚀" yellow neo-btn */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="neo-btn bg-[#FFDC58] text-black w-full py-3.5 text-base font-black disabled:opacity-50"
            >
              {loading ? 'Launching Campaign...' : 'Launch Campaign 🚀'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
