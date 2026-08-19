import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { setActiveUserId, trackActivity } from '../lib/activity';
import { usePersonalizationStore } from '../store/usePersonalizationStore';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signInAsTestUser: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

function onSignedIn(user: User): void {
  setActiveUserId(user.id);
  usePersonalizationStore.getState().setPendingCheckIn(true);
  trackActivity('user_login', { screen: 'auth' });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setActiveUserId(session?.user?.id ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setActiveUserId(session?.user?.id ?? null);
      if (event === 'SIGNED_IN' && session?.user) onSignedIn(session.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message };
  }, []);

  const signInAsTestUser = useCallback(() => {
    const fakeUser = {
      id: 'test-user-001',
      email: 'test@focusbridge.local',
      user_metadata: { name: 'Test User' },
      app_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    } as User;
    setUser(fakeUser);
    setSession({ user: fakeUser, access_token: 'test-token' } as Session);
    onSignedIn(fakeUser);
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signInAsTestUser, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth<T = AuthState>(selector?: (state: AuthState) => T): T {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return selector ? selector(ctx) : (ctx as any);
}
