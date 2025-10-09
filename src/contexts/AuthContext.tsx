import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, UserProfile, getCurrentUser, getUserProfile, refreshSession } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, username: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  clearError: () => void;
  refreshUserSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Получаем текущую сессию при инициализации
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        setSession(session);
        
        if (session?.user) {
          const { data: profile, error: profileError } = await getUserProfile(session.user.id);
          if (profileError) {
            console.log('Profile not found, user needs to complete registration');
          } else {
            setUser(profile);
          }
        }
      } catch (error) {
        console.error('Error getting session:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    getSession();

    // Слушаем изменения аутентификации
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        setSession(session);
        
        if (session?.user) {
          const { data: profile, error: profileError } = await getUserProfile(session.user.id);
          if (profileError) {
            console.log('Profile not found for user:', session.user.id);
            // Try to create profile from user metadata if it's a new user
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
              const username = session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'User';
              console.log('Creating profile for new user...');
              const { data: newProfile, error: createError } = await getUserProfile(session.user.id);
              if (newProfile) {
                setUser(newProfile);
              } else {
                console.error('Failed to create profile:', createError);
                setUser(null);
              }
            } else {
              setUser(null);
            }
          } else {
            setUser(profile);
          }
        } else {
          setUser(null);
        }
        
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            display_name: username,
          }
        }
      });

      if (error) throw error;

      // После успешной регистрации создаем профиль пользователя
      if (data.user && !data.session) {
        // Пользователь должен подтвердить email
        return { 
          success: true, 
          error: 'Пожалуйста, проверьте вашу почту и подтвердите регистрацию' 
        };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setSession(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const refreshUserSession = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await refreshSession();
      
      if (error) {
        console.error('Failed to refresh session:', error);
        setError('Session expired. Please log in again.');
        setUser(null);
        setSession(null);
        return;
      }
      
      if (data?.session) {
        setSession(data.session);
        if (data.session.user) {
          const { data: profile, error: profileError } = await getUserProfile(data.session.user.id);
          if (!profileError && profile) {
            setUser(profile);
          }
        }
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
      setError('Failed to refresh session');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-refresh session periodically
  useEffect(() => {
    if (!session) return;
    
    const refreshInterval = setInterval(() => {
      // Refresh session every 50 minutes (tokens expire in 1 hour)
      if (document.visibilityState === 'visible') {
        refreshUserSession();
      }
    }, 50 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, [session, refreshUserSession]);

  // Handle visibility change to prevent issues when switching tabs
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && session?.user) {
        // When user comes back to the tab, check if session is still valid
        console.log('Tab became visible, checking session...');
        setTimeout(() => {
          if (session?.user) {
            getUserProfile(session.user.id).then(({ data, error }) => {
              if (error && (error.includes('JWT') || error.includes('expired') || error.includes('401'))) {
                console.log('Session expired while tab was hidden, refreshing...');
                refreshUserSession();
              }
            });
          }
        }, 1000); // Small delay to avoid race conditions
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [session, refreshUserSession]);

  const value = {
    user,
    session,
    isLoading,
    error,
    signIn,
    signUp,
    signOut,
    clearError,
    refreshUserSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};