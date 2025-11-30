import { useState } from "react";

interface ThemeInfo {
  light: string;
  dark: string;
  label: string;
}

interface ThemeSelectorModalProps {
  open: boolean;
  themes: Record<string, ThemeInfo>;
  selectedKey: string;
  onSelect: (key: string) => void;
  pvCount: number;
  onChangePvCount: (value: number) => void;
  pieceTheme: string;
  pieceOptions: string[];
  piecePreviews?: Record<string, { white?: string; black?: string }>;
  onSelectPiece: (key: string) => void;
  onClose: () => void;
  hideEngineTab?: boolean;
}

export default function ThemeSelectorModal({
  open,
  themes,
  selectedKey,
  onSelect,
  pvCount,
  onChangePvCount,
  pieceTheme,
  pieceOptions,
  piecePreviews,
  onSelectPiece,
  onClose,
  hideEngineTab = false,
}: ThemeSelectorModalProps) {
  const [tab, setTab] = useState<"theme" | "pieces" | "engine">("theme");
  const effectiveTab = hideEngineTab && tab === "engine" ? "theme" : tab;
  if (!open) return null;

  const clampPv = (n: number) => Math.max(1, Math.min(5, Math.round(n)));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 space-y-5 h-[520px] max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-semibold text-gray-900">Settings</h3>
            <p className="text-sm text-gray-500">Customize your chess analysis experience.</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl font-semibold" aria-label="Close settings">
            ✕
          </button>
        </div>

        <div className="flex gap-2 bg-gray-50 border border-gray-200 rounded-xl p-1">
          <button
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${effectiveTab === "theme" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"}`}
            onClick={() => setTab("theme")}
          >
            Theme
          </button>
          <button
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${effectiveTab === "pieces" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"}`}
            onClick={() => setTab("pieces")}
          >
            Pieces
          </button>
          {!hideEngineTab && (
            <button
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${effectiveTab === "engine" ? "bg-white shadow-sm text-gray-900" : "text-gray-500"}`}
              onClick={() => setTab("engine")}
            >
              Engine
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {effectiveTab === "theme" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pr-1">
              {Object.entries(themes).map(([key, theme]) => (
                <button
                  key={key}
                  onClick={() => onSelect(key)}
                  className={`rounded-xl border px-3 py-2 flex flex-col items-center gap-2 transition ${
                    selectedKey === key ? "border-[#00bfa6] shadow-md" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex gap-1">
                    <span className="w-7 h-7 rounded" style={{ backgroundColor: theme.light }} aria-hidden="true" />
                    <span className="w-7 h-7 rounded" style={{ backgroundColor: theme.dark }} aria-hidden="true" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700">{theme.label}</p>
                </button>
              ))}
            </div>
          ) : effectiveTab === "pieces" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pr-1">
                {pieceOptions.map((key) => (
                  <button
                    key={key}
                    onClick={() => onSelectPiece(key)}
                    className={`rounded-xl border px-3 py-2 flex flex-col items-center gap-2 transition ${
                      pieceTheme === key ? "border-[#00bfa6] shadow-md" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex gap-1">
                      <img src={piecePreviews?.[key]?.white ?? ""} alt="" className="w-7 h-7" />
                      <img src={piecePreviews?.[key]?.black ?? ""} alt="" className="w-7 h-7" />
                    </div>
                    <p className="text-sm font-semibold text-gray-700">
                      {key.length ? key[0].toUpperCase() + key.slice(1) : key}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">PV lines shown</p>
                  <p className="text-xs text-gray-500">Controls how many engine lines appear on the analysis card (1-5).</p>
                </div>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={pvCount}
                  onChange={(e) => onChangePvCount(clampPv(Number(e.target.value)))}
                  className="w-16 border border-gray-300 rounded-lg px-3 py-1 text-sm text-right"
                />
              </div>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={pvCount}
                onChange={(e) => onChangePvCount(clampPv(Number(e.target.value)))}
                className="w-full accent-[#00bfa6]"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
