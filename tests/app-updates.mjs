import assert from "node:assert/strict";
import { build } from "esbuild";
await build({
  entryPoints: ["lib/app-updates.ts"],
  outdir: ".test-runtime",
  bundle: true,
  platform: "node",
  format: "esm",
});
const { checkAppUpdate } = await import("../.test-runtime/app-updates.js");

class Worker extends EventTarget {
  state = "installing";
  postMessage() {
    assert.fail("Checking for updates must not activate them");
  }
  change(state) {
    this.state = state;
    this.dispatchEvent(new Event("statechange"));
  }
}
class Registration extends EventTarget {
  active = new Worker();
  waiting = null;
  installing = null;
  calls = 0;
  async update() {
    this.calls++;
    return this;
  }
  install() {
    this.installing = new Worker();
    this.dispatchEvent(new Event("updatefound"));
    return this.installing;
  }
  finish(worker) {
    this.installing = null;
    this.waiting = worker;
    worker.change("installed");
  }
}

const current = new Registration();
assert.equal(await checkAppUpdate(current), false);
assert.equal(
  current.calls,
  1,
  "Manual checks must contact the server even when a worker is active",
);
const cached = new Registration();
cached.waiting = new Worker();
cached.update = async () => {
  assert.fail("A fully downloaded update is also available offline");
};
assert.equal(await checkAppUpdate(cached), true);

// A download outlives update(). Do not report 'up to date' while it is pending.
const downloading = new Registration();
let worker;
downloading.update = async () => {
  worker = downloading.install();
  return downloading;
};
let settled = false;
const checking = checkAppUpdate(downloading).then((value) => {
  settled = true;
  return value;
});
await new Promise((resolve) => setImmediate(resolve));
assert.equal(settled, false);
downloading.finish(worker);
assert.equal(await checking, true);

const alreadyInstalling = new Registration();
const inProgress = alreadyInstalling.install();
const pending = checkAppUpdate(alreadyInstalling);
assert.equal(
  alreadyInstalling.calls,
  0,
  "A check must not restart a download in progress",
);
alreadyInstalling.finish(inProgress);
assert.equal(await pending, true);

const failedDownload = new Registration();
const failedWorker = failedDownload.install();
const failure = assert.rejects(
  checkAppUpdate(failedDownload),
  /update_install_failed/,
);
failedDownload.installing = null;
failedWorker.change("redundant");
await failure;
assert(
  failedDownload.active,
  "Failed downloads must keep the existing app active",
);

const firstInstall = new Registration();
firstInstall.active = null;
const firstWorker = firstInstall.install();
const first = checkAppUpdate(firstInstall);
firstWorker.change("installed");
firstInstall.active = firstWorker;
firstInstall.installing = null;
firstWorker.change("activated");
assert.equal(
  await first,
  false,
  "A completed first installation is current, not a pending upgrade",
);

const offline = new Registration();
offline.update = async () => {
  throw new Error("offline");
};
await assert.rejects(checkAppUpdate(offline), /update_check_failed/);
const stuck = new Registration();
const stuckWorker = stuck.install();
await assert.rejects(checkAppUpdate(stuck, 10), /update_timeout/);
stuck.finish(stuckWorker);
assert.equal(
  await checkAppUpdate(stuck),
  true,
  "A slow download can still be offered after a timed-out check",
);
const unreachable = new Registration();
unreachable.update = () => new Promise(() => {});
await assert.rejects(checkAppUpdate(unreachable, 10), /update_timeout/);
console.log(
  "App updates: current/available versions, pending downloads, first installation, failed/offline checks, timeouts and explicit activation passed.",
);
