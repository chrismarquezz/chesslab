import { useState } from "react";
import { getProfile, getStats } from "./api/chessAPI";

export default function App() {
  const [username, setUsername] = useState("");
  const [profile, setProfile] = useState<any | null>(null);
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFetchAll() {
    if (!username.trim()) return;
    setLoading(true);
    setError(null);
    setProfile(null);
    setStats(null);

    try {
      const [profileData, statsData] = await Promise.all([
        getProfile(username),
        getStats(username),
      ]);
      setProfile(profileData);
      setStats(statsData);
    } catch (err) {
      console.error(err);
      setError("Could not fetch data.");
    } finally {
      setLoading(false);
    }
  }

  const avgRating =
    stats &&
    Math.round(
      (stats.chess_rapid?.last?.rating +
        stats.chess_blitz?.last?.rating +
        stats.chess_bullet?.last?.rating) /
        3
    );

  const bestMode = stats
    ? Object.entries({
        Rapid: stats.chess_rapid?.last?.rating || 0,
        Blitz: stats.chess_blitz?.last?.rating || 0,
        Bullet: stats.chess_bullet?.last?.rating || 0,
      }).sort((a, b) => b[1] - a[1])[0][0]
    : null;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col items-center px-6 py-12">
      {/* Header */}
      <header className="w-full max-w-5xl text-center mb-10">
        <h1 className="text-5xl font-extrabold text-[#00bfa6]">♟️ Chesslytics</h1>
        <p className="text-gray-500 mt-2 text-lg">
          Track performance, analyze stats, and visualize progress
        </p>
      </header>

      {/* Input */}
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-10">
        <input
          type="text"
          placeholder="Enter Chess.com username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="px-4 py-2 w-72 rounded-md border border-gray-300 text-gray-800 text-lg focus:outline-none focus:ring-2 focus:ring-[#00bfa6]"
        />
        <button
          onClick={handleFetchAll}
          className="bg-[#00bfa6] text-white font-semibold px-6 py-2 rounded-md hover:bg-[#00d6b5] transition"
        >
          Fetch Analytics
        </button>
      </div>

      {loading && <p className="text-gray-500 animate-pulse">Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {/* Dashboard */}
      {profile && stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full max-w-5xl">
          {/* Ratings Overview */}
          <section className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
            <h2 className="text-2xl font-semibold text-[#00bfa6] mb-4">🎯 Ratings Overview</h2>
            <ul className="space-y-2 text-lg">
              <li>
                Rapid:{" "}
                <span className="font-mono font-semibold">
                  {stats.chess_rapid?.last?.rating ?? "N/A"}
                </span>
              </li>
              <li>
                Blitz:{" "}
                <span className="font-mono font-semibold">
                  {stats.chess_blitz?.last?.rating ?? "N/A"}
                </span>
              </li>
              <li>
                Bullet:{" "}
                <span className="font-mono font-semibold">
                  {stats.chess_bullet?.last?.rating ?? "N/A"}
                </span>
              </li>
              <li>
                Puzzles:{" "}
                <span className="font-mono font-semibold">
                  {stats.tactics?.highest?.rating ?? "N/A"}
                </span>
              </li>
            </ul>
          </section>

          {/* Performance Summary */}
          <section className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
            <h2 className="text-2xl font-semibold text-[#00bfa6] mb-4">📈 Performance Insights</h2>
            <ul className="space-y-2 text-lg">
              <li>
                Average Rating:{" "}
                <span className="font-mono font-semibold">{avgRating || "N/A"}</span>
              </li>
              <li>
                Best Mode:{" "}
                <span className="font-semibold text-[#00bfa6]">{bestMode || "N/A"}</span>
              </li>
              <li>
                Games Played (Blitz):{" "}
                <span className="font-mono">
                  {stats.chess_blitz?.record?.win +
                    stats.chess_blitz?.record?.loss +
                    stats.chess_blitz?.record?.draw || "N/A"}
                </span>
              </li>
              <li>
                Win Rate (Blitz):{" "}
                <span className="font-mono">
                  {stats.chess_blitz?.record
                    ? Math.round(
                        (stats.chess_blitz.record.win /
                          (stats.chess_blitz.record.win +
                            stats.chess_blitz.record.loss +
                            stats.chess_blitz.record.draw)) *
                          100
                      ) + "%"
                    : "N/A"}
                </span>
              </li>
            </ul>
          </section>

          {/* Recent Games (placeholder for now) */}
          <section className="bg-white rounded-2xl shadow-md p-6 border border-gray-200">
            <h2 className="text-2xl font-semibold text-[#00bfa6] mb-4">♟️ Recent Games</h2>
            <p className="text-gray-500 italic">
              Coming soon — we’ll pull the player’s latest games and show their results.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
