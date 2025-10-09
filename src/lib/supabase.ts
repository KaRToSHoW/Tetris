import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://igzogtxlmfirwimqnvqa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlnem9ndHhsbWZpcndpbXFudnFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMTA3MjcsImV4cCI6MjA3NTU4NjcyN30.xJYaNqbOQTHNCfOg9xjEV3MfQLX3Kd6QYLKd0G3Y7Bc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Типы для таблиц базы данных
export interface GameRecord {
  id?: number;
  user_id?: string; // UUID пользователя из auth.users
  player_name: string;
  score: number;
  level: number;
  lines_cleared: number;
  time_played: number;
  created_at?: string;
}

export interface GameSettings {
  id?: number;
  user_id?: string; // UUID пользователя из auth.users
  player_name: string;
  control_mode: 'buttons' | 'swipes';
  show_grid: boolean;
  sound_enabled: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
  created_at?: string;
  updated_at?: string;
}

export interface PlayerStats {
  id?: number;
  user_id?: string; // UUID пользователя из auth.users
  player_name: string;
  total_games: number;
  total_score: number;
  best_score: number;
  total_lines_cleared: number;
  avg_time_per_game: number;
  created_at?: string;
  updated_at?: string;
}

// Типы для аутентификации
export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  display_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
}

// Утилиты для работы с аутентификацией
export const getCurrentUser = () => {
  return supabase.auth.getUser();
};

export const signUp = async (email: string, password: string, username?: string) => {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username || email.split('@')[0],
        display_name: username || email.split('@')[0]
      }
    }
  });
  
  if (authError) throw authError;
  return authData;
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const resetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
};