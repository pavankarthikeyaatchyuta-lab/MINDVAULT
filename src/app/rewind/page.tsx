'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  Sparkles,
  Calendar,
  Clock,
  BookOpen,
  Award,
  Target,
  ExternalLink,
  Loader2,
  AlertCircle,
  Brain,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

type RangeType = '7d' | '30d' | '90d' | 'all';

export default function RewindPage() {
  const { user, loading: authLoading, getIdToken } = useAuth();
  const router = useRouter();

  const [selectedRange, setSelectedRange] = useState<RangeType>('30d');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [rewindData, setRewindData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchRewind = React.useCallback(async (range: RangeType) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const token = await getIdToken();
      if (!token) return;

      const res = await fetch('/api/journal/rewind', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ range }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error?.message || 'Failed to generate rewind retrospective');
      }

      setRewindData(json.data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not load journal rewind.');
    } finally {
      setIsLoading(false);
    }
  }, [getIdToken]);

  useEffect(() => {
    if (user) {
      fetchRewind(selectedRange);
    }
  }, [user, selectedRange, fetchRewind]);

  const rangeButtons: { id: RangeType; label: string }[] = [
    { id: '7d', label: 'Last 7 Days' },
    { id: '30d', label: 'Last 30 Days' },
    { id: '90d', label: 'Last 90 Days' },
    { id: 'all', label: 'All Time' },
  ];

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-sm" style={{ color: 'var(--mv-text-muted)' }}>Preparing your retrospective...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4 animate-fadeIn">
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>Intelligent Retrospective Engine</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: 'var(--mv-text)' }}>
          Journal Rewind
        </h1>
        <p className="text-sm sm:text-base" style={{ color: 'var(--mv-text-muted)' }}>
          A personal retrospective showing how your thoughts, focus, and experiences changed over time.
        </p>
      </div>

      {/* Range Selector Pills */}
      <div className="flex items-center justify-center gap-2">
        {rangeButtons.map((btn) => (
          <button
            key={btn.id}
            onClick={() => setSelectedRange(btn.id)}
            disabled={isLoading}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              selectedRange === btn.id
                ? 'mv-btn-primary shadow-md shadow-indigo-500/25'
                : 'mv-card text-slate-600 dark:text-slate-400 hover:border-indigo-400/40 hover:text-indigo-500'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-6">
          <div className="p-8 mv-card animate-pulse space-y-4">
            <div className="w-36 h-6 bg-indigo-500/10 rounded-lg" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="h-16 bg-indigo-500/5 rounded-xl border border-indigo-500/10" />
              <div className="h-16 bg-indigo-500/5 rounded-xl border border-indigo-500/10" />
              <div className="h-16 bg-indigo-500/5 rounded-xl border border-indigo-500/10" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 mv-card h-48 animate-pulse" />
            <div className="p-6 mv-card h-48 animate-pulse" />
          </div>
        </div>
      ) : rewindData?.isEmpty ? (
        /* Empty State */
        <div className="mv-card p-12 text-center space-y-4 max-w-md mx-auto shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold" style={{ color: 'var(--mv-text)' }}>
            There&apos;s nothing to rewind yet
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--mv-text-muted)' }}>
            You don&apos;t have any journal entries recorded for this time range. Start writing to see your personal rewind.
          </p>
          <Link
            href="/journal"
            className="mv-btn-primary inline-flex items-center space-x-2 px-4 py-2 text-xs font-medium"
          >
            <span>Write an Entry</span>
          </Link>
        </div>
      ) : (
        /* Populated Rewind Retrospective */
        <div className="space-y-6 animate-fadeIn">
          
          {/* Stats Bar */}
          <div className="p-6 sm:p-8 mv-card space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Verified Journal Activity
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border" style={{ borderColor: 'var(--mv-border)', background: 'rgba(99, 102, 241, 0.04)' }}>
                <span className="text-xs block" style={{ color: 'var(--mv-text-muted)' }}>Total Entries</span>
                <span className="text-2xl font-extrabold mt-1 block" style={{ color: 'var(--mv-text)' }}>
                  {rewindData.stats.journalCount}
                </span>
              </div>

              <div className="p-4 rounded-xl border" style={{ borderColor: 'var(--mv-border)', background: 'rgba(99, 102, 241, 0.04)' }}>
                <span className="text-xs block" style={{ color: 'var(--mv-text-muted)' }}>Active Days</span>
                <span className="text-2xl font-extrabold mt-1 block" style={{ color: 'var(--mv-text)' }}>
                  {rewindData.stats.activeDays}
                </span>
              </div>

              <div className="p-4 rounded-xl border" style={{ borderColor: 'var(--mv-border)', background: 'rgba(99, 102, 241, 0.04)' }}>
                <span className="text-xs block" style={{ color: 'var(--mv-text-muted)' }}>Top Themes</span>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {rewindData.stats.topTopics.length > 0 ? (
                    rewindData.stats.topTopics.map((t: string, idx: number) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-medium"
                      >
                        #{t}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs" style={{ color: 'var(--mv-text-muted)' }}>General thoughts</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* AI Narrative Reflection */}
          {rewindData.reflection && (
            <div className="p-6 sm:p-8 mv-card border-violet-500/20 bg-violet-500/5 space-y-3">
              <div className="flex items-center space-x-2">
                <Brain className="w-5 h-5 text-violet-500" />
                <h3 className="text-base font-bold" style={{ color: 'var(--mv-text)' }}>Retrospective Synthesis</h3>
              </div>
              <p className="text-sm sm:text-base leading-relaxed italic" style={{ color: 'var(--mv-text)' }}>
                &ldquo;{rewindData.reflection}&rdquo;
              </p>
            </div>
          )}

          {/* Grid: Highlights & Recurring Themes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Highlights */}
            <div className="p-6 mv-card mv-card-hover space-y-4">
              <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400">
                <Award className="w-5 h-5 text-indigo-500" />
                <h3 className="text-sm font-bold uppercase tracking-wider">Moments That Mattered</h3>
              </div>

              <div className="space-y-3">
                {rewindData.highlights && rewindData.highlights.length > 0 ? (
                  rewindData.highlights.map((h: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border space-y-1 transition-colors"
                      style={{ borderColor: 'var(--mv-border)', background: 'rgba(99, 102, 241, 0.03)' }}
                    >
                      <h4 className="font-bold text-xs" style={{ color: 'var(--mv-text)' }}>{h.title}</h4>
                      <p className="text-xs" style={{ color: 'var(--mv-text-muted)' }}>{h.description}</p>
                      {h.sourceJournalId && (
                        <Link
                          href={`/journal?id=${h.sourceJournalId}`}
                          className="inline-flex items-center space-x-1 text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-violet-500 hover:underline pt-1 font-medium"
                        >
                          <span>View source entry</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs" style={{ color: 'var(--mv-text-muted)' }}>No major highlights recorded in this period.</p>
                )}
              </div>
            </div>

            {/* Recurring Themes */}
            <div className="p-6 mv-card mv-card-hover space-y-4">
              <div className="flex items-center space-x-2 text-violet-600 dark:text-violet-400">
                <TrendingUp className="w-5 h-5 text-violet-500" />
                <h3 className="text-sm font-bold uppercase tracking-wider">Recurring Themes</h3>
              </div>

              <div className="space-y-3">
                {rewindData.recurringThemes && rewindData.recurringThemes.length > 0 ? (
                  rewindData.recurringThemes.map((t: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border space-y-1 transition-colors"
                      style={{ borderColor: 'var(--mv-border)', background: 'rgba(139, 92, 246, 0.03)' }}
                    >
                      <h4 className="font-bold text-xs" style={{ color: 'var(--mv-text)' }}>#{t.theme}</h4>
                      <p className="text-xs" style={{ color: 'var(--mv-text-muted)' }}>{t.description}</p>
                      {t.sourceJournalIds && t.sourceJournalIds[0] && (
                        <Link
                          href={`/journal?id=${t.sourceJournalIds[0]}`}
                          className="inline-flex items-center space-x-1 text-[11px] text-violet-600 dark:text-violet-400 hover:text-indigo-500 hover:underline pt-1 font-medium"
                        >
                          <span>Explore source</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs" style={{ color: 'var(--mv-text-muted)' }}>No recurring themes detected yet.</p>
                )}
              </div>
            </div>

          </div>

          {/* Standout: One Moment Worth Remembering */}
          {rewindData.oneMomentToRemember && (
            <div className="relative p-[1.5px] rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 shadow-md shadow-indigo-500/10">
              <div className="mv-card p-6 sm:p-8 rounded-[15px] space-y-3">
                <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <span>One Moment Worth Remembering</span>
                </div>
                <h4 className="text-lg font-bold" style={{ color: 'var(--mv-text)' }}>
                  {rewindData.oneMomentToRemember.title}
                </h4>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--mv-text-muted)' }}>
                  {rewindData.oneMomentToRemember.description}
                </p>
                {rewindData.oneMomentToRemember.sourceJournalId && (
                  <div className="pt-2">
                    <Link
                      href={`/journal?id=${rewindData.oneMomentToRemember.sourceJournalId}`}
                      className="inline-flex items-center space-x-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-violet-500 hover:underline"
                    >
                      <span>Read the original entry</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
