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
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        <p className="text-sm text-slate-500">Preparing your retrospective...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4">
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Intelligent Retrospective Engine</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Journal Rewind
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
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
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/25'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-teal-300'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-6">
          <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse space-y-4">
            <div className="w-36 h-6 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            <div className="grid grid-cols-3 gap-4">
              <div className="h-16 bg-slate-100 dark:bg-slate-850 rounded-xl" />
              <div className="h-16 bg-slate-100 dark:bg-slate-850 rounded-xl" />
              <div className="h-16 bg-slate-100 dark:bg-slate-850 rounded-xl" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 h-48 animate-pulse" />
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 h-48 animate-pulse" />
          </div>
        </div>
      ) : rewindData?.isEmpty ? (
        /* Empty State */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-4 max-w-md mx-auto shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950 flex items-center justify-center text-teal-600 dark:text-teal-400 mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">There&apos;s nothing to rewind yet</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            You don&apos;t have any journal entries recorded for this time range. Start writing to see your personal rewind.
          </p>
          <Link
            href="/journal"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium transition-colors"
          >
            <span>Write an Entry</span>
          </Link>
        </div>
      ) : (
        /* Populated Rewind Retrospective */
        <div className="space-y-6 animate-fadeIn">
          
          {/* Stats Bar */}
          <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-teal-950/10 via-emerald-950/10 to-transparent border border-teal-200 dark:border-teal-900/60 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-300">
              Verified Journal Activity
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750">
                <span className="text-xs text-slate-500 block">Total Entries</span>
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 block">
                  {rewindData.stats.journalCount}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750">
                <span className="text-xs text-slate-500 block">Active Days</span>
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 block">
                  {rewindData.stats.activeDays}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750">
                <span className="text-xs text-slate-500 block">Top Themes</span>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {rewindData.stats.topTopics.length > 0 ? (
                    rewindData.stats.topTopics.map((t: string, idx: number) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 font-medium"
                      >
                        #{t}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">General thoughts</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* AI Narrative Reflection */}
          {rewindData.reflection && (
            <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center space-x-2">
                <Brain className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Retrospective Synthesis</h3>
              </div>
              <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed italic">
                &ldquo;{rewindData.reflection}&rdquo;
              </p>
            </div>
          )}

          {/* Grid: Highlights & Recurring Themes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Highlights */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 text-teal-700 dark:text-teal-300">
                <Award className="w-5 h-5 text-emerald-500" />
                <h3 className="text-sm font-bold uppercase tracking-wider">Moments That Mattered</h3>
              </div>

              <div className="space-y-3">
                {rewindData.highlights && rewindData.highlights.length > 0 ? (
                  rewindData.highlights.map((h: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 space-y-1"
                    >
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">{h.title}</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{h.description}</p>
                      {h.sourceJournalId && (
                        <Link
                          href={`/journal?id=${h.sourceJournalId}`}
                          className="inline-flex items-center space-x-1 text-[11px] text-teal-600 dark:text-teal-400 hover:underline pt-1 font-medium"
                        >
                          <span>View source entry</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">No major highlights recorded in this period.</p>
                )}
              </div>
            </div>

            {/* Recurring Themes */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 text-teal-700 dark:text-teal-300">
                <TrendingUp className="w-5 h-5 text-indigo-500" />
                <h3 className="text-sm font-bold uppercase tracking-wider">Recurring Themes</h3>
              </div>

              <div className="space-y-3">
                {rewindData.recurringThemes && rewindData.recurringThemes.length > 0 ? (
                  rewindData.recurringThemes.map((t: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 space-y-1"
                    >
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">#{t.theme}</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{t.description}</p>
                      {t.sourceJournalIds && t.sourceJournalIds[0] && (
                        <Link
                          href={`/journal?id=${t.sourceJournalIds[0]}`}
                          className="inline-flex items-center space-x-1 text-[11px] text-teal-600 dark:text-teal-400 hover:underline pt-1 font-medium"
                        >
                          <span>Explore source</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">No recurring themes detected yet.</p>
                )}
              </div>
            </div>

          </div>

          {/* Standout: One Moment Worth Remembering */}
          {rewindData.oneMomentToRemember && (
            <div className="p-6 sm:p-8 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 shadow-sm space-y-3">
              <div className="flex items-center space-x-2 text-xs font-semibold text-teal-800 dark:text-teal-200 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>One Moment Worth Remembering</span>
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                {rewindData.oneMomentToRemember.title}
              </h4>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {rewindData.oneMomentToRemember.description}
              </p>
              {rewindData.oneMomentToRemember.sourceJournalId && (
                <div className="pt-2">
                  <Link
                    href={`/journal?id=${rewindData.oneMomentToRemember.sourceJournalId}`}
                    className="inline-flex items-center space-x-1.5 text-xs font-semibold text-teal-700 dark:text-teal-300 hover:underline"
                  >
                    <span>Read the original entry</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          )}

        </div>
      )}

    </div>
  );
}
