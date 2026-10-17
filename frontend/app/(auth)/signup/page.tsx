'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { setToken, setUser } from '@/lib/auth';
import GoogleAuthButton from '@/components/GoogleAuthButton';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [role, setRole] = useState<'brand' | 'creator'>('creator'); const [loading, setLoading] = useState(false); const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    if (!name.trim() || !email.trim() || !password) { setError('Please complete each field to continue.'); return; }
    if (password.length < 6) { setError('Use a password with at least 6 characters.'); return; }
    setLoading(true);
    try {
      const res = await authApi.signup(name.trim(), email.trim(), password, role);
      if (!res.token || !res.user) throw new Error('The server returned an invalid sign-up response.');
      setToken(res.token); setUser(res.user);
      router.push(res.user.role === 'brand' ? '/dashboard/brand' : '/dashboard/creator');
    } catch (err: any) { setError(err.message || 'We couldn’t create your account. Please try again.'); }
    finally { setLoading(false); }
  };

  return <div className="auth-wrap">
    <section className="auth-card auth-card-signup surface" aria-labelledby="signup-title">
      <div className="mb-7"><p className="eyebrow">Join the marketplace</p><h1 id="signup-title" className="mt-2 text-3xl font-medium tracking-[-.055em] sm:text-4xl">Create your account</h1><p className="mt-2 text-sm leading-6 text-[#777773]">Choose how you’ll use Meme’d. You can start in a minute.</p></div>
      {error && <div role="alert" aria-live="assertive" className="notice notice-error mb-5">{error}</div>}
      <form onSubmit={handleSubmit} className="signup-form">
        <fieldset className="signup-role"><legend className="field-label mb-2">I’m joining as a</legend><div className="grid grid-cols-2 gap-2">
          {(['creator', 'brand'] as const).map((accountRole) => <button key={accountRole} type="button" aria-pressed={role === accountRole} onClick={() => setRole(accountRole)} className="auth-choice"><span className="block text-sm font-medium capitalize">{accountRole}</span><span className="mt-0.5 block text-xs text-[#777773]">{accountRole === 'creator' ? 'Share posts and earn' : 'Launch a campaign'}</span></button>)}
        </div></fieldset>
        <div className="signup-name"><label className="field-label" htmlFor="name">{role === 'brand' ? 'Brand or company name' : 'Your name'}</label><input id="name" type="text" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder={role === 'brand' ? 'Company name' : 'Your name'} className="field" /></div>
        <div className="signup-email"><label className="field-label" htmlFor="email">Email address</label><input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="field" /></div>
        <div className="signup-password"><label className="field-label" htmlFor="password">Password</label><input id="password" type="password" autoComplete="new-password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" className="field" /></div>
        <button type="submit" disabled={loading} className="signup-submit btn btn-primary w-full">{loading ? 'Creating account…' : `Create ${role} account`} <span aria-hidden="true">↗</span></button>
      </form>
      <div className="my-6 flex items-center gap-3 text-[11px] text-[#92928c]"><span className="h-px flex-1 bg-[#e8e7e3]" /><span>OR SIGN UP WITH</span><span className="h-px flex-1 bg-[#e8e7e3]" /></div>
      <p className="mb-1 text-center text-xs text-[#777773]">Google will create a <span className="font-medium capitalize text-[#171717]">{role}</span> account.</p>
      <GoogleAuthButton role={role} onError={setError} onLoadingChange={setLoading} />
      <p className="mt-7 border-t border-[#e8e7e3] pt-5 text-center text-sm text-[#777773]">Already have an account? <Link href="/login" className="font-medium text-[#171717] underline underline-offset-4">Sign in</Link></p>
    </section>
  </div>;
}
