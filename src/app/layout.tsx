import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'MindVault — Your Journal That Remembers',
  description: 'A private, AI-powered personal journal with multi-turn Gemini reflection, automatic memory extraction, timeline analysis, and rewind retrospectives.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen flex flex-col antialiased">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500">
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
        </AuthProvider>
      </body>
    </html>
  );
}
