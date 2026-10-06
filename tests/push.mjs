import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import {
  generateKeyPairSync,
  randomBytes,
  createDecipheriv,
  createECDH,
  hkdfSync,
} from "node:crypto";
import { build } from "esbuild";
import { readFile, mkdir } from "node:fs/promises";
import { runInNewContext } from "node:vm";
await mkdir(".test-runtime", { recursive: true });
await build({
  entryPoints: ["worker/index.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: ".test-runtime/push-worker.mjs",
});
await build({
  entryPoints: ["worker/schedule.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: ".test-runtime/push-schedule.mjs",
});
await build({
  entryPoints: ["lib/push.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: ".test-runtime/push-client.mjs",
});
const { handleRequest, runScheduled, sendPush, validEndpoint } = await import(
  "../.test-runtime/push-worker.mjs"
);
const { nextReminder } = await import("../.test-runtime/push-schedule.mjs");
const client = await import("../.test-runtime/push-client.mjs");

const db = new DatabaseSync(":memory:");
db.exec(await readFile("worker/migrations/0001_reminders.sql", "utf8"));
const DB = {
  prepare(sql) {
    let values = [];
    const query = {
      bind(...args) {
        values = args;
        return query;
      },
      async all() {
        return { results: db.prepare(sql).all(...values) };
      },
      async first() {
        return db.prepare(sql).get(...values) ?? null;
      },
      async run() {
        return { meta: db.prepare(sql).run(...values) };
      },
    };
    return query;
  },
};
const applicationPair = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
const jwk = applicationPair.privateKey.export({ format: "jwk" });
const appPublic = Buffer.concat([
  Buffer.from([4]),
  Buffer.from(jwk.x, "base64url"),
  Buffer.from(jwk.y, "base64url"),
]).toString("base64url");
const subscriber = createECDH("prime256v1");
subscriber.generateKeys();
const auth = randomBytes(16);
const subscription = {
  endpoint: "https://web.push.apple.com/test-endpoint",
  expirationTime: null,
  keys: {
    p256dh: subscriber.getPublicKey().toString("base64url"),
    auth: auth.toString("base64url"),
  },
};
const env = {
  DB,
  API_LIMIT: {
    async limit() {
      return { success: true };
    },
  },
  APP_ORIGIN: "https://leseweg.pages.dev",
  VAPID_PUBLIC_KEY: appPublic,
  VAPID_PRIVATE_KEY: jwk.d,
};
const token = randomBytes(32).toString("base64url"),
  otherToken = randomBytes(32).toString("base64url");
const now = Date.parse("2026-10-06T10:00:00Z");
const settings = {
  time: "19:00",
  timezone: "Europe/Berlin",
  language: "de",
  subscription,
};
const sent = [];
const sender = async (row, _env, test) => {
  sent.push({ row: { ...row }, test });
  return 201;
};
async function request(
  path,
  method = "GET",
  body,
  bearer = token,
  origin = env.APP_ORIGIN,
  timestamp = now,
  send = sender,
) {
  return handleRequest(
    new Request("https://reminders.example" + path, {
      method,
      headers: {
        Origin: origin,
        Authorization: "Bearer " + bearer,
        "Content-Type": "application/json",
        "CF-Connecting-IP": "192.0.2.10",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
    env,
    send,
    timestamp,
  );
}
const count = () =>
  db.prepare("SELECT COUNT(*) AS count FROM reminders").get().count;
const row = () => db.prepare("SELECT * FROM reminders").get();

assert.equal(
  new Date(
    nextReminder(Date.parse("2026-03-28T20:00:00Z"), "02:30", "Europe/Berlin"),
  ).toISOString(),
  "2026-03-29T01:30:00.000Z",
);
const fall = nextReminder(
  Date.parse("2026-10-24T22:00:00Z"),
  "02:30",
  "Europe/Berlin",
);
assert.equal(new Date(fall).toISOString().slice(0, 10), "2026-10-25");
assert.equal(
  new Date(
    nextReminder(fall + 60000, "02:30", "Europe/Berlin", "2026-10-25"),
  ).toISOString(),
  "2026-10-26T01:30:00.000Z",
);
assert.equal(
  new Date(nextReminder(now, "19:00", "Asia/Almaty")).toISOString(),
  "2026-10-06T14:00:00.000Z",
);
assert.equal(
  new Date(
    nextReminder(Date.parse("2026-12-31T23:59:00Z"), "00:00", "UTC"),
  ).toISOString(),
  "2027-01-01T00:00:00.000Z",
);
for (const url of [
  "http://web.push.apple.com/a",
  "https://web.push.apple.com.evil.example/a",
  "https://localhost/a",
  "https://127.0.0.1/a",
  "https://example.com/a",
  "https://web.push.apple.com:444/a",
  "https://user@web.push.apple.com/a",
  "https://fcm.googleapis.com/other",
])
  assert.equal(validEndpoint(url), false, url);
for (const url of [
  subscription.endpoint,
  "https://fcm.googleapis.com/fcm/send/x",
  "https://updates.push.services.mozilla.com/wpush/v2/x",
  "https://wns2-test.notify.windows.com/x",
])
  assert(validEndpoint(url));
const config = await request("/config");
assert.equal((await config.json()).publicKey, appPublic);
assert.equal(
  (
    await request(
      "/subscription",
      "PUT",
      settings,
      token,
      "https://evil.example",
    )
  ).status,
  403,
);
assert.equal(
  (await request("/subscription", "PUT", settings, "short")).status,
  401,
);
assert.equal(
  (await request("/subscription", "PUT", { ...settings, time: "25:70" }))
    .status,
  400,
);
assert.equal(
  (
    await request("/subscription", "PUT", {
      ...settings,
      timezone: "not/a-zone",
    })
  ).status,
  400,
);
assert.equal(
  (await request("/subscription", "PUT", { ...settings, chapters: [1, 2, 3] }))
    .status,
  400,
);
assert.equal(
  (await request("/subscription", "PUT", { ...settings, language: "xx" }))
    .status,
  400,
);
assert.equal(
  (
    await request("/subscription", "PUT", {
      ...settings,
      subscription: { ...subscription, endpoint: "https://127.0.0.1/private" },
    })
  ).status,
  400,
);
assert.equal(
  (
    await request("/subscription", "PUT", {
      ...settings,
      extra: "x".repeat(5000),
    })
  ).status,
  413,
);
assert.equal(count(), 0);
assert.equal((await request("/subscription", "PUT", settings)).status, 200);
assert.equal(count(), 1);
assert.equal(row().next_run, Date.parse("2026-10-06T17:00:00Z"));
assert.notEqual(row().token_hash, token);
assert(!JSON.stringify(row()).includes("chapters"));
assert.equal(
  (await request("/subscription", "GET", undefined, otherToken)).status,
  404,
);
assert.equal(
  (await request("/subscription", "PUT", settings, otherToken)).status,
  409,
);
await request("/subscription", "DELETE", undefined, otherToken);
assert.equal(count(), 1, "Another device cannot delete this subscription");
await request("/subscription", "PUT", {
  ...settings,
  time: "20:00",
  language: "en",
});
assert.equal(row().next_run, Date.parse("2026-10-06T18:00:00Z"));
assert.equal(row().language, "en");
assert.equal((await request("/test", "POST")).status, 200);
assert.equal(sent.length, 1);
assert.equal((await request("/test", "POST")).status, 429);
sent.length = 0;
await runScheduled(env, now, sender);
assert.equal(sent.length, 0);
await Promise.all([
  runScheduled(env, row().next_run, sender),
  runScheduled(env, row().next_run, sender),
]);
assert.equal(
  sent.length,
  1,
  "Concurrent cron runs must not send duplicate daily notifications",
);
assert.equal(row().last_sent_date, "2026-10-06");
assert.equal(row().next_run, Date.parse("2026-10-07T18:00:00Z"));
await runScheduled(env, Date.parse("2026-10-07T18:00:00Z"), async () => 503);
assert.equal(row().failures, 1);
assert.equal(row().next_run, Date.parse("2026-10-07T18:02:00Z"));
await runScheduled(env, row().next_run, sender);
assert.equal(row().failures, 0);
assert.equal(row().last_sent_date, "2026-10-07");
const beforeMissed = sent.length;
await runScheduled(env, row().next_run + 7 * 3600000, sender);
assert.equal(
  sent.length,
  beforeMissed,
  "Do not deliver a stale reminder after a long outage",
);
const beforeRace = row();
await runScheduled(env, beforeRace.next_run, async () => {
  await request(
    "/subscription",
    "PUT",
    { ...settings, time: "22:00" },
    token,
    env.APP_ORIGIN,
    beforeRace.next_run,
  );
  return 201;
});
assert.equal(row().time, "22:00");
assert.equal(
  row().next_run,
  nextReminder(
    beforeRace.next_run,
    "22:00",
    settings.timezone,
    beforeRace.last_sent_date,
  ),
  "Old cron completion must not overwrite a newly saved schedule",
);
await runScheduled(env, row().next_run, async () => 410);
assert.equal(count(), 0, "Expired push subscriptions are removed");
await request("/subscription", "PUT", settings);
const rateLimited = {
  ...env,
  API_LIMIT: {
    async limit() {
      return { success: false };
    },
  },
};
assert.equal(
  (
    await handleRequest(
      new Request("https://reminders.example/subscription", {
        headers: { Origin: env.APP_ORIGIN, Authorization: "Bearer " + token },
      }),
      rateLimited,
    )
  ).status,
  429,
);

// Decrypt the actual outgoing RFC 8291 payload with the subscriber's independent
// Node crypto implementation. This verifies VAPID transport and iPhone payload shape.
const originalFetch = globalThis.fetch;
let outgoing;
globalThis.fetch = async (url, options) => {
  outgoing = { url, options };
  return new Response(null, { status: 201 });
};
assert.equal(await sendPush(row(), env, true), 201);
globalThis.fetch = originalFetch;
assert.equal(outgoing.url, subscription.endpoint);
assert.equal(outgoing.options.redirect, "manual");
assert.equal(outgoing.options.headers["content-encoding"], "aes128gcm");
assert.equal(
  outgoing.options.headers.urgency,
  "high",
  "A test notification requests immediate delivery",
);
assert.match(outgoing.options.headers.authorization, /^vapid t=/);
const encrypted = Buffer.from(outgoing.options.body);
const salt = encrypted.subarray(0, 16),
  keyLength = encrypted[20];
const serverPublic = encrypted.subarray(21, 21 + keyLength);
const shared = subscriber.computeSecret(serverPublic);
const info = Buffer.concat([
  Buffer.from("WebPush: info\0"),
  subscriber.getPublicKey(),
  serverPublic,
]);
const ikm = Buffer.from(hkdfSync("sha256", shared, auth, info, 32));
const cek = Buffer.from(
  hkdfSync(
    "sha256",
    ikm,
    salt,
    Buffer.from("Content-Encoding: aes128gcm\0"),
    16,
  ),
);
const nonce = Buffer.from(
  hkdfSync("sha256", ikm, salt, Buffer.from("Content-Encoding: nonce\0"), 12),
);
const ciphertext = encrypted.subarray(21 + keyLength);
const decipher = createDecipheriv("aes-128-gcm", cek, nonce);
decipher.setAuthTag(ciphertext.subarray(-16));
let plaintext = Buffer.concat([
  decipher.update(ciphertext.subarray(0, -16)),
  decipher.final(),
]);
while (plaintext.at(-1) === 0) plaintext = plaintext.subarray(0, -1);
assert.equal(plaintext.at(-1), 2);
const payload = JSON.parse(plaintext.subarray(0, -1).toString());
assert.equal(payload.web_push, 8030);
assert.equal(payload.notification.navigate, env.APP_ORIGIN + "/");
assert.equal(payload.notification.title, "Leseweg");
assert(!JSON.stringify(payload).includes(token));
assert(!JSON.stringify(payload).includes("subscription"));

// Runtime diagnostics must never expose push endpoints or key material.
const savedWarn = console.warn;
const warnings = [];
console.warn = (...items) => warnings.push(items);
globalThis.fetch = async () => {
  throw new Error(
    [
      subscription.endpoint,
      subscription.keys.auth,
      subscription.keys.p256dh,
      env.VAPID_PRIVATE_KEY,
      env.VAPID_PUBLIC_KEY,
    ].join(" "),
  );
};
try {
  await assert.rejects(sendPush(row(), env, true));
  const logged = JSON.stringify(warnings);
  for (const secret of [
    subscription.endpoint,
    subscription.keys.auth,
    subscription.keys.p256dh,
    env.VAPID_PRIVATE_KEY,
    env.VAPID_PUBLIC_KEY,
  ])
    assert(!logged.includes(secret));
  assert(logged.includes('"stage":"request"'));
} finally {
  globalThis.fetch = originalFetch;
  console.warn = savedWarn;
}
await request("/subscription", "DELETE");
assert.equal(count(), 0);

const stored = new Map();
globalThis.localStorage = {
  getItem: (key) => stored.get(key) ?? null,
  setItem: (key, value) => stored.set(key, value),
  removeItem: (key) => stored.delete(key),
};
const generated = client.deviceToken();
assert.match(generated, /^[A-Za-z0-9_-]{43}$/);
client.savePushRecord({ token: generated, pendingDelete: true });
assert.equal(client.readPushRecord().pendingDelete, true);
client.savePushRecord(null);
assert.equal(client.readPushRecord(), null);
assert.equal(client.applicationKey(appPublic).length, 65);
assert.equal(
  client.sameSettings(
    { time: "19:00", timezone: "UTC", language: "de" },
    { time: "19:00", timezone: "UTC", language: "ru" },
  ),
  false,
);
delete globalThis.localStorage;

const handlers = {},
  shown = [],
  navigation = [];
runInNewContext(await readFile("dist/sw.js", "utf8"), {
  URL,
  self: {
    location: { origin: env.APP_ORIGIN },
    addEventListener: (name, fn) => {
      handlers[name] = fn;
    },
    registration: { showNotification: async (...args) => shown.push(args) },
    clients: {
      matchAll: async () => [
        {
          url: env.APP_ORIGIN + "/?day=7",
          navigate: async (url) => navigation.push(url),
          focus: async () => navigation.push("focus"),
        },
      ],
      openWindow: async (url) => navigation.push(url),
    },
  },
});
let task;
handlers.push({
  data: { json: () => payload },
  waitUntil: (value) => {
    task = value;
  },
});
await task;
assert.equal(shown.length, 1);
assert.equal(shown[0][1].body, payload.notification.body);
handlers.push({
  notification: {},
  waitUntil: () =>
    assert.fail("Declarative notifications must not be duplicated"),
});
assert.equal(shown.length, 1);
handlers.notificationclick({
  notification: { data: { url: "https://evil.example/" }, close() {} },
  waitUntil: (value) => {
    task = value;
  },
});
await task;
assert.deepEqual(navigation, [env.APP_ORIGIN + "/", "focus"]);
db.close();
console.log(
  "Push: authenticated device isolation, endpoint validation, quotas, DST, retries, concurrent scheduling, unsubscribe, encrypted iPhone payload and notification navigation passed.",
);
