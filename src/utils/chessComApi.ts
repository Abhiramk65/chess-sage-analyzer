export interface ChessComGame {
  url: string;
  pgn: string;
  time_control: string;
  end_time: number;
  rated: boolean;
  white: { username: string; rating: number };
  black: { username: string; rating: number };
}

export const fetchUserGames = async (username: string): Promise<ChessComGame[]> => {
  console.log('Fetching games for user:', username);
  const currentMonth = new Date().toISOString().slice(0, 7).replace('-', '/');
  
  try {
    const response = await fetch(`https://api.chess.com/pub/player/${username}/games/${currentMonth}`);
    if (!response.ok) {
      throw new Error('Failed to fetch games');
    }
    const data = await response.json();
    console.log('Fetched games:', data.games);
    return data.games;
  } catch (error) {
    console.error('Error fetching chess.com games:', error);
    throw error;
  }
};