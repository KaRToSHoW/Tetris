import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  username: string;
  display_name: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, username: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be within AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          username: session.user.user_metadata?.username || '',
          display_name: session.user.user_metadata?.display_name || '',
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          username: session.user.user_metadata?.username || 'User',
          display_name: session.user.user_metadata?.display_name || 'User',
        });
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('checkAuth error:', err);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await checkAuth();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Sign in failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username, display_name: username },
        },
      });
      if (error) throw error;
      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email || '',
          username,
          display_name: username,
        });
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Sign up failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setUser(null);
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err: any) {
      console.error('Sign out error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};