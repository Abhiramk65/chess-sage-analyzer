import { Square } from 'react-chessboard/dist/chessboard/types';
import { Chess } from 'chess.js';

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
}

const generateLegalMoves = (position: string, lastMove: string): { from: Square; to: Square }[] => {
  const chess = new Chess(position);
  const legalMoves = chess.moves({ verbose: true });
  
  // Sort moves by a basic evaluation to simulate "best" moves
  const sortedMoves = legalMoves.sort((a, b) => {
    const pieceValues: { [key: string]: number } = {
      p: 1, n: 3, b: 3, r: 5, q: 9, k: 0
    };
    
    const aValue = a.captured ? pieceValues[a.captured] || 0 : 0;
    const bValue = b.captured ? pieceValues[b.captured] || 0 : 0;
    
    return bValue - aValue;
  });
  
  // Return top 3 moves
  return sortedMoves.slice(0, 3).map(move => ({
    from: move.from as Square,
    to: move.to as Square
  }));
};

const generateAlternateLines = (position: string, depth: number = 3): SuggestedLine[] => {
  const chess = new Chess(position);
  const lines: SuggestedLine[] = [];
  
  const legalMoves = chess.moves({ verbose: true });
  const topMoves = legalMoves.slice(0, 2); // Get top 2 alternate moves
  
  for (const move of topMoves) {
    const line: string[] = [move.san];
    const tempChess = new Chess(position);
    tempChess.move(move);
    
    // Generate a few follow-up moves
    for (let i = 0; i < depth - 1; i++) {
      const responses = tempChess.moves({ verbose: true });
      if (responses.length === 0) break;
      
      const response = responses[Math.floor(Math.random() * responses.length)];
      tempChess.move(response);
      line.push(response.san);
    }
    
    lines.push({
      moves: line,
      evaluation: Math.random() * 2 - 1 // Simulated evaluation between -1 and 1
    });
  }
  
  return lines;
};

export const evaluateMove = (move: string, index: number, position?: string): MoveEvaluation => {
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

  let suggestedMoves: { from: Square; to: Square }[] = [];
  let alternateLines: SuggestedLine[] = [];
  
  if (position) {
    suggestedMoves = generateLegalMoves(position, move);
    alternateLines = generateAlternateLines(position);
  }

  return {
    move,
    quality,
    className,
    suggestedMove: suggestedMoves[0],
    alternateLines
  };
};