'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  PenLine,
  MessageSquare,
  Sparkles,
  MapPin,
  ArrowRight,
  BookOpen,
  Layers,
  TrendingUp,
  Activity,
  Quote,
  Loader2,
  Sprout,
  Bot,
} from 'lucide-react';
import { JournalEntry } from '@/types';

interface SampleJournal {
  id: string;
  month: string;
  day: string;
  title: string;
  excerpt: string;
}

const fallbackEntries: SampleJournal[] = [
  {
    id: 'sample-1',
    month: 'DEC',
    day: '15',
    title: 'Working on MindVault today',
    excerpt: 'Made good progress on the prototype. Feeling excited about the journey ahead...',
  },
  {
    id: 'sample-2',
    month: 'DEC',
    day: '12',
    title: 'Learning and growing',
    excerpt: 'Spent time reading about AI and cloud deployment. I feel more confident now...',
  },
  {
    id: 'sample-3',
    month: 'DEC',
    day: '10',
    title: 'A day of gratitude',
    excerpt: 'Grateful for the support from friends and family. Small steps lead to big things...',
  },
];

export default function DashboardPage() {
  const { user, loading: authLoading, getIdToken } = useAuth();
  const router = useRouter();

  const [realJournals, setRealJournals] = useState<JournalEntry[]>([]);
  const [memoryCount, setMemoryCount] = useState<number>(28);
  const [journalCount, setJournalCount] = useState<number>(12);
  const [placesCount, setPlacesCount] = useState<number>(5);
  const [dataLoaded, setDataLoaded] = useState<boolean>(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch real counts & recent entries in parallel
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      if (!user) return;
      try {
        const token = await getIdToken();
        if (!token || !isMounted) return;

        // Fetch recent journals and memories concurrently
        const [jResult, mResult] = await Promise.allSettled([
          fetch('/api/journal/list?limit=5', {
            headers: { Authorization: `Bearer ${token}` },
          }).then((r) => r.json()),
          fetch('/api/memories/list', {
            headers: { Authorization: `Bearer ${token}` },
          }).then((r) => r.json()),
        ]);

        if (!isMounted) return;

        if (jResult.status === 'fulfilled' && jResult.value?.success && Array.isArray(jResult.value.data?.journals)) {
          const list: JournalEntry[] = jResult.value.data.journals;
          setRealJournals(list);
          if (list.length > 0) {
            setJournalCount(list.length);
          }
        }

        if (mResult.status === 'fulfilled' && mResult.value?.success && Array.isArray(mResult.value.data?.memories)) {
          const mems = mResult.value.data.memories;
          if (mems.length > 0) {
            setMemoryCount(mems.length);
            const places = mems.filter((m: any) => m.category === 'PLACE');
            if (places.length > 0) {
              setPlacesCount(places.length);
            }
          }
        }
      } catch (err) {
        console.warn('Could not fetch real dashboard counts, using active presets:', err);
      } finally {
        if (isMounted) setDataLoaded(true);
      }
    }

    if (user) {
      loadData();
    }
    return () => {
      isMounted = false;
    };
  }, [user, getIdToken]);

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3 animate-fadeIn">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-sm" style={{ color: 'var(--mv-text-muted)' }}>
          Verifying secure session...
        </p>
      </div>
    );
  }

  if (!user) return null;

  // Format real journals or fallback to sample
  const displayedEntries =
    realJournals.length > 0
      ? realJournals.slice(0, 3).map((j) => {
          const d = new Date(j.createdAt);
          const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
          const day = d.getDate().toString();
          return {
            id: j.id,
            month,
            day,
            title: j.title || 'Journal Entry',
            excerpt: j.content?.slice(0, 85) + '...',
          };
        })
      : fallbackEntries;

  return (
    <div className="space-y-6 pb-6 animate-fadeIn">
      {/* 1. TOP HERO SECTION WITH MISTY LANDSCAPE & PORTAL (Matching Reference Image) */}
      <div className="relative rounded-3xl overflow-hidden border p-6 sm:p-8 transition-all" style={{
        background: 'linear-gradient(135deg, rgba(224, 231, 255, 0.4) 0%, rgba(243, 232, 255, 0.5) 40%, rgba(255, 255, 255, 0.8) 100%)',
        borderColor: 'var(--mv-border)',
        boxShadow: 'var(--mv-shadow)',
      }}>
        {/* Landscape Graphic Background Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20 mix-blend-multiply dark:mix-blend-screen overflow-hidden">
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 300" fill="none">
            {/* Soft mountains layer 1 */}
            <path d="M0,220 Q200,120 450,190 T900,140 Q950,170 1000,180 L1000,300 L0,300 Z" fill="url(#gradMtn1)" opacity="0.35" />
            {/* Soft mountains layer 2 */}
            <path d="M150,230 Q400,150 700,210 T1000,190 L1000,300 L150,300 Z" fill="url(#gradMtn2)" opacity="0.45" />
            {/* Sunrise sun glow */}
            <circle cx="700" cy="110" r="90" fill="url(#sunGlow)" opacity="0.4" />
            <defs>
              <linearGradient id="gradMtn1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#c084fc" />
              </linearGradient>
              <linearGradient id="gradMtn2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
              <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="60%" stopColor="#fed7aa" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </radialGradient>
            </defs>
          </svg>
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left: Welcome text + 4 Action Cards */}
          <div className="lg:col-span-8 space-y-6">
            <div className="space-y-1">
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight flex items-center space-x-2" style={{ color: 'var(--mv-text)' }}>
                <span>Welcome back</span>
                <span className="inline-block animate-bounce">👋</span>
              </h1>
              <p className="text-sm sm:text-base font-medium" style={{ color: 'var(--mv-text-muted)' }}>
                Same thoughts. A deeper you.
              </p>
            </div>

            {/* 4 Action Cards in a row matching reference */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {/* 1. New Journal (Highlighted Gradient Card) */}
              <Link
                href="/journal"
                className="p-3.5 sm:p-4 rounded-2xl transition-all duration-300 transform hover:-translate-y-1 text-white shadow-lg shadow-indigo-500/25 flex flex-col justify-between group"
                style={{
                  background: 'linear-gradient(135deg, #4f6ef7 0%, #7c3aed 100%)',
                }}
              >
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                  <PenLine className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="font-bold text-sm leading-tight">New Journal</div>
                  <div className="text-[11px] text-indigo-100 mt-0.5 opacity-90">Write your thoughts</div>
                </div>
              </Link>

              {/* 2. Ask My Journal */}
              <Link
                href="/ask"
                className="p-3.5 sm:p-4 rounded-2xl border transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between group shadow-sm hover:shadow"
                style={{
                  background: 'var(--mv-surface)',
                  borderColor: 'var(--mv-border)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 dark:text-blue-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-sm leading-tight" style={{ color: 'var(--mv-text)' }}>Ask My Journal</div>
                  <div className="text-[11px] mt-0.5" style={{ color: 'var(--mv-text-muted)' }}>Find answers</div>
                </div>
              </Link>

              {/* 3. View Insights */}
              <Link
                href="/insights"
                className="p-3.5 sm:p-4 rounded-2xl border transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between group shadow-sm hover:shadow"
                style={{
                  background: 'var(--mv-surface)',
                  borderColor: 'var(--mv-border)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 dark:text-purple-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-sm leading-tight" style={{ color: 'var(--mv-text)' }}>View Insights</div>
                  <div className="text-[11px] mt-0.5" style={{ color: 'var(--mv-text-muted)' }}>See your growth</div>
                </div>
              </Link>

              {/* 4. Open Memory Map */}
              <Link
                href="/map"
                className="p-3.5 sm:p-4 rounded-2xl border transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between group shadow-sm hover:shadow"
                style={{
                  background: 'var(--mv-surface)',
                  borderColor: 'var(--mv-border)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-sm leading-tight" style={{ color: 'var(--mv-text)' }}>Open Memory Map</div>
                  <div className="text-[11px] mt-0.5" style={{ color: 'var(--mv-text-muted)' }}>Explore places</div>
                </div>
              </Link>
            </div>
          </div>

          {/* Right: Ethereal Neon Portal Arch Graphic (Matching Reference) */}
          <div className="hidden lg:flex lg:col-span-4 flex-col items-center justify-center text-center pl-4">
            <div className="relative">
              {/* Stepping stones */}
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex space-x-2 opacity-70">
                <span className="w-6 h-2 rounded-full bg-indigo-300/60 blur-[0.5px]"></span>
                <span className="w-8 h-2.5 rounded-full bg-indigo-300/80 blur-[0.5px]"></span>
                <span className="w-10 h-3 rounded-full bg-indigo-300 blur-[0.5px]"></span>
              </div>

              {/* Neon Portal Arch */}
              <div
                className="w-36 h-48 rounded-t-full border-2 border-indigo-400/80 shadow-2xl flex flex-col items-center justify-center p-3 relative overflow-hidden backdrop-blur-md"
                style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(199,210,254,0.4) 60%, rgba(165,180,252,0.8) 100%)',
                  boxShadow: '0 0 35px rgba(129, 140, 248, 0.4), inset 0 0 20px rgba(255, 255, 255, 0.8)',
                }}
              >
                <div className="text-[10px] tracking-widest font-extrabold text-indigo-700 dark:text-indigo-300 uppercase mb-1">
                  REFLECT
                </div>
                <div className="text-[10px] tracking-widest font-extrabold text-purple-700 dark:text-purple-300 uppercase mb-1">
                  UNDERSTAND
                </div>
                <div className="text-[10px] tracking-widest font-extrabold text-indigo-700 dark:text-indigo-300 uppercase">
                  EVOLVE
                </div>
              </div>
            </div>

            <p className="text-[11px] italic mt-4 max-w-[200px]" style={{ color: 'var(--mv-text-muted)' }}>
              &ldquo;Not just a journal, but a memory of your journey.&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/* 2. PROGRESS, NOT PERFECTION AFFIRMATION CARD (Matching Reference) */}
      <div
        className="mv-card p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{
          background: 'var(--mv-surface)',
          borderColor: 'var(--mv-border)',
        }}
      >
        <div className="flex items-start space-x-3.5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0 mt-0.5">
            <Quote className="w-5 h-5 rotate-180" />
          </div>
          <div>
            <h3 className="font-bold text-base sm:text-lg" style={{ color: 'var(--mv-text)' }}>
              Progress, not perfection.
            </h3>
            <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--mv-text-muted)' }}>
              Every thought you save is a step towards a better you.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0 self-stretch sm:self-auto justify-center sm:justify-start">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
            <Sprout className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-left">
            <div className="text-xs font-semibold leading-tight">You&apos;re doing great!</div>
            <div className="text-[11px] opacity-80 leading-tight">Keep going.</div>
          </div>
        </div>
      </div>

      {/* 3. MAIN DASHBOARD CONTENT GRID (Matching Reference Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (60%): RECENT JOURNAL ENTRIES */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight" style={{ color: 'var(--mv-text)' }}>
              Recent Journal Entries
            </h2>
            <Link
              href="/journal"
              className="text-xs font-semibold flex items-center space-x-1 text-indigo-500 hover:text-indigo-600 transition-colors"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {displayedEntries.map((entry) => (
              <Link
                key={entry.id}
                href={entry.id.startsWith('sample') ? '/journal' : `/journal?id=${entry.id}`}
                className="mv-card mv-card-hover p-4 sm:p-5 flex items-center justify-between gap-4 group block transition-all"
                style={{
                  background: 'var(--mv-surface)',
                  borderColor: 'var(--mv-border)',
                }}
              >
                <div className="flex items-center space-x-4 min-w-0">
                  {/* Date Box */}
                  <div
                    className="w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 border transition-transform group-hover:scale-105"
                    style={{
                      background: 'rgba(99, 102, 241, 0.08)',
                      borderColor: 'var(--mv-border)',
                    }}
                  >
                    <span className="text-[10px] font-bold text-indigo-500 tracking-wider">
                      {entry.month}
                    </span>
                    <span className="text-sm font-extrabold" style={{ color: 'var(--mv-text)' }}>
                      {entry.day}
                    </span>
                  </div>

                  {/* Title & Excerpt */}
                  <div className="min-w-0">
                    <h3
                      className="text-sm sm:text-base font-bold truncate group-hover:text-indigo-500 transition-colors"
                      style={{ color: 'var(--mv-text)' }}
                    >
                      {entry.title}
                    </h3>
                    <p className="text-xs truncate mt-0.5" style={{ color: 'var(--mv-text-muted)' }}>
                      {entry.excerpt}
                    </p>
                  </div>
                </div>

                {/* Arrow Action */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-all group-hover:bg-indigo-500 group-hover:border-indigo-500 group-hover:text-white"
                  style={{
                    borderColor: 'var(--mv-border)',
                    color: 'var(--mv-text-muted)',
                  }}
                >
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN (40%): 3 STACKED WIDGETS (Your Journey, Mood, AI Companion) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Widget 1: Your Journey Stats */}
          <div
            className="mv-card p-5 space-y-4"
            style={{
              background: 'var(--mv-surface)',
              borderColor: 'var(--mv-border)',
            }}
          >
            <div className="flex items-center space-x-2 text-sm font-bold" style={{ color: 'var(--mv-text)' }}>
              <Activity className="w-4 h-4 text-indigo-500" />
              <span>Your Journey</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* Entries */}
              <div
                className="p-3 rounded-2xl text-center border transition-all hover:scale-102"
                style={{
                  background: 'rgba(99, 102, 241, 0.05)',
                  borderColor: 'var(--mv-border)',
                }}
              >
                <div className="w-7 h-7 rounded-xl bg-blue-500/10 text-blue-500 mx-auto flex items-center justify-center mb-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                </div>
                <div className="text-lg font-extrabold" style={{ color: 'var(--mv-text)' }}>
                  {journalCount}
                </div>
                <div className="text-[11px] font-medium" style={{ color: 'var(--mv-text-muted)' }}>
                  Entries
                </div>
              </div>

              {/* Memories */}
              <div
                className="p-3 rounded-2xl text-center border transition-all hover:scale-102"
                style={{
                  background: 'rgba(168, 85, 247, 0.05)',
                  borderColor: 'var(--mv-border)',
                }}
              >
                <div className="w-7 h-7 rounded-xl bg-purple-500/10 text-purple-500 mx-auto flex items-center justify-center mb-1.5">
                  <Layers className="w-3.5 h-3.5" />
                </div>
                <div className="text-lg font-extrabold" style={{ color: 'var(--mv-text)' }}>
                  {memoryCount}
                </div>
                <div className="text-[11px] font-medium" style={{ color: 'var(--mv-text-muted)' }}>
                  Memories
                </div>
              </div>

              {/* Places */}
              <div
                className="p-3 rounded-2xl text-center border transition-all hover:scale-102"
                style={{
                  background: 'rgba(16, 185, 129, 0.05)',
                  borderColor: 'var(--mv-border)',
                }}
              >
                <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center mb-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div className="text-lg font-extrabold" style={{ color: 'var(--mv-text)' }}>
                  {placesCount}
                </div>
                <div className="text-[11px] font-medium" style={{ color: 'var(--mv-text-muted)' }}>
                  Places
                </div>
              </div>
            </div>
          </div>

          {/* Widget 2: Mood / Reflection This Week Bar Chart */}
          <div
            className="mv-card p-5 space-y-4"
            style={{
              background: 'var(--mv-surface)',
              borderColor: 'var(--mv-border)',
            }}
          >
            <div className="flex items-center space-x-2 text-sm font-bold" style={{ color: 'var(--mv-text)' }}>
              <TrendingUp className="w-4 h-4 text-purple-500" />
              <span>Mood This Week</span>
            </div>

            <div className="flex items-end justify-between h-24 pt-4 px-2">
              {[
                { day: 'Mon', height: 'h-8', color: 'from-blue-400 to-indigo-400' },
                { day: 'Tue', height: 'h-12', color: 'from-cyan-400 to-blue-400' },
                { day: 'Wed', height: 'h-10', color: 'from-teal-400 to-emerald-400' },
                { day: 'Thu', height: 'h-16', color: 'from-indigo-400 to-purple-400' },
                { day: 'Fri', height: 'h-20', color: 'from-purple-400 to-indigo-500' },
                { day: 'Sat', height: 'h-12', color: 'from-emerald-400 to-teal-500' },
                { day: 'Sun', height: 'h-22', color: 'from-indigo-500 to-purple-600' },
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center space-y-2 group">
                  <div className="w-3.5 bg-slate-100 dark:bg-slate-800 rounded-full h-20 flex items-end justify-center p-0.5">
                    <div
                      className={`w-full ${item.height} rounded-full bg-gradient-to-t ${item.color} shadow-sm group-hover:scale-110 transition-transform`}
                    />
                  </div>
                  <span className="text-[10px] font-medium" style={{ color: 'var(--mv-text-muted)' }}>
                    {item.day}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Widget 3: AI Reflection Assistant (Robot Card matching Reference) */}
          <div
            className="mv-card p-5 relative overflow-hidden flex flex-col justify-between"
            style={{
              background: 'linear-gradient(135deg, rgba(238, 242, 255, 0.7) 0%, rgba(245, 243, 255, 0.8) 100%)',
              borderColor: 'var(--mv-border)',
            }}
          >
            <div className="flex items-start space-x-4">
              {/* Robot Avatar Icon with glowing aura */}
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-400 to-purple-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-500/25 relative group">
                <Bot className="w-9 h-9 text-white group-hover:scale-110 transition-transform" />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white"></span>
              </div>

              <div className="space-y-1">
                <h3 className="font-bold text-sm sm:text-base leading-tight" style={{ color: 'var(--mv-text)' }}>
                  Need a moment to reflect?
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--mv-text-muted)' }}>
                  I&apos;m here to listen, search your memories, and help you see the bigger picture.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t flex justify-end" style={{ borderColor: 'var(--mv-border)' }}>
              <Link
                href="/journal"
                className="mv-btn-primary !py-2 !px-4 !text-xs inline-flex items-center space-x-1.5 shadow-md"
              >
                <span>Chat with MindVault</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
