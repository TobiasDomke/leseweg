import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { build } from "esbuild";
import { IDBFactory } from "fake-indexeddb";
await build({
  entryPoints: [
    "lib/planner.ts",
    "lib/actions.ts",
    "lib/adaptive.ts",
    "lib/backup.ts",
    "lib/pace.ts",
    "lib/exports.ts",
    "lib/session-stats.ts",
    "lib/local-storage.ts",
    "lib/bible52-i18n.ts",
  ],
  outdir: ".test-runtime/bible52",
  bundle: true,
  platform: "node",
  format: "esm",
});
const load = (name) => import(`../.test-runtime/bible52/${name}.js`);
const {
  bible52Weeks: weeks,
  bible52Units: units,
  bible52ChapterUnit: owner,
  bible52Config,
  chapters,
  createPlan,
  orderedChapters,
  duration,
} = await load("planner");
const { applyAction } = await load("actions");
const {
  prepareState,
  readingPlan,
  bible52CurrentUnit,
  sessionChapters,
  nextExtraChapter,
} = await load("adaptive");
const { makeBackup, parseBackup } = await load("backup");
const { readingPace } = await load("pace");
const { calendarFile, csvFile } = await load("exports");
const { dailySeconds } = await load("session-stats");
const { bible52Text } = await load("bible52-i18n");
const raw = JSON.parse(
  await readFile(new URL("../lib/bible52.json", import.meta.url)),
);
const canon = JSON.parse(
  await readFile(new URL("../lib/schlachter-canon.json", import.meta.url)),
);
const now = Date.parse("2026-10-06T10:00:00Z");
const base = bible52Config({
  amount: 12,
  unit: "months",
  start: "2026-10-06",
  time: "07:30",
  timezone: "Europe/Berlin",
});
const act = (state, op, at = now) =>
  applyAction(
    state,
    { ...op, planId: state?.id ?? null, opId: crypto.randomUUID() },
    at,
  );
const fresh = (lang = "de", previouslyRead = []) =>
  act(null, { action: "create", config: base, lang, previouslyRead });
const ids = (us) => us.flatMap((u) => u.chapters.map((c) => c.id));
const original = units.map((u) => u.chapters.map((c) => c.id));
assert.equal(weeks.length, 52);
assert(weeks.every((w) => w.length === 7));
assert.equal(units.length, 364);
assert.equal(ids(units).length, 1189);
assert.equal(new Set(ids(units)).size, 1189);
// Compare every book separately against the independently checked Schlachter inventory.
assert.deepEqual(
  canon.books.map((b) => [b.code, b.chapters]),
  canon.books.map((b) => [
    b.code,
    units.flatMap((u) => u.chapters).filter((c) => c.code === b.code).length,
  ]),
);
for (const b of canon.books)
  assert.deepEqual(
    units
      .flatMap((u) => u.chapters)
      .filter((c) => c.code === b.code)
      .map((c) => c.number)
      .sort((a, b) => a - b),
    Array.from({ length: b.chapters }, (_, i) => i + 1),
  );
