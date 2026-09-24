"use client";

import { useState } from "react";
import { Ekele } from "@/components/Ekele";
import {
  displayName,
  LEG_LABEL,
  LEG_PATTERN,
  LEGS,
  legFromSeeds,
  type LegId,
  type Seed,
} from "@/lib/opele";

export const OPEN: [Seed, Seed, Seed, Seed] = [false, false, false, false];

export type CastSeeds = {
  right: [Seed, Seed, Seed, Seed];
  left: [Seed, Seed, Seed, Seed];
};

export function emptyCast(): CastSeeds {
  return { right: [...OPEN] as CastSeeds["right"], left: [...OPEN] as CastSeeds["left"] };
}

function randomLeg(): [Seed, Seed, Seed, Seed] {
  return [0, 1, 2, 3].map(() => Math.random() < 0.5) as [Seed, Seed, Seed, Seed];
}

export function EkeleCast({
  value,
  onChange,
  sourceLabel,
  compact = false,
}: {
  value: CastSeeds;
  onChange: (next: CastSeeds) => void;
  sourceLabel?: string;
  compact?: boolean;
}) {
  const [throwing, setThrowing] = useState(false);
  const rightLeg = legFromSeeds(value.right);
  const leftLeg = legFromSeeds(value.left);

  function toggle(side: "right" | "left", index: number) {
    const next = {
      right: [...value.right] as CastSeeds["right"],
      left: [...value.left] as CastSeeds["left"],
    };
    next[side][index] = !next[side][index];
    onChange(next);
  }

  function throwChain() {
    setThrowing(true);
    window.setTimeout(() => {
      onChange({ right: randomLeg(), left: randomLeg() });
      setThrowing(false);
    }, 520);
  }

  function setLeg(side: "right" | "left", id: LegId) {
    const pat = LEG_PATTERN[id];
    onChange({
      ...value,
      [side]: [...pat] as CastSeeds["right"],
    });
  }

  return (
    <div>
      {sourceLabel ? (
        <p className="mb-4 text-xs uppercase tracking-[0.22em] text-[#6D5E52]">{sourceLabel}</p>
      ) : null}

      <Ekele right={value.right} left={value.left} throwing={throwing} onToggle={toggle} />

      {compact ? null : (
      <button
        type="button"
        onClick={throwChain}
        className="mt-5 w-full bg-[#241B16] py-2.5 text-xs uppercase tracking-wider text-[#FAF7F2]"
      >
        Lanzar el ekele
      </button>
      )}

      {compact ? null : (
      <div className="mt-6 grid grid-cols-2 gap-2">
        {(["left", "right"] as const).map((side) => (
          <label key={side} className="text-[11px] uppercase tracking-wider text-[#6D5E52]">
            {side === "right" ? "Pierna der." : "Pierna izq."}
            <select
              value={(side === "right" ? rightLeg : leftLeg) ?? ""}
              onChange={(e) => setLeg(side, e.target.value as LegId)}
              className="mt-1 w-full border border-[#EADBCE] bg-white px-2 py-1.5 text-xs normal-case tracking-normal text-[#241B16]"
            >
              <option value="" disabled>
                —
              </option>
              {LEGS.map((id) => (
                <option key={id} value={id}>
                  {LEG_LABEL[id]}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      )}

      <p className={`mt-4 text-center font-serif ${compact ? "text-base" : "text-lg"} text-[#241B16]`}>
        {rightLeg && leftLeg ? displayName(rightLeg, leftLeg) : "Marca no reconocida"}
      </p>
    </div>
  );
}
