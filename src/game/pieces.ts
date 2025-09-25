import { PIECE_KEYS } from './constants';
import type { Piece } from './types';

function randomKey(): Piece['key'] {
  const idx = Math.floor(Math.random() * PIECE_KEYS.length);
  return PIECE_KEYS[idx] as Piece['key'];
}

export function createRandomPiece(): Piece {
  return {
    key: randomKey(),
    rotation: 0,
    row: -1,
    col: 3,
  };
}

export function rotate(piece: Piece, dir: 1 | -1): Piece {
  return { ...piece, rotation: (piece.rotation + (dir === 1 ? 1 : 3)) % 4 };
}

export function move(piece: Piece, dRow: number, dCol: number): Piece {
  return { ...piece, row: piece.row + dRow, col: piece.col + dCol };
}

