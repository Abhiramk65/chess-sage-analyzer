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

  // Center control bonus (e4, e5, d4, d5)
  const centralSquares: Square[] = ['e4', 'e5', 'd4', 'd5'];
  centralSquares.forEach(square => {
    const piece = chess.get(square);
    if (piece) {
      score += piece.color === 'w' ? 0.3 : -0.3;
    }
  });

  // Mobility evaluation
  const currentTurn = chess.turn();
  const originalMoves = chess.moves().length;
  
  // Switch turn to evaluate opponent's mobility
  chess.load(fen); // Reset to original position
  const opponentMoves = chess.moves().length;
  
  // Mobility score difference
  score += currentTurn === 'w' ? 
    (originalMoves - opponentMoves) * 0.1 : 
    (opponentMoves - originalMoves) * 0.1;

  return score;
};