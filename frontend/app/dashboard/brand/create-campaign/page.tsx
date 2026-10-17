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
    { viewThreshold: 10000, payout: 1500 }, { viewThreshold: 50000, payout: 6000 }, { viewThreshold: 100000, payout: 12000 },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) { router.replace('/login'); return; }
    if (getUser()?.role !== 'brand') router.replace('/dashboard/creator');
  }, [router]);

  useEffect(() => {
    if (!error) return;
    const timeout = window.setTimeout(() => setError(null), 8000);
    return () => window.clearTimeout(timeout);
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    if (!name.trim()) { setError('Add a campaign name so creators can identify this opportunity.'); return; }
    const budget = Number(totalBudget);
    if (totalBudget === '' || !Number.isFinite(budget) || budget <= 0) { setError('Enter a campaign budget greater than ₹0. This is the maximum amount available for payouts.'); return; }
    if (!milestones.length) { setError('Add at least one milestone with a view target and payout.'); return; }
    for (let i = 0; i < milestones.length; i++) {
      const item = milestones[i];
      if (!Number.isSafeInteger(item.viewThreshold) || item.viewThreshold <= 0) { setError(`Tier ${i + 1} needs a positive whole-number view target, such as 10,000.`); return; }
      if (!Number.isFinite(item.payout) || item.payout <= 0) { setError(`Tier ${i + 1} needs a payout greater than ₹0.`); return; }
      if (item.payout > budget) { setError(`Tier ${i + 1} offers ₹${new Intl.NumberFormat('en-IN').format(item.payout)}, which is more than the ₹${new Intl.NumberFormat('en-IN').format(budget)} campaign budget. Lower this tier’s payout or increase the total budget.`); return; }
    }
    const sortedMilestones = [...milestones].sort((a, b) => a.viewThreshold - b.viewThreshold);
    for (let i = 1; i < sortedMilestones.length; i++) {
      const previous = sortedMilestones[i - 1];
      const current = sortedMilestones[i];
      if (current.viewThreshold === previous.viewThreshold) { setError(`Two tiers use the same view target (${new Intl.NumberFormat('en-IN').format(current.viewThreshold)} views). Give each tier a different target.`); return; }
      if (current.payout <= previous.payout) { setError(`The ${new Intl.NumberFormat('en-IN').format(current.viewThreshold)}-view tier must pay more than the ${new Intl.NumberFormat('en-IN').format(previous.viewThreshold)}-view tier. Increase its payout.`); return; }
    }
    setLoading(true);
    try {
      await campaignApi.create({ name: name.trim(), platform, totalBudget: budget, milestones });
      router.push('/dashboard/brand');
    } catch (err: any) { setError(err.message || 'Could not create the campaign. Please try again.'); setLoading(false); }
  };

  return <div className="site-shell max-w-3xl py-6 sm:py-10">
    {error && <div className="toast-region"><div role="alert" aria-live="assertive" className="toast-error"><span aria-hidden="true" className="toast-error-icon">!</span><div><p className="toast-error-title">Campaign needs attention</p><p className="toast-error-message">{error}</p></div><button type="button" aria-label="Dismiss error" onClick={() => setError(null)} className="toast-close">×</button></div></div>}
    <Link href="/dashboard/brand" className="text-xs text-[#777773] transition-colors hover:text-[#171717]">← Back to campaigns</Link>
    <section className="surface mt-4 p-4 sm:mt-5 sm:p-7">
      <header className="mb-6 sm:mb-7"><p className="eyebrow">Campaign setup</p><h1 className="mt-2 text-3xl font-medium tracking-[-.055em] sm:text-4xl">Create a campaign</h1><p className="mt-2 max-w-xl text-sm leading-6 text-[#777773]">Set a clear budget and a reward ladder creators can understand before they post.</p></header>
      <form noValidate onSubmit={handleSubmit} className="space-y-6 sm:space-y-7">
        <div><label className="field-label" htmlFor="name">Campaign name</label><input id="name" type="text" required maxLength={100} value={name} onChange={(e) => { setName(e.target.value); setError(null); }} placeholder="e.g. Summer launch creator campaign" className="field" /></div>
        <fieldset><legend className="field-label mb-2">Platform</legend><div className="grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-2">{(['Instagram', 'YouTube'] as const).map((item) => <button key={item} type="button" aria-pressed={platform === item} onClick={() => { setPlatform(item); setError(null); }} className="auth-choice"><span className="flex items-center justify-between"><span className="text-sm font-medium">{item}</span>{platform === item && <span aria-hidden="true" className="text-sm text-[#687d62]">✓</span>}</span><span className="mt-1 block text-xs text-[#777773]">{item === 'Instagram' ? 'Reels and posts' : 'Shorts and videos'}</span></button>)}</div></fieldset>
        <div><label className="field-label" htmlFor="totalBudget">Campaign budget (₹)</label><input id="totalBudget" type="number" min="1" step="1" required value={totalBudget} onChange={(e) => { setTotalBudget(e.target.value === '' ? '' : Number(e.target.value)); setError(null); }} placeholder="50000" className="field" /><p className="mt-1.5 text-xs text-[#85857f]">Maximum amount available for all creator payouts.</p></div>
        <div className="border-t border-[#e8e7e3] pt-6"><MilestoneInput milestones={milestones} onChange={(nextMilestones) => { setMilestones(nextMilestones); setError(null); }} totalBudget={typeof totalBudget === 'number' ? totalBudget : undefined} /></div>
        <div className="border-t border-[#e8e7e3] pt-5"><button type="submit" disabled={loading} className="btn btn-primary w-full sm:w-auto">{loading ? 'Creating campaign…' : 'Create campaign'} <span aria-hidden="true">↗</span></button><p className="mt-2 text-xs text-[#85857f]">You can review budget usage from your campaign dashboard.</p></div>
      </form>
    </section>
  </div>;
}
