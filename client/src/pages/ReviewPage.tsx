import { useEffect, useMemo, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import Navbar from "../components/Navbar";

type View = "analysis" | "timeline" | "insights";

type MoveSnapshot = {
  ply: number;
  moveNumber: number;
  san: string;
  color: "white" | "black";
  fen: string;
};

type EngineScore = { type: "cp" | "mate"; value: number };
type EngineEvaluation = {
  bestMove: string;
  score: EngineScore | null;
  depth: number;
  pv: string[];
};

type MoveEvalState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; evaluation: EngineEvaluation }
  | { status: "error"; error: string };

interface GameSummary {
  totalMoves: number;
  sampled: number;
  depth: number;
}

interface EngineSample extends MoveSnapshot {
  evaluation: EngineEvaluation | null;
  error?: string;
}

interface GameAnalysisResponse {
  summary: GameSummary;
  timeline: MoveSnapshot[];
  samples: EngineSample[];
}

const API_BASE_URL = import.meta.env.VITE_SERVER_URL ?? "http://localhost:5100";
const SAMPLE_PGN = `[Event "Live Chess"]
[Site "Chess.com"]
[Date "2024.01.15"]
[Round "-"]
[White "SamplePlayer"]
[Black "Opponent"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O
9. h3 Nb8 10. d4 Nbd7 11. c4 c6 12. Nc3 Bb7 13. cxb5 axb5 14. Bg5 b4 15. Na4 c5
16. dxe5 Nxe4 17. Bxe7 Qxe7 18. exd6 Qf6 19. Bd5 Bxd5 20. Qxd5 Nxd6 21. Nxc5 Nb6
22. Qc6 Nbc4 23. Nd7 Qxb2 24. Nxf8 Rxf8 25. Reb1 Qf6 26. Rd1 Rc8 27. Qa6 Qe7
28. Rac1 h6 29. Nd4 Qg5 30. Nc6 Re8 31. Rxc4 Nxc4 32. Qxc4 Qh5 33. Rd5 Re1+ 34. Kh2 Qd1
35. Rxd1 Rxd1 36. Ne7+ Kh7 37. Qxf7 1-0`;

