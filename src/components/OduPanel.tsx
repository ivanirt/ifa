"use client";

import { useState, type PointerEvent, type ReactNode } from "react";
import { MarkdownView } from "@/components/MarkdownView";
import type { BibliaRecord } from "@/lib/biblia";
import type { OduRecord } from "@/lib/odus";
import type { PatakiRecord } from "@/lib/pataki";
import { findPatakiForLine } from "@/lib/pataki";
import type { VaultRecord } from "@/lib/vault";
import { displayName, LEG_LABEL, type LegId } from "@/lib/opele";
import {
  SECTION_LABEL,
  useSectionLayout,
  type SectionId,
} from "@/hooks/useSectionLayout";

function PatakiBrowser({ files, vaultMd }: { files: PatakiRecord[]; vaultMd: string }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const selected = files.find((item) => item.id === openId) ?? null;
  const vaultLines = vaultMd
    .split("\n")
    .filter((line) => /^\s*[-*]/.test(line))
    .map((line) =>
      line
        .replace(/^\s*[-*]\s+/, "")
        .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
        .replace(/\[\[([^\]]+)\]\]/g, "$1")
        .trim(),
    )
    .filter(Boolean);
  const unmatched = vaultLines.filter((line) => !findPatakiForLine(line, files));

  return (
    <div>
      {files.length ? (
        <ul className="space-y-1">
          {files.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setOpenId(openId === item.id ? null : item.id)}
                aria-pressed={openId === item.id}
                className={`w-full px-2 py-1.5 text-left text-sm leading-snug ${
                  openId === item.id
                    ? "bg-[#F7F1E6] text-[#241B16]"
                    : "text-[#6D5E52] hover:bg-[#FAF7F2]"
                }`}
              >
                <span className="mr-2 text-[11px] uppercase tracking-wider text-[#C4A574]">
                  {String(item.order).padStart(2, "0")}
                </span>
                {item.title}
              </button>
            </li>
          ))}
        </ul>
      ) : unmatched.length ? null : (
        <p className="text-sm text-[#6D5E52]">—</p>
      )}
      {unmatched.length ? (
        <div className={files.length ? "mt-4" : ""}>
          {files.length ? (
            <p className="mb-2 text-[11px] uppercase tracking-wider text-[#C4A574]">En el odú</p>
          ) : null}
          <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-[#6D5E52]">
            {unmatched.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {selected ? (
        <div className="mt-5 border-t border-[#EADBCE] pt-4">
          <MarkdownView source={selected.body} />
        </div>
      ) : files.length ? (
        <p className="mt-4 text-sm text-[#6D5E52]">Selecciona un patakí para leerlo.</p>
      ) : null}
    </div>
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

function Section({
  id,
  collapsed,
  dragging,
  dropTarget,
  onToggle,
  onDragStart,
  onDragMove,
  onDragEnd,
  children,
}: {
  id: SectionId;
  collapsed: boolean;
  dragging: boolean;
  dropTarget: boolean;
  onToggle: () => void;
  onDragStart: (event: PointerEvent<HTMLButtonElement>) => void;
  onDragMove: (event: PointerEvent<HTMLElement>) => void;
  onDragEnd: () => void;
  children: ReactNode;
}) {
  const { kicker, source } = SECTION_LABEL[id];
  return (
    <section
      data-section={id}
      className={`border bg-white ${
        dropTarget ? "border-[#C4A574]" : "border-[#EADBCE]"
      } ${dragging ? "opacity-50" : ""}`}
    >
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          type="button"
          aria-label={`Mover ${kicker}`}
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
          className="shrink-0 cursor-grab touch-none px-1 py-2 text-[#C4A574] active:cursor-grabbing"
        >
          <span aria-hidden className="block leading-none tracking-[0.2em]">
            ⋮⋮
          </span>
        </button>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={!collapsed}
          className="min-w-0 flex-1 text-left"
        >
          <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#6D5E52]">
            {source}
          </span>
          <span className="mt-0.5 block text-[11px] font-semibold uppercase tracking-[0.22em] text-[#C4A574]">
            {kicker}
          </span>
        </button>
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? `Expandir ${kicker}` : `Colapsar ${kicker}`}
          className="px-2 py-1 text-xs text-[#6D5E52]"
        >
          {collapsed ? "+" : "–"}
        </button>
      </div>
      {collapsed ? null : <div className="border-t border-[#EADBCE] px-5 py-4">{children}</div>}
    </section>
  );
}

export function OduPanel({
  scope = "lectura",
  compact = false,
  right,
  left,
  biblia,
  vault,
  patakies,
  dafa,
  rightMeji,
  leftMeji,
}: {
  scope?: string;
  compact?: boolean;
  right: LegId;
  left: LegId;
  biblia: BibliaRecord | null;
  vault: VaultRecord | null;
  patakies: PatakiRecord[];
  dafa: OduRecord | null;
  rightMeji: OduRecord | null;
  leftMeji: OduRecord | null;
}) {
  const name = displayName(right, left);
  const meji = right === left;
  const { order, collapsed, reorder, toggle } = useSectionLayout();
  const [dragId, setDragId] = useState<SectionId | null>(null);
  const [overId, setOverId] = useState<SectionId | null>(null);

  function dragStart(event: PointerEvent<HTMLButtonElement>, id: SectionId) {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragId(id);
    setOverId(id);
  }

  function dragMove(event: PointerEvent<HTMLElement>) {
    if (!dragId) return;
    const hit = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest(`[data-scope="${scope}"] [data-section]`);
    const next = hit?.getAttribute("data-section") as SectionId | null;
    if (next) setOverId(next);
  }

  function dragEnd() {
    if (dragId && overId) reorder(dragId, overId);
    setDragId(null);
    setOverId(null);
  }

  const bodies: Record<SectionId, ReactNode> = {
    esencia: biblia ? (
      <MarkdownView source={biblia.essence} />
    ) : (
      <p className="text-sm text-[#6D5E52]">Este odú aún no está en Biblia_IFA.</p>
    ),
    correspondencias: (
      <>
        <p className="text-[11px] uppercase tracking-wider text-[#C4A574]">Partes del cuerpo</p>
        <Chips items={biblia?.bodyParts ?? []} />
        <p className="mt-4 text-[11px] uppercase tracking-wider text-[#C4A574]">Aspectos clave</p>
        <Chips items={biblia?.keyAspects ?? []} />
      </>
    ),
    refranes: <MarkdownView source={biblia?.sayingsMd ?? ""} />,
    nace: <MarkdownView source={vault?.bornMd ?? ""} />,
    diceIfa: <MarkdownView source={vault?.diceIfaMd ?? ""} />,
    patakies: (
      <PatakiBrowser
        files={patakies}
        vaultMd={vault?.patakiesMd ?? ""}
      />
    ),
    nota: <MarkdownView source={vault?.bodyMd ?? ""} />,
    ireIbi: dafa ? (
      <>
        {dafa.keyPhrase ? (
          <p className="font-serif text-2xl leading-snug text-[#241B16]">{dafa.keyPhrase}</p>
        ) : null}
        {dafa.principle ? (
          <div className="mt-2">
            <MarkdownView source={dafa.principle} />
          </div>
        ) : null}
        <p className={`${dafa.keyPhrase || dafa.principle ? "mt-5" : ""} text-[11px] font-semibold uppercase tracking-[0.22em] text-[#C4A574]`}>
          Ire
        </p>
        <h3 className="mt-2 font-serif text-xl text-[#241B16]">{dafa.ire || "—"}</h3>
        {dafa.ireNote ? (
          <div className="mt-2">
            <MarkdownView source={dafa.ireNote} />
          </div>
        ) : null}
        <div className="my-5 border-t border-[#EADBCE]" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#C4A574]">
          Ibi / Osogbo
        </p>
        <h3 className="mt-2 font-serif text-xl text-[#241B16]">{dafa.ibi || "—"}</h3>
        {dafa.ibiNote ? (
          <div className="mt-2">
            <MarkdownView source={dafa.ibiNote} />
          </div>
        ) : null}
      </>
    ) : (
      <p className="text-sm text-[#6D5E52]">Esta combinación no está en DAFA.</p>
    ),
    significado: (
      <div className="grid gap-6 sm:grid-cols-2 sm:gap-8">
        <div className="sm:border-r sm:border-[#EADBCE] sm:pr-8">
          <p className="text-[11px] uppercase tracking-wider text-[#C4A574]">{LEG_LABEL[right]}</p>
          <h3 className="mt-2 font-serif text-xl text-[#241B16]">
            {rightMeji?.keyPhrase || LEG_LABEL[right]}
          </h3>
          {rightMeji?.principle ? (
            <div className="mt-2">
              <MarkdownView source={rightMeji.principle} />
            </div>
          ) : null}
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-[#C4A574]">{LEG_LABEL[left]}</p>
          <h3 className="mt-2 font-serif text-xl text-[#241B16]">
            {leftMeji?.keyPhrase || LEG_LABEL[left]}
          </h3>
          {leftMeji?.principle ? (
            <div className="mt-2">
              <MarkdownView source={leftMeji.principle} />
            </div>
          ) : null}
        </div>
      </div>
    ),
    notas: <MarkdownView source={dafa?.notes ?? ""} />,
  };

  return (
    <div className="animate-fade space-y-6">
      <div>
        <h2 className={`font-serif tracking-tight text-[#241B16] ${compact ? "text-2xl" : "text-4xl sm:text-5xl"}`}>
          {biblia?.title || name}
        </h2>
        <p className="mt-2 text-sm text-[#6D5E52]">
          {LEG_LABEL[right]} a la derecha
          {meji ? " — ambas piernas iguales" : ` · ${LEG_LABEL[left]} a la izquierda`}
        </p>
      </div>

      <div data-scope={scope} className={`space-y-3 ${dragId ? "select-none" : ""}`}>
        {order.map((id) => (
          <Section
            key={id}
            id={id}
            collapsed={Boolean(collapsed[id])}
            dragging={dragId === id}
            dropTarget={Boolean(dragId && overId === id && dragId !== id)}
            onToggle={() => toggle(id)}
            onDragStart={(event) => dragStart(event, id)}
            onDragMove={dragMove}
            onDragEnd={dragEnd}
          >
            {bodies[id]}
          </Section>
        ))}
      </div>
    </div>
  );
}
