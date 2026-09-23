"use client";

import { useMemo, useState } from "react";
import { Ekele } from "@/components/Ekele";
import { OduPanel } from "@/components/OduPanel";
import type { BibliaRecord } from "@/lib/biblia";
import type { OduRecord } from "@/lib/odus";
import {
  displayName,
  LEG_LABEL,
  LEG_PATTERN,
  LEGS,
  legFromSeeds,
  slugFromLegs,
  type LegId,
  type Seed,
} from "@/lib/opele";

type Props = {
  sources: { id: string; label: string }[];
  records: Record<string, Record<string, OduRecord>>;
  biblia: Record<string, BibliaRecord>;
};

const OPEN: [Seed, Seed, Seed, Seed] = [false, false, false, false];

export function Studio({ sources, records, biblia }: Props) {
  const [source, setSource] = useState(sources[0]?.id ?? "");
  const [right, setRight] = useState<[Seed, Seed, Seed, Seed]>(OPEN);
  const [left, setLeft] = useState<[Seed, Seed, Seed, Seed]>(OPEN);
  const [throwing, setThrowing] = useState(false);

  const rightLeg = legFromSeeds(right);
  const leftLeg = legFromSeeds(left);
  const bySlug = records[source] ?? {};

  const resolved = useMemo(() => {
    if (!rightLeg || !leftLeg) return null;
    const slug = slugFromLegs(rightLeg, leftLeg);
    return {
      slug,
      found: bySlug[slug] ?? null,
      rightMeji: bySlug[rightLeg] ?? null,
      leftMeji: bySlug[leftLeg] ?? null,
    };
  }, [rightLeg, leftLeg, bySlug]);

  function toggle(side: "right" | "left", index: number) {
    const setter = side === "right" ? setRight : setLeft;
    setter((prev) => {
      const next = [...prev] as [Seed, Seed, Seed, Seed];
      next[index] = !next[index];
      return next;
    });
  }

  function throwChain() {
    setThrowing(true);
    window.setTimeout(() => {
      const rand = () =>
        [0, 1, 2, 3].map(() => Math.random() < 0.5) as [Seed, Seed, Seed, Seed];
      setRight(rand());
      setLeft(rand());
      setThrowing(false);
    }, 520);
  }

  function setLeg(side: "right" | "left", id: LegId) {
    const pat = LEG_PATTERN[id];
    if (side === "right") setRight(pat);
    else setLeft(pat);
  }

  return (
    <div id="ekele" className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[280px_1fr] lg:gap-14">
      <aside className="lg:sticky lg:top-6 lg:self-start">
        {sources.length > 1 ? (
          <label className="mb-4 block text-sm text-[#6D5E52]">
            Fuente
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="mt-1 w-full border border-[#EADBCE] bg-white px-3 py-2 text-sm text-[#241B16]"
            >
              {sources.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className="mb-4 text-xs uppercase tracking-[0.22em] text-[#6D5E52]">{sources[0]?.label}</p>
        )}

        <Ekele right={right} left={left} throwing={throwing} onToggle={toggle} />

        <button
          type="button"
          onClick={throwChain}
          className="mt-5 w-full bg-[#241B16] py-2.5 text-xs uppercase tracking-wider text-[#FAF7F2]"
        >
          Lanzar el ekele
        </button>

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

        <p className="mt-4 text-center font-serif text-lg text-[#241B16]">
          {rightLeg && leftLeg ? displayName(rightLeg, leftLeg) : "Marca no reconocida"}
        </p>
      </aside>

      <section id="lectura" className="min-h-[420px]">
        {rightLeg && leftLeg && resolved ? (
          <OduPanel
            right={rightLeg}
            left={leftLeg}
            biblia={biblia[resolved.slug] ?? null}
            dafa={resolved.found}
            rightMeji={resolved.rightMeji}
            leftMeji={resolved.leftMeji}
          />
        ) : (
          <p className="text-[#6D5E52]">Pulsa las semillas hasta formar las cuatro marcas de cada pierna.</p>
        )}
      </section>
    </div>
  );
}
