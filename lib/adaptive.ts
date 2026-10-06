import {
  isBible52,
  bible52Units,
  bible52ChapterUnit,
  chaptersFor,
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
import { migrateChapters } from "./chapter-migration";

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
  if (isBible52(state.config)) return bible52ChapterUnit[chapter];
  return (
    state.completionDays?.[chapter] ??
    dayIndex(state.config, state.done[chapter])
  );
}

// Rebuild only recommendations. Historical rows reflect what was actually read,
// never the former recommendation. The original last date is kept exactly.
export function redistribute(state: ReadingState, from: number, date: string) {
  if (isBible52(state.config)) {
    const previous = new Set(state.previouslyRead ?? []);
    const closed = new Set(state.adaptive?.finished ?? []);
    state.adaptive = {
      date,
      days: createPlan(state.config, [...previous]).map((d) =>
        d.chapters.map((c) => c.id),
      ),
      finished: bible52Units
        .filter(
          (u) =>
            u.chapters.every((c) => previous.has(c.id)) ||
            (closed.has(u.index) &&
              u.chapters.every((c) => previous.has(c.id) || state.done[c.id])),
        )
        .map((u) => u.index),
      extra: {},
      unplanned: [],
    };
    return;
  }
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
  if (isBible52(state.config)) {
    const copy = structuredClone(state);
    delete copy.pendingBookOrder;
    redistribute(copy, 0, date);
    return copy;
  }
  const correcting = state.chapterSchema !== 2;
  if (correcting) state = migrateChapters(state);
  if (state.adaptive?.date === date && !state.pendingBookOrder && !correcting)
    return state;
  // A session spanning midnight keeps its recommendation until it is finished.
  if (state.adaptive && state.timer && !correcting) return state;
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
  const from =
    correcting && copy.timer
      ? copy.timer.day
      : copy.adaptive?.finished.includes(current)
        ? current + 1
        : current;
  redistribute(copy, from, date);
  return copy;
}

export function readingPlan(
  state: ReadingState,
  date = today(state.config.timezone),
): Day[] {
  if (isBible52(state.config)) return createPlan(state.config);
  const prepared = prepareState(state, date);
  const chapters = chaptersFor(prepared.config);
  return prepared.adaptive!.days.map((ids, index) => ({
    index,
    date: addDays(state.config.start, index),
    chapters: ids.map((id) => chapters[id]),
    words: ids.reduce((sum, id) => sum + chapters[id].words, 0),
  }));
}

export function sessionChapters(state: ReadingState, day: number) {
  if (isBible52(state.config)) return bible52Units[day]?.chapters ?? [];
  const ids = new Set([
    ...(state.adaptive?.days[day] ?? []),
    ...(state.adaptive?.extra[day] ?? []),
  ]);
  return orderedChapters(state.config).filter((c) => ids.has(c.id));
}

export function nextExtraChapter(state: ReadingState, day: number) {
  if (isBible52(state.config)) return undefined;
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

// Unfinished sessions take precedence over the next template unit, including after pausing.
export function bible52CurrentUnit(state: ReadingState) {
  return (
    state.timer?.day ??
    state.pace?.draft?.day ??
    bible52Units.find((u) => !state.adaptive?.finished.includes(u.index))
      ?.index ??
    363
  );
}
