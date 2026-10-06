export type StorageProtection =
  | "checking"
  | "persistent"
  | "standard"
  | "unavailable";

export async function storageProtection(
  storage: Pick<StorageManager, "persisted" | "persist"> | undefined,
  request = false,
): Promise<StorageProtection> {
  if (!storage?.persisted) return "unavailable";
  try {
    if (await storage.persisted()) return "persistent";
    if (request && storage.persist && (await storage.persist()))
      return "persistent";
    return "standard";
  } catch {
    return "unavailable";
  }
}

export function verifyOfflineCache(
  worker: Pick<ServiceWorker, "postMessage"> | null,
  timeoutMs = 4000,
): Promise<boolean> {
  if (!worker) return Promise.resolve(false);
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    const finish = (ready: boolean) => {
      clearTimeout(timeout);
      channel.port1.close();
      channel.port2.close();
      resolve(ready);
    };
    const timeout = setTimeout(() => finish(false), timeoutMs);
    channel.port1.onmessage = (event) =>
      finish(event.data?.offlineReady === true);
    try {
      worker.postMessage({ type: "CHECK_OFFLINE_READY" }, [channel.port2]);
    } catch {
      finish(false);
    }
  });
}
