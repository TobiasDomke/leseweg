import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { addDays, duration, today } from "@/lib/planner";
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
}: {
  state: ReadingState;
  lang: Lang;
  busy: boolean;
  mutate: (op: Record<string, unknown>) => Promise<ReadingState | null>;
}) {
  const fixed = isBible52(state.config),
    f = bible52Text(lang);
  const p = planText(lang),
    t = text(lang);
  const [mode, setMode] = useState<"previous" | "deadline" | null>(null),
    [previous, setPrevious] = useState<number[]>([]),
    [end, setEnd] = useState("");
  const currentEnd = addDays(state.config.start, duration(state.config) - 1);
  const minimumEnd = [currentEnd, today(state.config.timezone)].sort().at(-1)!;
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
            disabled={busy || !!state.timer}
            onClick={() => {
              setEnd(addDays(minimumEnd, 30));
              setMode("deadline");
            }}
          >
            {p.extend}
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
          <DialogTitle>
            {mode === "previous" ? p.editPrevious : p.extend}
          </DialogTitle>
          <DialogDescription>
            {mode === "previous"
              ? fixed
                ? f.progressHelp
                : p.previousEditHelp
              : p.extendHelp}
          </DialogDescription>
          {mode === "previous" ? (
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
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (await mutate({ action: "deadline", end })) setMode(null);
              }}
            >
              <label htmlFor="plan-end">{p.endDate}</label>
              <input
                id="plan-end"
                type="date"
                required
                min={minimumEnd}
                max={addDays(state.config.start, 3649)}
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                disabled={busy}
              />
              <div className="wizard-actions">
                <button
                  type="button"
                  className="secondary"
                  disabled={busy}
                  onClick={() => setMode(null)}
                >
                  {t.cancel}
                </button>
                <button className="primary" disabled={busy}>
                  {busy ? t.saving : t.save}
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
