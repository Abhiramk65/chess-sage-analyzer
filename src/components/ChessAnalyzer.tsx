import React, { useState, useCallback } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react';
import { useToast } from './ui/use-toast';

const ChessAnalyzer = () => {
  const [game, setGame] = useState(new Chess());
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [moves, setMoves] = useState<string[]>([]);
  const [pgn, setPgn] = useState('');
  const { toast } = useToast();

  const handlePgnUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const pgnContent = e.target?.result as string;
        const newGame = new Chess();
        newGame.loadPgn(pgnContent);
        setPgn(pgnContent);
        setGame(newGame);
        setMoves(newGame.history());
        setCurrentMoveIndex(0);
        toast({
          title: "PGN loaded successfully",
          description: "You can now analyze the game moves",
        });
      } catch (error) {
        toast({
          title: "Error loading PGN",
          description: "Please check if the file contains valid PGN notation",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  }, [toast]);

  const goToMove = useCallback((index: number) => {
    const newGame = new Chess();
    newGame.loadPgn(pgn);
    const history = newGame.history();
    
    for (let i = 0; i <= index; i++) {
      if (i < history.length) {
        newGame.move(history[i]);
      }
    }
    
    setGame(newGame);
    setCurrentMoveIndex(index);
  }, [pgn]);

  const analyzeMoveQuality = useCallback((move: string, index: number) => {
    // This is a simplified analysis. In a real application, you would use a chess engine
    // like Stockfish to analyze positions and determine move quality
    const moveNumber = Math.floor(index / 2) + 1;
    const isWhiteMove = index % 2 === 0;
    const moveNotation = `${moveNumber}${isWhiteMove ? '.' : '...'} ${move}`;
    
    // Simulated analysis (in a real app, this would come from an engine)
    const randomQuality = Math.random();
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

    return (
      <div 
        key={index} 
        className={`cursor-pointer p-2 hover:bg-gray-100 ${currentMoveIndex === index ? 'bg-gray-200' : ''} ${className}`}
        onClick={() => goToMove(index)}
      >
        {moveNotation} {quality}
      </div>
    );
  }, [currentMoveIndex, goToMove]);

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <div className="w-full max-w-[600px] mx-auto">
            <Chessboard 
              position={game.fen()} 
              boardWidth={600}
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