import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { build } from "esbuild";
import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";

await build({
  entryPoints: [
    "lib/planner.ts",
    "lib/actions.ts",
    "lib/adaptive.ts",
    "lib/backup.ts",
    "lib/chapter-migration.ts",
    "lib/local-storage.ts",
    "lib/chapter-correction-i18n.ts",
  ],
  outdir: ".test-runtime/completeness",
  bundle: true,
  platform: "node",
  format: "esm",
});
const {
  chapters,
  createPlan,
  scopeChapters,
  orderedChapters,
  assertCanonInventory,
  addDays,
} = await import("../.test-runtime/completeness/planner.js");
const { applyAction } = await import(
  "../.test-runtime/completeness/actions.js"
);
const { prepareState, sessionChapters, nextExtraChapter } = await import(
  "../.test-runtime/completeness/adaptive.js"
);
const { makeBackup, parseBackup } = await import(
  "../.test-runtime/completeness/backup.js"
);
const { legacyReferences } = await import(
  "../.test-runtime/completeness/chapter-migration.js"
);
const { readState, changeState } = await import(
  "../.test-runtime/completeness/local-storage.js"
);
const { chapterCorrectionText } = await import(
  "../.test-runtime/completeness/chapter-correction-i18n.js"
);
const canon = JSON.parse(readFileSync("lib/schlachter-canon.json"));
const inventory = JSON.parse(readFileSync("lib/bible-lengths.json"));
const reference = (c) => `${c.code} ${c.number}`;
const expectedRefs = (scope) =>
  canon.books
    .filter((_, index) =>
      scope === "ot" ? index < 39 : scope === "nt" ? index >= 39 : true,
    )
    .flatMap((b) =>
      Array.from({ length: b.chapters }, (_, i) => `${b.code} ${i + 1}`),
    );
const actualRefs = (ids) =>
  ids.map((id) => {
    assert(chapters[id], `Unknown ID ${id}`);
    return reference(chapters[id]);
  });
