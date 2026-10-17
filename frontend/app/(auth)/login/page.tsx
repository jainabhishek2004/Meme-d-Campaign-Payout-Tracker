'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { setToken, setUser } from '@/lib/auth';
import GoogleAuthButton from '@/components/GoogleAuthButton';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    if (!email.trim() || !password) { setError('Please enter your email and password.'); return; }
    setLoading(true);
    try {
      const res = await authApi.login(email.trim(), password);
      if (!res.token || !res.user) throw new Error('The server returned an invalid sign-in response.');
      setToken(res.token); setUser(res.user);
      router.push(res.user.role === 'brand' ? '/dashboard/brand' : '/dashboard/creator');
    } catch (err: any) { setError(err.message || 'We couldn’t sign you in. Check your details and try again.'); }
    finally { setLoading(false); }
  };

  return <div className="auth-wrap">
    <section className="auth-card surface" aria-labelledby="login-title">
      <div className="mb-8"><p className="eyebrow">Welcome back</p><h1 id="login-title" className="mt-2 text-3xl font-medium tracking-[-.055em] sm:text-4xl">Sign in to Meme’d</h1><p className="mt-2 text-sm leading-6 text-[#777773]">Manage campaigns and keep track of your performance.</p></div>
      {error && <div role="alert" aria-live="assertive" className="notice notice-error mb-5">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label className="field-label" htmlFor="email">Email address</label><input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="field" /></div>
        <div><label className="field-label" htmlFor="password">Password</label><input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" className="field" /></div>
        <button type="submit" disabled={loading} className="btn btn-primary mt-2 w-full">{loading ? 'Signing in…' : 'Sign in'} <span aria-hidden="true">↗</span></button>
      </form>
      <div className="my-6 flex items-center gap-3 text-[11px] text-[#92928c]"><span className="h-px flex-1 bg-[#e8e7e3]" /><span>OR CONTINUE WITH</span><span className="h-px flex-1 bg-[#e8e7e3]" /></div>
      <GoogleAuthButton onError={setError} onLoadingChange={setLoading} />
      <p className="mt-2 text-center text-[11px] leading-5 text-[#85857f]">If this Google account is new, we’ll ask you to choose a role before creating it.</p>
      <p className="mt-7 border-t border-[#e8e7e3] pt-5 text-center text-sm text-[#777773]">New here? <Link href="/signup" className="font-medium text-[#171717] underline underline-offset-4">Create an account</Link></p>
    </section>
  </div>;
}
