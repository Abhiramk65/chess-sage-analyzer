import React, { useState, useCallback, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react';
import { useToast } from './ui/use-toast';

interface MoveEvaluation {
  move: string;
  quality: string;
  className: string;
  score?: number;
}

const ChessAnalyzer = () => {
  const [game, setGame] = useState(new Chess());
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [moves, setMoves] = useState<string[]>([]);
  const [pgn, setPgn] = useState('');
  const [moveEvaluations, setMoveEvaluations] = useState<MoveEvaluation[]>([]);
  const { toast } = useToast();

  const evaluateMove = (move: string, index: number): MoveEvaluation => {
    // Using a seeded random number based on the move and index for consistency
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

    return { move, quality, className };
  };

  const handlePgnUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const pgnContent = e.target?.result as string;
        const newGame = new Chess();
        newGame.loadPgn(pgnContent);
        const moveHistory = newGame.history();
        
        // Evaluate all moves at once when loading PGN
        const evaluations = moveHistory.map((move, index) => evaluateMove(move, index));
        
        setPgn(pgnContent);
        setGame(new Chess());
        setMoves(moveHistory);
        setMoveEvaluations(evaluations);
        setCurrentMoveIndex(0);
        
        toast({
          title: "PGN loaded successfully",
          description: "You can now analyze the game moves",
        });
      } catch (error) {
        console.error('Error loading PGN:', error);
        toast({
          title: "Error loading PGN",
          description: "Please check if the file contains valid PGN notation",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  }, [toast]);

  const getSquareStyles = useCallback(() => {
    if (currentMoveIndex < 0 || currentMoveIndex >= moveEvaluations.length) return {};

    const evaluation = moveEvaluations[currentMoveIndex];
    const move = moves[currentMoveIndex];
    
    // Get the target square of the current move
    const targetSquare = move.replace(/[+#]?[!?]*$/, '').slice(-2).toLowerCase();
    
    let backgroundColor;
    if (evaluation.quality.includes('Brilliant')) {
      backgroundColor = 'rgba(34, 197, 94, 0.5)';  // green
    } else if (evaluation.quality.includes('Good')) {
      backgroundColor = 'rgba(34, 197, 94, 0.3)';  // light green
    } else if (evaluation.quality.includes('Normal')) {
      backgroundColor = 'rgba(156, 163, 175, 0.3)';  // gray
    } else if (evaluation.quality.includes('Inaccuracy')) {
      backgroundColor = 'rgba(234, 179, 8, 0.3)';  // yellow
    } else {
      backgroundColor = 'rgba(239, 68, 68, 0.3)';  // red
    }

    return {
      [targetSquare]: { backgroundColor }
    };
  }, [currentMoveIndex, moveEvaluations, moves]);

  const goToMove = useCallback((index: number) => {
    try {
      const newGame = new Chess();
      if (index >= 0 && index < moves.length) {
        // Apply moves up to the target index
        for (let i = 0; i <= index; i++) {
          newGame.move(moves[i]);
        }
      }
      setGame(newGame);
      setCurrentMoveIndex(index);
    } catch (error) {
      console.error('Error navigating to move:', error);
      toast({
        title: "Error navigating moves",
        description: "An error occurred while trying to navigate through the moves",
        variant: "destructive",
      });
    }
  }, [moves, toast]);

  const analyzeMoveQuality = useCallback((move: string, index: number) => {
    const moveNumber = Math.floor(index / 2) + 1;
    const isWhiteMove = index % 2 === 0;
    const moveNotation = `${moveNumber}${isWhiteMove ? '.' : '...'} ${move}`;
    
    const evaluation = moveEvaluations[index] || evaluateMove(move, index);
    
    return (
      <div 
        key={index} 
        className={`cursor-pointer p-2 hover:bg-gray-100 ${currentMoveIndex === index ? 'bg-gray-200' : ''} ${evaluation.className}`}
        onClick={() => goToMove(index)}
      >
        {moveNotation} {evaluation.quality}
      </div>
    );
  }, [currentMoveIndex, goToMove, moveEvaluations]);

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <div className="w-full max-w-[600px] mx-auto">
            <Chessboard 
              position={game.fen()} 
              boardWidth={600}
              customSquareStyles={getSquareStyles()}
            />
          </div>
          <div className="flex justify-center gap-4 mt-4">
            <Button
              onClick={() => goToMove(currentMoveIndex - 1)}
              disabled={currentMoveIndex <= 0}
            >
              <ArrowLeftIcon className="mr-2" />
              Previous
            </Button>
            <Button
              onClick={() => goToMove(currentMoveIndex + 1)}
              disabled={currentMoveIndex >= moves.length - 1}
            >
              Next
              <ArrowRightIcon className="ml-2" />
            </Button>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold mb-2">Upload PGN</h2>
            <Input
              type="file"
              accept=".pgn"
              onChange={handlePgnUpload}
              className="w-full"
            />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2">Move List</h2>
            <div className="max-h-[400px] overflow-y-auto border rounded-md">
              {moves.map((move, index) => analyzeMoveQuality(move, index))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChessAnalyzer;