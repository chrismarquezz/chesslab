import type { Dispatch, SetStateAction } from "react";

export type ModeOption = "all" | "blitz" | "rapid" | "bullet";

interface GamesFilterBarProps {
  selectedMode: ModeOption;
  setSelectedMode: Dispatch<SetStateAction<ModeOption>>;
  onRefresh: () => void;
}

export default function GamesFilterBar({ selectedMode, setSelectedMode, onRefresh }: GamesFilterBarProps) {
  const modes: ModeOption[] = ["all", "blitz", "rapid", "bullet"];

  return (
    <div className="bg-white shadow-md rounded-xl p-4 flex flex-wrap justify-between items-center gap-4 border border-gray-200 mb-6">
      <div className="flex flex-col gap-3 flex-1">
        <div className="flex flex-wrap gap-2">
          {modes.map((mode) => (
            <button
              key={mode}
              onClick={() => setSelectedMode(mode)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium border transition ${
                selectedMode === mode
                  ? "bg-[#00bfa6] text-white border-[#00bfa6]"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
        <button
          onClick={onRefresh}
          className="bg-[#00bfa6] hover:bg-[#00d6b5] text-white font-medium px-4 py-2 rounded-md transition"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
