'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';

const publicPaths = ['/', '/login', '/signup'];

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  const isPublicPage = publicPaths.includes(pathname);
  const showSidebar = !loading && user && !isPublicPage;

  if (showSidebar) {
    return (
      <>
        <Sidebar />
        {/* Main content offset for sidebar */}
        <div className="lg:ml-64 min-h-screen mv-page-bg">
          <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-8">
            {children}
          </main>
          <footer className="border-t py-5 text-center text-xs px-4" style={{ borderColor: 'var(--mv-border)', color: 'var(--mv-text-muted)' }}>
            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
              <p className="flex items-center space-x-1.5">
                <span className="font-semibold" style={{ color: 'var(--mv-primary)' }}>MindVault</span>
                <span>•</span>
                <span>Your past. A more intentional future.</span>
              </p>
              <p className="flex items-center space-x-1">
                <span>Built with</span>
                <span className="text-red-400">♥</span>
                <span>using Firebase, Firestore, Gemini &amp; Cloud Run</span>
              </p>
            </div>
          </footer>
        </div>
      </>
    );
  }

  // Public / unauthenticated layout
  return (
    <>
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mv-page-bg">
        {children}
      </main>
      <footer className="border-t py-5 text-center text-xs" style={{ borderColor: 'var(--mv-border)', color: 'var(--mv-text-muted)' }}>
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>MindVault • Google Cloud Gen AI Academy Cohort 3 Ideathon</p>
          <p className="flex items-center space-x-1">
            <span>UID-Isolated</span>
            <span>•</span>
            <span>Cloud Run Ready</span>
            <span>•</span>
            <span>Gemini Powered</span>
          </p>
        </div>
      </footer>
    </>
  );
}
