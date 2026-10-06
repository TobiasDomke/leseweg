import { useEffect, useRef, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, ChevronRight } from "lucide-react";
import { bible52Weeks } from "@/lib/planner";
import { bible52Text } from "@/lib/bible52-i18n";
import { planText, fill } from "@/lib/plan-i18n";
import type { Lang } from "@/lib/i18n";

// The same week/passages hierarchy is used for onboarding, later corrections and reading.
export default function Bible52Weeks({
  value,
  onChange,
  locked = [],
  lang,
  disabled = false,
  onChoose,
  current = 0,
}: {
  value: number[];
  onChange?: (ids: number[]) => void;
  locked?: number[];
  lang: Lang;
  disabled?: boolean;
  onChoose?: (unit: number) => void;
  current?: number;
}) {
  const t = bible52Text(lang),
    p = planText(lang);
  const [expanded, setExpanded] = useState<number | null>(
    onChoose ? Math.floor(current / 7) : null,
  );
  const expandedRow = useRef<HTMLDivElement>(null),
    weekList = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const row = expandedRow.current,
      list = weekList.current;
    if (row && list)
      list.scrollTop +=
        row.getBoundingClientRect().top - list.getBoundingClientRect().top;
  }, [expanded]);
  const selected = new Set(value),
    fixed = new Set(locked);
  const read = (id: number) => selected.has(id) || fixed.has(id);
  const change = (ids: number[], checked: boolean) => {
    const next = new Set(value);
    ids
      .filter((id) => !fixed.has(id))
      .forEach((id) => (checked ? next.add(id) : next.delete(id)));
    onChange?.([...next].sort((a, b) => a - b));
  };
  return (
    <div className="bible52-weeks">
      {onChange ? (
        <>
          <p className="selection-summary" aria-live="polite">
            {fill(p.selected, { count: value.length })}
          </p>
          <div className="picker-tools">
            <button
              type="button"
              className="text-button"
              disabled={disabled}
              onClick={() =>
                change(
                  bible52Weeks
                    .flat(2)
                    .flatMap((u) => u.chapters.map((c) => c.id)),
                  true,
                )
              }
            >
              {t.all}
            </button>
            <button
              type="button"
              className="text-button"
              disabled={disabled || !value.length}
              onClick={() => onChange([])}
            >
              {t.none}
            </button>
          </div>
        </>
      ) : (
        <p className="muted">{t.selectHelp}</p>
      )}
      <div className="bible52-week-list" ref={weekList}>
        {bible52Weeks.map((units, week) => {
          const ids = units.flatMap((u) => u.chapters.map((c) => c.id)),
            count = ids.filter(read).length;
          const complete = units.filter((u) =>
            u.chapters.every((c) => read(c.id)),
          ).length;
          return (
            <div
              className="bible52-week"
              key={week}
              ref={expanded === week ? expandedRow : undefined}
            >
              <div className="bible52-week-heading">
                {onChange && (
                  <Checkbox
                    aria-label={`${t.wholeWeek}: ${t.week} ${week + 1}`}
                    disabled={disabled || ids.every((id) => fixed.has(id))}
                    checked={
                      count === ids.length
                        ? true
                        : count
                          ? "indeterminate"
                          : false
                    }
                    onCheckedChange={() => change(ids, count !== ids.length)}
                  />
                )}
                <button
                  type="button"
                  className="bible52-expand"
                  aria-expanded={expanded === week}
                  onClick={() => setExpanded(expanded === week ? null : week)}
                >
                  <strong>
                    {t.week} {week + 1}
                  </strong>
                  <span>
                    {complete}/7 {t.complete}
                  </span>
                  <ChevronRight size={18} />
                </button>
              </div>
              {expanded === week && (
                <div className="bible52-passages">
                  {units.map((u) => {
                    const n = u.chapters.filter((c) => read(c.id)).length,
                      checked = n === u.chapters.length;
                    const content = (
                      <span>
                        <strong>{u.label}</strong>
                        <small>
                          {n
                            ? checked
                              ? t.complete
                              : `${t.partial} · ${n}/${u.chapters.length}`
                            : t.remaining}
                        </small>
                      </span>
                    );
                    return onChange ? (
                      <label
                        className={`bible52-passage ${checked ? "is-done" : ""}`}
                        key={u.index}
                      >
                        <Checkbox
                          checked={checked ? true : n ? "indeterminate" : false}
                          aria-label={`${t.week} ${week + 1}: ${u.label}`}
                          disabled={
                            disabled || u.chapters.every((c) => fixed.has(c.id))
                          }
                          onCheckedChange={() =>
                            change(
                              u.chapters.map((c) => c.id),
                              !checked,
                            )
                          }
                        />
                        {content}
                      </label>
                    ) : (
                      <button
                        className={`bible52-passage ${checked ? "is-done" : ""}`}
                        key={u.index}
                        type="button"
                        aria-current={u.index === current ? "step" : undefined}
                        onClick={() => onChoose?.(u.index)}
                      >
                        <span className="bible52-unit-number">
                          {checked ? <Check size={17} /> : u.slot}
                        </span>
                        {content}
                        <ChevronRight size={16} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
