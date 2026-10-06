import { useEffect, useState } from "react";
import { Smartphone, Check, Download, Share2 } from "lucide-react";
import { text, type Lang } from "@/lib/i18n";
import {
  storageProtection,
  type StorageProtection,
} from "@/lib/device-storage";
import type { useOffline } from "@/lib/offline";

export default function InstallControls({
  lang,
  offline,
}: {
  lang: Lang;
  offline: ReturnType<typeof useOffline>;
}) {
  const t = text(lang);
  const [installed, setInstalled] = useState(false);
  const [protection, setProtection] = useState<StorageProtection>("checking");
  const [requesting, setRequesting] = useState(false);
  const [shareStatus, setShareStatus] = useState<"" | "copied" | "failed">("");
  const shareUrl = location.protocol === "https:" ? `${location.origin}/` : "";

  useEffect(() => {
    const display = window.matchMedia("(display-mode: standalone)");
    const refresh = () =>
      setInstalled(
        display.matches ||
          (navigator as Navigator & { standalone?: boolean }).standalone ===
            true,
      );
    refresh();
    display.addEventListener("change", refresh);
    return () => display.removeEventListener("change", refresh);
  }, []);
  useEffect(() => {
    let disposed = false;
    void storageProtection(navigator.storage, installed && offline.ready).then(
      (value) => {
        if (!disposed) setProtection(value);
      },
    );
    return () => {
      disposed = true;
    };
  }, [installed, offline.ready]);

  return (
    <section className="panel settings-card install-card">
      <Smartphone size={22} />
      <h2>{t.installTitle}</h2>
      <p className="muted">{t.installLocal}</p>
      {installed ? (
        <p className="install-status">
          <Check size={17} />
          {t.installed}
        </p>
      ) : (
        <>
          <details className="install-steps" open>
            <summary>iPhone / iPad</summary>
            <p>{t.installSub}</p>
          </details>
          <details className="install-steps">
            <summary>Android</summary>
            <p>{t.installAndroid}</p>
          </details>
          <details className="install-steps">
            <summary>Mac / Windows / Linux</summary>
            <p>{t.installDesktop}</p>
          </details>
          <p className="fineprint">{t.installThenPlan}</p>
        </>
      )}
      <div className="install-storage" aria-live="polite">
        <p className="install-status">
          <Download size={17} />
          {offline.checking
            ? t.offlineChecking
            : offline.ready
              ? t.offlineReady
              : offline.failed
                ? t.offlineFailed
                : t.offlinePreparing}
        </p>
        <p className="fineprint">
          {protection === "persistent"
            ? t.storageProtected
            : protection === "standard"
              ? t.storageStandard
              : protection === "checking"
                ? t.storageChecking
                : t.storageUnavailable}
        </p>
      </div>
      <div className="backup-actions">
        <button
          className="secondary"
          disabled={offline.checking}
          onClick={() => void offline.check()}
        >
          {t.checkOffline}
        </button>
        {protection === "standard" && (
          <button
            className="secondary"
            disabled={requesting}
            onClick={async () => {
              setRequesting(true);
              setProtection(await storageProtection(navigator.storage, true));
              setRequesting(false);
            }}
          >
            {requesting ? t.storageChecking : t.protectStorage}
          </button>
        )}
      </div>
      <p className="fineprint">{t.offlineLimit}</p>
      <p className="fineprint">{t.offlineTest}</p>
      {shareUrl ? (
        <>
          <button
            className="secondary full"
            onClick={async () => {
              setShareStatus("");
              try {
                if (navigator.share)
                  await navigator.share({ title: "Leseweg", url: shareUrl });
                else {
                  await navigator.clipboard.writeText(shareUrl);
                  setShareStatus("copied");
                }
              } catch (error) {
                if (
                  !(
                    error instanceof DOMException && error.name === "AbortError"
                  )
                )
                  setShareStatus("failed");
              }
            }}
          >
            <Share2 size={17} />
            {t.shareApp}
          </button>
          <p className="fineprint">{t.shareOnlyApp}</p>
          {shareStatus && (
            <p role="status" className="fineprint">
              {shareStatus === "copied" ? t.linkCopied : t.shareFailed}
            </p>
          )}
        </>
      ) : (
        <p className="fineprint">{t.localPreviewLink}</p>
      )}
    </section>
  );
}
