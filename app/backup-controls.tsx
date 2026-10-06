import { useState } from "react";
import { Download, Upload, HardDrive } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { text, locales, type Lang } from "@/lib/i18n";
import type { ReadingState } from "@/lib/state";
import {
  parseBackup,
  makeBackup,
  maxBackupBytes,
  type Backup,
} from "@/lib/backup";
import { readState, restoreState } from "@/lib/local-storage";
import { downloadFile } from "@/lib/exports";

export default function BackupControls({
  state,
  lang,
  theme,
  busy,
  onRestore,
}: {
  state: ReadingState | null;
  lang: Lang;
  theme: string;
  busy: boolean;
  onRestore: (value: ReadingState, theme: string) => void;
}) {
  const t = text(lang);
  const [backup, setBackup] = useState<Backup | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  return (
    <section className="panel settings-card backup-card">
      <HardDrive size={22} />
      <h2 className="mt-3">{t.localData}</h2>
      <p className="muted">{t.localDataSub}</p>
      <div className="backup-actions">
        {state && (
          <button
            className="secondary"
            disabled={busy || working}
            onClick={async () => {
              setError("");
              setWorking(true);
              try {
                const latest = await readState();
                if (!latest) throw Error();
                downloadFile(
                  makeBackup(latest, lang, theme),
                  `leseweg-sicherung-${new Date().toISOString().slice(0, 10)}.json`,
                  "application/json",
                );
              } catch {
                setError(t.backupSaveError);
              } finally {
                setWorking(false);
              }
            }}
          >
            <Download size={17} />
            {t.backupSave}
          </button>
        )}
        <label className="secondary file-picker">
          <Upload size={17} />
          {t.backupLoad}
          <input
            type="file"
            accept=".json,application/json"
            aria-label={t.backupLoad}
            disabled={busy || working}
            onChange={async (e) => {
              const file = e.currentTarget.files?.[0];
              e.currentTarget.value = "";
              if (!file) return;
              setError("");
              setWorking(true);
              try {
                if (file.size > maxBackupBytes) throw Error();
                setBackup(parseBackup(await file.text()));
              } catch {
                setError(t.backupInvalid);
              } finally {
                setWorking(false);
              }
            }}
          />
        </label>
      </div>
      <p className="fineprint">{t.backupNote}</p>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <AlertDialog
        open={!!backup}
        onOpenChange={(open) => {
          if (!open && !working) setBackup(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.backupRestoreTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.backupRestoreText}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {backup && (
            <p>
              {new Date(backup.exportedAt).toLocaleDateString(locales[lang])} ·{" "}
              {Object.keys(backup.state.done).length} {t.chapters} · {t.read}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={working}>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy || working}
              onClick={async (e) => {
                e.preventDefault();
                if (!backup) return;
                setWorking(true);
                setError("");
                try {
                  const restored = await restoreState(
                    backup.state,
                    state?.id ?? null,
                  );
                  if (!restored) throw Error();
                  onRestore(restored, backup.theme);
                  if ("BroadcastChannel" in window) {
                    const channel = new BroadcastChannel("leseweg-updates");
                    channel.postMessage("changed");
                    channel.close();
                  }
                  navigator.storage?.persist?.().catch(() => {});
                  setBackup(null);
                } catch {
                  setError(t.backupSaveError);
                  setBackup(null);
                } finally {
                  setWorking(false);
                }
              }}
            >
              {working ? t.saving : t.backupRestore}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
