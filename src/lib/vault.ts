import { readdirSync, readFileSync, existsSync } from "fs";
import path from "path";
import { asLeg } from "./biblia";

export type VaultRecord = {
  slug: string;
  title: string;
  bornMd: string;
  diceIfaMd: string;
  patakiesMd: string;
  bodyMd: string;
};

function vaultRoot(): string {
  const cwd = process.cwd();
  const here = path.join(cwd, "oddun", "obsidian-ifa-vault", "domains", "ifa", "entries");
  if (existsSync(here)) return here;
  return path.join(cwd, "..", "oddun", "obsidian-ifa-vault", "domains", "ifa", "entries");
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

export function slugFromVaultName(filename: string): string | null {
  const base = filename.replace(/\.md$/i, "");
  if (/^ejiogbe$/i.test(base)) return "ogbe";
  const meji = base.replace(/-meyi$/i, "");
  if (meji !== base) return asLeg(meji);
  const tokens = base.split(/[-_]+/).filter(Boolean);
  const bits = tokens.map(asLeg);
  if (bits.some((x) => !x)) return null;
  if (bits.length === 1) return bits[0];
  if (bits.length >= 2) return `${bits[0]}-${bits[1]}`;
  return null;
}

function section(md: string, heading: string): string {
  const re = new RegExp(`##\\s+${heading}[^\\n]*\\n([\\s\\S]*?)(?=\\n##\\s+|$)`, "i");
  const m = md.match(re);
  return m ? m[1].trim() : "";
}

function cleanMd(text: string): string {
  return text
    .split("\n")
    .filter((line) => !/anotar aquí|anotar el texto|no se reproduce/i.test(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function dropFrontmatter(raw: string): string {
  if (!raw.startsWith("---")) return raw.trim();
  const end = raw.indexOf("\n---", 3);
  if (end < 0) return raw.trim();
  return raw.slice(end + 4).replace(/^\s*\n/, "").trim();
}

function titleFrom(raw: string, slug: string): string {
  const m = raw.match(/^title:\s*(.+)$/m);
  if (m) return m[1].replace(/^["']|["']$/g, "").trim();
  return slug;
}

let cache: Record<string, VaultRecord> | null = null;

export function loadVault(): Record<string, VaultRecord> {
  if (cache) return cache;
  const map: Record<string, VaultRecord> = {};
  for (const file of walkMd(vaultRoot())) {
    const slug = slugFromVaultName(path.basename(file));
    if (!slug) continue;
    const raw = readFileSync(file, "utf8").replace(/\r\n/g, "\n");
    map[slug] = {
      slug,
      title: titleFrom(raw, slug),
      bornMd: cleanMd(section(raw, "En este odun nace")),
      diceIfaMd: cleanMd(section(raw, "Dice Ifá")),
      patakiesMd: cleanMd(section(raw, "Lista de patakies")),
      bodyMd: dropFrontmatter(raw),
    };
  }
  cache = map;
  return map;
}
