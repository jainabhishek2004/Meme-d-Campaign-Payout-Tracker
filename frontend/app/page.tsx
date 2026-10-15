'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getUser, isAuthenticated } from '@/lib/auth';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      const user = getUser();
      if (user?.role === 'brand') {
        router.replace('/dashboard/brand');
      } else {
        router.replace('/dashboard/creator');
      }
    }
  }, [router]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16 text-center space-y-10">
      {/* Hero Badge */}
      <div className="inline-block">
        <span className="neo-badge bg-[#FFDC58] text-black text-xs font-black tracking-wider px-3.5 py-1">
          Performance Meme Marketing Protocol
        </span>
      </div>

      {/* Main Headline */}
      <div>
        <h1 className="text-4xl sm:text-6xl font-black text-[#1a1a1a] tracking-tight leading-tight">
          Where viral views become guaranteed payouts.
        </h1>
        <p className="text-base sm:text-lg font-bold text-gray-700 max-w-2xl mx-auto mt-4">
          Brands launch high-octane campaigns with escrow milestone ladders. Creators submit reels and cash out transparently.
        </p>
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/signup"
          className="neo-btn bg-[#FFDC58] text-black px-8 py-3.5 text-sm sm:text-base font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          Get Started Now →
        </Link>
        <Link
          href="/login"
          className="neo-btn bg-white text-black px-8 py-3.5 text-sm sm:text-base font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          Sign In
        </Link>
      </div>

      {/* 3 Pillars / Value Props */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
        <div className="neo-card p-6 bg-white text-left">
          <div className="text-3xl mb-2">💼</div>
          <h3 className="font-black text-base text-[#1a1a1a] mb-1">
            Zero Upfront Waste
          </h3>
          <p className="text-xs font-semibold text-gray-600">
            Brands only release budget when creator content actually achieves contracted view milestones.
          </p>
        </div>

        <div className="neo-card p-6 bg-[#FFDC58] text-left">
          <div className="text-3xl mb-2">👁</div>
          <h3 className="font-black text-base text-black mb-1">
            Automated Milestones
          </h3>
          <p className="text-xs font-bold text-gray-800">
            Escrow tiers recalculate earnings dynamically based on certified view metrics.
          </p>
        </div>

        <div className="neo-card p-6 bg-white text-left">
          <div className="text-3xl mb-2">💰</div>
          <h3 className="font-black text-base text-[#1a1a1a] mb-1">
            Direct Creator Pay
          </h3>
          <p className="text-xs font-semibold text-gray-600">
            Viral content creators get transparent bounties directly deposited into their wallets.
          </p>
        </div>
      </div>
    </div>
  );
}
