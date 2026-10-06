import { chaptersFor, createPlan, today } from "./planner";
import { dayIndex, readChaptersOnDay } from "./adaptive";
import type { PaceSample, PaceState, ReadingState } from "./state";

const savedSeconds = (state: ReadingState, day: number) =>
  state.logs
    .filter((log) => log.day === day)
    .reduce((sum, log) => sum + log.seconds, 0);
const doneIds = (state: ReadingState) => Object.keys(state.done).map(Number);

// Old installations have daily totals only. Reuse completed, timed days, and
// keep any open measurement pending until the user finishes it.
export function paceState(state: ReadingState): PaceState {
  if (state.pace) return state.pace;
  const finished =
    state.adaptive?.finished ??
    createPlan(state.config, state.previouslyRead)
      .filter(
        (day) =>
          day.chapters.length > 0 &&
          day.chapters.every((c) => state.done[c.id]),
      )
      .map((day) => day.index);
  const samples = [...new Set(finished)]
    .filter((day) => state.timer?.day !== day)
    .map((day) => ({
      day,
      chapters: readChaptersOnDay(state, day).map((c) => c.id),
      seconds: savedSeconds(state, day),
    }))
    .filter((sample) => sample.seconds > 0 && sample.chapters.length > 0);
  const day =
    state.timer?.day ??
    dayIndex(state.config, state.adaptive?.date ?? state.config.start);
  const open =
    !finished.includes(day) &&
    (state.timer?.day === day || savedSeconds(state, day) > 0);
  const read = new Set(readChaptersOnDay(state, day).map((c) => c.id));
  return {
    samples,
    draft: open
      ? {
          day,
          before: doneIds(state).filter((id) => !read.has(id)),
          secondsBefore: 0,
        }
      : null,
  };
}

export function startPace(state: ReadingState, day: number) {
  const pace = state.pace!;
  if (pace.draft?.day === day) return; // Pause/resume keeps the same measurement.
  pace.draft = {
    day,
    before: doneIds(state),
    secondsBefore: savedSeconds(state, day),
  };
}

export function finishPace(
  state: ReadingState,
  finishedDay: number,
  review?: PaceSample["review"],
) {
  const pace = state.pace!;
  const draft = pace.draft;
  if (!draft || draft.day > finishedDay) return;
  const day = draft.day;
  const before = new Set(draft.before);
  if (draft.manual)
    pace.samples = pace.samples.filter((sample) => sample.day !== day);
  const used = new Set(pace.samples.flatMap((sample) => sample.chapters));
  // Finishing a stopped timer after midnight can use its saved measurement.
  // Later untimed reading on another date must not get paired with that time.
  const lastMeasuredDate = state.logs
    .filter((log) => log.day === day)
    .map((log) => today(state.config.timezone, Date.parse(log.at)))
    .sort()
    .at(-1);
  const ids = doneIds(state).filter(
    (id) =>
      !before.has(id) &&
      !used.has(id) &&
      (day === finishedDay ||
        (lastMeasuredDate && state.done[id] <= lastMeasuredDate)),
  );
  const seconds = savedSeconds(state, day) - draft.secondsBefore;
  if (ids.length && seconds > 0)
    pace.samples.push({
      day,
      chapters: ids,
      seconds,
      ...(review ? { review } : {}),
    });
  pace.draft = null;
}

export function correctPace(state: ReadingState, day: number) {
  const pace = state.pace!;
  // A manual daily total explicitly measures all chapters read in that unit.
  // Include an existing sample's chapters when the timer crossed midnight.
  const measured = new Set([
    ...readChaptersOnDay(state, day).map((c) => c.id),
    ...pace.samples
      .filter((sample) => sample.day === day)
      .flatMap((sample) => sample.chapters),
    ...(pace.draft?.day === day
      ? doneIds(state).filter((id) => !pace.draft!.before.includes(id))
      : []),
  ]);
  const before = doneIds(state).filter((id) => !measured.has(id));
  const draft = { day, before, secondsBefore: 0, manual: true };
  const closed =
    state.adaptive?.finished.includes(day) ||
    (pace.draft?.day !== day &&
      day < dayIndex(state.config, state.adaptive?.date ?? state.config.start));
  if (closed) {
    const pending = pace.draft;
    pace.draft = draft;
    finishPace(state, day);
    pace.draft = pending;
  } else {
    pace.draft = draft;
  }
}

export function forgetPaceChapter(state: ReadingState, chapter: number) {
  // Its time cannot be split reliably: discard the entire affected sample.
  state.pace!.samples = state.pace!.samples.filter(
    (sample) => !sample.chapters.includes(chapter),
  );
}

export function sampleNeedsReview(
  sample: PaceSample,
  state: ReadingState,
  baseline = 60 / 180,
) {
  const chapters = chaptersFor(state.config);
  const words = sample.chapters.reduce(
    (n, id) => n + (chapters[id]?.words ?? 0),
    0,
  );
  if (!words || !sample.seconds) return false;
  const rate = sample.seconds / words;
  return (
    sample.seconds > 14400 ||
    rate > Math.max(3 * baseline, 2) ||
    rate < Math.min(baseline / 3, 0.05)
  );
}
export function readingPace(state: ReadingState | null) {
  const chapters = chaptersFor(state?.config);
  const accepted: PaceSample[] = [];
  let excluded = 0;
  for (const sample of state ? paceState(state).samples : []) {
    if (
      sample.seconds <= 0 ||
      !sample.chapters.length ||
      !sample.chapters.every((id) => state!.done[id] && chapters[id])
    )
      continue;
    const priorWords = accepted
      .flatMap((s) => s.chapters)
      .reduce((n, id) => n + chapters[id].words, 0);
    const baseline =
      accepted.length >= 3
        ? accepted.reduce((n, s) => n + s.seconds, 0) / priorWords
        : 60 / 180;
    if (
      sample.review === "excluded" ||
      (sample.review !== "confirmed" &&
        sampleNeedsReview(sample, state!, baseline))
    ) {
      excluded++;
      continue;
    }
    accepted.push(sample);
  }
  const seconds = accepted.reduce((n, s) => n + s.seconds, 0);
  const ids = accepted.flatMap((s) => s.chapters);
  const words = ids.reduce((n, id) => n + chapters[id].words, 0);
  const confidence = Math.min(1, accepted.length / 5, words / 2500);
  return {
    personal: confidence === 1,
    learning: confidence > 0 && confidence < 1,
    samples: accepted.length,
    excluded,
    secondsPerWord:
      words > 0
        ? (60 / 180) * (1 - confidence) + (seconds / words) * confidence
        : 60 / 180,
    chapters: ids.length,
    seconds,
  };
}

export function estimatedMinutes(
  words: number,
  pace: ReturnType<typeof readingPace>,
) {
  return words > 0
    ? Math.max(1, Math.round((words * pace.secondsPerWord) / 60))
    : 0;
}
