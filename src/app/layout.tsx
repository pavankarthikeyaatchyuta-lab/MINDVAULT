import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { LayoutShell } from '@/components/LayoutShell';

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
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className="min-h-screen flex flex-col antialiased" style={{ background: 'var(--mv-bg)', color: 'var(--mv-text)' }}>
        <AuthProvider>
          <LayoutShell>{children}</LayoutShell>
        </AuthProvider>
      </body>
    </html>
  );
}
