import { readdirSync, readFileSync, existsSync } from "fs";
import path from "path";
import { LEG_LABEL, type LegId } from "./opele";

export type OduRecord = {
  slug: string;
  source: string;
  title: string;
  isMeji: boolean;
  rightLeg: string;
  leftLeg: string;
  keyPhrase: string;
  etymology: string;
  principle: string;
  notes: string;
  ire: string;
  ireNote: string;
  ibi: string;
  ibiNote: string;
  body: string;
};

function dafaRoot(): string {
  const cwd = process.cwd();
  const here = path.join(cwd, "dafa");
  if (existsSync(here)) return here;
  return path.join(cwd, "..", "dafa");
}

function section(md: string, heading: string): string {
  const re = new RegExp(`## ${heading}\\s*\\n([\\s\\S]*?)(?=\\n## |$)`, "i");
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
    .replace(/\|[^\n]+\|/g, "")
    .replace(/^[-*]\s+/gm, "")
    .trim();
}

function splitIreIbi(md: string): { ire: string; ireNote: string; ibi: string; ibiNote: string } {
  const combined = section(md, "Ire / ibi");
  if (combined) {
    const ireM = combined.match(/\*\*Ire:\*\*\s*([^\n]+)/i);
    const ibiM = combined.match(/\*\*Ibi:\*\*\s*([^\n]+)/i);
    return {
      ire: ireM ? stripMd(ireM[1]) : "",
      ireNote: "",
      ibi: ibiM ? stripMd(ibiM[1]) : "",
      ibiNote: "",
    };
  }
  const ireBlock = section(md, "Ire");
  const ibiBlock = section(md, "Ibi");
  const [ire, ...ireRest] = ireBlock.split(/\n\n+/);
  const [ibi, ...ibiRest] = ibiBlock.split(/\n\n+/);
  return {
    ire: stripMd(ire || ""),
    ireNote: stripMd(ireRest.join("\n\n")),
    ibi: stripMd(ibi || ""),
    ibiNote: stripMd(ibiRest.join("\n\n")),
  };
}

function frontmatter(raw: string): { data: Record<string, string>; body: string } {
  if (!raw.startsWith("---")) return { data: {}, body: raw };
  const end = raw.indexOf("\n---", 3);
  if (end < 0) return { data: {}, body: raw };
  const yaml = raw.slice(4, end);
  const body = raw.slice(end + 4).replace(/^\s*\n/, "");
  const data: Record<string, string> = {};
  for (const line of yaml.split("\n")) {
    const m = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!m) continue;
    data[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return { data, body };
}

function parseFile(filePath: string, source: string, slug: string): OduRecord {
  const raw = readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");
  const { data, body } = frontmatter(raw);
  const parts = splitIreIbi(body);
  const isMeji = data.is_meji === "true" || !slug.includes("-");
  const [right, left] = isMeji ? [slug, slug] : slug.split("-");
  return {
    slug,
    source,
    title: data.title || slug,
    isMeji,
    rightLeg: data.right_leg || right,
    leftLeg: data.left_leg || left,
    keyPhrase: stripMd(section(body, "Frase clave")),
    etymology: stripMd(section(body, "Etimología \\(yoruba\\)")).replace(
      "Etimología (yoruba)",
      "",
    ),
    principle: stripMd(section(body, "Principio")),
    notes: stripMd(section(body, "Notas")),
    ...parts,
    body,
  };
}

export function listSources(): string[] {
  const root = dafaRoot();
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) => existsSync(path.join(root, name)) && readdirSync(path.join(root, name)).some((f) => f.endsWith(".md") && f !== "README.md"));
}

export function loadSource(source: string): Map<string, OduRecord> {
  const dir = path.join(dafaRoot(), source);
  const map = new Map<string, OduRecord>();
  if (!existsSync(dir)) return map;
  for (const file of readdirSync(dir)) {
    if (!file.endsWith(".md") || file.toLowerCase() === "readme.md") continue;
    const slug = file.replace(/\.md$/i, "");
    map.set(slug, parseFile(path.join(dir, file), source, slug));
  }
  return map;
}

export type Catalog = {
  sources: string[];
  records: Record<string, Record<string, OduRecord>>;
};

let cache: Catalog | null = null;

export function loadCatalog(): Catalog {
  if (cache) return cache;
  const sources = listSources();
  const records: Catalog["records"] = {};
  for (const source of sources) {
    const map = loadSource(source);
    records[source] = Object.fromEntries(
      [...map.entries()].map(([slug, rec]) => {
        const { body: _body, ...rest } = rec;
        return [slug, rest];
      }),
    );
  }
  cache = { sources, records };
  return cache;
}

export function sourceLabel(folder: string): string {
  if (folder.toLowerCase() === "anonimo") return "DAFA";
  return folder;
}

export function legTitle(id: string): string {
  return LEG_LABEL[id as LegId] ?? id;
}
