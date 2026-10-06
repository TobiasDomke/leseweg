import type { Config } from "./planner";
import type { Lang } from "./i18n";
import type { BookOrder } from "./book-order";
export type TimeLog = {
  day: number;
  seconds: number;
  at: string;
  readingDate?: string;
};
export type PaceSample = {
  day: number;
  chapters: number[];
  seconds: number;
  review?: "confirmed" | "excluded";
};
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
  chapterSchema?: 2;
  editionReview?: string[];
  sessions?: {
    id: string;
    day: number;
    date: string;
    chapters: number[];
    seconds: number;
  }[];
  chapterCorrection?: {
    // Original references, retained for review; never counted as new progress.
    previouslyRead: string[];
    done: Record<string, string>;
    samples: { day: number; references: string[]; seconds: number }[];
  };
  config: Config;
  lang: Lang;
  // Apply a language-driven order change after the active timer pauses/ends.
  pendingBookOrder?: BookOrder;
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
