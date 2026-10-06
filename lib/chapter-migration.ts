import canon from "./schlachter-canon.json";
import { chapters } from "./planner";
import type { ReadingState } from "./state";

// Versions through 1.8.0 used KJV-style counts for Joel/Malachi while displaying
// Schlachter references. Resolve saved IDs by the displayed book/chapter, never
// by their new numeric position. In particular old MAL 4 must not become MAL 3.
export const legacyReferences = canon.books.flatMap(
  ({ code, chapters: count }) =>
    Array.from(
      { length: code === "JOL" ? 3 : code === "MAL" ? 4 : count },
      (_, i) => `${code} ${i + 1}`,
    ),
);
const currentIds = new Map(
  chapters.map((c) => [`${c.code} ${c.number}`, c.id]),
);
export function migrateChapters(state: ReadingState): ReadingState {
  if (state.chapterSchema === 2) return state;
  const copy = structuredClone(state);
  const reference = (id: number) => {
    const ref = legacyReferences[id];
    if (!ref) throw Error("chapter-migration");
    return ref;
  };
  const affected = (id: number) => /^(JOL|MAL) /.test(reference(id));
  const mapId = (id: number) => currentIds.get(reference(id));
  const mapIds = (ids: number[]) =>
    ids.flatMap((id) => {
      const mapped = mapId(id);
      return mapped === undefined ? [] : [mapped];
    });
  const mapRecord = <T>(values: Record<string, T>): Record<string, T> =>
    Object.fromEntries(
      Object.entries(values).flatMap(([id, value]) => {
        const mapped = mapId(Number(id));
        return mapped === undefined ? [] : [[String(mapped), value]];
      }),
    );
  const previous = (state.previouslyRead ?? []).filter(affected).map(reference);
  const done = Object.fromEntries(
    Object.entries(state.done)
      .filter(([id]) => affected(Number(id)))
      .map(([id, date]) => [reference(Number(id)), date]),
  );
  const samples = (state.pace?.samples ?? [])
    .filter((s) => s.chapters.some(affected))
    .map((s) => ({
      day: s.day,
      references: s.chapters.map(reference),
      seconds: s.seconds,
    }));
  if (previous.length || Object.keys(done).length || samples.length)
    copy.chapterCorrection = { previouslyRead: previous, done, samples };
  // Very old backups can have daily time totals without chapter/time pairs.
  // If affected chapters were read, do not reconstruct potentially false pairs.
  if (!copy.pace && Object.keys(done).length)
    copy.pace = { samples: [], draft: null };
  copy.done = mapRecord(state.done);
  if (state.previouslyRead) copy.previouslyRead = mapIds(state.previouslyRead);
  if (state.completionDays)
    copy.completionDays = mapRecord(state.completionDays);
  if (copy.pace) {
    // The original times remain in logs and the archive. Do not use ambiguous
    // chapter/word pairs as training data for the future reading estimate.
    copy.pace.samples = copy.pace.samples
      .filter((s) => !s.chapters.some(affected))
      .map((s) => ({ ...s, chapters: mapIds(s.chapters) }));
    if (copy.pace.draft) {
      const uncertain = Object.keys(state.done)
        .map(Number)
        .some((id) => affected(id) && !state.pace!.draft!.before.includes(id));
      if (uncertain) copy.pace.draft = null;
      else copy.pace.draft.before = mapIds(copy.pace.draft.before);
    }
  }
  if (copy.adaptive) {
    copy.adaptive.days = copy.adaptive.days.map(mapIds);
    copy.adaptive.extra = Object.fromEntries(
      Object.entries(copy.adaptive.extra).map(([day, ids]) => [
        day,
        mapIds(ids),
      ]),
    );
    if (copy.adaptive.unplanned)
      copy.adaptive.unplanned = mapIds(copy.adaptive.unplanned);
  }
  copy.chapterSchema = 2;
  // prepareState redistributes all still unread chapters, including Joel 4.
  return copy;
}
