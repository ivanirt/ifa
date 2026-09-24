"use client";

import { useEffect, useState } from "react";

export const SECTION_IDS = [
  "esencia",
  "correspondencias",
  "refranes",
  "nace",
  "diceIfa",
  "patakies",
  "nota",
  "ireIbi",
  "significado",
  "notas",
] as const;

export type SectionId = (typeof SECTION_IDS)[number];

export const SECTION_LABEL: Record<SectionId, { kicker: string; source: string }> = {
  esencia: { kicker: "Esencia", source: "Biblia Ifá" },
  correspondencias: { kicker: "Correspondencias", source: "Biblia Ifá" },
  refranes: { kicker: "Refranes", source: "Biblia Ifá" },
  nace: { kicker: "En este odún nace", source: "Dice Ifá" },
  diceIfa: { kicker: "Dice Ifá", source: "Dice Ifá" },
  patakies: { kicker: "Lista de patakíes", source: "Dice Ifá" },
  nota: { kicker: "Nota completa", source: "Dice Ifá" },
  ireIbi: { kicker: "Ire / Ibi / Osogbo", source: "DAFA" },
  significado: { kicker: "Significado", source: "DAFA" },
  notas: { kicker: "Notas", source: "DAFA" },
};

type Layout = {
  order: SectionId[];
  collapsed: Partial<Record<SectionId, boolean>>;
};

const STORAGE_KEY = "ifa:lectura-secciones";

function normalize(saved: Partial<Layout> | null): Layout {
  const seen = new Set<string>();
  const order: SectionId[] = [];
  for (const id of [...(saved?.order ?? []), ...SECTION_IDS]) {
    if (SECTION_IDS.includes(id as SectionId) && !seen.has(id)) {
      seen.add(id);
      order.push(id as SectionId);
    }
  }
  const collapsed: Partial<Record<SectionId, boolean>> = {};
  for (const id of SECTION_IDS) {
    if (saved?.collapsed?.[id]) collapsed[id] = true;
  }
  return { order, collapsed };
}

export function useSectionLayout() {
  const [layout, setLayout] = useState<Layout>(() => normalize(null));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setLayout(normalize(JSON.parse(raw) as Partial<Layout>));
    } catch {
      /* ignore broken storage */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  }, [layout, ready]);

  function reorder(fromId: SectionId, toId: SectionId) {
    setLayout((prev) => {
      if (fromId === toId) return prev;
      const from = prev.order.indexOf(fromId);
      const originalTo = prev.order.indexOf(toId);
      if (from < 0 || originalTo < 0) return prev;
      const order = [...prev.order];
      const [item] = order.splice(from, 1);
      const to = order.indexOf(toId);
      order.splice(from < originalTo ? to + 1 : to, 0, item);
      return { ...prev, order };
    });
  }

  function toggle(id: SectionId) {
    setLayout((prev) => ({
      ...prev,
      collapsed: { ...prev.collapsed, [id]: !prev.collapsed[id] },
    }));
  }

  return { order: layout.order, collapsed: layout.collapsed, reorder, toggle };
}
