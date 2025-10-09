import { useState, useEffect, useCallback } from 'react';
import { supabase, AuthState, UserProfile, signUp, signIn, signOut, resetPassword, getCurrentUser } from '../lib/supabase.ts';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null
  });

  // Функция для обновления состояния пользователя
  const updateUser = useCallback(async (user: User | null) => {
    if (user) {
      const userProfile: UserProfile = {
        id: user.id,
        email: user.email || '',
        username: user.user_metadata?.username || user.email?.split('@')[0],
        display_name: user.user_metadata?.display_name || user.user_metadata?.username || user.email?.split('@')[0],
        created_at: user.created_at,
        updated_at: user.updated_at
      };
      
      setAuthState({
        user: userProfile,
        isLoading: false,
        error: null
      });
    } else {
      setAuthState({
        user: null,
        isLoading: false,
        error: null
      });
    }
  }, []);

  // Инициализация аутентификации
  useEffect(() => {
    let mounted = true;

    // Получение текущего пользователя
    const getInitialUser = async () => {
      try {
        const { data: { user }, error } = await getCurrentUser();
        
        if (mounted) {
          if (error) {
            console.error('Ошибка получения пользователя:', error);
            setAuthState({
              user: null,
              isLoading: false,
              error: error.message
            });
          } else {
            await updateUser(user);
          }
        }
      } catch (error) {
        if (mounted) {
          console.error('Ошибка инициализации аутентификации:', error);
          setAuthState({
            user: null,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Неизвестная ошибка'
          });
        }
      }
    };

    getInitialUser();

    // Подписка на изменения аутентификации
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
          console.log('Auth state changed:', event, session);
          await updateUser(session?.user || null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [updateUser]);

  // Функция регистрации
  const handleSignUp = useCallback(async (email: string, password: string, username?: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const result = await signUp(email, password, username);
      
      if (result.user) {
        // Если пользователь создан, но нужно подтвердить email
        if (!result.session) {
          setAuthState(prev => ({ 
            ...prev, 
            isLoading: false, 
            error: 'Проверьте email для подтверждения регистрации' 
          }));
        }
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка регистрации';
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));
      throw error;
    }
  }, []);

  // Функция входа
  const handleSignIn = useCallback(async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const result = await signIn(email, password);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка входа';
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));
      throw error;
    }
  }, []);

  // Функция выхода
  const handleSignOut = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      await signOut();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка выхода';
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));
      throw error;
    }
  }, []);

  // Функция восстановления пароля
  const handlePasswordReset = useCallback(async (email: string) => {
    try {
      setAuthState(prev => ({ ...prev, error: null }));
      await resetPassword(email);
      return 'Инструкции по восстановлению пароля отправлены на email';
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка восстановления пароля';
      setAuthState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  // Функция очистки ошибок
  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    user: authState.user,
    isLoading: authState.isLoading,
    error: authState.error,
    isAuthenticated: !!authState.user,
    signUp: handleSignUp,
    signIn: handleSignIn,
    signOut: handleSignOut,
    resetPassword: handlePasswordReset,
    clearError
  };
}

// Хук для получения текущего пользователя (упрощенная версия)
export function useCurrentUser() {
  const { user, isLoading, isAuthenticated } = useAuth();
  
  return {
    user,
    isLoading,
    isAuthenticated,
    userId: user?.id || null,
    username: user?.username || user?.display_name || 'Аноним'
  };
}