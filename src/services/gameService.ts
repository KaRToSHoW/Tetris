import { supabase, GameRecord, PlayerStats, Game_Settings } from '../lib/supabase';

/**
 * Сервис для работы с игровыми данными в Supabase
 * Демонстрирует управление ресурсами через базу данных
 */
export class GameService {
  
  /**
   * Сохранение результата игры
   * Управляет ресурсом игровых рекордов
   */
  static async saveGameRecord(record: Omit<GameRecord, 'id' | 'created_at'>): Promise<GameRecord | null> {
    try {
      console.log('Saving game record:', record);
      const { data, error } = await supabase
        .from('records')
        .insert([record])
        .select()
        .single();

      if (error) {
        console.error('Error saving game record:', error);
        throw error;
      }

      console.log('Game record saved successfully:', data);
      return data;
    } catch (error) {
      console.error('Failed to save game record:', error);
      return null;
    }
  }

  /**
   * Получение лучших результатов
   * Демонстрирует загрузку и кэширование данных
   */
  static async getTopScores(limit: number = 10): Promise<GameRecord[]> {
    try {
      console.log('Fetching top scores, limit:', limit);
      const { data, error } = await supabase
        .from('records')
        .select('*')
        .order('score', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching top scores:', error);
        throw error;
      }

      console.log('Top scores fetched successfully:', data?.length, 'records');
      return data || [];
    } catch (error) {
      console.error('Failed to fetch top scores:', error);
      return [];
    }
  }

