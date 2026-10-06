import { useState } from "react";
import { Smartphone, Download } from "lucide-react";
import { experienceText } from "@/lib/experience-i18n";
import { text, type Lang } from "@/lib/i18n";
import type { ReadingState } from "@/lib/state";
import type { useInstallation } from "@/lib/installation";
import type { useOffline } from "@/lib/offline";
import InstallControls from "./install-controls";
import BackupControls from "./backup-controls";
export default function InstallGate({
  lang,
  state,
  theme,
  installation,
  offline,
}: {
  lang: Lang;
  state: ReadingState | null;
  theme: string;
  installation: ReturnType<typeof useInstallation>;
  offline: ReturnType<typeof useOffline>;
}) {
  const e = experienceText(lang),
    t = text(lang),
    [failed, setFailed] = useState(false);
  const apple =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (/Mac/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
  const android = /Android/.test(navigator.userAgent);
  return (
    <div className="install-landing">
      <section className="panel install-intro">
        <Smartphone size={30} />
        <h1>{e.install}</h1>
        <p>{e.installHelp}</p>
        {installation.prompt && (
          <button
            className="primary full"
            disabled={!offline.ready}
            onClick={async () => {
              setFailed(false);
              try {
                await installation.install();
              } catch {
                setFailed(true);
              }
            }}
          >
            <Download size={18} />
            {e.installButton}
          </button>
        )}
        {installation.accepted && (
          <p className="notice" role="status">
            {e.openIcon}
          </p>
        )}
        {failed && <p role="alert">{e.installFailed}</p>}
        <details open={apple}>
          <summary>iPhone / iPad</summary>
          <p>{e.apple}</p>
        </details>
        <details open={android}>
          <summary>Android</summary>
          <p>{e.android}</p>
        </details>
        <details open={!apple && !android}>
          <summary>Mac / Windows / Linux</summary>
          <p>{e.desktop}</p>
        </details>
        <p role="status" className="fineprint">
          {offline.ready
            ? t.offlineReady
            : offline.failed
              ? t.offlineFailed
              : t.offlinePreparing}
        </p>
        {!offline.ready && (
          <button
            className="secondary"
            disabled={offline.checking}
            onClick={() => void offline.check()}
          >
            {t.checkOffline}
          </button>
        )}
      </section>
      {state && (
        <>
          <p className="notice">{e.browserData}</p>
          <BackupControls
            state={state}
            lang={lang}
            theme={theme}
            busy={false}
            exportOnly
            onRestore={() => {}}
          />
        </>
      )}
      <details className="panel install-more">
        <summary>{e.more}</summary>
        <InstallControls lang={lang} offline={offline} />
      </details>
    </div>
  );
}