// Independent column reading of the supplied photograph: exact chapter boundaries
// matter as much as completeness. Whole books stay whole entries.
const photographColumns = [
  "ROM:1-2,3-4,5-6,7-8,9-10,11-12,13-14,15-16;1CO:1-2,3-4,5-6,7-8,9-10,11-12,13-14,15-16;2CO:1-3,4-5,6-8,9-10,11-13;GAL:1-3,4-6;EPH:1-3,4-6;PHP:1-2,3-4;COL:1-2,3-4;1TH:1-3,4-5;2TH:*;1TI:1-3,4-6;2TI:1-2,3-4;TIT:*;PHM:*;HEB:1-4,5-7,8-10,11-13;JAS:1-3,4-5;1PE:1-3,4-5;2PE:*;1JN:1-3,4-5;2JN:*;3JN:*;JUD:*",
  "GEN:1-3,4-7,8-11,12-15,16-19,20-23,24-27,28-31,32-35,36-39,40-43,44-47,48-50;EXO:1-4,5-8,9-12,13-16,17-20,21-24,25-28,29-32,33-36,37-40;LEV:1-3,4-6,7-9,10-12,13-15,16-18,19-21,22-24,25-27;NUM:1-4,5-8,9-12,13-16,17-20,21-24,25-28,29-32,33-36;DEU:1-3,4-6,7-9,10-12,13-15,16-19,20-22,23-25,26-28,29-31,32-34",
  "JOS:1-5,6-10,11-15,16-20,21-24;JDG:1-6,7-11,12-16,17-21;RUT:*;1SA:1-5,6-10,11-15,16-20,21-25,26-31;2SA:1-4,5-9,10-14,15-19,20-24;1KI:1-4,5-9,10-13,14-18,19-22;2KI:1-5,6-10,11-15,16-20,21-25;1CH:1-4,5-9,10-14,15-19,20-24,25-29;2CH:1-5,6-10,11-15,16-20,21-24,25-28,29-32,33-36;EZR:1-5,6-10;NEH:1-4,5-9,10-13;EST:1-5,6-10",
  "PSA:1-2,3-5,6-8,9-11,12-14,15-17,18-20,21-23,24-26,27-29,30-32,33-35,36-38,39-41,42-44,45-47,48-50,51-53,54-56,57-59,60-62,63-65,66-68,69-71,72-74,75-77,78-80,81-83,84-86,87-89,90-92,93-95,96-98,99-101,102-104,105-107,108-110,111-113,114-116,117-118,119,120-121,122-124,125-127,128-130,131-133,134-136,137-139,140-142,143-145,146-148,149-150",
  "JOB:1-2,3-4,5-6,7-8,9-10,11-12,13-14,15-16,17-18,19-20,21-22,23-24,25-26,27-28,29-30,31-32,33-34,35-36,37-38,39-40,41-42;PRO:1,2-3,4,5-6,7,8-9,10,11-12,13,14-15,16,17-18,19,20-21,22,23-24,25,26-27,28,29-30,31;ECC:1-2,3-4,5-6,7-8,9-10,11-12;SNG:1-2,3-4,5-6,7-8",
  "ISA:1-6,7-11,12-17,18-22,23-28,29-33,34-39,40-44,45-50,51-55,56-61,62-66;JER:1-6,7-11,12-16,17-21,22-26,27-31,32-36,37-41,42-46,47-52;LAM:*;EZK:1-6,7-12,13-18,19-24,25-30,31-36,37-42,43-48;DAN:1-6,7-12;HOS:1-7,8-14;JOL:*;AMO:1-4,5-9;OBA:*;JON:*;MIC:*;NAM:*;HAB:*;ZEP:*;HAG:*;ZEC:1-7,8-14;MAL:*;REV:1-6,7-11,12-17,18-22",
  "MAT:1-2,3-4,5-7,8-10,11-13,14-16,17-19,20-22,23-25,26-28;MRK:1-2,3-4,5-6,7-8,9-10,11-12,13-14,15-16;LUK:1-2,3-4,5-6,7-8,9-10,11-12,13-14,15-16,17-18,19-20,21-22,23-24;JHN:1-2,3-4,5-6,7-9,10-12,13-15,16-18,19-21;ACT:1-2,3-4,5-6,7-8,9-10,11-12,13-14,15-16,17-18,19-20,21-22,23-24,25-26,27-28",
];
photographColumns.forEach((column, slot) => {
  const expected = column.split(";").flatMap((b) => {
    const [code, ranges] = b.split(":");
    return ranges.split(",").map((r) => (r === "*" ? code : `${code} ${r}`));
  });
  assert.equal(expected.length, 52, `photo column ${slot}`);
  assert.deepEqual(
    raw.weeks.map((w) => w[slot]),
    expected,
    `exact photo column ${slot}`,
  );
});
const prior = ids([...weeks[0], ...weeks[1], weeks[2][2]]);
for (const lang of ["de", "en", "ru", "uk"]) {
  let s = fresh(lang, prior);
  assert.equal(s.config.edition, "schlachter2000");
  assert.equal(duration(s.config), 364);
  assert.equal(s.config.bookOrder, "western");
  assert.equal(s.config.template, "bible52");
  assert.deepEqual(
    readingPlan(s).map((d) => d.chapters.map((c) => c.id)),
    original,
  );
  assert.equal(bible52CurrentUnit(s), 14);
  assert(weeks[2][2].chapters.every((c) => s.previouslyRead.includes(c.id)));
  assert(weeks[2][3].chapters.every((c) => !s.previouslyRead.includes(c.id)));
  assert.deepEqual(
    createPlan(s.config, prior)[17].chapters.map((c) => c.id),
    original[17],
  );
  assert.equal(nextExtraChapter(s, 14), undefined);
  s = act(s, { action: "language", lang: lang === "ru" ? "uk" : "ru" });
  assert.deepEqual(
    readingPlan(s).map((d) => d.chapters.map((c) => c.id)),
    original,
  );
  assert(calendarFile(s, lang, "https://example.com").includes("Josua 11–15"));
  assert(csvFile(s, lang).includes("Psalmen 6–8"));
  assert.equal(readingPace(s).samples, 0);
  assert.deepEqual(
    Object.keys(bible52Text(lang)),
    Object.keys(bible52Text("de")),
  );
  assert.deepEqual(
    parseBackup(makeBackup(s, lang, "light", now)).state.config,
    s.config,
  );
  for (const op of [
    { action: "edition", edition: "synodal" },
    { action: "deadline", end: "2028-01-01" },
    { action: "book-order", choice: "auto", lang },
    { action: "extend", day: 14 },
  ])
    assert.throws(() => act(s, op));
  // Even after a missed deadline, all original slots remain accessible.
  assert.deepEqual(
    readingPlan(prepareState(s, "2030-01-01")).map((d) =>
      d.chapters.map((c) => c.id),
    ),
    original,
  );
}
// Partial reading, time pairing, pause protection, non-calendar unit indexes.
let s = fresh("de", prior),
  unit = 17;
