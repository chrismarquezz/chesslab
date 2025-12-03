import { useEffect, useMemo, useState, type ReactNode } from "react";
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
  const [lastRenderable, setLastRenderable] = useState<ReactNode>(null);

  const bookBlock = useMemo(
    () =>
      isBookMove ? (
        <div className="rounded-xl border border-[#d7b48c] bg-[#f4e5d4] p-4">
          <p className="text-sm font-semibold text-[#5c3b1f]">
            This move follows the book line{bookStatus?.opening ? `: ${bookStatus.opening}` : ""}.
          </p>
        </div>
      ) : null,
    [bookStatus?.opening, isBookMove]
  );

  const qualityBlock = useMemo(
    () =>
      !isBookMove && label ? (
        <div
          className={`rounded-xl border ${styles?.border || "border-gray-200"} ${
            styles?.background || "bg-gray-50"
          } p-4`}
        >
          <p className={`text-sm font-semibold ${styles?.text || "text-gray-800"}`}>{classification?.description}</p>
        </div>
      ) : null,
    [classification?.description, classification?.loss, isBookMove, label, styles]
  );

  useEffect(() => {
    if (bookBlock || qualityBlock) {
      setLastRenderable(bookBlock ?? qualityBlock);
    }
  }, [bookBlock, qualityBlock]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-lg font-semibold text-gray-900">
            {move ? `${move.moveNumber}. ${move.san}` : "No move selected"}
          </p>
        </div>
        {isBookMove ? (
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-[#7b4a24] text-white">Book</span>
        ) : label ? (
          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${styles?.badge || ""}`}>{label}</span>
        ) : (
          <span className="text-xs text-gray-400">Awaiting engine</span>
        )}
      </div>

      {move ? (
        isBookMove ? (
          bookBlock
        ) : label ? (
          qualityBlock
        ) : awaitingEvaluation ? (
          lastRenderable ?? <p className="text-sm text-gray-500">Waiting for engine evaluation to classify this move…</p>
        ) : (
          lastRenderable ?? <p className="text-sm text-gray-500">Waiting for engine evaluation to classify this move…</p>
        )
      ) : (
        <p className="text-sm text-gray-500">Select a move to view its classification.</p>
      )}
    </div>
  );
}
