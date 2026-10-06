import { useCallback, useEffect, useRef, useState } from "react";
import { verifyOfflineCache } from "./device-storage";

export function useOffline() {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [checking, setChecking] = useState(false);
  const [update, setUpdate] = useState(false);
  const registration = useRef<ServiceWorkerRegistration | null>(null);
  const activating = useRef(false);
  const refresh = useRef<() => Promise<void>>(async () => {});
  const check = useCallback(() => refresh.current(), []);
  useEffect(() => {
    if (!import.meta.env.PROD || !("serviceWorker" in navigator)) {
      setFailed(true);
      return;
    }
    let disposed = false;
    let cleanup = () => {};
    let sequence = 0;
    let starting = false;
    const verify = async (reg: ServiceWorkerRegistration | null) => {
      const version = ++sequence;
      setChecking(true);
      const cached = await verifyOfflineCache(reg?.active ?? null);
      if (disposed || version !== sequence) return;
      setReady(cached);
      setFailed(!cached && !reg?.installing);
      setChecking(false);
    };
    const attach = (reg: ServiceWorkerRegistration) => {
      cleanup();
      registration.current = reg;
      setUpdate(!!reg.waiting);
      const workers = new Map<ServiceWorker, () => void>();
      const watch = () => {
        const worker = reg.installing;
        if (!worker || workers.has(worker)) return;
        const changed = () => {
          if (disposed) return;
          setUpdate(
            !!reg.waiting || (worker.state === "installed" && !!reg.active),
          );
          if (worker.state === "activated" || worker.state === "redundant")
            void verify(reg);
        };
        workers.set(worker, changed);
        worker.addEventListener("statechange", changed);
        changed();
      };
      reg.addEventListener("updatefound", watch);
      watch();
      cleanup = () => {
        reg.removeEventListener("updatefound", watch);
        workers.forEach((listener, worker) =>
          worker.removeEventListener("statechange", listener),
        );
      };
      void verify(reg);
    };
    const start = async () => {
      if (starting) return;
      starting = true;
      setChecking(true);
      try {
        const existing = await navigator.serviceWorker.getRegistration();
        if (disposed) return;
        if (existing) attach(existing);
        if (navigator.onLine) {
          try {
            const reg = await navigator.serviceWorker.register("/sw.js", {
              updateViaCache: "none",
            });
            if (!disposed) attach(reg);
          } catch {
            // An unavailable host must not hide a working local installation.
            if (!disposed) await verify(existing ?? null);
          }
        } else {
          await verify(existing ?? null);
        }
      } catch {
        if (!disposed) {
          setFailed(true);
          setChecking(false);
        }
      } finally {
        starting = false;
      }
    };
    refresh.current = start;
    void start();
    const controlled = () => {
      if (activating.current) location.reload();
      else void start();
    };
    const online = () => void start();
    navigator.serviceWorker.addEventListener("controllerchange", controlled);
    window.addEventListener("online", online);
    return () => {
      disposed = true;
      refresh.current = async () => {};
      cleanup();
      window.removeEventListener("online", online);
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        controlled,
      );
    };
  }, []);
  return {
    ready,
    failed,
    checking,
    update,
    check,
    activate: () => {
      if (registration.current?.waiting) {
        activating.current = true;
        registration.current.waiting.postMessage("ACTIVATE_UPDATE");
      }
    },
  };
}
