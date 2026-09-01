'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { BookOpen, Sparkles, Shield, ArrowRight, Brain, Clock, Target, CheckCircle2 } from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="text-center space-y-6 max-w-3xl mx-auto pt-6">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-xs font-semibold tracking-wide">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Google Cloud Gen AI Academy Cohort 3 Ideathon</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          MindVault
        </h1>
        <p className="text-xl sm:text-2xl font-medium text-teal-600 dark:text-teal-400">
          &ldquo;Your journal that remembers.&rdquo;
        </p>

        <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
          Your journal doesn&apos;t just remember what you wrote. It helps you remember what mattered,
          understand how you changed, and rediscover the thoughts you almost forgot.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          {user ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium shadow-lg shadow-teal-600/25 transition-all transform hover:-translate-y-0.5"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                href="/signup"
                className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium shadow-lg shadow-teal-600/25 transition-all transform hover:-translate-y-0.5"
              >
                <span>Start Writing Privately</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium border border-slate-200 dark:border-slate-800 transition-colors"
              >
                <span>Sign In</span>
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Feature Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950 flex items-center justify-center text-teal-600 dark:text-teal-400">
            <Brain className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Multi-Turn Gemini Dialogue</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Conversational reflection that acts as an intellectual companion, retrieving your personal context without overwhelming prompts.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">AI Memory Extraction</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Automatically categorizes ideas, goals, decisions, achievements, and concerns into structured, searchable cards.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Journal Rewind & Timeline</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Visual retrospectives (7d, 30d, 90d) revealing recurring themes, unfinished thoughts, and personal growth over time.
          </p>
        </div>
      </section>

      {/* Security Architecture Callout */}
      <section className="p-8 rounded-2xl bg-gradient-to-r from-teal-900/10 via-emerald-900/10 to-transparent border border-teal-200 dark:border-teal-900/50 space-y-4">
        <div className="flex items-center space-x-2 text-teal-700 dark:text-teal-300 font-bold">
          <Shield className="w-5 h-5" />
          <h2 className="text-xl">Production-Grade Security Architecture</h2>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
          MindVault enforces complete user data isolation. Every Firestore document is strictly scoped to the authenticated Firebase UID (users/[uid]/*).
          Server secrets are managed via Google Cloud Secret Manager with zero client leakage.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs font-medium text-slate-700 dark:text-slate-300">
          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Firebase Auth Verified</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>UID Isolated Firestore</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Secret Manager Enabled</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Cloud Run Standalone</span>
          </div>
        </div>
      </section>
    </div>
  );
}
