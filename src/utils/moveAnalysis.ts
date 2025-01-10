import { Chess } from 'chess.js';
import { Square } from 'react-chessboard/dist/chessboard/types';
import { evaluatePosition } from './positionEvaluation';
import { generateBestMoves, generateAlternateLines } from './moveGeneration';

export interface SuggestedLine {
  moves: string[];
  evaluation: number;
}

export interface MoveEvaluation {
  move: string;
  quality: string;
  className: string;
  suggestedMove?: {
    from: Square;
    to: Square;
  };
  alternateLines?: SuggestedLine[];
  evaluation?: number;
}

export const evaluateMove = (move: string, index: number): MoveEvaluation => {
  try {
    const chess = new Chess();
    const moveHistory = move.split(' ');
    moveHistory.forEach(m => chess.move(m));
    
    const positionBeforeMove = chess.fen();
    chess.undo();
    
    const currentEval = evaluatePosition(chess);
    const bestMoves = generateBestMoves(chess);
    const bestMove = bestMoves[0];
    
    chess.move(move);
    const newEval = evaluatePosition(chess);
    const evalDiff = newEval - currentEval;
    
    let quality = '';
    let className = '';
    
    if (evalDiff > 1.5) {
      quality = 'Brilliant';
      className = 'text-green-600 font-bold';
    } else if (evalDiff > 0.5) {
      quality = 'Good move';
      className = 'text-green-500';
    } else if (evalDiff > -0.5) {
      quality = 'Normal';
      className = 'text-gray-500';
    } else if (evalDiff > -1.5) {
      quality = 'Inaccuracy';
      className = 'text-yellow-500';
    } else {
      quality = 'Blunder';
      className = 'text-red-500';
    }

    const shouldIncludeAlternatives = quality !== 'Brilliant' && quality !== 'Good move';

    return {
      move,
      quality,
      className,
      suggestedMove: shouldIncludeAlternatives ? bestMove : undefined,
      alternateLines: shouldIncludeAlternatives ? 
        generateAlternateLines(positionBeforeMove) : undefined,
      evaluation: evalDiff
    };
  } catch (error) {
    console.error('Error evaluating move:', error);
    return {
      move,
      quality: 'Normal',
      className: 'text-gray-500',
      evaluation: 0
    };
  }
};