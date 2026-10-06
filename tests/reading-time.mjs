import assert from "node:assert/strict";
import { build } from "esbuild";
await build({
  entryPoints: [
    "lib/reading-time.ts",
    "lib/reading-time-i18n.ts",
    "lib/actions.ts",
    "lib/pace.ts",
    "lib/planner.ts",
    "lib/backup.ts",
  ],
  outdir: ".test-runtime/reading-time",
  bundle: true,
  platform: "node",
  format: "esm",
});
const load = (name) => import(`../.test-runtime/reading-time/${name}.js`);
const { readingTime, readingTimeClock, readingTimeSummary, correctionSeconds } =
  await load("reading-time");
const { readingTimeTranslations } = await load("reading-time-i18n");
const { readingPace, estimatedSeconds } = await load("pace");
const { scopeChapters, bible52Config } = await load("planner");
const { applyAction } = await load("actions");
const { makeBackup, parseBackup } = await load("backup");
const plain = (s) => s.replaceAll("\u00a0", " ");
for (const [seconds, output] of [
  [0, "0 Min."],
  [1, "< 1 Min."],
  [59, "< 1 Min."],
  [60, "1 Min."],
  [3599, "1 Std. 0 Min."],
  [3600, "1 Std. 0 Min."],
  [16860, "4 Std. 41 Min."],
  [16877, "4 Std. 41 Min."],
  [16901, "4 Std. 42 Min."],
  [90000, "25 Std. 0 Min."],
])
  assert.equal(plain(readingTime(seconds, "de")), output);
for (const [lang, expected] of [
  ["en", "4 h 41 min"],
  ["ru", "4 ч 41 мин"],
  ["uk", "4 год 41 хв"],
])
  assert.equal(plain(readingTime(16860, lang)), expected);
assert.equal(readingTimeClock(16877), "4:41");
assert.equal(readingTimeClock(86400), "24:00");
assert.equal(
  correctionSeconds({ hours: "4", minutes: "41", seconds: "17" }),
  16877,
);
assert.equal(
  correctionSeconds({ hours: "24", minutes: "0", seconds: "0" }),
  86400,
);
for (const values of [
  ["24", "0", "1"],
  ["0", "60", "0"],
  ["0", "0", "60"],
  ["-1", "0", "0"],
  ["0", "1.5", "0"],
  ["", "0", "0"],
  ["Infinity", "0", "0"],
])
  assert.equal(
    correctionSeconds(
      Object.fromEntries(
        ["hours", "minutes", "seconds"].map((k, i) => [k, values[i]]),
      ),
    ),
    null,
  );

const now = Date.parse("2026-10-06T10:00:00Z");
const base = {
  start: "2026-10-06",
  amount: 365,
  unit: "days",
  time: "07:30",
  timezone: "Europe/Berlin",
};
const act = (state, op, at = now) =>
  applyAction(
    state,
    { ...op, planId: state?.id ?? null, opId: crypto.randomUUID() },
    at,
  );
const fresh = (config = base, lang = "de", previouslyRead = []) =>
  act(null, { action: "create", config, lang, previouslyRead });
const near = (actual, expected) =>
  assert(Math.abs(actual - expected) < 1e-7, `${actual} != ${expected}`);
let cases = 0;
for (const [lang, edition] of [
  ["de", "schlachter2000"],
  ["en", "kjv"],
  ["ru", "synodal"],
  ["uk", "ohienko"],
])
  for (const scope of ["bible", "ot", "nt"]) {
    const config = { ...base, edition, scope };
    const chapters = scopeChapters(config);
    let s = fresh(config, lang, [chapters[0].id]);
    const original = structuredClone(s);
    let summary = readingTimeSummary(s, now);
    assert.deepEqual(s, original, "statistics must not mutate data");
    near(
      summary.previousSeconds,
      chapters[0].words * readingPace(s).secondsPerWord,
    );
    assert.equal(summary.remainingChapters, chapters.length - 1);
    assert.equal(summary.measuredSeconds, 0);
    const initialTotal = summary.totalSeconds;
    s = act(s, { action: "chapter", chapter: chapters[1].id, done: true });
    summary = readingTimeSummary(s, now);
    assert.equal(summary.unmeasuredChapters, 1);
    near(
      summary.totalSeconds,
      initialTotal,
      "untimed progress moves time from future to past",
    );
    assert.equal(summary.remainingChapters, chapters.length - 2);
    // A correction is real measured time; preserve every second, no double count.
    s = act(s, { action: "correct", day: 0, minutes: 301 / 60 });
    s = act(s, { action: "complete", day: 0 });
    summary = readingTimeSummary(s, now);
    assert.equal(summary.measuredSeconds, 301);
    assert.equal(summary.unmeasuredSeconds, 0);
    near(summary.pastSeconds, 301 + summary.previousSeconds);
    near(summary.totalSeconds, summary.pastSeconds + summary.remainingSeconds);
    near(
      summary.remainingSeconds,
      chapters.slice(2).reduce((n, c) => n + c.words, 0) *
        readingPace(s).secondsPerWord,
    );
    const restored = parseBackup(makeBackup(s, lang, "light", now)).state;
    assert.deepEqual(readingTimeSummary(restored, now), summary);
    // A different personal pace updates both prior estimates and remaining work,
    // without changing the recorded 301 seconds.
    const faster = readingTimeSummary(s, now, {
      ...readingPace(s),
      secondsPerWord: readingPace(s).secondsPerWord / 2,
    });
    near(faster.remainingSeconds, summary.remainingSeconds / 2);
    near(faster.previousSeconds, summary.previousSeconds / 2);
    assert.equal(faster.measuredSeconds, 301);
    const finished = fresh(
      config,
      lang,
      chapters.map((c) => c.id),
    );
    assert.equal(readingTimeSummary(finished, now).remainingSeconds, 0);
    cases++;
  }
