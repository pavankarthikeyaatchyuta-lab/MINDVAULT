'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  Clock,
  Sparkles,
  BookOpen,
  Award,
  Scale,
  Lightbulb,
  Target,
  Calendar,
  Users,
  MapPin,
  AlertTriangle,
  Star,
  ExternalLink,
  Loader2,
  AlertCircle,
  TrendingUp,
  Filter,
} from 'lucide-react';
import { TimelineItem, TimelineChangeInsight, TimelineFilterType } from '@/types';

const FILTER_CONFIG: Record<
  TimelineFilterType,
  { label: string; icon: React.ElementType; color: string; bg: string; border: string }
> = {
  ALL: {
    label: 'All Activity',
    icon: Clock,
    color: 'text-slate-700 dark:text-slate-300',
    bg: 'bg-slate-100 dark:bg-slate-800',
    border: 'border-slate-300 dark:border-slate-700',
  },
  JOURNAL: {
    label: 'Journals',
    icon: BookOpen,
    color: 'text-teal-700 dark:text-teal-300',
    bg: 'bg-teal-50 dark:bg-teal-950/60',
    border: 'border-teal-200 dark:border-teal-800',
  },
  ACHIEVEMENT: {
    label: 'Achievements',
    icon: Award,
    color: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-50 dark:bg-emerald-950/60',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  DECISION: {
    label: 'Decisions',
    icon: Scale,
    color: 'text-indigo-700 dark:text-indigo-300',
    bg: 'bg-indigo-50 dark:bg-indigo-950/60',
    border: 'border-indigo-200 dark:border-indigo-800',
  },
  IDEA: {
    label: 'Ideas',
    icon: Lightbulb,
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-50 dark:bg-amber-950/60',
    border: 'border-amber-200 dark:border-amber-800',
  },
  GOAL: {
    label: 'Goals',
    icon: Target,
    color: 'text-blue-700 dark:text-blue-300',
    bg: 'bg-blue-50 dark:bg-blue-950/60',
    border: 'border-blue-200 dark:border-blue-800',
  },
  EVENT: {
    label: 'Events',
    icon: Calendar,
    color: 'text-purple-700 dark:text-purple-300',
    bg: 'bg-purple-50 dark:bg-purple-950/60',
    border: 'border-purple-200 dark:border-purple-800',
  },
  PERSON: {
    label: 'People',
    icon: Users,
    color: 'text-pink-700 dark:text-pink-300',
    bg: 'bg-pink-50 dark:bg-pink-950/60',
    border: 'border-pink-200 dark:border-pink-800',
  },
  PLACE: {
    label: 'Places',
    icon: MapPin,
    color: 'text-teal-700 dark:text-teal-300',
    bg: 'bg-teal-50 dark:bg-teal-950/60',
    border: 'border-teal-200 dark:border-teal-800',
  },
  CONCERN: {
    label: 'Concerns',
    icon: AlertTriangle,
    color: 'text-rose-700 dark:text-rose-300',
    bg: 'bg-rose-50 dark:bg-rose-950/60',
    border: 'border-rose-200 dark:border-rose-800',
  },
  PREFERENCE: {
    label: 'Preferences',
    icon: Star,
    color: 'text-orange-700 dark:text-orange-300',
    bg: 'bg-orange-50 dark:bg-orange-950/60',
    border: 'border-orange-200 dark:border-orange-800',
  },
};

export default function TimelinePage() {
  const { user, loading: authLoading, getIdToken } = useAuth();
  const router = useRouter();

  const [activeFilter, setActiveFilter] = useState<TimelineFilterType>('ALL');
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [changeInsight, setChangeInsight] = useState<TimelineChangeInsight | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchTimeline = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const token = await getIdToken();
      if (!token) return;

      const url =
        activeFilter === 'ALL'
          ? '/api/timeline'
          : `/api/timeline?filter=${activeFilter}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error?.message || 'Failed to load timeline');
      }

      setItems(json.data.items || []);
      setChangeInsight(json.data.changeInsight || null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not load timeline data.');
    } finally {
      setIsLoading(false);
    }
  }, [getIdToken, activeFilter]);

  useEffect(() => {
    if (user) {
      fetchTimeline();
    }
  }, [user, fetchTimeline]);

  const filterKeys: TimelineFilterType[] = [
    'ALL',
    'JOURNAL',
    'ACHIEVEMENT',
    'DECISION',
    'GOAL',
    'IDEA',
    'EVENT',
    'PERSON',
    'PLACE',
    'CONCERN',
    'PREFERENCE',
  ];

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        <p className="text-sm text-slate-500">Loading your timeline...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-xs font-semibold">
          <Clock className="w-3.5 h-3.5" />
          <span>Chronological Growth Story</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Personal Growth Timeline
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
          Trace how your ideas, milestones, decisions, and goals have developed over time from your actual journal records.
        </p>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {filterKeys.map((fk) => {
          const isSelected = activeFilter === fk;
          const config = FILTER_CONFIG[fk];
          const Icon = config.icon;

          return (
            <button
              key={fk}
              onClick={() => setActiveFilter(fk)}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 ${
                isSelected
                  ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/20'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-teal-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{config.label}</span>
            </button>
          );
        })}
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* "What Changed?" Grounded Insight Banner */}
      {changeInsight && activeFilter === 'ALL' && (
        <div className="p-5 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 shadow-sm flex items-start space-x-3">
          <TrendingUp className="w-5 h-5 text-teal-600 dark:text-teal-400 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-200">
              Pattern Shift Observed
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {changeInsight.shiftSummary}
            </p>
          </div>
        </div>
      )}

      {/* Timeline Stream */}
      {isLoading ? (
        <div className="space-y-6 py-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="flex items-start space-x-4 animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0" />
              <div className="flex-1 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="w-32 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="w-full h-12 bg-slate-100 dark:bg-slate-850 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        /* Empty state */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-4 max-w-md mx-auto shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950 flex items-center justify-center text-teal-600 dark:text-teal-400 mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Your story starts here</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            No entries match this filter yet. Write your thoughts to build your chronological growth timeline.
          </p>
          <Link
            href="/journal"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium transition-colors"
          >
            <span>Write an Entry</span>
          </Link>
        </div>
      ) : (
        /* Populated Timeline */
        <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
          {items.map((item) => {
            const config = FILTER_CONFIG[item.type] || FILTER_CONFIG.JOURNAL;
            const Icon = config.icon;

            return (
              <div key={item.id} className="relative group">
                
                {/* Timeline node icon */}
                <div
                  className={`absolute -left-6 sm:-left-8 top-3 w-6 h-6 sm:w-8 sm:h-8 rounded-xl border flex items-center justify-center ${config.bg} ${config.border} shadow-sm group-hover:scale-110 transition-transform`}
                >
                  <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${config.color}`} />
                </div>

                {/* Timeline Content Card */}
                <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-teal-300 dark:hover:border-teal-700 transition-all space-y-3">
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${config.bg} ${config.color} ${config.border}`}
                      >
                        {config.label}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    {item.sourceJournalId && (
                      <Link
                        href={`/journal?id=${item.sourceJournalId}`}
                        className="inline-flex items-center space-x-1 text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium self-start sm:self-auto"
                      >
                        <span>View source entry</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                      {item.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
