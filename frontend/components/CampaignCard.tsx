'use client';

import React from 'react';
import { Campaign } from '@/types';

interface CampaignCardProps {
  campaign: Campaign;
  showSubmitButton?: boolean;
  onSubmit?: (id: string) => void;
}

export default function CampaignCard({
  campaign,
  showSubmitButton = false,
  onSubmit,
}: CampaignCardProps) {
  const budgetSpent = campaign.budgetSpent || 0;
  const totalBudget = campaign.totalBudget || 0;
  const budgetRemaining = Math.max(0, totalBudget - budgetSpent);
  const percentSpent =
    totalBudget > 0 ? Math.min(100, Math.round((budgetSpent / totalBudget) * 100)) : 0;
  const isBudgetExhausted = budgetRemaining <= 0;
  const isActive = campaign.status === 'active' && !isBudgetExhausted;

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  const formatViews = (views: number) => {
    if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
    if (views >= 1_000) return `${(views / 1_000).toFixed(0)}K`;
    return views.toString();
  };

  const sortedMilestones = [...(campaign.milestones || [])].sort(
    (a, b) => a.viewThreshold - b.viewThreshold
  );

  return (
    <div className="neo-card p-5 bg-white flex flex-col justify-between">
      <div>
        {/* Header row: Platform badge + Status badge */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            {campaign.platform === 'Instagram' ? (
              <span className="neo-badge bg-[#E1306C] text-white">
                Instagram
              </span>
            ) : (
              <span className="neo-badge bg-[#FF0000] text-white">
                YouTube
              </span>
            )}
          </div>

          <span
            className={`neo-badge ${
              isActive
                ? 'bg-[#FFDC58] text-black'
                : isBudgetExhausted
                ? 'bg-gray-200 text-gray-700'
                : 'bg-gray-200 text-gray-800'
            }`}
          >
            {isBudgetExhausted ? 'Exhausted' : campaign.status}
          </span>
        </div>

        {/* Campaign Name & Brand */}
        <div className="mb-4">
          <h3 className="font-bold text-lg text-[#1a1a1a] leading-tight">
            {campaign.name}
          </h3>
          {campaign.brand?.name && (
            <p className="text-xs font-semibold text-gray-500 mt-0.5">
              by {campaign.brand.name}
            </p>
          )}
        </div>

        {/* Budget Section: 3-column grid */}
        <div className="p-3 bg-gray-50 border-2 border-black rounded-sm mb-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[10px] uppercase font-black text-gray-500 tracking-wider">
                Total
              </p>
              <p className="text-xs sm:text-sm font-black text-[#1a1a1a] mt-0.5">
                ₹{formatNumber(totalBudget)}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-black text-gray-500 tracking-wider">
                Spent
              </p>
              <p className="text-xs sm:text-sm font-black text-red-600 mt-0.5">
                ₹{formatNumber(budgetSpent)}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-black text-gray-500 tracking-wider">
                Remaining
              </p>
              <p
                className={`text-xs sm:text-sm font-black mt-0.5 ${
                  budgetRemaining > 0 ? 'text-green-700' : 'text-gray-500'
                }`}
              >
                ₹{formatNumber(budgetRemaining)}
              </p>
            </div>
          </div>

          {/* Progress bar: yellow fill, black border */}
          <div className="w-full h-2.5 bg-white border-2 border-black rounded-sm overflow-hidden mt-2.5">
            <div
              className="h-full bg-[#FFDC58] border-r border-black transition-all"
              style={{ width: `${percentSpent}%` }}
            />
          </div>
        </div>

        {/* Milestone table: 2 columns "Views Needed" / "Payout" with alternating rows */}
        <div className="mb-2">
          <p className="text-[11px] font-black uppercase tracking-wider text-[#1a1a1a] mb-1.5">
            Milestone Ladder
          </p>
          <div className="border-2 border-black rounded-sm overflow-hidden text-xs">
            <div className="grid grid-cols-2 bg-gray-200 border-b-2 border-black px-3 py-1 font-black uppercase text-[10px] tracking-wider text-[#1a1a1a]">
              <span>Views Needed</span>
              <span className="text-right">Payout</span>
            </div>
            <div className="divide-y divide-black/20">
              {sortedMilestones.map((m, idx) => (
                <div
                  key={idx}
                  className={`grid grid-cols-2 px-3 py-1.5 font-bold ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  <span className="text-gray-800">
                    👁 {formatViews(m.viewThreshold)} ({formatNumber(m.viewThreshold)})
                  </span>
                  <span className="text-right font-black text-green-700">
                    ₹{formatNumber(m.payout)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button (if showSubmitButton=true) */}
      {showSubmitButton && (
        <div className="pt-3 mt-2 border-t-2 border-black">
          <button
            type="button"
            onClick={() => onSubmit && onSubmit(campaign._id)}
            disabled={!isActive}
            className={`neo-btn w-full py-2.5 text-xs font-black ${
              isActive
                ? 'bg-[#FFDC58] text-black'
                : 'bg-gray-200 text-gray-500 border-gray-400 cursor-not-allowed shadow-none'
            }`}
          >
            {isBudgetExhausted ? 'Budget Exhausted' : 'Submit Post →'}
          </button>
        </div>
      )}
    </div>
  );
}
