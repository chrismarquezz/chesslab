import express from "express";
import { analyzeGameWithEngine, evaluateFen } from "../services/stockfishService";

const router = express.Router();

router.post("/analyze", async (req, res) => {
  const { pgn, depth, samples } = req.body ?? {};
  if (!pgn || typeof pgn !== "string") {
    return res.status(400).json({ error: "pgn is required" });
  }

  try {
    const cappedDepth = typeof depth === "number" ? Math.min(Math.max(depth, 8), 25) : 14;
    const sampleCount = typeof samples === "number" ? Math.max(1, Math.min(10, samples)) : 5;
    const analysis = await analyzeGameWithEngine(pgn, sampleCount, cappedDepth);
    res.json(analysis);
  } catch (err: any) {
    console.error("❌ Review analysis failed:", err);
    if (err?.code === "ENOENT") {
      return res.status(500).json({
        error: "Stockfish engine not found on server. Install Stockfish and ensure it's on PATH or set STOCKFISH_PATH.",
      });
    }
    res.status(500).json({ error: err?.message || "Failed to analyze game" });
  }
});

router.post("/evaluate", async (req, res) => {
  const { fen, depth } = req.body ?? {};
  if (!fen || typeof fen !== "string") {
    return res.status(400).json({ error: "fen is required" });
  }

  try {
    const cappedDepth = typeof depth === "number" ? Math.min(Math.max(depth, 8), 25) : 14;
    const evaluation = await evaluateFen(fen, cappedDepth);
    res.json(evaluation);
  } catch (err: any) {
    console.error("❌ Move evaluation failed:", err);
    if (err?.code === "ENOENT") {
      return res.status(500).json({
        error: "Stockfish engine not found on server. Install Stockfish and ensure it's on PATH or set STOCKFISH_PATH.",
      });
    }
    res.status(500).json({ error: err?.message || "Failed to evaluate position" });
  }
});

export default router;
