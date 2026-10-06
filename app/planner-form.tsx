"use client";
import { languageEdition, editionName } from "@/lib/editions";
import { experienceText } from "@/lib/experience-i18n";
import { useMemo, useRef, useState } from "react";
import { BookOpen, CalendarDays, Sparkles, CircleCheck } from "lucide-react";
import {
  isBible52,
  bible52Config,
  createPlan,
  scopeChapters,
  today,
  dateAt,
  passage,
  type Config,
  type Unit,
} from "@/lib/planner";
import { readingPace, estimatedMinutes } from "@/lib/pace";
import { text, bookNames, locales, type Lang } from "@/lib/i18n";
import { planText, fill } from "@/lib/plan-i18n";
import Bible52Weeks from "./bible52-weeks";
import { bible52Text, bible52Position } from "@/lib/bible52-i18n";
import PreviousPicker from "./previous-picker";
import BookOrderControl from "./book-order-control";
import { languageBookOrder } from "@/lib/book-order";

export default function PlannerForm({
  lang,
  onSave,
  busy = false,
}: {
  lang: Lang;
  onSave: (c: Config, previouslyRead: number[]) => void;
  busy?: boolean;
}) {
  const t = text(lang),
    p = planText(lang),
    f = bible52Text(lang);
  const [step, setStep] = useState(0),
    [previouslyRead, setPrevious] = useState<number[]>([]);
  const heading = useRef<HTMLHeadingElement>(null);
  const [draftConfig, setConfig] = useState<Config>({
    edition: languageEdition(lang),
    amount: 12,
    unit: "months",
    start: today(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"),
    time: "07:30",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    scope: "bible",
    order: "canonical",
    keepTogether: true,
    bookOrderMode: "auto",
  });
  const config = useMemo(
    () =>
      isBible52(draftConfig)
        ? bible52Config(draftConfig)
        : {
            ...draftConfig,
            bookOrder:
              draftConfig.bookOrderMode === "auto"
                ? languageBookOrder(lang)
                : draftConfig.bookOrder,
          },
    [draftConfig, lang],
  );
  const fixed = isBible52(config),
    names = bookNames(fixed ? "de" : lang);
  const items = scopeChapters(config);
  const computed = useMemo(() => {
    try {
      return { days: createPlan(config, previouslyRead), error: "" };
    } catch {
      return { days: [], error: t.invalid };
    }
  }, [config, previouslyRead, t.invalid]);
  const remainingWords = computed.days.reduce((sum, day) => sum + day.words, 0);
  const estimate = (words: number) =>
    estimatedMinutes(words, readingPace(null));
  const fmt = (s: string, long = false) =>
    dateAt(s).toLocaleDateString(locales[lang], {
      timeZone: "UTC",
      day: "numeric",
      month: long ? "long" : "short",
      ...(long ? { year: "numeric" } : {}),
    });
  const move = (next: number) => {
    setStep(next);
    heading.current?.focus();
  };
  const scope = (scope: Config["scope"]) => {
    const next = { ...config, scope },
      allowed = new Set(scopeChapters(next).map((c) => c.id));
    setConfig(next);
    setPrevious(previouslyRead.filter((id) => allowed.has(id)));
  };
  return (
    <div className="setup-grid">
      <section className="panel setup-panel">
        <span className="section-icon">
          <CalendarDays size={23} />
        </span>
        <h2 ref={heading} tabIndex={-1}>
          {p.setup}
        </h2>
        <p className="muted">{p.setupHelp}</p>
        <ol className="setup-steps" aria-label={p.setup}>
          {[p.stepPlan, p.stepProgress, p.stepTime].map((label, i) => (
            <li key={label}>
              <button
                type="button"
                aria-current={step === i ? "step" : undefined}
                onClick={() => move(i)}
                disabled={busy}
              >
                <span>{i + 1}</span>
                {label}
              </button>
            </li>
          ))}
        </ol>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (step < 2) move(step + 1);
            else {
              // Native date controls can commit on blur; submit their visible value.
              const start = new FormData(e.currentTarget).get("start");
              const submitted = {
                ...config,
                start: typeof start === "string" ? start : config.start,
              };
              try {
                createPlan(submitted, previouslyRead);
                onSave(submitted, previouslyRead);
              } catch {
                setConfig(submitted);
              }
            }
          }}
        >
          <fieldset disabled={busy}>
            {step === 0 && (
              <>
                <fieldset className="choice-field">
                  <legend>{f.type}</legend>
                  {[false, true].map((value) => (
                    <label className="plan-choice" key={String(value)}>
                      <input
                        type="radio"
                        name="template"
                        checked={fixed === value}
                        onChange={() => {
                          setPrevious([]);
                          setConfig(
                            value
                              ? bible52Config(config)
                              : {
                                  ...config,
                                  template: undefined,
                                  edition: languageEdition(lang),
                                  amount: 12,
                                  unit: "months",
                                  scope: "bible",
                                  order: "canonical",
                                  keepTogether: true,
                                  bookOrderMode: "auto",
                                },
                          );
                        }}
                      />
                      <span>
                        <strong>
                          {value ? "Bibelleseplan 52" : f.flexible}
                        </strong>
                        <small>{value ? f.description : f.flexibleHelp}</small>
                      </span>
                    </label>
                  ))}
                </fieldset>
                {fixed ? (
                  <p className="notice bible52-note">{f.fixed}</p>
                ) : (
                  <>
                    <fieldset className="choice-field">
                      <legend>{p.scope}</legend>
                      {(["bible", "ot", "nt"] as const).map((value) => (
                        <label className="plan-choice" key={value}>
                          <input
                            type="radio"
                            name="scope"
                            value={value}
                            checked={config.scope === value}
                            onChange={() => scope(value)}
                          />
                          <span>
                            <strong>{p[value]}</strong>
                            <small>
                              {fill(p.booksChapters, {
                                books:
                                  value === "bible"
                                    ? 66
                                    : value === "ot"
                                      ? 39
                                      : 27,
                                chapters:
                                  value === "bible"
                                    ? 1189
                                    : value === "ot"
                                      ? 929
                                      : 260,
                              })}
                            </small>
                          </span>
                        </label>
                      ))}
                    </fieldset>
                    <p className="notice">
                      <strong>
                        {experienceText(lang).edition}: {editionName(config)}
                      </strong>
                    </p>
                    <details className="method">
                      <summary>{experienceText(lang).advanced}</summary>
                      <BookOrderControl
                        config={config}
                        lang={lang}
                        disabled={busy}
                        onChange={(choice) =>
                          setConfig({
                            ...config,
                            bookOrderMode:
                              choice === "auto" ? "auto" : "manual",
                            bookOrder:
                              choice === "auto"
                                ? languageBookOrder(lang)
                                : choice,
                          })
                        }
                      />
                    </details>
                    <fieldset className="choice-field">
                      <legend>{p.order}</legend>
                      {(["canonical", "chronological", "mixed"] as const).map(
                        (value) => (
                          <label className="plan-choice" key={value}>
                            <input
                              type="radio"
                              name="order"
                              value={value}
                              checked={config.order === value}
                              onChange={() =>
                                setConfig({ ...config, order: value })
                              }
                            />
                            <span>
                              <strong>{p[value]}</strong>
                              <small>{p[`${value}Help`]}</small>
                            </span>
                          </label>
                        ),
                      )}
                    </fieldset>
                    <label className="together-choice">
                      <input
                        type="checkbox"
                        checked={!!config.keepTogether}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            keepTogether: e.target.checked,
                          })
                        }
                      />
                      <span>
                        {p.together}
                        <small>{p.togetherHelp}</small>
                      </span>
                    </label>
                  </>
                )}
              </>
            )}
            {step === 1 && (
              <>
                <h3>{p.previous}</h3>
                <p className="muted">
                  {fixed ? f.progressHelp : p.previousHelp}
                </p>
                {fixed ? (
                  <Bible52Weeks
                    value={previouslyRead}
                    onChange={setPrevious}
                    lang={lang}
                    disabled={busy}
                  />
                ) : (
                  <PreviousPicker
                    config={config}
                    value={previouslyRead}
                    onChange={setPrevious}
                    lang={lang}
                    disabled={busy}
                  />
                )}
              </>
            )}
            {step === 2 && (
              <>
                {!fixed && (
                  <>
                    <label htmlFor="amount">{p.period}</label>
                    <div className="duration-row">
                      <input
                        id="amount"
                        type="number"
                        min="1"
                        max="3650"
                        required
                        value={config.amount || ""}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            amount: Number(e.target.value),
                          })
                        }
                      />
                      <select
                        aria-label={p.period}
                        value={config.unit}
                        onChange={(e) =>
                          setConfig({ ...config, unit: e.target.value as Unit })
                        }
                      >
                        <option value="days">{t.days}</option>
                        <option value="weeks">{t.weeks}</option>
                        <option value="months">{t.months}</option>
                      </select>
                    </div>
                  </>
                )}
                <label htmlFor="start">{fixed ? f.start : t.startDate}</label>
                <input
                  id="start"
                  name="start"
                  type="date"
                  min="2020-01-01"
                  max="2100-12-31"
                  required
                  value={config.start}
                  onInput={(e) =>
                    setConfig({ ...config, start: e.currentTarget.value })
                  }
                  onChange={(e) =>
                    setConfig({ ...config, start: e.target.value })
                  }
                />
                {fixed ? (
                  <p className="notice">{f.startHelp}</p>
                ) : (
                  <div className="form-info">
                    <Sparkles size={18} />
                    <p>
                      <strong>{t.balanced}</strong>
                      <br />
                      {t.balancedSub}
                    </p>
                  </div>
                )}
                {computed.error && (
                  <p role="alert" className="error">
                    {computed.error}
                  </p>
                )}
                {computed.days.length > 0 &&
                  estimate(
                    remainingWords /
                      (fixed
                        ? computed.days.filter((d) => d.chapters.length)
                            .length || 1
                        : computed.days.length),
                  ) > 90 && <p className="warning">{t.longDay}</p>}
                {items.length === previouslyRead.length && (
                  <p className="notice">{p.allDone}</p>
                )}
              </>
            )}
            <div className="wizard-actions">
              {step > 0 && (
                <button
                  type="button"
                  className="secondary"
                  onClick={() => move(step - 1)}
                >
                  {p.back}
                </button>
              )}
              <button
                className="primary"
                disabled={busy || (step === 2 && !!computed.error)}
              >
                {busy ? t.saving : step === 2 ? t.create : p.next}
              </button>
            </div>
          </fieldset>
        </form>
      </section>
      <aside className="preview-panel">
        <span className="eyebrow">{t.overview}</span>
        <div className="time-estimate">
          <strong>
            {computed.days.length
              ? estimate(
                  remainingWords /
                    (fixed
                      ? computed.days.filter((d) => d.chapters.length).length ||
                        1
                      : computed.days.length),
                )
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
            <span>
              {fixed
                ? "Bibelleseplan 52"
                : `${p[config.scope ?? "bible"]} · ${p[config.order ?? "canonical"]}`}
            </span>
          </div>
          <div>
            <CircleCheck size={18} />
            <span>
              {fill(p.coverage, {
                total: items.length,
                previous: previouslyRead.length,
                completed: 0,
                remaining: items.length - previouslyRead.length,
              })}
            </span>
          </div>
          <div>
            <CalendarDays size={18} />
            <span>
              {computed.days.length} {t.dayCount} · {t.target}:{" "}
              {computed.days.length
                ? fmt(computed.days.at(-1)!.date, true)
                : "–"}
            </span>
          </div>
        </div>
        <div className="preview-days">
          <h3>{t.beginning}</h3>
          {computed.days
            .filter((d) => !fixed || d.chapters.length)
            .slice(0, 3)
            .map((d) => (
              <div className="preview-day" key={d.index}>
                <span>
                  {fixed
                    ? (d.index % 7) + 1
                    : String(d.index + 1).padStart(2, "0")}
                </span>
                <div>
                  <strong>{passage(d.chapters, names) || t.rest}</strong>
                  <small>
                    {fixed ? bible52Position(d.index, lang) : fmt(d.date)} ·{" "}
                    {d.words
                      ? `${t.approx} ${estimate(d.words)} ${t.min}`
                      : t.rest}
                  </small>
                </div>
              </div>
            ))}
        </div>
        <details className="method">
          <summary>{experienceText(lang).advanced}</summary>
          <p className="fineprint">{experienceText(lang).approxWeights}</p>
          <p>{fixed ? f.fixed : experienceText(lang).editionHelp}</p>
        </details>
      </aside>
    </div>
  );
}
