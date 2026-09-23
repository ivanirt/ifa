"use client";

import type { ReactNode } from "react";
import type { BibliaRecord } from "@/lib/biblia";
import type { OduRecord } from "@/lib/odus";
import { displayName, LEG_LABEL, type LegId } from "@/lib/opele";

function Card({
  kicker,
  title,
  body,
  tone = "white",
}: {
  kicker: string;
  title: string;
  body?: string;
  tone?: "cream" | "white";
}) {
  return (
    <article
      className={`border border-[#EADBCE] p-5 ${tone === "white" ? "bg-white" : "bg-[#F7F1E6]"}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#C4A574]">{kicker}</p>
      <h3 className="mt-2 font-serif text-xl text-[#241B16]">{title}</h3>
      {body ? <p className="mt-2 text-sm leading-relaxed text-[#6D5E52]">{body}</p> : null}
    </article>
  );
}

function Chips({ items }: { items: string[] }) {
  if (!items.length) return <p className="text-sm text-[#6D5E52]">—</p>;
  return (
    <ul className="mt-2 flex flex-wrap gap-2">
      {items.map((item) => (
        <li
          key={item}
          className="border border-[#EADBCE] bg-[#FAF7F2] px-2.5 py-1 text-sm text-[#241B16]"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function Block({ kicker, children }: { kicker: string; children: ReactNode }) {
  return (
    <section className="border border-[#EADBCE] bg-white p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#C4A574]">{kicker}</p>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function OduPanel({
  right,
  left,
  biblia,
  dafa,
  rightMeji,
  leftMeji,
}: {
  right: LegId;
  left: LegId;
  biblia: BibliaRecord | null;
  dafa: OduRecord | null;
  rightMeji: OduRecord | null;
  leftMeji: OduRecord | null;
}) {
  const name = displayName(right, left);
  const meji = right === left;

  return (
    <div className="animate-fade space-y-8">
      <div>
        <h2 className="font-serif text-4xl tracking-tight text-[#241B16] sm:text-5xl">
          {biblia?.title || name}
        </h2>
        <p className="mt-2 text-sm text-[#6D5E52]">
          {LEG_LABEL[right]} a la derecha
          {meji ? " — ambas piernas iguales" : ` · ${LEG_LABEL[left]} a la izquierda`}
        </p>
      </div>

      <div className="space-y-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#6D5E52]">
          Biblia Ifá
        </p>
        {biblia ? (
          <>
            <Block kicker="Esencia">
              <p className="text-sm leading-relaxed text-[#6D5E52]">{biblia.essence || "—"}</p>
            </Block>
            <Block kicker="Correspondencias">
              <p className="text-[11px] uppercase tracking-wider text-[#C4A574]">Partes del cuerpo</p>
              <Chips items={biblia.bodyParts} />
              <p className="mt-4 text-[11px] uppercase tracking-wider text-[#C4A574]">Aspectos clave</p>
              <Chips items={biblia.keyAspects} />
            </Block>
            <Block kicker="Refranes">
              {biblia.sayings.length ? (
                <ul className="space-y-2">
                  {biblia.sayings.map((line) => (
                    <li key={line} className="font-serif text-lg leading-snug text-[#241B16]">
                      {line}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[#6D5E52]">—</p>
              )}
            </Block>
          </>
        ) : (
          <p className="border border-[#EADBCE] bg-white px-4 py-3 text-sm text-[#6D5E52]">
            Este odú aún no está en Biblia_IFA.
          </p>
        )}
      </div>

      <div className="space-y-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#6D5E52]">DAFA</p>
        {dafa ? (
          <>
            {dafa.keyPhrase ? (
              <p className="font-serif text-2xl leading-snug text-[#241B16]">{dafa.keyPhrase}</p>
            ) : null}
            {dafa.principle ? <p className="text-[#6D5E52] leading-relaxed">{dafa.principle}</p> : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <Card kicker="Ire" title={dafa.ire || "—"} body={dafa.ireNote} tone="white" />
              <Card kicker="Ibi" title={dafa.ibi || "—"} body={dafa.ibiNote} tone="white" />
            </div>
            {dafa.notes ? (
              <Block kicker="Notas">
                <p className="text-sm leading-relaxed text-[#6D5E52]">{dafa.notes}</p>
              </Block>
            ) : null}
          </>
        ) : (
          <p className="border border-[#EADBCE] bg-white px-4 py-3 text-sm text-[#6D5E52]">
            Esta combinación no está en DAFA. {meji ? "" : "Abajo van los principios de cada pierna."}
          </p>
        )}
        {!meji ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Card
              kicker={LEG_LABEL[right]}
              title={rightMeji?.keyPhrase || LEG_LABEL[right]}
              body={rightMeji?.principle}
            />
            <Card
              kicker={LEG_LABEL[left]}
              title={leftMeji?.keyPhrase || LEG_LABEL[left]}
              body={leftMeji?.principle}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
