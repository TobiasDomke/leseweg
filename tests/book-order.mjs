import assert from "node:assert/strict";
import { build } from "esbuild";
await build({
  entryPoints: [
    "lib/book-order.ts",
    "lib/book-order-i18n.ts",
    "lib/planner.ts",
    "lib/actions.ts",
    "lib/adaptive.ts",
    "lib/backup.ts",
    "lib/pace.ts",
    "lib/exports.ts",
  ],
  outdir: ".test-runtime/book-order",
  bundle: true,
  platform: "node",
  format: "esm",
});
const { bookSequences, languageBookOrder } = await import(
  "../.test-runtime/book-order/book-order.js"
);
const { bookOrderTranslations } = await import(
  "../.test-runtime/book-order/book-order-i18n.js"
);
const { chapters, scopeChapters, orderedChapters, createPlan } = await import(
  "../.test-runtime/book-order/planner.js"
);
const { applyAction } = await import("../.test-runtime/book-order/actions.js");
const { sessionChapters, prepareState } = await import(
  "../.test-runtime/book-order/adaptive.js"
);
const { readingPace } = await import("../.test-runtime/book-order/pace.js");
const { makeBackup, parseBackup } = await import(
  "../.test-runtime/book-order/backup.js"
);
const { calendarFile, csvFile } = await import(
  "../.test-runtime/book-order/exports.js"
);
const ids = (items) => items.map((c) => c.id);
const sorted = (items) => [...items].sort((a, b) => a - b);
const base = {
  amount: 90,
  unit: "days",
  start: "2026-10-06",
  time: "07:30",
  timezone: "Europe/Berlin",
};
const now = Date.parse("2026-10-06T10:00:00Z");
const act = (s, op, at = now) =>
  applyAction(
    s,
    { ...op, planId: s?.id ?? null, opId: crypto.randomUUID() },
    at,
  );
const fresh = (config = base, lang = "de", previouslyRead = []) =>
  act(null, { action: "create", config, lang, previouslyRead });
const id = (code, number = 1) =>
  chapters.find((c) => c.code === code && c.number === number).id;

assert.deepEqual(
  [...new Set(chapters.map((c) => c.code))],
  bookSequences.western,
);
for (const sequence of Object.values(bookSequences)) {
  assert.equal(sequence.length, 66);
  assert.equal(new Set(sequence).size, 66);
  assert.deepEqual([...sequence].sort(), [...bookSequences.western].sort());
}
assert.equal(bookSequences.eastern[44], "JAS");
assert.equal(bookSequences.eastern[51], "ROM");
assert.equal(bookSequences.western[44], "ROM");

let combinations = 0;
for (const lang of ["de", "en", "ru", "uk"]) {
  assert.deepEqual(
    Object.keys(bookOrderTranslations[lang]).sort(),
    Object.keys(bookOrderTranslations.de).sort(),
  );
  assert(Object.values(bookOrderTranslations[lang]).every((v) => v.trim()));
  for (const scope of ["bible", "ot", "nt"])
    for (const order of ["canonical", "mixed", "chronological"])
      for (const amount of [1, 90, 1500]) {
        const config = {
          ...base,
          scope,
          order,
          amount,
          bookOrder: languageBookOrder(lang),
          bookOrderMode: "auto",
        };
        const items = scopeChapters(config),
          ordered = orderedChapters(config);
        assert.deepEqual(sorted(ids(ordered)), sorted(ids(items)));
        const expectedBooks = bookSequences[config.bookOrder].filter((code) =>
          items.some((c) => c.code === code),
        );
        assert.deepEqual([...new Set(items.map((c) => c.code))], expectedBooks);
        if (order === "canonical") assert.deepEqual(ids(ordered), ids(items));
        if (order === "chronological")
          assert.deepEqual(
            ids(ordered),
            ids(orderedChapters({ ...config, bookOrder: "western" })),
          );
        if (order === "mixed") {
          const letters = (cs) => cs.filter((c) => c.bookIndex > 43);
          assert.deepEqual(ids(letters(ordered)), ids(letters(items)));
        }
        for (const previous of [
          [],
          ids(items.filter((_, i) => i % 7 === 0)),
          ids(items),
        ]) {
          const plan = createPlan(config, previous);
          const assigned = plan.flatMap((d) => ids(d.chapters));
          assert.equal(plan.length, amount);
          assert.deepEqual(
            sorted([...previous, ...assigned]),
            sorted(ids(items)),
          );
          assert.equal(new Set([...previous, ...assigned]).size, items.length);
          assert.deepEqual(
            assigned,
            ids(ordered).filter((id) => !previous.includes(id)),
          );
          combinations++;
        }
      }
}

