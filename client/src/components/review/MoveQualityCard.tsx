import type { BookMoveStatus, MoveQuality, MoveSnapshot } from "../../types/review";
import { MOVE_QUALITY_STYLES } from "../../constants/moveQualityStyles";

interface MoveQualityCardProps {
  move: MoveSnapshot | null;
  classification?: MoveQuality;
  awaitingEvaluation: boolean;
  bookStatus?: BookMoveStatus;
}

function formatLoss(loss: number) {
  if (!Number.isFinite(loss) || loss <= 0) return "0.00";
  return (loss / 100).toFixed(2);
}

export default function MoveQualityCard({ move, classification, awaitingEvaluation, bookStatus }: MoveQualityCardProps) {
  const isBookMove = Boolean(bookStatus?.inBook);
  const label = isBookMove ? "Book" : classification?.label;
  const styles = !isBookMove && label ? MOVE_QUALITY_STYLES[label as MoveQuality["label"]] : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Current move</p>
          <p className="text-lg font-semibold text-gray-900">
            {move ? `${move.moveNumber}. ${move.san}` : "No move selected"}
          </p>
        </div>
        {isBookMove ? (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-amber-200 text-amber-900">Book</span>
        ) : label ? (
          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${styles?.badge || ""}`}>{label}</span>
        ) : (
          <span className="text-xs text-gray-400">Awaiting engine</span>
        )}
      </div>

      {move ? (
        isBookMove ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">
              This move follows the book line{bookStatus?.opening ? `: ${bookStatus.opening}` : ""}.
            </p>
            {bookStatus?.eco && <p className="text-xs text-amber-800 mt-1">ECO {bookStatus.eco}</p>}
          </div>
        ) : label ? (
          <div
            className={`rounded-xl border ${styles?.border || "border-gray-200"} ${
              styles?.background || "bg-gray-50"
            } p-4`}
          >
            <p className={`text-sm font-semibold ${styles?.text || "text-gray-800"}`}>{classification?.description}</p>
            <p className="text-xs text-gray-500 mt-2">
              Evaluation drop: <span className="font-semibold text-gray-800">{formatLoss(classification?.loss ?? 0)}</span>{" "}
              pawns compared to the engine recommendation.
            </p>
          </div>
        ) : awaitingEvaluation ? (
          <p className="text-sm text-gray-500">Waiting for engine evaluation to classify this move…</p>
        ) : (
          <p className="text-sm text-gray-500">Not enough engine data to classify this move yet.</p>
        )
      ) : (
        <p className="text-sm text-gray-500">Select a move to view its classification.</p>
      )}
    </div>
  );
}
