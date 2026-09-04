'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { BookOpen } from 'lucide-react';

import { ThemeToggle } from '@/components/ThemeToggle';

export function Navbar() {
  const { user, loading } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b" style={{
      background: 'var(--mv-surface)',
      borderColor: 'var(--mv-border)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
    }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Brand */}
        <Link href="/" className="flex items-center space-x-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/35 transition-shadow">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight" style={{ color: 'var(--mv-text)' }}>
              MindVault
            </span>
            <span className="text-xs ml-1.5 px-1.5 py-0.5 rounded font-medium" style={{
              background: 'rgba(99, 102, 241, 0.1)',
              color: 'var(--mv-primary)',
            }}>
              GenAI
            </span>
          </div>
        </Link>

        {/* Right side */}
        <div className="flex items-center space-x-3">
          <ThemeToggle />
          {loading ? (
            <div className="w-20 h-8 rounded-lg animate-pulse" style={{ background: 'var(--mv-border)' }} />
          ) : !user ? (
            <div className="flex items-center space-x-2">
              <Link
                href="/login"
                className="px-3.5 py-1.5 text-sm font-medium transition-colors hover:opacity-80"
                style={{ color: 'var(--mv-text)' }}
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="mv-btn-primary !px-4 !py-2 !text-sm"
              >
                Get Started
              </Link>
            </div>
          ) : null}
        </div>

      </div>
    </header>
  );
}
