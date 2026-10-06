import {
  chapters,
  orderedChapters,
  boundaryPreference,
  assertCoverage,
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

export function completionDay(state: ReadingState, chapter: number) {
  return (
    state.completionDays?.[chapter] ??
    dayIndex(state.config, state.done[chapter])
  );
}

// Rebuild only recommendations. Historical rows reflect what was actually read,
// never the former recommendation. The original last date is kept exactly.
export function redistribute(state: ReadingState, from: number, date: string) {
  const count = duration(state.config);
  const history: number[][] = Array.from({ length: count }, () => []);
  const ordered = orderedChapters(state.config);
  const previous = new Set(state.previouslyRead ?? []);
  for (const c of ordered) {
    if (state.done[c.id]) history[completionDay(state, c.id)].push(c.id);
  }
  const remaining = ordered.filter(
    (c) => !state.done[c.id] && !previous.has(c.id),
  );
  const future = distributeChapters(
    remaining,
    count - from,
    addDays(state.config.start, from),
    boundaryPreference(state.config),
  );
  assertCoverage(ordered, [
    ...(state.previouslyRead ?? []),
    ...Object.keys(state.done).map(Number),
    ...(from >= count
      ? remaining.map((c) => c.id)
      : future.flatMap((day) => day.chapters.map((c) => c.id))),
  ]);
  state.adaptive = {
    date,
    unplanned: from >= count ? remaining.map((c) => c.id) : [],
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
  if (state.adaptive?.date === date && !state.pendingBookOrder) return state;
  // A session spanning midnight keeps its recommendation until it is finished.
  if (state.adaptive && state.timer) return state;
  const copy = structuredClone(state);
  if (copy.pendingBookOrder) {
    copy.config.bookOrder = copy.pendingBookOrder;
    delete copy.pendingBookOrder;
  }
  const current = dayIndex(copy.config, date);
  if (!copy.adaptive) {
    // Preserve completed-unit counts when upgrading a fixed-plan installation.
    copy.adaptive = {
      date,
      days: [],
      extra: {},
      finished: createPlan(copy.config, copy.previouslyRead)
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
  return orderedChapters(state.config).filter((c) => ids.has(c.id));
}

export function nextExtraChapter(state: ReadingState, day: number) {
  const present = new Set(sessionChapters(state, day).map((c) => c.id));
  return orderedChapters(state.config).find(
    (c) =>
      !state.done[c.id] &&
      !state.previouslyRead?.includes(c.id) &&
      !present.has(c.id),
  );
}

export function readChaptersOnDay(state: ReadingState, day: number) {
  return orderedChapters(state.config).filter(
    (c) => state.done[c.id] && completionDay(state, c.id) === day,
  );
}
