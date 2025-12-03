import { Chessboard } from "react-chessboard";
import { ArrowRight, ArrowUpDown, ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, Pause, Play, RefreshCw, Settings } from "lucide-react";
import type { ReactElement } from "react";
import type { Arrow, EngineScore } from "../../types/review";
import BoardControlButton from "./BoardControlButton";
import EvaluationBar from "./EvaluationBar";

type PieceRenderMap = Record<string, (props: { squareWidth: number }) => ReactElement>;

interface BoardAnalysisCardProps {
  boardPosition: string;
  boardWidth: number;
  boardOrientation: "white" | "black";
  boardColors: { light: string; dark: string };
  lastMove?: { from?: string; to?: string } | null;
  lastMoveColor?: string | null;
  customPieces?: PieceRenderMap;
  arePiecesDraggable?: boolean;
  onPieceDrop?: (sourceSquare: string, targetSquare: string, piece: string) => boolean;
  onSquareClick?: (square: string) => void;
  evaluationPercent: number;
  currentEvaluationScore: EngineScore | null;
  whiteLabel?: string;
  blackLabel?: string;
  whiteClock?: string | null;
  blackClock?: string | null;
  bestMoveArrows: Arrow[];
  timelineLength: number;
  currentMoveIndex: number;
  atEnd: boolean;
  isAutoPlaying: boolean;
  showBestMoveArrow: boolean;
  engineEnabled?: boolean;
  onSelectMove: (index: number) => void;
  onToggleAutoPlay: () => void;
  onFlipBoard: () => void;
  onToggleBestMoveArrow: () => void;
  onOpenThemeModal: () => void;
  sandboxActive?: boolean;
  onEnterSandbox?: () => void;
  onExitSandbox?: () => void;
  controlsDisabled?: boolean;
  selectedSquare?: string | null;
}

