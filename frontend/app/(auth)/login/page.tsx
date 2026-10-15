'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { setToken, setUser } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.login(email.trim(), password);
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
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* Left panel: Dark editorial neobrutalism (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1a1a1a] flex-col justify-between p-12 xl:p-16 text-white border-r-2 border-black">
        <div>
          <span className="inline-block bg-[#FFDC58] text-black text-xs font-black uppercase px-2.5 py-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rounded-sm mb-6">
            Meme Marketing Protocol
          </span>
          <h1 className="text-6xl font-black tracking-tight text-[#FFDC58]">
            MEME&apos;D
          </h1>
          <p className="text-2xl font-bold mt-3 text-gray-200">
            Where views become value.
          </p>
          <p className="text-sm text-gray-400 mt-2 max-w-md">
            Guaranteed escrow milestones for viral creators and performance-first campaigns for modern brands.
          </p>
        </div>

        {/* Decorative Stat Cards */}
        <div className="space-y-4 max-w-md my-8">
          <div className="bg-white text-black p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-sm flex items-center justify-between font-bold">
            <span className="flex items-center gap-2">
              <span className="text-lg">👁</span> 10K views
            </span>
            <span className="text-gray-400">→</span>
            <span className="text-base font-black bg-[#FFDC58] px-2.5 py-1 border-2 border-black rounded-sm">
              ₹500
            </span>
          </div>

          <div className="bg-[#FFDC58] text-black p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-sm flex items-center justify-between font-bold">
            <span className="flex items-center gap-2">
              <span className="text-lg">⚡</span> 50K views
            </span>
            <span className="text-black">→</span>
            <span className="text-base font-black bg-white px-2.5 py-1 border-2 border-black rounded-sm">
              ₹2,000
            </span>
          </div>

          <div className="bg-white text-black p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-sm flex items-center justify-between font-bold">
            <span className="flex items-center gap-2">
              <span className="text-lg">🔥</span> 100K views
            </span>
            <span className="text-gray-400">→</span>
            <span className="text-base font-black bg-[#FFDC58] px-2.5 py-1 border-2 border-black rounded-sm">
              ₹5,000
            </span>
          </div>
        </div>

        <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
          © {new Date().getFullYear()} MEME&apos;D • Performance Payout Tracker
        </div>
      </div>

      {/* Right panel: Login form */}
      <div className="w-full lg:w-1/2 bg-[#dfe5f2] flex items-center justify-center p-6 sm:p-12">
        <div className="neo-card w-full max-w-md p-8 sm:p-10 bg-white">
          <div className="mb-6">
            <span className="inline-block lg:hidden text-2xl font-black text-black tracking-wider mb-2">
              MEME<span className="text-[#FFDC58] bg-black px-1 rounded-sm">&apos;D</span>
            </span>
            <h2 className="text-3xl font-black text-[#1a1a1a] tracking-tight">
              Welcome back
            </h2>
            <p className="text-xs font-semibold text-gray-600 mt-1">
              Sign in to manage your campaigns and track payouts
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-sm bg-red-100 border-2 border-red-600 text-red-700 text-xs font-bold flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="••••••••"
                className="neo-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="neo-btn bg-[#FFDC58] text-black w-full py-3 mt-2 text-sm font-black disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t-2 border-black text-center text-xs font-bold text-gray-700">
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="text-black font-black underline hover:bg-[#FFDC58] px-1 py-0.5 rounded-sm transition-colors"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
