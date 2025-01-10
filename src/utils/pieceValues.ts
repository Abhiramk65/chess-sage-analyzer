export const getPieceValue = (piece: string): number => {
  const values: { [key: string]: number } = {
    p: 1, n: 3, b: 3, r: 5, q: 9, k: 0
  };
  return values[piece.toLowerCase()] || 0;
};