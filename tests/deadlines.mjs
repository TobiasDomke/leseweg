import assert from "node:assert/strict";
import { build } from "esbuild";
await build({
  entryPoints: [
    "lib/planner.ts",
    "lib/deadline.ts",
    "lib/deadline-i18n.ts",
    "lib/actions.ts",
    "lib/adaptive.ts",
    "lib/backup.ts",
    "lib/pace.ts",
    "lib/exports.ts",
  ],
  outdir: ".test-runtime/deadlines",
  bundle: true,
  platform: "node",
  format: "esm",
});
const load = (name) => import(`../.test-runtime/deadlines/${name}.js`);
const {
  duration,
  addDays,
  createPlan,
  chaptersFor,
  orderedChapters,
  scopeChapters,
  bible52Config,
} = await load("planner");
const { planEndingOn, rescheduleDeadline, deadlineBounds } =
  await load("deadline");
const { applyAction } = await load("actions");
const {
  prepareState,
  dayIndex,
  readingPlan,
  nextExtraChapter,
  sessionChapters,
} = await load("adaptive");
const { makeBackup, parseBackup } = await load("backup");
const { readingPace } = await load("pace");
const { calendarFile } = await load("exports");
const { deadlineTranslations } = await load("deadline-i18n");
const now = Date.parse("2026-10-06T10:00:00Z");
const base = {
  start: "2026-10-06",
  amount: 365,
  unit: "days",
  time: "07:30",
  timezone: "Europe/Berlin",
  scope: "bible",
  order: "canonical",
  keepTogether: false,
};
const act = (s, op, at = now) =>
  applyAction(
    s,
    { ...op, planId: s?.id ?? null, opId: crypto.randomUUID() },
    at,
  );
const fresh = (config = base, lang = "de", previouslyRead = []) =>
  act(null, { action: "create", config, lang, previouslyRead });
const read = (s, ids, at = now) =>
  ids.reduce(
    (s, chapter) => act(s, { action: "chapter", chapter, done: true }, at),
    s,
  );
const finish = (s, day = 0, at = now) =>
  act(s, { action: "complete", day }, at);
const coverage = (s) => {
  const expected = scopeChapters(s.config)
    .map((c) => c.id)
    .sort((a, b) => a - b);
  const unread = orderedChapters(s.config)
    .filter((c) => !s.done[c.id] && !s.previouslyRead.includes(c.id))
    .map((c) => c.id);
  const assigned = s.adaptive.days
    .flat()
    .filter((id) => !s.done[id])
    .concat(s.adaptive.unplanned ?? []);
  assert.deepEqual(
    assigned,
    unread,
    "every unread chapter appears once, in the chosen order",
  );
  assert.deepEqual(
    [...Object.keys(s.done).map(Number), ...s.previouslyRead, ...assigned].sort(
      (a, b) => a - b,
    ),
    expected,
  );
};
// Explicit goal dates include the start and finish days; no time-zone/DST shifts.
for (const [start, end, days] of [
  ["2026-10-06", "2026-10-06", 1],
  ["2026-10-06", "2026-10-07", 2],
  ["2028-02-28", "2028-03-01", 3],
  ["2026-10-24", "2026-10-26", 3],
  ["2027-03-27", "2027-03-29", 3],
]) {
  const config = planEndingOn({ ...base, start }, end);
  assert.equal(duration(config), days);
  assert.equal(createPlan(config).at(-1).date, end);
}
for (const end of [
  "2026-10-05",
  "2026-02-30",
  "2026-13-01",
  "2026-1-1",
  "",
  addDays(base.start, 3650),
])
  assert.throws(() => planEndingOn(base, end));
