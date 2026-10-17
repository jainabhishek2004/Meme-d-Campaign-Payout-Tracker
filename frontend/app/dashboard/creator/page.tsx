'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { campaignApi, submissionApi } from '@/lib/api';
import { getUser, isAuthenticated } from '@/lib/auth';
import { Campaign, Submission } from '@/types';
import CampaignCard from '@/components/CampaignCard';
import SubmissionCard from '@/components/SubmissionCard';

export default function CreatorDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'earnings' | 'campaigns'>('earnings');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(true);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [errorSubmissions, setErrorSubmissions] = useState<string | null>(null);
  const [errorCampaigns, setErrorCampaigns] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [postLink, setPostLink] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [platformFilter, setPlatformFilter] = useState<'All' | 'Instagram' | 'YouTube'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const loadSubmissions = useCallback(async (silent = false) => {
    if (!silent) setLoadingSubmissions(true);
    setErrorSubmissions(null);
    try { const result = await submissionApi.getMy(); setSubmissions(result.submissions || []); setTotalEarnings(result.totalEarnings || 0); }
    catch (err: any) { setErrorSubmissions(err.message || 'Could not load your posts.'); }
    finally { if (!silent) setLoadingSubmissions(false); }
  }, []);
  const loadCampaigns = useCallback(async () => {
    setLoadingCampaigns(true); setErrorCampaigns(null);
    try { setCampaigns((await campaignApi.list()) || []); }
    catch (err: any) { setErrorCampaigns(err.message || 'Could not load campaigns.'); }
    finally { setLoadingCampaigns(false); }
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) { router.replace('/login'); return; }
    if (getUser()?.role !== 'creator') { router.replace('/dashboard/brand'); return; }
    loadSubmissions(); loadCampaigns();
  }, [router, loadSubmissions, loadCampaigns]);

  useEffect(() => {
    if (activeTab !== 'earnings') return;
    const interval = window.setInterval(() => { void loadSubmissions(true); }, 30_000);
    return () => window.clearInterval(interval);
  }, [activeTab, loadSubmissions]);

  const openSubmit = (id: string) => { const found = campaigns.find((item) => item._id === id); if (found) { setSelectedCampaign(found); setPostLink(''); setSubmitError(null); setSubmitSuccess(null); } };
  const closeSubmit = () => { setSelectedCampaign(null); setPostLink(''); setSubmitError(null); setSubmitSuccess(null); };
  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selectedCampaign) return;
    if (!postLink.trim()) { setSubmitError('Enter the link to your post.'); return; }
    if (!postLink.startsWith('http://') && !postLink.startsWith('https://')) { setSubmitError('Enter a valid link starting with http:// or https://.'); return; }
    setSubmitting(true); setSubmitError(null);
    try {
      await submissionApi.submit(selectedCampaign._id, postLink.trim());
      setSubmitSuccess('Post submitted. Its views are now being tracked.');
      await Promise.all([loadSubmissions(), loadCampaigns()]);
      setTimeout(() => { closeSubmit(); setActiveTab('earnings'); }, 1200);
    } catch (err: any) { setSubmitError(err.message || 'Could not submit this post.'); }
    finally { setSubmitting(false); }
  };
  const money = (value: number) => `₹${new Intl.NumberFormat('en-IN').format(value)}`;
  const filteredCampaigns = campaigns.filter((item) => (platformFilter === 'All' || item.platform === platformFilter) && (!searchQuery.trim() || item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.brand?.name?.toLowerCase().includes(searchQuery.toLowerCase())));

  return <div className="site-shell space-y-8 py-8 sm:py-12">
    <header className="flex flex-col justify-between gap-5 border-b border-[#e4e3de] pb-6 sm:flex-row sm:items-end"><div><p className="eyebrow">Creator studio</p><h1 className="mt-2 text-4xl font-medium tracking-[-.06em] sm:text-5xl">Your performance</h1><p className="mt-2 text-sm text-[#777773]">Follow what your posts are earning and find your next campaign.</p></div><nav className="flex w-full gap-5 sm:w-auto" aria-label="Creator dashboard sections"><button type="button" onClick={() => setActiveTab('earnings')} aria-current={activeTab === 'earnings' ? 'page' : undefined} className={`border-b-2 px-1 py-2 text-sm ${activeTab === 'earnings' ? 'border-[#788a72] font-medium text-[#171717]' : 'border-transparent text-[#777773]'}`}>My earnings</button><button type="button" onClick={() => setActiveTab('campaigns')} aria-current={activeTab === 'campaigns' ? 'page' : undefined} className={`border-b-2 px-1 py-2 text-sm ${activeTab === 'campaigns' ? 'border-[#788a72] font-medium text-[#171717]' : 'border-transparent text-[#777773]'}`}>Browse campaigns</button></nav></header>

    {activeTab === 'earnings' && <section className="space-y-7">
      <div className="grid gap-3 md:grid-cols-[1.35fr_.65fr]">
        <article className="rounded-2xl bg-[#e9eee7] p-6 sm:p-8"><p className="eyebrow text-[#687663]">Total earnings</p><p className="mt-3 text-5xl font-medium tracking-[-.07em] sm:text-6xl">{money(totalEarnings)}</p><p className="mt-2 max-w-lg text-sm leading-6 text-[#677064]">Rewards from the highest milestone each of your posts has reached.</p></article>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-1"><article className="surface p-5"><p className="eyebrow">Submitted posts</p><p className="mt-2 text-2xl font-medium">{submissions.length}</p></article><article className="surface p-5"><p className="eyebrow">Campaigns joined</p><p className="mt-2 text-2xl font-medium">{new Set(submissions.map((item) => item.campaign?._id)).size}</p></article></div>
      </div>
      <div className="flex items-end justify-between gap-4"><div><p className="eyebrow">Your activity</p><h2 className="mt-1 text-2xl font-medium tracking-[-.04em]">Submitted posts</h2><p className="mt-1 text-sm text-[#777773]">Views and payout progress for each post.</p></div><button type="button" onClick={() => void loadSubmissions()} disabled={loadingSubmissions} className="btn btn-secondary btn-sm">{loadingSubmissions ? 'Refreshing…' : 'Refresh'}</button></div>
      {errorSubmissions && <div role="alert" className="notice notice-error">{errorSubmissions}</div>}
      {loadingSubmissions ? <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{[1,2,3].map((n) => <div key={n} className="surface h-80 animate-pulse p-5"><div className="h-4 w-2/3 rounded bg-[#f0f0ec]"/><div className="mt-5 h-20 rounded-xl bg-[#f7f7f4]"/><div className="mt-4 h-16 rounded-xl bg-[#f0f0ec]"/></div>)}</div>
      : submissions.length === 0 ? <div className="surface px-6 py-14 text-center"><p className="eyebrow">Nothing here yet</p><h3 className="mt-2 text-2xl font-medium tracking-[-.04em]">Your first post can start earning.</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#777773]">Browse active campaigns, choose one that fits your content, and submit its public post link.</p><button type="button" onClick={() => setActiveTab('campaigns')} className="btn btn-primary mt-6">Browse campaigns <span aria-hidden="true">↗</span></button></div>
      : <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{submissions.map((item) => <SubmissionCard key={item._id} submission={item} onViewsUpdated={loadSubmissions}/>)}</div>}
    </section>}

    {activeTab === 'campaigns' && <section className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl bg-[#efefeb] p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4"><div className="flex flex-wrap gap-1.5" aria-label="Filter campaigns by platform">{(['All', 'Instagram', 'YouTube'] as const).map((platform) => <button key={platform} type="button" onClick={() => setPlatformFilter(platform)} aria-pressed={platformFilter === platform} className={`btn btn-sm ${platformFilter === platform ? 'btn-primary' : 'btn-quiet'}`}>{platform}</button>)}</div><div className="flex min-w-0 gap-2 sm:w-[min(100%,420px)]"><input type="search" aria-label="Search campaigns" placeholder="Search campaigns or brands" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="field !min-h-10 flex-1 text-sm"/><button type="button" onClick={loadCampaigns} disabled={loadingCampaigns} className="btn btn-secondary btn-sm">{loadingCampaigns ? 'Loading…' : 'Refresh'}</button></div></div>
      <div className="flex items-end justify-between"><div><p className="eyebrow">Open opportunities</p><h2 className="mt-1 text-2xl font-medium tracking-[-.04em]">Campaigns for you</h2></div><span className="text-xs text-[#85857f]">{filteredCampaigns.length} available</span></div>
      {errorCampaigns && <div role="alert" className="notice notice-error">{errorCampaigns}</div>}
      {loadingCampaigns ? <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{[1,2,3].map((n) => <div key={n} className="surface h-96 animate-pulse p-4"><div className="h-36 rounded-xl bg-[#f0f0ec]"/><div className="mt-5 h-4 w-2/3 rounded bg-[#f0f0ec]"/></div>)}</div>
      : filteredCampaigns.length === 0 ? <div className="surface px-6 py-14 text-center"><p className="eyebrow">No results</p><h3 className="mt-2 text-xl font-medium">No campaigns match those filters.</h3><p className="mt-2 text-sm text-[#777773]">Try another platform or a shorter search.</p></div>
      : <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{filteredCampaigns.map((item) => <CampaignCard key={item._id} campaign={item} showSubmitButton onSubmit={openSubmit}/>)}</div>}
    </section>}

    {selectedCampaign && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeSubmit(); }}><section role="dialog" aria-modal="true" aria-labelledby="submit-title" className="modal-panel">
      <div className="flex items-start justify-between gap-4"><div><span className="platform-label">{selectedCampaign.platform}</span><h2 id="submit-title" className="mt-3 text-2xl font-medium leading-tight tracking-[-.045em]">Submit a post</h2><p className="mt-1 text-sm text-[#777773]">For {selectedCampaign.name} · {selectedCampaign.brand?.name || 'Brand'}</p></div><button type="button" onClick={closeSubmit} aria-label="Close dialog" className="btn btn-secondary btn-sm">Close</button></div>
      <div className="surface-soft mt-5 p-4"><p className="eyebrow">Reward milestones</p><div className="mt-2 divide-y divide-white">{selectedCampaign.milestones.map((m, index) => <div key={`${m.viewThreshold}-${index}`} className="flex justify-between gap-3 py-2 text-sm"><span className="text-[#777773]">{new Intl.NumberFormat('en-IN').format(m.viewThreshold)} views</span><span className="font-medium">₹{new Intl.NumberFormat('en-IN').format(m.payout)}</span></div>)}</div></div>
      {submitError && <div role="alert" className="notice notice-error mt-4">{submitError}</div>}{submitSuccess && <div role="status" className="notice notice-success mt-4">{submitSuccess}</div>}
      <form onSubmit={handleSubmitPost} className="mt-5 space-y-4"><div><label className="field-label" htmlFor="modalPostLink">Public post URL</label><input id="modalPostLink" type="url" required value={postLink} onChange={(e) => setPostLink(e.target.value)} placeholder={selectedCampaign.platform === 'Instagram' ? 'https://www.instagram.com/reel/…' : 'https://www.youtube.com/watch?v=…'} className="field"/><p className="mt-1.5 text-xs text-[#85857f]">Use a public post from the selected platform.</p></div><div className="flex flex-col-reverse gap-2 border-t border-[#e8e7e3] pt-4 sm:flex-row sm:justify-end"><button type="button" onClick={closeSubmit} className="btn btn-secondary">Cancel</button><button type="submit" disabled={submitting || !!submitSuccess} className="btn btn-primary">{submitting ? 'Submitting…' : 'Submit post'} <span aria-hidden="true">↗</span></button></div></form>
    </section></div>}
  </div>;
}
