'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { campaignApi } from '@/lib/api';
import { getUser, isAuthenticated } from '@/lib/auth';
import { Campaign, User } from '@/types';
import CampaignCard from '@/components/CampaignCard';

export default function BrandDashboardPage() {
  const router = useRouter();
  const [, setUser] = useState<User | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await campaignApi.getMy();
      setCampaigns(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load brand campaigns.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }
    const currentUser = getUser();
    if (currentUser?.role !== 'brand') {
      router.replace('/dashboard/creator');
      return;
    }
    setUser(currentUser);
    fetchCampaigns();
  }, [router, fetchCampaigns]);

  const totalBudget = campaigns.reduce((acc, c) => acc + (Number(c.totalBudget) || 0), 0);
  const totalPaidOut = campaigns.reduce((acc, c) => acc + (Number(c.budgetSpent) || 0), 0);
  const budgetRemaining = Math.max(0, totalBudget - totalPaidOut);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b-2 border-black pb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#1a1a1a] tracking-tight">
            Campaign Hub
          </h1>
          <p className="text-sm font-semibold text-gray-600 mt-1">
            Manage your campaigns and track performance
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchCampaigns}
            disabled={loading}
            className="neo-btn bg-white text-black px-3.5 py-2.5 text-xs font-black"
            title="Refresh campaigns"
            aria-label="Refresh campaigns"
          >
            ↻ Refresh
          </button>
          <Link
            href="/dashboard/brand/create-campaign"
            className="neo-btn bg-[#FFDC58] text-black px-5 py-2.5 text-xs sm:text-sm font-black"
          >
            + New Campaign
          </Link>
        </div>
      </div>

      {/* Stats Row: 4 cards, neo-card style */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: # Campaigns */}
        <div className="neo-card p-5 bg-white">
          <p className="text-xs font-black uppercase tracking-wider text-gray-500">
            # Campaigns
          </p>
          <p className="text-3xl font-black text-[#1a1a1a] mt-2">
            {campaigns.length}
          </p>
          <p className="text-[11px] font-bold text-gray-500 mt-1">
            {campaigns.filter((c) => c.status === 'active').length} active
          </p>
        </div>

        {/* Card 2: Total Budget */}
        <div className="neo-card p-5 bg-white">
          <p className="text-xs font-black uppercase tracking-wider text-gray-500">
            Total Budget
          </p>
          <p className="text-3xl font-black text-[#1a1a1a] mt-2">
            ₹{formatNumber(totalBudget)}
          </p>
          <p className="text-[11px] font-bold text-gray-500 mt-1">
            Across all campaigns
          </p>
        </div>

        {/* Card 3: Total Paid Out */}
        <div className="neo-card p-5 bg-white">
          <p className="text-xs font-black uppercase tracking-wider text-gray-500">
            Total Paid Out
          </p>
          <p className="text-3xl font-black text-red-600 mt-2">
            ₹{formatNumber(totalPaidOut)}
          </p>
          <p className="text-[11px] font-bold text-gray-500 mt-1">
            Verified milestone rewards
          </p>
        </div>

        {/* Card 4: Budget Remaining */}
        <div className="neo-card p-5 bg-[#FFDC58]">
          <p className="text-xs font-black uppercase tracking-wider text-black">
            Budget Remaining
          </p>
          <p className="text-3xl font-black text-black mt-2">
            ₹{formatNumber(budgetRemaining)}
          </p>
          <p className="text-[11px] font-black text-black/80 mt-1">
            Available escrow balance
          </p>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-100 border-2 border-red-600 text-red-800 text-xs font-bold rounded-sm flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={fetchCampaigns} className="underline font-black ml-4">
            Retry
          </button>
        </div>
      )}

      {/* Campaigns Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black text-[#1a1a1a] uppercase tracking-wide">
            Your Active Campaigns
          </h2>
          <span className="neo-badge bg-white text-black">
            {campaigns.length} Total
          </span>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="neo-card p-6 bg-white animate-pulse space-y-4"
              >
                <div className="h-4 bg-gray-200 border border-black rounded-sm w-1/3" />
                <div className="h-6 bg-gray-200 border border-black rounded-sm w-3/4" />
                <div className="h-20 bg-gray-100 border border-black rounded-sm" />
                <div className="h-10 bg-gray-200 border border-black rounded-sm" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State: dashed border box */}
        {!loading && campaigns.length === 0 && !error && (
          <div className="border-2 border-dashed border-black bg-white rounded-sm p-12 text-center max-w-xl mx-auto shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="text-4xl mb-3">🚀</div>
            <h3 className="text-xl font-black text-[#1a1a1a] mb-2">
              No Campaigns Launched Yet
            </h3>
            <p className="text-xs font-semibold text-gray-600 mb-6 max-w-sm mx-auto">
              Launch your first campaign, configure performance view milestones, and only pay creators when views hit target.
            </p>
            <Link
              href="/dashboard/brand/create-campaign"
              className="neo-btn bg-[#FFDC58] text-black px-6 py-3 text-sm font-black"
            >
              + Create First Campaign
            </Link>
          </div>
        )}

        {/* Campaign Grid (2-3 columns on desktop) */}
        {!loading && campaigns.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((camp) => (
              <CampaignCard
                key={camp._id}
                campaign={camp}
                showSubmitButton={false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
