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

const evaluatePosition = (chess: Chess): number => {
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

  return score;
};

const generateLegalMoves = (chess: Chess): { from: Square; to: Square }[] => {
  try {
    const legalMoves = chess.moves({ verbose: true });
    
    // Sort moves by basic evaluation
    const sortedMoves = legalMoves.sort((a, b) => {
      const tempChess = new Chess(chess.fen());
      
      // Try first move
      tempChess.move(a);
      const evalA = evaluatePosition(tempChess);
      tempChess.undo();
      
      // Try second move
      tempChess.move(b);
      const evalB = evaluatePosition(tempChess);
      tempChess.undo();
      
      return evalB - evalA;
    });
    
    return sortedMoves.map(move => ({
      from: move.from as Square,
      to: move.to as Square
    }));
  } catch (error) {
    console.error('Error generating legal moves:', error);
    return [];
  }
};

const generateAlternateLines = (position: string, depth: number = 3): SuggestedLine[] => {
  try {
    const chess = new Chess(position);
    const lines: SuggestedLine[] = [];
    
    const legalMoves = chess.moves({ verbose: true });
    const sortedMoves = legalMoves.sort((a, b) => {
      const tempChess = new Chess(position);
      
      tempChess.move(a);
      const evalA = evaluatePosition(tempChess);
      tempChess.undo();
      
      tempChess.move(b);
      const evalB = evaluatePosition(tempChess);
      tempChess.undo();
      
      return evalB - evalA;
    });
    
    const topMoves = sortedMoves.slice(0, 2);
    
    for (const move of topMoves) {
      const line: string[] = [move.san];
      const tempChess = new Chess(position);
      tempChess.move(move);
      
      let currentEval = evaluatePosition(tempChess);
      
      for (let i = 0; i < depth - 1; i++) {
        const responses = tempChess.moves({ verbose: true });
        if (responses.length === 0) break;
        
        // Find the best response
        let bestMove = responses[0];
        let bestEval = -Infinity;
        
        for (const response of responses) {
          tempChess.move(response);
          const eval = evaluatePosition(tempChess);
          if (eval > bestEval) {
            bestEval = eval;
            bestMove = response;
          }
          tempChess.undo();
        }
        
        tempChess.move(bestMove);
        line.push(bestMove.san);
        currentEval = bestEval;
      }
      
      lines.push({
        moves: line,
        evaluation: currentEval
      });
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
    const moveHistory = move.split(' ');
    moveHistory.forEach(m => chess.move(m));
    
    const positionBeforeMove = chess.fen();
    chess.undo();
    
    const currentEval = evaluatePosition(chess);
    const legalMoves = generateLegalMoves(chess);
    const bestMove = legalMoves[0];
    
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

    return {
      move,
      quality,
      className,
      suggestedMove: quality !== 'Brilliant' && quality !== 'Good move' ? bestMove : undefined,
      alternateLines: quality !== 'Brilliant' && quality !== 'Good move' ? 
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