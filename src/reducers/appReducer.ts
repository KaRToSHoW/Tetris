import type { AppState, AppAction, GameSettings } from '../types/app';

export function createInitialAppState(): AppState {
  const defaultSettings: GameSettings = {
    difficulty: 'normal',
    showGrid: true,
    showGhost: true,
    soundEnabled: true,
    musicEnabled: true,
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
    
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        gameSettings: {
          ...state.gameSettings,
          ...action.settings,
        },
      };
    
    case 'ADD_HIGH_SCORE': {
      const newRecords = [...state.records, action.score]
        .sort((a, b) => b.score - a.score)
        .slice(0, 10); // Keep only top 10 scores
      
      return {
        ...state,
        records: newRecords,
      };
    }
    
    case 'RESET_RECORDS':
      return {
        ...state,
        records: [],
      };
    
    default:
      return state;
  }
}