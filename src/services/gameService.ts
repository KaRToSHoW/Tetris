import { supabase, GameRecord, GameSettings, PlayerStats } from '../lib/supabase.ts';

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
        .from('game_records')
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
        .from('game_records')
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
  static async getPlayerRecords(playerName: string, limit: number = 20): Promise<GameRecord[]> {
    try {
      console.log('Fetching player records for:', playerName);
      
      const { data, error } = await supabase
        .from('game_records')
        .select('*')
        .eq('player_name', playerName)
        .order('created_at', { ascending: false })
        .limit(limit);

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
  static async savePlayerSettings(settings: Omit<GameSettings, 'id' | 'created_at' | 'updated_at'>): Promise<GameSettings | null> {
    try {
      console.log('Saving player settings:', settings);
      
      // Сначала пытаемся обновить существующие настройки
      const { data: existingData } = await supabase
        .from('game_settings')
        .select('id')
        .eq('player_name', settings.player_name)
        .single();

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
  static async getPlayerSettings(playerName: string): Promise<GameSettings | null> {
    try {
      console.log('Fetching player settings for:', playerName);
      
      const { data, error } = await supabase
        .from('game_settings')
        .select('*')
        .eq('player_name', playerName)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Записи не найдены - это нормально для нового игрока
          console.log('No settings found for player:', playerName);
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
  static async updatePlayerStats(playerName: string, gameData: {
    score: number;
    linesCleared: number;
    timePlayed: number;
  }): Promise<PlayerStats | null> {
    try {
      console.log('Updating player stats for:', playerName, gameData);
      
      // Получаем текущую статистику
      const { data: currentStats } = await supabase
        .from('player_stats')
        .select('*')
        .eq('player_name', playerName)
        .single();

      const newStats: Omit<PlayerStats, 'id' | 'created_at' | 'updated_at'> = currentStats 
        ? {
            player_name: playerName,
            total_games: currentStats.total_games + 1,
            total_score: currentStats.total_score + gameData.score,
            best_score: Math.max(currentStats.best_score, gameData.score),
            total_lines_cleared: currentStats.total_lines_cleared + gameData.linesCleared,
            avg_time_per_game: Math.round(
              (currentStats.avg_time_per_game * currentStats.total_games + gameData.timePlayed) / 
              (currentStats.total_games + 1)
            ),
          }
        : {
            player_name: playerName,
            total_games: 1,
            total_score: gameData.score,
            best_score: gameData.score,
            total_lines_cleared: gameData.linesCleared,
            avg_time_per_game: gameData.timePlayed,
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
  static async getPlayerStats(playerName: string): Promise<PlayerStats | null> {
    try {
      console.log('Fetching player stats for:', playerName);
      
      const { data, error } = await supabase
        .from('player_stats')
        .select('*')
        .eq('player_name', playerName)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Статистики еще нет - это нормально для нового игрока
          console.log('No stats found for player:', playerName);
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