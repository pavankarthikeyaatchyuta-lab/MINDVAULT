'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  Search,
  Sparkles,
  ExternalLink,
  BookOpen,
  HelpCircle,
  Loader2,
  AlertCircle,
  Calendar,
  CheckCircle2,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { AskSourceReference } from '@/types';

const SUGGESTED_QUESTIONS = [
  'What goals have I set recently?',
  'What decisions have I made about my work?',
  'What worries or concerns keep coming back?',
  'What breakthroughs or achievements have I had?',
  'How have my priorities changed over time?',
];

export default function AskPage() {
  const { user, loading: authLoading, getIdToken } = useAuth();
  const router = useRouter();

  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<'high' | 'medium' | 'low' | null>(null);
  const [sources, setSources] = useState<AskSourceReference[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const handleAsk = async (queryText?: string) => {
    const q = (queryText || question).trim();
    if (!q || isAsking) return;

    try {
      setIsAsking(true);
      setErrorMessage(null);
      setAnswer(null);
      setSources([]);
      setConfidence(null);
      if (queryText) setQuestion(queryText);

      const token = await getIdToken();
      if (!token) throw new Error('Authentication required');

      const res = await fetch('/api/journal/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question: q }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error?.message || 'Failed to synthesize answer from your journal');
      }

      setAnswer(json.data.answer);
      setConfidence(json.data.confidence);
      setSources(json.data.sources || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not query your journal right now.');
    } finally {
      setIsAsking(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        <p className="text-sm text-slate-500">Connecting to your journal vault...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Natural Language Journal Memory</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Ask My Journal
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
          Query your personal memories, thoughts, and decisions. Answers are synthesized exclusively from verified entries in your vault.
        </p>
      </div>

      {/* Question Input Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }}
          className="space-y-3"
        >
          <div className="relative flex items-center">
            <Search className="w-5 h-5 absolute left-4 text-slate-400" />
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What have I been thinking about lately? What decisions did I make?"
              className="w-full pl-12 pr-28 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
            />
            <button
              type="submit"
              disabled={!question.trim() || isAsking}
              className="absolute right-2 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium shadow-sm transition-all disabled:opacity-50 flex items-center space-x-1.5"
            >
              {isAsking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>{isAsking ? 'Searching...' : 'Ask Vault'}</span>
            </button>
          </div>
        </form>

        {/* Suggested Queries */}
        <div className="pt-2">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
            Suggested Reflections
          </span>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleAsk(q)}
                disabled={isAsking}
                className="text-xs px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-teal-950/60 hover:text-teal-600 dark:hover:text-teal-400 border border-slate-200 dark:border-slate-700 transition-colors text-left"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Security & Grounding Callout */}
        <div className="flex items-center space-x-2 text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
          <Shield className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          <span>Answers are strictly grounded in your private journal entries. Gemini never hallucinates unverified history.</span>
        </div>
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Loading state */}
      {isAsking && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto" />
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
            Searching your journal vault and synthesizing memories...
          </p>
          <p className="text-xs text-slate-400">
            Retrieving evidence from your UID-isolated Firestore collection
          </p>
        </div>
      )}

      {/* Answer Result Section */}
      {answer && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 animate-fadeIn">
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Synthesized Memory</h2>
            </div>
            {confidence && (
              <span
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                  confidence === 'high'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                    : confidence === 'medium'
                    ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                    : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                }`}
              >
                {confidence.toUpperCase()} CONFIDENCE
              </span>
            )}
          </div>

          <div className="prose dark:prose-invert max-w-none text-sm sm:text-base leading-relaxed text-slate-800 dark:text-slate-200">
            <p className="whitespace-pre-wrap">{answer}</p>
          </div>

          {/* Sources Section */}
          {sources.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Verified Source References ({sources.length})</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sources.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                          {s.sourceType}
                        </span>
                        <span>{new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs mt-1">
                        {s.title}
                      </h4>
                      {s.excerpt && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 italic line-clamp-2">
                          &ldquo;{s.excerpt}&rdquo;
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-end">
                      <Link
                        href={`/journal?id=${s.sourceId}`}
                        className="inline-flex items-center space-x-1 text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium"
                      >
                        <span>View source entry</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Empty State when no question asked yet */}
      {!answer && !isAsking && (
        <div className="text-center py-8 text-slate-400 text-xs">
          <HelpCircle className="w-6 h-6 mx-auto mb-2 opacity-50" />
          <p>MindVault will search across your entries and memories to answer questions about your history.</p>
        </div>
      )}

    </div>
  );
}
