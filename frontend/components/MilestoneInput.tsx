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
            <div key={index} className="milestone-row">
              <div className="milestone-control flex min-w-0 items-center overflow-hidden rounded-lg border border-[#e2e2dc] bg-white focus-within:ring-2 focus-within:ring-[#dce6d8]">
                <span className="select-none px-3 py-3 text-xs font-medium text-[#777773]">
                  Views
                </span>
                <input
                  id={`milestone-views-${index}`}
                  type="number"
                  min="1"
                  step="1"
                  value={milestone.viewThreshold || ''}
                  onChange={(e) =>
                    handleChange(index, 'viewThreshold', parseFloat(e.target.value) || 0)
                  }
                  placeholder="e.g. 10000"
                  className="w-full min-w-0 border-0 bg-transparent px-2 py-2.5 text-xs outline-none sm:px-2.5 sm:text-sm"
                  aria-label={`Tier ${index + 1} view threshold`}
                  required
                />
              </div>

              <div className="milestone-control">
                <div className={`flex min-w-0 items-center overflow-hidden rounded-lg border bg-white focus-within:ring-2 focus-within:ring-[#dce6d8] ${isOverBudget ? 'border-red-400' : 'border-[#e2e2dc]'}`}>
                  <span className="select-none px-3 py-3 text-xs font-medium text-[#777773]">₹</span>
                  <input
                    id={`milestone-payout-${index}`}
                    type="number"
                    min="1"
                    step="any"
                    value={milestone.payout || ''}
                    onChange={(e) => handleChange(index, 'payout', parseFloat(e.target.value) || 0)}
                    placeholder="e.g. 1500"
                    className="w-full min-w-0 border-0 bg-transparent px-2 py-2.5 text-xs outline-none sm:px-2.5 sm:text-sm"
                    aria-label={`Tier ${index + 1} payout in rupees`}
                    aria-invalid={isOverBudget}
                    aria-describedby={isOverBudget ? `milestone-payout-error-${index}` : undefined}
                    required
                  />
                </div>
                {isOverBudget && <p id={`milestone-payout-error-${index}`} className="milestone-field-error">Over budget by ₹{new Intl.NumberFormat('en-IN').format(milestone.payout - (totalBudget || 0))}. Lower this payout or increase the campaign budget.</p>}
              </div>

              <button
                type="button"
                onClick={() => handleRemove(index)}
                disabled={milestones.length <= 1}
                className="milestone-remove flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-lg text-[#777773] transition-colors hover:bg-[#f2efee] hover:text-[#a4473f] disabled:cursor-not-allowed disabled:opacity-30"
                title="Remove tier"
                aria-label="Remove tier"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

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
