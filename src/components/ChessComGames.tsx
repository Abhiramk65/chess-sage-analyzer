import React from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { SearchIcon } from 'lucide-react';
import { ChessComGame } from '../utils/chessComApi';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface ChessComGamesProps {
  username: string;
  setUsername: (username: string) => void;
  isLoading: boolean;
  onSearch: () => void;
  games: ChessComGame[];
  currentGameIndex: number;
  onGameSelect: (index: number) => void;
}

const ChessComGames: React.FC<ChessComGamesProps> = ({
  username,
  setUsername,
  isLoading,
  onSearch,
  games,
  currentGameIndex,
  onGameSelect,
}) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold mb-2">Import from chess.com</h2>
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Enter chess.com username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="flex-1"
        />
        <Button onClick={onSearch} disabled={isLoading}>
          {isLoading ? (
            "Loading..."
          ) : (
            <>
              <SearchIcon className="mr-2 h-4 w-4" />
              Search
            </>
          )}
        </Button>
      </div>
      
      {games.length > 0 && (
        <div className="space-y-4">
          <div className="text-sm text-gray-500">
            Showing game {currentGameIndex + 1} of {games.length}
          </div>
          <div className="space-y-2">
            <div className="text-sm">
              <strong>White:</strong> {games[currentGameIndex].white.username} ({games[currentGameIndex].white.rating})
            </div>
            <div className="text-sm">
              <strong>Black:</strong> {games[currentGameIndex].black.username} ({games[currentGameIndex].black.rating})
            </div>
          </div>
          <Pagination>
            <PaginationContent className="flex items-center gap-1">
              <PaginationItem>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => onGameSelect(currentGameIndex - 1)}
                  disabled={currentGameIndex === 0}
                >
                  <PaginationPrevious className="h-4 w-4" />
                </Button>
              </PaginationItem>
              <div className="flex items-center gap-1">
                {games.map((_, index) => (
                  <PaginationItem key={index}>
                    <Button
                      variant={currentGameIndex === index ? "default" : "outline"}
                      size="icon"
                      className="w-8 h-8"
                      onClick={() => onGameSelect(index)}
                    >
                      {index + 1}
                    </Button>
                  </PaginationItem>
                ))}
              </div>
              <PaginationItem>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => onGameSelect(currentGameIndex + 1)}
                  disabled={currentGameIndex === games.length - 1}
                >
                  <PaginationNext className="h-4 w-4" />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default ChessComGames;