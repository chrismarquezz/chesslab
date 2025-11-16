interface GameReviewHeaderProps {
  analysisReady: boolean;
  onLoadNewPGN: () => void;
}

export default function GameReviewHeader({ analysisReady, onLoadNewPGN }: GameReviewHeaderProps) {
  if (!analysisReady) {
    return null;
  }
  return (
    <div className="flex justify-end">
      <button
        onClick={onLoadNewPGN}
        className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition"
      >
        Load New PGN
      </button>
    </div>
  );
}
