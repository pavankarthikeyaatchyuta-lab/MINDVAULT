import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { LayoutShell } from '@/components/LayoutShell';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

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
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                window.addEventListener('unhandledrejection', function(event) {
                  // Prevent non-Error Event objects (e.g. extension script errors, resource load errors, popup closures) from crashing the dev overlay
                  if (!event.reason || event.reason instanceof Event || (typeof event.reason === 'object' && !('message' in event.reason) && !('stack' in event.reason))) {
                    event.preventDefault();
                  }
                }, true);
              }
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className={`${inter.className} min-h-screen flex flex-col antialiased`} style={{ background: 'var(--mv-bg)', color: 'var(--mv-text)' }}>
        <AuthProvider>
          <LayoutShell>{children}</LayoutShell>
        </AuthProvider>
      </body>
    </html>
  );
}
