import books from "./bible-lengths.json";
import canon from "./schlachter-canon.json";
import { chronologicalBlocks, cohesiveReferences } from "./reading-order";
import { sortByBookOrder, type BookOrder } from "./book-order";
export type Unit = "days" | "weeks" | "months";
export type Config = {
  amount: number;
  unit: Unit;
  start: string;
  time: string;
  timezone: string;
  scope?: "bible" | "ot" | "nt";
  order?: "canonical" | "chronological" | "mixed";
  keepTogether?: boolean;
  bookOrder?: BookOrder;
  bookOrderMode?: "auto" | "manual";
};
export type Chapter = {
  id: number;
  bookIndex: number;
  book: string;
  code: string;
  number: number;
  words: number;
};
export const chapters: Chapter[] = books
  .flatMap((b, bookIndex) =>
    b.words.map((words, i) => ({
      id: 0,
      bookIndex,
      book: b.name,
      code: b.code,
      number: i + 1,
      words,
    })),
  )
  .map((c, id) => ({ ...c, id }));
// This independent inventory was checked book by book against the publisher's
// chapter headings. A correct grand total alone cannot detect swapped counts.
export function assertCanonInventory(
  inventory: { code: string; words: number[] }[],
) {
  if (
    inventory.length !== canon.books.length ||
    canon.books.some(
      (book, index) =>
        inventory[index].code !== book.code ||
        inventory[index].words.length !== book.chapters ||
        inventory[index].words.some(
          (words) => !Number.isFinite(words) || words <= 0,
        ),
    )
  )
    throw Error("canon");
}
assertCanonInventory(books);
export const totalWords = chapters.reduce((sum, c) => sum + c.words, 0);
export const minutes = (words: number) => Math.max(1, Math.round(words / 180));
export const dateAt = (date: string) => new Date(date + "T12:00:00Z");
export const isoDate = (d: Date) => d.toISOString().slice(0, 10);
export function addDays(date: string, days: number) {
  const d = dateAt(date);
  d.setUTCDate(d.getUTCDate() + days);
  return isoDate(d);
}
export function today(zone = "Europe/Berlin", now = Date.now()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(now));
}
export function duration(config: Config) {
  if (
    !Number.isInteger(config.amount) ||
    config.amount < 1 ||
    config.amount > 3650
  )
    throw new Error("amount");
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(config.start) ||
    !Number.isFinite(dateAt(config.start).getTime()) ||
    isoDate(dateAt(config.start)) !== config.start
  )
    throw new Error("date");
  if (config.start < "2020-01-01" || config.start > "2100-12-31")
    throw new Error("date");
  if (!["days", "weeks", "months"].includes(config.unit))
    throw new Error("unit");
  let days = config.amount * (config.unit === "weeks" ? 7 : 1);
  if (config.unit === "months") {
    const start = dateAt(config.start);
    const end = dateAt(config.start);
    end.setUTCDate(1);
    end.setUTCMonth(end.getUTCMonth() + config.amount);
    const last = new Date(
      Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0),
    ).getUTCDate();
    end.setUTCDate(Math.min(start.getUTCDate(), last));
    days = Math.round((end.getTime() - start.getTime()) / 86400000);
  }
  if (days > 3650 || days < 1) throw new Error("duration");
  return days;
}
export type Day = {
  index: number;
  date: string;
  chapters: Chapter[];
  words: number;
};
export function scopeChapters(config: Pick<Config, "scope" | "bookOrder">) {
  return sortByBookOrder(
    chapters.filter((c) =>
      config.scope === "ot"
        ? c.bookIndex < 39
        : config.scope === "nt"
          ? c.bookIndex >= 39
          : true,
    ),
    config.bookOrder,
  );
}
export function referenceChapters(refs: string): Chapter[] {
  return refs.split(";").flatMap((part) => {
    const [code, ranges] = part.trim().split(/\s+/);
    if (!ranges) throw Error("reference");
    return ranges.split(",").flatMap((range) => {
      const [first, last = first] = range.split("-").map(Number);
      const found = chapters.filter(
        (c) => c.code === code && c.number >= first && c.number <= last,
      );
      if (found.length !== last - first + 1 || first < 1)
        throw Error("reference");
      return found;
    });
  });
}
export const historicalGroups = chronologicalBlocks.map((block, index) => ({
  ...block,
  id: index,
  chapters: referenceChapters(block.refs),
}));
const chronological = historicalGroups.flatMap((group) => group.chapters);
export function assertCoverage(expected: Chapter[], ids: number[]) {
  const wanted = new Set(expected.map((c) => c.id));
  if (
    ids.length !== wanted.size ||
    new Set(ids).size !== ids.length ||
    ids.some((id) => !wanted.has(id))
  )
    throw Error("coverage");
}
assertCoverage(
  chapters,
  chronological.map((c) => c.id),
);

