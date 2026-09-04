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
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3 animate-fadeIn">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--mv-primary)' }} />
        <p className="text-sm" style={{ color: 'var(--mv-text-muted)' }}>
          Connecting to your journal vault...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4 animate-fadeIn">
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="mv-badge inline-flex items-center space-x-2 px-3 py-1 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--mv-accent)' }} />
          <span>Natural Language Journal Memory</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: 'var(--mv-text)' }}>
          Ask My <span className="mv-gradient-text">Journal</span>
        </h1>
        <p className="text-sm sm:text-base" style={{ color: 'var(--mv-text-muted)' }}>
          Query your personal memories, thoughts, and decisions. Answers are synthesized exclusively from verified entries in your vault.
        </p>
      </div>

      {/* Question Input Card */}
      <div className="mv-card p-6 sm:p-8 space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }}
          className="space-y-3"
        >
          <div className="relative flex items-center">
            <Search
              className="w-5 h-5 absolute left-4 z-10 pointer-events-none"
              style={{ color: 'var(--mv-text-muted)' }}
            />
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What have I been thinking about lately? What decisions did I make?"
              className="mv-input pl-12 pr-32 py-3.5 text-sm"
            />
            <button
              type="submit"
              disabled={!question.trim() || isAsking}
              className="absolute right-2 mv-btn-primary !py-2 !px-4 text-xs font-semibold flex items-center space-x-1.5"
            >
              {isAsking ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Search className="w-3.5 h-3.5" />
              )}
              <span>{isAsking ? 'Searching...' : 'Ask Vault'}</span>
            </button>
          </div>
        </form>

        {/* Suggested Queries */}
        <div className="pt-2">
          <span
            className="text-[11px] font-semibold uppercase tracking-wider block mb-2"
            style={{ color: 'var(--mv-text-muted)' }}
          >
            Suggested Reflections
          </span>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleAsk(q)}
                disabled={isAsking}
                className="text-xs px-3 py-1.5 rounded-xl border transition-all duration-200 text-left disabled:opacity-50 hover:!border-indigo-400 dark:hover:!border-indigo-400 hover:!text-indigo-600 dark:hover:!text-indigo-300 hover:!bg-indigo-500/10 shadow-sm"
                style={{
                  background: 'rgba(99, 102, 241, 0.05)',
                  borderColor: 'var(--mv-border)',
                  color: 'var(--mv-text)',
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Security & Grounding Callout */}
        <div
          className="flex items-center space-x-2 text-[11px] border-t pt-3"
          style={{ borderColor: 'var(--mv-border)', color: 'var(--mv-text-muted)' }}
        >
          <Shield className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--mv-primary)' }} />
          <span>Answers are strictly grounded in your private journal entries. Gemini never hallucinates unverified history.</span>
        </div>
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-300 flex items-center space-x-2 backdrop-blur-sm animate-fadeIn">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Loading state */}
      {isAsking && (
        <div className="mv-card p-8 text-center space-y-3 animate-fadeIn">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto bg-indigo-500/10 border border-indigo-500/20">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--mv-primary)' }} />
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--mv-text)' }}>
            Searching your journal vault and synthesizing memories...
          </p>
          <p className="text-xs" style={{ color: 'var(--mv-text-muted)' }}>
            Retrieving evidence from your UID-isolated Firestore collection
          </p>
        </div>
      )}

      {/* Answer Result Section */}
      {answer && (
        <div className="mv-card p-6 sm:p-8 space-y-6 animate-fadeIn">
          <div
            className="flex items-center justify-between pb-4 border-b"
            style={{ borderColor: 'var(--mv-border)' }}
          >
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-violet-500/10 border border-violet-500/20">
                <Sparkles className="w-4 h-4" style={{ color: 'var(--mv-accent)' }} />
              </div>
              <h2 className="text-base font-bold" style={{ color: 'var(--mv-text)' }}>
                Synthesized Memory
              </h2>
            </div>
            {confidence && (
              <span
                className={`text-[11px] font-semibold px-3 py-1 rounded-full border shadow-sm ${
                  confidence === 'high'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
                    : confidence === 'medium'
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25'
                    : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/25'
                }`}
              >
                {confidence.toUpperCase()} CONFIDENCE
              </span>
            )}
          </div>

          <div
            className="prose dark:prose-invert max-w-none text-sm sm:text-base leading-relaxed"
            style={{ color: 'var(--mv-text)' }}
          >
            <p className="whitespace-pre-wrap">{answer}</p>
          </div>

          {/* Sources Section */}
          {sources.length > 0 && (
            <div
              className="space-y-3 pt-4 border-t"
              style={{ borderColor: 'var(--mv-border)' }}
            >
              <div
                className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--mv-text-muted)' }}
              >
                <BookOpen className="w-3.5 h-3.5" style={{ color: 'var(--mv-primary)' }} />
                <span>Verified Source References ({sources.length})</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sources.map((s, idx) => (
                  <div
                    key={idx}
                    className="mv-card mv-card-hover p-4 space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div
                        className="flex items-center justify-between text-[11px]"
                        style={{ color: 'var(--mv-text-muted)' }}
                      >
                        <span
                          className="font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md text-[10px]"
                          style={{
                            background: 'rgba(99, 102, 241, 0.1)',
                            color: 'var(--mv-primary)',
                          }}
                        >
                          {s.sourceType}
                        </span>
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3 opacity-60 inline" />
                          <span>
                            {new Date(s.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </span>
                      </div>
                      <h4
                        className="font-bold text-xs mt-2"
                        style={{ color: 'var(--mv-text)' }}
                      >
                        {s.title}
                      </h4>
                      {s.excerpt && (
                        <p
                          className="text-[11px] mt-1.5 italic line-clamp-2"
                          style={{ color: 'var(--mv-text-muted)' }}
                        >
                          &ldquo;{s.excerpt}&rdquo;
                        </p>
                      )}
                    </div>

                    <div
                      className="pt-2 mt-2 border-t flex items-center justify-end"
                      style={{ borderColor: 'var(--mv-border)' }}
                    >
                      <Link
                        href={`/journal?id=${s.sourceId}`}
                        className="inline-flex items-center space-x-1 text-xs font-medium transition-colors hover:underline"
                        style={{ color: 'var(--mv-primary)' }}
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
        <div className="mv-card text-center py-10 px-6 max-w-md mx-auto space-y-3 animate-fadeIn">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto bg-indigo-500/10 border border-indigo-500/20">
            <HelpCircle className="w-5 h-5" style={{ color: 'var(--mv-accent)' }} />
          </div>
          <p
            className="text-xs leading-relaxed max-w-xs mx-auto"
            style={{ color: 'var(--mv-text-muted)' }}
          >
            MindVault will search across your entries and memories to answer questions about your history.
          </p>
        </div>
      )}
    </div>
  );
}
