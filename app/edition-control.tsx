import { useState } from "react";
import {
  editionIds,
  editions,
  editionName,
  type Edition,
} from "@/lib/editions";
import { experienceText } from "@/lib/experience-i18n";
import { text, type Lang } from "@/lib/i18n";
import type { ReadingState } from "@/lib/state";
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
export default function EditionControl({
  state,
  lang,
  busy,
  onChange,
  onReviewed,
}: {
  state: ReadingState;
  lang: Lang;
  busy: boolean;
  onChange: (edition: Edition) => Promise<unknown>;
  onReviewed: () => void;
}) {
  const e = experienceText(lang),
    t = text(lang),
    [selected, setSelected] = useState<Edition | null>(null);
  return (
    <section className="panel settings-card">
      <h2>{e.edition}</h2>
      <p>
        <strong>{editionName(state.config)}</strong>
      </p>
      <p className="muted">{e.editionHelp}</p>
      <label htmlFor="edition-switch">{e.switchEdition}</label>
      <select
        id="edition-switch"
        disabled={busy || !!state.timer}
        value={state.config.edition ?? "schlachter2000"}
        onChange={(ev) => setSelected(ev.target.value as Edition)}
      >
        {editionIds.map((id) => (
          <option value={id} key={id}>
            {editions[id].name}
          </option>
        ))}
      </select>
      {!!state.editionReview?.length && (
        <div className="warning">
          <p>{e.reviewEdition}</p>
          <p>{state.editionReview.join(" · ")}</p>
          <button className="secondary" disabled={busy} onClick={onReviewed}>
            {e.reviewed}
          </button>
        </div>
      )}
      <AlertDialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open && !busy) setSelected(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{e.switchEdition}</AlertDialogTitle>
            <AlertDialogDescription>{e.switchHelp}</AlertDialogDescription>
          </AlertDialogHeader>
          <p>
            {editionName(state.config)} → {selected && editions[selected].name}
          </p>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={async (ev) => {
                ev.preventDefault();
                if (selected && (await onChange(selected))) setSelected(null);
              }}
            >
              {t.save}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
