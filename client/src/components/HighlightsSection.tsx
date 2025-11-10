import { useEffect, useState } from "react";
import { useUser } from "../context/UserContext";

interface HighlightsSectionProps {
  username: string;
  selectedMode: "all" | "blitz" | "rapid" | "bullet";
}


export default function HighlightsSection({ username, selectedMode }: HighlightsSectionProps) {
  const { games, gamesLoading } = useUser();
  const [strongestOpponent, setStrongestOpponent] = useState<{ username: string; rating: number } | null>(null);
  const [longestStreak, setLongestStreak] = useState<number>(0);

  useEffect(() => {
    if (!username || selectedMode === "all") {
      setStrongestOpponent(null);
      setLongestStreak(0);
      return;
    }

    const modeGames = games.filter((g) => g.time_class === selectedMode);
    if (!modeGames.length) {
      setStrongestOpponent(null);
      setLongestStreak(0);
      return;
    }

    // --- Strongest Opponent Beaten ---
    let bestOpponent: { username: string; rating: number } | null = null;

    for (const game of modeGames) {
      const isWhite = game.white.username.toLowerCase() === username.toLowerCase();
      const opponent = isWhite ? game.black : game.white;

      const playerWon =
        (isWhite && game.white.result === "win") ||
        (!isWhite && game.black.result === "win");

      if (playerWon && (!bestOpponent || opponent.rating > bestOpponent.rating)) {
        bestOpponent = { username: opponent.username, rating: opponent.rating };
      }
    }
    setStrongestOpponent(bestOpponent);

    // --- Longest Win Streak ---
    let current = 0;
    let max = 0;
    for (const game of modeGames) {
      const isWhite = game.white.username.toLowerCase() === username.toLowerCase();
      const playerWon =
        (isWhite && game.white.result === "win") ||
        (!isWhite && game.black.result === "win");

      if (playerWon) {
        current++;
        if (current > max) max = current;
      } else {
        current = 0;
      }
    }
    setLongestStreak(max);
  }, [games, username, selectedMode]);

  const isLoading = gamesLoading && selectedMode !== "all";

  return (
    <section className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Strongest Opponent Card */}
      <div className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300 rounded-2xl p-6 border border-gray-200 text-center">
        <h3 className="text-2xl font-semibold text-gray-800 pb-2 border-b border-gray-200 mb-4">
          Strongest Opponent Beaten
        </h3>
        {isLoading ? (
          <p className="text-gray-500 animate-pulse">Loading...</p>
        ) : strongestOpponent ? (
          <>
            <p className="text-3xl font-bold text-[#00bfa6]">
              {strongestOpponent.rating}
            </p>
            <p className="text-gray-600 mt-1">
              vs <span className="font-medium">{strongestOpponent.username}</span>
            </p>
          </>
        ) : (
          <p className="text-gray-500">No wins found in {selectedMode}.</p>
        )}
      </div>

      {/* Longest Streak Card */}
      <div className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300 rounded-2xl p-6 border border-gray-200 text-center">
        <h3 className="text-2xl font-semibold text-gray-800 pb-2 border-b border-gray-200 mb-4">
          Longest Win Streak
        </h3>
        {isLoading ? (
          <p className="text-gray-500 animate-pulse">Loading...</p>
        ) : (
          <p className="text-3xl font-bold text-[#00bfa6]">
            {longestStreak || 0} wins
          </p>
        )}
      </div>
    </section>
  );
}