// A live timer and a paused draft are included once, with their actual seconds.
let s = fresh();
s = act(s, { action: "timer", mode: "start", day: 0 });
s = act(s, { action: "chapter", chapter: 0, done: true }, now + 29000);
let summary = readingTimeSummary(s, now + 29000);
assert.equal(summary.measuredSeconds, 29);
assert.equal(summary.unmeasuredSeconds, 0);
s = act(s, { action: "timer", mode: "pause", day: 0 }, now + 29000);
assert.equal(readingTimeSummary(s, now + 999999).measuredSeconds, 29);
s = act(s, { action: "timer", mode: "start", day: 0 }, now + 60000);
assert.equal(readingTimeSummary(s, now + 93000).measuredSeconds, 62);
s = act(s, { action: "complete", day: 0 }, now + 93000);
summary = readingTimeSummary(s, now + 93000);
assert.equal(summary.measuredSeconds, 62);
assert.equal(summary.unmeasuredChapters, 0);
// Excluding an outlier from pace learning must not turn measured time into an estimate.
s = act(
  s,
  { action: "review-pace", index: 0, seconds: 62, review: "excluded" },
  now + 94000,
);
assert.equal(readingTimeSummary(s, now + 94000).unmeasuredSeconds, 0);
assert.equal(readingTimeSummary(s, now + 94000).measuredSeconds, 62);
// Timer-less extra reading on the same day has a separate estimate.
s = act(s, { action: "reopen", day: 0 }, now + 95000);
s = act(s, { action: "chapter", chapter: 1, done: true }, now + 95000);
s = act(s, { action: "complete", day: 0 }, now + 95000);
assert.equal(readingTimeSummary(s, now + 95000).unmeasuredChapters, 1);
assert.equal(readingTimeSummary(s, now + 95000).measuredSeconds, 62);
// Seconds are summed before formatting; short sessions are not rounded away.
const tiny = fresh();
tiny.logs = [
  { day: 0, seconds: 31, at: new Date(now).toISOString() },
  { day: 0, seconds: 31, at: new Date(now).toISOString() },
];
assert.equal(readingTimeSummary(tiny, now).measuredSeconds, 62);
assert.equal(
  plain(readingTime(readingTimeSummary(tiny, now).measuredSeconds, "de")),
  "1 Min.",
);
// Legacy daily-only measurements and fixed school plans remain supported.
const legacy = fresh();
delete legacy.sessions;
delete legacy.pace;
legacy.done = { 0: "2026-10-06" };
legacy.logs = [{ day: 0, seconds: 16877, at: new Date(now).toISOString() }];
legacy.adaptive.finished = [0];
assert.equal(readingTimeSummary(legacy, now).unmeasuredSeconds, 0);
assert.equal(readingTimeSummary(legacy, now).measuredSeconds, 16877);
const fixed = fresh(bible52Config(base), "uk", [0, 1]);
const frozen = structuredClone(fixed);
assert.equal(readingTimeSummary(fixed, now).remainingChapters, 1187);
assert.deepEqual(fixed, frozen);
assert.equal(
  estimatedSeconds(1, { ...readingPace(null), secondsPerWord: 0.375 }),
  0.375,
);
for (const lang of ["en", "ru", "uk"])
  assert.deepEqual(
    Object.keys(readingTimeTranslations[lang]),
    Object.keys(readingTimeTranslations.de),
  );
console.log(
  `Reading time: hours/minutes, exact seconds and corrections, ${cases} edition/scope forecasts, prior and untimed reading, pace changes, no double counting, live/pause/resume, outliers, completion, legacy data and backups passed.`,
);
