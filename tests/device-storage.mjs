import assert from "node:assert/strict";
import { build } from "esbuild";
await build({
  entryPoints: ["lib/device-storage.ts"],
  outdir: ".test-runtime",
  bundle: true,
  platform: "node",
  format: "esm",
});
const { storageProtection, verifyOfflineCache } = await import(
  "../.test-runtime/device-storage.js"
);
assert.equal(await storageProtection(undefined), "unavailable");
let requested = 0;
const storage = {
  persisted: async () => false,
  persist: async () => {
    requested++;
    return true;
  },
};
assert.equal(await storageProtection(storage), "standard");
assert.equal(
  requested,
  0,
  "Reading protection status must not request permission",
);
assert.equal(await storageProtection(storage, true), "persistent");
assert.equal(requested, 1);
assert.equal(
  await storageProtection(
    {
      persisted: async () => true,
      persist: async () => {
        throw Error("unnecessary");
      },
    },
    true,
  ),
  "persistent",
);
assert.equal(
  await storageProtection(
    { persisted: async () => false, persist: async () => false },
    true,
  ),
  "standard",
);
assert.equal(
  await storageProtection({
    persisted: async () => {
      throw Error("blocked");
    },
  }),
  "unavailable",
);
assert.equal(await verifyOfflineCache(null), false);
for (const [reply, expected] of [
  [{ offlineReady: true }, true],
  [{ offlineReady: false }, false],
  [{}, false],
]) {
  assert.equal(
    await verifyOfflineCache({
      postMessage(message, [port]) {
        assert.equal(message.type, "CHECK_OFFLINE_READY");
        port.postMessage(reply);
      },
    }),
    expected,
  );
}
assert.equal(
  await verifyOfflineCache({ postMessage() {} }, 10),
  false,
  "An older or unresponsive worker is not verified ready",
);
assert.equal(
  await verifyOfflineCache({
    postMessage() {
      throw Error("redundant");
    },
  }),
  false,
);
console.log(
  "Device storage: granted/denied/unavailable persistence, explicit requests, cache verification and unresponsive workers passed.",
);