export default function BoardAnalysisCard({
  boardPosition,
  boardWidth,
  boardOrientation,
  boardColors,
  lastMove,
  lastMoveColor,
  customPieces,
  arePiecesDraggable = false,
  onPieceDrop,
  onSquareClick,
  evaluationPercent,
  currentEvaluationScore,
  whiteLabel,
  blackLabel,
  whiteClock,
  blackClock,
  engineEnabled = true,
  bestMoveArrows,
  timelineLength,
  currentMoveIndex,
  atEnd,
  isAutoPlaying,
  showBestMoveArrow,
  onSelectMove,
  onToggleAutoPlay,
  onFlipBoard,
  onToggleBestMoveArrow,
  onOpenThemeModal,
  sandboxActive = false,
  onEnterSandbox,
  onExitSandbox,
  controlsDisabled = false,
  selectedSquare = null,
}: BoardAnalysisCardProps) {
  const hasMoves = timelineLength > 0;
  const cardWidth = boardWidth + 48;
  const highlightColor = lastMoveColor || "#fcd34d"; // default yellow fallback
  const customSquareStyles =
    lastMove?.from || lastMove?.to || selectedSquare
      ? {
          ...(lastMove?.from
            ? { [lastMove.from]: { backgroundColor: highlightColor, boxShadow: "inset 0 0 0 2px rgba(0,0,0,0.05)" } }
            : {}),
          ...(lastMove?.to
            ? { [lastMove.to]: { backgroundColor: highlightColor, boxShadow: "inset 0 0 0 2px rgba(0,0,0,0.05)" } }
            : {}),
          ...(selectedSquare
            ? {
                [selectedSquare]: {
                  boxShadow: "inset 0 0 0 3px rgba(14,165,233,0.9)",
                  borderRadius: "0",
                },
              }
            : {}),
        }
      : undefined;

  return (
    <div
      className="bg-white shadow-lg rounded-2xl border border-gray-200 p-6 flex flex-col gap-4 mx-auto"
      style={{ width: Math.max(cardWidth, 360) }}
    >
      <EvaluationBar
        evaluationPercent={evaluationPercent}
        currentEvaluationScore={currentEvaluationScore}
        whiteLabel={whiteLabel}
        blackLabel={blackLabel}
        whiteClock={whiteClock}
        blackClock={blackClock}
        disabled={!engineEnabled}
      />
      <div className="flex justify-center -mt-2">
        <Chessboard
          position={boardPosition}
          boardWidth={boardWidth}
          boardOrientation={boardOrientation}
          arePiecesDraggable={arePiecesDraggable}
          customDarkSquareStyle={{ backgroundColor: boardColors.dark }}
          customLightSquareStyle={{ backgroundColor: boardColors.light }}
          customBoardStyle={{ borderRadius: 0 }}
          customArrows={bestMoveArrows}
          customSquareStyles={customSquareStyles}
          customPieces={customPieces}
          onPieceDrop={onPieceDrop}
          onSquareClick={onSquareClick}
          snapToCursor
          snapToCursorOffset={{ x: -boardWidth / 16, y: -boardWidth / 16 }}
        />
      </div>
      <div className="flex flex-wrap gap-4 items-center border-t border-gray-100 pt-4">
        <div className="flex gap-2 justify-start flex-shrink-0">
          <BoardControlButton onClick={onFlipBoard} disabled={!hasMoves} label="Flip Board">
            <ArrowUpDown className="h-4 w-4" />
          </BoardControlButton>
        </div>
        <div className="flex flex-1 flex-wrap md:flex-nowrap gap-2 justify-center">
          <BoardControlButton onClick={() => onSelectMove(0)} disabled={!hasMoves || controlsDisabled} label="First move">
            <ChevronFirst className="h-4 w-4" />
          </BoardControlButton>
          <BoardControlButton
            onClick={() => onSelectMove(Math.max(currentMoveIndex - 1, -1))}
            disabled={!hasMoves || currentMoveIndex <= 0 || controlsDisabled}
            label="Previous move"
          >
            <ChevronLeft className="h-4 w-4" />
          </BoardControlButton>
          <BoardControlButton
            onClick={onToggleAutoPlay}
            active={isAutoPlaying}
            disabled={!hasMoves || controlsDisabled}
            label={isAutoPlaying ? "Pause" : "Play"}
          >
            {isAutoPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </BoardControlButton>
          <BoardControlButton
            onClick={() => onSelectMove(Math.min(currentMoveIndex + 1, timelineLength - 1))}
            disabled={!hasMoves || atEnd || controlsDisabled}
            label="Next move"
          >
            <ChevronRight className="h-4 w-4" />
          </BoardControlButton>
          <BoardControlButton onClick={() => onSelectMove(timelineLength - 1)} disabled={!hasMoves || controlsDisabled} label="Last move">
            <ChevronLast className="h-4 w-4" />
          </BoardControlButton>
        </div>
        <div className="flex gap-2 justify-end flex-shrink-0">
          <BoardControlButton
            onClick={onToggleBestMoveArrow}
            active={engineEnabled && showBestMoveArrow}
            disabled={!engineEnabled}
            label={engineEnabled ? (showBestMoveArrow ? "Hide arrow" : "Show arrow") : "Engine off"}
          >
            <ArrowRight className="h-4 w-4" />
          </BoardControlButton>
          {sandboxActive ? (
            <BoardControlButton onClick={onExitSandbox} label="Exit sandbox" active>
              <RefreshCw className="h-4 w-4" />
            </BoardControlButton>
          ) : (
            onEnterSandbox && (
              <BoardControlButton onClick={onEnterSandbox} label="Sandbox">
                <RefreshCw className="h-4 w-4" />
              </BoardControlButton>
            )
          )}
          <BoardControlButton onClick={onOpenThemeModal} label="Settings">
            <Settings className="h-4 w-4" />
          </BoardControlButton>
        </div>
      </div>
    </div>
  );
}
