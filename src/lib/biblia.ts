import { readdirSync, readFileSync, existsSync } from "fs";
import path from "path";
import { LEGS, type LegId } from "./opele";

export type BibliaRecord = {
  slug: string;
  title: string;
  essence: string;
  bodyParts: string[];
  keyAspects: string[];
  orishas: string[];
  sayings: string[];
  sayingsMd: string;
  element: string;
};

const LEG_ALIAS: Record<string, LegId> = {
  ogbe: "ogbe",
  ejiogbe: "ogbe",
  eji: "ogbe",
  oyeku: "oyeku",
  yeku: "oyeku",
  yekun: "oyeku",
  iwori: "iwori",
  wori: "iwori",
  wene: "iwori",
  odi: "odi",
  di: "odi",
  irosun: "irosun",
  iroso: "irosun",
  roso: "irosun",
  owonrin: "owonrin",
  ojuani: "owonrin",
  obara: "obara",
  bara: "obara",
  okanran: "okanran",
  okana: "okanran",
  kana: "okanran",
  ogunda: "ogunda",
  gunda: "ogunda",
  osa: "osa",
  ika: "ika",
  oturupon: "oturupon",
  otrupon: "oturupon",
  tumako: "oturupon",
  otura: "otura",
  tura: "otura",
  tua: "otura",
  irete: "irete",
  ate: "irete",
  ose: "ose",
  oshe: "ose",
  she: "ose",
  ofun: "ofun",
};

function fold(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

export function asLeg(token: string): LegId | null {
  const f = fold(token);
  if (!f) return null;
  if ((LEGS as readonly string[]).includes(f)) return f as LegId;
  return LEG_ALIAS[f] ?? null;
}

export function slugFromBibliaName(filename: string): string | null {
  const base = filename.replace(/\.md$/i, "");
  if (/^00[_-]/.test(base)) return null;
  if (/indice|apola|untitled/i.test(base)) return null;
  const stem = base.replace(/^\d+[_-]/, "").replace(/_meji$/i, "").replace(/^eji[_-]/i, "");
  const tokens = stem.split(/[_-]+/).filter(Boolean);
  if (tokens.length === 0) return null;
  const bits = tokens.map(asLeg);
  if (bits.some((x) => !x)) return null;
  if (bits.length === 1) return bits[0];
  return `${bits[0]}-${bits[1]}`;
}

function walkMd(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkMd(full));
    else if (entry.name.endsWith(".md")) out.push(full);
  }
  return out;
}

function parseYaml(yaml: string): Record<string, string | string[]> {
  const data: Record<string, string | string[]> = {};
  let listKey: string | null = null;
  for (const raw of yaml.split("\n")) {
    const line = raw.replace(/\t/g, "  ");
    const item = line.match(/^\s+-\s+(.*)$/);
    if (item && listKey) {
      const arr = Array.isArray(data[listKey]) ? data[listKey] : [];
      arr.push(item[1].trim().replace(/^["']|["']$/g, ""));
      data[listKey] = arr;
      continue;
    }
    const m = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    const val = m[2].trim();
    if (val === "" || val === "|") {
      listKey = key;
      data[key] = val === "|" ? "" : [];
      continue;
    }
    listKey = null;
    if (val.startsWith("[") && val.endsWith("]")) {
      data[key] = val
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^['"]|['"]$/g, ""))
        .filter(Boolean);
      continue;
    }
    data[key] = val.replace(/^["']|["']$/g, "");
  }
  return data;
}

function frontmatter(raw: string): { data: Record<string, string | string[]>; body: string } {
  if (!raw.startsWith("---")) return { data: {}, body: raw };
  const end = raw.indexOf("\n---", 3);
  if (end < 0) return { data: {}, body: raw };
  return {
    data: parseYaml(raw.slice(4, end)),
    body: raw.slice(end + 4).replace(/^\s*\n/, ""),
  };
}

function sectionByStart(md: string, start: string): string {
  const re = new RegExp(`##\\s+${start}[^\\n]*\\n([\\s\\S]*?)(?=\\n##\\s+|$)`, "i");
  const m = md.match(re);
  return m ? m[1].trim() : "";
}

function stripMd(s: string): string {
  return s
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^>\s?/gm, "")
    .trim();
}

function listField(data: Record<string, string | string[]>, key: string): string[] {
  const v = data[key];
  if (Array.isArray(v)) return v.map(stripMd).filter(Boolean);
  if (typeof v === "string" && v) return [stripMd(v)];
  return [];
}

function csvLine(line: string): string[] {
  return line
    .split(/[,;]/)
    .map((s) => stripMd(s).replace(/^["']|["']$/g, "").trim())
    .filter(Boolean);
}

function fromCorrespondencias(md: string): { bodyParts: string[]; keyAspects: string[] } {
  const block = sectionByStart(md, "2\\. Correspondencias");
  const body: string[] = [];
  const aspects: string[] = [];
  for (const raw of block.split("\n")) {
    const line = stripMd(raw.replace(/^\s*[-*]\s*/, ""));
    const bodyM = line.match(/^Partes del Cuerpo[^:]*:\s*(.+)$/i);
    if (bodyM) body.push(...csvLine(bodyM[1]));
    const aspM = line.match(/^Aspectos Clave:\s*(.+)$/i);
    if (aspM) aspects.push(...csvLine(aspM[1]));
  }
  return { bodyParts: body, keyAspects: aspects };
}

function bullets(text: string): string[] {
  return text
    .split("\n")
    .filter((line) => /^\s*[-*]/.test(line))
    .map((line) => stripMd(line.replace(/^\s*[-*]\s*/, "").replace(/^"|"$/g, "")))
    .filter(Boolean);
}

function bibliaRoot(): string {
  const cwd = process.cwd();
  const here = path.join(cwd, "oddun", "Biblia_IFA");
  if (existsSync(here)) return here;
  return path.join(cwd, "..", "oddun", "Biblia_IFA");
}

let cache: Record<string, BibliaRecord> | null = null;

export function loadBiblia(): Record<string, BibliaRecord> {
  if (cache) return cache;
  const map: Record<string, BibliaRecord> = {};
  for (const file of walkMd(bibliaRoot())) {
    const slug = slugFromBibliaName(path.basename(file));
    if (!slug) continue;
    const raw = readFileSync(file, "utf8").replace(/\r\n/g, "\n");
    const { data, body } = frontmatter(raw);
    const fromMd = fromCorrespondencias(body);
    const bodyParts = listField(data, "partes_del_cuerpo");
    const keyAspects = listField(data, "temas_clave");
    map[slug] = {
      slug,
      title: typeof data.title === "string" ? data.title : slug,
      essence: sectionByStart(body, "1\\. Esencia").replace(/\s*-{2,}\s*$/, "").trim(),
      bodyParts: bodyParts.length ? bodyParts : fromMd.bodyParts,
      keyAspects: keyAspects.length ? keyAspects : fromMd.keyAspects,
      orishas: listField(data, "orishas_asociados").map((s) => s.replace(/\[\[|\]\]/g, "")),
      sayings: bullets(sectionByStart(body, "3\\. Refranes")).filter((s) => s !== "--"),
      sayingsMd: sectionByStart(body, "3\\. Refranes").replace(/\s*-{2,}\s*$/, "").trim(),
      element: typeof data.elemento === "string" ? data.elemento : "",
    };
  }
  cache = map;
  return map;
}
