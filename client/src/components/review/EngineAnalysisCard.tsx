import { useEffect, useMemo, useRef, useState } from "react";
import type { EngineEvaluation, MoveEvalState } from "../../types/review";
import { formatBestMoveSan, formatLineContinuation, formatScore, getMateWinner } from "../../utils/reviewEngine";

const API_BASE_URL = import.meta.env.VITE_SERVER_URL ?? "http://localhost:5100";

type PhaseBucket = "opening" | "middlegame" | "endgame";

type ExplorerMove = {
  san: string;
  uci: string;
  white: number;
  draws: number;
  black: number;
  total?: number;
  averageRating?: number;
};

type ExplorerResponse = {
  fen: string;
  moves: ExplorerMove[];
  opening?: { name?: string; eco?: string };
  total?: number;
};

interface TimeStats {
  average: { white: number | null; black: number | null };
  longest: {
    white: { seconds: number; moveNumber?: number } | null;
    black: { seconds: number; moveNumber?: number } | null;
  };
  distribution: {
    white: Record<PhaseBucket, number>;
    black: Record<PhaseBucket, number>;
  };
}

interface EngineAnalysisCardProps {
  engineStatus?: MoveEvalState["status"];
  engineError: string | null;
  stableEvaluation: { evaluation: EngineEvaluation; fen?: string } | null;
  currentFen?: string | null;
  drawInfo?: { result: string; reason?: string };
  fullReviewDone?: boolean;
  linesToShow?: number;
  engineEnabled?: boolean;
  onToggleEngine?: () => void;
  timeStats?: TimeStats | null;
  onSelectExplorerMove?: (uci: string) => void;
}

