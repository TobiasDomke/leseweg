import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { runInNewContext } from "node:vm";
const source = await readFile("dist/sw.js", "utf8");
assert(!source.includes("__ASSETS__"));
const handlers = {};
const stores = new Map();
let claimed = false;
let activated = false;
const caches = {
  open: async (name) => {
    if (!stores.has(name)) stores.set(name, new Map());
    const data = stores.get(name);
    return {
      addAll: async (urls) => {
        for (const url of urls) data.set(url, await readFile("dist" + url));
      },
      match: async (key) =>
        data.has(key) ? new Response(data.get(key)) : undefined,
    };
  },
  keys: async () => [...stores.keys()],
  delete: async (name) => stores.delete(name),
};
runInNewContext(source, {
  caches,
  URL,
  fetch: () => {
    throw Error("Network disconnected");
  },
  self: {
    location: { origin: "https://app.example" },
    clients: {
      claim: async () => {
        claimed = true;
      },
    },
    skipWaiting: () => {
      activated = true;
    },
    addEventListener: (name, fn) => {
      handlers[name] = fn;
    },
  },
});
let task;
handlers.install({
  waitUntil: (promise) => {
    task = promise;
  },
});
await task;
stores.set("leseweg-offline-old", new Map());
stores.set("unrelated-cache", new Map());
handlers.activate({
  waitUntil: (promise) => {
    task = promise;
  },
});
await task;
assert(claimed);
assert(!stores.has("leseweg-offline-old"));
assert(stores.has("unrelated-cache"));
async function offline(url, mode) {
  let response;
  handlers.fetch({
    request: { method: "GET", url: "https://app.example" + url, mode },
    respondWith: (promise) => {
      response = promise;
    },
  });
  assert(response, url + " must be handled offline");
  return await (await response).text();
}
const html = await offline("/?day=12", "navigate");
assert(html.includes('id="root"'));
for (const [, url] of html.matchAll(/(?:src|href)="(\/[^\"]+)"/g))
  assert((await offline(url, "cors")).length > 0);
for (const asset of await readdir("dist/assets"))
  await offline("/assets/" + asset, "cors");
for (const asset of (await readdir("dist/assets")).filter((p) =>
  p.endsWith(".js"),
)) {
  const code = await readFile("dist/assets/" + asset, "utf8");
  assert(!/chatgpt|openai|\/api\/state|signin-with-chatgpt/i.test(code));
}
async function readiness() {
  let reply;
  handlers.message({
    data: { type: "CHECK_OFFLINE_READY" },
    ports: [
      {
        postMessage: (value) => {
          reply = value;
        },
      },
    ],
    waitUntil: (promise) => {
      task = promise;
    },
  });
  await task;
  return reply.offlineReady;
}
assert.equal(
  await readiness(),
  true,
  "Complete local installation is reported ready with the host unavailable",
);
const active = [...stores.values()].find((cache) => cache.has("/index.html"));
const [asset, contents] = [...active].find(([path]) =>
  path.startsWith("/assets/"),
);
active.delete(asset);
assert.equal(
  await readiness(),
  false,
  "An active worker with a missing file is not offline-ready",
);
active.set(asset, contents);
assert.equal(await readiness(), true);
handlers.message({ data: "ACTIVATE_UPDATE" });
assert(activated);
console.log(
  "Offline package: full precache, offline navigation/assets, safe cache cleanup and independent bundle passed.",
);
