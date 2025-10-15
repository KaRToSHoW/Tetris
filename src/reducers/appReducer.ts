import type { AppState, AppAction, GameSettings } from '../types/app';

export function createInitialAppState(): AppState {
  const defaultSettings: GameSettings = {
    difficulty: 'normal',
    showGrid: true,
    showGhost: true,
    soundEnabled: true,
    musicEnabled: true,
    controlMode: 'buttons',
  };

  return {
    currentScreen: 'menu',
    gameSettings: defaultSettings,
    records: [],
  };
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'NAVIGATE_TO':
      return {
        ...state,
        currentScreen: action.screen,
      };
    
    case 'UPDATE_SETTINGS': {
      const newSettings = {
        ...state.gameSettings,
        ...action.settings,
      };
      
      // Settings now saved through Supabase hooks
      
      return {
        ...state,
        gameSettings: newSettings,
      };
    }
    
    case 'ADD_HIGH_SCORE': {
      const newRecords = [...state.records, action.score]
        .sort((a, b) => b.score - a.score)
        .slice(0, 5); // Keep only top 5 scores
      
      // Records now saved through Supabase hooks
      
      return {
        ...state,
        records: newRecords,
      };
    }
    
    case 'RESET_RECORDS': {
      // Records now managed through Supabase hooks
      
      return {
        ...state,
        records: [],
      };
    }
    
    default:
      return state;
  }
}