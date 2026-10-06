import {
  addDays,
  dateAt,
  duration,
  isBible52,
  isoDate,
  orderedChapters,
  today,
  type Config,
} from "./planner";
import {
  completionDay,
  dayIndex,
  prepareState,
  redistribute,
} from "./adaptive";
import type { ReadingState } from "./state";

/** Both start and deadline are reading days. Calendar arithmetic is independent of DST. */
export function planEndingOn(config: Config, end: string): Config {
  if (
    isBible52(config) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(end) ||
    !Number.isFinite(dateAt(end).getTime()) ||
    isoDate(dateAt(end)) !== end
  )
    throw Error("invalid");
  const next: Config = {
    ...config,
    unit: "days",
    amount:
      Math.round(
        (dateAt(end).getTime() - dateAt(config.start).getTime()) / 86400000,
      ) + 1,
  };
  duration(next);
  return next;
}
export function deadlineBounds(
  state: ReadingState,
  date = today(state.config.timezone),
) {
  // A corrected future measurement must not be cut off by shortening the plan.
  const lastRecorded = [
    0,
    ...state.logs.map((l) => l.day),
    ...(state.sessions ?? []).map((s) => s.day),
    ...(state.pace?.samples ?? []).map((s) => s.day),
    ...(state.adaptive?.finished ?? []),
    ...Object.keys(state.done).map((id) => completionDay(state, Number(id))),
    state.timer?.day ?? 0,
    state.pace?.draft?.day ?? 0,
  ].reduce((last, day) => Math.max(last, day), 0);
  return {
    min: [date, addDays(state.config.start, lastRecorded)].sort().at(-1)!,
    max: addDays(state.config.start, 3649),
  };
}
/** Shared by the action and its preview; no progress, sessions or times are discarded. */
export function rescheduleDeadline(
  state: ReadingState,
  end: string,
  date = today(state.config.timezone),
) {
  if (isBible52(state.config)) throw Error("invalid");
  if (state.timer) throw Error("timer");
  const next = structuredClone(prepareState(state, date));
  const bounds = deadlineBounds(next, date);
  if (end < bounds.min || end > bounds.max) throw Error("invalid");
  const config = planEndingOn(next.config, end);
  next.completionDays = Object.fromEntries(
    Object.keys(next.done).map((id) => [id, completionDay(next, Number(id))]),
  );
  next.config = config;
  const current = dayIndex(config, date);
  const remaining = orderedChapters(config).some(
    (c) => !next.done[c.id] && !next.previouslyRead?.includes(c.id),
  );
  // Choosing today explicitly opens today again if unfinished chapters remain.
  // Earlier sessions and their times stay recorded, with no fabricated completion.
  if (end === date && remaining)
    next.adaptive!.finished = next.adaptive!.finished.filter(
      (day) => day !== current,
    );
  redistribute(
    next,
    current + (next.adaptive!.finished.includes(current) ? 1 : 0),
    date,
  );
  return next;
}
