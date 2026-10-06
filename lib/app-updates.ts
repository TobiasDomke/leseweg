export type UpdateStatus =
  | "idle"
  | "checking"
  | "current"
  | "available"
  | "offline"
  | "failed";

// A successful update() request does not mean the new files are installed yet.
// Wait for installation before offering an update or reporting the app current.
export function checkAppUpdate(
  reg: ServiceWorkerRegistration,
  timeoutMs = 30000,
): Promise<boolean> {
  if (reg.waiting) return Promise.resolve(true);
  return new Promise((resolve, reject) => {
    let worker: ServiceWorker | null = null;
    let requestDone = false;
    let settled = false;
    const finish = (error: Error | null, available = false) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      reg.removeEventListener("updatefound", watch);
      worker?.removeEventListener("statechange", inspect);
      if (error) reject(error);
      else resolve(available);
    };
    const inspect = () => {
      if (reg.waiting) return finish(null, true);
      if (worker?.state === "redundant")
        return finish(new Error("update_install_failed"));
      if (!requestDone) return;
      if (worker?.state === "installed" && reg.active)
        return finish(null, true);
      if (
        worker &&
        ["installing", "installed", "activating"].includes(worker.state)
      )
        return;
      finish(null);
    };
    const watch = () => {
      if (settled) return;
      if (reg.installing && reg.installing !== worker) {
        worker?.removeEventListener("statechange", inspect);
        worker = reg.installing;
        worker.addEventListener("statechange", inspect);
      }
      inspect();
    };
    const timeout = setTimeout(
      () => finish(new Error("update_timeout")),
      timeoutMs,
    );
    reg.addEventListener("updatefound", watch);
    watch();
    if (reg.installing) {
      requestDone = true;
      inspect();
    } else {
      reg
        .update()
        .then(() => {
          requestDone = true;
          watch();
        })
        .catch(() => finish(new Error("update_check_failed")));
    }
  });
}
