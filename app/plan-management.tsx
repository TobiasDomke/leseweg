import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { deadlineText } from "@/lib/deadline-i18n";
import type { ReadingState } from "@/lib/state";
import { text, type Lang } from "@/lib/i18n";
import { planText, fill } from "@/lib/plan-i18n";
import Bible52Weeks from "./bible52-weeks";
import { isBible52 } from "@/lib/planner";
import { bible52Text } from "@/lib/bible52-i18n";
import PreviousPicker from "./previous-picker";
export default function PlanManagement({
  state,
  lang,
  busy,
  mutate,
  onEditDeadline,
}: {
  state: ReadingState;
  lang: Lang;
  busy: boolean;
  onEditDeadline: () => void;
  mutate: (op: Record<string, unknown>) => Promise<ReadingState | null>;
}) {
  const fixed = isBible52(state.config),
    f = bible52Text(lang);
  const p = planText(lang),
    t = text(lang);
  const [mode, setMode] = useState<"previous" | null>(null),
    [previous, setPrevious] = useState<number[]>([]);
  return (
    <section className="panel settings-card">
      <h2>{p.manage}</h2>
      <p className="muted">
        {fixed
          ? "Bibelleseplan 52"
          : `${p[state.config.scope ?? "bible"]} · ${p[state.config.order ?? "canonical"]}`}
      </p>
      <p>{fill(p.selected, { count: state.previouslyRead?.length ?? 0 })}</p>
      <div className="management-actions">
        <button
          className="secondary"
          disabled={busy || !!state.timer || (fixed && !!state.pace?.draft)}
          onClick={() => {
            setPrevious(state.previouslyRead ?? []);
            setMode("previous");
          }}
        >
          {p.editPrevious}
        </button>
        {!fixed && (
          <button
            className="secondary"
            disabled={busy}
            onClick={onEditDeadline}
          >
            {deadlineText(lang).edit}
          </button>
        )}
      </div>
      {(state.timer || (fixed && state.pace?.draft)) && (
        <p className="fineprint">{p.stopFirst}</p>
      )}
      <Dialog
        open={mode !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setMode(null);
        }}
      >
        <DialogContent className="plan-management-dialog">
          <DialogTitle>{p.editPrevious}</DialogTitle>
          <DialogDescription>
            {fixed ? f.progressHelp : p.previousEditHelp}
          </DialogDescription>
          <>
            {fixed ? (
              <Bible52Weeks
                value={previous}
                onChange={setPrevious}
                lang={lang}
                locked={Object.keys(state.done).map(Number)}
                disabled={busy}
              />
            ) : (
              <PreviousPicker
                config={state.config}
                value={previous}
                onChange={setPrevious}
                lang={lang}
                locked={Object.keys(state.done).map(Number)}
                disabled={busy}
              />
            )}
            <div className="wizard-actions">
              <button
                className="secondary"
                disabled={busy}
                onClick={() => setMode(null)}
              >
                {t.cancel}
              </button>
              <button
                className="primary"
                disabled={busy}
                onClick={async () => {
                  if (
                    await mutate({
                      action: "previous",
                      previouslyRead: previous,
                    })
                  )
                    setMode(null);
                }}
              >
                {busy ? t.saving : t.save}
              </button>
            </div>
          </>
        </DialogContent>
      </Dialog>
    </section>
  );
}
