import type { ReactNode } from "react";

interface BoardControlButtonProps {
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  children: ReactNode;
  label: string;
}

export default function BoardControlButton({ onClick, disabled, active, children, label }: BoardControlButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`h-10 w-10 flex items-center justify-center rounded-full border transition-colors ${
        active ? "border-[#00bfa6] text-[#00bfa6] bg-[#00bfa6]/10" : "border-gray-200 text-gray-600 hover:bg-gray-100"
      } disabled:opacity-40`}
    >
      {children}
    </button>
  );
}
