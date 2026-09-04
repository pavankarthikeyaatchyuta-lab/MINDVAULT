'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Home,
  BookOpen,
  Layers,
  MessageSquare,
  Clock,
  TrendingUp,
  MapPin,
  Sparkles,
  Sprout,
  Menu,
  X,
  ChevronRight,
  LogOut,
} from 'lucide-react';

const navLinks = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/journal', label: 'Journal', icon: BookOpen },
  { href: '/memories', label: 'Memories', icon: Layers },
  { href: '/ask', label: 'Ask', icon: MessageSquare },
  { href: '/rewind', label: 'Rewind', icon: Clock },
  { href: '/timeline', label: 'Timeline', icon: TrendingUp },
  { href: '/map', label: 'Map', icon: MapPin },
  { href: '/insights', label: 'Insights', icon: Sparkles },
];

export function Sidebar() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  if (!user) return null;

  const NavContent = () => (
    <>
      {/* Brand */}
      <div className="px-5 pt-6 pb-4">
        <Link href="/dashboard" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-shadow">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight" style={{ color: 'var(--mv-text)' }}>
              MindVault
            </span>
            <p className="text-[11px] font-medium" style={{ color: 'var(--mv-text-muted)' }}>
              Your Story. A Smarter You.
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 space-y-0.5 overflow-y-auto">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={isActive ? 'mv-sidebar-link-active' : 'mv-sidebar-link'}
            >
              <Icon className="w-[18px] h-[18px]" />
              <span>{link.label}</span>
              {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-50" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-4 pb-4 space-y-3">
        {/* Motivational quote matching reference design */}
        <div
          className="p-3.5 rounded-2xl text-xs leading-relaxed border flex items-start space-x-2.5 shadow-sm"
          style={{
            background: 'var(--mv-surface)',
            borderColor: 'var(--mv-border)',
            color: 'var(--mv-text-muted)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
            <Sprout className="w-3.5 h-3.5" />
          </div>
          <p className="italic text-[11px] leading-snug">
            &ldquo;A calmer mind builds a brighter tomorrow.&rdquo;
          </p>
        </div>

        {/* User info & logout */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-400 to-violet-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: 'var(--mv-text)' }}>
                {user.displayName || 'User'}
              </p>
              <p className="text-[10px] truncate" style={{ color: 'var(--mv-text-muted)' }}>
                {user.email || 'Authenticated'}
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="p-2 rounded-lg transition-colors hover:bg-red-50 dark:hover:bg-red-950/30 text-red-400 hover:text-red-500"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="mv-sidebar hidden lg:flex">
        <NavContent />
      </aside>

      {/* Mobile bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden" style={{
        background: 'var(--mv-surface)',
        borderTop: '1px solid var(--mv-border)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}>
        <nav className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
          {navLinks.slice(0, 5).map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center space-y-0.5 px-2 py-1.5 rounded-xl transition-all ${
                  isActive
                    ? 'text-indigo-500'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{link.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex flex-col items-center space-y-0.5 px-2 py-1.5 rounded-xl transition-all text-slate-400 dark:text-slate-500"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </nav>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed left-0 top-0 bottom-0 w-72 z-50 flex flex-col lg:hidden animate-slideIn" style={{
            background: 'var(--mv-surface-solid, var(--mv-bg))',
            borderRight: '1px solid var(--mv-border)',
          }}>
            <div className="flex items-center justify-end p-3">
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg" style={{ color: 'var(--mv-text-muted)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <NavContent />
          </aside>
        </>
      )}
    </>
  );
}
