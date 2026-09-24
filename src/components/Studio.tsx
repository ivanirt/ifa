"use client";

import { useMemo, useState } from "react";
import { emptyCast, EkeleCast, type CastSeeds } from "@/components/EkeleCast";
import { OduPanel } from "@/components/OduPanel";
import type { BibliaRecord } from "@/lib/biblia";
import type { OduRecord } from "@/lib/odus";
import type { PatakiRecord } from "@/lib/pataki";
import type { VaultRecord } from "@/lib/vault";
import { legFromSeeds, slugFromLegs } from "@/lib/opele";

type Props = {
  sources: { id: string; label: string }[];
  records: Record<string, Record<string, OduRecord>>;
  biblia: Record<string, BibliaRecord>;
  vault: Record<string, VaultRecord>;
  patakiesBySlug: Record<string, PatakiRecord[]>;
};

export function Studio({ sources, records, biblia, vault, patakiesBySlug }: Props) {
  const [source, setSource] = useState(sources[0]?.id ?? "");
  const [cast, setCast] = useState<CastSeeds>(emptyCast);

  const rightLeg = legFromSeeds(cast.right);
  const leftLeg = legFromSeeds(cast.left);
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

  return (
    <div id="ekele" className="mx-auto grid max-w-6xl gap-10 px-4 py-10 lg:grid-cols-[280px_1fr] lg:gap-14">
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#C4A574]">Consulta</p>
        <h1 className="mb-6 font-serif text-3xl text-[#241B16]">Odún del día</h1>

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

        <EkeleCast value={cast} onChange={setCast} />
      </aside>

      <section id="lectura" className="min-h-[420px]">
        {rightLeg && leftLeg && resolved ? (
          <OduPanel
            scope="dia"
            right={rightLeg}
            left={leftLeg}
            biblia={biblia[resolved.slug] ?? null}
            vault={vault[resolved.slug] ?? null}
            patakies={patakiesBySlug[resolved.slug] ?? []}
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
