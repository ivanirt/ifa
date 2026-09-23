"use client";

import type { Seed } from "@/lib/opele";

function Cowrie({ closed, onClick }: { closed: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={closed}
      className="group relative flex h-16 w-12 items-center justify-center focus:outline-none"
      title={closed ? "Cerrado (II) — pulsa para abrir" : "Abierto (I) — pulsa para cerrar"}
    >
      <svg viewBox="0 0 48 64" className="h-14 w-11 drop-shadow-sm transition group-hover:scale-[1.04]">
        <ellipse
          cx="24"
          cy="32"
          rx="18"
          ry="26"
          fill={closed ? "#8C5A32" : "#F7F1E6"}
          stroke={closed ? "#6B4224" : "#C4A574"}
          strokeWidth="1.6"
        />
        {!closed ? (
          <>
            <ellipse cx="24" cy="32" rx="8" ry="14" fill="#E8D4B0" stroke="#C4A574" strokeWidth="1" />
            <path d="M24 20 C20 32 20 32 24 44 C28 32 28 32 24 20" fill="#FAF7F2" opacity="0.9" />
          </>
        ) : (
          <ellipse cx="24" cy="30" rx="7" ry="11" fill="#6B4224" opacity="0.35" />
        )}
      </svg>
    </button>
  );
}

export function Ekele({
  right,
  left,
  throwing,
  onToggle,
}: {
  right: [Seed, Seed, Seed, Seed];
  left: [Seed, Seed, Seed, Seed];
  throwing: boolean;
  onToggle: (side: "right" | "left", index: number) => void;
}) {
  return (
    <div className={`relative mx-auto w-full max-w-[220px] ${throwing ? "animate-throw" : ""}`}>
      <div className="rounded-sm border border-[#EADBCE] bg-white px-6 py-5">
        <div className="grid grid-cols-2 gap-x-8">
          <div className="flex flex-col items-center">
            {left.map((closed, i) => (
              <Cowrie key={`l${i}`} closed={closed} onClick={() => onToggle("left", i)} />
            ))}
          </div>
          <div className="flex flex-col items-center">
            {right.map((closed, i) => (
              <Cowrie key={`r${i}`} closed={closed} onClick={() => onToggle("right", i)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
