import assert from "node:assert/strict";
import { build } from "esbuild";
await build({
  entryPoints: [
    "lib/planner.ts",
    "lib/actions.ts",
    "lib/adaptive.ts",
    "lib/pace.ts",
    "lib/backup.ts",
    "lib/exports.ts",
    "lib/plan-i18n.ts",
  ],
  outdir: ".test-runtime",
  bundle: true,
  platform: "node",
  format: "esm",
});
const {
  chapters,
  createPlan,
  orderedChapters,
  scopeChapters,
  referenceChapters,
  historicalGroups,
  addDays,
  duration,
} = await import("../.test-runtime/planner.js");
const { applyAction } = await import("../.test-runtime/actions.js");
const { prepareState, sessionChapters, nextExtraChapter, readChaptersOnDay } =
  await import("../.test-runtime/adaptive.js");
const { readingPace } = await import("../.test-runtime/pace.js");
const { makeBackup, parseBackup } = await import("../.test-runtime/backup.js");
const { csvFile, calendarFile } = await import("../.test-runtime/exports.js");
const { planTranslations } = await import("../.test-runtime/plan-i18n.js");
const base = {
  amount: 365,
  unit: "days",
  start: "2026-10-06",
  time: "07:30",
  timezone: "Europe/Berlin",
};
const now = Date.parse("2026-10-06T10:00:00Z");
const act = (state, op, at = now) =>
  applyAction(
    state,
    { ...op, planId: state?.id ?? null, opId: crypto.randomUUID() },
    at,
  );
const read = (state, ids, at = now) =>
  ids.reduce(
    (s, chapter) => act(s, { action: "chapter", chapter, done: true }, at),
    state,
  );
const fresh = (config, previouslyRead = []) =>
  act(null, { action: "create", config, previouslyRead, lang: "de" });
