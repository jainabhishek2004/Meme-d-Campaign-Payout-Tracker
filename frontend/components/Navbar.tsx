'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getUser, logout } from '@/lib/auth';
import { User } from '@/types';

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    setUser(getUser());
  }, [pathname]);

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#1a1a1a] border-b-2 border-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        {/* Logo and Nav links */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-2xl font-black tracking-wider text-[#FFDC58] hover:opacity-90 transition-opacity select-none"
          >
            MEME&apos;D
          </Link>

          {mounted && user && (
            <nav className="hidden md:flex items-center gap-3">
              {user.role === 'brand' ? (
                <>
                  <Link
                    href="/dashboard/brand"
                    className={`text-xs font-bold px-3 py-1.5 rounded-sm border-2 border-transparent transition-all ${
                      pathname === '/dashboard/brand'
                        ? 'bg-white text-black border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    Campaigns
                  </Link>
                  <Link
                    href="/dashboard/brand/create-campaign"
                    className={`text-xs font-bold px-3 py-1.5 rounded-sm border-2 transition-all ${
                      pathname === '/dashboard/brand/create-campaign'
                        ? 'bg-[#FFDC58] text-black border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                        : 'bg-transparent text-[#FFDC58] border-[#FFDC58] hover:bg-[#FFDC58]/10'
                    }`}
                  >
                    + New Campaign
                  </Link>
                </>
              ) : (
                <Link
                  href="/dashboard/creator"
                  className={`text-xs font-bold px-3 py-1.5 rounded-sm border-2 border-transparent transition-all ${
                    pathname === '/dashboard/creator'
                      ? 'bg-white text-black border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  Creator Dashboard
                </Link>
              )}
            </nav>
          )}
        </div>

        {/* Right side: User status / Auth buttons */}
        <div className="flex items-center gap-3">
          {mounted && user ? (
            <div className="flex items-center gap-3">
              <span className="text-white font-semibold text-xs sm:text-sm hidden sm:inline max-w-[150px] truncate">
                {user.name}
              </span>
              <span className="bg-[#FFDC58] text-black border-2 border-black font-extrabold px-2.5 py-0.5 rounded-full text-[11px] uppercase tracking-wider select-none">
                {user.role}
              </span>
              <button
                onClick={handleLogout}
                className="bg-[#FFDC58] text-black border-2 border-black font-bold px-3.5 py-1.5 rounded-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all text-xs"
              >
                Logout
              </button>
            </div>
          ) : mounted ? (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="bg-[#FFDC58] text-black border-2 border-black font-bold px-4 py-1.5 rounded-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all text-xs sm:text-sm"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="bg-white text-black border-2 border-black font-bold px-4 py-1.5 rounded-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all text-xs sm:text-sm hidden sm:inline-block"
              >
                Sign Up
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