assert.equal(duration(planEndingOn(base, addDays(base.start, 3649))), 3650);
const tenMonths = { ...base, start: "2026-09-06", unit: "months", amount: 10 };
assert.equal(createPlan(tenMonths).at(-1).date, "2027-07-05");
assert.equal(
  createPlan(planEndingOn(tenMonths, "2027-07-01")).at(-1).date,
  "2027-07-01",
);
let cases = 0;
for (const [lang, edition] of [
  ["de", "schlachter2000"],
  ["en", "kjv"],
  ["ru", "synodal"],
  ["uk", "ohienko"],
])
  for (const order of ["canonical", "chronological", "mixed"])
    for (const scope of ["bible", "ot", "nt"]) {
      const config = { ...tenMonths, order, scope, edition };
      const prior = orderedChapters(config)
        .slice(0, 3)
        .map((c) => c.id);
      let s = fresh(config, lang, prior),
        day = dayIndex(s.config, "2026-10-06");
      s = act(s, { action: "timer", mode: "start", day });
      s = read(
        s,
        sessionChapters(s, day)
          .slice(0, 2)
          .map((c) => c.id),
        now + 600000,
      );
      s = finish(s, day, now + 600000);
      const history = {
        done: s.done,
        logs: s.logs,
        pace: s.pace,
        sessions: s.sessions,
        prior: s.previouslyRead,
      };
      for (const end of ["2027-07-01", "2027-08-15", "2026-10-07"]) {
        const unchanged = structuredClone(s);
        const preview = rescheduleDeadline(s, end, "2026-10-06");
        assert.deepEqual(s, unchanged, "preview is read-only");
        const changed = act(s, { action: "deadline", end }, now + 601000);
        assert.deepEqual(
          changed.adaptive,
          preview.adaptive,
          "preview and saved schedule agree",
        );
        assert.equal(readingPlan(changed, "2026-10-06").at(-1).date, end);
        assert.deepEqual(
          {
            done: changed.done,
            logs: changed.logs,
            pace: changed.pace,
            sessions: changed.sessions,
            prior: changed.previouslyRead,
          },
          history,
        );
        assert.equal(
          readingPace(changed).secondsPerWord,
          readingPace(s).secondsPerWord,
        );
        assert(changed.adaptive.finished.includes(day));
        assert(
          !changed.adaptive.days
            .slice(day + 1)
            .flat()
            .some((id) => changed.done[id]),
        );
        coverage(changed);
        assert.equal(
          parseBackup(makeBackup(changed, lang, "light", now)).state.config
            .amount,
          changed.config.amount,
        );
        const ics = calendarFile(changed, lang, "https://example.com");
        assert(ics.includes("BEGIN:VCALENDAR"));
        cases++;
      }
    }
