'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getUser, isAuthenticated } from '@/lib/auth';

const rewards = [
  { views: '10,000', payout: '₹500', tone: 'bg-[#f2f3ef]' },
  { views: '50,000', payout: '₹2,000', tone: 'bg-[#e9eee7]' },
  { views: '100,000', payout: '₹5,000', tone: 'bg-[#f2f3ef]' },
];

export default function HomePage() {
  const router = useRouter();
  useEffect(() => {
    if (!isAuthenticated()) return;
    const user = getUser();
    router.replace(user?.role === 'brand' ? '/dashboard/brand' : '/dashboard/creator');
  }, [router]);

  return (
    <div className="site-shell pb-20 pt-12 sm:pt-20">
      <section className="grid items-center gap-12 lg:grid-cols-[1.05fr_.95fr] lg:gap-20">
        <div className="py-4">
          <p className="eyebrow">Creator campaigns, with clarity</p>
          <h1 className="mt-6 max-w-[720px] text-[clamp(3rem,8vw,6.25rem)] font-medium leading-[.98] tracking-[-.075em]">Views have value.<br /><span className="text-[#7c8c76]">Make it count.</span></h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-[#74746f] sm:text-lg sm:leading-8">A simple way for brands to reward real reach and for creators to see what every post earns.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/signup" className="btn btn-primary px-6">Start a campaign <span aria-hidden="true">↗</span></Link>
            <Link href="/login" className="btn btn-secondary px-6">Sign in</Link>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-7 gap-y-2 text-xs text-[#777773]">
            <span>01 / Transparent milestones</span><span>02 / Protected budgets</span><span>03 / Simple tracking</span>
          </div>
        </div>

        <div className="surface overflow-hidden p-3 sm:p-4">
          <div className="campaign-cover platform-youtube flex flex-col justify-between">
            <div className="flex items-start justify-between gap-4">
              <span className="platform-label">Campaign preview</span>
              <span className="eyebrow text-[#777773]">01 — 03</span>
            </div>
            <div className="relative z-10 mt-10">
              <p className="text-sm text-[#676b65]">YouTube · creator campaign</p>
              <h2 className="mt-1 text-3xl font-medium tracking-[-.055em] sm:text-4xl">Views that move<br />the needle.</h2>
            </div>
          </div>
          <div className="px-1 pb-1 pt-5 sm:px-2">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div><p className="eyebrow">Reward ladder</p><p className="mt-1 text-sm text-[#777773]">The highest milestone reached sets the payout.</p></div>
              <span className="hidden text-xs text-[#85857f] sm:block">Example</span>
            </div>
            <div className="space-y-2">
              {rewards.map((reward, index) => <div key={reward.views} className={`flex items-center justify-between rounded-xl px-4 py-3.5 ${reward.tone}`}>
                <div className="flex items-center gap-3"><span className="text-xs text-[#8a8a84]">0{index + 1}</span><span className="text-sm font-medium">{reward.views} views</span></div><span className="text-sm font-semibold">{reward.payout}</span>
              </div>)}
            </div>
            <p className="mt-4 text-xs leading-5 text-[#7a7a74]">Campaign payouts are limited by the brand’s available budget.</p>
          </div>
        </div>
      </section>

      <section className="mt-24 border-t border-[#e4e3de] pt-7 sm:mt-32" aria-label="How Meme'd works">
        <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="eyebrow">The process</p><h2 className="mt-2 text-3xl font-medium tracking-[-.055em] sm:text-4xl">Good work, clearly rewarded.</h2></div><p className="max-w-md text-sm leading-6 text-[#777773]">One place to set campaign terms, submit posts, and follow performance from first view to final payout.</p></div>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { number: '01', title: 'Set the campaign', body: 'Brands choose a platform, a budget, and the view milestones that define each reward.' },
            { number: '02', title: 'Share the post', body: 'Creators browse open campaigns and submit a link to their Instagram or YouTube content.' },
            { number: '03', title: 'Follow the results', body: 'Views, earned payouts, and remaining campaign funds stay visible in one place.' },
          ].map((item) => <article key={item.number} className="surface p-5 sm:p-6"><span className="text-xs text-[#8b9986]">{item.number} /</span><h3 className="mt-5 text-lg font-medium tracking-[-.03em]">{item.title}</h3><p className="mt-2 text-sm leading-6 text-[#777773]">{item.body}</p></article>)}
        </div>
      </section>
      <footer className="mt-20 flex flex-col gap-2 border-t border-[#e4e3de] pt-5 text-xs text-[#85857f] sm:flex-row sm:justify-between"><span>meme’d — performance campaigns for creators</span><span>Built for clear terms and measurable reach.</span></footer>
    </div>
  );
}
