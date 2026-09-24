"use client";

import { useEffect, useMemo, useState } from "react";
import { emptyCast, EkeleCast, type CastSeeds } from "@/components/EkeleCast";
import { OduPanel } from "@/components/OduPanel";
import type { BibliaRecord } from "@/lib/biblia";
import type { OduRecord } from "@/lib/odus";
import type { PatakiRecord } from "@/lib/pataki";
import type { VaultRecord } from "@/lib/vault";
import { displayName, legFromSeeds, slugFromLegs } from "@/lib/opele";

type Props = {
  sources: { id: string; label: string }[];
  records: Record<string, Record<string, OduRecord>>;
  biblia: Record<string, BibliaRecord>;
  vault: Record<string, VaultRecord>;
  patakiesBySlug: Record<string, PatakiRecord[]>;
};

type RegistroState = {
  fullName: string;
  date: string;
  casts: CastSeeds[];
  collapsed: boolean[];
  panelsOpen: boolean[];
};

const STORAGE_KEY = "ifa:registro";
const SIGNS = 3;

function todayIso() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function blank(): RegistroState {
  return {
    fullName: "",
    date: "",
    casts: [emptyCast(), emptyCast(), emptyCast()],
    collapsed: [false, false, false],
    panelsOpen: [true, false, false],
  };
}

