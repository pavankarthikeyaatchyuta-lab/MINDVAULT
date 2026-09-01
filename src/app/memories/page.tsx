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
  { label: string; icon: React.ElementType; color: string; bg: string; border: string }
> = {
  ACHIEVEMENT: {
    label: 'Achievement',
    icon: Award,
    color: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-50 dark:bg-emerald-950/60',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  DECISION: {
    label: 'Decision',
    icon: Scale,
    color: 'text-indigo-700 dark:text-indigo-300',
    bg: 'bg-indigo-50 dark:bg-indigo-950/60',
    border: 'border-indigo-200 dark:border-indigo-800',
  },
  IDEA: {
    label: 'Idea',
    icon: Lightbulb,
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-50 dark:bg-amber-950/60',
    border: 'border-amber-200 dark:border-amber-800',
  },
  GOAL: {
    label: 'Goal',
    icon: Target,
    color: 'text-blue-700 dark:text-blue-300',
    bg: 'bg-blue-50 dark:bg-blue-950/60',
    border: 'border-blue-200 dark:border-blue-800',
  },
  EVENT: {
    label: 'Event',
    icon: Calendar,
    color: 'text-purple-700 dark:text-purple-300',
    bg: 'bg-purple-50 dark:bg-purple-950/60',
    border: 'border-purple-200 dark:border-purple-800',
  },
  PERSON: {
    label: 'Person',
    icon: Users,
    color: 'text-pink-700 dark:text-pink-300',
    bg: 'bg-pink-50 dark:bg-pink-950/60',
    border: 'border-pink-200 dark:border-pink-800',
  },
  PLACE: {
    label: 'Place',
    icon: MapPin,
    color: 'text-teal-700 dark:text-teal-300',
    bg: 'bg-teal-50 dark:bg-teal-950/60',
    border: 'border-teal-200 dark:border-teal-800',
  },
  CONCERN: {
    label: 'Concern',
    icon: AlertTriangle,
    color: 'text-rose-700 dark:text-rose-300',
    bg: 'bg-rose-50 dark:bg-rose-950/60',
    border: 'border-rose-200 dark:border-rose-800',
  },
  PREFERENCE: {
    label: 'Preference',
    icon: Star,
    color: 'text-orange-700 dark:text-orange-300',
    bg: 'bg-orange-50 dark:bg-orange-950/60',
    border: 'border-orange-200 dark:border-orange-800',
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
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        <p className="text-sm text-slate-500">Loading your memories...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-2">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-950 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Extracted Memories</h1>
          </div>
          <p className="text-sm text-slate-500">
            Structured insights, achievements, goals, and decisions preserved from your journal sessions.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
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

          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 ${
                isSelected
                  ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/20'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-teal-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat === 'ALL' ? 'All Memories' : config?.label}</span>
            </button>
          );
        })}
      </div>

      {/* Memories Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse space-y-3">
              <div className="w-24 h-6 bg-slate-200 dark:bg-slate-800 rounded-lg" />
              <div className="w-48 h-5 bg-slate-200 dark:bg-slate-800 rounded-lg" />
              <div className="w-full h-12 bg-slate-100 dark:bg-slate-850 rounded-lg" />
            </div>
          ))}
        </div>
      ) : memories.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-4 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950 flex items-center justify-center text-teal-600 dark:text-teal-400 mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Memories Extracted Yet</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Write a journal entry in the Journal section and save it. MindVault will automatically identify achievements, decisions, ideas, and goals.
          </p>
          <Link
            href="/journal"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium transition-colors"
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
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-300 dark:hover:border-teal-700 shadow-sm transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-2.5">
                  
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
                        className="p-1.5 text-slate-400 hover:text-teal-600 rounded-lg transition-colors"
                        title="Edit memory"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                        title="Delete memory"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug">
                      {m.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                      {m.description}
                    </p>
                  </div>

                  {/* Tags */}
                  {m.tags && m.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {m.tags.map((t, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}

                </div>

                {/* Footer: Date & Source Link */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    {new Date(m.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  {m.sourceJournalId && (
                    <Link
                      href={`/journal?id=${m.sourceJournalId}`}
                      className="inline-flex items-center space-x-1 text-teal-600 dark:text-teal-400 hover:underline font-medium"
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-xl space-y-4">
            
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Edit Memory
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as MemoryCategory)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {Object.keys(CATEGORY_CONFIG).map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_CONFIG[c as MemoryCategory].label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Memory Title
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="prototype, coding, milestone"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium shadow-sm shadow-teal-600/20 disabled:opacity-50 flex items-center space-x-1.5"
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
