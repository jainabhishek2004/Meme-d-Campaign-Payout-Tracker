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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    if (!name.trim()) { setError('Please provide a campaign name.'); return; }
    const budget = Number(totalBudget);
    if (!Number.isFinite(budget) || budget <= 0) { setError('Enter a valid total budget greater than ₹0.'); return; }
    if (!milestones.length) { setError('Add at least one milestone tier.'); return; }
    for (let i = 0; i < milestones.length; i++) {
      const item = milestones[i];
      if (!Number.isSafeInteger(item.viewThreshold) || item.viewThreshold <= 0) { setError(`Milestone ${i + 1}: views must be a positive whole number.`); return; }
      if (!Number.isFinite(item.payout) || item.payout <= 0) { setError(`Milestone ${i + 1}: payout must be greater than ₹0.`); return; }
      if (item.payout > budget) { setError(`Milestone ${i + 1} payout (₹${item.payout}) exceeds the campaign budget (₹${budget}).`); return; }
    }
    setLoading(true);
    try {
      await campaignApi.create({ name: name.trim(), platform, totalBudget: budget, milestones });
      router.push('/dashboard/brand');
    } catch (err: any) { setError(err.message || 'Could not create the campaign. Please try again.'); setLoading(false); }
  };

  return <div className="site-shell max-w-3xl py-9 sm:py-14">
    <Link href="/dashboard/brand" className="text-xs text-[#777773] transition-colors hover:text-[#171717]">← Back to campaigns</Link>
    <section className="surface mt-5 p-5 sm:p-8">
      <header className="mb-8"><p className="eyebrow">Campaign setup</p><h1 className="mt-2 text-3xl font-medium tracking-[-.055em] sm:text-4xl">Create a campaign</h1><p className="mt-2 max-w-xl text-sm leading-6 text-[#777773]">Set a clear budget and a reward ladder creators can understand before they post.</p></header>
      {error && <div role="alert" aria-live="assertive" className="notice notice-error mb-6 flex items-start justify-between gap-3"><span>{error}</span><button type="button" aria-label="Dismiss error" onClick={() => setError(null)}>×</button></div>}
      <form onSubmit={handleSubmit} className="space-y-7">
        <div><label className="field-label" htmlFor="name">Campaign name</label><input id="name" type="text" required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Summer launch creator campaign" className="field" /></div>
        <fieldset><legend className="field-label mb-2">Platform</legend><div className="grid grid-cols-2 gap-2.5">{(['Instagram', 'YouTube'] as const).map((item) => <button key={item} type="button" aria-pressed={platform === item} onClick={() => setPlatform(item)} className="auth-choice"><span className="flex items-center justify-between"><span className="text-sm font-medium">{item}</span>{platform === item && <span aria-hidden="true" className="text-sm text-[#687d62]">✓</span>}</span><span className="mt-1 block text-xs text-[#777773]">{item === 'Instagram' ? 'Reels and posts' : 'Shorts and videos'}</span></button>)}</div></fieldset>
        <div><label className="field-label" htmlFor="totalBudget">Campaign budget (₹)</label><input id="totalBudget" type="number" min="1" step="1" required value={totalBudget} onChange={(e) => setTotalBudget(e.target.value === '' ? '' : Number(e.target.value))} placeholder="50000" className="field" /><p className="mt-1.5 text-xs text-[#85857f]">Maximum amount available for all creator payouts.</p></div>
        <div className="border-t border-[#e8e7e3] pt-6"><MilestoneInput milestones={milestones} onChange={setMilestones} totalBudget={typeof totalBudget === 'number' ? totalBudget : undefined} /></div>
        <div className="border-t border-[#e8e7e3] pt-5"><button type="submit" disabled={loading} className="btn btn-primary w-full sm:w-auto">{loading ? 'Creating campaign…' : 'Create campaign'} <span aria-hidden="true">↗</span></button><p className="mt-2 text-xs text-[#85857f]">You can review budget usage from your campaign dashboard.</p></div>
      </form>
    </section>
  </div>;
}
