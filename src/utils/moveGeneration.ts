import { Chess } from 'chess.js';
import { Square } from 'react-chessboard/dist/chessboard/types';
import { evaluatePosition } from './positionEvaluation';

export const generateBestMoves = (chess: Chess): { from: Square; to: Square }[] => {
  try {
    const legalMoves = chess.moves({ verbose: true });
    const currentPosition = chess.fen();
    const isWhite = chess.turn() === 'w';
    
    const movesWithEval = legalMoves.map(move => {
      const tempChess = new Chess(currentPosition);
      tempChess.move(move);
      
      // Calculate immediate position score
      const immediateScore = evaluatePosition(tempChess);
      
      // Look ahead for opponent's best response
      const responses = tempChess.moves({ verbose: true });
      let bestResponseScore = immediateScore;
      
      for (const response of responses) {
        tempChess.move(response);
        const responseScore = evaluatePosition(tempChess);
        if (isWhite && responseScore < bestResponseScore) {
          bestResponseScore = responseScore;
        }
        if (!isWhite && responseScore > bestResponseScore) {
          bestResponseScore = responseScore;
        }
        tempChess.undo();
      }
      
      return {
        move,
        evaluation: bestResponseScore
      };
    });

    // Sort moves based on evaluation
    const sortedMoves = movesWithEval.sort((a, b) => 
      isWhite ? b.evaluation - a.evaluation : a.evaluation - b.evaluation
    );
    
    return sortedMoves.map(({ move }) => ({
      from: move.from as Square,
      to: move.to as Square
    }));
  } catch (error) {
    console.error('Error generating best moves:', error);
    return [];
  }
};

export const generateAlternateLines = (position: string, depth: number = 3) => {
  try {
    const chess = new Chess(position);
    const isWhite = chess.turn() === 'w';
    const legalMoves = chess.moves({ verbose: true });
    
    const movesWithEval = legalMoves.map(move => {
      const tempChess = new Chess(position);
      tempChess.move(move);
      
      // Calculate position score after the move
      let positionScore = evaluatePosition(tempChess);
      
      // Look ahead for best response
      const responses = tempChess.moves({ verbose: true });
      if (responses.length > 0) {
        let bestResponseScore = isWhite ? Infinity : -Infinity;
        
        for (const response of responses) {
          tempChess.move(response);
          const score = evaluatePosition(tempChess);
          if (isWhite && score < bestResponseScore) bestResponseScore = score;
          if (!isWhite && score > bestResponseScore) bestResponseScore = score;
          tempChess.undo();
        }
        
        positionScore = bestResponseScore;
      }
      
      return { move, evaluation: positionScore };
    });

    const sortedMoves = movesWithEval.sort((a, b) => 
      isWhite ? b.evaluation - a.evaluation : a.evaluation - b.evaluation
    );
    
    return sortedMoves.slice(0, 2).map(({ move }) => {
      const line = [move.san];
      const tempChess = new Chess(position);
      tempChess.move(move);
      let currentEval = evaluatePosition(tempChess);
      
      // Generate continuation moves
      for (let i = 0; i < depth - 1 && tempChess.moves().length > 0; i++) {
        const bestMove = findBestMove(tempChess);
        if (!bestMove) break;
        
        tempChess.move(bestMove);
        line.push(bestMove.san);
        currentEval = evaluatePosition(tempChess);
      }
      
      return {
        moves: line,
        evaluation: currentEval
      };
    });
  } catch (error) {
    console.error('Error generating alternate lines:', error);
    return [];
  }
};

const findBestMove = (chess: Chess) => {
  const moves = chess.moves({ verbose: true });
  const isWhite = chess.turn() === 'w';
  let bestMove = null;
  let bestEval = isWhite ? -Infinity : Infinity;
  
  for (const move of moves) {
    chess.move(move);
    const positionScore = evaluatePosition(chess);
    
    if (isWhite ? positionScore > bestEval : positionScore < bestEval) {
      bestEval = positionScore;
      bestMove = move;
    }
    
    chess.undo();
  }
  
  return bestMove;
};