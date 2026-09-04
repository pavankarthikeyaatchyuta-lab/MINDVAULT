'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200 ${
        theme === 'dark'
          ? 'bg-slate-800/80 hover:bg-slate-700 text-amber-300 border border-slate-700 shadow-sm'
          : 'bg-white/90 hover:bg-white text-slate-700 hover:text-amber-500 border border-slate-200/80 shadow-sm'
      } ${className}`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Moon className="w-5 h-5 text-indigo-300 transition-transform hover:rotate-12" />
      ) : (
        <Sun className="w-5 h-5 text-amber-500 transition-transform hover:rotate-45" />
      )}
    </button>
  );
}
