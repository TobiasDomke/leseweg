import type { Lang } from "./languages";

// These describe book order, not a translation or a different biblical canon.
// Chapter IDs and chapter numbering always stay independent of display order.
export const bookOrders = ["western", "eastern"] as const;
export type BookOrder = (typeof bookOrders)[number];
export type BookOrderChoice = "auto" | BookOrder;
export function languageBookOrder(lang: Lang): BookOrder {
  return lang === "ru" || lang === "uk" ? "eastern" : "western";
}
const oldTestament =
  "GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST JOB PSA PRO ECC SNG ISA JER LAM EZK DAN HOS JOL AMO OBA JON MIC NAM HAB ZEP HAG ZEC MAL".split(
    " ",
  );
const gospelsActs = "MAT MRK LUK JHN ACT".split(" ");
const paul = "ROM 1CO 2CO GAL EPH PHP COL 1TH 2TH 1TI 2TI TIT PHM HEB".split(
  " ",
);
const general = "JAS 1PE 2PE 1JN 2JN 3JN JUD".split(" ");
export const bookSequences: Record<BookOrder, string[]> = {
  western: [...oldTestament, ...gospelsActs, ...paul, ...general, "REV"],
  eastern: [...oldTestament, ...gospelsActs, ...general, ...paul, "REV"],
};
const positions = Object.fromEntries(
  bookOrders.map((order) => [
    order,
    new Map(bookSequences[order].map((code, index) => [code, index])),
  ]),
) as Record<BookOrder, Map<string, number>>;
export function sortByBookOrder<T extends { code: string; number: number }>(
  items: T[],
  order: BookOrder = "western",
): T[] {
  const rank = positions[order];
  return [...items].sort(
    (a, b) => rank.get(a.code)! - rank.get(b.code)! || a.number - b.number,
  );
}
export function bookOrderChoice(config: {
  bookOrder?: BookOrder;
  bookOrderMode?: "auto" | "manual";
}): BookOrderChoice {
  return config.bookOrderMode === "auto"
    ? "auto"
    : (config.bookOrder ?? "western");
}
