import books from "./bible-lengths.json";
export type Unit = "days" | "weeks" | "months";
export type Config = {
  amount: number;
  unit: Unit;
  start: string;
  time: string;
  timezone: string;
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
export function createPlan(config: Config): Day[] {
  return distributeChapters(chapters, duration(config), config.start);
}
export function distributeChapters(
  items: Chapter[],
  days: number,
  start: string,
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
