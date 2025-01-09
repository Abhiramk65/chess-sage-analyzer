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
      // Get current timestamp in seconds (chess.com API uses seconds)
      const now = Math.floor(Date.now() / 1000);
      // Get timestamp for 24 hours ago
      const oneDayAgo = now - (24 * 60 * 60);
      
      // Filter games from last 24 hours and sort by most recent
      games = data.games
        .filter(game => game.end_time >= oneDayAgo)
        .sort((a, b) => b.end_time - a.end_time);
      
      console.log(`Fetched ${games.length} recent games from the last 24 hours`);
    }
    
    return games;
    
  } catch (error) {
    console.error('Error fetching chess.com games:', error);
    throw error;
  }
};