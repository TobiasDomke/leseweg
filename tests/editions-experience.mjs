import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { build } from "esbuild";
await build({
  entryPoints: [
    "lib/planner.ts",
    "lib/actions.ts",
    "lib/pace.ts",
    "lib/adaptive.ts",
    "lib/backup.ts",
    "lib/session-stats.ts",
    "lib/installation.ts",
    "lib/experience-i18n.ts",
    "lib/editions.ts",
  ],
  outdir: ".test-runtime/experience",
  bundle: true,
  platform: "node",
  format: "esm",
});
const load = (name) => import(`../.test-runtime/experience/${name}.js`);
const {
  chaptersFor,
  createPlan,
  scopeChapters,
  orderedChapters,
  historicalGroupsFor,
} = await load("planner");
const { applyAction } = await load("actions");
const { readingPace } = await load("pace");
const { prepareState, readingPlan } = await load("adaptive");
const { makeBackup, parseBackup } = await load("backup");
const { dailySeconds, sessionsFor } = await load("session-stats");
const { languageEdition } = await load("editions");
const { isStandalone } = await load("installation");
const { experienceText } = await load("experience-i18n");
const canon = JSON.parse(
  await readFile(new URL("../lib/edition-canon.json", import.meta.url)),
);
const schlachter = JSON.parse(
  await readFile(new URL("../lib/schlachter-canon.json", import.meta.url)),
);
const now = Date.parse("2026-10-06T10:00:00Z");
const base = {
  amount: 365,
  unit: "days",
  start: "2026-10-06",
  time: "07:30",
  timezone: "Europe/Berlin",
  bookOrderMode: "auto",
};
const act = (state, op, at = now) =>
  applyAction(
    state,
    { ...op, planId: state?.id ?? null, opId: crypto.randomUUID() },
    at,
  );
const fresh = (lang = "de", config = base, previouslyRead = []) =>
  act(null, { action: "create", config, lang, previouslyRead });
