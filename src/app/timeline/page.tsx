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
    color: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
  },
  JOURNAL: {
    label: 'Journals',
    icon: BookOpen,
    color: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
  },
  ACHIEVEMENT: {
    label: 'Achievements',
    icon: Award,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  DECISION: {
    label: 'Decisions',
    icon: Scale,
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
  },
  IDEA: {
    label: 'Ideas',
    icon: Lightbulb,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  GOAL: {
    label: 'Goals',
    icon: Target,
    color: 'text-sky-600 dark:text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/20',
  },
  EVENT: {
    label: 'Events',
    icon: Calendar,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
  },
  PERSON: {
    label: 'People',
    icon: Users,
    color: 'text-pink-600 dark:text-pink-400',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/20',
  },
  PLACE: {
    label: 'Places',
    icon: MapPin,
    color: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
  },
  CONCERN: {
    label: 'Concerns',
    icon: AlertTriangle,
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
  },
  PREFERENCE: {
    label: 'Preferences',
    icon: Star,
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
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
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-sm" style={{ color: 'var(--mv-text-muted)' }}>Loading your timeline...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4 animate-fadeIn">
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
          <Clock className="w-3.5 h-3.5 text-indigo-500" />
          <span>Chronological Growth Story</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: 'var(--mv-text)' }}>
          Personal Growth Timeline
        </h1>
        <p className="text-sm sm:text-base" style={{ color: 'var(--mv-text-muted)' }}>
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
                  ? 'mv-btn-primary shadow-sm shadow-indigo-500/25'
                  : 'mv-card text-slate-600 dark:text-slate-400 hover:border-indigo-400/40 hover:text-indigo-500'
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
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* "What Changed?" Grounded Insight Banner */}
      {changeInsight && activeFilter === 'ALL' && (
        <div className="p-5 mv-card border-indigo-500/30 bg-indigo-500/5 shadow-sm flex items-start space-x-3">
          <TrendingUp className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Pattern Shift Observed
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed" style={{ color: 'var(--mv-text)' }}>
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
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 shrink-0" />
              <div className="flex-1 p-5 mv-card space-y-2">
                <div className="w-32 h-4 bg-indigo-500/10 rounded" />
                <div className="w-full h-12 bg-indigo-500/5 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        /* Empty state */
        <div className="mv-card p-12 text-center space-y-4 max-w-md mx-auto shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold" style={{ color: 'var(--mv-text)' }}>Your story starts here</h3>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--mv-text-muted)' }}>
            No entries match this filter yet. Write your thoughts to build your chronological growth timeline.
          </p>
          <Link
            href="/journal"
            className="mv-btn-primary inline-flex items-center space-x-2 px-4 py-2 text-xs font-medium"
          >
            <span>Write an Entry</span>
          </Link>
        </div>
      ) : (
        /* Populated Timeline */
        <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-indigo-300 before:via-violet-300 before:to-indigo-200 dark:before:from-indigo-500/60 dark:before:via-violet-500/40 dark:before:to-indigo-500/10">
          {items.map((item) => {
            const config = FILTER_CONFIG[item.type] || FILTER_CONFIG.JOURNAL;
            const Icon = config.icon;

            return (
              <div key={item.id} className="relative group">
                
                {/* Timeline node icon */}
                <div
                  className={`absolute -left-6 sm:-left-8 top-3 w-6 h-6 sm:w-8 sm:h-8 rounded-xl border flex items-center justify-center ${config.bg} ${config.border} shadow-sm group-hover:scale-110 transition-transform backdrop-blur-md`}
                >
                  <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${config.color}`} />
                </div>

                {/* Timeline Content Card */}
                <div className="mv-card mv-card-hover p-5 sm:p-6 space-y-3">
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${config.bg} ${config.color} ${config.border}`}
                      >
                        {config.label}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--mv-text-muted)' }}>
                        {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    {item.sourceJournalId && (
                      <Link
                        href={`/journal?id=${item.sourceJournalId}`}
                        className="inline-flex items-center space-x-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-violet-500 hover:underline font-medium self-start sm:self-auto"
                      >
                        <span>View source entry</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-bold leading-snug" style={{ color: 'var(--mv-text)' }}>
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm mt-1 leading-relaxed" style={{ color: 'var(--mv-text-muted)' }}>
                      {item.description}
                    </p>
                  </div>

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-2 border-t" style={{ borderColor: 'var(--mv-border)' }}>
                      {item.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2 py-0.5 rounded-md border"
                          style={{
                            color: 'var(--mv-text-muted)',
                            borderColor: 'var(--mv-border)',
                            background: 'rgba(99, 102, 241, 0.05)',
                          }}
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
