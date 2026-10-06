import assert from "node:assert/strict";
import { build } from "esbuild";
await build({
  entryPoints: [
    "lib/actions.ts",
    "lib/planner.ts",
    "lib/pace.ts",
    "lib/backup.ts",
    "lib/exports.ts",
  ],
  outdir: ".test-runtime",
  bundle: true,
  platform: "node",
  format: "esm",
});
const { applyAction } = await import("../.test-runtime/actions.js");
const { chapters } = await import("../.test-runtime/planner.js");
const { readingPace, estimatedMinutes, paceState } = await import(
  "../.test-runtime/pace.js"
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
const act = (state, data, at = now) =>
  applyAction(
    state,
    {
      ...data,
      planId: state?.id ?? null,
      opId: crypto.randomUUID(),
    },
    at,
  );
const fresh = () => act(null, { action: "create", config, lang: "de" });
const read = (state, ids, at = now) =>
  ids.reduce(
    (s, chapter) => act(s, { action: "chapter", chapter, done: true }, at),
    state,
  );
const timer = (state, mode, at = now, day = 0) =>
  act(state, { action: "timer", mode, day }, at);
const finish = (state, at = now, day = 0) =>
  act(state, { action: "complete", day }, at);
const reopen = (state) => act(state, { action: "reopen", day: 0 });
const correct = (state, minutes, day = 0) =>
  act(state, { action: "correct", minutes, day });
const words = (ids) => ids.reduce((sum, id) => sum + chapters[id].words, 0);
const expected = (seconds, ids) => seconds / words(ids);
const rate = (state) => {
  const p = readingPace(state);
  const ids = paceState(state)
    .samples.filter((s) => s.review !== "excluded")
    .flatMap((s) => s.chapters);
  return ids.length && p.seconds ? p.seconds / words(ids) : p.secondsPerWord;
};
const empty = fresh();
assert.equal(readingPace(empty).personal, false);
assert.equal(estimatedMinutes(1800, readingPace(empty)), 10);
assert.equal(estimatedMinutes(0, readingPace(empty)), 0);
assert.equal(estimatedMinutes(1, readingPace(empty)), 1);
assert.equal(
  readingPace(finish(read(empty, [0]))).personal,
  false,
  "Untimed reading cannot teach a rate",
);

let measuring = timer(empty, "start");
measuring = read(measuring, [0]);
assert.equal(
  readingPace(measuring).personal,
  false,
  "Running measurements must not distort estimates",
);
let paused = timer(measuring, "pause", now + 120000);
assert.equal(readingPace(paused).personal, false);
paused = timer(paused, "start", now + 600000);
paused = timer(paused, "stop", now + 660000);
let measured = finish(paused, now + 700000);
assert.equal(
  rate(measured),
  expected(180, [0]),
  "Pauses and stopped time are excluded",
);
assert.equal(
  readingPace(measured).chapters,
  1,
  "Only actually read chapters, not all recommendations",
);
assert.equal(measured.pace.samples.length, 1);
assert.deepEqual(
  finish(measured).pace,
  measured.pace,
  "Repeated completion does not count a sample twice",
);
const repeated = {
  action: "complete",
  day: 0,
  planId: measured.id,
  opId: crypto.randomUUID(),
};
const once = applyAction(measured, repeated, now);
assert.deepEqual(applyAction(once, repeated, now), once);

let second = timer(reopen(measured), "start", now + 800000);
second = read(second, [1], now + 801000);
assert.equal(
  rate(second),
  rate(measured),
  "Reopening does not change completed calibration",
);
second = finish(second, now + 1400000);
assert.equal(second.pace.samples.length, 2);
assert.equal(
  rate(second),
  expected(780, [0, 1]),
  "Use total time / total words, not an average of session speeds",
);
assert.notEqual(rate(second), (expected(180, [0]) + expected(600, [1])) / 2);
let untimed = finish(read(reopen(second), [2]));
assert.equal(
  rate(untimed),
  rate(second),
  "Later untimed chapters must not be paired with earlier time",
);
let afterUntimed = timer(reopen(untimed), "start", now + 1500000);
afterUntimed = act(afterUntimed, { action: "extend", day: 0 });
afterUntimed = finish(read(afterUntimed, [3, 4]), now + 1800000);
assert.equal(rate(afterUntimed), expected(1080, [0, 1, 3, 4]));
assert.equal(readingPace(afterUntimed).chapters, 4);

// A timer without any read chapters is retained in statistics, not calibration.
let noChapters = finish(timer(empty, "start"), now + 600000);
assert.equal(readingPace(noChapters).personal, false);
noChapters = timer(reopen(noChapters), "start", now + 700000);
noChapters = finish(read(noChapters, [0]), now + 760000);
assert.equal(
  rate(noChapters),
  expected(60, [0]),
  "Discarded measurement cannot leak into next reading",
);
assert.equal(
  readingPace(finish(read(timer(empty, "start"), [0]))).personal,
  false,
  "Zero-second sessions are ignored",
);

// Explicit corrections cover the whole recorded unit, and overwrite prior samples.
const corrected = correct(second, 20);
assert.equal(rate(corrected), expected(1200, [0, 1]));
assert.equal(corrected.pace.samples.length, 1);
assert.equal(readingPace(correct(corrected, 0)).personal, false);
let manual = correct(read(empty, [0]), 5);
assert.equal(
  readingPace(manual).personal,
  false,
  "An open manual correction waits for completion",
);
manual = finish(manual);
assert.equal(rate(manual), expected(300, [0]));
let correctedOpen = correct(read(reopen(second), [2]), 30);
assert.equal(rate(correctedOpen), rate(second));
correctedOpen = finish(correctedOpen);
assert.equal(rate(correctedOpen), expected(1800, [0, 1, 2]));
let unchecked = act(reopen(measured), {
  action: "chapter",
  chapter: 0,
  done: false,
});
assert.equal(
  readingPace(unchecked).personal,
  false,
  "Unchecking invalidates its paired time sample",
);

// Day two has its own baseline; a unit spanning midnight keeps its paired time.
const tomorrow = now + 86400000;
let nextDay = timer(measured, "start", tomorrow, 1);
nextDay = finish(read(nextDay, [1], tomorrow), tomorrow + 300000, 1);
assert.equal(rate(nextDay), expected(480, [0, 1]));
const late = Date.parse("2026-10-06T21:59:00Z");
let overnight = timer(empty, "start", late);
overnight = finish(read(overnight, [0], late + 180000), late + 180000);
assert.equal(rate(overnight), expected(180, [0]));
assert.equal(
  rate(
    act(overnight, { action: "correct", minutes: 10, day: 0 }, late + 240000),
  ),
  expected(600, [0]),
  "Correction preserves the midnight association",
);

let midnightCorrection = read(timer(empty, "start", late), [0], late + 180000);
midnightCorrection = act(
  midnightCorrection,
  { action: "correct", minutes: 5, day: 0 },
  late + 180000,
);
assert.equal(readingPace(midnightCorrection).personal, false);
midnightCorrection = finish(midnightCorrection, late + 240000, 1);
assert.equal(rate(midnightCorrection), expected(300, [0]));
let finishLater = timer(read(timer(empty, "start"), [0]), "stop", now + 120000);
finishLater = read(finishLater, [1], tomorrow);
finishLater = finish(finishLater, tomorrow, 1);
assert.equal(
  rate(finishLater),
  expected(120, [0]),
  "Later untimed chapters cannot enter a previous day's sample",
);
let preserveDraft = timer(measured, "start", tomorrow, 1);
preserveDraft = read(preserveDraft, [1], tomorrow);
preserveDraft = act(
  preserveDraft,
  { action: "correct", day: 0, minutes: 10 },
  tomorrow + 60000,
);
assert.equal(preserveDraft.pace.draft.day, 1);
preserveDraft = finish(preserveDraft, tomorrow + 120000, 1);
assert.equal(rate(preserveDraft), expected(720, [0, 1]));

// Existing daily histories can learn immediately; open measurements stay pending.
const legacy = structuredClone(measured);
delete legacy.pace;
assert.equal(rate(legacy), rate(measured));
assert.deepEqual(legacy.logs, measured.logs);
assert.equal(
  legacy.pace,
  undefined,
  "Reading the rate must not mutate persisted data",
);
const legacyOpen = structuredClone(paused);
delete legacyOpen.pace;
assert.equal(readingPace(legacyOpen).personal, false);
assert.equal(rate(finish(legacyOpen)), expected(180, [0]));
const legacyFixed = structuredClone(
  finish(read(timer(empty, "start"), [0, 1, 2]), now + 600000),
);
delete legacyFixed.pace;
delete legacyFixed.adaptive;
assert.equal(rate(legacyFixed), expected(600, [0, 1, 2]));

// The learning data and pending baseline survive backup/restore with the timer paused.
const raw = makeBackup(second, "de", "light", now);
const restored = parseBackup(raw);
assert.equal(restored.version, 8);
assert.equal(rate(restored.state), rate(second));
assert.deepEqual(restored.state.pace, second.pace);
const liveBackup = parseBackup(
  makeBackup(measuring, "de", "light", now + 300000),
);
assert.equal(readingPace(liveBackup.state).personal, false);
assert.equal(rate(finish(liveBackup.state, now + 3600000)), expected(300, [0]));
for (const version of [1, 2]) {
  const old = JSON.parse(raw);
  old.version = version;
  delete old.state.pace;
  assert.equal(rate(parseBackup(JSON.stringify(old)).state), rate(second));
}
for (const breakIt of [
  (s) => {
    s.pace.samples[0].seconds = 0;
  },
  (s) => {
    s.pace.samples[0].chapters.push(0);
  },
  (s) => {
    s.pace.samples[0].chapters.push(1189);
  },
  (s) => {
    s.pace.samples[0].chapters.push(1188);
  },
  (s) => {
    s.pace.samples[0].day = 365;
  },
  (s) => {
    s.pace.draft = { day: 0, before: [0, 0], secondsBefore: 0 };
  },
]) {
  const invalid = JSON.parse(raw);
  breakIt(invalid.state);
  assert.throws(() => parseBackup(JSON.stringify(invalid)));
}

// Exported future durations match the same personalized estimates as the UI.
const futureWords = words(second.adaptive.days[1]);
const futureMinutes = estimatedMinutes(futureWords, readingPace(second));
const csvRow = csvFile(second, "en").split("\r\n")[2].split(";");
assert.equal(csvRow[3], `"${futureMinutes}"`);
const ics = calendarFile(second, "en", "https://example.com").replace(
  /\r\n /g,
  "",
);
const event = ics.split("BEGIN:VEVENT")[2];
const stamp = (s) =>
  Date.parse(
    s.replace(
      /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/,
      "$1-$2-$3T$4:$5:$6Z",
    ),
  );
assert.equal(
  (stamp(event.match(/DTEND:(\S+)/)[1]) -
    stamp(event.match(/DTSTART:(\S+)/)[1])) /
    60000,
  futureMinutes,
);
console.log(
  "Personal estimates: weighted pace, more/less reading, pauses, repeated sessions, no timer, corrections, midnight, upgrades, backups and exports passed.",
);
