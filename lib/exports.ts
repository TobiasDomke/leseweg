import { isBible52, passage, scopeChapters } from "./planner";
import { planText } from "./plan-i18n";
import { readingPace, estimatedMinutes } from "./pace";
import { bookNames, text, type Lang } from "./i18n";
import { daySeconds, type ReadingState } from "./state";
import { readingPlan, readChaptersOnDay } from "./adaptive";
function escapeICS(s: string) {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}
function fold(s: string) {
  let current = "",
    result = "";
  for (const c of s) {
    if (new TextEncoder().encode(current + c).length > 73) {
      result += current + "\r\n";
      current = " ";
    }
    current += c;
  }
  return result + current;
}
export function zonedUTC(date: string, time: string, zone: string) {
  const desired = Date.parse(`${date}T${time}:00Z`);
  let candidate = desired;
  const seen: number[] = [];
  for (let i = 0; i < 5; i++) {
    const p = new Intl.DateTimeFormat("en-CA", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(candidate));
    const get = (k: string) => p.find((v) => v.type === k)!.value;
    const local = Date.parse(
      `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}Z`,
    );
    if (local === desired) return new Date(candidate);
    seen.push(candidate);
    candidate += desired - local;
    if (seen.includes(candidate))
      return new Date(
        Math.max(candidate, ...seen.slice(seen.indexOf(candidate))),
      );
  }
  return new Date(candidate);
}
function stamp(d: Date) {
  return d
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}
export function calendarFile(state: ReadingState, lang: Lang, origin: string) {
  const estimate = (words: number) => estimatedMinutes(words, pace);
  const pace = readingPace(state);
  const t = text(lang),
    names = bookNames(isBible52(state.config) ? "de" : lang),
    lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Leseweg//Bible Plan//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      `X-WR-CALNAME:${escapeICS("Leseweg")}`,
    ];
  for (const day of readingPlan(
    state,
    state.adaptive?.date ?? state.config.start,
  )) {
    if (!day.chapters.length) continue;
    const start = zonedUTC(day.date, state.config.time, state.config.timezone);
    const title = `${t.calendarTitle}: ${passage(day.chapters, names)}`;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${state.id}-${day.index}@leseweg`,
      `DTSTAMP:${stamp(new Date())}`,
      `DTSTART:${stamp(start)}`,
      `DTEND:${stamp(new Date(start.getTime() + estimate(day.words) * 60000))}`,
      `SUMMARY:${escapeICS(title)}`,
      `DESCRIPTION:${escapeICS(`${t.day} ${day.index + 1}\n${passage(day.chapters, names)}\n${t.approx} ${estimate(day.words)} ${t.min}\n${origin}/?day=${day.index}`)}`,
      `URL:${origin}/?day=${day.index}`,
      "BEGIN:VALARM",
      "TRIGGER:PT0S",
      "ACTION:DISPLAY",
      `DESCRIPTION:${escapeICS(title)}`,
      "END:VALARM",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
export function csvFile(state: ReadingState, lang: Lang) {
  const pace = readingPace(state);
  const t = text(lang),
    names = bookNames(isBible52(state.config) ? "de" : lang);
  const previous = scopeChapters(state.config).filter((c) =>
    state.previouslyRead?.includes(c.id),
  );
  const rows = [
    [t.day, t.startDate, t.chapters, t.estimate, t.measured, t.read],
    ...(previous.length
      ? [
          [
            planText(lang).previous,
            "",
            passage(previous, names),
            estimatedMinutes(
              previous.reduce((sum, c) => sum + c.words, 0),
              pace,
            ),
            "",
            passage(previous, names),
          ],
        ]
      : []),
    ...readingPlan(state, state.adaptive?.date ?? state.config.start).map(
      (d) => [
        d.index + 1,
        d.date,
        passage(d.chapters, names),
        estimatedMinutes(d.words, pace),
        Math.round(daySeconds(state, d.index) / 6) / 10,
        passage(readChaptersOnDay(state, d.index), names),
      ],
    ),
  ];
  return (
    "\ufeff" +
    rows
      .map((row) =>
        row.map((v) => '"' + String(v).replace(/"/g, '""') + '"').join(";"),
      )
      .join("\r\n")
  );
}
export function downloadFile(content: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
