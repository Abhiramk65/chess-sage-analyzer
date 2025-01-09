export interface ChessComGame {
  url: string;
  pgn: string;
  time_control: string;
  end_time: number;
  rated: boolean;
  white: { username: string; rating: number };
  black: { username: string; rating: number };
}

const getMonthsToFetch = (count: number = 3): string[] => {
  const months: string[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStr = date.toISOString().slice(0, 7).replace('-', '/');
    months.push(monthStr);
  }
  
  return months;
};

export const fetchUserGames = async (username: string): Promise<ChessComGame[]> => {
  console.log('Fetching games for user:', username);
  const months = getMonthsToFetch();
  const allGames: ChessComGame[] = [];
  
  try {
    for (const month of months) {
      console.log(`Fetching games for month: ${month}`);
      const response = await fetch(`https://api.chess.com/pub/player/${username}/games/${month}`);
      
      if (!response.ok) {
        console.warn(`Failed to fetch games for ${month}`);
        continue; // Skip failed months but continue with others
      }
      
      const data = await response.json();
      if (data.games && Array.isArray(data.games)) {
        allGames.push(...data.games);
      }
    }
    
    // Sort games by end_time in descending order (most recent first)
    allGames.sort((a, b) => b.end_time - a.end_time);
    
    // Limit to 50 most recent games to prevent performance issues
    const recentGames = allGames.slice(0, 50);
    
    console.log(`Fetched ${recentGames.length} recent games`);
    return recentGames;
    
  } catch (error) {
    console.error('Error fetching chess.com games:', error);
    throw error;
  }
};