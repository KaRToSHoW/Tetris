import { useState, useEffect, useCallback, useMemo } from 'react';
import { GameService } from '../services/gameService';
import { GameRecord, GameSettings, PlayerStats } from '../lib/supabase.ts';

/**
 * Хук для управления игровыми рекордами
 * Демонстрирует использование useState, useEffect, useCallback для управления данными
 */
export function useGameRecords(playerName?: string) {
  const [records, setRecords] = useState<GameRecord[]>([]);
  const [topScores, setTopScores] = useState<GameRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // useCallback для оптимизации функций
  const loadTopScores = useCallback(async (limit: number = 10) => {
    setIsLoading(true);
    setError(null);
    try {
      const scores = await GameService.getTopScores(limit);
      setTopScores(scores);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load top scores');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadPlayerRecords = useCallback(async (name: string, limit: number = 20) => {
    setIsLoading(true);
    setError(null);
    try {
      const playerRecords = await GameService.getPlayerRecords(name, limit);
      setRecords(playerRecords);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load player records');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveRecord = useCallback(async (record: Omit<GameRecord, 'id' | 'created_at'>) => {
    setError(null);
    try {
      const savedRecord = await GameService.saveGameRecord(record);
      if (savedRecord) {
        // Обновляем локальные данные
        setRecords(prev => [savedRecord, ...prev]);
        // Если это топ результат, обновляем топ-лист
        if (topScores.length === 0 || savedRecord.score > topScores[topScores.length - 1]?.score) {
          await loadTopScores();
        }
        return savedRecord;
      }
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save record');
      return null;
    }
  }, [topScores, loadTopScores]);

  // useEffect для автоматической загрузки данных
  useEffect(() => {
    loadTopScores();
  }, [loadTopScores]);

  useEffect(() => {
    if (playerName) {
      loadPlayerRecords(playerName);
    }
  }, [playerName, loadPlayerRecords]);

  // useMemo для оптимизации вычислений
  const playerBestScore = useMemo(() => {
    if (records.length === 0) return 0;
    return Math.max(...records.map(record => record.score));
  }, [records]);

  const playerAverageScore = useMemo(() => {
    if (records.length === 0) return 0;
    const total = records.reduce((sum, record) => sum + record.score, 0);
    return Math.round(total / records.length);
  }, [records]);

  return {
    records,
    topScores,
    isLoading,
    error,
    playerBestScore,
    playerAverageScore,
    loadTopScores,
    loadPlayerRecords,
    saveRecord,
    refresh: () => {
      loadTopScores();
      if (playerName) {
        loadPlayerRecords(playerName);
      }
    },
  };
}

/**
 * Хук для управления настройками игрока
 * Демонстрирует управление пользовательскими ресурсами
 */
export function usePlayerSettings(playerName: string) {
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Загрузка настроек при изменении имени игрока
  useEffect(() => {
    if (!playerName) return;

    const loadSettings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const playerSettings = await GameService.getPlayerSettings(playerName);
        setSettings(playerSettings);
        setHasChanges(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [playerName]);

  // Функция для обновления настроек локально
  const updateSettings = useCallback((newSettings: Partial<GameSettings>) => {
    setSettings(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...newSettings };
      setHasChanges(true);
      return updated;
    });
  }, []);

  // Функция для сохранения настроек в базе данных
  const saveSettings = useCallback(async () => {
    if (!settings || !hasChanges) return false;

    setIsLoading(true);
    setError(null);
    try {
      const savedSettings = await GameService.savePlayerSettings({
        player_name: settings.player_name,
        control_mode: settings.control_mode,
        show_grid: settings.show_grid,
        sound_enabled: settings.sound_enabled,
        difficulty: settings.difficulty,
      });

      if (savedSettings) {
        setSettings(savedSettings);
        setHasChanges(false);
        return true;
      }
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [settings, hasChanges]);

  // Функция для создания настроек по умолчанию
  const createDefaultSettings = useCallback(async () => {
    if (!playerName) return;

    const defaultSettings = {
      player_name: playerName,
      control_mode: 'buttons' as const,
      show_grid: true,
      sound_enabled: true,
      difficulty: 'medium' as const,
    };

    setIsLoading(true);
    setError(null);
    try {
      const savedSettings = await GameService.savePlayerSettings(defaultSettings);
      if (savedSettings) {
        setSettings(savedSettings);
        setHasChanges(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create default settings');
    } finally {
      setIsLoading(false);
    }
  }, [playerName]);

  return {
    settings,
    isLoading,
    error,
    hasChanges,
    updateSettings,
    saveSettings,
    createDefaultSettings,
  };
}

/**
 * Хук для управления статистикой игрока
 * Демонстрирует работу с аналитическими данными
 */
export function usePlayerStats(playerName: string) {
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [gameAnalytics, setGameAnalytics] = useState<{
    totalPlayers: number;
    totalGames: number;
    averageScore: number;
    topScore: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Загрузка статистики игрока
  const loadPlayerStats = useCallback(async () => {
    if (!playerName) return;

    setIsLoading(true);
    setError(null);
    try {
      const playerStats = await GameService.getPlayerStats(playerName);
      setStats(playerStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load player stats');
    } finally {
      setIsLoading(false);
    }
  }, [playerName]);

  // Загрузка общей аналитики
  const loadGameAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const analytics = await GameService.getGameAnalytics();
      setGameAnalytics(analytics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load game analytics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Обновление статистики после игры
  const updateStats = useCallback(async (gameData: {
    score: number;
    linesCleared: number;
    timePlayed: number;
  }) => {
    if (!playerName) return null;

    setError(null);
    try {
      const updatedStats = await GameService.updatePlayerStats(playerName, gameData);
      if (updatedStats) {
        setStats(updatedStats);
        // Обновляем общую аналитику
        await loadGameAnalytics();
      }
      return updatedStats;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update stats');
      return null;
    }
  }, [playerName, loadGameAnalytics]);

  // Автоматическая загрузка данных
  useEffect(() => {
    loadPlayerStats();
    loadGameAnalytics();
  }, [loadPlayerStats, loadGameAnalytics]);

  // Вычисляемые значения
  const playerRank = useMemo(() => {
    if (!stats || !gameAnalytics) return null;
    
    // Приблизительный расчет ранга на основе лучшего счета
    const totalPlayers = gameAnalytics.totalPlayers;
    const playerBestScore = stats.best_score;
    const topScore = gameAnalytics.topScore;
    
    if (totalPlayers === 0 || topScore === 0) return null;
    
    // Простая формула для расчета ранга
    const scoreRatio = playerBestScore / topScore;
    const estimatedRank = Math.max(1, Math.ceil(totalPlayers * (1 - scoreRatio)));
    
    return estimatedRank;
  }, [stats, gameAnalytics]);

  return {
    stats,
    gameAnalytics,
    playerRank,
    isLoading,
    error,
    loadPlayerStats,
    loadGameAnalytics,
    updateStats,
    refresh: () => {
      loadPlayerStats();
      loadGameAnalytics();
    },
  };
}