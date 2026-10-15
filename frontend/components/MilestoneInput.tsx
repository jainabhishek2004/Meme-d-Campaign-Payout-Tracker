'use client';

import React from 'react';
import { Milestone } from '@/types';

interface MilestoneInputProps {
  milestones: Array<{ viewThreshold: number; payout: number }>;
  onChange: (milestones: Array<{ viewThreshold: number; payout: number }>) => void;
  error?: string;
  totalBudget?: number;
}

export default function MilestoneInput({
  milestones,
  onChange,
  error,
  totalBudget,
}: MilestoneInputProps) {
  const handleAdd = () => {
    const last = milestones[milestones.length - 1];
    const newViews = last ? last.viewThreshold * 2 : 10000;
    const newPayout = last ? last.payout * 2 : 1000;
    onChange([...milestones, { viewThreshold: newViews, payout: newPayout }]);
  };

  const handleRemove = (index: number) => {
    if (milestones.length <= 1) return;
    const updated = milestones.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleChange = (
    index: number,
    field: keyof Milestone,
    value: number
  ) => {
    const updated = [...milestones];
    updated[index] = {
      ...updated[index],
      [field]: Math.max(0, value),
    };
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-black uppercase tracking-wider text-[#1a1a1a]">
          Milestone Payout Ladder
        </label>
        <span className="text-xs font-semibold text-gray-600">
          {milestones.length} {milestones.length === 1 ? 'Tier' : 'Tiers'}
        </span>
      </div>

      {error && (
        <div className="p-2.5 rounded-sm bg-red-100 border-2 border-red-600 text-xs font-bold text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-2">
        {milestones.map((milestone, index) => {
          const isOverBudget =
            typeof totalBudget === 'number' &&
            totalBudget > 0 &&
            milestone.payout > totalBudget;

          return (
            <div
              key={index}
              className="flex items-center gap-2 p-2 bg-gray-50 border-2 border-black rounded-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              {/* Views Input */}
              <div className="flex-1 flex items-center border-2 border-black bg-white rounded-sm overflow-hidden focus-within:ring-2 focus-within:ring-black">
                <span className="px-2.5 py-2 bg-gray-200 border-r-2 border-black text-xs font-black select-none">
                  👁
                </span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={milestone.viewThreshold || ''}
                  onChange={(e) =>
                    handleChange(index, 'viewThreshold', parseInt(e.target.value) || 0)
                  }
                  placeholder="e.g. 10000"
                  className="w-full px-2.5 py-1.5 text-xs sm:text-sm font-bold text-[#1a1a1a] outline-none"
                  required
                />
              </div>

              {/* Payout Input */}
              <div
                className={`flex-1 flex items-center border-2 ${
                  isOverBudget ? 'border-red-600' : 'border-black'
                } bg-white rounded-sm overflow-hidden focus-within:ring-2 focus-within:ring-black`}
              >
                <span className="px-2.5 py-2 bg-[#FFDC58] border-r-2 border-black text-xs font-black select-none">
                  ₹
                </span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={milestone.payout || ''}
                  onChange={(e) =>
                    handleChange(index, 'payout', parseFloat(e.target.value) || 0)
                  }
                  placeholder="e.g. 1500"
                  className="w-full px-2.5 py-1.5 text-xs sm:text-sm font-bold text-[#1a1a1a] outline-none"
                  required
                />
              </div>

              {/* Remove Button */}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                disabled={milestones.length <= 1}
                className="w-8 h-8 sm:w-9 sm:h-9 flex-shrink-0 bg-red-500 hover:bg-red-600 text-white font-black text-lg border-2 border-black rounded-sm flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Remove tier"
                aria-label="Remove tier"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      {/* Dashed "+ Add Milestone" button */}
      <button
        type="button"
        onClick={handleAdd}
        className="w-full py-2.5 border-2 border-dashed border-black bg-white hover:bg-[#FFDC58] font-black text-xs uppercase tracking-wider rounded-sm transition-colors flex items-center justify-center gap-1.5 shadow-none"
      >
        <span>+</span> Add Milestone
      </button>
    </div>
  );
}
