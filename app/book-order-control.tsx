import { useId } from "react";
import books from "@/lib/bible-lengths.json";
import { scopeChapters, type Config } from "@/lib/planner";
import {
  bookOrderChoice,
  type BookOrderChoice,
  type BookOrder,
} from "@/lib/book-order";
import { bookOrderText } from "@/lib/book-order-i18n";
import { bookNames, type Lang } from "@/lib/i18n";

export default function BookOrderControl({
  config,
  lang,
  onChange,
  disabled,
  pending,
}: {
  config: Config;
  lang: Lang;
  onChange: (value: BookOrderChoice) => void;
  disabled?: boolean;
  pending?: BookOrder;
}) {
  const id = useId(),
    t = bookOrderText(lang),
    names = bookNames(lang);
  const selected = pending ?? config.bookOrder ?? "western";
  const indices = [
    ...new Set(
      scopeChapters({ ...config, bookOrder: selected }).map((c) => c.bookIndex),
    ),
  ];
  return (
    <div className="book-order-control">
      <label htmlFor={id}>{t.title}</label>
      <select
        id={id}
        value={bookOrderChoice({ ...config, bookOrder: selected })}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value as BookOrderChoice)}
      >
        <option value="auto">{t.auto}</option>
        <option value="western">{t.western}</option>
        <option value="eastern">{t.eastern}</option>
      </select>
      <p className="fineprint">{t.help}</p>
      <p className="fineprint">
        <strong>{t.applied}</strong> {t[selected]}
      </p>
      {pending && (
        <p className="notice" role="status">
          {t.pending}
        </p>
      )}
      <details className="method">
        <summary>{t.preview}</summary>
        <p>
          {indices
            .map((index) => names?.[index] ?? books[index].name)
            .join(" → ")}
        </p>
        <p>{t.planning}</p>
      </details>
      <p className="fineprint">{t.numbering}</p>
    </div>
  );
}
