interface ColorSummary {
  accuracy: number | null;
  moves: number;
  counts: Record<string, number>;
}

interface SeveritySummaryCardProps {
  white: ColorSummary;
  black: ColorSummary;
}

export default function SeveritySummaryCard({ white, black }: SeveritySummaryCardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <ColorCard title="White" summary={white} accent="text-[#00bfa6]" />
      <ColorCard title="Black" summary={black} accent="text-gray-800" />
    </div>
  );
}

function ColorCard({
  title,
  summary,
  accent,
}: {
  title: string;
  summary: ColorSummary;
  accent: string;
}) {
  const { accuracy, moves, counts } = summary;
  const label = accuracy == null ? "—" : `${accuracy.toFixed(1)}%`;

  return (
    <div className="bg-white shadow-lg rounded-2xl border border-gray-200 p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm uppercase tracking-wide text-gray-500">{title}</p>
        <p className={`text-2xl font-bold ${accent}`}>{label}</p>
      </div>
      <p className="text-xs text-gray-500">{moves ? `${moves} moves reviewed` : "No moves reviewed yet"}</p>
      <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
        <Stat label="Best" value={counts.best ?? 0} accent="text-emerald-600" />
        <Stat label="Good" value={counts.good ?? 0} accent="text-blue-600" />
        <Stat label="Inaccuracies" value={counts.inaccuracy ?? 0} accent="text-amber-600" />
        <Stat label="Mistakes" value={counts.mistake ?? 0} accent="text-orange-600" />
        <Stat label="Blunders" value={counts.blunder ?? 0} accent="text-red-600" />
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-lg font-semibold ${accent}`}>{value}</span>
    </div>
  );
}
