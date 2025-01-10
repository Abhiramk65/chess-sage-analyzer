import { Chess } from 'chess.js';
import { Square } from 'react-chessboard/dist/chessboard/types';
import { evaluatePosition } from './positionEvaluation';

export const generateBestMoves = (chess: Chess): { from: Square; to: Square }[] => {
  try {
    const legalMoves = chess.moves({ verbose: true });
    const currentPosition = chess.fen();
    const isWhite = chess.turn() === 'w';
    
    // Evaluate each move with deeper search
    const movesWithEval = legalMoves.map(move => {
      const tempChess = new Chess(currentPosition);
      tempChess.move(move);
      
      // Look ahead one more move to better evaluate the position
      let bestResponseScore = isWhite ? Infinity : -Infinity;
      const responses = tempChess.moves({ verbose: true });
      
      for (const response of responses) {
        tempChess.move(response);
        const score = evaluatePosition(tempChess);
        if (isWhite && score < bestResponseScore) bestResponseScore = score;
        if (!isWhite && score > bestResponseScore) bestResponseScore = score;
        tempChess.undo();
      }
      
      return { 
        move, 
        evaluation: isWhite ? -bestResponseScore : bestResponseScore 
      };
    });

    // Sort moves considering the current player's perspective
    const sortedMoves = movesWithEval.sort((a, b) => {
      return isWhite ? b.evaluation - a.evaluation : a.evaluation - b.evaluation;
    });
    
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
    
    // Evaluate moves with deeper search for alternate lines
    const movesWithEval = legalMoves.map(move => {
      const tempChess = new Chess(position);
      tempChess.move(move);
      let evaluation = evaluatePosition(tempChess);
      
      // Look ahead one more move
      const responses = tempChess.moves({ verbose: true });
      if (responses.length > 0) {
        const bestResponse = findBestMove(tempChess);
        if (bestResponse) {
          tempChess.move(bestResponse);
          evaluation = isWhite ? -evaluatePosition(tempChess) : evaluatePosition(tempChess);
        }
      }
      
      return { move, evaluation };
    });

    const sortedMoves = movesWithEval.sort((a, b) => 
      isWhite ? b.evaluation - a.evaluation : a.evaluation - b.evaluation
    );
    
    return sortedMoves.slice(0, 2).map(({ move }) => {
      const line = [move.san];
      const tempChess = new Chess(position);
      tempChess.move(move);
      let currentEval = evaluatePosition(tempChess);
      
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
    const positionEval = evaluatePosition(chess);
    
    if (isWhite ? positionEval > bestEval : positionEval < bestEval) {
      bestEval = positionEval;
      bestMove = move;
    }
    
    chess.undo();
  }
  
  return bestMove;
};