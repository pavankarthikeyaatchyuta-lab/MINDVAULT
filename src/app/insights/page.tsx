'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  Brain,
  Sparkles,
  TrendingUp,
  Target,
  Users,
  MapPin,
  ExternalLink,
  BookOpen,
  Loader2,
  AlertCircle,
  Lightbulb,
  ArrowRight,
} from 'lucide-react';
import { InsightsReport } from '@/types';

export default function InsightsPage() {
  const { user, loading: authLoading, getIdToken } = useAuth();
  const router = useRouter();

  const [insights, setInsights] = useState<InsightsReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchInsights = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const token = await getIdToken();
      if (!token) return;

      const res = await fetch('/api/insights', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error?.message || 'Failed to synthesize journal insights');
      }

      setInsights(json.data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not load insights at this moment.');
    } finally {
      setIsLoading(false);
    }
  }, [getIdToken]);

  useEffect(() => {
    if (user) {
      fetchInsights();
    }
  }, [user, fetchInsights]);

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-sm" style={{ color: 'var(--mv-text-muted)' }}>
          Synthesizing personal insights from your vault...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4 animate-fadeIn">
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="mv-badge">
          <Brain className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
          <span>Grounded Personal Evolution Engine</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: 'var(--mv-text)' }}>
          MindVault Insights
        </h1>
        <p className="text-sm sm:text-base" style={{ color: 'var(--mv-text-muted)' }}>
          Discover how your focus, goals, interests, and patterns evolve over time — grounded strictly in verified journal data.
        </p>
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
          <div className="mv-card p-8 animate-pulse space-y-4">
            <div className="w-48 h-6 bg-indigo-500/10 rounded-lg" />
            <div className="grid grid-cols-3 gap-4">
              <div className="h-16 bg-indigo-500/5 rounded-xl" />
              <div className="h-16 bg-indigo-500/5 rounded-xl" />
              <div className="h-16 bg-indigo-500/5 rounded-xl" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-56 mv-card animate-pulse" />
            <div className="h-56 mv-card animate-pulse" />
          </div>
        </div>
      ) : insights?.isEmpty ? (
        /* Empty State */
        <div className="mv-card p-12 text-center space-y-4 max-w-md mx-auto shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 mx-auto">
            <Brain className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold" style={{ color: 'var(--mv-text)' }}>
            Your story is waiting to be written
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--mv-text-muted)' }}>
            Write your first journal entries to unlock deep, grounded insights into your emerging interests, goals, and personal patterns.
          </p>
          <Link
            href="/journal"
            className="mv-btn-primary inline-flex items-center space-x-2 text-xs"
          >
            <span>Write an Entry</span>
          </Link>
        </div>
      ) : insights ? (
        /* Populated Insights */
        <div className="space-y-6">
          {/* Executive Summary Card */}
          <div
            className="mv-card p-6 sm:p-8 space-y-4 relative overflow-hidden"
            style={{
              background:
                'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.05) 50%, var(--mv-surface) 100%)',
            }}
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--mv-border)' }}>
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                <h2 className="text-base font-bold" style={{ color: 'var(--mv-text)' }}>
                  Growth & Pattern Summary
                </h2>
              </div>
              <span className="mv-badge text-[11px] font-semibold uppercase tracking-wider">
                Grounded Synthesis
              </span>
            </div>

            <p className="text-sm sm:text-base leading-relaxed font-normal" style={{ color: 'var(--mv-text)' }}>
              {insights.summary}
            </p>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div
                className="p-3.5 rounded-xl border"
                style={{ background: 'rgba(99, 102, 241, 0.04)', borderColor: 'var(--mv-border)' }}
              >
                <span className="text-[11px] block" style={{ color: 'var(--mv-text-muted)' }}>
                  Total Reflections
                </span>
                <span className="text-xl font-extrabold mt-0.5 block" style={{ color: 'var(--mv-text)' }}>
                  {insights.periodStats.totalJournals}
                </span>
              </div>

              <div
                className="p-3.5 rounded-xl border"
                style={{ background: 'rgba(99, 102, 241, 0.04)', borderColor: 'var(--mv-border)' }}
              >
                <span className="text-[11px] block" style={{ color: 'var(--mv-text-muted)' }}>
                  Extracted Memories
                </span>
                <span className="text-xl font-extrabold mt-0.5 block" style={{ color: 'var(--mv-text)' }}>
                  {insights.periodStats.totalMemories}
                </span>
              </div>

              <div
                className="p-3.5 rounded-xl border"
                style={{ background: 'rgba(99, 102, 241, 0.04)', borderColor: 'var(--mv-border)' }}
              >
                <span className="text-[11px] block" style={{ color: 'var(--mv-text-muted)' }}>
                  Active Days
                </span>
                <span className="text-xl font-extrabold mt-0.5 block" style={{ color: 'var(--mv-text)' }}>
                  {insights.periodStats.activeDays}
                </span>
              </div>
            </div>
          </div>

          {/* Grid: Emerging Interests & Recurring Themes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Emerging Interests */}
            <div className="mv-card p-6 space-y-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-indigo-500" />
                <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--mv-text)' }}>
                  Emerging Interests
                </h3>
              </div>
              <p className="text-xs" style={{ color: 'var(--mv-text-muted)' }}>
                Topics that appeared with increasing frequency in recent entries.
              </p>

              <div className="space-y-3">
                {insights.emergingInterests && insights.emergingInterests.length > 0 ? (
                  insights.emergingInterests.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border space-y-1.5"
                      style={{ background: 'rgba(99, 102, 241, 0.04)', borderColor: 'var(--mv-border)' }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs" style={{ color: 'var(--mv-text)' }}>
                          #{item.interest}
                        </span>
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                          {item.earlierCount} → {item.recentCount} mentions
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--mv-text-muted)' }}>
                        {item.explanation}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs" style={{ color: 'var(--mv-text-muted)' }}>
                    Not enough data to calculate emerging trends yet.
                  </p>
                )}
              </div>
            </div>

            {/* Recurring Themes */}
            <div className="mv-card p-6 space-y-4">
              <div className="flex items-center space-x-2">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--mv-text)' }}>
                  Recurring Core Themes
                </h3>
              </div>
              <p className="text-xs" style={{ color: 'var(--mv-text-muted)' }}>
                Persistent themes that frequently anchor your thoughts.
              </p>

              <div className="space-y-3">
                {insights.recurringThemes && insights.recurringThemes.length > 0 ? (
                  insights.recurringThemes.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border space-y-1"
                      style={{ background: 'rgba(99, 102, 241, 0.04)', borderColor: 'var(--mv-border)' }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs" style={{ color: 'var(--mv-text)' }}>
                          #{item.theme}
                        </span>
                        <span className="text-[10px] font-medium" style={{ color: 'var(--mv-text-muted)' }}>
                          {item.count} entries
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--mv-text-muted)' }}>
                        {item.description}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs" style={{ color: 'var(--mv-text-muted)' }}>
                    No recurring themes detected yet.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Goals & Momentum */}
          {insights.goalMomentum && insights.goalMomentum.length > 0 && (
            <div className="mv-card p-6 space-y-4">
              <div className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-indigo-500" />
                <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--mv-text)' }}>
                  Goals & Momentum
                </h3>
              </div>
              <p className="text-xs" style={{ color: 'var(--mv-text-muted)' }}>
                Tracked goals with non-judgmental progress indicators.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {insights.goalMomentum.map((g, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border flex items-start justify-between"
                    style={{ background: 'rgba(99, 102, 241, 0.04)', borderColor: 'var(--mv-border)' }}
                  >
                    <div>
                      <h4 className="text-xs font-bold" style={{ color: 'var(--mv-text)' }}>
                        {g.goal}
                      </h4>
                      <span
                        className={`inline-block text-[10px] font-semibold mt-1 px-2.5 py-0.5 rounded-full border ${
                          g.status === 'completed'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
                            : g.status === 'active'
                            ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/25'
                            : 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/25'
                        }`}
                      >
                        {g.status.toUpperCase()}
                      </span>
                    </div>
                    {g.sourceJournalId && (
                      <Link
                        href={`/journal?id=${g.sourceJournalId}`}
                        className="text-indigo-600 dark:text-indigo-400 hover:text-violet-500 text-xs flex items-center space-x-1 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* People & Places Footprint */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* People */}
            <div className="mv-card p-6 space-y-3">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-violet-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--mv-text)' }}>
                  Social Footprint
                </h3>
              </div>
              <div className="space-y-2">
                {insights.peopleAndPlaces.topPeople && insights.peopleAndPlaces.topPeople.length > 0 ? (
                  insights.peopleAndPlaces.topPeople.map((p, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl border text-xs"
                      style={{ background: 'rgba(99, 102, 241, 0.04)', borderColor: 'var(--mv-border)' }}
                    >
                      <span className="font-semibold" style={{ color: 'var(--mv-text)' }}>
                        {p.name}
                      </span>
                      <span className="text-[11px]" style={{ color: 'var(--mv-text-muted)' }}>
                        {p.mentions} mention{p.mentions > 1 ? 's' : ''}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs" style={{ color: 'var(--mv-text-muted)' }}>
                    No person memories recorded yet.
                  </p>
                )}
              </div>
            </div>

            {/* Places */}
            <div className="mv-card p-6 space-y-3">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--mv-text)' }}>
                  Geographic Footprint
                </h3>
              </div>
              <div className="space-y-2">
                {insights.peopleAndPlaces.topPlaces && insights.peopleAndPlaces.topPlaces.length > 0 ? (
                  insights.peopleAndPlaces.topPlaces.map((pl, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl border text-xs"
                      style={{ background: 'rgba(99, 102, 241, 0.04)', borderColor: 'var(--mv-border)' }}
                    >
                      <span className="font-semibold" style={{ color: 'var(--mv-text)' }}>
                        {pl.name}
                      </span>
                      <span className="text-[11px]" style={{ color: 'var(--mv-text-muted)' }}>
                        {pl.mentions} mention{pl.mentions > 1 ? 's' : ''}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs" style={{ color: 'var(--mv-text-muted)' }}>
                    No place memories recorded yet.
                  </p>
                )}
              </div>
              <div className="pt-1">
                <Link
                  href="/map"
                  className="inline-flex items-center space-x-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:text-violet-500 font-semibold transition-colors"
                >
                  <span>Explore on Memory Map</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Grounded Reflection Card */}
          {insights.reflection && (
            <div
              className="p-6 sm:p-8 rounded-2xl border space-y-2 relative overflow-hidden backdrop-blur-md"
              style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.06), rgba(139, 92, 246, 0.08))',
                borderColor: 'rgba(139, 92, 246, 0.3)',
                boxShadow: '0 4px 20px rgba(139, 92, 246, 0.08)',
              }}
            >
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                <Sparkles className="w-4 h-4 text-violet-500" />
                <span>Closing Perspective</span>
              </div>
              <p className="text-sm sm:text-base italic leading-relaxed" style={{ color: 'var(--mv-text)' }}>
                &ldquo;{insights.reflection}&rdquo;
              </p>
            </div>
          )}

          {/* Sources Section */}
          {insights.sources && insights.sources.length > 0 && (
            <div className="pt-4 border-t space-y-3" style={{ borderColor: 'var(--mv-border)' }}>
              <div
                className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--mv-text-muted)' }}
              >
                <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                <span>Verified Source Documents</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {insights.sources.map((s, idx) => (
                  <Link
                    key={idx}
                    href={`/journal?id=${s.sourceId}`}
                    className="mv-badge hover:bg-indigo-500/20 border border-indigo-500/20 text-xs space-x-1.5 py-1.5 px-3 transition-all hover:scale-105"
                  >
                    <span style={{ color: 'var(--mv-text)' }}>{s.title}</span>
                    <ExternalLink className="w-3 h-3 text-indigo-400" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
