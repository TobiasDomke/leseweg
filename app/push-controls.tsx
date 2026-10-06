import { useEffect, useState } from "react";
import { BellRing } from "lucide-react";
import { locales, type Lang } from "@/lib/i18n";
import { PUSH_API } from "@/lib/push-config";
import { pushText } from "@/lib/push-i18n";
import {
  applicationKey,
  deviceToken,
  pushRegistration,
  pushRequest,
  readPushRecord,
  sameSettings,
  savePushRecord,
  type PushSettings,
  type PushStatus,
} from "@/lib/push";

export default function PushControls({
  time,
  timezone,
  lang,
}: {
  time: string;
  timezone: string;
  lang: Lang;
}) {
  const t = pushText(lang);
  const [key, setKey] = useState("");
  const [server, setServer] = useState<PushStatus | null>(null);
  const [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const working = busy || syncing;
  const [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [revision, setRevision] = useState(0),
    [online, setOnline] = useState(navigator.onLine);
  const [pendingDelete, setPendingDelete] = useState(false),
    [hasSubscription, setHasSubscription] = useState(false);
  const supported =
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window &&
    window.isSecureContext;
  const ios =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const standalone =
    matchMedia("(display-mode: standalone)").matches ||
    !!(navigator as Navigator & { standalone?: boolean }).standalone;
  const needInstall = ios && !standalone;
  const blocked = supported && Notification.permission === "denied";
  const desired: PushSettings = { time, timezone, language: lang };
  const mismatch = !!server?.enabled && !sameSettings(server, desired);

  useEffect(() => {
    const changed = () => {
      setOnline(navigator.onLine);
      setRevision((value) => value + 1);
    };
    window.addEventListener("online", changed);
    window.addEventListener("offline", changed);
    return () => {
      window.removeEventListener("online", changed);
      window.removeEventListener("offline", changed);
    };
  }, []);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!PUSH_API || !supported || needInstall) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const record = readPushRecord();
        const subscription = await (
          await navigator.serviceWorker.getRegistration()
        )?.pushManager.getSubscription();
        if (!cancelled) {
          setHasSubscription(!!subscription);
          setPendingDelete(!!record?.pendingDelete);
        }
        if (!online) return;
        if (record?.pendingDelete) {
          if (!cancelled) setPendingDelete(true);
          await pushRequest("/subscription", "DELETE", record);
          savePushRecord(null);
          if (!cancelled) {
            setPendingDelete(false);
            setServer(null);
          }
        }
        const config = await pushRequest("/config");
        if (!cancelled) setKey(config.available ? config.publicKey : "");
        if (record && !record.pendingDelete) {
          const value = await pushRequest("/subscription", "GET", record);
          if (!cancelled) {
            setServer(value.enabled ? value : null);
            if (value.enabled && !subscription)
              setError("subscription_expired");
          }
        }
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "unavailable");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [online, revision, supported, needInstall]);
  useEffect(() => {
    if (!mismatch || loading || !online || blocked || pendingDelete || !key)
      return;
    let cancelled = false;
    setSyncing(true);
    setError("");
    void (async () => {
      try {
        const record = readPushRecord();
        const subscription = await (
          await pushRegistration()
        ).pushManager.getSubscription();
        if (cancelled) return;
        if (!record || !subscription) throw new Error("subscription_expired");
        const result = await pushRequest("/subscription", "PUT", record, {
          ...desired,
          subscription: subscription.toJSON(),
        });
        if (!cancelled) setServer(result);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "unavailable");
      } finally {
        if (!cancelled) setSyncing(false);
      }
    })();
    return () => {
      cancelled = true;
      setSyncing(false);
    };
    // Retry failures only on another saved setting, reconnect or explicit retry.
  }, [time, timezone, lang, server?.enabled, online, revision, loading, key]);

  const enable = async () => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      // Keep the permission request directly inside the user's click on iOS.
      if ((await Notification.requestPermission()) !== "granted")
        throw new Error("permission_denied");
      const record = readPushRecord() ?? { token: deviceToken() };
      record.pendingDelete = false;
      savePushRecord(record);
      const registration = await pushRegistration();
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationKey(key),
        }));
      setHasSubscription(true);
      const result = await pushRequest("/subscription", "PUT", record, {
        ...desired,
        subscription: subscription.toJSON(),
      });
      setServer(result);
      setPendingDelete(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "unavailable");
    } finally {
      setBusy(false);
    }
  };
  const disable = async () => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const subscription = await (
        await navigator.serviceWorker.getRegistration()
      )?.pushManager.getSubscription();
      if (subscription && !(await subscription.unsubscribe()))
        throw new Error("unavailable");
      setHasSubscription(false);
      setServer(null);
      const record = readPushRecord();
      if (record) {
        savePushRecord({ ...record, pendingDelete: true });
        setPendingDelete(true);
        await pushRequest("/subscription", "DELETE", record);
        savePushRecord(null);
        setPendingDelete(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "unavailable");
    } finally {
      setBusy(false);
    }
  };
  const test = async () => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await pushRequest("/test", "POST", readPushRecord());
      setNotice("test");
    } catch (e) {
      setError(e instanceof Error ? e.message : "unavailable");
    } finally {
      setBusy(false);
    }
  };
  const errorMessage =
    error === "rate_limited"
      ? t.limited
      : error === "subscription_expired"
        ? t.expired
        : error === "subscription_conflict"
          ? t.conflict
          : error === "permission_denied"
            ? t.blocked
            : t.failed;
  return (
    <div className="push-controls">
      <h3>
        <BellRing size={18} aria-hidden="true" /> {t.title}
      </h3>
      <p className="muted">{t.intro}</p>
      <p className="fineprint">{t.privacy}</p>
      {!PUSH_API ? (
        <p>{t.notConfigured}</p>
      ) : needInstall ? (
        <p>{t.install}</p>
      ) : !supported ? (
        <p>{t.unsupported}</p>
      ) : (
        <>
          <p className="fineprint">{t.savedTime}</p>
          <p role="status">
            {loading
              ? t.checking
              : working
                ? t.updating
                : pendingDelete
                  ? t.pendingDelete
                  : server?.enabled
                    ? `${t.active} · ${server.time} (${server.timezone})`
                    : online
                      ? t.inactive
                      : t.offline}
          </p>
          {!!server?.nextRun && !pendingDelete && (
            <p className="fineprint">
              {t.next}:{" "}
              {new Date(server.nextRun).toLocaleString(locales[lang], {
                timeZone: server.timezone,
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          )}
          {blocked && <p role="alert">{t.blocked}</p>}
          {!loading && !key && !error && online && <p>{t.notConfigured}</p>}
          {!online && <p>{t.offline}</p>}
          {!!error && !pendingDelete && (
            <p role="alert">
              {errorMessage}
              {mismatch ? ` ${t.syncingError}` : ""}
            </p>
          )}
          {notice === "test" && <p role="status">{t.testSent}</p>}
          <div className="backup-actions">
            {!server?.enabled && !pendingDelete && (
              <button
                className="primary"
                disabled={working || loading || !online || !key || blocked}
                onClick={enable}
              >
                {t.enable}
              </button>
            )}
            {(server?.enabled || hasSubscription || pendingDelete) && (
              <button
                className="secondary"
                disabled={working || loading}
                onClick={disable}
              >
                {t.disable}
              </button>
            )}
            {server?.enabled && (
              <button
                className="secondary"
                disabled={working || loading || !online || blocked || mismatch}
                onClick={test}
              >
                {t.test}
              </button>
            )}
            {(!!error || pendingDelete) && (
              <button
                className="secondary"
                disabled={working || !online}
                onClick={() => setRevision((value) => value + 1)}
              >
                {t.retry}
              </button>
            )}
          </div>
          <p className="fineprint">{t.delivery}</p>
        </>
      )}
    </div>
  );
}
