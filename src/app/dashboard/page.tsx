'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  BookOpen,
  Sparkles,
  Shield,
  ArrowRight,
  Loader2,
  Lock,
  Search,
  Clock,
  TrendingUp,
  MapPin,
  Brain,
} from 'lucide-react';

interface QuickAction {
  href: string;
  title: string;
  description: string;
  icon: React.ElementType;
  iconBg: string;
}

const quickActions: QuickAction[] = [
  {
    href: '/journal',
    title: 'Journal & Chat',
    description: 'Reflective multi-turn Gemini thinking companion.',
    icon: BookOpen,
    iconBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-500/15',
  },
  {
    href: '/memories',
    title: 'Memories',
    description: 'Categorized structured decisions, achievements & ideas.',
    icon: Sparkles,
    iconBg: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 group-hover:bg-violet-500/15',
  },
  {
    href: '/ask',
    title: 'Ask My Journal',
    description: 'Natural-language query with verified source citations.',
    icon: Search,
    iconBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-500/15',
  },
  {
    href: '/rewind',
    title: 'Journal Rewind',
    description: '7/30/90d & all-time visual retrospective synthesis.',
    icon: Clock,
    iconBg: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 group-hover:bg-violet-500/15',
  },
  {
    href: '/timeline',
    title: 'Growth Timeline',
    description: 'Chronological evolution and pattern shift detection.',
    icon: TrendingUp,
    iconBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-500/15',
  },
  {
    href: '/map',
    title: 'Memory Map',
    description: 'Geographic footprint of places woven into your story.',
    icon: MapPin,
    iconBg: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 group-hover:bg-violet-500/15',
  },
  {
    href: '/insights',
    title: 'Insights',
    description: 'Emerging interests, recurring themes & goal momentum.',
    icon: Brain,
    iconBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-500/15',
  },
];

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3 animate-fadeIn">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-sm" style={{ color: 'var(--mv-text-muted)' }}>
          Verifying secure session...
        </p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-8 py-4 animate-fadeIn">
      {/* Welcome Header */}
      <div
        className="mv-card p-6 sm:p-8 relative overflow-hidden"
        style={{
          background:
            'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.05) 50%, var(--mv-surface) 100%)',
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <h1
              className="text-2xl sm:text-3xl font-bold tracking-tight"
              style={{ color: 'var(--mv-text)' }}
            >
              Welcome back{user.displayName ? `, ${user.displayName}` : ''}
            </h1>
            <p className="text-sm" style={{ color: 'var(--mv-text-muted)' }}>
              Your private journal vault is active and encrypted.
            </p>
          </div>
          <div
            className="flex items-center space-x-2 text-xs px-3.5 py-2 rounded-xl self-start sm:self-auto border transition-colors shadow-sm"
            style={{
              background: 'rgba(99, 102, 241, 0.08)',
              borderColor: 'rgba(99, 102, 241, 0.2)',
              color: 'var(--mv-primary)',
            }}
          >
            <Lock className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            <span>
              Isolated UID: <span className="font-mono font-medium">{user.uid.slice(0, 10)}...</span>
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="group mv-card mv-card-hover p-5 space-y-3 block transition-all duration-300 hover:border-indigo-400/40 dark:hover:border-indigo-500/40"
            >
              <div className="flex items-center justify-between">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-105 ${action.iconBg}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 text-indigo-500 dark:text-indigo-400" />
              </div>
              <div>
                <h3
                  className="font-bold text-base transition-colors group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                  style={{ color: 'var(--mv-text)' }}
                >
                  {action.title}
                </h3>
                <p
                  className="text-xs mt-1 leading-relaxed"
                  style={{ color: 'var(--mv-text-muted)' }}
                >
                  {action.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Privacy & Security Pill / Small Note */}
      <div className="mv-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Shield className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Security Foundation Active
            </p>
            <p className="text-xs" style={{ color: 'var(--mv-text-muted)' }}>
              Firebase ID token verification is active. Your journal is strictly isolated to your verified UID.
            </p>
          </div>
        </div>
        <Link
          href="/privacy"
          className="mv-btn-primary inline-flex items-center space-x-2 px-3.5 py-2 text-xs font-medium shrink-0 self-start sm:self-auto"
        >
          <span>Privacy Status</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
