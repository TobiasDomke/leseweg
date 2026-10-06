import type { Lang } from "./languages";
import { scopeChapters } from "./planner";
import { completionDay } from "./adaptive";
import { readingPace, paceState, estimatedSeconds } from "./pace";
import { sessionsFor } from "./session-stats";
import { daySeconds, type ReadingState } from "./state";

const units = {
  de: { hour: "Std.", minute: "Min." },
  en: { hour: "h", minute: "min" },
  ru: { hour: "ч", minute: "мин" },
  uk: { hour: "год", minute: "хв" },
};

/** Round only for presentation, after all second-based calculations and sums. */
export function readingTime(seconds: number, lang: Lang) {
  const value = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const u = units[lang];
  if (value > 0 && value < 60) return `< 1\u00a0${u.minute}`;
  const minutes = Math.round(value / 60);
  const h = Math.floor(minutes / 60),
    m = minutes % 60;
  return h
    ? `${h}\u00a0${u.hour} ${m}\u00a0${u.minute}`
    : `${m}\u00a0${u.minute}`;
}

/** Compact chart labels; always hours:minutes, never minutes:seconds. */
export function readingTimeClock(seconds: number) {
  const minutes = Math.round(Math.max(0, seconds) / 60);
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`;
}

export function correctionSeconds(
  parts: Record<"hours" | "minutes" | "seconds", string>,
) {
  if (!Object.values(parts).every((v) => /^\d+$/.test(v))) return null;
  const h = Number(parts.hours),
    m = Number(parts.minutes),
    s = Number(parts.seconds);
  const total = h * 3600 + m * 60 + s;
  return h <= 24 && m <= 59 && s <= 59 && total <= 86400 ? total : null;
}

export function readingTimeSummary(
  state: ReadingState,
  now = Date.now(),
  pace = readingPace(state),
) {
  const inventory = scopeChapters(state.config);
  const previous = new Set(state.previouslyRead ?? []);
  const sessions = sessionsFor(state),
    measurements = paceState(state);
  // Excluded pace samples still represent real measured time. Never estimate
  // those chapters a second time merely because they do not train the forecast.
  const measured = new Set([
    ...sessions.filter((s) => s.seconds > 0).flatMap((s) => s.chapters),
    ...measurements.samples
      .filter((s) => s.seconds > 0)
      .flatMap((s) => s.chapters),
  ]);
  const draft = measurements.draft;
  if (draft && daySeconds(state, draft.day, now) > draft.secondsBefore) {
    const before = new Set(draft.before);
    for (const id of Object.keys(state.done).map(Number))
      if (!before.has(id)) measured.add(id);
  }
  // Old daily totals have no per-session chapter lists. Keep their measured
  // coverage when there is no newer session/draft describing that day.
  const describedDays = new Set([
    ...sessions.map((s) => s.day),
    ...measurements.samples.map((s) => s.day),
    ...(draft ? [draft.day] : []),
  ]);
  for (const c of inventory)
    if (state.done[c.id]) {
      const day = completionDay(state, c.id);
      if (!describedDays.has(day) && daySeconds(state, day, now) > 0)
        measured.add(c.id);
    }
  const previousChapters = inventory.filter((c) => previous.has(c.id));
  const unmeasured = inventory.filter(
    (c) => state.done[c.id] && !previous.has(c.id) && !measured.has(c.id),
  );
  const remaining = inventory.filter(
    (c) => !previous.has(c.id) && !state.done[c.id],
  );
  const estimate = (chapters: typeof inventory) =>
    estimatedSeconds(
      chapters.reduce((n, c) => n + c.words, 0),
      pace,
    );
  const measuredSeconds =
    state.logs.reduce((n, l) => n + l.seconds, 0) +
    (state.timer
      ? Math.max(0, Math.floor((now - state.timer.startedAt) / 1000))
      : 0);
  const previousSeconds = estimate(previousChapters);
  const unmeasuredSeconds = estimate(unmeasured);
  const remainingSeconds = estimate(remaining);
  const pastSeconds = measuredSeconds + previousSeconds + unmeasuredSeconds;
  return {
    measuredSeconds,
    previousSeconds,
    unmeasuredSeconds,
    pastSeconds,
    remainingSeconds,
    totalSeconds: pastSeconds + remainingSeconds,
    previousChapters: previousChapters.length,
    unmeasuredChapters: unmeasured.length,
    remainingChapters: remaining.length,
  };
}
