import {
  chapters,
  createPlan,
  duration,
  dateAt,
  addDays,
  today,
  distributeChapters,
  type Config,
  type Day,
} from "./planner";
import type { ReadingState } from "./state";

export function dayIndex(config: Config, date: string) {
  return Math.max(
    0,
    Math.min(
      duration(config) - 1,
      Math.round(
        (dateAt(date).getTime() - dateAt(config.start).getTime()) / 86400000,
      ),
    ),
  );
}

// Rebuild only recommendations. Historical rows reflect what was actually read,
// never the former recommendation. The original last date is kept exactly.
export function redistribute(state: ReadingState, from: number, date: string) {
  const count = duration(state.config);
  const history: number[][] = Array.from({ length: count }, () => []);
  for (const c of chapters) {
    if (state.done[c.id])
      history[dayIndex(state.config, state.done[c.id])].push(c.id);
  }
  const remaining = chapters.filter((c) => !state.done[c.id]);
  const future = distributeChapters(
    remaining,
    count - from,
    addDays(state.config.start, from),
  );
  state.adaptive = {
    date,
    days: history.map((read, index) =>
      index < from
        ? read
        : (future[index - from]?.chapters.map((c) => c.id) ?? []),
    ),
    finished: state.adaptive?.finished ?? [],
    // Keep chapters already read today visible when returning or continuing.
    extra:
      from < count && history[from].length ? { [from]: history[from] } : {},
  };
}

export function prepareState(
  state: ReadingState,
  date = today(state.config.timezone),
): ReadingState {
  if (state.adaptive?.date === date) return state;
  // A session spanning midnight keeps its recommendation until it is finished.
  if (state.adaptive && state.timer) return state;
  const copy = structuredClone(state);
  const current = dayIndex(copy.config, date);
  if (!copy.adaptive) {
    // Preserve completed-unit counts when upgrading a fixed-plan installation.
    copy.adaptive = {
      date,
      days: [],
      extra: {},
      finished: createPlan(copy.config)
        .filter(
          (day) =>
            day.date <= date &&
            day.chapters.length > 0 &&
            day.chapters.every((c) => copy.done[c.id]),
        )
        .map((day) => day.index),
    };
  }
  const from = copy.adaptive?.finished.includes(current)
    ? current + 1
    : current;
  redistribute(copy, from, date);
  return copy;
}

export function readingPlan(
  state: ReadingState,
  date = today(state.config.timezone),
): Day[] {
  const prepared = prepareState(state, date);
  return prepared.adaptive!.days.map((ids, index) => ({
    index,
    date: addDays(state.config.start, index),
    chapters: ids.map((id) => chapters[id]),
    words: ids.reduce((sum, id) => sum + chapters[id].words, 0),
  }));
}

export function sessionChapters(state: ReadingState, day: number) {
  const ids = new Set([
    ...(state.adaptive?.days[day] ?? []),
    ...(state.adaptive?.extra[day] ?? []),
  ]);
  return chapters.filter((c) => ids.has(c.id));
}

export function nextExtraChapter(state: ReadingState, day: number) {
  const present = new Set(sessionChapters(state, day).map((c) => c.id));
  return chapters.find((c) => !state.done[c.id] && !present.has(c.id));
}

export function readChaptersOnDay(state: ReadingState, day: number) {
  return chapters.filter(
    (c) => state.done[c.id] && dayIndex(state.config, state.done[c.id]) === day,
  );
}
