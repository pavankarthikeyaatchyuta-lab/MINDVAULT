'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  Sparkles,
  Award,
  Scale,
  Lightbulb,
  Target,
  Calendar,
  Users,
  MapPin,
  AlertTriangle,
  Star,
  Trash2,
  Edit2,
  ExternalLink,
  Plus,
  Filter,
  Loader2,
  CheckCircle2,
  X,
} from 'lucide-react';
import { MemoryItem, MemoryCategory } from '@/types';

const CATEGORY_CONFIG: Record<
  MemoryCategory,
  {
    label: string;
    icon: React.ElementType;
    color: string;
    bg: string;
    border: string;
    borderAccent: string;
  }
> = {
  ACHIEVEMENT: {
    label: 'Achievement',
    icon: Award,
    color: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    border: 'border-emerald-400/25 dark:border-emerald-500/25',
    borderAccent: 'border-l-emerald-400 dark:border-l-emerald-500',
  },
  DECISION: {
    label: 'Decision',
    icon: Scale,
    color: 'text-indigo-700 dark:text-indigo-300',
    bg: 'bg-indigo-500/10 dark:bg-indigo-500/15',
    border: 'border-indigo-400/25 dark:border-indigo-500/25',
    borderAccent: 'border-l-indigo-400 dark:border-l-indigo-500',
  },
  IDEA: {
    label: 'Idea',
    icon: Lightbulb,
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-500/10 dark:bg-amber-500/15',
    border: 'border-amber-400/25 dark:border-amber-500/25',
    borderAccent: 'border-l-amber-400 dark:border-l-amber-500',
  },
  GOAL: {
    label: 'Goal',
    icon: Target,
    color: 'text-blue-700 dark:text-blue-300',
    bg: 'bg-blue-500/10 dark:bg-blue-500/15',
    border: 'border-blue-400/25 dark:border-blue-500/25',
    borderAccent: 'border-l-blue-400 dark:border-l-blue-500',
  },
  EVENT: {
    label: 'Event',
    icon: Calendar,
    color: 'text-purple-700 dark:text-purple-300',
    bg: 'bg-purple-500/10 dark:bg-purple-500/15',
    border: 'border-purple-400/25 dark:border-purple-500/25',
    borderAccent: 'border-l-purple-400 dark:border-l-purple-500',
  },
  PERSON: {
    label: 'Person',
    icon: Users,
    color: 'text-pink-700 dark:text-pink-300',
    bg: 'bg-pink-500/10 dark:bg-pink-500/15',
    border: 'border-pink-400/25 dark:border-pink-500/25',
    borderAccent: 'border-l-pink-400 dark:border-l-pink-500',
  },
  PLACE: {
    label: 'Place',
    icon: MapPin,
    color: 'text-violet-700 dark:text-violet-300',
    bg: 'bg-violet-500/10 dark:bg-violet-500/15',
    border: 'border-violet-400/25 dark:border-violet-500/25',
    borderAccent: 'border-l-violet-400 dark:border-l-violet-500',
  },
  CONCERN: {
    label: 'Concern',
    icon: AlertTriangle,
    color: 'text-rose-700 dark:text-rose-300',
    bg: 'bg-rose-500/10 dark:bg-rose-500/15',
    border: 'border-rose-400/25 dark:border-rose-500/25',
    borderAccent: 'border-l-rose-400 dark:border-l-rose-500',
  },
  PREFERENCE: {
    label: 'Preference',
    icon: Star,
    color: 'text-orange-700 dark:text-orange-300',
    bg: 'bg-orange-500/10 dark:bg-orange-500/15',
    border: 'border-orange-400/25 dark:border-orange-500/25',
    borderAccent: 'border-l-orange-400 dark:border-l-orange-500',
  },
};

