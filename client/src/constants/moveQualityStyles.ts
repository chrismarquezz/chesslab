import type { MoveQualityLabel } from "../types/review";

export const MOVE_QUALITY_STYLES: Record<
  MoveQualityLabel,
  { badge: string; text: string; border: string; background: string }
> = {
  Best: {
    badge: "bg-emerald-100 text-emerald-700",
    text: "text-emerald-700",
    border: "border-emerald-200",
    background: "bg-emerald-50",
  },
  Good: {
    badge: "bg-sky-100 text-sky-700",
    text: "text-sky-700",
    border: "border-sky-200",
    background: "bg-sky-50",
  },
  Inaccuracy: {
    badge: "bg-amber-100 text-amber-700",
    text: "text-amber-700",
    border: "border-amber-200",
    background: "bg-amber-50",
  },
  Mistake: {
    badge: "bg-orange-100 text-orange-700",
    text: "text-orange-700",
    border: "border-orange-200",
    background: "bg-orange-50",
  },
  Blunder: {
    badge: "bg-red-100 text-red-700",
    text: "text-red-700",
    border: "border-red-200",
    background: "bg-red-50",
  },
  Forced: {
    badge: "bg-gray-200 text-gray-700",
    text: "text-gray-700",
    border: "border-gray-200",
    background: "bg-gray-50",
  },
};
