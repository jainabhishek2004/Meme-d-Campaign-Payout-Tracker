'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getUser, logout } from '@/lib/auth';
import { User } from '@/types';

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    setUser(getUser());
    setMenuOpen(false);
  }, [pathname]);

  const links = user?.role === 'brand'
    ? [{ href: '/dashboard/brand', label: 'Campaigns' }, { href: '/dashboard/brand/create-campaign', label: 'Create campaign' }]
    : [{ href: '/dashboard/creator', label: 'Creator studio' }];

  const navLinks = (mobile = false) => links.map(({ href, label }) => (
    <Link key={href} href={href} onClick={() => setMenuOpen(false)} aria-current={pathname === href ? 'page' : undefined}
      className={`${mobile ? 'block px-3 py-3' : 'px-3 py-2'} rounded-lg text-[13px] transition-colors ${pathname === href ? 'bg-[#f1f2ee] text-[#171717]' : 'text-[#686863] hover:bg-[#f5f5f2] hover:text-[#171717]'}`}>
      {label}
    </Link>
  ));

  const rightActions = !mounted ? null : user ? (
    <div className="flex items-center gap-2 sm:gap-3">
      <span className="hidden max-w-40 truncate text-[13px] text-[#777773] sm:block">{user.name}</span>
      <span className="hidden rounded-full bg-[#f1f2ee] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#5f675b] sm:inline-flex">{user.role}</span>
      <button onClick={logout} className="btn btn-secondary btn-sm">Log out</button>
      <button type="button" className="btn btn-secondary btn-sm md:hidden" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? 'Close' : 'Menu'}</button>
    </div>
  ) : (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <Link href="/login" className="btn btn-quiet btn-sm">Log in</Link>
      <Link href="/signup" className="btn btn-primary btn-sm">Get started <span aria-hidden="true">↗</span></Link>
    </div>
  );

  return (
    <header className="site-header">
      <div className="site-shell flex min-h-[72px] items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-8">
          <Link href="/" aria-label="Meme'd home" className="shrink-0 text-[21px] font-semibold tracking-[-0.07em]">meme’d<span className="text-[#93a28d]">.</span></Link>
          {mounted && user && <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">{navLinks()}</nav>}
        </div>
        {rightActions}
      </div>
      {mounted && user && menuOpen && <nav className="border-t border-[#e8e7e3] bg-white px-4 py-2 md:hidden" aria-label="Mobile navigation">{navLinks(true)}</nav>}
    </header>
  );
}