export function Registro({ sources, records, biblia, vault, patakiesBySlug }: Props) {
  const [source, setSource] = useState(sources[0]?.id ?? "");
  const [form, setForm] = useState<RegistroState>(blank);
  const [ready, setReady] = useState(false);
  const bySlug = records[source] ?? {};

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<RegistroState>;
        setForm({
          fullName: saved.fullName ?? "",
          date: saved.date || todayIso(),
          casts: Array.from({ length: SIGNS }, (_, i) => saved.casts?.[i] ?? emptyCast()),
          collapsed: Array.from({ length: SIGNS }, (_, i) => Boolean(saved.collapsed?.[i])),
          panelsOpen: Array.from({ length: SIGNS }, (_, i) =>
            Array.isArray(saved.panelsOpen) ? Boolean(saved.panelsOpen[i]) : i === 0,
          ),
        });
      } else {
        setForm((prev) => ({ ...prev, date: todayIso() }));
      }
    } catch {
      setForm((prev) => ({ ...prev, date: todayIso() }));
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
  }, [form, ready]);

  function setCast(index: number, next: CastSeeds) {
    setForm((prev) => {
      const casts = [...prev.casts];
      casts[index] = next;
      return { ...prev, casts };
    });
  }

  function collapseAll() {
    setForm((prev) => ({ ...prev, collapsed: prev.collapsed.map(() => true) }));
  }

  function expandAll() {
    setForm((prev) => ({ ...prev, collapsed: prev.collapsed.map(() => false) }));
  }

  const resolved = useMemo(
    () =>
      form.casts.map((cast) => {
        const right = legFromSeeds(cast.right);
        const left = legFromSeeds(cast.left);
        if (!right || !left) return null;
        const slug = slugFromLegs(right, left);
        return {
          right,
          left,
          slug,
          found: bySlug[slug] ?? null,
          rightMeji: bySlug[right] ?? null,
          leftMeji: bySlug[left] ?? null,
        };
      }),
    [form.casts, bySlug],
  );

  function togglePanel(index: number) {
    setForm((prev) => {
      const panelsOpen = [...prev.panelsOpen];
      panelsOpen[index] = !panelsOpen[index];
      return { ...prev, panelsOpen };
    });
  }

  const allCollapsed = form.collapsed.every(Boolean);
  const openCount = form.panelsOpen.filter(Boolean).length;

  return (
    <div className="mx-auto max-w-[92rem] px-4 py-10">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#C4A574]">Consulta</p>
      <h1 className="mt-1 font-serif text-4xl text-[#241B16]">Registro</h1>
      <p className="mt-2 max-w-2xl text-sm text-[#6D5E52]">
        Tres signos a la misma altura, de derecha a izquierda. Enciende o apaga las semillas de cada ekele.
      </p>

      <div className="mt-8 grid gap-4 border border-[#EADBCE] bg-white p-5 sm:grid-cols-2">
        <label className="block text-[11px] uppercase tracking-wider text-[#6D5E52]">
          Nombre completo
          <input
            type="text"
            autoComplete="name"
            value={form.fullName}
            onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
            className="mt-1 w-full border border-[#EADBCE] bg-[#FAF7F2] px-3 py-2 text-sm normal-case tracking-normal text-[#241B16]"
            placeholder="Nombre y apellidos"
          />
        </label>
        <label className="block text-[11px] uppercase tracking-wider text-[#6D5E52]">
          Fecha del registro
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
            className="mt-1 w-full border border-[#EADBCE] bg-[#FAF7F2] px-3 py-2 text-sm normal-case tracking-normal text-[#241B16]"
          />
        </label>
        {sources.length > 1 ? (
          <label className="block text-[11px] uppercase tracking-wider text-[#6D5E52] sm:col-span-2">
            Fuente
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="mt-1 w-full border border-[#EADBCE] bg-[#FAF7F2] px-3 py-2 text-sm normal-case tracking-normal text-[#241B16]"
            >
              {sources.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      {!allCollapsed ? (
        <div className="mt-10 overflow-x-auto">
          <div className="flex min-h-[420px] min-w-[720px] flex-row-reverse items-stretch justify-center gap-4 md:gap-8">
            {form.casts.map((cast, index) => (
              <div
                key={index}
                className="flex w-[230px] shrink-0 flex-col border border-[#EADBCE] bg-white px-3 py-4"
              >
                <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-[#C4A574]">
                  Tirada {index + 1}
                </p>
                <EkeleCast compact value={cast} onChange={(next) => setCast(index, next)} />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-10 flex h-[78vh] flex-row-reverse items-stretch gap-2">
        {form.casts.map((_, index) => {
          const odu = resolved[index];
          const expanded = form.panelsOpen[index];
          const label = odu ? displayName(odu.right, odu.left) : "Sin marca";
          return (
            <article
              key={index}
              className={`flex min-h-0 flex-col border border-[#EADBCE] bg-white ${
                expanded ? "min-w-0 flex-1" : "w-14 shrink-0"
              }`}
            >
              <button
                type="button"
                onClick={() => togglePanel(index)}
                aria-expanded={expanded}
                className={
                  expanded
                    ? "flex shrink-0 items-center justify-between gap-3 px-4 py-3 text-left"
                    : "flex h-full min-h-[16rem] flex-col items-center justify-start gap-3 px-1 py-4"
                }
              >
                {expanded ? (
                  <>
                    <span>
                      <span className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-[#C4A574]">
                        Tirada {index + 1}
                      </span>
                      <span className="mt-0.5 block font-serif text-lg text-[#241B16]">{label}</span>
                    </span>
                    <span className="text-xs text-[#6D5E52]" aria-hidden>
                      –
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-xs text-[#6D5E52]" aria-hidden>
                      +
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#C4A574] [writing-mode:vertical-rl]">
                      Tirada {index + 1}
                    </span>
                    <span className="font-serif text-sm text-[#241B16] [writing-mode:vertical-rl]">{label}</span>
                  </>
                )}
              </button>
              {expanded ? (
                <section className="min-h-0 flex-1 overflow-y-auto border-t border-[#EADBCE] px-4 py-4">
                  {odu ? (
                    <OduPanel
                      compact={openCount > 1}
                      scope={`registro-${index}`}
                      right={odu.right}
                      left={odu.left}
                      biblia={biblia[odu.slug] ?? null}
                      vault={vault[odu.slug] ?? null}
                      patakies={patakiesBySlug[odu.slug] ?? []}
                      dafa={odu.found}
                      rightMeji={odu.rightMeji}
                      leftMeji={odu.leftMeji}
                    />
                  ) : (
                    <p className="text-sm text-[#6D5E52]">
                      Enciende o apaga las semillas de esta tirada para formar el signo.
                    </p>
                  )}
                </section>
              ) : null}
            </article>
          );
        })}
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-[#EADBCE] pt-4">
        <p className="text-sm text-[#6D5E52]">Más espacio para leer las secciones de cada tirada.</p>
        <button
          type="button"
          onClick={allCollapsed ? expandAll : collapseAll}
          className="border border-[#EADBCE] bg-white px-4 py-2 text-xs uppercase tracking-wider text-[#241B16]"
        >
          {allCollapsed ? "Mostrar ekeles" : "Colapsar ekeles"}
        </button>
      </div>
    </div>
  );
}
