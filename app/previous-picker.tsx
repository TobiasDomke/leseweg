import { useId, useMemo, useState } from "react";
import bibleBooks from "@/lib/bible-lengths.json";
import { Checkbox } from "@/components/ui/checkbox";
import { scopeChapters, type Config, type Chapter } from "@/lib/planner";
import { bookNames, type Lang } from "@/lib/i18n";
import { planText, fill } from "@/lib/plan-i18n";

export default function PreviousPicker({
  config,
  value,
  onChange,
  lang,
  locked = [],
  disabled = false,
}: {
  config: Config;
  value: number[];
  onChange: (ids: number[]) => void;
  lang: Lang;
  locked?: number[];
  disabled?: boolean;
}) {
  const p = planText(lang),
    names = bookNames(lang) ?? bibleBooks.map((b) => b.name),
    id = useId();
  const [search, setSearch] = useState("");
  const selected = new Set(value),
    fixed = new Set(locked);
  const books = useMemo(() => {
    const groups = new Map<number, Chapter[]>();
    for (const c of scopeChapters(config))
      groups.set(c.bookIndex, [...(groups.get(c.bookIndex) ?? []), c]);
    return [...groups.entries()];
  }, [config.scope, config.bookOrder, config.edition]);
  const change = (ids: number[], checked: boolean) => {
    const next = new Set(value);
    for (const chapter of ids)
      if (!fixed.has(chapter))
        checked ? next.add(chapter) : next.delete(chapter);
    onChange([...next].sort((a, b) => a - b));
  };
  const visible = books.filter(([index]) =>
    names[index]
      .toLocaleLowerCase()
      .includes(search.trim().toLocaleLowerCase()),
  );
  return (
    <div className="previous-picker">
      <p className="selection-summary" aria-live="polite">
        {fill(p.selected, { count: value.length })}
      </p>
      <label htmlFor={id}>{p.search}</label>
      <input
        id={id}
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={p.search}
        disabled={disabled}
      />
      <div className="picker-tools">
        <button
          type="button"
          className="text-button"
          disabled={disabled}
          onClick={() =>
            change(
              books.flatMap(([, cs]) => cs.map((c) => c.id)),
              true,
            )
          }
        >
          {p.all}
        </button>
        <button
          type="button"
          className="text-button"
          disabled={disabled || !value.length}
          onClick={() => onChange([])}
        >
          {p.none}
        </button>
      </div>
      <div className="book-picker-list">
        {visible.map(([index, cs]) => {
          const count = cs.filter(
            (c) => selected.has(c.id) || fixed.has(c.id),
          ).length;
          return (
            <div className="book-picker-row" key={index}>
              <Checkbox
                aria-label={`${p.wholeBook}: ${names[index]}`}
                checked={
                  count === cs.length
                    ? true
                    : count > 0
                      ? "indeterminate"
                      : false
                }
                disabled={disabled || cs.every((c) => fixed.has(c.id))}
                onCheckedChange={() =>
                  change(
                    cs.map((c) => c.id),
                    count !== cs.length,
                  )
                }
              />
              <details>
                <summary>
                  <span>{names[index]}</span>
                  <small>
                    {count} / {cs.length}
                  </small>
                </summary>
                <BookChapters
                  chapters={cs}
                  name={names[index]}
                  selected={selected}
                  fixed={fixed}
                  lang={lang}
                  change={change}
                  disabled={disabled}
                />
              </details>
            </div>
          );
        })}
        {!visible.length && <p className="muted">{p.noBooks}</p>}
      </div>
    </div>
  );
}
function BookChapters({
  chapters,
  name,
  selected,
  fixed,
  lang,
  change,
  disabled,
}: {
  chapters: Chapter[];
  name: string;
  selected: Set<number>;
  fixed: Set<number>;
  lang: Lang;
  change: (ids: number[], checked: boolean) => void;
  disabled: boolean;
}) {
  const p = planText(lang),
    id = useId();
  const [first, setFirst] = useState("1"),
    [last, setLast] = useState(String(chapters.length)),
    [error, setError] = useState(false);
  const range = (checked: boolean) => {
    const a = Number(first),
      b = Number(last);
    if (
      !Number.isInteger(a) ||
      !Number.isInteger(b) ||
      a < 1 ||
      b < a ||
      b > chapters.length
    ) {
      setError(true);
      return;
    }
    setError(false);
    change(
      chapters.filter((c) => c.number >= a && c.number <= b).map((c) => c.id),
      checked,
    );
  };
  return (
    <div className="book-chapters">
      <div className="chapter-range">
        <label htmlFor={`${id}-from`}>
          {p.from}
          <input
            id={`${id}-from`}
            type="number"
            min={1}
            max={chapters.length}
            value={first}
            disabled={disabled}
            onChange={(e) => setFirst(e.target.value)}
          />
        </label>
        <label htmlFor={`${id}-to`}>
          {p.to}
          <input
            id={`${id}-to`}
            type="number"
            min={1}
            max={chapters.length}
            value={last}
            disabled={disabled}
            onChange={(e) => setLast(e.target.value)}
          />
        </label>
      </div>
      <div className="picker-tools">
        <button
          type="button"
          className="secondary"
          disabled={disabled}
          onClick={() => range(true)}
        >
          {p.mark}
        </button>
        <button
          type="button"
          className="text-button"
          disabled={disabled}
          onClick={() => range(false)}
        >
          {p.unmark}
        </button>
      </div>
      {error && (
        <p className="error" role="alert">
          {p.rangeInvalid}
        </p>
      )}
      <div className="chapter-grid">
        {chapters.map((c) => (
          <label
            className={fixed.has(c.id) ? "chapter-cell locked" : "chapter-cell"}
            key={c.id}
            title={fixed.has(c.id) ? p.duringPlan : `${name} ${c.number}`}
          >
            <Checkbox
              aria-label={`${name} ${c.number}${fixed.has(c.id) ? ` · ${p.duringPlan}` : ""}`}
              checked={selected.has(c.id) || fixed.has(c.id)}
              disabled={disabled || fixed.has(c.id)}
              onCheckedChange={(checked) => change([c.id], checked === true)}
            />
            <span>{c.number}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