const ids = (items) => items.map((c) => c.id);
let combinations = 0;
for (const scope of ["bible", "ot", "nt"]) {
  const expected = scopeChapters({ scope });
  assert.equal(
    expected.length,
    scope === "bible" ? 1189 : scope === "ot" ? 929 : 260,
  );
  assert.equal(
    new Set(expected.map((c) => c.bookIndex)).size,
    scope === "bible" ? 66 : scope === "ot" ? 39 : 27,
  );
  for (const order of ["canonical", "chronological", "mixed"]) {
    const ordered = orderedChapters({ ...base, scope, order });
    assert.deepEqual(
      ids(ordered).sort((a, b) => a - b),
      ids(expected),
    );
    for (const keepTogether of [false, true])
      for (const amount of [1, 2, 7, 30, 365, 1189, 3650]) {
        for (const previous of [
          [],
          ids(expected.filter((_, i) => i % 3 === 0)),
          ids(expected.slice(0, -1)),
          ids(expected),
        ]) {
          const config = { ...base, scope, order, keepTogether, amount };
          const plan = createPlan(config, previous);
          assert.equal(plan.length, amount);
          assert.equal(plan.at(-1).date, addDays(base.start, amount - 1));
          const unread = ordered.filter((c) => !previous.includes(c.id));
          assert.deepEqual(
            ids(plan.flatMap((d) => d.chapters)),
            ids(unread),
            "Exact remaining coverage and chosen order at every duration",
          );
          assert.equal(
            plan.reduce((sum, d) => sum + d.words, 0),
            unread.reduce((sum, c) => sum + c.words, 0),
          );
          combinations++;
        }
      }
    // Redistribution, extra chapters, skipped days and earlier progress changes
    // must preserve every scope/style, measured history, and the target date.
    const config = { ...base, scope, order, keepTogether: true };
    const previous = ids(ordered.slice(0, 8));
    let s = fresh(config, previous);
    assert.deepEqual(s.done, {});
    assert.equal(s.logs.length, 0);
    assert.equal(s.adaptive.finished.length, 0);
    assert.equal(readingPace(s).personal, false);
    assert(!sessionChapters(s, 0).some((c) => previous.includes(c.id)));
    const assigned = s.adaptive.days[0];
    const extra = nextExtraChapter(s, 0);
    assert(extra);
    s = act(s, { action: "extend", day: 0 });
    assert(sessionChapters(s, 0).some((c) => c.id === extra.id));
    s = act(s, { action: "timer", mode: "start", day: 0 });
    const actual = [assigned[0] ?? extra.id];
    s = read(s, actual);
    s = act(s, { action: "complete", day: 0 }, now + 120000);
    assert.equal(
      readingPace(s).chapters,
      1,
      "Historical estimates never train the pace",
    );
    const expectedUnread = ids(
      ordered.filter((c) => !previous.includes(c.id) && !s.done[c.id]),
    );
    assert.deepEqual(s.adaptive.days.slice(1).flat(), expectedUnread);
    assert.deepEqual(s.adaptive.days[0], actual);
    const missed = prepareState(s, "2026-10-13");
    assert.deepEqual(missed.adaptive.days.slice(7).flat(), expectedUnread);
    const history = structuredClone({
      done: s.done,
      logs: s.logs,
      pace: s.pace,
    });
    const corrected = act(s, {
      action: "previous",
      previouslyRead: previous.slice(0, 4),
    });
    assert.deepEqual(
      { done: corrected.done, logs: corrected.logs, pace: corrected.pace },
      history,
    );
    assert.equal(corrected.adaptive.days[1][0], previous[4]);
    assert.throws(() =>
      act(s, { action: "previous", previouslyRead: [...previous, ...actual] }),
    );
    const extended = act(corrected, { action: "deadline", end: "2027-12-31" });
    assert.equal(
      addDays(extended.config.start, duration(extended.config) - 1),
      "2027-12-31",
    );
    assert.deepEqual(
      { done: extended.done, logs: extended.logs, pace: extended.pace },
      history,
    );
    assert.equal(extended.config.scope, scope);
    assert.equal(extended.config.order, order);
    const restored = parseBackup(makeBackup(extended, "uk", "dark", now));
    assert.equal(restored.version, 7);
    assert.equal(restored.state.lang, "uk");
    assert.deepEqual(restored.state.previouslyRead, corrected.previouslyRead);
    assert.deepEqual(restored.state.adaptive, extended.adaptive);
    assert.equal(
      readingPace(restored.state).secondsPerWord,
      readingPace(s).secondsPerWord,
    );
    const csv = csvFile(s, "de");
    assert(csv.includes("Vor dem Plan bereits gelesen"));
    assert(
      !calendarFile(s, "de", "https://example.com").includes("Vor dem Plan"),
    );
  }
}
// Anchor associations are deliberate and adjacent in the historical template.
for (const [refs, kind] of [
  ["2SA 11-12; PSA 51", "psalm51"],
  ["2SA 15; PSA 3", "psalm3"],
  ["2SA 22; PSA 18", "song18"],
]) {
  assert.deepEqual(
    ids(historicalGroups.find((g) => g.kind === kind).chapters),
    ids(referenceChapters(refs)),
  );
}
const chronology = ids(orderedChapters({ ...base, order: "chronological" }));
assert.deepEqual(
  [...new Set(chronology)].sort((a, b) => a - b),
  ids(chapters),
);
// Every stream retains canonical order even while the streams alternate.
const mixed = orderedChapters({ ...base, order: "mixed" });
for (const book of new Set(mixed.map((c) => c.bookIndex))) {
  assert.deepEqual(
    mixed.filter((c) => c.bookIndex === book).map((c) => c.number),
    chapters.filter((c) => c.bookIndex === book).map((c) => c.number),
  );
}
assert(new Set(mixed.slice(0, 8).map((c) => c.bookIndex)).size >= 3);
// Very long context groups may span days; no blank or missing chapters are introduced.
const grouped = createPlan({
  ...base,
  order: "chronological",
  keepTogether: true,
});
assert(grouped.every((d) => d.chapters.length > 0));
assert(grouped[0].chapters.length < 11);
// No fabricated sessions when everything was read before installation.
const all = fresh(
  { ...base, scope: "nt", order: "mixed" },
  ids(scopeChapters({ scope: "nt" })),
);
assert(all.adaptive.days.every((d) => d.length === 0));
assert.deepEqual(all.done, {});
assert.deepEqual(all.logs, []);
assert.equal(all.adaptive.finished.length, 0);
assert.equal(nextExtraChapter(all, 0), undefined);
assert.equal(readingPace(all).personal, false);
// Expired plans retain every unread chapter explicitly, and extension recovers it.
let overdue = fresh({
  ...base,
  amount: 1,
  scope: "nt",
  order: "chronological",
});
const first = overdue.adaptive.days[0][0];
overdue = act(read(overdue, [first]), { action: "complete", day: 0 });
assert.equal(overdue.adaptive.unplanned.length, 259);
assert.deepEqual(
  parseBackup(makeBackup(overdue, "de", "light", now)).state.adaptive,
  overdue.adaptive,
  "Overdue backup keeps chronological order",
);
const resumed = act(
  overdue,
  { action: "deadline", end: "2026-11-30" },
  now + 7 * 86400000,
);
assert.equal(resumed.adaptive.unplanned.length, 0);
assert.equal(resumed.adaptive.days.slice(7).flat().length, 259);
assert.deepEqual(resumed.done, overdue.done);
assert.throws(() => act(resumed, { action: "deadline", end: "2026-11-01" }));
assert.throws(() => fresh({ ...base, scope: "nt" }, [0]));
assert.throws(() => fresh(base, [0, 0]));
assert.throws(() => fresh({ ...base, scope: "invalid" }));
assert.throws(() => act(all, { action: "chapter", chapter: 0, done: true }));
assert.throws(() => act(all, { action: "chapter", chapter: 929, done: true }));
const wrongOrder = JSON.parse(makeBackup(overdue, "de", "light", now));
wrongOrder.state.adaptive.unplanned.reverse();
assert.throws(
  () => parseBackup(JSON.stringify(wrongOrder)),
  "A v4 backup must retain the chosen order",
);
const corrupt = JSON.parse(makeBackup(overdue, "de", "light", now));
corrupt.state.adaptive.unplanned.pop();
assert.throws(
  () => parseBackup(JSON.stringify(corrupt)),
  "A missing unread chapter must reject a v4 backup",
);
// Older backup versions and existing local configs remain valid, with no forced migration.
const legacy = fresh(base);
delete legacy.previouslyRead;
delete legacy.adaptive.unplanned;
const legacyFile = JSON.parse(makeBackup(legacy, "de", "light", now));
legacyFile.version = 3;
delete legacyFile.state.adaptive.unplanned;
assert.equal(
  parseBackup(JSON.stringify(legacyFile)).state.config.scope,
  undefined,
);
for (const lang of ["en", "ru", "uk"]) {
  assert.deepEqual(
    Object.keys(planTranslations[lang]).sort(),
    Object.keys(planTranslations.de).sort(),
  );
  for (const [key, value] of Object.entries(planTranslations.de)) {
    assert(planTranslations[lang][key].trim());
    assert.deepEqual(
      [...planTranslations[lang][key].matchAll(/\{\w+\}/g)]
        .map((x) => x[0])
        .sort(),
      [...value.matchAll(/\{\w+\}/g)].map((x) => x[0]).sort(),
    );
  }
}
console.log(
  `Plan options: ${combinations} scope/order/duration/prior-progress combinations; all chapter IDs, adaptive history, deadline extension, measured pace, v4/legacy backups, exports, and four languages passed.`,
);

