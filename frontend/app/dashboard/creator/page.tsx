'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { campaignApi, submissionApi } from '@/lib/api';
import { getUser, isAuthenticated } from '@/lib/auth';
import { Campaign, Submission, User } from '@/types';
import CampaignCard from '@/components/CampaignCard';
import SubmissionCard from '@/components/SubmissionCard';

export default function CreatorDashboardPage() {
  const router = useRouter();
  const [, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'earnings' | 'campaigns'>('earnings');

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [totalEarnings, setTotalEarnings] = useState<number>(0);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  const [loadingSubmissions, setLoadingSubmissions] = useState(true);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [errorSubmissions, setErrorSubmissions] = useState<string | null>(null);
  const [errorCampaigns, setErrorCampaigns] = useState<string | null>(null);

  // Submit Post Modal state
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [postLink, setPostLink] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Campaign Filter & Search state
  const [platformFilter, setPlatformFilter] = useState<'All' | 'Instagram' | 'YouTube'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const loadSubmissions = useCallback(async () => {
    setLoadingSubmissions(true);
    setErrorSubmissions(null);
    try {
      const data = await submissionApi.getMy();
      setSubmissions(data.submissions || []);
      setTotalEarnings(data.totalEarnings || 0);
    } catch (err: any) {
      setErrorSubmissions(err.message || 'Failed to load your submissions.');
    } finally {
      setLoadingSubmissions(false);
    }
  }, []);

  const loadCampaigns = useCallback(async () => {
    setLoadingCampaigns(true);
    setErrorCampaigns(null);
    try {
      const data = await campaignApi.list();
      setCampaigns(data || []);
    } catch (err: any) {
      setErrorCampaigns(err.message || 'Failed to load available campaigns.');
    } finally {
      setLoadingCampaigns(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }
    const currentUser = getUser();
    if (currentUser?.role !== 'creator') {
      router.replace('/dashboard/brand');
      return;
    }
    setUser(currentUser);
    loadSubmissions();
    loadCampaigns();
  }, [router, loadSubmissions, loadCampaigns]);

  const handleOpenSubmit = (campaignId: string) => {
    const camp = campaigns.find((c) => c._id === campaignId);
    if (camp) {
      setSelectedCampaign(camp);
      setPostLink('');
      setSubmitError(null);
      setSubmitSuccess(null);
    }
  };

  const handleCloseSubmitModal = () => {
    setSelectedCampaign(null);
    setPostLink('');
    setSubmitError(null);
    setSubmitSuccess(null);
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign) return;

    if (!postLink.trim()) {
      setSubmitError('Please enter your post link.');
      return;
    }

    if (!postLink.startsWith('http://') && !postLink.startsWith('https://')) {
      setSubmitError('Please enter a valid URL starting with http:// or https://');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      await submissionApi.submit(selectedCampaign._id, postLink.trim());
      setSubmitSuccess('Post submitted successfully! We are tracking views.');
      await Promise.all([loadSubmissions(), loadCampaigns()]);

      setTimeout(() => {
        handleCloseSubmitModal();
        setActiveTab('earnings');
      }, 1200);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit post.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  const filteredCampaigns = campaigns.filter((c) => {
    const matchesPlatform =
      platformFilter === 'All' ? true : c.platform === platformFilter;
    const matchesSearch =
      searchQuery.trim() === ''
        ? true
        : c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.brand?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPlatform && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Tab Navigation: Styled Neobrutalism Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-black pb-4">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('earnings')}
            className={`neo-btn px-5 py-2.5 text-xs sm:text-sm font-black transition-all ${
              activeTab === 'earnings'
                ? 'bg-[#FFDC58] text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-white text-black shadow-none hover:bg-gray-100'
            }`}
          >
            💰 My Earnings
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('campaigns')}
            className={`neo-btn px-5 py-2.5 text-xs sm:text-sm font-black transition-all ${
              activeTab === 'campaigns'
                ? 'bg-[#FFDC58] text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                : 'bg-white text-black shadow-none hover:bg-gray-100'
            }`}
          >
            🎯 Browse Campaigns
          </button>
        </div>

        <span className="neo-badge bg-black text-white hidden sm:inline-flex">
          Creator Studio
        </span>
      </div>

      {/* TAB 1: MY EARNINGS */}
      {activeTab === 'earnings' && (
        <div className="space-y-6">
          {/* Hero: Big yellow card with ₹XX,XXX total earnings centered */}
          <div className="neo-card bg-[#FFDC58] p-8 sm:p-12 text-center">
            <span className="inline-block bg-white text-black text-xs font-black uppercase px-3 py-1 border-2 border-black rounded-sm mb-3">
              Total Performance Earnings
            </span>
            <div className="text-4xl sm:text-6xl font-black text-black tracking-tight my-2">
              ₹{formatNumber(totalEarnings)}
            </div>
            <p className="text-xs sm:text-sm font-bold text-black/80 max-w-md mx-auto mb-6">
              Verified payouts unlocked directly from brand escrows as your reels hit milestones.
            </p>

            {/* Submissions count + campaigns count badges */}
            <div className="flex flex-wrap justify-center items-center gap-3">
              <span className="neo-badge bg-white text-black text-xs px-3 py-1">
                📝 {submissions.length} Submissions
              </span>
              <span className="neo-badge bg-white text-black text-xs px-3 py-1">
                🏷 {new Set(submissions.map((s) => s.campaign?._id)).size} Campaigns Joined
              </span>
            </div>
          </div>

          {/* Submissions Section Header + Refresh Button */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-[#1a1a1a] uppercase tracking-wide">
                My Submitted Posts
              </h2>
              <p className="text-xs font-semibold text-gray-600 mt-0.5">
                Track real-time view verification and simulated payout testing
              </p>
            </div>
            <button
              onClick={loadSubmissions}
              disabled={loadingSubmissions}
              className="neo-btn bg-white text-black px-3.5 py-1.5 text-xs font-black"
            >
              ↻ Refresh
            </button>
          </div>

          {errorSubmissions && (
            <div className="p-3 bg-red-100 border-2 border-red-600 text-red-800 text-xs font-bold rounded-sm">
              ⚠️ {errorSubmissions}
            </div>
          )}

          {/* Submissions Grid or Empty State */}
          {loadingSubmissions ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="neo-card p-6 bg-white animate-pulse space-y-4"
                >
                  <div className="h-4 bg-gray-200 border border-black rounded-sm w-1/3" />
                  <div className="h-6 bg-gray-200 border border-black rounded-sm w-2/3" />
                  <div className="h-16 bg-gray-100 border border-black rounded-sm" />
                </div>
              ))}
            </div>
          ) : submissions.length === 0 ? (
            /* Empty: "No submissions yet. Browse campaigns!" */
            <div className="border-2 border-dashed border-black bg-white rounded-sm p-12 text-center max-w-md mx-auto shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-4xl mb-3">🎬</div>
              <h3 className="text-lg font-black text-[#1a1a1a] mb-2">
                No submissions yet. Browse campaigns!
              </h3>
              <p className="text-xs font-semibold text-gray-600 mb-6">
                Find campaigns with active budgets, submit your video link, and begin claiming payouts.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('campaigns')}
                className="neo-btn bg-[#FFDC58] text-black px-6 py-2.5 text-xs font-black"
              >
                Browse Campaigns →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {submissions.map((sub) => (
                <SubmissionCard
                  key={sub._id}
                  submission={sub}
                  onViewsUpdated={loadSubmissions}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BROWSE CAMPAIGNS */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          {/* Filter row: All / Instagram / YouTube toggle buttons + search input */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 neo-card">
            {/* Toggle buttons: All / Instagram / YouTube */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase text-gray-600 mr-1 hidden sm:inline">
                Platform:
              </span>
              {(['All', 'Instagram', 'YouTube'] as const).map((plt) => (
                <button
                  key={plt}
                  onClick={() => setPlatformFilter(plt)}
                  className={`neo-btn px-3 py-1.5 text-xs font-black transition-all ${
                    platformFilter === plt
                      ? 'bg-[#FFDC58] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                      : 'bg-white text-black shadow-none hover:bg-gray-50'
                  }`}
                >
                  {plt}
                </button>
              ))}
            </div>

            {/* Search input */}
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <input
                type="text"
                placeholder="Search campaigns or brands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="neo-input !py-1.5 text-xs font-bold sm:w-72"
              />
              <button
                type="button"
                onClick={loadCampaigns}
                disabled={loadingCampaigns}
                aria-label="Refresh campaigns"
                className="neo-btn shrink-0 bg-[#FFDC58] px-3 py-1.5 text-xs font-black disabled:cursor-wait disabled:opacity-50"
              >
                {loadingCampaigns ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>

          {errorCampaigns && (
            <div className="p-3 bg-red-100 border-2 border-red-600 text-red-800 text-xs font-bold rounded-sm">
              ⚠️ {errorCampaigns}
            </div>
          )}

          {/* Campaign grid with CampaignCard (showSubmitButton=true) */}
          {loadingCampaigns ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="neo-card p-6 bg-white animate-pulse space-y-4"
                >
                  <div className="h-4 bg-gray-200 border border-black rounded-sm w-1/3" />
                  <div className="h-6 bg-gray-200 border border-black rounded-sm w-2/3" />
                  <div className="h-20 bg-gray-100 border border-black rounded-sm" />
                </div>
              ))}
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="border-2 border-dashed border-black bg-white rounded-sm p-12 text-center max-w-md mx-auto shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="text-base font-black text-[#1a1a1a] mb-1">
                No campaigns match criteria
              </h3>
              <p className="text-xs font-semibold text-gray-600">
                Try clearing your search query or switching platform filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCampaigns.map((camp) => (
                <CampaignCard
                  key={camp._id}
                  campaign={camp}
                  showSubmitButton={true}
                  onSubmit={handleOpenSubmit}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBMIT MODAL (when user clicks Submit on a CampaignCard) */}
      {selectedCampaign && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          {/* White neo-card modal centered */}
          <div className="neo-card bg-white p-6 sm:p-8 max-w-md w-full relative">
            {/* Close button */}
            <button
              onClick={handleCloseSubmitModal}
              className="absolute top-4 right-4 w-7 h-7 bg-white hover:bg-gray-100 border-2 border-black rounded-sm flex items-center justify-center font-black text-sm"
              aria-label="Close modal"
            >
              ×
            </button>

            {/* "Submit Post to [CampaignName]" */}
            <div className="mb-4 pr-6">
              <span className="neo-badge bg-[#FFDC58] text-black mb-2">
                {selectedCampaign.platform}
              </span>
              <h3 className="text-xl font-black text-[#1a1a1a] leading-tight">
                Submit Post to {selectedCampaign.name}
              </h3>
              <p className="text-xs font-semibold text-gray-600 mt-1">
                Brand: <span className="text-black font-bold">{selectedCampaign.brand?.name || 'Brand'}</span>
              </p>
            </div>

            {/* Milestone ladder snippet */}
            <div className="p-3 bg-gray-50 border-2 border-black rounded-sm mb-4">
              <p className="text-[10px] font-black uppercase text-gray-500 mb-1.5">
                Campaign Milestone Rewards:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {selectedCampaign.milestones.map((m, idx) => (
                  <span
                    key={idx}
                    className="bg-white border-2 border-black rounded-sm px-2 py-0.5 text-[11px] font-bold"
                  >
                    👁 {m.viewThreshold >= 1000 ? `${m.viewThreshold / 1000}K` : m.viewThreshold} → ₹{formatNumber(m.payout)}
                  </span>
                ))}
              </div>
            </div>

            {submitError && (
              <div className="mb-4 p-2.5 bg-red-100 border-2 border-red-600 text-red-800 text-xs font-bold rounded-sm">
                ⚠️ {submitError}
              </div>
            )}

            {submitSuccess && (
              <div className="mb-4 p-2.5 bg-green-100 border-2 border-green-600 text-green-800 text-xs font-bold rounded-sm">
                ✓ {submitSuccess}
              </div>
            )}

            <form onSubmit={handleSubmitPost} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#1a1a1a] mb-1.5" htmlFor="modalPostLink">
                  Post Link (Reel / Shorts URL)
                </label>
                <input
                  id="modalPostLink"
                  type="url"
                  required
                  value={postLink}
                  onChange={(e) => setPostLink(e.target.value)}
                  placeholder={
                    selectedCampaign.platform === 'Instagram'
                      ? 'https://www.instagram.com/reel/...'
                      : 'https://youtube.com/shorts/...'
                  }
                  className="neo-input"
                />
                <p className="text-[11px] font-semibold text-gray-500 mt-1">
                  Ensure the post is public so views can be verified.
                </p>
              </div>

              {/* Cancel + Submit buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-black">
                <button
                  type="button"
                  onClick={handleCloseSubmitModal}
                  className="neo-btn bg-white text-black px-4 py-2 text-xs font-black"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !!submitSuccess}
                  className="neo-btn bg-[#FFDC58] text-black px-5 py-2 text-xs font-black disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Post →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
