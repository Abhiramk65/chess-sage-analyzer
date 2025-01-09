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

const generateLegalMoves = (position: string): { from: Square; to: Square }[] => {
  try {
    const chess = new Chess(position);
    const legalMoves = chess.moves({ verbose: true });
    
    // Sort moves by capturing potential and piece value
    const sortedMoves = legalMoves.sort((a, b) => {
      const pieceValues: { [key: string]: number } = {
        p: 1, n: 3, b: 3, r: 5, q: 9, k: 0
      };
      
      // Calculate move value based on piece captured and position
      const aValue = (a.captured ? pieceValues[a.captured] * 10 : 0) + 
                    (a.flags.includes('k') ? 3 : 0) + // castling bonus
                    (a.flags.includes('e') ? 2 : 0) + // en passant bonus
                    (a.flags.includes('p') ? 5 : 0);  // promotion bonus
      
      const bValue = (b.captured ? pieceValues[b.captured] * 10 : 0) +
                    (b.flags.includes('k') ? 3 : 0) +
                    (b.flags.includes('e') ? 2 : 0) +
                    (b.flags.includes('p') ? 5 : 0);
      
      return bValue - aValue;
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
    
    // Get all legal moves in the position
    const legalMoves = chess.moves({ verbose: true });
    
    // Sort moves by basic tactical evaluation
    const sortedMoves = legalMoves.sort((a, b) => {
      const pieceValues: { [key: string]: number } = {
        p: 1, n: 3, b: 3, r: 5, q: 9, k: 0
      };
      
      const aValue = (a.captured ? pieceValues[a.captured] * 10 : 0) +
                    (a.flags.includes('k') ? 3 : 0) +
                    (a.flags.includes('e') ? 2 : 0) +
                    (a.flags.includes('p') ? 5 : 0);
      
      const bValue = (b.captured ? pieceValues[b.captured] * 10 : 0) +
                    (b.flags.includes('k') ? 3 : 0) +
                    (b.flags.includes('e') ? 2 : 0) +
                    (b.flags.includes('p') ? 5 : 0);
      
      return bValue - aValue;
    });
    
    // Take top 2 moves for alternate lines
    const topMoves = sortedMoves.slice(0, 2);
    
    for (const move of topMoves) {
      const line: string[] = [move.san];
      const tempChess = new Chess(position);
      tempChess.move(move);
      
      // Generate follow-up moves
      for (let i = 0; i < depth - 1; i++) {
        const responses = tempChess.moves({ verbose: true });
        if (responses.length === 0) break;
        
        // Choose the best response based on basic evaluation
        const bestResponse = responses.sort((a, b) => {
          const pieceValues: { [key: string]: number } = {
            p: 1, n: 3, b: 3, r: 5, q: 9, k: 0
          };
          const aValue = a.captured ? pieceValues[a.captured] : 0;
          const bValue = b.captured ? pieceValues[b.captured] : 0;
          return bValue - aValue;
        })[0];
        
        tempChess.move(bestResponse);
        line.push(bestResponse.san);
      }
      
      // Calculate basic position evaluation
      const evaluation = calculateBasicEvaluation(tempChess);
      
      lines.push({
        moves: line,
        evaluation: evaluation
      });
    }
    
    return lines;
  } catch (error) {
    console.error('Error generating alternate lines:', error);
    return [];
  }
};

const calculateBasicEvaluation = (chess: Chess): number => {
  const fen = chess.fen();
  const position = fen.split(' ')[0];
  const pieces = position.split('');
  
  const pieceValues: { [key: string]: number } = {
    'p': -1, 'n': -3, 'b': -3, 'r': -5, 'q': -9,
    'P': 1, 'N': 3, 'B': 3, 'R': 5, 'Q': 9
  };
  
  let evaluation = 0;
  pieces.forEach(piece => {
    if (piece in pieceValues) {
      evaluation += pieceValues[piece];
    }
  });
  
  return evaluation;
};

export const evaluateMove = (move: string, index: number): MoveEvaluation => {
  try {
    const chess = new Chess();
    const moves = chess.history({ verbose: true });
    let evaluation = 0;
    
    if (index < moves.length) {
      // Play up to the position before the move
      for (let i = 0; i < index; i++) {
        chess.move(moves[i]);
      }
      
      const beforeEval = calculateBasicEvaluation(chess);
      chess.move(moves[index]);
      const afterEval = calculateBasicEvaluation(chess);
      
      // Calculate evaluation change
      evaluation = afterEval - beforeEval;
    }
    
    // Determine move quality based on evaluation
    let quality = '';
    let className = '';
    
    if (evaluation > 2) {
      quality = 'Brilliant';
      className = 'text-green-600 font-bold';
    } else if (evaluation > 0.5) {
      quality = 'Good move';
      className = 'text-green-500';
    } else if (evaluation > -0.5) {
      quality = 'Normal';
      className = 'text-gray-500';
    } else if (evaluation > -2) {
      quality = 'Inaccuracy';
      className = 'text-yellow-500';
    } else {
      quality = 'Blunder';
      className = 'text-red-500';
    }
    
    // Generate suggested moves and alternate lines for non-optimal moves
    const suggestedMove = quality !== 'Brilliant' && quality !== 'Good move'
      ? generateLegalMoves(chess.fen())[0]
      : undefined;
    
    const alternateLines = quality !== 'Brilliant' && quality !== 'Good move'
      ? generateAlternateLines(chess.fen())
      : undefined;
    
    return {
      move,
      quality,
      className,
      suggestedMove,
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