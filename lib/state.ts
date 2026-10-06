import type { Config } from "./planner";
import type { Lang } from "./i18n";
export type TimeLog = { day: number; seconds: number; at: string };
export type PaceSample = { day: number; chapters: number[]; seconds: number };
export type PaceState = {
  samples: PaceSample[];
  draft: {
    day: number;
    before: number[];
    secondsBefore: number;
    manual?: boolean;
  } | null;
};
export type ReadingState = {
  id: string;
  config: Config;
  lang: Lang;
  done: Record<string, string>;
  previouslyRead?: number[];
  // Keep completed units stable when a formerly expired plan is extended.
  completionDays?: Record<string, number>;
  logs: TimeLog[];
  timer: { day: number; startedAt: number } | null;
  ops: string[];
  pace?: PaceState;
  adaptive?: {
    date: string;
    days: number[][];
    finished: number[];
    extra: Record<string, number[]>;
    unplanned?: number[];
  };
};
export function daySeconds(state: ReadingState, day: number, now = Date.now()) {
  return (
    state.logs.filter((l) => l.day === day).reduce((s, l) => s + l.seconds, 0) +
    (state.timer?.day === day
      ? Math.max(0, Math.floor((now - state.timer.startedAt) / 1000))
      : 0)
  );
}