// Weighted interleaving keeps every stream's internal order and finishes them
// together. It is deterministic, so extra reading follows the same order.
function mixedChapters(items: Chapter[]) {
  const streams = [
    items.filter(
      (c) => c.bookIndex < 17 || (c.bookIndex >= 22 && c.bookIndex < 39),
    ),
    items.filter((c) => c.bookIndex >= 17 && c.bookIndex < 22),
    items.filter((c) => c.bookIndex >= 39 && c.bookIndex <= 43),
    items.filter((c) => c.bookIndex > 43),
  ]
    .filter((s) => s.length)
    .map((items) => ({
      items,
      cursor: 0,
      read: 0,
      total: items.reduce((s, c) => s + c.words, 0),
    }));
  const result: Chapter[] = [];
  while (result.length < items.length) {
    const stream = streams
      .filter((s) => s.cursor < s.items.length)
      .sort((a, b) => a.read / a.total - b.read / b.total)[0];
    const chapter = stream.items[stream.cursor++];
    result.push(chapter);
    stream.read += chapter.words;
  }
  return result;
}
const orderCache = new Map<string, Chapter[]>();
export function orderedChapters(config: Config) {
  const key = `${config.scope ?? "bible"}:${config.order ?? "canonical"}:${config.bookOrder ?? "western"}`;
  const cached = orderCache.get(key);
  if (cached) return cached;
  const ordered = buildOrder(config);
  orderCache.set(key, ordered);
  return ordered;
}
function buildOrder(config: Config) {
  const scope = scopeChapters(config);
  if (config.order === "mixed") return mixedChapters(scope);
  if (config.order === "chronological") {
    const ids = new Set(scope.map((c) => c.id));
    return chronological.filter((c) => ids.has(c.id));
  }
  return scope;
}
const cohesiveGroups = cohesiveReferences.map(referenceChapters);
export function boundaryPreference(config: Config) {
  if (!config.keepTogether) return undefined;
  const groups =
    config.order === "chronological"
      ? historicalGroups.map((g) => g.chapters)
      : cohesiveGroups;
  const membership = new Map(
    groups.flatMap((group, i) => group.map((c) => [c.id, i] as const)),
  );
  return (a: Chapter, b: Chapter) =>
    membership.get(a.id) !== membership.get(b.id) || !membership.has(a.id);
}
export function createPlan(
  config: Config,
  previouslyRead: number[] = [],
): Day[] {
  const items = orderedChapters(config);
  const previous = new Set(previouslyRead);
  const allowed = new Set(items.map((c) => c.id));
  if (
    previous.size !== previouslyRead.length ||
    previouslyRead.some((id) => !allowed.has(id))
  )
    throw Error("prior");
  const plan = distributeChapters(
    items.filter((c) => !previous.has(c.id)),
    duration(config),
    config.start,
    boundaryPreference(config),
  );
  assertCoverage(items, [
    ...previouslyRead,
    ...plan.flatMap((day) => day.chapters.map((c) => c.id)),
  ]);
  return plan;
}
export function distributeChapters(
  items: Chapter[],
  days: number,
  start: string,
  preferredBoundary?: (a: Chapter, b: Chapter) => boolean,
): Day[] {
  if (days < 1) return [];
  const result: Day[] = Array.from({ length: days }, (_, i) => ({
    index: i,
    date: addDays(start, i),
    chapters: [],
    words: 0,
  }));
  if (days >= items.length) {
    items.forEach((c, i) => {
      const day = result[Math.floor((i * days) / items.length)];
      day.chapters.push(c);
      day.words += c.words;
    });
    return result;
  }
  let cursor = 0,
    remainingWords = items.reduce((sum, c) => sum + c.words, 0);
  for (let i = 0; i < days; i++) {
    const remainingDays = days - i,
      target = remainingWords / remainingDays,
      lastExclusive = items.length - remainingDays + 1,
      day = result[i];
    do {
      const c = items[cursor++];
      day.chapters.push(c);
      day.words += c.words;
    } while (
      cursor < lastExclusive &&
      (remainingDays === 1 ||
        Math.abs(day.words + items[cursor].words - target) <=
          Math.abs(day.words - target))
    );
    if (preferredBoundary && remainingDays > 1) {
      const begin = cursor - day.chapters.length;
      const baseline = Math.abs(day.words - target);
      let bestEnd = cursor,
        bestWords = day.words;
      let bestCost =
        baseline +
        (preferredBoundary(items[cursor - 1], items[cursor])
          ? 0
          : target * 0.2);
      let words = 0;
      for (let end = begin + 1; end <= lastExclusive; end++) {
        words += items[end - 1].words;
        if (Math.abs(words - target) <= baseline + target * 0.25) {
          const cost =
            Math.abs(words - target) +
            (preferredBoundary(items[end - 1], items[end]) ? 0 : target * 0.2);
          if (cost < bestCost) {
            bestCost = cost;
            bestEnd = end;
            bestWords = words;
          }
        }
        if (words > target + baseline + target * 0.25) break;
      }
      cursor = bestEnd;
      day.chapters = items.slice(begin, cursor);
      day.words = bestWords;
    }
    remainingWords -= day.words;
  }
  return result;
}
export function passage(items: Chapter[], names?: string[]) {
  if (!items.length) return "";
  const groups: string[] = [];
  for (let i = 0; i < items.length; ) {
    let j = i;
    while (
      j + 1 < items.length &&
      items[j + 1].code === items[i].code &&
      items[j + 1].number === items[j].number + 1
    )
      j++;
    groups.push(
      `${names?.[items[i].bookIndex] ?? items[i].book} ${items[i].number}${j > i ? "–" + items[j].number : ""}`,
    );
    i = j + 1;
  }
  return groups.join(" · ");
}
export function clockText(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 3600) ? Math.floor(s / 3600) + ":" : ""}${String(Math.floor(s / 60) % 60).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
