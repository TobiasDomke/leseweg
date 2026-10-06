import { useEffect, useState } from "react";
const key = (id: string) => `leseweg-backup-${id}`;
export function backupStatus(id: string | null) {
  try {
    const raw = JSON.parse(localStorage.getItem(key(id ?? "")) ?? "{}");
    return {
      exported: typeof raw.exported === "number" ? raw.exported : 0,
      snoozed: typeof raw.snoozed === "number" ? raw.snoozed : 0,
    };
  } catch {
    return { exported: 0, snoozed: 0 };
  }
}
export function recordBackup(id: string, kind: "exported" | "snoozed") {
  try {
    localStorage.setItem(
      key(id),
      JSON.stringify({ ...backupStatus(id), [kind]: Date.now() }),
    );
    window.dispatchEvent(new Event("leseweg-backup"));
  } catch {}
}
export function useBackupStatus(id: string | null) {
  const [status, setStatus] = useState(() => backupStatus(id));
  useEffect(() => {
    const refresh = () => setStatus(backupStatus(id));
    refresh();
    window.addEventListener("leseweg-backup", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("leseweg-backup", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [id]);
  return status;
}
