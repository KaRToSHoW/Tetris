import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';

import { User } from '@supabase/supabase-js';

import AsyncStorage from '@react-native-async-storage/async-storage';


const supabaseUrl = 'https://igzogtxlmfirwimqnvqa.supabase.co';

const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlnem9ndHhsbWZpcndpbXFudnFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMTA3MjcsImV4cCI6MjA3NTU4NjcyN30.xJYaNqbOQTHNCfOg9xjEV3MfQLX3Kd6QYLKd0G3Y7Bc';


// Конфигурация для React Native с отключенным realtime

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {

  auth: {

    storage: AsyncStorage,

    persistSession: true,

    autoRefreshToken: true,

    detectSessionInUrl: false

  },

  realtime: {

    // Минимизируем использование realtime в Expo Go

    params: {

      eventsPerSecond: 1

    }

  }

});


// Типы для таблиц базы данных

export interface GameRecord {

  id?: string;

  user_id?: string;

  player_name: string;

  score: number;

  level: number;

  lines_cleared: number;

  time_played: number;

  created_at?: string;

}


export interface PlayerStats {

  id?: string;

  user_id?: string;

  total_games: number;

  total_score: number;

  best_score: number;

  total_lines_cleared: number;

  best_level_reached: number;

  total_time_played: number;

  created_at?: string;

  updated_at?: string;

}


export interface UserProfile {

  id: string;

  email: string;

  username: string;

  display_name: string;

  created_at: string;

  updated_at: string;

}


export interface Game_Settings {

  id?: string;

  user_id?: string;

  player_name: string;

  control_mode: string;

  show_grid: boolean;

  sound_enabled: boolean;

  difficulty: string;

  created_at?: string;

  updated_at?: string;

}


export interface AuthState {

  user: UserProfile | null;

  isLoading: boolean;

  error: string | null;

}


// Auth functions

export const signUp = async (email: string, password: string, username: string) => {

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
    
    // Create user profile after successful signup
    if (data.user) {
      await createUserProfile(data.user.id, email, username);
      await createInitialPlayerStats(data.user.id);
    }

    return { data, error: null };

  } catch (error: any) {

    return { data: null, error: error.message };

  }

};


export const signIn = async (email: string, password: string) => {

  try {

    const { data, error } = await supabase.auth.signInWithPassword({

      email,

      password

    });


    if (error) throw error;

    return { data, error: null };

  } catch (error: any) {

    return { data: null, error: error.message };

  }

};


export const signOut = async () => {

  try {

    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    return { error: null };

  } catch (error: any) {

    return { error: error.message };

  }

};


export const resetPassword = async (email: string) => {

  try {

    const { error } = await supabase.auth.resetPasswordForEmail(email, {

      redirectTo: 'https://igzogtxlmfirwimqnvqa.supabase.co/reset-password',

    });

    if (error) throw error;

    return { error: null };

  } catch (error: any) {

    return { error: error.message };

  }

};


export const getCurrentUser = async () => {

  try {

    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) throw error;

    if (!session) return { data: { user: null }, error: null };

    return { data: { user: session.user }, error: null };

  } catch (error: any) {

    return { data: { user: null }, error: error.message };

  }

};


