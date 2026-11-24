export function getExpandedRecommendationIndex(
  games: readonly { id: number }[],
  selectedGameId: number | null | undefined,
): number {
  if (selectedGameId === null || games.length === 0) return -1;

  const selectedIndex = games.findIndex((game) => game.id === selectedGameId);
  return Math.max(0, selectedIndex);
}
