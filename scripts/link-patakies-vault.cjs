const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PATAKI = path.join(ROOT, "patakies");
const VAULT = path.join(ROOT, "oddun", "obsidian-ifa-vault", "domains", "ifa", "entries");

const EXTRA = {
  yona: "oyeku",
  yono: "oyeku",
  yekun: "oyeku",
  wale: "odi",
  folokana: "okanran",
  batrupo: "oturupon",
  batrupon: "oturupon",
  otrupo: "oturupon",
  bofun: "ofun",
  bogbe: "ogbe",
  boka: "okanran",
  bosa: "osa",
  boshe: "ose",
  juani: "owonrin",
  koso: "ose",
  rote: "irete",
  loso: "irosun",
  edibre: "ogbe",
  nalbe: "ogbe",
  koloso: "ose",
  sode: "ogbe",
  kuleya: "irete",
  lofobeyo: "ofun",
  bekonwao: "iwori",
  leni: "odi",
  nilobe: "ogbe",
  piti: "ogunda",
  biroso: "irosun",
  orangun: "ofun",
  ejiogbe: "ogbe",
  yeku: "oyeku",
  wene: "iwori",
  kana: "okanran",
  okana: "okanran",
  ojuani: "owonrin",
  iroso: "irosun",
  tumako: "oturupon",
  she: "ose",
  oshe: "ose",
  tua: "otura",
  ate: "irete",
  di: "odi",
  bara: "obara",
  gunda: "ogunda",
  sa: "osa",
  ka: "ika",
  fun: "ofun",
};

const STOP = new Set([
  "orunmila",
  "olofin",
  "olodumare",
  "yemaya",
  "oshun",
  "shango",
  "elegua",
  "obatala",
  "mujer",
  "quiere",
  "tierra",
  "casa",
  "cuando",
  "quien",
  "busca",
  "pone",
  "porque",
  "sobre",
  "entre",
  "hasta",
  "desde",
  "tiene",
  "tiene",
  "signo",
  "este",
  "esta",
  "estos",
  "estas",
  "pataki",
  "patakies",
]);

const LEGS = [
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

function fold(s) {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function tokenLeg(token) {
  const f = fold(token);
  if (!f || /^(baba|meji|meyi|o|u)$/.test(f)) return null;
  if (LEGS.includes(f)) return f;
  return EXTRA[f] || null;
}

function slugFromOdunLabel(label) {
  const raw = label.replace(/\[\[|\]\]/g, "").trim();
  const f = fold(raw);
  if (f === "osarete") return "osa-irete";
  if (f.includes("orangun")) return "ofun";
  const legs = [];
  for (const token of raw.split(/[\s/,]+/).filter(Boolean)) {
    const leg = tokenLeg(token);
    if (leg && legs[legs.length - 1] !== leg) legs.push(leg);
  }
  if (legs.length === 1) return legs[0];
  if (legs.length >= 2) return `${legs[0]}-${legs[1]}`;
  return null;
}

function matches(a, b) {
  const x = fold(a);
  const y = fold(b);
  if (!x || !y) return false;
  if (x === y) return true;
  const aStart = x.slice(0, 20);
  const bStart = y.slice(0, 20);
  return (aStart.length >= 12 && y.includes(aStart)) || (bStart.length >= 12 && x.includes(bStart));
}

function uniqueFileForLine(text, files) {
  const exact = files.find((p) => matches(text, p.title) || matches(text, p.file));
  if (exact) return exact;
  const tokens = (fold(text).match(/[a-z]{5,}/g) || []).filter((t) => !STOP.has(t));
  const owners = [];
  for (const t of tokens) {
    const hits = files.filter((p) => p.hay.includes(t));
    if (hits.length === 1) owners.push(hits[0]);
  }
  if (!owners.length) return null;
  const first = owners[0].file;
  if (owners.every((p) => p.file === first)) return owners[0];
  return null;
}

function upsertPatakiesYaml(raw, files) {
  if (!raw.startsWith("---") || !files.length) return raw;
  const end = raw.indexOf("\n---", 3);
  if (end < 0) return raw;
  let yaml = raw.slice(4, end).replace(/\r\n/g, "\n");
  yaml = yaml.replace(/\npatakies:\n(?:[ \t]*-[^\n]*\n)*/g, "\n");
  const list = files.map((p) => `  - "[[${p.file}]]"`).join("\n");
  yaml = `${yaml.trimEnd()}\npatakies:\n${list}\n`;
  return `---\n${yaml}${raw.slice(end)}`;
}

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith(".md")) out.push(full);
  }
  return out;
}

