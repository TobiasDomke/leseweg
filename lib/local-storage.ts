import { applyAction } from "./actions";
import type { ReadingState } from "./state";

// Every change reads and writes inside ONE transaction. IndexedDB serializes
// read/write transactions across tabs, preventing lost chapter/timer updates.
async function transaction(
  mode: IDBTransactionMode,
  update?: (state: ReadingState | null) => ReadingState,
): Promise<ReadingState | null> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("leseweg-local", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("reading");
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(Error("storage"));
    request.onsuccess = () => resolve(request.result);
  });
  return new Promise((resolve, reject) => {
    let result: ReadingState | null = null;
    let failure: unknown;
    const tx = db.transaction("reading", mode);
    const store = tx.objectStore("reading");
    tx.oncomplete = () => {
      db.close();
      resolve(result);
    };
    tx.onabort = () => {
      db.close();
      reject(failure || tx.error || Error("storage"));
    };
    tx.onerror = () => {
      /* onabort reports the transaction failure. */
    };
    const request = store.get("active");
    request.onsuccess = () => {
      try {
        result = request.result ?? null;
        if (update) {
          result = update(result);
          store.put(result, "active");
        }
      } catch (error) {
        failure = error;
        tx.abort();
      }
    };
  });
}

export const readState = () => transaction("readonly");
export function changeState(op: unknown) {
  return transaction("readwrite", (state) => applyAction(state, op));
}
export function restoreState(state: ReadingState, expectedId: string | null) {
  return transaction("readwrite", (current) => {
    if ((current?.id ?? null) !== expectedId) throw Error("stale");
    return { ...state, id: crypto.randomUUID(), ops: [] };
  });
}
