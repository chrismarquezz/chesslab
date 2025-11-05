// src/utils/result.ts
export type UserOutcome = "win" | "loss" | "draw";

const DRAW_RESULTS = new Set([
  "draw",            // generic
  "agreed",          // agreed draw
  "repetition",
  "stalemate",
  "insufficient",
  "timevsinsufficient",
  "50move",
  "threecheck",      // appears in some variants
]);

const LOSS_RESULTS = new Set([
  "checkmated",
  "resigned",
  "timeout",
  "lose",
  "abandoned",
  "stalling",
  "rulesinfraction",
]);

export function getUserOutcome(game: any, username: string): UserOutcome {
  const isWhite = game.white?.username?.toLowerCase() === username.toLowerCase();
  const me = isWhite ? game.white : game.black;
  const opp = isWhite ? game.black : game.white;

  const myRes = (me?.result ?? "").toLowerCase();
  const oppRes = (opp?.result ?? "").toLowerCase();

  // Most reliable first: an explicit win
  if (myRes === "win") return "win";

  // If opponent has "win", I lost
  if (oppRes === "win") return "loss";

  // Known draw outcomes (either side may carry the draw marker)
  if (DRAW_RESULTS.has(myRes) || DRAW_RESULTS.has(oppRes)) return "draw";

  // Known loss outcomes on my side
  if (LOSS_RESULTS.has(myRes)) return "loss";

  // Fallbacks:
  // If opponent's outcome implies I lost (their result often 'win' already caught)
  if (LOSS_RESULTS.has(oppRes)) return "win"; // e.g., opp resigned

  // Default to draw if it's something unusual
  return "draw";
}
