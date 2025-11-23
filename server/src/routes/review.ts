import express from "express";
import { analyzeGameWithEngine, evaluateFen, streamEvaluateFen } from "../services/stockfishService";
import { fetchBookMoves } from "../services/bookService";

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

router.get("/evaluate/stream", (req, res) => {
  const { fen, depth } = req.query;
  if (!fen || typeof fen !== "string") {
    return res.status(400).json({ error: "fen is required" });
  }
  const parsedDepth = typeof depth === "string" ? Number.parseInt(depth, 10) : NaN;
  const cappedDepth = Number.isFinite(parsedDepth) ? Math.min(Math.max(parsedDepth, 8), 24) : 18;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  (res as any).flushHeaders?.();

  const cleanup = streamEvaluateFen({
    fen,
    depth: cappedDepth,
    onUpdate: (evaluation) => {
      const payload = JSON.stringify({ evaluation });
      res.write(`data: ${payload}\n\n`);
    },
    onError: (error) => {
      const payload = JSON.stringify({ error: error.message || "Engine stream error" });
      res.write(`data: ${payload}\n\n`);
      res.end();
    },
    onComplete: () => {
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    },
  });

  req.on("close", () => {
    cleanup();
  });
});

router.get("/book", async (req, res) => {
  const { fen, moves } = req.query;
  if (!fen || typeof fen !== "string") {
    return res.status(400).json({ error: "fen is required" });
  }
  const parsedLimit = typeof moves === "string" ? Number.parseInt(moves, 10) : NaN;
  const moveLimit = Number.isFinite(parsedLimit) ? parsedLimit : 8;
  try {
    const result = await fetchBookMoves(fen, moveLimit);
    res.json(result);
  } catch (err: any) {
    console.error("❌ Book lookup failed:", err);
    res.status(500).json({ error: err?.message || "Failed to fetch book moves" });
  }
});

export default router;
