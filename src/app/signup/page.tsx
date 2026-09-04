'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { BookOpen, Shield, AlertCircle, Loader2 } from 'lucide-react';

export default function SignUpPage() {
  const { signUpWithEmail, signInWithGoogle, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const router = useRouter();

  const formatAuthError = (err: any, defaultMsg: string): string => {
    if (err?.code === 'auth/configuration-not-found' || err?.message?.includes('configuration-not-found')) {
      return 'Firebase Authentication is not yet enabled in Firebase Console. Please open Firebase Console > Build > Authentication, click "Get Started", and enable the Email/Password provider.';
    }
    if (err?.code?.includes('api-key') || err?.message?.toLowerCase().includes('api-key')) {
      return 'Firebase API Key is currently set to placeholder. Please replace PASTE_YOUR_FIREBASE_API_KEY_HERE in .env.local with your real Web API Key from the Firebase Console (Project Settings > General > Your Apps > Web).';
    }
    if (err?.code === 'auth/email-already-in-use') {
      return 'An account already exists with this email address. Please sign in instead.';
    }
    return err?.message || defaultMsg;
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setFormError(null);
      await signInWithGoogle();
      router.push('/dashboard');
    } catch (err: any) {
      setFormError(formatAuthError(err, 'Google sign-in failed.'));
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setFormError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      setFormError(null);
      await signUpWithEmail(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setFormError(formatAuthError(err, 'Failed to create account.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-14rem)] flex items-center justify-center py-10 px-4 sm:px-6">
      <div className="w-full max-w-md mv-card p-8 space-y-6 animate-fadeIn">
        
        <div className="text-center space-y-2">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white mx-auto shadow-md shadow-indigo-500/25"
            style={{ background: 'linear-gradient(135deg, var(--mv-primary), var(--mv-accent))' }}
          >
            <BookOpen className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--mv-text)' }}>
            Create Your MindVault
          </h1>
          <p className="text-sm" style={{ color: 'var(--mv-text-muted)' }}>
            Start your private, AI-powered personal journal
          </p>
        </div>

        {(formError || error) && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-300 flex items-start space-x-2 backdrop-blur-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-500" />
            <span>{formError || error}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          suppressHydrationWarning
          className="w-full mv-btn-secondary flex items-center justify-center space-x-3 py-2.5 px-4 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--mv-primary)' }} />
          ) : (
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
          )}
          <span>Continue with Google</span>
        </button>

        <div className="relative flex items-center justify-center">
          <div className="border-t w-full" style={{ borderColor: 'var(--mv-border)' }} />
          <span
            className="px-3 text-xs uppercase tracking-wider rounded-md"
            style={{ background: 'var(--mv-surface)', color: 'var(--mv-text-muted)', backdropFilter: 'blur(8px)' }}
          >
            or register with email
          </span>
        </div>

        <form onSubmit={handleSignUp} className="space-y-4" suppressHydrationWarning>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--mv-text)' }}>
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              suppressHydrationWarning
              className="mv-input"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--mv-text)' }}>
              Password (min. 6 characters)
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              suppressHydrationWarning
              className="mv-input"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--mv-text)' }}>
              Confirm Password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              suppressHydrationWarning
              className="mv-input"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            suppressHydrationWarning
            className="w-full mv-btn-primary flex items-center justify-center space-x-2 py-3"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin text-white" />}
            <span>Create Account</span>
          </button>
        </form>

        <p className="text-center text-xs" style={{ color: 'var(--mv-text-muted)' }}>
          Already have an account?{' '}
          <Link href="/login" className="font-semibold hover:underline" style={{ color: 'var(--mv-primary)' }}>
            Sign In
          </Link>
        </p>

        <div className="flex items-center justify-center space-x-1.5 text-[11px]" style={{ color: 'var(--mv-text-muted)' }}>
          <Shield className="w-3.5 h-3.5" style={{ color: 'var(--mv-primary)' }} />
          <span>Private UID-Isolated Data Store</span>
        </div>

      </div>
    </div>
  );
}