const equalInventory = (ids, scope, label) => {
  const actual = actualRefs(ids),
    expected = expectedRefs(scope);
  assert.equal(
    new Set(actual).size,
    actual.length,
    `${label}: duplicate chapter`,
  );
  assert.deepEqual(
    actual.sort(),
    expected.sort(),
    `${label}: every independently verified book and chapter exactly once`,
  );
};
const base = {
  amount: 90,
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
const currentId = (ref) => chapters.find((c) => reference(c) === ref).id;
const oldId = (ref) => {
  const id = legacyReferences.indexOf(ref);
  assert(id >= 0, ref);
  return id;
};

assert.equal(canon.books.length, 66);
assert.equal(expectedRefs("bible").length, 1189);
assert.equal(expectedRefs("ot").length, 929);
assert.equal(expectedRefs("nt").length, 260);
assert.equal(canon.books.find((b) => b.code === "JOL").chapters, 4);
assert.equal(canon.books.find((b) => b.code === "MAL").chapters, 3);
assert.deepEqual(chapters.map(reference), expectedRefs("bible"));
assert.equal(new Set(chapters.map((c) => c.id)).size, 1189);
// The historical defect kept the total unchanged. The book-level guard must fail.
const swapped = structuredClone(inventory);
swapped.find((b) => b.code === "JOL").words.pop();
swapped.find((b) => b.code === "MAL").words.push(176);
assert.equal(
  swapped.reduce((n, b) => n + b.words.length, 0),
  1189,
);
assert.throws(() => assertCanonInventory(swapped), /canon/);

let plans = 0;
for (const scope of ["bible", "ot", "nt"])
  for (const order of ["canonical", "chronological", "mixed"])
    for (const bookOrder of ["western", "eastern"])
      for (const keepTogether of [false, true])
        for (const amount of [
          1, 2, 7, 30, 90, 260, 365, 929, 1188, 1189, 1190, 3650,
        ]) {
          const config = {
            ...base,
            scope,
            order,
            bookOrder,
            keepTogether,
            amount,
          };
          const items = scopeChapters(config);
          for (const previous of [
            [],
            items.filter((_, i) => i % 11 === 0).map((c) => c.id),
            items
              .filter((c) => c.code === "JOL" || c.code === "MAL")
              .map((c) => c.id),
            items.map((c) => c.id),
          ]) {
            const plan = createPlan(config, previous);
            equalInventory(
              [
                ...previous,
                ...plan.flatMap((d) => d.chapters.map((c) => c.id)),
              ],
              scope,
              JSON.stringify(config),
            );
            assert.equal(plan.length, amount);
            assert.equal(plan.at(-1).date, addDays(config.start, amount - 1));
            assert.deepEqual(
              plan.flatMap((d) => d.chapters.map((c) => c.id)),
              orderedChapters(config)
                .filter((c) => !previous.includes(c.id))
                .map((c) => c.id),
            );
            plans++;
          }
        }
// Every supported day count, rotating plan variants; boundary lengths above are
// also crossed with every scope/order/grouping and several prior-read patterns.
for (let amount = 1; amount <= 3650; amount++) {
  const config = {
    ...base,
    amount,
    scope: ["bible", "ot", "nt"][amount % 3],
    order: ["canonical", "chronological", "mixed"][Math.floor(amount / 3) % 3],
    bookOrder: amount % 2 ? "eastern" : "western",
    keepTogether: amount % 4 < 2,
  };
  equalInventory(
    createPlan(config).flatMap((d) => d.chapters.map((c) => c.id)),
    config.scope,
    `duration ${amount}`,
  );
  plans++;
}
console.log(
  `Completeness: ${plans} plans checked against all 66 independently verified book inventories.`,
);

function assertState(s, label) {
  const prior = new Set(s.previouslyRead ?? []),
    done = new Set(Object.keys(s.done).map(Number));
  const scheduled = [
    ...s.adaptive.days.flat(),
    ...(s.adaptive.unplanned ?? []),
  ];
  assert.equal(
    new Set(scheduled).size,
    scheduled.length,
    `${label}: duplicate assignment`,
  );
  const open = new Set(
    [...scheduled, ...Object.values(s.adaptive.extra).flat()].filter(
      (id) => !done.has(id),
    ),
  );
  equalInventory([...prior, ...done, ...open], s.config.scope, label);
  for (const id of open) assert(!prior.has(id));
}
let transitions = 0;
for (const scope of ["bible", "ot", "nt"])
  for (const order of ["canonical", "chronological", "mixed"])
    for (const lang of ["de", "ru", "en", "uk"]) {
      let s = act(null, {
        action: "create",
        config: {
          ...base,
          amount: 10,
          scope,
          order,
          keepTogether: true,
          bookOrderMode: "auto",
        },
        lang,
        previouslyRead: scopeChapters({ scope })
          .filter((_, i) => i % 19 === 0)
          .map((c) => c.id),
      });
      for (let day = 0; day < 13; day++) {
        const at = now + day * 86400000,
          index = Math.min(day, 9);
        s = prepareState(s, addDays(base.start, day));
        assertState(s, "date change");
        transitions++;
        if (s.adaptive.finished.includes(index))
          s = act(s, { action: "reopen", day: index }, at);
        s = act(s, { action: "timer", mode: "start", day: index }, at);
        const reading = sessionChapters(s, index);
        const count =
          day % 4 === 0
            ? 0
            : day % 4 === 1
              ? 1
              : day % 4 === 2
                ? Math.ceil(reading.length / 2)
                : reading.length;
        for (const c of reading.slice(0, count))
          s = act(s, { action: "chapter", chapter: c.id, done: true }, at);
        if (day % 4 === 3)
          for (let more = 0; more < 3; more++) {
            const c = nextExtraChapter(s, index);
            if (!c) break;
            s = act(s, { action: "extend", day: index }, at);
            s = act(s, { action: "chapter", chapter: c.id, done: true }, at);
          }
        s = act(s, { action: "language", lang: day % 2 ? "ru" : "en" }, at);
        assertState(s, "language with timer");
        transitions++;
        s = act(s, { action: "complete", day: index }, at + 180000);
        assertState(s, "finish more/less/zero/overdue");
        transitions++;
        s = parseBackup(makeBackup(s, s.lang, "light", at + 180000)).state;
        assertState(s, "backup restore");
        transitions++;
      }
      s = act(
        s,
        { action: "deadline", end: "2026-11-30" },
        now + 13 * 86400000,
      );
      assertState(s, "extend deadline");
      transitions++;
      assert.equal((s.adaptive.unplanned ?? []).length, 0);
      // Reach genuine completion after corrections; never rely on a percentage.
      const index = 13;
      for (const c of scopeChapters(s.config))
        if (!s.done[c.id] && !s.previouslyRead.includes(c.id))
          s = act(
            s,
            { action: "chapter", chapter: c.id, done: true },
            now + 13 * 86400000,
          );
      s = act(s, { action: "complete", day: index }, now + 13 * 86400000);
      equalInventory(
        [...s.previouslyRead, ...Object.keys(s.done).map(Number)],
        scope,
        "finished plan",
      );
      assert.equal(nextExtraChapter(s, index), undefined);
      assertState(s, "all done");
      transitions++;
    }
console.log(
  `Completeness: ${transitions} adaptive checkpoints and 36 complete reading journeys passed.`,
);

// Exact pre-upgrade references, deliberately covering the whole shifted region.
const legacy = {
  id: crypto.randomUUID(),
  config: { ...base },
  lang: "de",
  done: {},
  previouslyRead: [],
  logs: [{ day: 0, seconds: 600, at: new Date(now).toISOString() }],
  timer: null,
  ops: [],
  pace: { samples: [], draft: null },
  adaptive: {
    date: base.start,
    days: Array.from({ length: 90 }, (_, i) =>
      i === 0 ? legacyReferences.map((_, id) => id) : [],
    ),
    extra: {},
    finished: [],
    unplanned: [],
  },
};
const oldReads = [
  "JOL 2",
  "JOL 3",
  "AMO 1",
  "OBA 1",
  "ZEC 14",
  "MAL 3",
  "MAL 4",
  "MAT 1",
];
for (const ref of oldReads) legacy.done[oldId(ref)] = base.start;
legacy.previouslyRead = [oldId("JOL 1"), oldId("MAL 1")];
legacy.adaptive.days[0] = legacy.adaptive.days[0].filter(
  (id) => !legacy.previouslyRead.includes(id),
);
legacy.pace.samples = [
  { day: 0, chapters: [oldId("JOL 2"), oldId("MAL 4")], seconds: 360 },
  { day: 0, chapters: [oldId("AMO 1"), oldId("MAT 1")], seconds: 240 },
];
const original = structuredClone(legacy),
  migrated = prepareState(legacy, base.start);
assert.deepEqual(legacy, original, "migration never mutates the input");
assert.equal(migrated.chapterSchema, 2);
assert.deepEqual(
  actualRefs(Object.keys(migrated.done).map(Number)).sort(),
  oldReads.filter((ref) => ref !== "MAL 4").sort(),
);
assert(!migrated.done[currentId("JOL 4")]);
assert(migrated.adaptive.days.flat().includes(currentId("JOL 4")));
assert.equal(migrated.chapterCorrection.done["MAL 4"], base.start);
assert.deepEqual(migrated.chapterCorrection.samples[0].references, [
  "JOL 2",
  "MAL 4",
]);
assert.deepEqual(migrated.logs, legacy.logs);
assert.equal(migrated.pace.samples.length, 1);
assert.deepEqual(actualRefs(migrated.pace.samples[0].chapters), [
  "AMO 1",
  "MAT 1",
]);
assert.deepEqual(
  prepareState(migrated, base.start),
  migrated,
  "migration is idempotent",
);
assertState(migrated, "legacy reference migration");
for (const version of [1, 2, 3, 4, 5]) {
  const saved = JSON.stringify({
    app: "leseweg",
    version,
    exportedAt: new Date(now).toISOString(),
    theme: "light",
    state: legacy,
  });
  const restored = parseBackup(saved).state;
  assert.deepEqual(restored, migrated, `backup v${version} migration`);
}
const newBackup = parseBackup(makeBackup(migrated, "de", "light", now));
assert.equal(newBackup.version, 6);
assert.deepEqual(newBackup.state.chapterCorrection, migrated.chapterCorrection);
const incompleteV6 = JSON.parse(makeBackup(migrated, "de", "light", now));
delete incompleteV6.state.chapterSchema;
assert.throws(() => parseBackup(JSON.stringify(incompleteV6)));
const withoutPairs = structuredClone(legacy);
delete withoutPairs.pace;
const recoveredWithoutPairs = prepareState(withoutPairs, base.start);
assert.deepEqual(recoveredWithoutPairs.logs, legacy.logs);
assert.deepEqual(recoveredWithoutPairs.pace, { samples: [], draft: null });

const active = structuredClone(legacy);
active.timer = { day: 0, startedAt: now - 120000 };
active.pace.draft = { day: 0, before: [], secondsBefore: 0 };
const migratedActive = prepareState(active, base.start);
assert.deepEqual(migratedActive.timer, active.timer);
assert.equal(
  migratedActive.pace.draft,
  null,
  "ambiguous open measurement must not train a wrong word/time pair",
);
assertState(migratedActive, "migration during timer");

// A former 100% plan must expose Joel 4 as unread, even after its deadline.
const allOld = {
  ...structuredClone(legacy),
  done: Object.fromEntries(legacyReferences.map((_, id) => [id, base.start])),
  previouslyRead: [],
  pace: { samples: [], draft: null },
};
const allMigrated = prepareState(allOld, "2026-10-06");
assert.equal(Object.keys(allMigrated.done).length, 1188);
assert.deepEqual(allMigrated.adaptive.days.flat(), [currentId("JOL 4")]);
assertState(allMigrated, "formerly complete");

// The IndexedDB upgrade preserves an untouched recovery copy and blocks old
// clients that would otherwise write pre-migration numeric chapter IDs.
globalThis.indexedDB = new IDBFactory();
await new Promise((resolve, reject) => {
  const request = indexedDB.open("leseweg-local", 1);
  request.onupgradeneeded = () => request.result.createObjectStore("reading");
  request.onerror = () => reject(request.error);
  request.onsuccess = () => {
    const db = request.result,
      tx = db.transaction("reading", "readwrite");
    tx.objectStore("reading").put(legacy, "active");
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  };
});
const persisted = await readState();
assert.equal(persisted.chapterSchema, 2);
assertState(persisted, "persisted upgrade");
const archive = await new Promise((resolve, reject) => {
  const r = indexedDB.open("leseweg-local", 2);
  r.onerror = () => reject(r.error);
  r.onsuccess = () => {
    const db = r.result,
      tx = db.transaction("reading", "readonly"),
      get = tx.objectStore("reading").get("before-chapter-schema-2");
    get.onsuccess = () => resolve(get.result);
    tx.oncomplete = () => db.close();
  };
});
assert.deepEqual(archive, legacy);
await assert.rejects(
  new Promise((resolve, reject) => {
    const r = indexedDB.open("leseweg-local", 1);
    r.onerror = () => reject(r.error);
    r.onsuccess = () => {
      r.result.close();
      resolve();
    };
  }),
  { name: "VersionError" },
);
assert.deepEqual((await readState()).done, persisted.done);
for (const lang of ["de", "ru", "en", "uk"])
  assert.deepEqual(
    Object.keys(chapterCorrectionText[lang]).sort(),
    Object.keys(chapterCorrectionText.de).sort(),
  );
console.log(
  "Completeness: Joel/Malachi correction, all shifted references, past/current timers, backups v1–6, full recovery archive and old-client write protection passed.",
);
