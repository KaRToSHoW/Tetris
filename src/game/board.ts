import { BOARD_COLS, BOARD_ROWS, TETROMINOES } from './constants';
import type { Board, Piece } from './types';

export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_ROWS }, () => Array.from({ length: BOARD_COLS }, () => 0));
}

export function getPieceMatrix(piece: Piece): number[][] {
  return TETROMINOES[piece.key][piece.rotation % 4];
}

export function canPlace(board: Board, piece: Piece): boolean {
  const matrix = getPieceMatrix(piece);
  for (let r = 0; r < 4; r += 1) {
    for (let c = 0; c < 4; c += 1) {
      const val = matrix[r][c];
      if (!val) continue;
      const br = piece.row + r;
      const bc = piece.col + c;
      if (br < 0 || br >= BOARD_ROWS || bc < 0 || bc >= BOARD_COLS) return false;
      if (board[br][bc] !== 0) return false;
    }
  }
  return true;
}

export function mergePiece(board: Board, piece: Piece): Board {
  const matrix = getPieceMatrix(piece);
  const next = board.map((row) => row.slice());
  for (let r = 0; r < 4; r += 1) {
    for (let c = 0; c < 4; c += 1) {
      const val = matrix[r][c];
      if (!val) continue;
      const br = piece.row + r;
      const bc = piece.col + c;
      if (br >= 0 && br < BOARD_ROWS && bc >= 0 && bc < BOARD_COLS) {
        next[br][bc] = val as never;
      }
    }
  }
  return next;
}

export function clearFullLines(board: Board): { board: Board; lines: number } {
  const remaining: Board = [];
  let lines = 0;
  for (let r = 0; r < BOARD_ROWS; r += 1) {
    if (board[r].every((cell) => cell !== 0)) {
      lines += 1;
    } else {
      remaining.push(board[r]);
    }
  }
  while (remaining.length < BOARD_ROWS) {
    remaining.unshift(Array.from({ length: BOARD_COLS }, () => 0));
  }
  return { board: remaining, lines };
}

