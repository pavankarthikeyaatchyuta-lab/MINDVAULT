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
      <section
        className="relative text-center space-y-6 max-w-4xl mx-auto py-12 px-6 sm:px-12 rounded-3xl border animate-fadeIn overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(196, 181, 253, 0.12) 0%, rgba(99, 102, 241, 0.08) 50%, rgba(139, 92, 246, 0.05) 100%)',
          borderColor: 'var(--mv-border)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="inline-flex items-center space-x-2 mv-badge px-3.5 py-1.5 border" style={{ borderColor: 'var(--mv-border)' }}>
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>Google Cloud Gen AI Academy Cohort 3 Ideathon</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
          <span className="mv-gradient-text">MindVault</span>
        </h1>
        <p className="text-xl sm:text-2xl font-medium text-indigo-600 dark:text-indigo-400">
          &ldquo;Your journal that remembers.&rdquo;
        </p>

        <p className="text-base sm:text-lg leading-relaxed max-w-2xl mx-auto" style={{ color: 'var(--mv-text-muted)' }}>
          Your journal doesn&apos;t just remember what you wrote. It helps you remember what mattered,
          understand how you changed, and rediscover the thoughts you almost forgot.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          {user ? (
            <Link
              href="/dashboard"
              className="mv-btn-primary inline-flex items-center space-x-2 px-6 py-3 text-base shadow-lg shadow-indigo-500/20"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                href="/signup"
                className="mv-btn-primary inline-flex items-center space-x-2 px-6 py-3 text-base shadow-lg shadow-indigo-500/20"
              >
                <span>Start Writing Privately</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="mv-btn-secondary inline-flex items-center space-x-2 px-6 py-3 text-base"
              >
                <span>Sign In</span>
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Feature Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="mv-card mv-card-hover p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Brain className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold" style={{ color: 'var(--mv-text)' }}>
            Multi-Turn Gemini Dialogue
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--mv-text-muted)' }}>
            Conversational reflection that acts as an intellectual companion, retrieving your personal context without overwhelming prompts.
          </p>
        </div>

        <div className="mv-card mv-card-hover p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-950/60 flex items-center justify-center text-violet-600 dark:text-violet-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold" style={{ color: 'var(--mv-text)' }}>
            AI Memory Extraction
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--mv-text-muted)' }}>
            Automatically categorizes ideas, goals, decisions, achievements, and concerns into structured, searchable cards.
          </p>
        </div>

        <div className="mv-card mv-card-hover p-6 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold" style={{ color: 'var(--mv-text)' }}>
            Journal Rewind &amp; Timeline
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--mv-text-muted)' }}>
            Visual retrospectives (7d, 30d, 90d) revealing recurring themes, unfinished thoughts, and personal growth over time.
          </p>
        </div>
      </section>

      {/* Security Architecture Callout */}
      <section className="mv-card p-8 space-y-4">
        <div className="flex items-center space-x-3 font-bold text-indigo-600 dark:text-indigo-400">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Shield className="w-5 h-5" />
          </div>
          <h2 className="text-xl" style={{ color: 'var(--mv-text)' }}>
            Production-Grade Security Architecture
          </h2>
        </div>
        <p className="text-sm max-w-2xl leading-relaxed" style={{ color: 'var(--mv-text-muted)' }}>
          MindVault enforces complete user data isolation. Every Firestore document is strictly scoped to the authenticated Firebase UID (users/[uid]/*).
          Server secrets are managed via Google Cloud Secret Manager with zero client leakage.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs font-medium" style={{ color: 'var(--mv-text)' }}>
          <div className="flex items-center space-x-2 p-2.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border" style={{ borderColor: 'var(--mv-border)' }}>
            <CheckCircle2 className="w-4 h-4 text-indigo-500 flex-shrink-0" />
            <span>Firebase Auth Verified</span>
          </div>
          <div className="flex items-center space-x-2 p-2.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border" style={{ borderColor: 'var(--mv-border)' }}>
            <CheckCircle2 className="w-4 h-4 text-indigo-500 flex-shrink-0" />
            <span>UID Isolated Firestore</span>
          </div>
          <div className="flex items-center space-x-2 p-2.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border" style={{ borderColor: 'var(--mv-border)' }}>
            <CheckCircle2 className="w-4 h-4 text-indigo-500 flex-shrink-0" />
            <span>Secret Manager Enabled</span>
          </div>
          <div className="flex items-center space-x-2 p-2.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border" style={{ borderColor: 'var(--mv-border)' }}>
            <CheckCircle2 className="w-4 h-4 text-indigo-500 flex-shrink-0" />
            <span>Cloud Run Standalone</span>
          </div>
        </div>
      </section>
    </div>
  );
}
