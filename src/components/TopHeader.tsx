'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Search, ChevronDown, User as UserIcon, LogOut } from 'lucide-react';

export function TopHeader() {
  const { user, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/ask?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Demo User';
  const initial = displayName.charAt(0).toUpperCase();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <header className="w-full flex items-center justify-between gap-4 mb-6 pt-1">
      {/* Search Bar matching reference image */}
      <form onSubmit={handleSearch} className="flex-1 max-w-xl">
        <div className="relative flex items-center">
          <Search className="absolute left-4 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your memories, feelings, places, goals..."
            className="w-full pl-11 pr-4 py-2.5 rounded-full border text-sm transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500"
            style={{
              background: 'var(--mv-surface)',
              borderColor: 'var(--mv-border)',
              color: 'var(--mv-text)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          />
        </div>
      </form>

      {/* Right Controls: Theme Toggle + User Profile Pill */}
      <div className="flex items-center space-x-3 shrink-0">
        {/* Light / Dark Mode Switcher */}
        <ThemeToggle />

        {/* User Pill from reference design */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-2.5 px-3 py-1.5 rounded-full border transition-all duration-200 shadow-sm hover:shadow"
              style={{
                background: 'var(--mv-surface)',
                borderColor: 'var(--mv-border)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
                {initial}
              </div>
              <div className="hidden sm:block text-left pr-1">
                <div className="text-xs font-semibold leading-tight truncate max-w-[110px]" style={{ color: 'var(--mv-text)' }}>
                  {displayName}
                </div>
                <div className="text-[10px] leading-none" style={{ color: 'var(--mv-text-muted)' }}>
                  Keep going ✨
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 opacity-60 shrink-0" style={{ color: 'var(--mv-text)' }} />
            </button>

            {showDropdown && (
              <div
                className="absolute right-0 mt-2 w-48 rounded-2xl border shadow-lg py-2 z-50 animate-fadeIn"
                style={{
                  background: 'var(--mv-surface-solid)',
                  borderColor: 'var(--mv-border)',
                }}
              >
                <div className="px-4 py-2 border-b" style={{ borderColor: 'var(--mv-border)' }}>
                  <p className="text-xs font-semibold truncate" style={{ color: 'var(--mv-text)' }}>
                    {displayName}
                  </p>
                  <p className="text-[11px] truncate" style={{ color: 'var(--mv-text-muted)' }}>
                    {user.email || 'Authenticated'}
                  </p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center space-x-2 px-4 py-2 text-xs text-rose-500 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
