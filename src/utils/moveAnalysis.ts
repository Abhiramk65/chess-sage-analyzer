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
  evaluation?: number;
}

const getPieceValue = (piece: string): number => {
  const values: { [key: string]: number } = {
    p: 1, n: 3, b: 3, r: 5, q: 9, k: 0
  };
  return values[piece.toLowerCase()] || 0;
};

const generateLegalMoves = (position: string): { from: Square; to: Square; score: number }[] => {
  try {
    const chess = new Chess(position);
    const legalMoves = chess.moves({ verbose: true });
    
    return legalMoves.map(move => {
      const tempChess = new Chess(position);
      tempChess.move(move);
      
      // Calculate material balance after the move
      let score = 0;
      if (move.captured) {
        score += getPieceValue(move.captured);
      }
      
      // Bonus for checks
      if (tempChess.isCheck()) {
        score += 0.5;
      }
      
      // Bonus for center control (e4, d4, e5, d5)
      const centerSquares = ['e4', 'd4', 'e5', 'd5'];
      if (centerSquares.includes(move.to)) {
        score += 0.3;
      }
      
      return {
        from: move.from as Square,
        to: move.to as Square,
        score
      };
    }).sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error('Error generating legal moves:', error);
    return [];
  }
};

const generateAlternateLines = (position: string, depth: number = 3): SuggestedLine[] => {
  try {
    const chess = new Chess(position);
    const lines: SuggestedLine[] = [];
    const bestMoves = generateLegalMoves(position);
    
    // Take top 2 moves by score
    const topMoves = bestMoves.slice(0, 2);
    
    for (const move of topMoves) {
      const line: string[] = [];
      const tempChess = new Chess(position);
      
      // Make the initial move
      const moveObj = tempChess.move({
        from: move.from,
        to: move.to,
        promotion: 'q' // Always promote to queen for simplicity
      });
      
      if (moveObj) {
        line.push(moveObj.san);
        
        // Generate follow-up moves
        for (let i = 0; i < depth - 1; i++) {
          const responses = generateLegalMoves(tempChess.fen());
          if (responses.length === 0) break;
          
          const bestResponse = responses[0]; // Take the highest scored move
          const responseObj = tempChess.move({
            from: bestResponse.from,
            to: bestResponse.to,
            promotion: 'q'
          });
          
          if (responseObj) {
            line.push(responseObj.san);
          }
        }
        
        lines.push({
          moves: line,
          evaluation: move.score
        });
      }
    }
    
    return lines;
  } catch (error) {
    console.error('Error generating alternate lines:', error);
    return [];
  }
};

export const evaluateMove = (move: string, index: number): MoveEvaluation => {
  try {
    const chess = new Chess();
    const moveObj = chess.move(move);
    
    if (!moveObj) {
      throw new Error('Invalid move');
    }
    
    // Generate best moves for the position before this move
    const bestMoves = generateLegalMoves(chess.fen());
    const currentMoveScore = bestMoves.find(
      m => m.from === moveObj.from && m.to === moveObj.to
    )?.score || 0;
    
    // Compare with the best available move
    const bestScore = bestMoves[0]?.score || 0;
    const scoreDiff = bestScore - currentMoveScore;
    
    let quality: string;
    let className: string;
    let evaluation = currentMoveScore;
    
    if (scoreDiff <= 0.1) {
      quality = 'Brilliant';
      className = 'text-green-600 font-bold';
    } else if (scoreDiff <= 0.3) {
      quality = 'Good move';
      className = 'text-green-500';
    } else if (scoreDiff <= 0.7) {
      quality = 'Normal';
      className = 'text-gray-500';
    } else if (scoreDiff <= 1.5) {
      quality = 'Inaccuracy';
      className = 'text-yellow-500';
    } else {
      quality = scoreDiff > 3 ? 'Blunder' : 'Mistake';
      className = 'text-red-500';
    }

    // Only provide suggested moves and alternate lines for suboptimal moves
    const suggestedMove = scoreDiff > 0.3 ? bestMoves[0] : undefined;
    const alternateLines = scoreDiff > 0.3 ? generateAlternateLines(chess.fen()) : undefined;

    return {
      move,
      quality,
      className,
      suggestedMove: suggestedMove ? {
        from: suggestedMove.from,
        to: suggestedMove.to
      } : undefined,
      alternateLines,
      evaluation
    };
  } catch (error) {
    console.error('Error evaluating move:', error);
    return {
      move,
      quality: 'Normal',
      className: 'text-gray-500'
    };
  }
};