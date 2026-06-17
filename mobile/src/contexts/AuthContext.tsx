import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isRecovering: boolean;
  emailJustVerified: boolean;
  clearRecovery: () => void;
  markEmailVerified: () => void;
  clearEmailVerified: () => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isRecovering: false,
  emailJustVerified: false,
  clearRecovery: () => {},
  markEmailVerified: () => {},
  clearEmailVerified: () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRecovering, setIsRecovering] = useState(false);
  const [emailJustVerified, setEmailJustVerified] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovering(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const clearRecovery = useCallback(() => setIsRecovering(false), []);
  const markEmailVerified = useCallback(() => setEmailJustVerified(true), []);
  const clearEmailVerified = useCallback(() => setEmailJustVerified(false), []);
  const signOut = useCallback(async () => { await supabase.auth.signOut(); }, []);

  const value = useMemo(
    () => ({ user, session, loading, isRecovering, emailJustVerified, clearRecovery, markEmailVerified, clearEmailVerified, signOut }),
    [user, session, loading, isRecovering, emailJustVerified, clearRecovery, markEmailVerified, clearEmailVerified, signOut],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
