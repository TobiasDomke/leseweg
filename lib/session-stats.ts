import { addDays, today } from "./planner";
import type { ReadingState, TimeLog } from "./state";
export const logDate = (state: ReadingState, log: TimeLog) =>
  log.readingDate ?? today(state.config.timezone, Date.parse(log.at));
export function sessionsFor(state: ReadingState) {
  if (state.sessions) return state.sessions;
  // Older versions retained daily totals, not session boundaries. Reconstruct
  // known pace samples and one aggregate for each otherwise completed day.
  const samples = state.pace?.samples ?? [];
  const result = samples.map((s, i) => ({
    id: `legacy-${i}`,
    day: s.day,
    date:
      state.logs.find((l) => l.day === s.day)?.readingDate ??
      addDays(state.config.start, s.day),
    chapters: s.chapters,
    seconds: s.seconds,
  }));
  for (const day of state.adaptive?.finished ?? [])
    if (!result.some((s) => s.day === day)) {
      result.push({
        id: `legacy-day-${day}`,
        day,
        date:
          state.logs.find((l) => l.day === day)?.readingDate ??
          addDays(state.config.start, day),
        chapters: Object.keys(state.done)
          .map(Number)
          .filter((id) => state.done[id] === addDays(state.config.start, day)),
        seconds: state.logs
          .filter((l) => l.day === day)
          .reduce((n, l) => n + l.seconds, 0),
      });
    }
  return result;
}
export function dailySeconds(state: ReadingState, now = Date.now()) {
  const values: Record<string, number> = {};
  for (const log of state.logs) {
    const date = logDate(state, log);
    values[date] = (values[date] ?? 0) + log.seconds;
  }
  if (state.timer) {
    const date = today(state.config.timezone, state.timer.startedAt);
    values[date] =
      (values[date] ?? 0) +
      Math.max(0, Math.floor((now - state.timer.startedAt) / 1000));
  }
  return values;
}
