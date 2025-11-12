export function computeRatingDeltas(games: any[], username: string) {
  const deltaMap = new Map<any, number | null>();
  const normalizedUsername = username?.toLowerCase?.() ?? "";

  const grouped = games.reduce<Record<string, any[]>>((acc, game) => {
    const key = game.time_class ?? "unknown";
    if (!acc[key]) acc[key] = [];
    acc[key].push(game);
    return acc;
  }, {});

  for (const modeGames of Object.values(grouped)) {
    const chronological = [...modeGames].sort(
      (a, b) => (a.end_time ?? 0) - (b.end_time ?? 0)
    );

    let prevRating: number | null = null;

    for (const game of chronological) {
      if (!game.rated) {
        deltaMap.set(game, null);
        continue;
      }

      const isWhite = game.white?.username?.toLowerCase() === normalizedUsername;
      const me = isWhite ? game.white : game.black;
      const currentRating = typeof me?.rating === "number" ? me.rating : null;

      if (currentRating === null || prevRating === null) {
        deltaMap.set(game, null);
      } else {
        deltaMap.set(game, currentRating - prevRating);
      }

      if (currentRating !== null) {
        prevRating = currentRating;
      }
    }
  }

  return deltaMap;
}
