import type { Cell } from './constants';

export type Board = Cell[][];

export interface Piece {
  key: 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';
  rotation: number;
  row: number;
  col: number;
}

export interface GameState {
  board: Board;
  active: Piece | null;
  next: Piece;
  score: number;
  linesCleared: number;
  level: number;
  isGameOver: boolean;
  isPaused: boolean;
}