// A translation must never turn a saved James chapter into a Romans chapter.
for (const order of ["canonical", "mixed", "chronological"]) {
  let s = fresh({ ...base, scope: "nt", order, bookOrderMode: "auto" }, "ru", [
    id("MAT"),
  ]);
  assert.equal(s.config.bookOrder, "eastern");
  s = act(s, { action: "timer", mode: "start", day: 0 });
  for (const chapter of [id("JAS"), id("ROM")])
    s = act(s, { action: "chapter", chapter, done: true });
  s = act(s, { action: "complete", day: 0 }, now + 600000);
  const before = structuredClone(s),
    pace = readingPace(s);
  for (const lang of ["en", "uk", "de", "ru"]) {
    s = act(s, { action: "language", lang }, now + 600000);
    assert.equal(s.config.bookOrder, languageBookOrder(lang));
    for (const key of [
      "id",
      "done",
      "previouslyRead",
      "logs",
      "pace",
      "completionDays",
    ])
      assert.deepEqual(s[key], before[key]);
    assert.equal(readingPace(s).secondsPerWord, pace.secondsPerWord);
    assert.deepEqual(s.adaptive.finished, before.adaptive.finished);
    const open = s.adaptive.days.flat().filter((c) => !s.done[c]);
    assert.deepEqual(
      open,
      ids(orderedChapters(s.config)).filter(
        (c) => !s.done[c] && !s.previouslyRead.includes(c),
      ),
    );
    assert.equal(
      new Set([
        ...s.previouslyRead,
        ...Object.keys(s.done).map(Number),
        ...open,
      ]).size,
      260,
    );
    const restored = parseBackup(makeBackup(s, lang, "light", now + 600000));
    assert.deepEqual(restored.state.config, s.config);
    assert.deepEqual(restored.state.done, s.done);
  }
}

// Running timers keep their recommendation. Switching back cancels the pending change.
let running = fresh({ ...base, scope: "nt", bookOrderMode: "auto" });
running = act(running, { action: "timer", mode: "start", day: 0 });
const original = structuredClone(running);
running = act(running, { action: "language", lang: "ru" }, now + 120000);
assert.equal(running.pendingBookOrder, "eastern");
assert.equal(running.config.bookOrder, "western");
assert.deepEqual(running.timer, original.timer);
assert.deepEqual(running.adaptive, original.adaptive);
assert.deepEqual(sessionChapters(running, 0), sessionChapters(original, 0));
assert.deepEqual(
  prepareState(running, "2026-10-07").adaptive,
  original.adaptive,
);
const cancelled = act(
  running,
  { action: "language", lang: "en" },
  now + 120000,
);
assert.equal(cancelled.pendingBookOrder, undefined);
assert.deepEqual(cancelled.adaptive, original.adaptive);
const paused = act(
  running,
  { action: "timer", mode: "pause", day: 0 },
  now + 180000,
);
assert.equal(paused.config.bookOrder, "eastern");
assert.equal(paused.pendingBookOrder, undefined);
assert.equal(paused.logs[0].seconds, 180);
assert.equal(paused.timer, null);
const restoredPending = parseBackup(
  makeBackup(running, "ru", "dark", now + 180000),
).state;
assert.equal(restoredPending.pendingBookOrder, "eastern");
assert.equal(
  prepareState(restoredPending, "2026-10-06").config.bookOrder,
  "eastern",
);
assert.equal(restoredPending.logs[0].seconds, 180);
const completed = act(running, { action: "complete", day: 0 }, now + 180000);
assert.equal(completed.config.bookOrder, "eastern");
assert.deepEqual(completed.adaptive.finished, [0]);

// A printed edition can override the language default, including while a timer runs.
let manual = act(running, {
  action: "book-order",
  choice: "western",
  lang: "ru",
});
assert.equal(manual.pendingBookOrder, undefined);
manual = act(manual, { action: "language", lang: "uk" });
assert.equal(manual.config.bookOrder, "western");
assert.equal(manual.config.bookOrderMode, "manual");
manual = act(manual, { action: "book-order", choice: "eastern", lang: "uk" });
assert.equal(manual.pendingBookOrder, "eastern");
manual = act(manual, { action: "language", lang: "en" });
assert.equal(manual.pendingBookOrder, "eastern");
manual = act(manual, { action: "timer", mode: "pause", day: 0 }, now + 60000);
assert.equal(manual.config.bookOrder, "eastern");
manual = act(manual, { action: "book-order", choice: "auto", lang: "en" });
assert.equal(manual.config.bookOrder, "western");
assert.equal(manual.config.bookOrderMode, "auto");

// Legacy plans keep their historical order until a deliberate language/order choice.
const legacy = fresh(base, "ru");
assert.equal(legacy.config.bookOrder, undefined);
assert.deepEqual(
  act(legacy, {
    action: "settings",
    lang: "ru",
    time: "08:00",
    timezone: base.timezone,
  }).config,
  { ...base, time: "08:00" },
);
for (const version of [1, 2, 3, 4]) {
  const file = JSON.parse(makeBackup(legacy, "ru", "light", now));
  file.version = version;
  assert.deepEqual(parseBackup(JSON.stringify(file)).state.config, base);
}
assert.equal(
  act(legacy, { action: "language", lang: "uk" }).config.bookOrder,
  "eastern",
);
const unread = fresh(
  { ...base, scope: "nt", amount: 1, bookOrderMode: "auto" },
  "uk",
);
for (const output of [
  csvFile(unread, "uk"),
  calendarFile(unread, "uk", "https://example.com").replace(/\r\n /g, ""),
]) {
  assert(output.includes("Якова"));
  assert(output.includes("До римлян"));
  assert(output.indexOf("Якова") < output.indexOf("До римлян"));
}
console.log(
  `Book order: ${combinations} complete plans, four languages, stable progress/pace, timer deferral, manual overrides, legacy backups and exports passed.`,
);
