import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { chaptersFor, addDays, duration, dateAt, today } from "@/lib/planner";
import { dayIndex } from "@/lib/adaptive";
import { deadlineBounds, rescheduleDeadline } from "@/lib/deadline";
import { deadlineText } from "@/lib/deadline-i18n";
import { readingPace, estimatedMinutes } from "@/lib/pace";
import { text, locales, type Lang } from "@/lib/i18n";
import { fill } from "@/lib/plan-i18n";
import type { ReadingState } from "@/lib/state";

// Mounted only while open, so each visit starts from the latest saved goal.
export default function DeadlineDialog({
  state,
  lang,
  busy,
  onClose,
  onSave,
}: {
  state: ReadingState;
  lang: Lang;
  busy: boolean;
  onClose: () => void;
  onSave: (end: string) => Promise<ReadingState | null>;
}) {
  const t = text(lang),
    d = deadlineText(lang),
    date = today(state.config.timezone);
  const [end, setEnd] = useState(
    addDays(state.config.start, duration(state.config) - 1),
  );
  const bounds = deadlineBounds(state, date);
  const fmt = (value: string) =>
    dateAt(value).toLocaleDateString(locales[lang], {
      timeZone: "UTC",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  const preview = useMemo(() => {
    if (state.timer) return null;
    try {
      return rescheduleDeadline(state, end, date);
    } catch {
      return null;
    }
  }, [state, end, date]);
  const remaining =
    preview
      ?.adaptive!.days.slice(dayIndex(preview.config, date))
      .filter(
        (_, i) =>
          !preview.adaptive!.finished.includes(
            dayIndex(preview.config, date) + i,
          ),
      ) ?? [];
  const inventory = chaptersFor(state.config);
  const words = remaining
    .flat()
    .reduce((sum, id) => sum + (inventory[id]?.words ?? 0), 0);
  const estimate = estimatedMinutes(
    words / Math.max(1, remaining.length),
    readingPace(state),
  );
  const days = remaining.length,
    count = remaining.flat().length;
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent className="deadline-dialog">
        <DialogTitle>{d.edit}</DialogTitle>
        <DialogDescription>{d.help}</DialogDescription>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const value = new FormData(e.currentTarget).get("deadline");
            const submitted = typeof value === "string" ? value : end;
            if (!state.timer) {
              try {
                rescheduleDeadline(state, submitted, date);
              } catch {
                setEnd(submitted);
                return;
              }
              if (await onSave(submitted)) onClose();
            }
          }}
        >
          <label htmlFor="new-deadline">{d.end}</label>
          <input
            id="new-deadline"
            name="deadline"
            type="date"
            required
            min={bounds.min}
            max={bounds.max}
            value={end}
            disabled={busy}
            onInput={(e) => setEnd(e.currentTarget.value)}
            onChange={(e) => setEnd(e.target.value)}
          />
          <p className="fineprint">{d.inclusive}</p>
          {state.timer ? (
            <p className="notice">{d.pause}</p>
          ) : preview ? (
            <div className="deadline-preview" aria-live="polite">
              <strong>{d.preview}</strong>
              <p>{fill(d.remaining, { chapters: count, days })}</p>
              {!!count && <p>{fill(d.estimate, { minutes: estimate })}</p>}
              {count > 0 && estimate > 90 && (
                <p className="warning">{t.longDay}</p>
              )}
              {end === date && count > 0 && <p>{d.today}</p>}
            </div>
          ) : (
            <p className="error" role="alert">
              {fill(d.bounds, { min: fmt(bounds.min), max: fmt(bounds.max) })}
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
            <button
              className="primary"
              disabled={busy || !!state.timer || !preview}
            >
              {busy ? t.saving : t.save}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
