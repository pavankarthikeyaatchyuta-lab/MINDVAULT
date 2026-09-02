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
  Calendar,
  Clock,
  Loader2,
  AlertCircle,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  Shield,
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
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        <p className="text-sm text-slate-500">Synthesizing personal insights from your vault...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-4">
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-xs font-semibold">
          <Brain className="w-3.5 h-3.5" />
          <span>Grounded Personal Evolution Engine</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          MindVault Insights
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
          Discover how your focus, goals, interests, and patterns evolve over time — grounded strictly in verified journal data.
        </p>
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
            <div className="w-48 h-6 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            <div className="grid grid-cols-3 gap-4">
              <div className="h-16 bg-slate-100 dark:bg-slate-850 rounded-xl" />
              <div className="h-16 bg-slate-100 dark:bg-slate-850 rounded-xl" />
              <div className="h-16 bg-slate-100 dark:bg-slate-850 rounded-xl" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-56 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 animate-pulse" />
            <div className="h-56 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 animate-pulse" />
          </div>
        </div>
      ) : insights?.isEmpty ? (
        /* Empty State */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-4 max-w-md mx-auto shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950 flex items-center justify-center text-teal-600 dark:text-teal-400 mx-auto">
            <Brain className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Your story is waiting to be written</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Write your first journal entries to unlock deep, grounded insights into your emerging interests, goals, and personal patterns.
          </p>
          <Link
            href="/journal"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium transition-colors"
          >
            <span>Write an Entry</span>
          </Link>
        </div>
      ) : insights ? (
        /* Populated Insights */
        <div className="space-y-6 animate-fadeIn">
          
          {/* Executive Summary Card */}
          <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-teal-950/15 via-emerald-950/10 to-slate-900/60 border border-teal-200 dark:border-teal-800/80 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-teal-200/40 dark:border-teal-800/40">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Growth & Pattern Summary</h2>
              </div>
              <span className="text-[11px] font-semibold text-teal-700 dark:text-teal-300 uppercase tracking-wider">
                Grounded Synthesis
              </span>
            </div>

            <p className="text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
              {insights.summary}
            </p>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-850/80 border border-slate-200 dark:border-slate-750">
                <span className="text-[11px] text-slate-500 block">Total Reflections</span>
                <span className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5 block">
                  {insights.periodStats.totalJournals}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-850/80 border border-slate-200 dark:border-slate-750">
                <span className="text-[11px] text-slate-500 block">Extracted Memories</span>
                <span className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5 block">
                  {insights.periodStats.totalMemories}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-850/80 border border-slate-200 dark:border-slate-750">
                <span className="text-[11px] text-slate-500 block">Active Days</span>
                <span className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5 block">
                  {insights.periodStats.activeDays}
                </span>
              </div>
            </div>
          </div>

          {/* Grid: Emerging Interests & Recurring Themes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Emerging Interests */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 text-teal-700 dark:text-teal-300">
                <TrendingUp className="w-5 h-5 text-teal-500" />
                <h3 className="text-sm font-bold uppercase tracking-wider">Emerging Interests</h3>
              </div>
              <p className="text-xs text-slate-500">Topics that appeared with increasing frequency in recent entries.</p>

              <div className="space-y-3">
                {insights.emergingInterests && insights.emergingInterests.length > 0 ? (
                  insights.emergingInterests.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">#{item.interest}</span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 font-semibold">
                          {item.earlierCount} → {item.recentCount} mentions
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{item.explanation}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">Not enough data to calculate emerging trends yet.</p>
                )}
              </div>
            </div>

            {/* Recurring Themes */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 text-teal-700 dark:text-teal-300">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold uppercase tracking-wider">Recurring Core Themes</h3>
              </div>
              <p className="text-xs text-slate-500">Persistent themes that frequently anchor your thoughts.</p>

              <div className="space-y-3">
                {insights.recurringThemes && insights.recurringThemes.length > 0 ? (
                  insights.recurringThemes.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">#{item.theme}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{item.count} entries</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{item.description}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">No recurring themes detected yet.</p>
                )}
              </div>
            </div>

          </div>

          {/* Goals & Momentum */}
          {insights.goalMomentum && insights.goalMomentum.length > 0 && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center space-x-2 text-teal-700 dark:text-teal-300">
                <Target className="w-5 h-5 text-blue-500" />
                <h3 className="text-sm font-bold uppercase tracking-wider">Goals & Momentum</h3>
              </div>
              <p className="text-xs text-slate-500">Tracked goals with non-judgmental progress indicators.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {insights.goalMomentum.map((g, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 flex items-start justify-between"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{g.goal}</h4>
                      <span
                        className={`inline-block text-[10px] font-semibold mt-1 px-2 py-0.5 rounded-full ${
                          g.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : g.status === 'active'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {g.status.toUpperCase()}
                      </span>
                    </div>
                    {g.sourceJournalId && (
                      <Link
                        href={`/journal?id=${g.sourceJournalId}`}
                        className="text-teal-600 dark:text-teal-400 hover:underline text-xs flex items-center space-x-1"
                      >
                        <ExternalLink className="w-3 h-3" />
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
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center space-x-2 text-teal-700 dark:text-teal-300">
                <Users className="w-4 h-4 text-pink-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Social Footprint</h3>
              </div>
              <div className="space-y-2">
                {insights.peopleAndPlaces.topPeople && insights.peopleAndPlaces.topPeople.length > 0 ? (
                  insights.peopleAndPlaces.topPeople.map((p, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 text-xs"
                    >
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{p.name}</span>
                      <span className="text-[11px] text-slate-400">{p.mentions} mention{p.mentions > 1 ? 's' : ''}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">No person memories recorded yet.</p>
                )}
              </div>
            </div>

            {/* Places */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center space-x-2 text-teal-700 dark:text-teal-300">
                <MapPin className="w-4 h-4 text-teal-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Geographic Footprint</h3>
              </div>
              <div className="space-y-2">
                {insights.peopleAndPlaces.topPlaces && insights.peopleAndPlaces.topPlaces.length > 0 ? (
                  insights.peopleAndPlaces.topPlaces.map((pl, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 text-xs"
                    >
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{pl.name}</span>
                      <span className="text-[11px] text-slate-400">{pl.mentions} mention{pl.mentions > 1 ? 's' : ''}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">No place memories recorded yet.</p>
                )}
              </div>
              <div className="pt-1">
                <Link
                  href="/map"
                  className="inline-flex items-center space-x-1.5 text-xs text-teal-600 dark:text-teal-400 hover:underline font-semibold"
                >
                  <span>Explore on Memory Map</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

          </div>

          {/* Grounded Reflection Card */}
          {insights.reflection && (
            <div className="p-6 sm:p-8 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 shadow-sm space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-teal-800 dark:text-teal-200 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>Closing Perspective</span>
              </div>
              <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 italic leading-relaxed">
                &ldquo;{insights.reflection}&rdquo;
              </p>
            </div>
          )}

          {/* Sources Section */}
          {insights.sources && insights.sources.length > 0 && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Verified Source Documents</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {insights.sources.map((s, idx) => (
                  <Link
                    key={idx}
                    href={`/journal?id=${s.sourceId}`}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-850 hover:bg-teal-50 dark:hover:bg-teal-950 border border-slate-200 dark:border-slate-750 text-xs text-slate-700 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                  >
                    <span>{s.title}</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
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