export default function MemoriesPage() {
  const { user, loading: authLoading, getIdToken } = useAuth();
  const router = useRouter();

  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<MemoryCategory | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [editingMemory, setEditingMemory] = useState<MemoryItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Form fields for creating/editing
  const [formCategory, setFormCategory] = useState<MemoryCategory>('IDEA');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formTags, setFormTags] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchMemories = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const token = await getIdToken();
      if (!token) return;

      const url =
        selectedCategory === 'ALL'
          ? '/api/memories/list'
          : `/api/memories/list?category=${selectedCategory}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setMemories(json.data.memories);
      }
    } catch (err) {
      console.error('Failed to fetch memories:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getIdToken, selectedCategory]);

  useEffect(() => {
    if (user) {
      fetchMemories();
    }
  }, [user, fetchMemories]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this memory?')) return;
    try {
      const token = await getIdToken();
      if (!token) return;

      const res = await fetch(`/api/memories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setMemories(memories.filter((m) => m.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete memory:', err);
    }
  };

  const openEditModal = (memory: MemoryItem) => {
    setEditingMemory(memory);
    setFormCategory(memory.category);
    setFormTitle(memory.title);
    setFormDescription(memory.description);
    setFormTags((memory.tags || []).join(', '));
    setIsModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDescription.trim()) return;

    try {
      setIsSaving(true);
      const token = await getIdToken();
      if (!token) return;

      const tagsArray = formTags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      if (editingMemory) {
        // Update existing
        const res = await fetch(`/api/memories/${editingMemory.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            category: formCategory,
            title: formTitle.trim(),
            description: formDescription.trim(),
            tags: tagsArray,
          }),
        });
        const json = await res.json();
        if (json.success) {
          setMemories(
            memories.map((m) => (m.id === editingMemory.id ? json.data.memory : m))
          );
          setIsModalOpen(false);
          setEditingMemory(null);
        }
      }
    } catch (err) {
      console.error('Failed to save memory:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const categories: (MemoryCategory | 'ALL')[] = [
    'ALL',
    'ACHIEVEMENT',
    'DECISION',
    'IDEA',
    'GOAL',
    'EVENT',
    'PERSON',
    'PLACE',
    'CONCERN',
    'PREFERENCE',
  ];

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-sm text-[var(--mv-text-muted)]">Loading your memories...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-4 animate-fadeIn">
      {/* Header */}
      <div className="mv-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/15 to-violet-500/15 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--mv-text)]">
              Extracted Memories
            </h1>
          </div>
          <p className="text-sm text-[var(--mv-text-muted)] pl-[52px]">
            Structured insights, achievements, goals, and decisions preserved from your journal sessions.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto pl-[52px] sm:pl-0">
          <span className="mv-badge border border-indigo-500/20 px-3 py-1.5 text-xs font-semibold">
            {memories.length} {memories.length === 1 ? 'Memory' : 'Memories'} Total
          </span>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          const config = cat !== 'ALL' ? CATEGORY_CONFIG[cat] : null;
          const Icon = config ? config.icon : Filter;

          let pillClasses =
            'flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 ';
          if (isSelected) {
            if (cat === 'ALL') {
              pillClasses +=
                'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/25 border border-transparent';
            } else if (config) {
              pillClasses += `${config.bg} ${config.color} border ${config.border} shadow-sm font-semibold ring-1 ring-indigo-500/20`;
            }
          } else {
            pillClasses +=
              'bg-[var(--mv-surface)] border border-[var(--mv-border)] text-[var(--mv-text-muted)] hover:text-[var(--mv-text)] hover:border-indigo-400/40 backdrop-blur-md shadow-sm';
          }

          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={pillClasses}
            >
              <Icon
                className={`w-3.5 h-3.5 ${
                  isSelected
                    ? cat === 'ALL'
                      ? 'text-white'
                      : config?.color
                    : config
                    ? config.color
                    : 'text-indigo-400'
                }`}
              />
              <span>{cat === 'ALL' ? 'All Memories' : config?.label}</span>
            </button>
          );
        })}
      </div>

      {/* Memories Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="mv-card p-5 animate-pulse space-y-3">
              <div className="w-24 h-6 bg-indigo-500/10 rounded-lg" />
              <div className="w-48 h-5 bg-indigo-500/10 rounded-lg" />
              <div className="w-full h-12 bg-indigo-500/5 rounded-lg" />
            </div>
          ))}
        </div>
      ) : memories.length === 0 ? (
        <div className="mv-card p-12 text-center space-y-4 max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/15 to-violet-500/15 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto shadow-sm">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-[var(--mv-text)]">No Memories Extracted Yet</h3>
          <p className="text-sm text-[var(--mv-text-muted)] leading-relaxed">
            Write a journal entry in the Journal section and save it. MindVault will automatically identify achievements, decisions, ideas, and goals.
          </p>
          <Link
            href="/journal"
            className="mv-btn-primary inline-flex items-center space-x-2 !text-xs font-medium"
          >
            <span>Start Journaling</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {memories.map((m) => {
            const config = CATEGORY_CONFIG[m.category] || CATEGORY_CONFIG.IDEA;
            const Icon = config.icon;

            return (
              <div
                key={m.id}
                className={`mv-card mv-card-hover p-5 border-l-4 ${config.borderAccent} flex flex-col justify-between space-y-4 group`}
              >
                <div className="space-y-3">
                  {/* Category Badge & Actions */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${config.bg} ${config.color} ${config.border}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{config.label}</span>
                    </span>

                    <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal(m)}
                        className="p-1.5 text-[var(--mv-text-muted)] hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                        title="Edit memory"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="p-1.5 text-[var(--mv-text-muted)] hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Delete memory"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="font-bold text-[var(--mv-text)] text-base leading-snug">
                      {m.title}
                    </h3>
                    <p className="text-xs text-[var(--mv-text-muted)] mt-1.5 leading-relaxed">
                      {m.description}
                    </p>
                  </div>

                  {/* Tags */}
                  {m.tags && m.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {m.tags.map((t, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/15 font-medium"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer: Date & Source Link */}
                <div className="pt-3 border-t border-[var(--mv-border)] flex items-center justify-between text-[11px] text-[var(--mv-text-muted)]">
                  <span>
                    {new Date(m.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  {m.sourceJournalId && (
                    <Link
                      href={`/journal?id=${m.sourceJournalId}`}
                      className="inline-flex items-center space-x-1 text-indigo-600 dark:text-indigo-400 hover:text-violet-600 dark:hover:text-violet-400 hover:underline font-medium transition-colors"
                    >
                      <span>View Source</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="mv-card p-6 max-w-lg w-full shadow-2xl space-y-5 animate-slideIn">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--mv-border)]">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Edit2 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[var(--mv-text)]">
                  Edit Memory
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-[var(--mv-text-muted)] hover:text-[var(--mv-text)] hover:bg-indigo-500/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--mv-text)] mb-1.5">
                  Category
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as MemoryCategory)}
                  className="mv-input !py-2 text-xs"
                >
                  {Object.keys(CATEGORY_CONFIG).map((c) => (
                    <option key={c} value={c} className="bg-[var(--mv-surface-solid)] text-[var(--mv-text)]">
                      {CATEGORY_CONFIG[c as MemoryCategory].label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--mv-text)] mb-1.5">
                  Memory Title
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="mv-input !py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--mv-text)] mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="mv-input !py-2 text-xs resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--mv-text)] mb-1.5">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  className="mv-input !py-2 text-xs"
                  placeholder="prototype, coding, milestone"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[var(--mv-border)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="mv-btn-secondary !text-xs !py-2 !px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="mv-btn-primary !text-xs !py-2 !px-4 flex items-center space-x-1.5"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
