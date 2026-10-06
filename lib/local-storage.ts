import { applyAction } from "./actions";
import type { ReadingState } from "./state";
import { prepareState } from "./adaptive";

// Every change reads and writes inside ONE transaction. IndexedDB serializes
// read/write transactions across tabs, preventing lost chapter/timer updates.
async function transaction(
  mode: IDBTransactionMode,
  update?: (state: ReadingState | null) => ReadingState | null,
): Promise<ReadingState | null> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    // Reject writes from still-open old app versions after chapter IDs migrate.
    const request = indexedDB.open("leseweg-local", 3);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains("reading"))
        request.result.createObjectStore("reading");
    };
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
          if (result && result.chapterSchema !== 2)
            store.put(result, "before-chapter-schema-2");
          if (result && !result.sessions)
            store.put(result, "before-editions-and-sessions");
          const original = result;
          result = update(result);
          if (
            original &&
            result &&
            original.id === result.id &&
            original.config.edition !== result.config.edition
          )
            store.put(
              original,
              `before-edition-${original.config.edition ?? "schlachter2000"}`,
            );
          store.put(result, "active");
        }
      } catch (error) {
        failure = error;
        tx.abort();
      }
    };
  });
}

// Upgrade inside the same serialized transaction as other plan changes.
export const readState = () =>
  transaction("readwrite", (state) =>
    state && state.chapterSchema !== 2 ? prepareState(state) : state,
  );
export function changeState(op: unknown) {
  return transaction("readwrite", (state) => applyAction(state, op));
}
export function restoreState(state: ReadingState, expectedId: string | null) {
  return transaction("readwrite", (current) => {
    if ((current?.id ?? null) !== expectedId) throw Error("stale");
    return { ...state, id: crypto.randomUUID(), ops: [] };
  });
}
