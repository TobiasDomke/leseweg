import type { Lang } from "./languages";
export const editionIds = [
  "schlachter2000",
  "kjv",
  "synodal",
  "ohienko",
] as const;
export type Edition = (typeof editionIds)[number];
export const editions: Record<
  Edition,
  { name: string; order: "western" | "eastern"; source: string }
> = {
  schlachter2000: {
    name: "Schlachter 2000",
    order: "western",
    source: "https://www.schlachterbibel.de/de/bibel/",
  },
  kjv: {
    name: "King James Version",
    order: "western",
    source: "https://only.bible/bible/kjv/",
  },
  synodal: {
    name: "Синодальный перевод · 66 книг",
    order: "eastern",
    source: "https://only.bible/bible/rst66/",
  },
  ohienko: {
    name: "Іван Огієнко (1962)",
    order: "eastern",
    source: "https://only.bible/bible/ubio/",
  },
};
export const languageEdition = (lang: Lang): Edition =>
  (
    ({ de: "schlachter2000", en: "kjv", ru: "synodal", uk: "ohienko" }) as const
  )[lang];
export const editionName = (config: { edition?: Edition }) =>
  editions[config.edition ?? "schlachter2000"].name;
// Content links to the independently checked Schlachter inventory. Fractions
// approximate text weights only; every selected-edition chapter stays whole.
export function sourceParts(
  edition: Edition,
  code: string,
  number: number,
): [number, number][] {
  if (edition !== "schlachter2000") {
    if (code === "JOL")
      return number === 1
        ? [[1, 1]]
        : number === 2
          ? [
              [2, 1],
              [3, 1],
            ]
          : [[4, 1]];
    if (code === "MAL")
      return number < 3
        ? [[number, 1]]
        : number === 3
          ? [[3, 510 / 686]]
          : [[3, 176 / 686]];
  }
  if (edition === "synodal" && code === "PSA") {
    if (number <= 8 || number >= 148) return [[number, 1]];
    if (number === 9)
      return [
        [9, 1],
        [10, 1],
      ];
    if (number <= 112) return [[number + 1, 1]];
    if (number === 113)
      return [
        [114, 1],
        [115, 1],
      ];
    if (number === 114) return [[116, 9 / 19]];
    if (number === 115) return [[116, 10 / 19]];
    if (number <= 145) return [[number + 1, 1]];
    if (number === 146) return [[147, 11 / 20]];
    return [[147, 9 / 20]];
  }
  return [[number, 1]];
}
