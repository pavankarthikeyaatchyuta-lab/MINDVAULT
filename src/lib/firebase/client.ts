import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';

function cleanEnv(val?: string): string | undefined {
  if (!val) return undefined;
  let trimmed = val.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    trimmed = trimmed.slice(1, -1).trim();
  }
  return trimmed || undefined;
}

const firebaseConfig = {
  apiKey: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
};

function getFirebaseClientApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }
  return initializeApp(firebaseConfig);
}

export function getClientAuth(): Auth {
  return getAuth(getFirebaseClientApp());
}

export const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle(): Promise<User> {
  try {
    const auth = getClientAuth();
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err: any) {
    if (err instanceof Error) throw err;
    throw new Error(err?.message || 'Google sign-in was interrupted or closed.');
  }
}

export async function signInWithEmail(email: string, pass: string): Promise<User> {
  try {
    const auth = getClientAuth();
    const result = await signInWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (err: any) {
    if (err instanceof Error) throw err;
    throw new Error(err?.message || 'Sign in failed.');
  }
}

export async function signUpWithEmail(email: string, pass: string): Promise<User> {
  try {
    const auth = getClientAuth();
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (err: any) {
    if (err instanceof Error) throw err;
    throw new Error(err?.message || 'Sign up failed.');
  }
}

export async function signOutUser(): Promise<void> {
  const auth = getClientAuth();
  await signOut(auth);
}

export async function getFirebaseAuthToken(): Promise<string | null> {
  const auth = getClientAuth();
  const currentUser = auth.currentUser;
  if (!currentUser) return null;
  return currentUser.getIdToken(false);
}
