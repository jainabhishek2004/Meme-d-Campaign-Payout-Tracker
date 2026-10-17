'use client';

import React from 'react';
import { Campaign } from '@/types';

interface CampaignCardProps { campaign: Campaign; showSubmitButton?: boolean; onSubmit?: (id: string) => void; }

export default function CampaignCard({ campaign, showSubmitButton = false, onSubmit }: CampaignCardProps) {
  const spent = campaign.budgetSpent || 0;
  const budget = campaign.totalBudget || 0;
  const remaining = Math.max(0, budget - spent);
  const percent = budget > 0 ? Math.min(100, Math.round(spent / budget * 100)) : 0;
  const exhausted = remaining <= 0;
  const active = campaign.status === 'active' && !exhausted;
  const money = (value: number) => `₹${new Intl.NumberFormat('en-IN').format(value)}`;
  const views = (value: number) => value >= 1_000_000 ? `${(value / 1_000_000).toFixed(1)}M` : value >= 1_000 ? `${(value / 1_000).toFixed(0)}K` : String(value);
  const milestones = [...(campaign.milestones || [])].sort((a, b) => a.viewThreshold - b.viewThreshold);

  return <article className="surface flex min-w-0 flex-col p-3.5 sm:p-4">
    <div className={`campaign-cover ${campaign.platform === 'Instagram' ? 'platform-instagram' : 'platform-youtube'} flex flex-col justify-between`}>
      <div className="flex items-center justify-between gap-2"><span className="platform-label">{campaign.platform}</span><span className={`rounded-full px-2.5 py-1 text-[10px] font-medium capitalize ${active ? 'bg-white/75 text-[#52664e]' : 'bg-white/75 text-[#777773]'}`}>{exhausted ? 'Budget used' : campaign.status}</span></div>
      <div className="relative z-10"><p className="text-xs text-[#6f716b]">{campaign.brand?.name || 'Creator campaign'}</p><h3 className="mt-1 max-w-[90%] break-words text-2xl font-medium leading-tight tracking-[-.05em]">{campaign.name}</h3></div>
    </div>
    <div className="px-1 pb-1 pt-4">
      <div className="grid grid-cols-3 gap-2">
        {[['Budget', money(budget)], ['Spent', money(spent)], ['Available', money(remaining)]].map(([label, value]) => <div key={label} className="min-w-0"><p className="eyebrow !text-[9px]">{label}</p><p className="mt-1 truncate text-sm font-medium">{value}</p></div>)}
      </div>
      <div className="progress-track mt-3" role="progressbar" aria-label="Campaign budget spent" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}><div className="progress-fill" style={{ width: `${percent}%` }} /></div>
      <div className="mt-5 flex items-center justify-between"><p className="eyebrow">Milestones</p><span className="text-[11px] text-[#85857f]">{milestones.length} tiers</span></div>
      <div className="mt-2 divide-y divide-[#efefec] rounded-xl bg-[#f8f8f6] px-3">
        {milestones.map((m, idx) => <div key={`${m.viewThreshold}-${idx}`} className="flex items-center justify-between gap-2 py-2.5 text-xs"><span className="text-[#777773]">{views(m.viewThreshold)} views</span><span className="font-medium">{money(m.payout)}</span></div>)}
      </div>
      {showSubmitButton && <button type="button" onClick={() => onSubmit?.(campaign._id)} disabled={!active} className={`btn mt-4 w-full ${active ? 'btn-primary' : 'btn-secondary'}`}>{exhausted ? 'Budget fully allocated' : active ? 'Submit a post' : 'Campaign closed'}{active && <span aria-hidden="true">↗</span>}</button>}
    </div>
  </article>;
}
