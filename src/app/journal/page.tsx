'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  BookOpen,
  Sparkles,
  Send,
  Save,
  Plus,
  Trash2,
  Calendar,
  Tag,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  History,
  ChevronRight,
  Brain,
} from 'lucide-react';
import { JournalEntry, JournalMessage, MemoryItem } from '@/types';

function JournalContent() {
  const { user, loading: authLoading, getIdToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const journalIdFromUrl = searchParams.get('id');

  // State
  const [currentJournalId, setCurrentJournalId] = useState<string | null>(journalIdFromUrl);
  const [title, setTitle] = useState<string>('');
  const [messages, setMessages] = useState<JournalMessage[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [historyList, setHistoryList] = useState<JournalEntry[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [topics, setTopics] = useState<string[]>([]);
  const [savedMemories, setSavedMemories] = useState<MemoryItem[]>([]);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchHistoryList = React.useCallback(async () => {
    try {
      setIsHistoryLoading(true);
      const token = await getIdToken();
      if (!token) return;

      const res = await fetch('/api/journal/list?limit=20', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setHistoryList(json.data.journals);
      }
    } catch (err) {
      console.error('Failed to fetch journal history:', err);
    } finally {
      setIsHistoryLoading(false);
    }
  }, [getIdToken]);

  const loadJournal = React.useCallback(async (id: string) => {
    try {
      setErrorMessage(null);
      const token = await getIdToken();
      if (!token) return;

      const res = await fetch(`/api/journal/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        const j: JournalEntry = json.data.journal;
        setCurrentJournalId(j.id);
        setTitle(j.title);
        setMessages(j.messages || []);
        setSummary(j.summary || null);
        setTopics(j.topics || []);
        setSavedMemories([]);
        setShowHistory(false);
      }
    } catch (err) {
      setErrorMessage('Could not load this journal entry.');
    }
  }, [getIdToken]);

  // Load history list on mount
  useEffect(() => {
    if (user) {
      fetchHistoryList();
    }
  }, [user, fetchHistoryList]);

  // Load specific journal if ID provided
  useEffect(() => {
    if (user && journalIdFromUrl) {
      loadJournal(journalIdFromUrl);
    }
  }, [user, journalIdFromUrl, loadJournal]);

  const startNewJournal = () => {
    setCurrentJournalId(null);
    setTitle('');
    setMessages([]);
    setInputValue('');
    setSummary(null);
    setTopics([]);
    setSavedMemories([]);
    setSaveSuccess(false);
    setErrorMessage(null);
    router.push('/journal');
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isSending) return;

    setErrorMessage(null);
    setSaveSuccess(false);

    const userText = inputValue.trim();
    setInputValue('');

    const userMessage: JournalMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsSending(true);

    try {
      const token = await getIdToken();
      if (!token) throw new Error('Not authenticated');

      const res = await fetch('/api/journal/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: newMessages,
          journalId: currentJournalId || undefined,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error?.message || 'Failed to get reflection');
      }

      const companionMessage: JournalMessage = json.data.message;
      setMessages([...newMessages, companionMessage]);
    } catch (err: any) {
      setErrorMessage(err.message || 'Reflection engine unavailable. Your input is safely kept.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveJournal = async () => {
    if (messages.length === 0 || isSaving) return;

    try {
      setIsSaving(true);
      setErrorMessage(null);
      setSaveSuccess(false);

      const token = await getIdToken();
      if (!token) throw new Error('Not authenticated');

      const res = await fetch('/api/journal/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: currentJournalId || undefined,
          title: title.trim() || undefined,
          messages,
          topics,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error?.message || 'Failed to save journal');
      }

      const saved: JournalEntry = json.data.journal;
      setCurrentJournalId(saved.id);
      setTitle(saved.title);
      setSummary(saved.summary || null);
      setTopics(saved.topics || []);
      setSavedMemories(json.data.extractedMemories || []);
      setSaveSuccess(true);

      // Refresh list in background
      fetchHistoryList();
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not save journal entry.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteJournal = async (id: string) => {
    if (!confirm('Are you sure you want to delete this journal entry?')) return;
    try {
      const token = await getIdToken();
      if (!token) return;

      const res = await fetch(`/api/journal/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        if (currentJournalId === id) {
          startNewJournal();
        }
        fetchHistoryList();
      }
    } catch (err) {
      setErrorMessage('Failed to delete journal entry.');
    }
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-sm" style={{ color: 'var(--mv-text-muted)' }}>Loading journal...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Top Action Header */}
      <div className="mv-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold" style={{ color: 'var(--mv-text)' }}>
              {title || 'Private Reflection'}
            </h1>
            <p className="text-xs flex items-center space-x-2 mt-0.5" style={{ color: 'var(--mv-text-muted)' }}>
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
              <span>•</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-medium">UID-Isolated Storage</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="mv-btn-secondary flex items-center space-x-1.5 text-xs py-2 px-3.5"
          >
            <History className="w-3.5 h-3.5 text-indigo-500" />
            <span>Past Entries ({historyList.length})</span>
          </button>

          <button
            onClick={startNewJournal}
            className="mv-btn-secondary flex items-center space-x-1.5 text-xs py-2 px-3.5"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-500" />
            <span>New</span>
          </button>

          <button
            onClick={handleSaveJournal}
            disabled={messages.length === 0 || isSaving}
            className="mv-btn-primary flex items-center space-x-1.5 text-xs py-2 px-4"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSaving ? 'Saving...' : 'Save Entry'}</span>
          </button>
        </div>
      </div>

      {/* History Drawer if toggled */}
      {showHistory && (
        <div className="mv-card p-5 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold" style={{ color: 'var(--mv-text)' }}>Your Past Journal Sessions</h3>
            <button
              onClick={() => setShowHistory(false)}
              className="text-xs transition-colors hover:opacity-80"
              style={{ color: 'var(--mv-text-muted)' }}
            >
              Close
            </button>
          </div>
          {isHistoryLoading ? (
            <div className="py-4 text-center text-xs" style={{ color: 'var(--mv-text-muted)' }}>Loading entries...</div>
          ) : historyList.length === 0 ? (
            <div className="py-4 text-center text-xs" style={{ color: 'var(--mv-text-muted)' }}>No previous journal sessions found.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
              {historyList.map((j) => (
                <div
                  key={j.id}
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all duration-200 ${
                    currentJournalId === j.id
                      ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'border hover:border-indigo-400/50 hover:bg-indigo-500/5'
                  }`}
                  style={currentJournalId !== j.id ? {
                    backgroundColor: 'var(--mv-surface)',
                    borderColor: 'var(--mv-border)',
                  } : undefined}
                >
                  <div onClick={() => loadJournal(j.id)} className="flex-1 min-w-0 pr-2">
                    <p className="font-semibold truncate" style={{ color: 'var(--mv-text)' }}>{j.title || 'Untitled Session'}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--mv-text-muted)' }}>
                      {new Date(j.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteJournal(j.id);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                    title="Delete journal"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notifications / Alerts */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-300 flex items-center space-x-2 backdrop-blur-sm animate-fadeIn">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs space-y-2 animate-fadeIn backdrop-blur-sm" style={{ color: 'var(--mv-text)' }}>
          <div className="flex items-center space-x-2 font-semibold text-sm text-indigo-600 dark:text-indigo-400">
            <CheckCircle2 className="w-4 h-4 text-indigo-500" />
            <span>Journal entry saved successfully</span>
          </div>

          {summary && (
            <div
              className="mt-2 p-3 rounded-xl border"
              style={{
                backgroundColor: 'var(--mv-surface)',
                borderColor: 'var(--mv-border)',
              }}
            >
              <span className="font-semibold block mb-1" style={{ color: 'var(--mv-text)' }}>AI Summary:</span>
              <p className="italic" style={{ color: 'var(--mv-text-muted)' }}>{summary}</p>
            </div>
          )}

          {savedMemories.length > 0 && (
            <div className="mt-2 space-y-1.5">
              <span className="font-semibold block" style={{ color: 'var(--mv-text)' }}>
                {savedMemories.length} Structured {savedMemories.length === 1 ? 'Memory' : 'Memories'} Extracted:
              </span>
              <div className="flex flex-wrap gap-2">
                {savedMemories.map((m) => (
                  <span
                    key={m.id}
                    className="mv-badge border"
                    style={{ borderColor: 'var(--mv-border)' }}
                  >
                    <Sparkles className="w-3 h-3 text-violet-500 mr-1" />
                    <span>[{m.category}] {m.title}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Journal / Conversation Canvas */}
      <div className="mv-card min-h-[500px] flex flex-col justify-between overflow-hidden shadow-sm">
        
        {/* Messages Stream */}
        <div className="p-6 sm:p-8 space-y-6 flex-1 overflow-y-auto max-h-[600px]">
          {messages.length === 0 ? (
            <div className="text-center py-16 space-y-4 max-w-md mx-auto animate-fadeIn">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto shadow-glow-indigo">
                <Brain className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--mv-text)' }}>What is on your mind today?</h2>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--mv-text-muted)' }}>
                Write down your thoughts, breakthroughs, decisions, or struggles. MindVault reflects with you and preserves what matters.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                {['Working on my prototype today...', 'Thinking about a major career decision...', 'Struggling with focus lately...'].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => {
                      setInputValue(prompt);
                    }}
                    className="text-xs px-3.5 py-1.5 rounded-full border transition-all duration-200 hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-300 hover:bg-violet-500/10"
                    style={{
                      backgroundColor: 'var(--mv-surface)',
                      borderColor: 'var(--mv-border)',
                      color: 'var(--mv-text-muted)',
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex items-start space-x-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center text-violet-500 dark:text-violet-400 shrink-0 mt-1 shadow-sm">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  )}
                  <div
                    className={`max-w-2xl px-5 py-3.5 rounded-2xl text-sm leading-relaxed transition-all duration-200 ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-br-sm shadow-md shadow-indigo-500/20'
                        : 'rounded-bl-sm backdrop-blur-md border border-violet-500/20 shadow-sm'
                    }`}
                    style={!isUser ? {
                      backgroundColor: 'var(--mv-surface)',
                      color: 'var(--mv-text)',
                    } : undefined}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>
                    <span
                      className={`text-[10px] block mt-1.5 ${
                        isUser ? 'text-indigo-200 text-right' : ''
                      }`}
                      style={!isUser ? { color: 'var(--mv-text-muted)' } : undefined}
                    >
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}

          {isSending && (
            <div className="flex items-start space-x-3 justify-start animate-fadeIn">
              <div className="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center text-violet-500 dark:text-violet-400 shrink-0 mt-1">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
              <div
                className="px-4 py-3 rounded-2xl rounded-bl-sm text-xs border border-violet-500/20 flex items-center space-x-2 backdrop-blur-md"
                style={{
                  backgroundColor: 'var(--mv-surface)',
                  color: 'var(--mv-text-muted)',
                }}
              >
                <span>MindVault is reflecting on your thoughts...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div
          className="p-4 sm:p-5 border-t rounded-b-2xl backdrop-blur-md"
          style={{
            borderColor: 'var(--mv-border)',
            backgroundColor: 'var(--mv-surface)',
          }}
        >
          <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
            <textarea
              rows={1}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Write your thoughts or ask for a reflection (Enter to send, Shift+Enter for new line)..."
              className="mv-input flex-1 resize-none max-h-32 focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isSending}
              className="mv-btn-primary p-3 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-50"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}

export default function JournalPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          <p className="text-sm" style={{ color: 'var(--mv-text-muted)' }}>Loading journal...</p>
        </div>
      }
    >
      <JournalContent />
    </Suspense>
  );
}
