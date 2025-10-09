import { StatusBar } from 'expo-status-bar';
import React, { useReducer, useEffect, useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { appReducer, createInitialAppState } from './src/reducers/appReducer';
import MainMenu from './src/components/MainMenu';
import GameScreen from './src/components/GameScreen';
import SettingsScreen from './src/components/SettingsScreen';
import RecordsScreen from './src/components/RecordsScreen';
import GameStats from './src/components/GameStats';
import PlayerSettings from './src/components/PlayerSettings';
import { usePlayerStats, useGameRecords } from './src/hooks/useGameData';
import { GameService } from './src/services/gameService';
import type { Screen, HighScore, AppState } from './src/types/app';
import type { GameRecord } from './src/lib/supabase.ts';

// Adapter function to convert GameRecord to HighScore
const gameRecordToHighScore = (record: GameRecord): HighScore => ({
  id: record.id?.toString() || Date.now().toString(),
  score: record.score,
  lines: record.lines_cleared,
  level: record.level,
  date: record.created_at || new Date().toISOString(),
  difficulty: 'normal' as const, // Default difficulty since it's not stored in GameRecord
});

export default function App() {
  // Инициализация основного состояния приложения
  const [appState, appDispatch] = useReducer(appReducer, undefined, createInitialAppState);
  
  // Состояние загрузки приложения
  const [isAppLoading, setIsAppLoading] = useState(true);
  
  // Имя игрока (в реальном приложении можно сделать авторизацию)
  const [playerName, setPlayerName] = useState('Игрок');
  
  // Кастомные хуки для управления ресурсами через Supabase
  const {
    records,
    saveRecord,
    isLoading: recordsLoading,
    error: recordsError
  } = useGameRecords(playerName);
  
  const {
    updateStats,
    isLoading: statsLoading,
    error: statsError
  } = usePlayerStats(playerName);

  // Инициализация приложения
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Простая инициализация - данные загружаются через хуки автоматически
        console.log('App initialized with Supabase integration');
        console.log('Player name:', playerName);
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setIsAppLoading(false);
      }
    };
    
    // Небольшая задержка для симуляции загрузки
    setTimeout(initializeApp, 1000);
  }, [playerName]);
  
  // Навигация между экранами с использованием useCallback для оптимизации
  const handleNavigate = useCallback((screen: Screen) => {
    appDispatch({ type: 'NAVIGATE_TO', screen });
  }, []);

  // Обработчик окончания игры с сохранением в Supabase
  const handleGameOver = useCallback(async (score: number, lines: number, level: number, gameTimeMs: number = 0) => {
    try {
      // Сохраняем рекорд в Supabase
      await saveRecord({
        player_name: playerName,
        score,
        level,
        lines_cleared: lines,
        time_played: Math.round(gameTimeMs / 1000), // конвертируем в секунды
      });
      
      // Обновляем статистику игрока
      await updateStats({
        score,
        linesCleared: lines,
        timePlayed: Math.round(gameTimeMs / 1000),
      });
      
      console.log('Game data saved to Supabase');
    } catch (error) {
      console.error('Error saving game data:', error);
    }
  }, [playerName, saveRecord, updateStats]);

  // Обновление настроек (теперь через Supabase)
  const handleUpdateSettings = useCallback((settings: any) => {
    appDispatch({ type: 'UPDATE_SETTINGS', settings });
  }, []);

  // Обработчик изменения имени игрока
  const handlePlayerNameChange = useCallback((newName: string) => {
    setPlayerName(newName);
  }, []);

  // Мемоизированный рендер текущего экрана для оптимизации производительности
  const renderCurrentScreen = useMemo(() => {
    switch (appState.currentScreen) {
      case 'menu':
        return <MainMenu onNavigate={handleNavigate} />;
      
      case 'game':
        return (
          <GameScreen 
            settings={appState.gameSettings}
            onNavigate={handleNavigate}
            onGameOver={handleGameOver}
          />
        );
      
      case 'settings':
        return (
          <PlayerSettings 
            playerName={playerName}
            onPlayerNameChange={handlePlayerNameChange}
            onClose={() => handleNavigate('menu')}
          />
        );
      
      case 'records':
        return (
          <RecordsScreen 
            records={(records || []).map(gameRecordToHighScore)}
            onNavigate={handleNavigate}
            onResetRecords={() => console.log('Reset not implemented with Supabase')}
          />
        );
      
      case 'stats':
        return (
          <GameStats 
            playerName={playerName}
            onClose={() => handleNavigate('menu')}
          />
        );
      
      case 'multiplayer':
        // For now, just show a coming soon screen
        return <MainMenu onNavigate={handleNavigate} />;
      
      default:
        return <MainMenu onNavigate={handleNavigate} />;
    }
  }, [appState.currentScreen, appState.gameSettings, records, playerName, handleNavigate, handleGameOver, handlePlayerNameChange]);
  
  // Показываем экран загрузки пока инициализируется приложение
  if (isAppLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Загрузка...</Text>
        {(recordsError || statsError) && (
          <Text style={styles.errorText}>
            {recordsError || statsError}
          </Text>
        )}
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      {renderCurrentScreen}
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 20,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});