const sort = (ids) => [...ids].sort((a, b) => a - b);
let cases = 0;
for (const lang of ["de", "en", "ru", "uk"]) {
  const edition = languageEdition(lang),
    chapters = chaptersFor({ edition });
  assert.equal(chapters.length, 1189);
  assert.equal(new Set(chapters.map((c) => c.code)).size, 66);
  assert.deepEqual(
    canon.books.map((b) => chapters.filter((c) => c.code === b.code).length),
    edition === "schlachter2000"
      ? schlachter.books.map((b) => b.chapters)
      : canon.books.map((b) => b[edition]),
  );
  assert.equal(
    chapters.filter((c) => c.code === "JOL").length,
    lang === "de" ? 4 : 3,
  );
  assert.equal(
    chapters.filter((c) => c.code === "MAL").length,
    lang === "de" ? 3 : 4,
  );
  const s = fresh(lang);
  assert.equal(s.config.edition, edition);
  assert.equal(
    s.config.bookOrder,
    lang === "de" || lang === "en" ? "western" : "eastern",
  );
  for (const language of ["de", "en", "ru", "uk"]) {
    const changed = act(s, { action: "language", lang: language });
    assert.equal(changed.config.edition, edition);
    assert.equal(changed.config.bookOrder, s.config.bookOrder);
  }
  const groups = historicalGroupsFor({ edition });
  assert.deepEqual(
    sort(groups.flatMap((g) => g.chapters.map((c) => c.id))),
    chapters.map((c) => c.id),
  );
  // Psalm associated with Nathan and David is Psalm 50 in Synodal, 51 elsewhere.
  const nathan = groups.find((g) =>
    g.chapters.some(
      (c) => c.code === "PSA" && c.number === (lang === "ru" ? 50 : 51),
    ),
  );
  assert(nathan);
  assert.equal(
    nathan.id,
    historicalGroupsFor({ edition: "schlachter2000" }).find((g) =>
      g.chapters.some((c) => c.code === "PSA" && c.number === 51),
    ).id,
  );
  for (const scope of ["bible", "ot", "nt"])
    for (const order of ["canonical", "chronological", "mixed"])
      for (const bookOrder of ["western", "eastern"])
        for (const amount of [1, 7, 30, 365, 1500, 3650]) {
          const config = {
            ...base,
            edition,
            scope,
            order,
            bookOrder,
            amount,
            keepTogether: true,
          };
          const items = scopeChapters(config);
          const previous = items.filter((_, i) => i % 7 === 0).map((c) => c.id),
            plan = createPlan(config, previous),
            assigned = plan.flatMap((d) => d.chapters.map((c) => c.id));
          assert.deepEqual(
            sort([...previous, ...assigned]),
            sort(items.map((c) => c.id)),
          );
          assert.equal(new Set([...previous, ...assigned]).size, items.length);
          assert.deepEqual(
            assigned,
            orderedChapters(config)
              .filter((c) => !previous.includes(c.id))
              .map((c) => c.id),
          );
          cases++;
        }
  for (const scope of ["bible", "ot", "nt"])
    for (const order of ["canonical", "chronological", "mixed"]) {
      let state = fresh(
        lang,
        { ...base, edition, scope, order, amount: 7 },
        scopeChapters({ edition, scope })
          .filter((_, i) => i % 13 === 0)
          .map((c) => c.id),
      );
      for (let day = 0; day < 7; day++) {
        const at = now + day * 86400000;
        state = prepareState(
          state,
          `2026-10-${String(6 + day).padStart(2, "0")}`,
        );
        const reading = readingPlan(state, state.adaptive.date)[day].chapters;
        for (const c of reading.slice(
          0,
          day % 2 ? reading.length : Math.ceil(reading.length / 2),
        ))
          state = act(
            state,
            { action: "chapter", chapter: c.id, done: true },
            at,
          );
        state = act(state, { action: "complete", day }, at);
        const remaining = [
          ...state.adaptive.days.flat(),
          ...(state.adaptive.unplanned ?? []),
        ].filter((id) => !state.done[id]);
        assert.deepEqual(
          sort([
            ...state.previouslyRead,
            ...Object.keys(state.done).map(Number),
            ...remaining,
          ]),
          sort(scopeChapters(state.config).map((c) => c.id)),
        );
        assert.deepEqual(
          parseBackup(makeBackup(state, lang, "light", at)).state.config,
          state.config,
        );
      }
    }
  assert.deepEqual(
    Object.keys(experienceText(lang)),
    Object.keys(experienceText("de")),
  );
}
// Multiple sessions, pause/resume, and correcting yesterday must not add today.
let s = fresh();
s = act(s, { action: "timer", mode: "start", day: 0 });
s = act(s, { action: "chapter", chapter: 0, done: true });
s = act(s, { action: "complete", day: 0 }, now + 300000);
s = act(s, { action: "reopen", day: 0 }, now + 600000);
s = act(s, { action: "timer", mode: "start", day: 0 }, now + 600000);
s = act(s, { action: "chapter", chapter: 1, done: true }, now + 610000);
s = act(s, { action: "complete", day: 0 }, now + 900000);
assert.equal(sessionsFor(s).length, 2);
assert.equal(
  sessionsFor(s).reduce((n, x) => n + x.seconds, 0),
  600,
);
const corrected = act(
  s,
  { action: "correct", day: 0, minutes: 30 },
  now + 86400000,
);
assert.deepEqual(dailySeconds(corrected, now + 86400000), {
  "2026-10-06": 1800,
});
assert.equal(
  corrected.sessions.reduce((n, x) => n + x.seconds, 0),
  1800,
);
const overnightStart = Date.parse("2026-10-06T21:59:00Z");
let midnight = act(
  fresh(),
  { action: "timer", mode: "start", day: 0 },
  overnightStart,
);
midnight = act(
  midnight,
  { action: "timer", mode: "pause", day: 0 },
  overnightStart + 180000,
);
assert.deepEqual(dailySeconds(midnight), { "2026-10-06": 180 });
// Early prediction blends towards the observed pace. Five samples establish it.
let learning = fresh();
for (let i = 0; i < 5; i++) {
  if (i)
    learning = act(learning, { action: "reopen", day: 0 }, now + i * 1000000);
  learning = act(
    learning,
    { action: "timer", mode: "start", day: 0 },
    now + i * 1000000,
  );
  learning = act(
    learning,
    { action: "chapter", chapter: i, done: true },
    now + i * 1000000,
  );
  learning = act(
    learning,
    { action: "complete", day: 0 },
    now + i * 1000000 + 300000,
  );
  const p = readingPace(learning);
  if (i === 0) {
    assert(p.learning);
    assert(!p.personal);
    assert(p.secondsPerWord > Math.min(1 / 3, 300 / chaptersFor()[0].words));
    assert(p.secondsPerWord < Math.max(1 / 3, 300 / chaptersFor()[0].words));
  }
}
assert(readingPace(learning).personal);
let outlier = act(fresh(), { action: "timer", mode: "start", day: 0 });
outlier = act(outlier, { action: "chapter", chapter: 0, done: true });
outlier = act(outlier, { action: "complete", day: 0 }, now + 10800000);
assert.equal(readingPace(outlier).secondsPerWord, 1 / 3);
assert.equal(outlier.logs[0].seconds, 10800);
assert.equal(readingPace(outlier).excluded, 1);
outlier = act(outlier, {
  action: "review-pace",
  index: 0,
  seconds: 10800,
  review: "confirmed",
});
assert(readingPace(outlier).learning);
// An edition migration retains unambiguous references and flags partial Psalms.
let old = fresh();
const ps = chaptersFor().find((c) => c.code === "PSA" && c.number === 23).id;
old = act(old, { action: "chapter", chapter: ps, done: true });
old = act(old, { action: "chapter", chapter: 0, done: true });
const converted = act(old, { action: "edition", edition: "synodal" });
assert(converted.done[0]);
assert.equal(Object.keys(converted.done).length, 1);
assert(converted.editionReview.some((ref) => ref.endsWith("PSA 23")));
assert.equal(
  new Set([
    ...Object.keys(converted.done).map(Number),
    ...converted.adaptive.days.flat().filter((id) => !converted.done[id]),
  ]).size,
  1189,
);
assert.deepEqual(
  parseBackup(makeBackup(converted, "ru", "light", now)).state.editionReview,
  converted.editionReview,
);
assert(!isStandalone({ matches: false }, {}));
assert(isStandalone({ matches: true }, {}));
assert(isStandalone({ matches: false }, { standalone: true }));
assert(!isStandalone({ matches: false }, { standalone: false }));
console.log(
  `Editions/experience: ${cases} complete plans, 36 adaptive journeys, four independent book inventories, Psalm links, stable language changes, session statistics, midnight, corrected dates, gradual pace, outliers, migrations and backups passed.`,
);

