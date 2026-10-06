import assert from "node:assert/strict";
import { build } from "esbuild";
await build({
  entryPoints: ["lib/planner.ts", "lib/exports.ts"],
  outdir: ".test-runtime",
  bundle: true,
  platform: "node",
  format: "esm",
});
const { createPlan, chapters, totalWords, duration } = await import(
  "../.test-runtime/planner.js"
);
const { zonedUTC, calendarFile } = await import("../.test-runtime/exports.js");
const base = {
  amount: 12,
  unit: "months",
  start: "2026-10-06",
  time: "07:30",
  timezone: "Europe/Berlin",
};
for (const count of [1, 2, 7, 30, 90, 180, 365, 730, 1188, 1189, 1500, 3650]) {
  const plan = createPlan({ ...base, amount: count, unit: "days" });
  assert.equal(plan.length, count);
  assert.deepEqual(
    plan.flatMap((d) => d.chapters.map((c) => c.id)),
    chapters.map((c) => c.id),
    "Every chapter exactly once, in canonical order",
  );
  assert.equal(
    plan.reduce((s, d) => s + d.words, 0),
    totalWords,
  );
  if (count <= 1189) assert(plan.every((d) => d.chapters.length > 0));
}
assert.equal(duration({ ...base, start: "2027-01-31", amount: 1 }), 28);
assert.equal(duration({ ...base, start: "2028-01-31", amount: 1 }), 29);
assert.equal(duration({ ...base, start: "2028-02-29", amount: 12 }), 365);
for (const amount of [0, -1, 0.5, Infinity, 3651])
  assert.throws(() => createPlan({ ...base, amount, unit: "days" }));
assert.throws(() => createPlan({ ...base, start: "2026-02-30" }));
const weighted = createPlan({ ...base, amount: 365, unit: "days" });
const naive = Array.from({ length: 365 }, (_, i) =>
  chapters
    .slice(Math.floor((i * 1189) / 365), Math.floor(((i + 1) * 1189) / 365))
    .reduce((s, c) => s + c.words, 0),
);
const variance = (a) =>
  a.reduce((s, v) => s + (v - totalWords / 365) ** 2, 0) / 365;
assert(
  variance(weighted.map((d) => d.words)) < variance(naive) * 0.5,
  "Length weighting substantially reduces daily variability",
);
assert.equal(
  zonedUTC("2026-10-24", "07:30", "Europe/Berlin").toISOString(),
  "2026-10-24T05:30:00.000Z",
);
assert.equal(
  zonedUTC("2026-10-25", "07:30", "Europe/Berlin").toISOString(),
  "2026-10-25T06:30:00.000Z",
);
assert.equal(
  zonedUTC("2026-03-29", "02:30", "Europe/Berlin").toISOString(),
  "2026-03-29T01:30:00.000Z",
);
const ics = calendarFile(
  {
    id: "test",
    config: base,
    lang: "ru",
    done: {},
    logs: [],
    timer: null,
    ops: [],
  },
  "ru",
  "https://example.com",
);
assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, 365);
assert.equal((ics.match(/BEGIN:VALARM/g) || []).length, 365);
assert(
  ics
    .split("\r\n")
    .every((line) => new TextEncoder().encode(line).length <= 75),
);
console.log(
  "PASS: 13 plan durations, unique complete coverage, length balancing, calendar-month boundaries, invalid input, DST and multilingual calendar export.",
);