s = act(s, { action: "timer", mode: "start", day: unit });
s = act(
  s,
  { action: "chapter", chapter: original[unit][0], done: true },
  now + 600000,
);
s = act(s, { action: "timer", mode: "pause", day: unit }, now + 600000);
assert.equal(bible52CurrentUnit(s), unit);
assert.throws(
  () => act(s, { action: "timer", mode: "start", day: 18 }),
  /timer/,
);
assert.throws(
  () => act(s, { action: "chapter", chapter: original[18][0], done: true }),
  /timer/,
);
assert.throws(
  () => act(s, { action: "previous", previouslyRead: prior }),
  /timer/,
);
s = act(s, { action: "complete", day: unit }, now + 600000);
assert(!s.adaptive.finished.includes(unit));
assert.equal(s.sessions.length, 1);
assert.deepEqual(s.sessions[0].chapters, [original[unit][0]]);
assert.equal(s.sessions[0].seconds, 600);
assert.equal(s.sessions[0].date, "2026-10-06");
assert.deepEqual(s.pace.samples[0].chapters, [original[unit][0]]);
assert.equal(s.pace.samples[0].day, unit);
assert.deepEqual(
  sessionChapters(s, unit).map((c) => c.id),
  original[unit],
);
assert.deepEqual(
  readingPlan(s).map((d) => d.chapters.map((c) => c.id)),
  original,
);
s = act(s, { action: "timer", mode: "start", day: unit }, now + 900000);
for (const id of original[unit].slice(1))
  s = act(s, { action: "chapter", chapter: id, done: true }, now + 1500000);
