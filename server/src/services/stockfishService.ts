import { spawn } from "child_process";
import { Chess } from "chess.js";

const ENGINE_PATH = process.env.STOCKFISH_PATH || "stockfish";
const ANALYSIS_TIMEOUT_MS = Number(process.env.STOCKFISH_TIMEOUT_MS ?? 15000);

export interface EngineScore {
  type: "cp" | "mate";
  value: number;
}

export interface EngineEvaluation {
  bestMove: string;
  score: EngineScore | null;
  depth: number;
  pv: string[];
  raw: string[];
}

export interface MoveSnapshot {
  ply: number;
  moveNumber: number;
  san: string;
  color: "white" | "black";
  fen: string;
}

export interface GameAnalysis {
  summary: {
    totalMoves: number;
    sampled: number;
    depth: number;
  };
  timeline: MoveSnapshot[];
  samples: Array<MoveSnapshot & { evaluation: EngineEvaluation | null; error?: string }>;
}

export async function analyzeGameWithEngine(pgn: string, sampleCount = 5, depth = 14): Promise<GameAnalysis> {
  const chess = new Chess();
  try {
    chess.loadPgn(pgn);
  } catch {
    throw new Error("Invalid PGN supplied");
  }

  const timeline: MoveSnapshot[] = [];
  const verboseMoves = chess.history({ verbose: true });

  chess.reset();
  verboseMoves.forEach((move, index) => {
    chess.move(move);
    timeline.push({
      ply: index + 1,
      moveNumber: Math.floor(index / 2) + 1,
      san: move.san,
      color: move.color === "w" ? "white" : "black",
      fen: chess.fen(),
    });
  });

  const samples = timeline.slice(-Math.min(sampleCount, timeline.length));
  const annotated = [];
  for (const snapshot of samples) {
    try {
      const evaluation = await evaluateFen(snapshot.fen, depth);
      annotated.push({ ...snapshot, evaluation });
    } catch (err) {
      const message = (err as Error).message || "Engine error";
      annotated.push({ ...snapshot, evaluation: null, error: message });
      break;
    }
  }

  return {
    summary: {
      totalMoves: timeline.length,
      sampled: annotated.length,
      depth,
    },
    timeline,
    samples: annotated,
  };
}

export function evaluateFen(fen: string, depth = 14): Promise<EngineEvaluation> {
  return new Promise((resolve, reject) => {
    const engine = spawn(ENGINE_PATH, [], { stdio: "pipe" });
    const rawOutput: string[] = [];
    let timer: NodeJS.Timeout | null = null;

    const waiters: Array<{ token: string; resolve: () => void }> = [];

    const fulfillWaiters = (text: string) => {
      for (let i = waiters.length - 1; i >= 0; i--) {
        const waiter = waiters[i];
        if (text.includes(waiter.token)) {
          waiter.resolve();
          waiters.splice(i, 1);
        }
      }
    };

    const waitForToken = (token: string) =>
      new Promise<void>((tokenResolve) => {
        waiters.push({ token, resolve: tokenResolve });
      });

    let lastInfo: Partial<EngineEvaluation> = {
      score: null,
      depth,
      pv: [],
      raw: rawOutput,
      bestMove: "",
    };

    const handleData = (chunk: Buffer) => {
      const text = chunk.toString();
      rawOutput.push(text);
      fulfillWaiters(text);

      text.split(/\r?\n/).forEach((line) => {
        if (!line) return;
        if (line.startsWith("info")) {
          lastInfo = { ...lastInfo, ...parseInfo(line) };
        } else if (line.startsWith("bestmove")) {
          const [, bestMove] = line.split(" ");
          cleanup();
          const evaluation = normalizeEvaluationForFen(
            {
              bestMove: bestMove || "",
              score: lastInfo.score ?? null,
              depth: lastInfo.depth ?? depth,
              pv: lastInfo.pv ?? [],
              raw: rawOutput,
            },
            fen
          );
          resolve(evaluation);
        }
      });
    };

    const handleError = (error: Error) => {
      cleanup();
      reject(error);
    };

    const cleanup = () => {
      engine.stdout?.off("data", handleData);
      engine.stderr?.off("data", stderrLogger);
      engine.off("error", handleError);
      engine.stdin.end();
      engine.kill();
      if (timer) clearTimeout(timer);
    };

    const stderrLogger = (chunk: Buffer) => {
      console.warn("[Stockfish stderr]", chunk.toString());
    };

    engine.stdout.on("data", handleData);
    engine.stderr?.on("data", stderrLogger);
    engine.on("error", handleError);

    timer = setTimeout(() => {
      cleanup();
      reject(new Error("Stockfish analysis timed out"));
    }, ANALYSIS_TIMEOUT_MS);

    const send = (command: string) => {
      engine.stdin.write(`${command}\n`);
    };

    const run = async () => {
      await commandAndWait("uci", "uciok");
      await commandAndWait("isready", "readyok");
      send(`position fen ${fen}`);
      send(`go depth ${depth}`);
    };

    const commandAndWait = async (command: string, token: string) => {
      send(command);
      await waitForToken(token);
    };

    run().catch((err) => {
      cleanup();
      reject(err);
    });
  });
}

function parseInfo(line: string): Partial<EngineEvaluation> {
  const tokens = line.trim().split(/\s+/);
  const info: Partial<EngineEvaluation> = {};

  const depthIdx = tokens.indexOf("depth");
  if (depthIdx !== -1) {
    const depthValue = Number(tokens[depthIdx + 1]);
    if (!Number.isNaN(depthValue)) {
      info.depth = depthValue;
    }
  }

  const scoreIdx = tokens.indexOf("score");
  if (scoreIdx !== -1) {
    const type = tokens[scoreIdx + 1] as "cp" | "mate";
    const value = Number(tokens[scoreIdx + 2]);
    if ((type === "cp" || type === "mate") && !Number.isNaN(value)) {
      info.score = { type, value };
    }
  }

  const pvIdx = tokens.indexOf("pv");
  if (pvIdx !== -1) {
    info.pv = tokens.slice(pvIdx + 1);
  }

  return info;
}

function normalizeEvaluationForFen(evaluation: EngineEvaluation, fen: string): EngineEvaluation {
  const turn = fen.split(" ")[1];
  if (!evaluation.score || (turn !== "w" && turn !== "b")) return evaluation;
  const multiplier = turn === "w" ? 1 : -1;
  return {
    ...evaluation,
    score: {
      ...evaluation.score,
      value: evaluation.score.value * multiplier,
    },
  };
}
