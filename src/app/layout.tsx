import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
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
      <body suppressHydrationWarning className={`${inter.className} min-h-screen flex flex-col antialiased`} style={{ background: 'var(--mv-bg)', color: 'var(--mv-text)' }}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                try {
                  var savedTheme = localStorage.getItem('mv-theme') || 'light';
                  if (savedTheme === 'dark') {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.add('light');
                  }
                } catch(e) {}
                window.addEventListener('unhandledrejection', function(event) {
                  if (!event.reason || event.reason instanceof Event || (typeof event.reason === 'object' && !('message' in event.reason) && !('stack' in event.reason))) {
                    event.preventDefault();
                  }
                }, true);
              }
            `,
          }}
        />
        <ThemeProvider>
          <AuthProvider>
            <LayoutShell>{children}</LayoutShell>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
