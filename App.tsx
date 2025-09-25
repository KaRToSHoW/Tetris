import { StatusBar } from 'expo-status-bar';
import React, { useReducer } from 'react';
import { StyleSheet } from 'react-native';
import { appReducer, createInitialAppState } from './src/reducers/appReducer';
import MainMenu from './src/components/MainMenu';
import GameScreen from './src/components/GameScreen';
import SettingsScreen from './src/components/SettingsScreen';
import RecordsScreen from './src/components/RecordsScreen';
import type { Screen, HighScore } from './src/types/app';

export default function App() {
  const [appState, appDispatch] = useReducer(appReducer, undefined, createInitialAppState);

  const handleNavigate = (screen: Screen) => {
    appDispatch({ type: 'NAVIGATE_TO', screen });
  };

  const handleGameOver = (score: number, lines: number, level: number) => {
    const newHighScore: HighScore = {
      id: Date.now().toString(),
      score,
      lines,
      level,
      date: new Date().toISOString(),
      difficulty: appState.gameSettings.difficulty,
    };
    appDispatch({ type: 'ADD_HIGH_SCORE', score: newHighScore });
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

const styles = StyleSheet.create({});