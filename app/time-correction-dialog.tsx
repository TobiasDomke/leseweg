import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { text, type Lang } from "@/lib/i18n";
import { readingTimeText } from "@/lib/reading-time-i18n";
import { correctionSeconds } from "@/lib/reading-time";

export default function TimeCorrectionDialog({
  seconds,
  lang,
  busy,
  onClose,
  onSave,
}: {
  seconds: number;
  lang: Lang;
  busy: boolean;
  onClose: () => void;
  onSave: (seconds: number) => Promise<unknown>;
}) {
  const t = text(lang),
    d = readingTimeText(lang);
  const [parts, setParts] = useState({
    hours: String(Math.floor(seconds / 3600)),
    minutes: String(Math.floor(seconds / 60) % 60),
    seconds: String(Math.floor(seconds) % 60),
  });
  const valid = correctionSeconds(parts) !== null;
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent className="deadline-dialog">
        <DialogTitle>{t.editTime}</DialogTitle>
        <DialogDescription>{d.correction}</DialogDescription>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            const submitted = correctionSeconds(
              Object.fromEntries(
                ["hours", "minutes", "seconds"].map((key) => [
                  key,
                  String(data.get(key) ?? ""),
                ]),
              ) as typeof parts,
            );
            if (submitted !== null && (await onSave(submitted))) onClose();
          }}
        >
          <div className="duration-fields">
            {(["hours", "minutes", "seconds"] as const).map((key) => (
              <label key={key}>
                {d[key]}
                <input
                  type="number"
                  name={key}
                  min="0"
                  max={key === "hours" ? 24 : 59}
                  step="1"
                  required
                  inputMode="numeric"
                  disabled={busy}
                  value={parts[key]}
                  onChange={(e) =>
                    setParts({ ...parts, [key]: e.target.value })
                  }
                />
              </label>
            ))}
          </div>
          {!valid && (
            <p role="alert" className="error">
              {t.invalid}
            </p>
          )}
          <div className="wizard-actions">
            <button
              type="button"
              className="secondary"
              disabled={busy}
              onClick={onClose}
            >
              {t.cancel}
            </button>
            <button className="primary" disabled={busy || !valid}>
              {busy ? t.saving : t.save}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