export const refreshSession = async () => {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

// Enhanced API call wrapper with retry logic
export const apiCall = async <T>(apiFunction: () => Promise<{ data: T | null; error: any }>, maxRetries: number = 2): Promise<{ data: T | null; error: any }> => {
  let lastError: any;
  
  // Check if tab is visible before making API calls
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
    console.log('Tab is hidden, deferring API call...');
    await new Promise(resolve => {
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
          resolve(void 0);
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      // Fallback timeout
      setTimeout(() => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        resolve(void 0);
      }, 10000);
    });
  }
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await apiFunction();
      
      // If we get an auth error, try to refresh the session
      if (result.error && (result.error.message?.includes('JWT') || result.error.message?.includes('expired') || result.error.status === 401)) {
        if (attempt < maxRetries) {
          console.log(`Attempt ${attempt + 1}: Auth error detected, refreshing session...`);
          const refreshResult = await refreshSession();
          if (refreshResult.error) {
            lastError = refreshResult.error;
            continue;
          }
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
      }
      
      // Check for network errors
      if (result.error && (result.error.message?.includes('NetworkError') || result.error.message?.includes('fetch'))) {
        if (attempt < maxRetries) {
          console.log(`Attempt ${attempt + 1}: Network error detected, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
          continue;
        }
      }
      
      return result;
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        console.log(`Attempt ${attempt + 1}: Error occurred, retrying...`, error);
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }
  }
  
  return { data: null, error: lastError };
};


// Helper functions
export const createUserProfile = async (userId: string, email: string, username: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email,
        username,
        display_name: username
      })
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

export const createInitialPlayerStats = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('player_stats')
      .insert({
        user_id: userId,
        total_games: 0,
        total_score: 0,
        highest_score: 0,
        total_lines: 0,
        total_time: 0,
        level_reached: 1
      })
      .select()
      .single();
    
    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

// Database functions

export const getPlayerStats = async (userId: string) => {
  return apiCall(async () => {
    try {
      const { data, error } = await supabase
        .from('player_stats')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code === 'PGRST116') {
        // Stats not found, create initial stats
        const { data: newStats } = await createInitialPlayerStats(userId);
        return { data: newStats, error: null };
      }

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  });
};


export const getTopRecords = async (limit: number = 10) => {
  return apiCall(async () => {
    try {
      const { data, error } = await supabase
        .from('records')
        .select(`
          *,
          profiles!user_id (
            username,
            display_name
          )
        `)
        .order('score', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  });
};


export const saveGameRecord = async (record: Omit<GameRecord, 'id' | 'created_at'>) => {

  try {

    const { data, error } = await supabase

      .from('records')

      .insert([record])

      .select()

      .single();

    

    if (error) throw error;

    return { data, error: null };

  } catch (error: any) {

    return { data: null, error: error.message };

  }

};


export const updatePlayerStats = async (userId: string, stats: Partial<PlayerStats>) => {

  try {

    // First try to get existing stats

    const { data: existingStats } = await getPlayerStats(userId);

    

    if (existingStats) {

      // Update existing stats by adding to current values

      const updatedStats = {

        user_id: userId,

        total_games: (existingStats.total_games || 0) + (stats.total_games || 0),

        total_score: (existingStats.total_score || 0) + (stats.total_score || 0),

        best_score: Math.max((existingStats.best_score || 0), (stats.best_score || 0)),

        total_lines_cleared: (existingStats.total_lines_cleared || 0) + (stats.total_lines_cleared || 0),

        best_level_reached: Math.max((existingStats.best_level_reached || 0), (stats.best_level_reached || 0)),

        total_time_played: (existingStats.total_time_played || 0) + (stats.total_time_played || 0),

        updated_at: new Date().toISOString(),

      };

      

      const { data, error } = await supabase

        .from('player_stats')

        .update(updatedStats)

        .eq('user_id', userId)

        .select()

        .single();

      

      if (error) throw error;

      return { data, error: null };

    } else {

      // Create new stats record

      const { data, error } = await supabase

        .from('player_stats')

        .insert([{ user_id: userId, ...stats }])

        .select()

        .single();

      

      if (error) throw error;

      return { data, error: null };

    }

  } catch (error: any) {

    return { data: null, error: error.message };

  }

};


export const getUserProfile = async (userId: string) => {
  return apiCall(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error && error.code === 'PGRST116') {
        // Profile not found, try to create it from auth user
        console.log('Profile not found, attempting to create...');
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.id === userId) {
          const username = user.user_metadata?.username || user.email?.split('@')[0] || 'User';
          console.log('Creating profile for user:', user.email, 'with username:', username);
          
          const { data: newProfile, error: createError } = await createUserProfile(userId, user.email || '', username);
          if (createError) {
            console.error('Failed to create profile:', createError);
            return { data: null, error: createError };
          }
          
          // Create initial stats
          const { error: statsError } = await createInitialPlayerStats(userId);
          if (statsError) {
            console.error('Failed to create initial stats:', statsError);
          }
          
          return { data: newProfile, error: null };
        } else {
          return { data: null, error: 'User not authenticated' };
        }
      }

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  });
};


export const updateUserProfile = async (userId: string, profile: Partial<UserProfile>) => {

  try {

    const { data, error } = await supabase

      .from('profiles')

      .update(profile)

      .eq('id', userId)

      .select()

      .single();

    

    if (error) throw error;

    return { data, error: null };

  } catch (error: any) {

    return { data: null, error: error.message };

  }

};


// Game Settings functions

export const getGameSettings = async (userId: string) => {
  return apiCall(async () => {
    try {
      const { data, error } = await supabase
        .from('game_settings')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code === 'PGRST116') {
        // Settings not found, return null (will use defaults)
        return { data: null, error: null };
      }

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  });
};


export const saveGameSettings = async (settings: Omit<Game_Settings, 'id' | 'created_at' | 'updated_at'>) => {
  return apiCall(async () => {
    try {
      const { data, error } = await supabase
        .from('game_settings')
        .upsert(settings)
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: error.message };
    }
  });
};


export const getUserRecords = async (userId: string, limit: number = 10) => {

  try {

    const { data, error } = await supabase

      .from('records')

      .select('*')

      .eq('user_id', userId)

      .order('score', { ascending: false })

      .limit(limit);

    

    if (error) throw error;

    return { data, error: null };

  } catch (error: any) {

    return { data: null, error: error.message };

  }

};