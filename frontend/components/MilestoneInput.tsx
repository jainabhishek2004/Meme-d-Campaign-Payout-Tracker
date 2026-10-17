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
        <label className="eyebrow">
          Milestone Payout Ladder
        </label>
        <span className="text-xs text-[#777773]">
          {milestones.length} {milestones.length === 1 ? 'Tier' : 'Tiers'}
        </span>
      </div>

      {error && (
        <div className="notice notice-error">
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
              className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_2.5rem] items-center gap-2 rounded-xl bg-[#f7f7f4] p-2.5 sm:flex sm:gap-3"
            >
              {/* Views Input */}
              <div className="flex min-w-0 items-center overflow-hidden rounded-lg border border-[#e2e2dc] bg-white focus-within:ring-2 focus-within:ring-[#dce6d8] sm:flex-1">
                <span className="select-none px-3 py-3 text-xs font-medium text-[#777773]">
                  Views
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
                  className="w-full min-w-0 border-0 bg-transparent px-2 py-2.5 text-xs outline-none sm:px-2.5 sm:text-sm"
                  required
                />
              </div>

              {/* Payout Input */}
              <div
                className={`flex min-w-0 items-center overflow-hidden rounded-lg border bg-white focus-within:ring-2 focus-within:ring-[#dce6d8] sm:flex-1 ${
                  isOverBudget ? 'border-red-400' : 'border-[#e2e2dc]'
                }`}
              >
                <span className="select-none px-3 py-3 text-xs font-medium text-[#777773]">
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
                  className="w-full min-w-0 border-0 bg-transparent px-2 py-2.5 text-xs outline-none sm:px-2.5 sm:text-sm"
                  required
                />
              </div>

              {/* Remove Button */}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                disabled={milestones.length <= 1}
                className="col-start-3 row-span-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-lg text-[#777773] transition-colors hover:bg-[#f2efee] hover:text-[#a4473f] disabled:cursor-not-allowed disabled:opacity-30 sm:ml-1"
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
        className="btn btn-secondary w-full border-dashed text-xs"
      >
        <span>+</span> Add Milestone
      </button>
    </div>
  );
}
