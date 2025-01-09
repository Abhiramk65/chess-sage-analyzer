export interface ChessComGame {
  url: string;
  pgn: string;
  time_control: string;
  end_time: number;
  rated: boolean;
  white: { username: string; rating: number };
  black: { username: string; rating: number };
}

const getCurrentMonth = (): string => {
  const now = new Date();
  // Get current month in YYYY/MM format
  const currentMonth = now.toISOString().slice(0, 7).replace('-', '/');
  return currentMonth;
};

export const fetchUserGames = async (username: string): Promise<ChessComGame[]> => {
  console.log('Fetching games for user:', username);
  const currentMonth = getCurrentMonth();
  
  try {
    console.log(`Fetching games for current month: ${currentMonth}`);
    const response = await fetch(`https://api.chess.com/pub/player/${username}/games/${currentMonth}`);
    
    if (!response.ok) {
      console.error(`Failed to fetch games for ${currentMonth}`);
      throw new Error('Failed to fetch games');
    }
    
    const data = await response.json();
    let games: ChessComGame[] = [];
    
    if (data.games && Array.isArray(data.games)) {
      // Sort games by end_time in descending order (most recent first)
      games = data.games
        .sort((a, b) => b.end_time - a.end_time)
        .slice(0, 20); // Take only the 20 most recent games
      
      console.log(`Fetched ${games.length} most recent games`);
    }
    
    return games;
    
  } catch (error) {
    console.error('Error fetching chess.com games:', error);
    throw error;
  }
};