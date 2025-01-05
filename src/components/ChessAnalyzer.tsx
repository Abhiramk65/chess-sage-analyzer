import React, { useState, useCallback } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react';
import { useToast } from './ui/use-toast';
import { evaluateMove, MoveEvaluation } from '../utils/moveAnalysis';
import MoveList from './MoveList';
import { Arrow, Square } from 'react-chessboard/dist/chessboard/types';
import { fetchUserGames, ChessComGame } from '../utils/chessComApi';
import ChessComGames from './ChessComGames';

const ChessAnalyzer = () => {
  const [game, setGame] = useState(new Chess());
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [moves, setMoves] = useState<string[]>([]);
  const [moveEvaluations, setMoveEvaluations] = useState<MoveEvaluation[]>([]);
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [games, setGames] = useState<ChessComGame[]>([]);
  const [currentGameIndex, setCurrentGameIndex] = useState(0);

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
        const evaluations = moveHistory.map((move, index) => evaluateMove(move, index));
        
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

  const getCustomArrows = (): Arrow[] => {
    if (currentMoveIndex < 0 || currentMoveIndex >= moveEvaluations.length) return [];
    
    const evaluation = moveEvaluations[currentMoveIndex];
    if (!evaluation?.suggestedMove) return [];

    return [[
      evaluation.suggestedMove.from,
      evaluation.suggestedMove.to,
      'rgb(0, 255, 0)'
    ]];
  };

  const getSquareStyles = useCallback(() => {
    if (currentMoveIndex < 0 || currentMoveIndex >= moveEvaluations.length) return {};

    const evaluation = moveEvaluations[currentMoveIndex];
    const move = moves[currentMoveIndex];
    
    const targetSquare = move.replace(/[+#]?[!?]*$/, '').slice(-2).toLowerCase();
    
    let backgroundColor;
    if (evaluation.quality.includes('Brilliant')) {
      backgroundColor = 'rgba(34, 197, 94, 0.5)';
    } else if (evaluation.quality.includes('Good')) {
      backgroundColor = 'rgba(34, 197, 94, 0.3)';
    } else if (evaluation.quality.includes('Normal')) {
      backgroundColor = 'rgba(156, 163, 175, 0.3)';
    } else if (evaluation.quality.includes('Inaccuracy')) {
      backgroundColor = 'rgba(234, 179, 8, 0.3)';
    } else {
      backgroundColor = 'rgba(239, 68, 68, 0.3)';
    }

    return {
      [targetSquare]: { backgroundColor }
    };
  }, [currentMoveIndex, moveEvaluations, moves]);

  const goToMove = useCallback((index: number) => {
    try {
      const newGame = new Chess();
      if (index >= 0 && index < moves.length) {
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

  const loadGame = useCallback((pgn: string) => {
    try {
      const newGame = new Chess();
      newGame.loadPgn(pgn);
      const moveHistory = newGame.history();
      const evaluations = moveHistory.map((move, index) => evaluateMove(move, index));
      
      setGame(new Chess());
      setMoves(moveHistory);
      setMoveEvaluations(evaluations);
      setCurrentMoveIndex(0);
    } catch (error) {
      console.error('Error loading game:', error);
      toast({
        title: "Error loading game",
        description: "Failed to load the selected game",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleGameSelect = useCallback((index: number) => {
    if (index >= 0 && index < games.length) {
      setCurrentGameIndex(index);
      loadGame(games[index].pgn);
    }
  }, [games, loadGame]);

  const handleChessComSearch = async () => {
    if (!username.trim()) {
      toast({
        title: "Username required",
        description: "Please enter a chess.com username",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const fetchedGames = await fetchUserGames(username);
      setGames(fetchedGames);
      setCurrentGameIndex(0);
      
      if (fetchedGames.length > 0) {
        loadGame(fetchedGames[0].pgn);
        toast({
          title: "Games loaded successfully",
          description: `Found ${fetchedGames.length} games from chess.com`,
        });
      } else {
        toast({
          title: "No games found",
          description: "No recent games found for this username",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error fetching games",
        description: "Failed to fetch games from chess.com",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row justify-center items-start gap-8">
        <div className="w-full md:w-auto flex-shrink-0">
          <div className="max-w-[600px] mx-auto">
            <Chessboard 
              position={game.fen()} 
              boardWidth={600}
              customSquareStyles={getSquareStyles()}
              customArrows={getCustomArrows()}
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
        <div className="w-full md:w-80 space-y-4">
          <div>
            <h2 className="text-xl font-bold mb-2">Upload PGN</h2>
            <Input
              type="file"
              accept=".pgn"
              onChange={handlePgnUpload}
              className="w-full"
            />
          </div>
          <ChessComGames
            username={username}
            setUsername={setUsername}
            isLoading={isLoading}
            onSearch={handleChessComSearch}
            games={games}
            currentGameIndex={currentGameIndex}
            onGameSelect={handleGameSelect}
          />
          <div>
            <h2 className="text-xl font-bold mb-2">Move List</h2>
            <MoveList
              moves={moves}
              moveEvaluations={moveEvaluations}
              currentMoveIndex={currentMoveIndex}
              onMoveClick={goToMove}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChessAnalyzer;
