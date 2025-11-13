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
  onClose: () => void;
}

export default function ThemeSelectorModal({ open, themes, selectedKey, onSelect, onClose }: ThemeSelectorModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-800">Choose Board Theme</h3>
            <p className="text-sm text-gray-500">Preview square colors and pick your favorite look.</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="Close theme chooser">
            ✕
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Object.entries(themes).map(([key, theme]) => (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className={`rounded-2xl border px-4 py-3 flex flex-col items-center gap-3 transition ${
                selectedKey === key ? "border-[#00bfa6] shadow-md" : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex gap-1">
                <span className="w-6 h-6 rounded" style={{ backgroundColor: theme.light }} aria-hidden="true" />
                <span className="w-6 h-6 rounded" style={{ backgroundColor: theme.dark }} aria-hidden="true" />
              </div>
              <p className="text-sm font-semibold text-gray-700">{theme.label}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
