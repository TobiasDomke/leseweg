import { chaptersFor, type Config } from "./planner";
import { editions, type Edition } from "./editions";
import type { ReadingState } from "./state";
// Printed chapter references in old releases did not identify the reader's
// paper edition. Do not infer that a numbered Psalm means the same content.
// Fully completed books are safe; partial changed books need explicit review.
export function changeEdition(state: ReadingState, edition: Edition) {
  const from = state.config.edition ?? "schlachter2000";
  if (from === edition) {
    state.config.edition = edition;
    return;
  }
  const old = chaptersFor(state.config),
    config: Config = { ...state.config, edition };
  const target = chaptersFor(config),
    byRef = new Map(target.map((c) => [`${c.code} ${c.number}`, c]));
  const affected = new Set<string>();
  if ((from === "schlachter2000") !== (edition === "schlachter2000")) {
    affected.add("JOL");
    affected.add("MAL");
  }
  if ((from === "synodal") !== (edition === "synodal")) affected.add("PSA");
  const read = new Set([
    ...(state.previouslyRead ?? []),
    ...Object.keys(state.done).map(Number),
  ]);
  const fullBooks = new Set(
    [...affected].filter((code) =>
      old.filter((c) => c.code === code).every((c) => read.has(c.id)),
    ),
  );
  const mapId = (id: number) => {
    const c = old[id];
    return c && !affected.has(c.code)
      ? byRef.get(`${c.code} ${c.number}`)?.id
      : undefined;
  };
  state.editionReview = [
    ...(state.editionReview ?? []),
    ...old
      .filter(
        (c) => affected.has(c.code) && !fullBooks.has(c.code) && read.has(c.id),
      )
      .map((c) => `${editions[from].name}: ${c.code} ${c.number}`),
  ];
  const originalDone = { ...state.done };
  const fullyPrior = new Set(
    [...fullBooks].filter(
      (code) => !old.some((c) => c.code === code && originalDone[c.id]),
    ),
  );
  state.previouslyRead = [
    ...(state.previouslyRead ?? []).flatMap((id) => {
      const n = mapId(id);
      return n === undefined ? [] : [n];
    }),
    ...target.filter((c) => fullyPrior.has(c.code)).map((c) => c.id),
  ];
  state.done = Object.fromEntries(
    Object.entries(state.done).flatMap(([id, date]) => {
      const n = mapId(+id);
      return n === undefined ? [] : [[n, date]];
    }),
  );
  for (const c of target.filter(
    (c) => fullBooks.has(c.code) && !fullyPrior.has(c.code),
  )) {
    state.done[c.id] = old
      .filter((o) => o.code === c.code && originalDone[o.id])
      .map((o) => originalDone[o.id])
      .sort()
      .at(-1)!;
  }
  if (state.completionDays)
    state.completionDays = Object.fromEntries(
      Object.entries(state.completionDays).flatMap(([id, day]) => {
        const n = mapId(+id);
        return n === undefined ? [] : [[n, day]];
      }),
    );
  const originalSessions = state.sessions;
  state.sessions = state.sessions?.map((s) => ({
    ...s,
    chapters: s.chapters.flatMap((id) => {
      const c = old[id];
      const n = fullBooks.has(c.code)
        ? byRef.get(`${c.code} ${c.number}`)?.id
        : mapId(id);
      return n === undefined ? [] : [n];
    }),
  }));
  for (const code of fullBooks) {
    const original = originalSessions?.find((s) =>
      s.chapters.some((id) => old[id].code === code),
    );
    const session = state.sessions?.find((s) => s.id === original?.id);
    if (session) {
      const included = new Set(state.sessions!.flatMap((s) => s.chapters));
      session.chapters.push(
        ...target
          .filter(
            (c) => c.code === code && state.done[c.id] && !included.has(c.id),
          )
          .map((c) => c.id),
      );
    }
  }
  state.pace = { samples: [], draft: null };
  state.config = config;
  if (config.bookOrderMode === "auto")
    state.config.bookOrder = editions[edition].order;
  delete state.pendingBookOrder;
  delete state.adaptive;
}
