'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { campaignApi } from '@/lib/api';
import { getUser, isAuthenticated } from '@/lib/auth';
import { Campaign } from '@/types';
import CampaignCard from '@/components/CampaignCard';

export default function BrandDashboardPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchCampaigns = useCallback(async () => {
    setLoading(true); setError(null);
    try { setCampaigns((await campaignApi.getMy()) || []); }
    catch (err: any) { setError(err.message || 'Failed to load campaigns.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    if (!isAuthenticated()) { router.replace('/login'); return; }
    if (getUser()?.role !== 'brand') { router.replace('/dashboard/creator'); return; }
    fetchCampaigns();
  }, [router, fetchCampaigns]);

  const budget = campaigns.reduce((sum, item) => sum + (Number(item.totalBudget) || 0), 0);
  const paid = campaigns.reduce((sum, item) => sum + (Number(item.budgetSpent) || 0), 0);
  const remaining = Math.max(0, budget - paid);
  const money = (value: number) => `₹${new Intl.NumberFormat('en-IN').format(value)}`;

  return <div className="site-shell space-y-9 py-9 sm:py-14">
    <header className="flex flex-col justify-between gap-5 border-b border-[#e4e3de] pb-7 sm:flex-row sm:items-end"><div><p className="eyebrow">Brand workspace</p><h1 className="mt-2 text-4xl font-medium tracking-[-.06em] sm:text-5xl">Campaigns</h1><p className="mt-2 text-sm text-[#777773]">A clear view of your creator partnerships and spend.</p></div><div className="flex gap-2"><button type="button" onClick={fetchCampaigns} disabled={loading} className="btn btn-secondary btn-sm">{loading ? 'Refreshing…' : 'Refresh'}</button><Link href="/dashboard/brand/create-campaign" className="btn btn-primary btn-sm">New campaign <span aria-hidden="true">↗</span></Link></div></header>
    <section aria-label="Campaign overview" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {[["Campaigns", String(campaigns.length), `${campaigns.filter((c) => c.status === 'active').length} active`], ['Total budget', money(budget), 'Across all campaigns'], ['Paid out', money(paid), 'Milestone rewards'], ['Available', money(remaining), 'Remaining campaign funds']].map(([label, value, note], index) => <article key={label} className={`rounded-2xl p-5 ${index === 3 ? 'bg-[#e9eee7]' : 'surface'}`}><p className="eyebrow">{label}</p><p className="mt-3 text-2xl font-medium tracking-[-.05em] sm:text-3xl">{value}</p><p className="mt-1 text-xs text-[#85857f]">{note}</p></article>)}
    </section>
    <section>
      <div className="mb-5 flex items-end justify-between gap-4"><div><p className="eyebrow">Your activity</p><h2 className="mt-1 text-2xl font-medium tracking-[-.04em]">Campaign list</h2></div><span className="text-xs text-[#85857f]">{campaigns.length} total</span></div>
      {error && <div role="alert" className="notice notice-error mb-5 flex items-center justify-between gap-3"><span>{error}</span><button onClick={fetchCampaigns} className="font-medium underline underline-offset-2">Try again</button></div>}
      {loading ? <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{[1,2,3].map((n) => <div key={n} className="surface h-[370px] animate-pulse bg-white p-4"><div className="h-36 rounded-xl bg-[#f0f0ec]"/><div className="mt-5 h-4 w-2/3 rounded bg-[#f0f0ec]"/><div className="mt-4 h-20 rounded-xl bg-[#f7f7f4]"/></div>)}</div>
      : campaigns.length === 0 && !error ? <div className="surface mx-auto max-w-2xl px-6 py-14 text-center"><p className="eyebrow">Start here</p><h3 className="mt-2 text-2xl font-medium tracking-[-.04em]">Your first campaign is a few steps away.</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#777773]">Set a budget and milestones, then invite creators to submit posts for your campaign.</p><Link href="/dashboard/brand/create-campaign" className="btn btn-primary mt-6">Create a campaign <span aria-hidden="true">↗</span></Link></div>
      : <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{campaigns.map((item) => <CampaignCard key={item._id} campaign={item}/>)}</div>}
    </section>
  </div>;
}
