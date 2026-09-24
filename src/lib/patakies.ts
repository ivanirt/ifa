import { readdirSync, readFileSync, existsSync } from "fs";
import path from "path";
import { slugFromLegs, type LegId } from "./opele";
import type { PatakiRecord } from "./pataki";

export type { PatakiRecord } from "./pataki";

const EXTRA: Record<string, LegId> = {
  ejiogbe: "ogbe",
  eji: "ogbe",
  yona: "oyeku",
  yono: "oyeku",
  yekun: "oyeku",
  yeku: "oyeku",
  wene: "iwori",
  wale: "odi",
  di: "odi",
  iroso: "irosun",
  loso: "irosun",
  biroso: "irosun",
  ojuani: "owonrin",
  juani: "owonrin",
  bara: "obara",
  folokana: "okanran",
  kana: "okanran",
  okana: "okanran",
  boka: "okanran",
  gunda: "ogunda",
  piti: "ogunda",
  batrupo: "oturupon",
  batrupon: "oturupon",
  otrupo: "oturupon",
  tumako: "oturupon",
  tua: "otura",
  ate: "irete",
  rote: "irete",
  kuleya: "irete",
  sa: "osa",
  ka: "ika",
  fun: "ofun",
  she: "ose",
  koso: "ose",
  boshe: "ose",
  koloso: "ose",
  bofun: "ofun",
  nalbe: "ogbe",
  edibre: "ogbe",
  sode: "ogbe",
  nilobe: "ogbe",
  bogbe: "ogbe",
  bosa: "osa",
  lofobeyo: "ofun",
  bekonwao: "iwori",
  leni: "odi",
  orangun: "ofun",
};

function fold(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function tokenLeg(token: string): LegId | null {
  const f = fold(token);
  if (!f || /^(baba|meji|meyi|o|u)$/.test(f)) return null;
  if (f === "osarete") return null;
  const LEGS: readonly string[] = [
    "ogbe",
    "oyeku",
    "iwori",
    "odi",
    "irosun",
    "owonrin",
    "obara",
    "okanran",
    "ogunda",
    "osa",
    "ika",
    "oturupon",
    "otura",
    "irete",
    "ose",
    "ofun",
  ];
  if (LEGS.includes(f)) return f as LegId;
  return EXTRA[f] ?? null;
}

export function slugFromOdunLabel(label: string): string | null {
  const raw = label.replace(/\[\[|\]\]/g, "").trim();
  const f = fold(raw);
  if (f === "osarete") return slugFromLegs("osa", "irete");
  if (f === "orangun" || f === "babaorangunofunmeji" || f === "orangunofunmeji") return "ofun";
  const tokens = raw.split(/[\s/,]+/).filter(Boolean);
  const legs: LegId[] = [];
  for (const token of tokens) {
    const leg = tokenLeg(token);
    if (leg && legs[legs.length - 1] !== leg) legs.push(leg);
  }
  if (legs.length === 1) return legs[0];
  if (legs.length >= 2) return slugFromLegs(legs[0], legs[1]);
  return null;
}

function patakiRoot(): string {
  const cwd = process.cwd();
  const here = path.join(cwd, "patakies");
  if (existsSync(here)) return here;
  return path.join(cwd, "..", "patakies");
}

function dropFrontmatter(raw: string): { data: Record<string, string>; body: string } {
  if (!raw.startsWith("---")) return { data: {}, body: raw };
  const end = raw.indexOf("\n---", 3);
  if (end < 0) return { data: {}, body: raw };
  const data: Record<string, string> = {};
  for (const line of raw.slice(4, end).split("\n")) {
    const m = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!m) continue;
    data[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return { data, body: raw.slice(end + 4).replace(/^\s*\n/, "") };
}

export function foldKey(s: string): string {
  return fold(s);
}

let cache: { all: PatakiRecord[]; bySlug: Record<string, PatakiRecord[]> } | null = null;

export function loadPatakies(): { all: PatakiRecord[]; bySlug: Record<string, PatakiRecord[]> } {
  if (cache) return cache;
  const all: PatakiRecord[] = [];
  const dir = patakiRoot();
  if (!existsSync(dir)) {
    cache = { all: [], bySlug: {} };
    return cache;
  }
  for (const name of readdirSync(dir)) {
    if (!name.endsWith(".md")) continue;
    const raw = readFileSync(path.join(dir, name), "utf8").replace(/\r\n/g, "\n");
    const { data, body } = dropFrontmatter(raw);
    const odun = (data.odun || "").replace(/\[\[|\]\]/g, "");
    const title = data.title || name.replace(/\.md$/i, "");
    const order = parseInt(data.order || "0", 10) || 0;
    all.push({
      id: name,
      title,
      odun,
      slug: slugFromOdunLabel(odun),
      order,
      body,
    });
  }
  all.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, "es"));
  const bySlug: Record<string, PatakiRecord[]> = {};
  for (const item of all) {
    if (!item.slug) continue;
    bySlug[item.slug] ??= [];
    bySlug[item.slug].push(item);
  }
  cache = { all, bySlug };
  return cache;
}
