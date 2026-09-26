export const LEGS = [
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
] as const;

export type LegId = (typeof LEGS)[number];

export const LEG_LABEL: Record<LegId, string> = {
  ogbe: "Ogbe",
  oyeku: "Oyeku",
  iwori: "Iwori",
  odi: "Odi",
  irosun: "Irosun",
  owonrin: "Owonrin",
  obara: "Ọ̀bàrà",
  okanran: "Okanran",
  ogunda: "Ogunda",
  osa: "Osa",
  ika: "Ika",
  oturupon: "Oturupon",
  otura: "Otura",
  irete: "Irete",
  ose: "Ose",
  ofun: "Ofun",
};

/** I = open (false), II = closed (true). Top → bottom. Matches the 16 méjì opele chart. */
export const LEG_PATTERN: Record<LegId, [boolean, boolean, boolean, boolean]> = {
  ogbe: [false, false, false, false],
  oyeku: [true, true, true, true],
  iwori: [true, false, false, true],
  odi: [false, true, true, false],
  irosun: [false, false, true, true],
  owonrin: [true, true, false, false],
  obara: [false, true, true, true],
  okanran: [true, true, true, false],
  ogunda: [false, false, false, true],
  osa: [true, false, false, false],
  ika: [true, false, true, true],
  oturupon: [true, true, false, true],
  otura: [false, true, false, false],
  irete: [false, false, true, false],
  ose: [false, true, false, true],
  ofun: [true, false, true, false],
};

export type Seed = boolean;

export function patternKey(seeds: [Seed, Seed, Seed, Seed]): string {
  return seeds.map((closed) => (closed ? "1" : "0")).join("");
}

const BY_KEY = Object.fromEntries(
  (Object.entries(LEG_PATTERN) as [LegId, [boolean, boolean, boolean, boolean]][]).map(
    ([id, pat]) => [patternKey(pat), id],
  ),
) as Record<string, LegId>;

export function legFromSeeds(seeds: [Seed, Seed, Seed, Seed]): LegId | null {
  return BY_KEY[patternKey(seeds)] ?? null;
}

export function slugFromLegs(right: LegId, left: LegId): string {
  if (right === left) return right;
  return `${right}-${left}`;
}

export function displayName(right: LegId, left: LegId): string {
  if (right === left) return `${LEG_LABEL[right]} Meji`;
  return `${LEG_LABEL[right]}–${LEG_LABEL[left]}`;
}
