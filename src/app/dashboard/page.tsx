'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { BookOpen, Sparkles, Target, Shield, Compass, ArrowRight, Loader2, Lock, Search, Clock, TrendingUp, MapPin, Brain } from 'lucide-react';

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
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        <p className="text-sm text-slate-500">Verifying secure session...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-8 py-4">
      {/* Welcome Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Welcome back{user.displayName ? `, ${user.displayName}` : ''}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Your private journal vault is active and encrypted.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 px-3.5 py-2 rounded-xl self-start sm:self-auto">
            <Lock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Isolated UID: <span className="font-mono">{user.uid.slice(0, 10)}...</span></span>
          </div>
        </div>
      </div>

      {/* Navigation Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        
        <Link
          href="/journal"
          className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-600 shadow-sm transition-all hover:shadow-md space-y-3"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950 flex items-center justify-center text-teal-600 dark:text-teal-400 group-hover:scale-105 transition-transform">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
              Journal & Chat
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Reflective multi-turn Gemini thinking companion.
            </p>
          </div>
        </Link>

        <Link
          href="/memories"
          className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 shadow-sm transition-all hover:shadow-md space-y-3"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              Memories
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Categorized structured decisions, achievements & ideas.
            </p>
          </div>
        </Link>

        <Link
          href="/ask"
          className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-400 dark:hover:border-sky-600 shadow-sm transition-all hover:shadow-md space-y-3"
        >
          <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950 flex items-center justify-center text-sky-600 dark:text-sky-400 group-hover:scale-105 transition-transform">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
              Ask My Journal
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Natural-language query with verified source citations.
            </p>
          </div>
        </Link>

        <Link
          href="/rewind"
          className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 shadow-sm transition-all hover:shadow-md space-y-3"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              Journal Rewind
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              7/30/90d & all-time visual retrospective synthesis.
            </p>
          </div>
        </Link>

        <Link
          href="/timeline"
          className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-600 shadow-sm transition-all hover:shadow-md space-y-3"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              Growth Timeline
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Chronological evolution and pattern shift detection.
            </p>
          </div>
        </Link>

        <Link
          href="/map"
          className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-600 shadow-sm transition-all hover:shadow-md space-y-3"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950 flex items-center justify-center text-teal-600 dark:text-teal-400 group-hover:scale-105 transition-transform">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
              Memory Map
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Geographic footprint of places woven into your story.
            </p>
          </div>
        </Link>

        <Link
          href="/insights"
          className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-600 shadow-sm transition-all hover:shadow-md space-y-3"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              Insights
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Emerging interests, recurring themes & goal momentum.
            </p>
          </div>
        </Link>

      </div>

      {/* Security Banner */}
      <div className="p-6 rounded-2xl bg-slate-900 text-white border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-teal-400 text-xs font-semibold uppercase tracking-wider">
            <Shield className="w-4 h-4" />
            <span>P0 Security Foundation Active</span>
          </div>
          <p className="text-sm text-slate-300">
            Firebase ID token verification is active on all backend routes. Client-supplied UIDs are strictly ignored in favor of verified claims.
          </p>
        </div>
        <Link
          href="/privacy"
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium transition-colors shrink-0"
        >
          <span>View Privacy Status</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

    </div>
  );
}