  /**
   * Получение результатов игрока
   * Управление персональными ресурсами
   */
  // identifier: can be userId (uuid) or playerName (string)
  static async getPlayerRecords(identifier: string, limit: number = 20): Promise<GameRecord[]> {
    try {
      console.log('Fetching player records for identifier:', identifier);
      const isUuid = /^[0-9a-fA-F-]{36}$/.test(identifier);
      let query: any = supabase
        .from('records')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      query = isUuid ? query.eq('user_id', identifier) : query.eq('player_name', identifier);

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching player records:', error);
        throw error;
      }

      console.log('Player records fetched successfully:', data?.length, 'records');
      return data || [];
    } catch (error) {
      console.error('Failed to fetch player records:', error);
      return [];
    }
  }

  /**
   * Сохранение настроек игрока
   * Управление пользовательскими предпочтениями
   */
  static async savePlayerSettings(settings: Omit<Game_Settings, 'id' | 'created_at' | 'updated_at'>): Promise<Game_Settings | null> {
    try {
      console.log('Saving player settings:', settings);
      // Prefer matching by user_id if provided (backwards-compatible)
  const isUuid = settings.user_id && /^[0-9a-fA-F-]{36}$/.test(settings.user_id || '');
      let existingData;
      if (isUuid) {
        const res = await supabase
          .from('game_settings')
          .select('id')
          .eq('user_id', settings.user_id)
          .single();
        existingData = res.data;
      } else {
        const res = await supabase
          .from('game_settings')
          .select('id')
          .eq('player_name', settings.player_name)
          .single();
        existingData = res.data;
      }

      let result;
      
      if (existingData) {
        // Обновляем существующие настройки
        const { data, error } = await supabase
          .from('game_settings')
          .update({ ...settings, updated_at: new Date().toISOString() })
          .eq('id', existingData.id)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      } else {
        // Создаем новые настройки
        const { data, error } = await supabase
          .from('game_settings')
          .insert([settings])
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      }

      console.log('Player settings saved successfully:', result);
      return result;
    } catch (error) {
      console.error('Failed to save player settings:', error);
      return null;
    }
  }

  /**
   * Загрузка настроек игрока
   * Управление состоянием пользовательских настроек
   */
  static async getPlayerSettings(identifier: string): Promise<Game_Settings | null> {
    try {
      console.log('Fetching player settings for identifier:', identifier);
      const isUuid = /^[0-9a-fA-F-]{36}$/.test(identifier);
      let query: any = supabase.from('game_settings').select('*').single();
      query = isUuid ? query.eq('user_id', identifier) : query.eq('player_name', identifier);
      const { data, error } = await query;

      if (error) {
        if (error.code === 'PGRST116') {
          // Записи не найдены - это нормально для нового игрока
          console.log('No settings found for identifier:', identifier);
          return null;
        }
        console.error('Error fetching player settings:', error);
        throw error;
      }

      console.log('Player settings fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('Failed to fetch player settings:', error);
      return null;
    }
  }

  /**
   * Обновление статистики игрока
   * Управление агрегированными данными
   */
  static async updatePlayerStats(identifier: string, gameData: {
    score: number;
    linesCleared: number;
    timePlayed: number;
  }): Promise<PlayerStats | null> {
    try {
      console.log('Updating player stats for identifier:', identifier, gameData);
      const isUuid = /^[0-9a-fA-F-]{36}$/.test(identifier);
      let statsQuery: any = supabase.from('player_stats').select('*').single();
      statsQuery = isUuid ? statsQuery.eq('user_id', identifier) : statsQuery.eq('player_name', identifier);
      const { data: currentStats } = await statsQuery;

      const newStats: Omit<PlayerStats, 'id' | 'created_at' | 'updated_at'> = currentStats
        ? {
            user_id: isUuid ? identifier : (currentStats.user_id || undefined),
            total_games: (currentStats.total_games || 0) + 1,
            total_score: (currentStats.total_score || 0) + gameData.score,
            best_score: Math.max(currentStats.best_score || 0, gameData.score),
            total_lines_cleared: (currentStats.total_lines_cleared || 0) + gameData.linesCleared,
            best_level_reached: currentStats.best_level_reached || 0,
            total_time_played: (currentStats.total_time_played || 0) + gameData.timePlayed,
          }
        : {
            user_id: isUuid ? identifier : undefined,
            total_games: 1,
            total_score: gameData.score,
            best_score: gameData.score,
            total_lines_cleared: gameData.linesCleared,
            best_level_reached: 0,
            total_time_played: gameData.timePlayed,
          };

      let result;
      
  if (currentStats) {
        // Обновляем существующую статистику
        const { data, error } = await supabase
          .from('player_stats')
          .update({ ...newStats, updated_at: new Date().toISOString() })
          .eq('id', currentStats.id)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      } else {
        // Создаем новую статистику
        const { data, error } = await supabase
          .from('player_stats')
          .insert([newStats])
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      }

      console.log('Player stats updated successfully:', result);
      return result;
    } catch (error) {
      console.error('Failed to update player stats:', error);
      return null;
    }
  }

  /**
   * Получение статистики игрока
   * Демонстрирует загрузку аналитических данных
   */
  static async getPlayerStats(identifier: string): Promise<PlayerStats | null> {
    try {
      console.log('Fetching player stats for identifier:', identifier);
      const isUuid = /^[0-9a-fA-F-]{36}$/.test(identifier);
      let query: any = supabase.from('player_stats').select('*').single();
      query = isUuid ? query.eq('user_id', identifier) : query.eq('player_name', identifier);
      const { data, error } = await query;

      if (error) {
        if (error.code === 'PGRST116') {
          // Статистики еще нет - это нормально для нового игрока
          console.log('No stats found for identifier:', identifier);
          return null;
        }
        console.error('Error fetching player stats:', error);
        throw error;
      }

      console.log('Player stats fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('Failed to fetch player stats:', error);
      return null;
    }
  }

  /**
   * Получение общей статистики игры
   * Демонстрирует работу с аналитическими запросами
   */
  static async getGameAnalytics(): Promise<{
    totalPlayers: number;
    totalGames: number;
    averageScore: number;
    topScore: number;
  } | null> {
    try {
      console.log('Fetching game analytics...');
      
      // Получаем общую статистику
      const { data: statsData, error: statsError } = await supabase
        .from('player_stats')
        .select('total_games, total_score, best_score');

      if (statsError) throw statsError;

      if (!statsData || statsData.length === 0) {
        return {
          totalPlayers: 0,
          totalGames: 0,
          averageScore: 0,
          topScore: 0,
        };
      }

      const totalPlayers = statsData.length;
      const totalGames = statsData.reduce((sum, stat) => sum + stat.total_games, 0);
      const totalScore = statsData.reduce((sum, stat) => sum + stat.total_score, 0);
      const topScore = Math.max(...statsData.map(stat => stat.best_score));
      const averageScore = totalGames > 0 ? Math.round(totalScore / totalGames) : 0;

      const analytics = {
        totalPlayers,
        totalGames,
        averageScore,
        topScore,
      };

      console.log('Game analytics fetched successfully:', analytics);
      return analytics;
    } catch (error) {
      console.error('Failed to fetch game analytics:', error);
      return null;
    }
  }
}