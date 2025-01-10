import { Chess } from 'chess.js';
import { Square } from 'react-chessboard/dist/chessboard/types';
import { getPieceValue } from './pieceValues';

export const evaluatePosition = (chess: Chess): number => {
  const fen = chess.fen();
  const position = fen.split(' ')[0];
  let score = 0;

  // Material evaluation
  for (let i = 0; i < position.length; i++) {
    const char = position[i];
    if (char.match(/[pnbrqk]/i)) {
      const value = getPieceValue(char);
      score += char === char.toUpperCase() ? value : -value;
    }
  }

  // Center control bonus
  const centralSquares = ['e4', 'e5', 'd4', 'd5'];
  centralSquares.forEach(square => {
    const piece = chess.get(square as Square);
    if (piece) {
      score += piece.color === 'w' ? 0.2 : -0.2;
    }
  });

  // Mobility bonus
  const mobilityScore = chess.moves().length * 0.1;
  score += chess.turn() === 'w' ? mobilityScore : -mobilityScore;

  // King safety
  const whiteKingSquare = chess.board().find(row => 
    row?.find(piece => piece?.type === 'k' && piece.color === 'w')
  )?.[0];
  const blackKingSquare = chess.board().find(row => 
    row?.find(piece => piece?.type === 'k' && piece.color === 'b')
  )?.[0];

  if (whiteKingSquare) {
    score += 0.3; // Bonus for king safety
  }
  if (blackKingSquare) {
    score -= 0.3;
  }

  return score;
};