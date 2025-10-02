// Application-wide types and enums

export type Screen = 'menu' | 'game' | 'settings' | 'records' | 'multiplayer';

export interface AppState {
  currentScreen: Screen;
  gameSettings: GameSettings;
  records: HighScore[];
}

export interface GameSettings {
  difficulty: 'easy' | 'normal' | 'hard';
  showGrid: boolean;
  showGhost: boolean;
  soundEnabled: boolean;
  musicEnabled: boolean;
  controlMode: 'buttons' | 'swipes';
}

export interface HighScore {
  id: string;
  score: number;
  lines: number;
  level: number;
  date: string;
  difficulty: GameSettings['difficulty'];
}

export type AppAction = 
  | { type: 'NAVIGATE_TO'; screen: Screen }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<GameSettings> }
  | { type: 'ADD_HIGH_SCORE'; score: HighScore }
  | { type: 'RESET_RECORDS' };