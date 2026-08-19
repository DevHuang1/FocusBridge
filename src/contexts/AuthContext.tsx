import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { User } from 'firebase/auth';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { getAuthInstance } from '../lib/firebase';
import { setActiveUserId, trackActivity } from '../lib/activity';
import { usePersonalizationStore } from '../store/usePersonalizationStore';

const DEMO_EMAIL = import.meta.env.VITE_DEMO_USER_EMAIL ?? 'demo@focusbridge.app';
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_USER_PASSWORD ?? 'demo-pass-2026';

interface AuthState {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signInAsDemo: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

function onSignedIn(user: User): void {
  setActiveUserId(user.uid);
  trackActivity('user_login', { screen: 'auth' });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuthInstance(), (firebaseUser) => {
      setUser(firebaseUser);
      setActiveUserId(firebaseUser?.uid ?? null);
      if (firebaseUser) onSignedIn(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(getAuthInstance(), email, password);
      usePersonalizationStore.getState().setPendingCheckIn(true);
      return {};
    } catch (error: any) {
      return { error: error?.message ?? 'Sign up failed' };
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(getAuthInstance(), email, password);
      usePersonalizationStore.getState().setPendingCheckIn(true);
      return {};
    } catch (error: any) {
      return { error: error?.message ?? 'Sign in failed' };
    }
  }, []);

  const signInAsDemo = useCallback(async () => {
    try {
      await signInWithEmailAndPassword(getAuthInstance(), DEMO_EMAIL, DEMO_PASSWORD);
      usePersonalizationStore.getState().setPendingCheckIn(true);
      return {};
    } catch (error: any) {
      return { error: error?.message ?? 'Demo sign in failed' };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut(getAuthInstance());
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signInAsDemo, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth<T = AuthState>(selector?: (state: AuthState) => T): T {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return selector ? selector(ctx) : (ctx as any);
}