// One or several missed days raise the load across the entire remaining period.
let s = fresh({ ...base, amount: 30 });
const original = readingPlan(s, "2026-10-06");
for (const skipped of [1, 3, 10]) {
  const date = addDays(base.start, skipped),
    missed = prepareState(s, date),
    plan = readingPlan(missed, date);
  coverage(missed);
  assert.equal(plan.length, 30);
  assert.equal(plan.at(-1).date, "2026-11-04");
  assert(plan.slice(0, skipped).every((d) => d.chapters.length === 0));
  assert.deepEqual(missed.done, {});
  assert.deepEqual(missed.adaptive.finished, []);
  assert(
    plan[skipped].words <
      original.slice(0, skipped + 1).reduce((sum, d) => sum + d.words, 0),
    "missed portions are not all dumped onto the next day",
  );
  assert(
    plan
      .slice(skipped + 1)
      .some((d, i) => d.words > original[skipped + 1 + i].words),
    "later days share the additional load",
  );
  assert.deepEqual(
    prepareState(missed, date),
    missed,
    "opening the same day again keeps the recommendation",
  );
}
// More reading never marks a future day finished or assigns its chapters twice.
s = fresh();
const normal = s.adaptive.days[0];
assert.deepEqual(normal, [0, 1, 2]);
for (let i = 0; i < 2; i++) s = act(s, { action: "extend", day: 0 });
s = finish(read(s, [0, 1, 2, 3, 4]));
assert.equal(s.adaptive.days[1][0], 5);
assert.deepEqual(s.adaptive.finished, [0]);
coverage(s);
const tomorrow = prepareState(s, "2026-10-07");
assert(!sessionChapters(tomorrow, 1).some((c) => tomorrow.done[c.id]));
assert(!tomorrow.adaptive.finished.includes(1));
// Repeated extra reading reduces the aggregate workload of all future days.
let fast = fresh({ ...base, amount: 30 });
for (let day = 0; day < 8; day++) {
  const at = now + day * 86400000,
    date = addDays(base.start, day);
  fast = prepareState(fast, date);
  const before = fast.adaptive.days
    .slice(day + 1)
    .flat()
    .reduce((sum, id) => sum + chaptersFor(fast.config)[id].words, 0);
  for (let i = 0; i < 2; i++) fast = act(fast, { action: "extend", day }, at);
  fast = read(
    fast,
    sessionChapters(fast, day).map((c) => c.id),
    at,
  );
  fast = finish(fast, day, at);
  const after = fast.adaptive.days
    .slice(day + 1)
    .flat()
    .reduce((sum, id) => sum + chaptersFor(fast.config)[id].words, 0);
  assert(after < before);
  assert.deepEqual(
    fast.adaptive.finished,
    Array.from({ length: day + 1 }, (_, i) => i),
  );
  coverage(fast);
}
// Bringing the deadline to today reopens today's remaining work without losing history.
let done = finish(read(fresh(), [0, 1]));
const sameDay = act(done, { action: "deadline", end: "2026-10-06" });
assert.equal(sameDay.config.amount, 1);
assert(!sameDay.adaptive.finished.includes(0));
assert.equal(sameDay.adaptive.days[0].length, 1187);
assert.deepEqual(sameDay.adaptive.extra[0], [0, 1]);
assert.deepEqual(sameDay.sessions, done.sessions);
assert.deepEqual(sameDay.done, done.done);
coverage(sameDay);
assert.deepEqual(
  parseBackup(makeBackup(sameDay, "de", "light", now)).state.adaptive,
  sameDay.adaptive,
);
const future = fresh({ ...base, start: "2026-11-01" });
assert.throws(() => act(future, { action: "deadline", end: "2026-10-31" }));
assert.equal(
  act(future, { action: "deadline", end: "2026-11-01" }).config.amount,
  1,
);
// Active timers are not silently stopped; paused measurements survive changing the goal.
let timed = act(fresh(), { action: "timer", mode: "start", day: 0 });
assert.throws(
  () => act(timed, { action: "deadline", end: "2026-12-01" }),
  /timer/,
);
timed = read(timed, [0], now + 300000);
timed = act(timed, { action: "timer", mode: "pause", day: 0 }, now + 300000);
const paused = act(
  timed,
  { action: "deadline", end: "2026-12-01" },
  now + 300000,
);
assert.deepEqual(paused.pace, timed.pace);
assert.deepEqual(paused.logs, timed.logs);
assert.equal(finish(paused, 0, now + 300000).pace.samples[0].seconds, 300);
// A manual future entry must never be orphaned by shrinking the arrays.
const futureLog = act(fresh(), { action: "correct", day: 40, minutes: 5 });
assert.equal(deadlineBounds(futureLog, "2026-10-06").min, "2026-11-15");
assert.throws(() => act(futureLog, { action: "deadline", end: "2026-11-14" }));
const safe = act(futureLog, { action: "deadline", end: "2026-11-15" });
assert.deepEqual(safe.logs, futureLog.logs);
parseBackup(makeBackup(safe, "de", "light", now));
// No timetable changes are allowed for the expressly fixed original school plan.
const fixed = fresh(bible52Config(base));
assert.throws(() => planEndingOn(fixed.config, "2027-07-01"));
assert.throws(() => act(fixed, { action: "deadline", end: "2027-07-01" }));
for (const lang of ["en", "ru", "uk"]) {
  assert.deepEqual(
    Object.keys(deadlineTranslations[lang]),
    Object.keys(deadlineTranslations.de),
  );
  for (const key of Object.keys(deadlineTranslations.de))
    assert.deepEqual(
      [...deadlineTranslations[lang][key].matchAll(/\{\w+\}/g)]
        .map((x) => x[0])
        .sort(),
      [...deadlineTranslations.de[key].matchAll(/\{\w+\}/g)]
        .map((x) => x[0])
        .sort(),
    );
}
console.log(
  `Deadlines: inclusive dates/DST/leap day, ${cases} edition/scope/order retargets, history and backups, missed days, repeated extra reading, earlier/later/today targets and fixed-template protection passed.`,
);
