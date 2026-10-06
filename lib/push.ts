import { PUSH_API } from "./push-config";
import type { Lang } from "./i18n";
export type PushSettings = { time: string; timezone: string; language: Lang };
export type PushRecord = { token: string; pendingDelete?: boolean };
export type PushStatus = PushSettings & { enabled: boolean; nextRun: number };
const STORAGE_KEY = "leseweg-push-device-v1";
export function readPushRecord(): PushRecord | null {
  const value = localStorage.getItem(STORAGE_KEY);
  if (!value) return null;
  try {
    const record = JSON.parse(value);
    return typeof record.token === "string" &&
      /^[A-Za-z0-9_-]{43}$/.test(record.token)
      ? record
      : null;
  } catch {
    return null;
  }
}
export function savePushRecord(record: PushRecord | null) {
  if (record) localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  else localStorage.removeItem(STORAGE_KEY);
}
export function deviceToken() {
  return btoa(
    String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))),
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}
export function applicationKey(value: string) {
  return Uint8Array.from(
    atob(value.replace(/-/g, "+").replace(/_/g, "/")),
    (c) => c.charCodeAt(0),
  );
}
export function sameSettings(a: PushSettings | null, b: PushSettings) {
  return (
    !!a &&
    a.time === b.time &&
    a.timezone === b.timezone &&
    a.language === b.language
  );
}
let requests: Promise<unknown> = Promise.resolve();
export function pushRequest(
  path: string,
  method = "GET",
  record?: PushRecord | null,
  body?: unknown,
): Promise<any> {
  const next = requests
    .catch(() => {})
    .then(() => sendRequest(path, method, record, body));
  requests = next;
  return next;
}
async function sendRequest(
  path: string,
  method: string,
  record?: PushRecord | null,
  body?: unknown,
) {
  if (!PUSH_API) throw new Error("not_configured");
  const response = await fetch(PUSH_API + path, {
    method,
    credentials: "omit",
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
    headers: {
      ...(record ? { Authorization: `Bearer ${record.token}` } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await response.json();
  if (response.status === 404 && path === "/subscription")
    return { enabled: false };
  if (!response.ok)
    throw new Error(
      typeof result.error === "string" ? result.error : "unavailable",
    );
  return result;
}
export async function pushRegistration() {
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing?.active) return existing;
  let timer: ReturnType<typeof setTimeout>;
  try {
    return await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("worker_not_ready")), 10000);
      }),
    ]);
  } finally {
    clearTimeout(timer!);
  }
}
