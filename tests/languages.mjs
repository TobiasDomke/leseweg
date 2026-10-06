import assert from "node:assert/strict";
import { build } from "esbuild";

await build({
  entryPoints: [
    "lib/languages.ts",
    "lib/i18n.ts",
    "lib/push-i18n.ts",
    "lib/actions.ts",
    "lib/backup.ts",
    "lib/exports.ts",
  ],
  outdir: ".test-runtime/languages",
  bundle: true,
  platform: "node",
  format: "esm",
});
const { languageCodes, browserLanguage, isLanguage, locales } = await import(
  "../.test-runtime/languages/languages.js"
);
const { text, bookNames } = await import("../.test-runtime/languages/i18n.js");
const { pushText } = await import("../.test-runtime/languages/push-i18n.js");
const { applyAction } = await import("../.test-runtime/languages/actions.js");
const { makeBackup, parseBackup } = await import(
  "../.test-runtime/languages/backup.js"
);
const { calendarFile, csvFile } = await import(
  "../.test-runtime/languages/exports.js"
);

assert.equal(browserLanguage("uk-UA"), "uk");
assert.equal(browserLanguage("UK_ua"), "uk");
assert.equal(browserLanguage("fr-FR"), "en");
assert(!isLanguage("ua"));
assert(!isLanguage(null));
for (const lang of languageCodes) {
  assert.equal(browserLanguage(locales[lang]), lang);
  for (const translate of [text, pushText]) {
    const reference = translate("en");
    const translated = translate(lang);
    assert.deepEqual(
      Object.keys(translated).sort(),
      Object.keys(reference).sort(),
    );
    for (const [key, value] of Object.entries(translated)) {
      assert(value.trim().length > 0, `${lang}.${key} must not be empty`);
      assert.deepEqual(
        value.match(/\{\w+\}/g),
        reference[key].match(/\{\w+\}/g),
        `${lang}.${key} must retain interpolation placeholders`,
      );
    }
  }
}
const books = bookNames("uk");
assert.equal(books.length, 66);
assert.equal(new Set(books).size, 66);
assert.equal(books[0], "Буття");
assert.equal(books[18], "Псалми");
assert.equal(books[39], "Від Матвія");
assert.equal(books.at(-1), "Об’явлення");
assert.match(
  new Intl.DateTimeFormat(locales.uk, {
    month: "long",
    timeZone: "UTC",
  }).format(new Date("2026-10-06")),
  /жовтен/,
);

const now = Date.parse("2026-10-06T10:00:00Z");
const config = {
  amount: 365,
  unit: "days",
  start: "2026-10-06",
  time: "07:30",
  timezone: "Europe/Kyiv",
};
const act = (state, data, at = now) =>
  applyAction(
    state,
    { ...data, planId: state?.id ?? null, opId: crypto.randomUUID() },
    at,
  );
let state = act(null, { action: "create", config, lang: "uk" });
assert.equal(state.lang, "uk");
state = act(state, { action: "timer", mode: "start", day: 0 });
state = act(state, { action: "chapter", chapter: 0, done: true });
state = act(state, { action: "complete", day: 0 }, now + 90000);
assert.equal(state.logs[0].seconds, 90);
const original = structuredClone(state);
for (const lang of languageCodes) {
  state = act(
    state,
    { action: "settings", time: config.time, timezone: config.timezone, lang },
    now + 90000,
  );
  const restored = parseBackup(makeBackup(state, lang, "dark", now + 90000));
  assert.equal(restored.state.lang, lang);
  assert.equal(restored.state.id, original.id);
  for (const key of ["done", "logs", "pace", "previouslyRead"])
    assert.deepEqual(
      restored.state[key],
      original[key],
      `Changing language must preserve ${key}`,
    );
  assert.equal(restored.state.config.start, original.config.start);
  assert.equal(restored.state.config.amount, original.config.amount);
  assert.equal(
    restored.state.config.bookOrder,
    "eastern", // The Ohienko edition stays pinned when UI language changes.
  );
  assert.deepEqual(
    restored.state.adaptive.finished,
    original.adaptive.finished,
  );
}

const csv = csvFile(state, "uk");
assert(csv.startsWith('\ufeff"День";'));
assert(csv.includes("Буття 1"));
assert(csv.includes("Фактично виміряно"));
const calendar = calendarFile(state, "uk", "https://example.com");
assert(calendar.replace(/\r\n /g, "").includes("SUMMARY:Читати Біблію: Буття"));
for (const line of calendar.split("\r\n"))
  assert(
    Buffer.byteLength(line, "utf8") <= 75,
    "Ukrainian calendar lines must fold safely by UTF-8 byte length",
  );
console.log(
  "Languages: four complete translations, Ukrainian books/dates/exports, language changes and backup compatibility passed.",
);
