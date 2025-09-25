import { TICK_MS_BASE } from './constants';
import type { GameState, Piece } from './types';
import { createEmptyBoard, canPlace, mergePiece, clearFullLines } from './board';
import { createRandomPiece, move, rotate } from './pieces';

export type Action =
  | { type: 'TICK' }
  | { type: 'MOVE'; dir: 'left' | 'right' | 'down' }
  | { type: 'ROTATE'; dir: 1 | -1 }
  | { type: 'HARD_DROP' }
  | { type: 'PAUSE_TOGGLE' }
  | { type: 'RESTART' };

export function getTickMs(level: number): number {
  const minMs = 80;
  const decay = Math.max(minMs, TICK_MS_BASE - level * 60);
  return decay;
}

export function createInitialState(): GameState {
  const next = createRandomPiece();
  const active = createRandomPiece();
  return {
    board: createEmptyBoard(),
    active,
    next,
    score: 0,
    linesCleared: 0,
    level: 0,
    isGameOver: false,
    isPaused: false,
  };
}

function lockAndSpawn(state: GameState): GameState {
  const merged = mergePiece(state.board, state.active as Piece);
  const { board: clearedBoard, lines } = clearFullLines(merged);
  const linesCleared = state.linesCleared + lines;
  const level = Math.floor(linesCleared / 10);
  const score = state.score + (lines === 1 ? 100 : lines === 2 ? 300 : lines === 3 ? 500 : lines === 4 ? 800 : 0) * (level + 1);
  const active = { ...state.next, row: -1, col: 3, rotation: 0 };
  const next = createRandomPiece();
  const isGameOver = !canPlace(clearedBoard, active);
  return { ...state, board: clearedBoard, active, next, linesCleared, level, score, isGameOver };
}

export function reducer(state: GameState, action: Action): GameState {
  if (state.isGameOver) {
    if (action.type === 'RESTART') return createInitialState();
    return state;
  }
  switch (action.type) {
    case 'RESTART':
      return createInitialState();
    case 'PAUSE_TOGGLE':
      return { ...state, isPaused: !state.isPaused };
    case 'ROTATE': {
      if (state.isPaused || !state.active) return state;
      const rotated = rotate(state.active, action.dir);
      if (canPlace(state.board, rotated)) return { ...state, active: rotated };
      const kickedLeft = { ...rotated, col: rotated.col - 1 };
      if (canPlace(state.board, kickedLeft)) return { ...state, active: kickedLeft };
      const kickedRight = { ...rotated, col: rotated.col + 1 };
      if (canPlace(state.board, kickedRight)) return { ...state, active: kickedRight };
      return state;
    }
    case 'MOVE': {
      if (state.isPaused || !state.active) return state;
      const delta = action.dir === 'left' ? [0, -1] : action.dir === 'right' ? [0, 1] : [1, 0];
      const nextPiece = move(state.active, delta[0], delta[1]);
      if (canPlace(state.board, nextPiece)) return { ...state, active: nextPiece };
      if (action.dir === 'down') {
        return lockAndSpawn(state);
      }
      return state;
    }
    case 'HARD_DROP': {
      if (state.isPaused || !state.active) return state;
      let falling = state.active;
      while (canPlace(state.board, move(falling, 1, 0))) {
        falling = move(falling, 1, 0);
      }
      return lockAndSpawn({ ...state, active: falling });
    }
    case 'TICK': {
      if (state.isPaused || !state.active) return state;
      const down = move(state.active, 1, 0);
      if (canPlace(state.board, down)) return { ...state, active: down };
      return lockAndSpawn(state);
    }
    default:
      return state;
  }
}

