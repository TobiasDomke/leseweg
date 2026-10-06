import assert from "node:assert/strict";
import { build } from "esbuild";
await build({
  entryPoints: [
    "lib/actions.ts",
    "lib/adaptive.ts",
    "lib/backup.ts",
    "lib/exports.ts",
  ],
  outdir: ".test-runtime",
  bundle: true,
  platform: "node",
  format: "esm",
});
const { applyAction } = await import("../.test-runtime/actions.js");
const { prepareState, readingPlan, sessionChapters } = await import(
  "../.test-runtime/adaptive.js"
);
const { makeBackup, parseBackup } = await import("../.test-runtime/backup.js");
const { calendarFile, csvFile } = await import("../.test-runtime/exports.js");
const now = Date.parse("2026-10-06T10:00:00Z");
const config = {
  amount: 365,
  unit: "days",
  start: "2026-10-06",
  time: "07:30",
  timezone: "Europe/Berlin",
};
const op = (state, data) => ({
  ...data,
  planId: state?.id ?? null,
  opId: crypto.randomUUID(),
});
const act = (state, data, at = now) => applyAction(state, op(state, data), at);
const fresh = (cfg = config) =>
  act(null, { action: "create", config: cfg, lang: "de" });
const read = (state, ids, at = now) =>
  ids.reduce(
    (s, chapter) => act(s, { action: "chapter", chapter, done: true }, at),
    state,
  );
const finish = (state, day = 0, at = now) =>
  act(state, { action: "complete", day }, at);
function coverage(state, from) {
  const future = state.adaptive.days.slice(from).flat();
  const unread = Array.from({ length: 1189 }, (_, id) => id).filter(
    (id) => !state.done[id],
  );
  assert.deepEqual(
    future,
    unread,
    "All remaining chapters are assigned once, in order, without previously read chapters",
  );
  assert.equal(
    readingPlan(state, state.adaptive.date).at(-1).date,
    state.config.unit === "days" && state.config.amount === 1
      ? "2026-10-06"
      : "2027-10-05",
  );
}
const start = fresh();
const recommended = start.adaptive.days[0];
assert.deepEqual(recommended, [0, 1, 2]);
let less = read(start, [0]);
assert.deepEqual(
  less.adaptive.days[0],
  recommended,
  "Checking chapters must not move the recommendation",
);
less = finish(less);
assert.deepEqual(
  Object.keys(less.done),
  ["0"],
  "Finish must never mark unread chapters",
);
assert.deepEqual(less.adaptive.days[0], [0], "History shows actual reading");
assert.equal(
  less.adaptive.days[1][0],
  1,
  "Skipped recommendation returns at the front",
);
coverage(less, 1);
let more = act(start, { action: "extend", day: 0 });
assert.deepEqual(more.adaptive.days[0], recommended);
assert.deepEqual(more.adaptive.extra[0], [3]);
more = act(more, { action: "extend", day: 0 });
assert.equal(new Set(sessionChapters(more, 0).map((c) => c.id)).size, 5);
more = finish(read(more, [0, 1, 2, 3, 4]));
assert.equal(more.adaptive.days[1][0], 5);
coverage(more, 1);
const words = (state) =>
  readingPlan(state, state.adaptive.date)
    .slice(1)
    .reduce((s, day) => s + day.words, 0);
assert(words(more) < words(less), "Reading ahead lowers future daily workload");
const zero = finish(start);
assert.equal(Object.keys(zero.done).length, 0);
assert.deepEqual(zero.adaptive.days[0], []);
coverage(zero, 1);
const reopened = act(less, { action: "reopen", day: 0 });
assert(!reopened.adaptive.finished.includes(0));
assert.deepEqual(reopened.adaptive.extra[0], [0]);
coverage(reopened, 0);
const reread = finish(read(reopened, [1]));
assert.deepEqual(reread.adaptive.days[0], [0, 1]);
assert.equal(reread.adaptive.finished.filter((d) => d === 0).length, 1);
coverage(reread, 1);

// Date rollover includes missed days; old reading and time records stay intact.
const skipped = prepareState(less, "2026-10-13");
assert(skipped.adaptive.days.slice(1, 7).every((ids) => ids.length === 0));
assert.deepEqual(skipped.adaptive.days[0], [0]);
coverage(skipped, 7);
assert(
  readingPlan(skipped, "2026-10-13")[7].words >
    readingPlan(less, "2026-10-06")[1].words,
);

let timed = act(start, { action: "timer", mode: "start", day: 0 });
timed = finish(read(timed, [0]), 0, now + 90000);
assert.equal(timed.timer, null);
assert.equal(timed.logs[0].seconds, 90);
const overnight = act(start, { action: "timer", mode: "start", day: 0 });
assert.equal(prepareState(overnight, "2026-10-07").adaptive.date, "2026-10-06");
const endedOvernight = finish(
  read(overnight, [0], now + 86400000),
  0,
  now + 86400000,
);
assert.deepEqual(endedOvernight.adaptive.days[1], [0]);
coverage(endedOvernight, 2);

// Neither expiry nor a very short plan silently extends the requested deadline.
let last = fresh({ ...config, amount: 1 });
last = finish(read(last, [0]));
assert.equal(last.adaptive.days.length, 1);
assert.equal(Object.keys(last.done).length, 1);
const expired = prepareState(last, "2026-10-07");
assert.equal(expired.adaptive.days.length, 1);
const continueExpired = act(
  expired,
  { action: "reopen", day: 0 },
  now + 86400000,
);
coverage(continueExpired, 0);

const all = finish(
  read(
    start,
    Array.from({ length: 1189 }, (_, i) => i),
  ),
);
assert(all.adaptive.days.slice(1).every((ids) => ids.length === 0));
assert.equal(Object.keys(all.done).length, 1189);
const legacy = structuredClone(more);
delete legacy.adaptive;
const migrated = prepareState(legacy, "2026-10-06");
assert.deepEqual(migrated.done, legacy.done);
assert.deepEqual(migrated.logs, legacy.logs);
assert(migrated.adaptive.finished.includes(0));
coverage(migrated, 1);
const restored = parseBackup(makeBackup(more, "de", "light", now));
assert.deepEqual(restored.state.adaptive, more.adaptive);
const oldFile = JSON.parse(makeBackup(legacy, "de", "light", now));
oldFile.version = 1;
assert.equal(parseBackup(JSON.stringify(oldFile)).state.adaptive, undefined);
const corrupt = JSON.parse(makeBackup(more, "de", "light", now));
corrupt.state.adaptive.days[1].push(corrupt.state.adaptive.days[2][0]);
assert.throws(() => parseBackup(JSON.stringify(corrupt)));
assert(calendarFile(more, "de", "https://example.com").includes("1. Mose 6"));
assert(csvFile(more, "de").includes("1. Mose 1–5"));
console.log(
  "Adaptive plan: more/less/zero reading, stable recommendations, coverage, missed days, timer, deadline, legacy data, backup and exports passed.",
);
