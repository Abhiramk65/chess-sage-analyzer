import { Square } from 'react-chessboard/dist/chessboard/types';

export interface MoveEvaluation {
  move: string;
  quality: string;
  className: string;
  suggestedMove?: {
    from: Square;
    to: Square;
  };
}

export const evaluateMove = (move: string, index: number): MoveEvaluation => {
  const hash = move.split('').reduce((acc, char) => acc + char.charCodeAt(0), index);
  const randomQuality = (hash % 100) / 100;
  
  let quality = '';
  let className = '';
  
  if (randomQuality > 0.9) {
    quality = '!! (Brilliant)';
    className = 'text-green-600 font-bold';
  } else if (randomQuality > 0.7) {
    quality = '! (Good move)';
    className = 'text-green-500';
  } else if (randomQuality > 0.4) {
    quality = '⟳ (Normal)';
    className = 'text-gray-500';
  } else if (randomQuality > 0.2) {
    quality = '? (Inaccuracy)';
    className = 'text-yellow-500';
  } else {
    quality = '?? (Blunder)';
    className = 'text-red-500';
  }

  // Generate a suggested move based on the hash
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];
  
  const fromFile = files[hash % 8];
  const fromRank = ranks[(hash * 2) % 8];
  const toFile = files[(hash * 3) % 8];
  const toRank = ranks[(hash * 4) % 8];

  return {
    move,
    quality,
    className,
    suggestedMove: {
      from: `${fromFile}${fromRank}` as Square,
      to: `${toFile}${toRank}` as Square,
    }
  };
};