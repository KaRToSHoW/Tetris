// Platform-specific polyfills (native loads text-encoding, web uses a no-op)
import './src/polyfills';

import { StatusBar } from 'expo-status-bar';
import React, { useReducer } from 'react';
import { StyleSheet } from 'react-native';
import { appReducer, createInitialAppState } from './src/reducers/appReducer';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { saveGameRecord, updatePlayerStats } from './src/lib/supabase';
import MainMenu from './src/components/MainMenu';
import GameScreen from './src/components/GameScreen';
import SettingsScreen from './src/components/SettingsScreen';
import RecordsScreen from './src/components/RecordsScreen';
import { LoginScreen } from './src/components/auth/LoginScreen';
import { RegisterScreen } from './src/components/auth/RegisterScreen';
import { ProfileScreen } from './src/components/auth/ProfileScreen';
import type { Screen, HighScore } from './src/types/app';

function AppContent() {
  const [appState, appDispatch] = useReducer(appReducer, undefined, createInitialAppState);
  const { session, user } = useAuth();

  const handleNavigate = (screen: Screen) => {
    appDispatch({ type: 'NAVIGATE_TO', screen });
  };

  const handleGameOver = async (score: number, lines: number, level: number) => {
    const newHighScore: HighScore = {
      id: Date.now().toString(),
      score,
      lines,
      level,
      date: new Date().toISOString(),
      difficulty: appState.gameSettings.difficulty,
    };
    
    // Add to local state
    appDispatch({ type: 'ADD_HIGH_SCORE', score: newHighScore });
    
    // Save to Supabase if user is logged in
    if (session?.user) {
      try {
        // Calculate time played (you might want to track this properly)
        const timePlayed = Math.floor(Math.random() * 300) + 60; // Temporary placeholder
        
        // Save game record
        await saveGameRecord({
          user_id: session.user.id,
          player_name: user?.display_name || user?.username || session.user.email || 'Player',
          score,
          level,
          lines_cleared: lines,
          time_played: timePlayed,
        });
        
        // Update player stats (this is a simplified version - in reality you'd want to fetch current stats first)
        await updatePlayerStats(session.user.id, {
          total_games: 1,
          total_score: score,
          best_score: score,
          total_lines_cleared: lines,
          best_level_reached: level,
          total_time_played: timePlayed,
        });
        
        console.log('Game record saved successfully!');
      } catch (error) {
        console.error('Error saving game record:', error);
      }
    }
  };

  const handleUpdateSettings = (settings: any) => {
    appDispatch({ type: 'UPDATE_SETTINGS', settings });
  };

  const handleResetRecords = () => {
    appDispatch({ type: 'RESET_RECORDS' });
  };

  const renderCurrentScreen = () => {
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
          <SettingsScreen 
            settings={appState.gameSettings}
            onUpdateSettings={handleUpdateSettings}
            onNavigate={handleNavigate}
          />
        );
      
      case 'records':
        return (
          <RecordsScreen 
            records={appState.records}
            onNavigate={handleNavigate}
            onResetRecords={handleResetRecords}
          />
        );
      
      case 'login':
        return (
          <LoginScreen 
            onNavigateToRegister={() => handleNavigate('register')}
            onNavigateToGame={() => handleNavigate('menu')}
          />
        );
      
      case 'register':
        return (
          <RegisterScreen 
            onNavigateToLogin={() => handleNavigate('login')}
            onNavigateToGame={() => handleNavigate('menu')}
          />
        );
      
      case 'profile':
        return (
          <ProfileScreen 
            onNavigateToGame={() => handleNavigate('menu')}
            onNavigateToRecords={() => handleNavigate('records')}
          />
        );
      
      case 'multiplayer':
        // For now, just show a coming soon screen
        return <MainMenu onNavigate={handleNavigate} />;
      
      default:
        return <MainMenu onNavigate={handleNavigate} />;
    }
  };

  return (
    <>
      <StatusBar style="light" />
      {renderCurrentScreen()}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({});