// Reading after expiry used to be clamped to the last unit. Extending the plan
// must not move those chapters away from the unit containing their measured time.
let late = fresh({ ...base, amount: 1, scope: "nt", order: "chronological" });
late = act(
  late,
  { action: "timer", mode: "start", day: 0 },
  now + 7 * 86400000,
);
late = read(late, [late.adaptive.days[0][0]], now + 7 * 86400000 + 1000);
late = act(late, { action: "complete", day: 0 }, now + 7 * 86400000 + 60000);
const lateRead = ids(readChaptersOnDay(late, 0));
const lateExtended = act(
  late,
  { action: "deadline", end: "2026-11-30" },
  now + 7 * 86400000 + 61000,
);
assert.deepEqual(ids(readChaptersOnDay(lateExtended, 0)), lateRead);
assert.deepEqual(lateExtended.adaptive.days[0], lateRead);
assert.equal(lateExtended.logs[0].day, 0);
assert.deepEqual(
  parseBackup(makeBackup(lateExtended, "de", "light", now)).state
    .completionDays,
  lateExtended.completionDays,
);

// Reopening then unchecking an earlier chapter leaves it visible in extra until
// the next redistribution. Export/import must preserve that unfinished edit.
let correction = fresh(base);
correction = act(read(correction, [0, 1]), { action: "complete", day: 0 });
correction = act(correction, { action: "reopen", day: 0 });
correction = act(correction, { action: "chapter", chapter: 0, done: false });
const correctedBackup = parseBackup(makeBackup(correction, "de", "light", now));
assert(sessionChapters(correctedBackup.state, 0).some((c) => c.id === 0));
assert(!correctedBackup.state.done[0]);
assert.deepEqual(correctedBackup.state.adaptive.unplanned, []);