function fm(raw) {
  if (!raw.startsWith("---")) return { data: {}, body: raw };
  const end = raw.indexOf("\n---", 3);
  if (end < 0) return { data: {}, body: raw };
  const data = {};
  for (const line of raw.slice(4, end).split("\n")) {
    const m = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (m) data[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return { data, body: raw.slice(end + 4) };
}

const bySlug = {};
const unmapped = new Set();
for (const name of fs.readdirSync(PATAKI).filter((f) => f.endsWith(".md"))) {
  const raw = fs.readFileSync(path.join(PATAKI, name), "utf8").replace(/\r\n/g, "\n");
  const { data, body } = fm(raw);
  const odun = (data.odun || "").replace(/\[\[|\]\]/g, "");
  const slug = slugFromOdunLabel(odun);
  const title = data.title || name.replace(/\.md$/i, "");
  const file = name.replace(/\.md$/i, "");
  const rec = {
    file,
    title,
    odun,
    slug,
    hay: fold(`${title}\n${file}\n${body}`),
  };
  if (!slug) {
    unmapped.add(odun || name);
    continue;
  }
  (bySlug[slug] ??= []).push(rec);
}

let linked = 0;
let notes = 0;
for (const file of walk(VAULT)) {
  const raw = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  const base = path.basename(file, ".md");
  let slug = null;
  if (/^ejiogbe$/i.test(base)) slug = "ogbe";
  else {
    const meji = base.replace(/-meyi$/i, "");
    if (meji !== base) slug = tokenLeg(meji);
    else {
      const bits = base.split("-").map(tokenLeg).filter(Boolean);
      if (bits.length === 1) slug = bits[0];
      if (bits.length >= 2) slug = `${bits[0]}-${bits[1]}`;
    }
  }
  if (!slug) continue;
  const files = bySlug[slug] || [];
  notes += 1;
  let nextRaw = upsertPatakiesYaml(raw, files);
  const re = /##\s+Lista de patakies[^\n]*\n([\s\S]*?)(?=\n##\s+|$)/i;
  const m = nextRaw.match(re);
  if (m && files.length) {
    const block = m[1];
    const next = block
      .split("\n")
      .map((line) => {
        const b = line.match(/^\s*-\s+(.*)$/);
        if (!b) return line;
        let text = b[1]
          .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
          .replace(/\[\[([^\]]+)\]\]/g, "$1")
          .trim();
        if (/anotar aquí/i.test(text)) return line;
        const hit = uniqueFileForLine(text, files);
        if (!hit) return line;
        linked += 1;
        if (fold(text) === fold(hit.file) || fold(text) === fold(hit.title)) {
          return `- [[${hit.file}]]`;
        }
        return `- [[${hit.file}|${text}]]`;
      })
      .join("\n");
    if (next !== block) nextRaw = nextRaw.replace(block, next);
  }
  if (nextRaw !== raw) fs.writeFileSync(file, nextRaw, "utf8");
}

console.log("patakies", Object.values(bySlug).reduce((n, a) => n + a.length, 0));
console.log("slugs", Object.keys(bySlug).length);
console.log("unmapped oduns", [...unmapped]);
console.log("vault notes with list", notes);
console.log("linked bullets", linked);