assert(
  !s.adaptive.finished.includes(unit),
  "last checkbox must not hide Finish or stop measurement",
);
s = act(s, { action: "complete", day: unit }, now + 1500000);
assert(s.adaptive.finished.includes(unit));
assert.equal(s.sessions.length, 2);
assert.equal(
  s.logs.reduce((n, l) => n + l.seconds, 0),
  1200,
);
assert.equal(dailySeconds(s, now)["2026-10-06"], 1200);
assert.equal(s.pace.samples.length, 2);
assert.deepEqual(
  s.pace.samples.flatMap((x) => x.chapters),
  original[unit],
);
const backup = JSON.parse(makeBackup(s, "de", "dark", now + 1500000));
assert.equal(backup.version, 8);
assert.equal(
  parseBackup(JSON.stringify(backup)).state.config.template,
  "bible52",
);
for (const corrupt of [
  (b) => (b.state.config.edition = "synodal"),
  (b) => (b.state.config.scope = "nt"),
  (b) => (b.state.config.amount = 53),
  (b) => b.state.adaptive.days[18].unshift(b.state.adaptive.days[17].pop()),
  (b) => (b.state.completionDays[original[unit][0]] = 0),
  (b) => (b.state.sessions[0].day = 0),
  (b) => (b.state.pace.samples[0].day = 0),
  (b) => b.state.adaptive.finished.push(18),
  (b) => (b.version = 7),
]) {
  const b = structuredClone(backup);
  corrupt(b);
  assert.throws(() => parseBackup(JSON.stringify(b)));
}
s = act(s, { action: "chapter", chapter: original[unit][0], done: false });
assert(!s.adaptive.finished.includes(unit));
assert.equal(bible52CurrentUnit(s), 14);
// Every slot can actually be completed in reverse order with a measured session,
// regardless of current date. The very last original slot works on day one.
let all = fresh();
for (const u of [...units].reverse()) {
  const at = now + (364 - u.index) * 1200000;
  all = act(all, { action: "timer", mode: "start", day: u.index }, at);
  for (const c of u.chapters)
    all = act(
      all,
      { action: "chapter", chapter: c.id, done: true },
      at + 600000,
    );
  all = act(all, { action: "complete", day: u.index }, at + 600000);
  assert(all.adaptive.finished.includes(u.index));
  assert.deepEqual(
    readingPlan(all).map((d) => d.chapters.map((c) => c.id)),
    original,
  );
}
assert.equal(Object.keys(all.done).length, 1189);
assert.equal(all.adaptive.finished.length, 364);
assert.equal(all.sessions.length, 364);
assert.equal(all.pace.samples.length, 364);
assert.deepEqual(
  parseBackup(makeBackup(all, "uk", "light", now)).state.done,
  all.done,
);
// Entirely prior progress needs no measured session and still shows original units.
const allPrior = fresh(
  "de",
  chapters.map((c) => c.id),
);
assert.equal(allPrior.adaptive.finished.length, 364);
assert.equal(allPrior.logs.length, 0);
assert.equal(allPrior.sessions.length, 0);
assert.deepEqual(
  parseBackup(makeBackup(allPrior, "de", "light", now)).state.previouslyRead,
  chapters.map((c) => c.id),
);
// Existing v3 installations upgrade, while old clients cannot overwrite fixed plans.
globalThis.indexedDB = new IDBFactory();
await new Promise((resolve, reject) => {
  const r = indexedDB.open("leseweg-local", 3);
  r.onupgradeneeded = () => r.result.createObjectStore("reading");
  r.onerror = () => reject(r.error);
  r.onsuccess = () => {
    const db = r.result,
      tx = db.transaction("reading", "readwrite");
    tx.objectStore("reading").put(s, "active");
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
  };
});
const { readState } = await load("local-storage");
assert.equal((await readState()).config.template, "bible52");
await assert.rejects(
  new Promise((resolve, reject) => {
    const r = indexedDB.open("leseweg-local", 3);
    r.onerror = () => reject(r.error);
    r.onsuccess = () => {
      r.result.close();
      resolve();
    };
  }),
  { name: "VersionError" },
);
console.log(
  "Bible 52: exact 364 source units, 66 books / 1189 chapters once; four languages, progress, all sessions, time, backups and old-client protection passed.",
);

// Later prior-progress corrections may complete a partly measured unit.
let corrected = fresh();
corrected = act(corrected, {
  action: "chapter",
  chapter: original[17][0],
  done: true,
});
corrected = act(corrected, { action: "complete", day: 17 });
corrected = act(corrected, {
  action: "previous",
  previouslyRead: original[17].slice(1),
});
assert(corrected.adaptive.finished.includes(17));
assert.equal(
  corrected.sessions.length,
  1,
  "prior correction creates no fictitious session",
);
corrected = act(corrected, { action: "previous", previouslyRead: [] });
assert(!corrected.adaptive.finished.includes(17));
assert.deepEqual(
  readingPlan(corrected).map((d) => d.chapters.map((c) => c.id)),
  original,
);
// Active-timer exports preserve elapsed seconds and resume the same unit.
let active = fresh();
active = act(active, { action: "timer", mode: "start", day: 363 });
active = act(
  active,
  { action: "chapter", chapter: original[363][0], done: true },
  now + 120000,
);
let resumed = parseBackup(
  makeBackup(active, "en", "light", now + 120000),
).state;
assert.equal(resumed.timer, null);
assert.equal(resumed.logs[0].seconds, 120);
assert.equal(bible52CurrentUnit(resumed), 363);
resumed = act(resumed, { action: "complete", day: 363 }, now + 120000);
assert.deepEqual(resumed.pace.samples[0].chapters, [original[363][0]]);
assert.equal(resumed.pace.samples[0].seconds, 120);
console.log(
  "Bible 52: mixed prior/measured progress corrections and active-timer backup resume passed.",
);