export default function EngineAnalysisCard({
  engineStatus,
  engineError,
  stableEvaluation,
  currentFen,
  drawInfo,
  fullReviewDone = true,
  linesToShow = 3,
  engineEnabled = true,
  onToggleEngine,
  timeStats = null,
  onSelectExplorerMove,
}: EngineAnalysisCardProps) {
  const showDraw = Boolean(drawInfo && drawInfo.result === "1/2-1/2");
  const [activeTab, setActiveTab] = useState<"summary" | "analysis" | "time" | "explorer">("analysis");
  const tabs: Array<{ key: typeof activeTab; label: string }> = [
    { key: "summary", label: "Summary" },
    { key: "analysis", label: "Analysis" },
    { key: "time", label: "Time" },
    { key: "explorer", label: "Explorer" },
  ];

  const summaryContent = useMemo(() => {
    if (showDraw) return <DrawSummary reason={drawInfo?.reason} />;
    if (engineStatus === "error" && !stableEvaluation) {
      return <p className="text-sm text-red-500">Engine error: {engineError || "Unable to evaluate position."}</p>;
    }
    if (!stableEvaluation) {
      return <p className="text-sm text-gray-500">Analyzing current position…</p>;
    }
    const scoreLabel = formatScore(stableEvaluation.evaluation.score);
    const bestMove = formatBestMoveSan(stableEvaluation.evaluation.bestMove, stableEvaluation.fen);
    return (
      <div className="space-y-2">
        <p className="text-sm text-gray-600">Score (CP/Mate)</p>
        <p className="text-2xl font-semibold text-gray-900">{scoreLabel}</p>
        <p className="text-sm text-gray-600">Best move</p>
        <p className="text-lg font-semibold text-gray-900">{bestMove}</p>
      </div>
    );
  }, [drawInfo?.reason, engineError, engineStatus, showDraw, stableEvaluation]);

  type ExplorerState =
    | { status: "idle" }
    | { status: "loading" }
    | { status: "error"; error: string }
    | { status: "ready"; moves: ExplorerMove[]; total: number; opening?: string };

  const explorerCache = useRef(new Map<string, ExplorerState>());
  const [explorerState, setExplorerState] = useState<ExplorerState>({ status: "idle" });

  useEffect(() => {
    if (activeTab !== "explorer") return;
    const fen = currentFen || stableEvaluation?.fen;
    if (!fen) {
      setExplorerState({ status: "error", error: "No position available." });
      return;
    }
    const cached = explorerCache.current.get(fen);
    if (cached) {
      setExplorerState(cached);
      return;
    }
    let cancelled = false;
    setExplorerState({ status: "loading" });
    const controller = new AbortController();
    fetch(`${API_BASE_URL}/api/review/book?fen=${encodeURIComponent(fen)}&moves=10`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Failed to load explorer data");
        }
        const data = (await res.json()) as ExplorerResponse;
        const moves = Array.isArray(data.moves) ? data.moves : [];
        const total = data.total ?? moves.reduce((sum, mv) => sum + (mv.total ?? mv.white + mv.black + mv.draws), 0);
        const next: ExplorerState = { status: "ready", moves, total, opening: data.opening?.name };
        if (!cancelled) {
          explorerCache.current.set(fen, next);
          setExplorerState(next);
        }
      })
      .catch((err: any) => {
        if (cancelled || err?.name === "AbortError") return;
        setExplorerState({ status: "error", error: err?.message || "Explorer lookup failed" });
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [activeTab, currentFen, stableEvaluation?.fen]);

  const timeContent = useMemo(() => {
    if (!fullReviewDone) {
      return <p className="text-sm text-gray-500">Run “Review Game” to unlock time insights.</p>;
    }
    if (!timeStats) {
      return <p className="text-sm text-gray-500">No clock data available for this game.</p>;
    }

    const formatDuration = (seconds: number | null | undefined) => {
      if (seconds == null) return "—";
      if (seconds < 1) return "<1s";
      const hrs = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      const pad = (n: number) => n.toString().padStart(2, "0");
      if (hrs > 0) return `${hrs}:${pad(mins)}:${pad(secs)}`;
      return `${mins}:${pad(secs)}`;
    };

    const renderDistribution = (color: "white" | "black") => {
      const dist = timeStats.distribution[color];
      const total = dist.opening + dist.middlegame + dist.endgame;
      if (total <= 0) {
        return <p className="text-xs text-gray-500">No timing data.</p>;
      }
      const toPct = (value: number) => `${Math.round((value / total) * 100)}%`;
      const segments: Array<{ label: string; value: number; bgClass: string; dotClass: string }> = [
        { label: "Opening", value: dist.opening, bgClass: "bg-emerald-200", dotClass: "bg-emerald-500" },
        { label: "Middlegame", value: dist.middlegame, bgClass: "bg-blue-200", dotClass: "bg-blue-500" },
        { label: "Endgame", value: dist.endgame, bgClass: "bg-amber-200", dotClass: "bg-amber-500" },
      ];
      return (
        <div className="space-y-2">
          <div className="flex w-full h-3 overflow-hidden rounded-full border border-gray-200">
            {segments.map((seg) => (
              <div
                key={seg.label}
                className={`${seg.bgClass} h-full`}
                style={{ width: total === 0 ? "0%" : `${(seg.value / total) * 100}%` }}
              />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 text-[11px] text-gray-700">
            {segments.map((seg) => (
              <div key={seg.label} className="flex items-center gap-1">
                <span className={`inline-block w-2 h-2 rounded-sm ${seg.dotClass}`} />
                <span>{seg.label}</span>
                <span className="text-gray-500 ml-auto">{toPct(seg.value)}</span>
              </div>
            ))}
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-5 text-sm">
        <div className="border border-gray-200 rounded-xl p-4 space-y-3">
          <p className="text-xs uppercase tracking-wide text-gray-500">Average & longest</p>
          {(["white", "black"] as const).map((color) => {
            const isWhite = color === "white";
            const longest = timeStats.longest[color];
            return (
              <div key={color} className="flex items-center justify-between gap-3 border border-gray-100 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 text-gray-800">
                  <span className={`w-3 h-3 rounded-full ${isWhite ? "border border-gray-300 bg-white" : "bg-gray-900"}`} />
                  <span className="text-sm font-semibold">{isWhite ? "White" : "Black"}</span>
                </div>
                <div className="flex flex-col items-end text-sm text-gray-700">
                  <span className="font-semibold text-gray-900">
                    Avg: {formatDuration(timeStats.average[color])}
                  </span>
                  <span className="text-xs text-gray-600">
                    Longest: {formatDuration(longest?.seconds)}
                    {longest?.moveNumber ? ` (Move ${longest.moveNumber})` : ""}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border border-gray-200 rounded-xl p-3 space-y-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Time distribution</p>
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-gray-800">
                <span className="w-3 h-3 rounded-full border border-gray-300 bg-white" />
                <span className="text-sm font-semibold">White</span>
              </div>
              {renderDistribution("white")}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-gray-800">
                <span className="w-3 h-3 rounded-full bg-gray-900" />
                <span className="text-sm font-semibold">Black</span>
              </div>
              {renderDistribution("black")}
            </div>
          </div>
        </div>
      </div>
    );
  }, [fullReviewDone, timeStats]);

  const explorerContent = useMemo(() => {
    if (explorerState.status === "idle" || explorerState.status === "loading") {
      return <p className="text-sm text-gray-500">Loading explorer data…</p>;
    }
    if (explorerState.status === "error") {
      return (
        <div className="text-sm text-gray-500 space-y-2">
          <p>{explorerState.error}</p>
          <button
            className="text-[#00bfa6] font-semibold"
            onClick={() => {
              // force refetch by resetting state; effect will run on next render with same fen.
              setExplorerState({ status: "idle" });
              setActiveTab("explorer");
            }}
          >
            Retry
          </button>
        </div>
      );
    }

    const moves = explorerState.moves ?? [];
    if (!moves.length) {
      return <p className="text-sm text-gray-500">No database moves for this position.</p>;
    }
    const totalGames = explorerState.total || moves.reduce((sum, mv) => sum + (mv.total ?? mv.white + mv.black + mv.draws), 0);
    const safeTotal = totalGames || 1;

    return (
      <div className="space-y-3">
        <div className="space-y-2">
          {moves.map((mv) => {
            const white = mv.white ?? 0;
            const draws = mv.draws ?? 0;
            const black = mv.black ?? 0;
            const total = mv.total ?? white + draws + black;
            const wPct = total ? Math.round((white / total) * 100) : 0;
            const dPct = total ? Math.round((draws / total) * 100) : 0;
            const bPct = total ? Math.max(0, 100 - wPct - dPct) : 0;
            const handleClick = () => {
              if (onSelectExplorerMove && mv.uci) {
                onSelectExplorerMove(mv.uci);
              }
            };
            return (
              <button
                key={mv.uci}
                type="button"
                onClick={handleClick}
                disabled={!onSelectExplorerMove}
                className={`w-full text-left border border-gray-200 rounded-xl p-3 transition ${
                  onSelectExplorerMove
                    ? "hover:border-[#00bfa6] hover:bg-[#00bfa6]/5"
                    : "cursor-default opacity-90"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900">{mv.san}</span>
                  <span className="text-xs text-gray-600">
                    {total.toLocaleString()} games • {Math.round((total / safeTotal) * 100)}%
                  </span>
                </div>
                <div className="mt-2 flex h-2 rounded-full overflow-hidden border border-gray-200">
                  <span className="bg-emerald-400 h-full" style={{ width: `${wPct}%` }} />
                  <span className="bg-gray-300 h-full" style={{ width: `${dPct}%` }} />
                  <span className="bg-gray-800 h-full" style={{ width: `${bPct}%` }} />
                </div>
                <div className="mt-1 flex justify-between text-[11px] text-gray-600">
                  <span>W {wPct}%</span>
                  <span>D {dPct}%</span>
                  <span>B {bPct}%</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }, [explorerState, onSelectExplorerMove]);

  return (
    <div className="flex flex-col gap-0">
      <div className="flex w-full border border-gray-200 bg-white rounded-t-2xl overflow-hidden">
        {tabs.map((tab) => {
          const disabled = !fullReviewDone && tab.key !== "analysis";
          const active = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              onClick={() => {
                if (disabled) return;
                setActiveTab(tab.key);
              }}
              disabled={disabled}
              className={`flex-1 text-sm font-semibold py-3 text-center transition ${
                active
                  ? "bg-[#00bfa6]/10 text-gray-900 border-b-2 border-[#00bfa6]"
                  : disabled
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-500"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div className="bg-white rounded-b-2xl border border-gray-200 border-t-0 shadow transition-all duration-300 flex flex-col h-[500px] px-5 pb-5 pt-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-gray-800">Engine</p>
          <button
            type="button"
            onClick={onToggleEngine}
            className={`relative inline-flex h-6 w-12 items-center rounded-full transition ${engineEnabled ? "bg-[#00bfa6]" : "bg-gray-300"}`}
            aria-label="Toggle engine"
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${engineEnabled ? "translate-x-6" : "translate-x-1"}`}
            />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {activeTab === "summary" && summaryContent}
          {activeTab === "analysis" &&
            (!engineEnabled ? (
              <p className="text-sm text-gray-500">Engine is turned off.</p>
            ) : showDraw ? (
              <DrawSummary reason={drawInfo?.reason} />
            ) : engineStatus === "error" && !stableEvaluation ? (
              <p className="text-sm text-red-500">Engine error: {engineError || "Unable to evaluate position."}</p>
            ) : !stableEvaluation ? (
              <p className="text-sm text-gray-500">Analyzing current position…</p>
            ) : (
              <EngineLines evaluation={stableEvaluation.evaluation} fen={stableEvaluation.fen} linesToShow={linesToShow} />
            ))}
          {activeTab === "time" && timeContent}
          {activeTab === "explorer" && explorerContent}
        </div>
      </div>
    </div>
  );
}

function EngineLines({ evaluation, fen, linesToShow }: { evaluation: EngineEvaluation; fen?: string; linesToShow: number }) {
  const lines = (evaluation.lines && evaluation.lines.length
    ? evaluation.lines
    : [
        {
          move: evaluation.bestMove,
          score: evaluation.score,
          pv: evaluation.pv,
        },
      ]
  ).slice(0, Math.max(1, Math.min(5, linesToShow || 3)));

  const mateWinner =
    evaluation.score?.type === "mate" && evaluation.score.value === 0 ? getMateWinner(evaluation.score, fen) : undefined;
  if (mateWinner) {
    const mateResult = mateWinner === "White" ? "1-0" : "0-1";
    const winnerText = `Checkmate for ${mateWinner}`;
    return (
      <div className="text-center">
        <p className="text-3xl font-bold text-gray-900">{mateResult}</p>
        <p className="text-sm text-gray-500 mt-1">{winnerText}</p>
      </div>
    );
  }

  if (!lines.length) {
    return <p className="text-sm text-gray-500">No engine suggestions available for this position.</p>;
  }

  return (
    <div className="space-y-3">
      {lines.map((line, index) => {
        const moveSan = formatBestMoveSan(line.move, fen);
        const mainLine = formatLineContinuation(line, fen);
        return (
          <div
            key={`${line.move}-${index}`}
            className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50 p-3"
          >
            <div>
              <p className="text-lg font-semibold text-gray-900">{moveSan}</p>
              {mainLine && <p className="text-xs text-gray-500">{mainLine}</p>}
            </div>
            <div className="text-right text-sm font-semibold text-gray-700">
              {line.score ? formatScore(line.score) : "—"}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DrawSummary({ reason }: { reason?: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center h-full gap-2">
      <p className="text-3xl font-bold text-gray-900">½-½</p>
      <p className="text-sm text-gray-500">{reason ?? "Game drawn"}</p>
    </div>
  );
}
