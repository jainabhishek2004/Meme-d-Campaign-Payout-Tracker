'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { setToken, setUser } from '@/lib/auth';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'brand' | 'creator'>('creator');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.signup(name.trim(), email.trim(), password, role);
      if (!res.token || !res.user) {
        throw new Error('Invalid response received from server.');
      }

      setToken(res.token);
      setUser(res.user);

      if (res.user.role === 'brand') {
        router.push('/dashboard/brand');
      } else {
        router.push('/dashboard/creator');
      }
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* Left panel: Dark editorial messaging (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1a1a1a] flex-col justify-between p-12 xl:p-16 text-white border-r-2 border-black">
        <div>
          <span className="inline-block bg-[#FFDC58] text-black text-xs font-black uppercase px-2.5 py-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-sm mb-6">
            Get Onboard
          </span>
          <h1 className="text-6xl font-black tracking-tight text-[#FFDC58]">
            Join MEME&apos;D
          </h1>
          <p className="text-2xl font-bold mt-3 text-gray-200">
            Performance meme marketing on autopilot.
          </p>
          <p className="text-sm text-gray-400 mt-2 max-w-md">
            Whether you&apos;re a high-growth brand paying strictly for reach or a viral creator monetizing views, Meme&apos;d guarantees transparent payouts.
          </p>
        </div>

        {/* Feature bullets styled with neobrutalism cards */}
        <div className="space-y-4 max-w-md my-8">
          <div className="bg-white text-black p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-sm">
            <p className="font-black text-sm">💼 For Brands</p>
            <p className="text-xs font-semibold text-gray-700 mt-1">
              Zero upfront creator fees. Set milestone thresholds and release escrow payouts only when target impressions are hit.
            </p>
          </div>

          <div className="bg-[#FFDC58] text-black p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-sm">
            <p className="font-black text-sm">⭐ For Creators</p>
            <p className="text-xs font-bold text-gray-900 mt-1">
              Create reels or shorts, submit links, and claim tiered milestone bounties directly as views skyrocket.
            </p>
          </div>
        </div>

        <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
          Transparent Milestones • Instant Verification • Direct Escrow
        </div>
      </div>

      {/* Right panel: Signup form */}
      <div className="w-full lg:w-1/2 bg-[#dfe5f2] flex items-center justify-center p-6 sm:p-12">
        <div className="neo-card w-full max-w-md p-8 sm:p-10 bg-white">
          <div className="mb-6">
            <span className="inline-block lg:hidden text-2xl font-black text-black tracking-wider mb-2">
              MEME<span className="text-[#FFDC58] bg-black px-1 rounded-sm">&apos;D</span>
            </span>
            <h2 className="text-3xl font-black text-[#1a1a1a] tracking-tight">
              Create an Account
            </h2>
            <p className="text-xs font-semibold text-gray-600 mt-1">
              Select your role to start creating or earning
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-sm bg-red-100 border-2 border-red-600 text-red-700 text-xs font-bold flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selector: Two clickable cards side-by-side */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#1a1a1a] mb-2">
                I want to join as a:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('brand')}
                  className={`p-3 text-left border-2 border-black rounded-sm transition-all ${
                    role === 'brand'
                      ? 'bg-main shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]'
                      : 'bg-white hover:bg-gray-50 shadow-none'
                  }`}
                >
                  <div className="text-xl mb-1">💼</div>
                  <div className="text-sm font-black text-black">Brand</div>
                  <div className="text-[11px] font-semibold text-gray-700 mt-0.5">
                    Create campaigns
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('creator')}
                  className={`p-3 text-left border-2 border-black rounded-sm transition-all ${
                    role === 'creator'
                      ? 'bg-main shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]'
                      : 'bg-white hover:bg-gray-50 shadow-none'
                  }`}
                >
                  <div className="text-xl mb-1">⭐</div>
                  <div className="text-sm font-black text-black">Creator</div>
                  <div className="text-[11px] font-semibold text-gray-700 mt-0.5">
                    Earn from views
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#1a1a1a] mb-1.5" htmlFor="name">
                {role === 'brand' ? 'Brand / Company Name' : 'Full Name / Handle'}
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={role === 'brand' ? 'e.g. Swiggy India' : 'e.g. Tanmay Bhat'}
                className="neo-input"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#1a1a1a] mb-1.5" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="neo-input"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#1a1a1a] mb-1.5" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="neo-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="neo-btn bg-[#FFDC58] text-black w-full py-3 mt-2 text-sm font-black disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : `Join as ${role === 'brand' ? 'Brand' : 'Creator'} →`}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t-2 border-black text-center text-xs font-bold text-gray-700">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-black font-black underline hover:bg-[#FFDC58] px-1 py-0.5 rounded-sm transition-colors"
            >
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
