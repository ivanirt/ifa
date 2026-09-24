export type PatakiRecord = {
  id: string;
  title: string;
  odun: string;
  slug: string | null;
  order: number;
  body: string;
};

function fold(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function patakiMatches(a: string, b: string): boolean {
  const x = fold(a);
  const y = fold(b);
  if (!x || !y) return false;
  if (x === y) return true;
  const aStart = x.slice(0, 20);
  const bStart = y.slice(0, 20);
  if (aStart.length >= 12 && y.includes(aStart)) return true;
  if (bStart.length >= 12 && x.includes(bStart)) return true;
  return false;
}

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
  "signo",
  "este",
  "esta",
  "estos",
  "estas",
  "pataki",
  "patakies",
]);

export function findPatakiForLine(line: string, files: PatakiRecord[]): PatakiRecord | null {
  const exact = files.find((item) => patakiMatches(line, item.title) || patakiMatches(line, item.id));
  if (exact) return exact;
  const tokens = (fold(line).match(/[a-z]{5,}/g) || []).filter((t) => !STOP.has(t));
  const owners: PatakiRecord[] = [];
  for (const token of tokens) {
    const hits = files.filter((item) => fold(`${item.title}\n${item.body}`).includes(token));
    if (hits.length === 1) owners.push(hits[0]);
  }
  if (!owners.length) return null;
  const first = owners[0].id;
  if (owners.every((item) => item.id === first)) return owners[0];
  return null;
}