export default function ReviewPage() {
  const [pgnInput, setPgnInput] = useState("");
  const [selectedView, setSelectedView] = useState<View>("analysis");
  const [timeline, setTimeline] = useState<MoveSnapshot[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState<number>(-1);
  const [analysisSummary, setAnalysisSummary] = useState<GameSummary | null>(null);
  const [moveEvaluations, setMoveEvaluations] = useState<Record<number, MoveEvalState>>({});
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const [boardSize, setBoardSize] = useState(520);

  const initialFen = useMemo(() => new Chess().fen(), []);

  useEffect(() => {
    const resizeBoard = () => {
      if (typeof window === "undefined") return;
      const width = window.innerWidth;
      setBoardSize(Math.max(300, Math.min(520, width - 80)));
    };
    resizeBoard();
    window.addEventListener("resize", resizeBoard);
    return () => window.removeEventListener("resize", resizeBoard);
  }, []);

  const boardPosition =
    currentMoveIndex >= 0 && timeline[currentMoveIndex] ? timeline[currentMoveIndex].fen : initialFen;

  const movePairs = useMemo(() => {
    const pairs: Array<{
      moveNumber: number;
      white?: MoveSnapshot;
      black?: MoveSnapshot;
      whiteIndex: number;
      blackIndex: number;
    }> = [];
    for (let i = 0; i < timeline.length; i += 2) {
      pairs.push({
        moveNumber: timeline[i].moveNumber,
        white: timeline[i],
        black: timeline[i + 1],
        whiteIndex: i,
        blackIndex: i + 1,
      });
    }
    return pairs;
  }, [timeline]);

  const currentMove = currentMoveIndex >= 0 ? timeline[currentMoveIndex] : null;
  const currentEval = currentMove ? moveEvaluations[currentMove.ply] : null;

  const summaryCards = buildSummaryCards(analysisSummary, timeline.length, currentMoveIndex + 1);

  const handleLoadSample = () => {
    setPgnInput(SAMPLE_PGN.trim());
    try {
      bootstrapTimeline(buildTimelineFromPgn(SAMPLE_PGN));
      setAnalysisSummary(null);
      setAnalysisError(null);
    } catch (err: any) {
      setInputError(err.message || "Failed to parse sample PGN");
    }
  };

  const bootstrapTimeline = (moves: MoveSnapshot[]) => {
    setTimeline(moves);
    setCurrentMoveIndex(moves.length ? 0 : -1);
    const map: Record<number, MoveEvalState> = {};
    moves.forEach((move) => {
      map[move.ply] = { status: "idle" };
    });
    setMoveEvaluations(map);
  };

  const handleAnalyze = async () => {
    if (!pgnInput.trim()) return;
    setInputError(null);
    setAnalysisError(null);
    setAnalysisSummary(null);

    let parsedMoves: MoveSnapshot[] = [];
    try {
      parsedMoves = buildTimelineFromPgn(pgnInput);
      bootstrapTimeline(parsedMoves);
    } catch (err: any) {
      setInputError(err.message || "Invalid PGN");
      return;
    }

    if (!parsedMoves.length) {
      setInputError("Game must contain at least one move");
      return;
    }

    setAnalysisLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/review/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pgn: pgnInput,
          depth: 16,
          samples: Math.min(parsedMoves.length, 10),
        }),
      });
      const payload: GameAnalysisResponse | { error: string } = await response.json();
      if (!response.ok || "error" in payload) {
        throw new Error("error" in payload ? payload.error : "Failed to analyze game");
      }

      setTimeline(payload.timeline ?? parsedMoves);
      setAnalysisSummary(payload.summary);
      setMoveEvaluations((prev) => mergeSampleEvaluations(prev, payload.samples));
    } catch (err: any) {
      setAnalysisError(err.message || "Failed to run analysis");
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleSelectMove = (index: number) => {
    if (index < -1 || index > timeline.length - 1) return;
    setCurrentMoveIndex(index);
    if (index >= 0) {
      const move = timeline[index];
      const state = moveEvaluations[move.ply];
      if (!state || state.status === "idle") {
        requestEvaluation(move);
      }
    }
  };

  const requestEvaluation = async (move: MoveSnapshot) => {
    setMoveEvaluations((prev) => ({
      ...prev,
      [move.ply]: { status: "loading" },
    }));
    try {
      const response = await fetch(`${API_BASE_URL}/api/review/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fen: move.fen, depth: 16 }),
      });
      const payload: EngineEvaluation | { error: string } = await response.json();
      if (!response.ok || "error" in payload) {
        throw new Error("error" in payload ? payload.error : "Failed to evaluate position");
      }
      setMoveEvaluations((prev) => ({
        ...prev,
        [move.ply]: { status: "success", evaluation: payload },
      }));
    } catch (err: any) {
      setMoveEvaluations((prev) => ({
        ...prev,
        [move.ply]: { status: "error", error: err.message || "Engine error" },
      }));
    }
  };

  const evaluatedMoves = useMemo(() => {
    return timeline.filter((move) => moveEvaluations[move.ply]?.status === "success").slice(-6).reverse();
  }, [timeline, moveEvaluations]);

  const atEnd = currentMoveIndex >= timeline.length - 1;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 text-gray-800 px-6 py-24">
        <div className="max-w-6xl mx-auto space-y-10">
          <header>
            <p className="text-sm uppercase tracking-[0.2em] text-gray-500 mb-2">Review</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Game Review</h1>
                <p className="text-gray-600 mt-1">
                  Paste your PGN, replay moves on the board, and let Stockfish surface insights as you go.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {(["analysis", "timeline", "insights"] as const).map((view) => (
                  <button
                    key={view}
                    onClick={() => setSelectedView(view)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                      selectedView === view
                        ? "bg-[#00bfa6] text-white shadow-lg"
                        : "bg-white text-gray-700 border border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {view}
                  </button>
                ))}
              </div>
            </div>
          </header>

          {/* Input + Summary */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 rounded-2xl border border-gray-200 p-6 flex flex-col gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-gray-800">Game Input</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Paste a PGN or try the sample to preview the review workflow.
                </p>
              </div>
              <textarea
                value={pgnInput}
                onChange={(e) => setPgnInput(e.target.value)}
                placeholder={`[Event "Live Chess"]\n1. e4 e5 2. Nf3 Nc6 ...`}
                className="w-full h-56 border border-gray-200 rounded-xl p-4 font-mono text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#00bfa6] focus:border-transparent resize-none"
              />
              {(inputError || analysisError) && (
                <p className="text-sm text-red-500">{inputError || analysisError}</p>
              )}
              <div className="flex flex-wrap gap-3 justify-end">
                <button
                  onClick={handleLoadSample}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
                >
                  Load Sample
                </button>
                <button
                  onClick={handleAnalyze}
                  className={`px-5 py-2 rounded-lg text-sm font-semibold text-white ${
                    pgnInput.trim()
                      ? "bg-[#00bfa6] hover:bg-[#00d6b5]"
                      : "bg-gray-300 cursor-not-allowed"
                  } shadow-md transition`}
                  disabled={!pgnInput.trim() || analysisLoading}
                >
                  {analysisLoading ? "Analyzing..." : "Analyze Game"}
                </button>
              </div>
            </div>

            <div className="bg-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 rounded-2xl border border-gray-200 p-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Review Summary</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {summaryCards.map((card) => (
                  <div key={card.title} className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500">{card.title}</p>
                    <p className={`text-3xl font-bold ${card.accent}`}>{card.value}</p>
                    <p className="text-sm text-gray-500">{card.subtext}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Numbers update once analysis runs. Toggle through the tabs above to shape future review modules.
              </p>
            </div>
          </section>

          {/* Interactive board & move list */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 rounded-2xl border border-gray-200 p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-800">Interactive Board</h2>
                <span className="text-sm text-gray-500">
                  {currentMoveIndex >= 0 ? `Move ${timeline[currentMoveIndex]?.moveNumber}` : "Start position"}
                </span>
              </div>
              <div className="flex justify-center">
                <Chessboard
                  position={boardPosition}
                  boardWidth={boardSize}
                  arePiecesDraggable={false}
                  customDarkSquareStyle={{ backgroundColor: "#2d3436" }}
                  customLightSquareStyle={{ backgroundColor: "#f0f0f0" }}
                  customBoardStyle={{ borderRadius: "1.5rem" }}
                />
              </div>
              <div className="flex flex-wrap gap-2 justify-between">
                <button
                  onClick={() => handleSelectMove(0)}
                  className="px-3 py-1 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                  disabled={!timeline.length}
                >
                  First
                </button>
                <button
                  onClick={() => handleSelectMove(Math.max(currentMoveIndex - 1, -1))}
                  className="px-3 py-1 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                  disabled={timeline.length === 0 || currentMoveIndex <= 0}
                >
                  Prev
                </button>
                <button
                  onClick={() => handleSelectMove(Math.min(currentMoveIndex + 1, timeline.length - 1))}
                  className="px-3 py-1 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                  disabled={timeline.length === 0 || atEnd}
                >
                  Next
                </button>
                <button
                  onClick={() => handleSelectMove(timeline.length - 1)}
                  className="px-3 py-1 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                  disabled={!timeline.length}
                >
                  Last
                </button>
              </div>
            </div>

            <div className="bg-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 rounded-2xl border border-gray-200 p-6 flex flex-col gap-4">
              <h2 className="text-2xl font-semibold text-gray-800">Move List & Evaluation</h2>
              <div className="max-h-72 overflow-y-auto rounded-2xl border border-gray-100 bg-gray-50 p-4">
                {timeline.length ? (
                  <table className="w-full text-sm text-gray-700">
                    <tbody>
                      {movePairs.map((pair) => (
                        <tr key={pair.moveNumber} className="border-b border-gray-200 last:border-none">
                          <td className="py-2 pr-3 text-xs font-mono text-gray-500">{pair.moveNumber}.</td>
                          <td className="py-1">
                            {pair.white ? (
                              <button
                                className={`w-full text-left px-2 py-1 rounded-lg transition ${
                                  currentMoveIndex === pair.whiteIndex
                                    ? "bg-[#00bfa6]/10 text-[#00bfa6]"
                                    : "hover:bg-white"
                                }`}
                                onClick={() => handleSelectMove(pair.whiteIndex)}
                              >
                                {pair.white.san}
                              </button>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="py-1">
                            {pair.black ? (
                              <button
                                className={`w-full text-left px-2 py-1 rounded-lg transition ${
                                  currentMoveIndex === pair.blackIndex
                                    ? "bg-[#00bfa6]/10 text-[#00bfa6]"
                                    : "hover:bg-white"
                                }`}
                                onClick={() => handleSelectMove(pair.blackIndex)}
                              >
                                {pair.black.san}
                              </button>
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-center text-gray-500">Load a PGN to populate moves.</p>
                )}
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Engine Insight</p>
                {!currentMove ? (
                  <p className="text-gray-500 text-sm">
                    Select a move to fetch Stockfish feedback for that position.
                  </p>
                ) : currentEval?.status === "loading" ? (
                  <p className="text-gray-500 text-sm">Analyzing move {currentMove.moveNumber}...</p>
                ) : currentEval?.status === "success" ? (
                  <EvaluationDetails evaluation={currentEval.evaluation} />
                ) : currentEval?.status === "error" ? (
                  <p className="text-sm text-red-500">Engine error: {currentEval.error}</p>
                ) : (
                  <p className="text-sm text-gray-500">
                    No evaluation yet. Step through the move or rerun analysis to prefetch Stockfish output.
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Engine findings */}
          <section className="bg-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">Engine Findings</h2>
              <span className="text-xs uppercase tracking-wide text-gray-500">
                Live evaluations ({evaluatedMoves.length})
              </span>
            </div>
            {evaluatedMoves.length ? (
              <ul className="space-y-3">
                {evaluatedMoves.map((move) => {
                  const evalState = moveEvaluations[move.ply];
                  if (evalState?.status !== "success") return null;
                  return (
                    <li
                      key={move.ply}
                      className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 flex flex-col gap-1"
                    >
                      <span className="text-xs uppercase tracking-wide text-gray-500">
                        Move {move.moveNumber} • {move.color === "white" ? "White" : "Black"}
                      </span>
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <span className="font-semibold text-gray-800">{move.san}</span>
                        <span className="text-[#00bfa6] font-mono">{formatScore(evalState.evaluation.score)}</span>
                        <span className="text-gray-500">Best: {evalState.evaluation.bestMove || "—"}</span>
                      </div>
                      {evalState.evaluation.pv.length > 0 && (
                        <p className="text-xs text-gray-500">
                          PV: {evalState.evaluation.pv.slice(0, 6).join(" ")}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">
                Run an analysis or click through moves on the board to start building a findings list.
              </p>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

function buildSummaryCards(summary: GameSummary | null, totalMoves: number, reviewedMoves: number) {
  return [
    {
      title: "Analyzed Moves",
      value: summary?.sampled ?? "—",
      subtext: "Positions Stockfish evaluated",
      accent: "text-[#00bfa6]",
    },
    {
      title: "Engine Depth",
      value: summary?.depth ?? "—",
      subtext: "Search depth requested",
      accent: "text-[#00bfa6]",
    },
    {
      title: "Total Moves",
      value: totalMoves || "—",
      subtext: "Moves parsed from PGN",
      accent: "text-gray-800",
    },
    {
      title: "Moves Reviewed",
      value: reviewedMoves > 0 ? reviewedMoves : "—",
      subtext: "Moves stepped through on board",
      accent: "text-gray-800",
    },
  ];
}

function mergeSampleEvaluations(
  existing: Record<number, MoveEvalState>,
  samples: EngineSample[]
): Record<number, MoveEvalState> {
  const next = { ...existing };
  samples?.forEach((sample) => {
    if (sample.evaluation) {
      next[sample.ply] = { status: "success", evaluation: sample.evaluation };
    } else if (sample.error) {
      next[sample.ply] = { status: "error", error: sample.error };
    }
  });
  return next;
}

function buildTimelineFromPgn(pgn: string): MoveSnapshot[] {
  const chess = new Chess();
  try {
    chess.loadPgn(pgn);
  } catch {
    throw new Error("Invalid PGN format");
  }
  const verboseMoves = chess.history({ verbose: true });
  chess.reset();

  const snapshots: MoveSnapshot[] = [];
  verboseMoves.forEach((move, index) => {
    chess.move(move);
    snapshots.push({
      ply: index + 1,
      moveNumber: Math.floor(index / 2) + 1,
      san: move.san,
      color: move.color === "w" ? "white" : "black",
      fen: chess.fen(),
    });
  });
  return snapshots;
}

function formatScore(score: EngineScore | null) {
  if (!score) return "—";
  if (score.type === "mate") {
    return `M${score.value}`;
  }
  const value = (score.value / 100).toFixed(2);
  return value.startsWith("-") ? value : `+${value}`;
}

function EvaluationDetails({ evaluation }: { evaluation: EngineEvaluation }) {
  return (
    <div className="text-sm text-gray-700 space-y-1">
      <p>
        Score: <span className="font-semibold text-[#00bfa6]">{formatScore(evaluation.score)}</span>
      </p>
      <p>
        Best Move: <span className="font-semibold">{evaluation.bestMove || "—"}</span>
      </p>
      <p>Depth: {evaluation.depth}</p>
      {evaluation.pv.length > 0 && (
        <p className="text-xs text-gray-500">
          PV: {evaluation.pv.slice(0, 8).join(" ")}
        </p>
      )}
    </div>
  );
}
