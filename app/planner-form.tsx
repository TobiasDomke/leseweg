"use client";
import { useMemo, useState } from "react";
import { BookOpen, CalendarDays, Sparkles, CircleCheck } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  createPlan,
  totalWords,
  minutes,
  today,
  dateAt,
  passage,
  type Config,
  type Unit,
} from "@/lib/planner";
import { text, bookNames, locales, type Lang } from "@/lib/i18n";
export default function PlannerForm({
  lang,
  onSave,
  busy = false,
}: {
  lang: Lang;
  onSave: (c: Config) => void;
  busy?: boolean;
}) {
  const t = text(lang),
    names = bookNames(lang);
  const [config, setConfig] = useState<Config>({
    amount: 12,
    unit: "months",
    start: today(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"),
    time: "07:30",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  });
  const computed = useMemo(() => {
    try {
      return { days: createPlan(config), error: "" };
    } catch {
      return { days: [], error: t.invalid };
    }
  }, [config, t.invalid]);
  const fmt = (s: string, long = false) =>
    dateAt(s).toLocaleDateString(locales[lang], {
      timeZone: "UTC",
      day: "numeric",
      month: long ? "long" : "short",
      ...(long ? { year: "numeric" } : {}),
    });
  return (
    <div className="setup-grid">
      <section className="panel setup-panel">
        <span className="section-icon">
          <CalendarDays size={23} />
        </span>
        <h2>{t.question}</h2>
        <p className="muted">{t.questionSub}</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!computed.error) onSave(config);
          }}
        >
          <label htmlFor="amount">{t.wholeBible}</label>
          <div className="duration-row">
            <input
              id="amount"
              type="number"
              min="1"
              max="3650"
              required
              value={config.amount || ""}
              onChange={(e) =>
                setConfig({ ...config, amount: Number(e.target.value) })
              }
            />
            <Select
              value={config.unit}
              onValueChange={(v) => setConfig({ ...config, unit: v as Unit })}
            >
              <SelectTrigger aria-label={t.wholeBible} className="unit-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="days">{t.days}</SelectItem>
                <SelectItem value="weeks">{t.weeks}</SelectItem>
                <SelectItem value="months">{t.months}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <label htmlFor="start">{t.startDate}</label>
          <input
            id="start"
            type="date"
            min="2020-01-01"
            max="2100-12-31"
            required
            value={config.start}
            onChange={(e) => setConfig({ ...config, start: e.target.value })}
          />
          <div className="form-info">
            <Sparkles size={18} />
            <p>
              <strong>{t.balanced}</strong>
              <br />
              {t.balancedSub}
            </p>
          </div>
          {computed.error && (
            <p role="alert" className="error">
              {computed.error}
            </p>
          )}
          {computed.days.length > 0 &&
            minutes(totalWords / computed.days.length) > 90 && (
              <p className="warning">{t.longDay}</p>
            )}
          <button className="primary" disabled={busy || !!computed.error}>
            {busy ? t.saving : t.create}
          </button>
        </form>
      </section>
      <aside className="preview-panel">
        <span className="eyebrow">{t.overview}</span>
        <div className="time-estimate">
          <strong>
            {computed.days.length
              ? minutes(totalWords / computed.days.length)
              : "–"}
          </strong>
          <span>
            {t.minsDaily}
            <br />
            <small>{t.estimate}</small>
          </span>
        </div>
        <div className="preview-stats">
          <div>
            <BookOpen size={18} />
            <span>{t.booksChapters}</span>
          </div>
          <div>
            <CalendarDays size={18} />
            <span>
              {computed.days.length} {t.dayCount}
            </span>
          </div>
          <div>
            <CircleCheck size={18} />
            <span>
              {t.target}:{" "}
              {computed.days.length
                ? fmt(computed.days.at(-1)!.date, true)
                : "–"}
            </span>
          </div>
        </div>
        <div className="preview-days">
          <h3>{t.beginning}</h3>
          {computed.days.slice(0, 3).map((d) => (
            <div className="preview-day" key={d.index}>
              <span>{String(d.index + 1).padStart(2, "0")}</span>
              <div>
                <strong>{passage(d.chapters, names) || t.rest}</strong>
                <small>
                  {fmt(d.date)} ·{" "}
                  {d.words
                    ? `${t.approx} ${minutes(d.words)} ${t.min}`
                    : t.rest}
                </small>
              </div>
            </div>
          ))}
        </div>
        <p className="fineprint">{t.method}</p>
      </aside>
    </div>
  );
}
