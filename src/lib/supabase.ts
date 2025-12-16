import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://igzogtxlmfirwimqnvqa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlnem9ndHhsbWZpcndpbXFudnFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMTA3MjcsImV4cCI6MjA3NTU4NjcyN30.xJYaNqbOQTHNCfOg9xjEV3MfQLX3Kd6QYLKd0G3Y7Bc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 1,
    },
  },
});

// Types
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
  created_at?: string;
  updated_at?: string;
}

export interface GameSettings {
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

// Database functions

export const getPlayerStats = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('player_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found - create initial stats
        return createInitialPlayerStats(userId);
      }
      throw error;
    }

    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
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
    return { data: data || [], error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

export const getUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found - get from auth user and create
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          return createUserProfile(
            user.id,
            user.email || '',
            user.user_metadata?.username || user.email?.split('@')[0] || 'User'
          );
        }
      }
      throw error;
    }

    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

export const createUserProfile = async (
  userId: string,
  email: string,
  username: string
) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email,
        username,
        display_name: username,
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
        best_score: 0,
        total_lines_cleared: 0,
        best_level_reached: 1,
        total_time_played: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

export const saveGameRecord = async (
  record: Omit<GameRecord, 'id' | 'created_at'>
) => {
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

export const updatePlayerStats = async (
  userId: string,
  stats: Partial<PlayerStats>
) => {
  try {
    const { data: existing } = await getPlayerStats(userId);

    if (existing) {
      const updatedStats = {
        total_games: (existing.total_games || 0) + (stats.total_games || 0),
        total_score: (existing.total_score || 0) + (stats.total_score || 0),
        best_score: Math.max(existing.best_score || 0, stats.best_score || 0),
        total_lines_cleared:
          (existing.total_lines_cleared || 0) + (stats.total_lines_cleared || 0),
        best_level_reached: Math.max(
          existing.best_level_reached || 0,
          stats.best_level_reached || 0
        ),
        total_time_played:
          (existing.total_time_played || 0) + (stats.total_time_played || 0),
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

export const getGameSettings = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('game_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

export const saveGameSettings = async (
  settings: Omit<GameSettings, 'id' | 'created_at' | 'updated_at'>
) => {
  try {
    if (!settings.user_id) {
      throw new Error('user_id is required');
    }

    const { data: existing } = await getGameSettings(settings.user_id);

    if (existing) {
      // Only send fields that exist in the table
      const updateData = {
        control_mode: settings.control_mode,
        show_grid: settings.show_grid,
        sound_enabled: settings.sound_enabled,
        difficulty: settings.difficulty,
      };

      const { data, error } = await supabase
        .from('game_settings')
        .update(updateData)
        .eq('user_id', settings.user_id)
        .select()
        .maybeSingle();

      if (error) throw error;
      return { data, error: null };
    } else {
      const insertData = {
        user_id: settings.user_id,
        player_name: settings.player_name,
        control_mode: settings.control_mode,
        show_grid: settings.show_grid,
        sound_enabled: settings.sound_enabled,
        difficulty: settings.difficulty,
      };

      const { data, error } = await supabase
        .from('game_settings')
        .insert([insertData])
        .select()
        .maybeSingle();

      if (error) throw error;
      return { data, error: null };
    }
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};

export const getTopRecords = async (limit: number = 10) => {
  try {
    const { data, error } = await supabase
      .from('records')
      .select('*')
      .order('score', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error: any) {
    return { data: null, error: error.message };
  }
};