// Correcting the day's total while a second session is still open must leave
// its proportional time available for that second session on completion.
let openCorrection = act(s, { action: "reopen", day: 0 }, now + 1000000);
openCorrection = act(
  openCorrection,
  { action: "timer", mode: "start", day: 0 },
  now + 1000000,
);
openCorrection = act(
  openCorrection,
  { action: "chapter", chapter: 2, done: true },
  now + 1001000,
);
openCorrection = act(
  openCorrection,
  { action: "correct", day: 0, minutes: 30 },
  now + 1300000,
);
assert.equal(
  openCorrection.sessions.reduce((n, s) => n + s.seconds, 0),
  1200,
);
openCorrection = act(
  openCorrection,
  { action: "complete", day: 0 },
  now + 1300000,
);
assert.equal(openCorrection.sessions.length, 3);
assert.equal(openCorrection.sessions[2].seconds, 600);
assert.equal(
  openCorrection.sessions.reduce((n, s) => n + s.seconds, 0),
  1800,
);

// Whole read books stay measured progress, not newly estimated prior progress,
// and must not leak back into a later session when chapter counts change.
let whole = fresh("en");
const joel = chaptersFor(whole.config).filter((c) => c.code === "JOL");
whole = act(whole, { action: "timer", mode: "start", day: 0 });
for (const c of joel)
  whole = act(whole, { action: "chapter", chapter: c.id, done: true });
whole = act(whole, { action: "complete", day: 0 }, now + 600000);
whole = act(
  whole,
  { action: "edition", edition: "schlachter2000" },
  now + 600000,
);
const newJoel = chaptersFor(whole.config).filter((c) => c.code === "JOL");
assert(newJoel.every((c) => whole.done[c.id]));
assert.equal(whole.previouslyRead.length, 0);
assert.deepEqual(
  sort(whole.sessions[0].chapters),
  newJoel.map((c) => c.id),
);
whole = act(whole, { action: "reopen", day: 0 }, now + 700000);
whole = act(whole, { action: "chapter", chapter: 0, done: true }, now + 700000);
whole = act(whole, { action: "complete", day: 0 }, now + 700000);
assert.deepEqual(whole.sessions[1].chapters, [0]);
assert.equal(
  whole.logs.reduce((n, l) => n + l.seconds, 0),
  600,
);

// Test-only entrypoints and an installation URL switch must never ship.
const distHtml = await readFile(
  new URL("../dist/index.html", import.meta.url),
  "utf8",
);
assert(!distHtml.includes("tests/preview"));
console.log(
  "Open-session corrections and full-book edition migrations passed.",
);
