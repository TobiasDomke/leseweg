"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Leaf,
  Clock3,
  CalendarDays,
  Check,
  CircleCheck,
  Play,
  Pause,
  Square,
  BarChart3,
  Settings,
  Sun,
  Bell,
  Download,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  X,
  Pencil,
  Plus,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { text, bookNames, locales, type Lang } from "@/lib/i18n";
import {
  createPlan,
  chapters,
  totalWords,
  today,
  dateAt,
  addDays,
  passage,
  clockText,
  type Config,
} from "@/lib/planner";
import { daySeconds, type ReadingState } from "@/lib/state";
import { readingPace, estimatedMinutes } from "@/lib/pace";
import { applyAction } from "@/lib/actions";
import { calendarFile, csvFile, downloadFile } from "@/lib/exports";
import PlannerForm from "./planner-form";
import { readState, changeState } from "@/lib/local-storage";
import { useOffline } from "@/lib/offline";
import BackupControls from "./backup-controls";
import InstallControls from "./install-controls";
import PushControls from "./push-controls";
import {
  prepareState,
  readingPlan,
  dayIndex,
  sessionChapters,
  nextExtraChapter,
  readChaptersOnDay,
} from "@/lib/adaptive";
type Status = "loading" | "ready" | "error";
export default function Leseweg() {
  const [lang, setLang] = useState<Lang>("de"),
    [theme, setTheme] = useState("light"),
    [state, setState] = useState<ReadingState | null>(null),
    [status, setStatus] = useState<Status>("loading"),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [tab, setTab] = useState("today"),
    [selected, setSelected] = useState<number | null>(null),
    [page, setPage] = useState(0),
    [now, setNow] = useState(Date.now()),
    [offline, setOffline] = useState(false),
    [reset, setReset] = useState(false),
    [newPlan, setNewPlan] = useState(false),
    [editing, setEditing] = useState(false),
    [finishing, setFinishing] = useState(false),
    [correctMinutes, setCorrectMinutes] = useState("0"),
    [reminderTime, setReminderTime] = useState("07:30"),
    [zone, setZone] = useState("Europe/Berlin");
  const offlineSupport = useOffline();
  const t = text(lang),
    names = bookNames(lang),
    pending = useRef(false),
    stateRef = useRef(state);
  stateRef.current = state;
  const load = useCallback(async (silent = false) => {
    try {
      if (!silent) setStatus("loading");
      const data = { state: await readState() };
      stateRef.current = data.state;
      setState(data.state);
      setStatus("ready");
      if (data.state && !silent) {
        setReminderTime(data.state.config.time);
        setZone(data.state.config.timezone);
        try {
          if (!localStorage.getItem("leseweg-lang")) setLang(data.state.lang);
        } catch {}
      }
    } catch {
      if (!silent) setStatus("error");
    }
  }, []);
  useEffect(() => {
    try {
      const l = localStorage.getItem("leseweg-lang");
      if (l === "de" || l === "ru" || l === "en") setLang(l);
      else {
        const browserLang = navigator.language.slice(0, 2);
        setLang(
          browserLang === "ru" ? "ru" : browserLang === "de" ? "de" : "en",
        );
      }
      const th = localStorage.getItem("leseweg-theme");
      if (th === "light" || th === "dark") setTheme(th);
    } catch {}
    const day = new URLSearchParams(location.search).get("day");
    if (day && /^\d+$/.test(day)) setSelected(Number(day));
    void load();
    const online = () => setOffline(!navigator.onLine);
    online();
    window.addEventListener("online", online);
    window.addEventListener("offline", online);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", online);
    };
  }, [load]);
  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem("leseweg-lang", lang);
    } catch {}
  }, [lang]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("leseweg-theme", theme);
    } catch {}
  }, [theme]);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const id = setInterval(tick, 1000);
    const refresh = () => {
      tick();
      if (document.visibilityState === "visible" && !pending.current)
        void load(true);
    };
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [load]);
  useEffect(() => {
    if (!("BroadcastChannel" in window)) return;
    const channel = new BroadcastChannel("leseweg-updates");
    channel.onmessage = () => {
      if (!pending.current) void load(true);
    };
    return () => channel.close();
  }, [load]);
  const restored = (value: ReadingState, newTheme: string) => {
    stateRef.current = value;
    setState(value);
    setLang(value.lang);
    setTheme(newTheme);
    setReminderTime(value.config.time);
    setZone(value.config.timezone);
    setSelected(null);
    setPage(0);
    setTab("today");
    setNewPlan(false);
    setError("");
    setMessage("");
  };
  const mutate = useCallback(
    async (op: Record<string, unknown>) => {
      if (pending.current) return null;
      pending.current = true;
      setBusy(true);
      setError("");
      setMessage("");
      try {
        const updated = await changeState({
          ...op,
          planId: stateRef.current?.id ?? null,
          opId: crypto.randomUUID(),
        });
        stateRef.current = updated;
        setState(updated);
        setNow(Date.now());
        if ("BroadcastChannel" in window) {
          const channel = new BroadcastChannel("leseweg-updates");
          channel.postMessage("changed");
          channel.close();
        }
        if (op.action === "create")
          navigator.storage?.persist?.().catch(() => {});
        return updated;
      } catch (e) {
        setError(
          (e as Error).message === "timer"
            ? "timer"
            : ["day", "finished", "stale"].includes((e as Error).message)
              ? "changed"
              : "save",
        );
        void load(true);
        return null;
      } finally {
        pending.current = false;
        setBusy(false);
      }
    },
    [load],
  );
  const currentDate = today(state?.config.timezone || "Europe/Berlin");
  const planState = useMemo(
    () => (state ? prepareState(state, currentDate) : null),
    [state, currentDate],
  );
  const days = useMemo(
    () => (planState ? readingPlan(planState, currentDate) : []),
    [planState, currentDate],
  );
  const pace = useMemo(() => readingPace(state), [state]);
  const estimate = (words: number) => estimatedMinutes(words, pace);
  const dateIndex = state ? dayIndex(state.config, currentDate) : 0;
  const day =
      days[
        Math.max(
          0,
          Math.min(days.length - 1, selected ?? state?.timer?.day ?? dateIndex),
        )
      ],
    doneSet = state?.done ?? {},
    doneCount = Object.keys(doneSet).length,
    readWords = chapters
      .filter((c) => doneSet[c.id])
      .reduce((s, c) => s + c.words, 0),
    percent = Math.round((readWords / totalWords) * 1000) / 10,
    totalSeconds = state
      ? state.logs.reduce((s, l) => s + l.seconds, 0) +
        (state.timer
          ? Math.max(0, Math.floor((now - state.timer.startedAt) / 1000))
          : 0)
      : 0;
  const completedUnits = planState?.adaptive?.finished.length ?? 0,
    timedUnits = state
      ? new Set([
          ...state.logs.filter((l) => l.seconds > 0).map((l) => l.day),
          ...(state.timer ? [state.timer.day] : []),
        ]).size
      : 0;
  const fmt = (date: string, long = false) =>
    dateAt(date).toLocaleDateString(locales[lang], {
      timeZone: "UTC",
      day: "numeric",
      month: long ? "long" : "short",
      ...(long ? { year: "numeric" } : {}),
    });
  const readLabel = (items: typeof chapters) => passage(items, names) || t.rest;
  const choose = (index: number) => {
    setSelected(index);
    setTab("today");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const saveConfig = async (config: Config) => {
    const s = await mutate({ action: "create", config, lang });
    if (s) {
      setNewPlan(false);
      setSelected(null);
      setPage(0);
      setTab("today");
      setReminderTime(s.config.time);
      setZone(s.config.timezone);
    }
  };
  const saveSettings = async () => {
    const s = await mutate({
      action: "settings",
      time: reminderTime,
      timezone: zone,
      lang,
    });
    if (s) setMessage("saved");
    return s;
  };
  const seconds = state && day ? daySeconds(state, day.index, now) : 0,
    running = state?.timer?.day === day?.index,
    dayDone = !!planState?.adaptive?.finished.includes(day?.index),
    canRead = day?.index === dateIndex || running,
    sessionItems =
      planState && day ? sessionChapters(planState, day.index) : [],
    extraIds = new Set(planState?.adaptive?.extra[day?.index] ?? []),
    nextExtra =
      planState && day ? nextExtraChapter(planState, day.index) : undefined,
    remainingWords = totalWords - readWords,
    remainingDays = Math.max(0, days.length - dateIndex - 1),
    remainingChapters = chapters.length - doneCount;
  const finishingPace = useMemo(() => {
    if (!state || !day || !finishing) return pace;
    try {
      // Preview the exact same calculation that saving will commit.
      return readingPace(
        applyAction(
          state,
          {
            action: "complete",
            day: day.index,
            planId: state.id,
            opId: crypto.randomUUID(),
          },
          now,
        ),
      );
    } catch {
      return pace;
    }
  }, [state, day?.index, finishing, now, pace]);
  const finishSession = async () => {
    if (day && (await mutate({ action: "complete", day: day.index }))) {
      setFinishing(false);
      setMessage("replanned");
      setSelected(null);
    }
  };
  // Progressive enhancement: read-only tool uses the same visible app state.
  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (t: unknown, o: unknown) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      void Promise.resolve(
        context.registerTool(
          {
            name: "get_reading_progress",
            description:
              "Read the current Bible plan, completion and measured time. Makes no changes.",
            inputSchema: {
              type: "object",
              properties: {},
              additionalProperties: false,
            },
            annotations: { readOnlyHint: true },
            execute: (input: unknown) => {
              if (
                !input ||
                typeof input !== "object" ||
                Array.isArray(input) ||
                Object.keys(input).length
              )
                throw Error("Expected an empty object");
              const s = stateRef.current;
              return s
                ? {
                    days: createPlan(s.config).length,
                    chaptersRead: Object.keys(s.done).length,
                    measuredSeconds: s.logs.reduce((n, l) => n + l.seconds, 0),
                    timerRunning: !!s.timer,
                  }
                : { plan: null };
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => {});
    } catch {}
    return () => lifecycle.abort();
  }, []);
  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/">
          <span className="brand-mark">
            <BookOpen size={22} />
          </span>
          Leseweg<span className="brand-caption">{t.tagline}</span>
        </a>
        <Select value={lang} onValueChange={(v) => setLang(v as Lang)}>
          <SelectTrigger aria-label={t.language} className="language-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="de">Deutsch</SelectItem>
            <SelectItem value="ru">Русский</SelectItem>
            <SelectItem value="en">English</SelectItem>
          </SelectContent>
        </Select>
      </header>
      <main className="workspace">
        {offline && (
          <p className="warning" role="status">
            {t.offline}
          </p>
        )}
        {offlineSupport.update && (
          <div className="notice update-notice" role="status">
            <span>{t.updateAvailable}</span>
            <button
              className="secondary"
              disabled={busy}
              onClick={offlineSupport.activate}
            >
              {t.updateNow}
            </button>
          </div>
        )}
        {error && (
          <p className="error notice" role="alert">
            {error === "timer"
              ? t.busyTimer
              : error === "changed"
                ? t.planChanged
                : t.error}
            {error === "timer" && state?.timer && (
              <button
                className="text-button"
                onClick={() => choose(state.timer!.day)}
              >
                {t.goTimer}
              </button>
            )}
          </p>
        )}
        {message && (
          <p className="notice" role="status">
            {message === "saved"
              ? t.saved
              : message === "replanned"
                ? t.replanned
                : t.timerStopped}
          </p>
        )}
        {status === "loading" ? (
          <div className="screen-message" role="status">
            {t.loading}
          </div>
        ) : status === "error" ? (
          <section className="panel screen-message">
            <p>{t.unavailable}</p>
            <button className="secondary" onClick={() => load()}>
              {t.retry}
            </button>
          </section>
        ) : !state || newPlan ? (
          <>
            <div className="page-heading">
              <span className="eyebrow">{t.eyebrow}</span>
              <h1>{t.title}</h1>
              <p>{t.subtitle}</p>
              <p className="local-note">{t.localIntro}</p>
            </div>
            {newPlan && (
              <button className="text-button" onClick={() => setNewPlan(false)}>
                <X size={16} />
                {t.cancel}
              </button>
            )}
            {!state && <InstallControls lang={lang} offline={offlineSupport} />}
            <PlannerForm lang={lang} onSave={saveConfig} busy={busy} />
            {!state && (
              <BackupControls
                state={state}
                lang={lang}
                theme={theme}
                busy={busy}
                onRestore={restored}
              />
            )}
          </>
        ) : (
          <Tabs value={tab} onValueChange={setTab} className="main-tabs">
            <TabsList className="main-nav">
              <TabsTrigger value="today">
                <Sun size={18} />
                {t.today}
              </TabsTrigger>
              <TabsTrigger value="plan">
                <CalendarDays size={18} />
                {t.plan}
              </TabsTrigger>
              <TabsTrigger value="stats">
                <BarChart3 size={18} />
                {t.stats}
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings size={18} />
                {t.settings}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="today">
              <div className="page-heading dashboard-heading">
                <div>
                  <span className="eyebrow">{fmt(currentDate, true)}</span>
                  <h1>
                    {doneCount === chapters.length ? t.completePlan : t.welcome}
                  </h1>
                  <p>{t.edition}</p>
                </div>
                <div className="goal-chip">
                  <CalendarDays size={16} />
                  {t.target} · {fmt(days.at(-1)!.date, true)}
                </div>
              </div>
              {days[0].date > currentDate && (
                <p className="notice">
                  {t.future} {fmt(days[0].date, true)}.
                </p>
              )}
              {remainingChapters > 0 && currentDate > days.at(-1)!.date && (
                <p className="warning">{t.deadlinePassed}</p>
              )}
              {!canRead && (
                <div className="catchup-bar">
                  <span>
                    {day.date < currentDate ? t.historyHint : t.previewHint}
                  </span>
                  <button
                    className="secondary"
                    onClick={() => choose(dateIndex)}
                  >
                    {t.backToday}
                  </button>
                </div>
              )}
              <div className="reading-grid">
                <section className="panel reading-card">
                  <div className="session-heading">
                    <span className="eyebrow">
                      {dayDone || day.date < currentDate
                        ? t.read
                        : t.recommended}
                    </span>
                    <span className="day-pill">
                      {t.day} {day.index + 1} / {days.length}
                    </span>
                  </div>
                  <h2>
                    {day.date < currentDate && !day.chapters.length
                      ? t.noReadingLogged
                      : readLabel(day.chapters)}
                  </h2>
                  <div className="session-meta">
                    <span>
                      <CalendarDays size={15} />
                      {fmt(day.date)}
                    </span>
                    {day.words > 0 && (
                      <span>
                        <Clock3 size={15} />
                        {t.approx} {estimate(day.words)} {t.min} ·{" "}
                        {pace.personal ? t.personalEstimate : t.defaultEstimate}
                      </span>
                    )}
                  </div>
                  <p className="muted session-intro">
                    {dayDone
                      ? t.sessionSaved
                      : canRead
                        ? t.adaptiveHint
                        : t.previewHint}
                  </p>
                  {(sessionItems.length > 0 || canRead) && (
                    <>
                      {(canRead || seconds > 0) && (
                        <div
                          className={`timer-box ${running ? "is-running" : ""}`}
                        >
                          <span
                            className="timer-digits"
                            role="timer"
                            aria-label={t.measured}
                          >
                            {clockText(seconds)}
                          </span>
                          <span className="timer-caption">
                            {running ? t.timerRunning : t.timerPaused}
                          </span>
                          {canRead && !dayDone && (
                            <div className="timer-actions">
                              <button
                                className="primary"
                                disabled={busy || !!(state.timer && !running)}
                                onClick={() =>
                                  mutate({
                                    action: "timer",
                                    mode: running ? "pause" : "start",
                                    day: day.index,
                                  })
                                }
                              >
                                {running ? (
                                  <Pause size={18} />
                                ) : (
                                  <Play size={18} />
                                )}{" "}
                                {running
                                  ? t.pause
                                  : seconds > 0
                                    ? t.resume
                                    : t.startTimer}
                              </button>
                              {(running || seconds > 0) && (
                                <button
                                  className="secondary"
                                  disabled={busy}
                                  onClick={async () => {
                                    if (
                                      await mutate({
                                        action: "timer",
                                        mode: "stop",
                                        day: day.index,
                                      })
                                    )
                                      setMessage("stopped");
                                  }}
                                >
                                  <Square size={16} />
                                  {t.finishTimer}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      {state.timer && !running && (
                        <button
                          className="text-button"
                          onClick={() => choose(state.timer!.day)}
                        >
                          <Clock3 size={16} />
                          {t.goTimer}
                        </button>
                      )}
                      {seconds > 14400 && (
                        <p className="warning">{t.longTimer}</p>
                      )}
                      <div className="chapter-checklist">
                        {sessionItems.map((c) => (
                          <label
                            className={`chapter-row ${doneSet[c.id] ? "is-done" : ""}`}
                            key={c.id}
                          >
                            <Checkbox
                              checked={!!doneSet[c.id]}
                              disabled={busy || !canRead || dayDone}
                              onCheckedChange={(v) =>
                                mutate({
                                  action: "chapter",
                                  chapter: c.id,
                                  done: v === true,
                                })
                              }
                              aria-label={readLabel([c])}
                            />
                            <span>
                              {readLabel([c])}
                              {extraIds.has(c.id) && (
                                <small className="extra-label">
                                  {t.additional}
                                </small>
                              )}
                            </span>
                            <small>
                              {t.approx} {estimate(c.words)} {t.min}
                            </small>
                          </label>
                        ))}
                      </div>
                      {canRead && !dayDone && (
                        <>
                          {nextExtra && (
                            <button
                              className="secondary add-chapter"
                              disabled={busy}
                              onClick={() =>
                                mutate({ action: "extend", day: day.index })
                              }
                            >
                              <Plus size={17} />
                              {t.addChapter}
                              <small>{readLabel([nextExtra])}</small>
                            </button>
                          )}
                          <p className="session-count">
                            {sessionItems.filter((c) => doneSet[c.id]).length}{" "}
                            {t.chaptersChecked}
                          </p>
                          <button
                            className="complete-button"
                            disabled={busy || !!(state.timer && !running)}
                            onClick={() => setFinishing(true)}
                          >
                            <Check size={18} />
                            {t.finishSession}
                          </button>
                        </>
                      )}
                      {dayDone && (
                        <div className="done-note">
                          <CircleCheck size={20} />
                          {t.sessionSaved}
                        </div>
                      )}
                      {canRead && dayDone && remainingChapters > 0 && (
                        <button
                          className="secondary add-chapter"
                          disabled={busy}
                          onClick={() =>
                            mutate({ action: "reopen", day: day.index })
                          }
                        >
                          <BookOpen size={17} />
                          {t.continueReading}
                        </button>
                      )}
                      <button
                        className="text-button edit-time"
                        disabled={busy}
                        onClick={() => {
                          setCorrectMinutes(
                            String(Math.round(seconds / 6) / 10),
                          );
                          setEditing(true);
                        }}
                      >
                        <Pencil size={14} />
                        {t.editTime}
                      </button>
                    </>
                  )}
                </section>
                <aside className="reading-aside">
                  <section className="panel progress-card">
                    <div className="section-top">
                      <h3>{t.progress}</h3>
                      <BookOpen size={19} />
                    </div>
                    <div className="progress-number">
                      {percent.toLocaleString(locales[lang])}
                      <span>%</span>
                    </div>
                    <Progress value={percent} aria-label={t.progress} />
                    <p className="muted">
                      {doneCount.toLocaleString(locales[lang])} / 1.189{" "}
                      {t.chapters}
                      <small>{t.byText}</small>
                    </p>
                    <div className="compact-stat">
                      <Clock3 size={19} />
                      <span>{t.totalTime}</span>
                      <strong>
                        {Math.floor(totalSeconds / 60)} {t.min}
                      </strong>
                    </div>
                  </section>
                  <section className="panel next-card">
                    <span className="eyebrow">{t.upcoming}</span>
                    {days.slice(day.index + 1, day.index + 4).map((d) => (
                      <button
                        className="upcoming-row"
                        key={d.index}
                        onClick={() => choose(d.index)}
                      >
                        <span className="date-square">
                          <b>{dateAt(d.date).getUTCDate()}</b>
                          <small>
                            {dateAt(d.date).toLocaleDateString(locales[lang], {
                              month: "short",
                              timeZone: "UTC",
                            })}
                          </small>
                        </span>
                        <span>
                          <strong>
                            {d.date < currentDate && !d.chapters.length
                              ? t.noReadingLogged
                              : readLabel(d.chapters)}
                          </strong>
                          <small>
                            {d.words
                              ? `${t.approx} ${estimate(d.words)} ${t.min}`
                              : t.rest}
                          </small>
                        </span>
                      </button>
                    ))}
                    <button
                      className="text-button"
                      onClick={() => {
                        setTab("plan");
                        setPage(Math.floor(day.index / 14));
                      }}
                    >
                      {t.viewPlan}
                    </button>
                  </section>
                  <p className="aside-note">
                    <BookOpen size={18} />
                    {t.timerNote}
                  </p>
                </aside>
              </div>
            </TabsContent>
            <TabsContent value="plan">
              <div className="page-heading">
                <span className="eyebrow">
                  {t.target}: {fmt(days.at(-1)!.date, true)}
                </span>
                <h1>{t.plan}</h1>
                <p>{t.planSub}</p>
              </div>
              <div className="panel plan-list">
                {days.slice(page * 14, page * 14 + 14).map((d) => {
                  const isDone = !!planState?.adaptive?.finished.includes(
                    d.index,
                  );
                  return (
                    <button
                      key={d.index}
                      className={`plan-row ${d.date === currentDate ? "is-today" : ""}`}
                      onClick={() => choose(d.index)}
                    >
                      <span
                        className={`plan-indicator ${isDone ? "is-complete" : ""}`}
                      >
                        {isDone ? <Check size={18} /> : d.index + 1}
                      </span>
                      <span className="plan-passage">
                        <strong>
                          {d.date < currentDate && !d.chapters.length
                            ? t.noReadingLogged
                            : readLabel(d.chapters)}
                        </strong>
                        <small>
                          {fmt(d.date, true)}
                          {d.date === currentDate ? ` · ${t.today}` : ""}
                        </small>
                      </span>
                      <span className="plan-duration">
                        {d.words ? `${estimate(d.words)} ${t.min}` : "–"}
                        <small>
                          {isDone
                            ? t.finished
                            : d.date < currentDate
                              ? t.read
                              : t.recommended}
                        </small>
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="pagination">
                <button
                  className="secondary"
                  aria-label={t.previous}
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft size={18} />
                </button>
                <span>
                  {t.page} {page + 1} / {Math.ceil(days.length / 14)}
                </span>
                <button
                  className="secondary"
                  aria-label={t.next}
                  disabled={(page + 1) * 14 >= days.length}
                  onClick={() => setPage(page + 1)}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
              <details className="method">
                <summary>{t.explain}</summary>
                <p>{t.method}</p>
                <a
                  href="https://github.com/midvash/bible-data"
                  target="_blank"
                  rel="noreferrer"
                >
                  Luther 1912 · Public Domain · bible-data
                </a>
              </details>
            </TabsContent>
            <TabsContent value="stats">
              <div className="page-heading">
                <span className="eyebrow">{t.measured}</span>
                <h1>{t.stats}</h1>
                <p>{t.statsSub}</p>
              </div>
              <div className="stats-grid">
                {[
                  [
                    t.totalTime,
                    `${Math.floor(totalSeconds / 60)}`,
                    t.min,
                    Clock3,
                  ],
                  [
                    t.avgTime,
                    timedUnits
                      ? `${Math.round(totalSeconds / timedUnits / 60)}`
                      : "–",
                    t.min,
                    BarChart3,
                  ],
                  [
                    t.units,
                    String(completedUnits),
                    `/ ${days.filter((d) => d.chapters.length).length}`,
                    CircleCheck,
                  ],
                  [t.chapters, String(doneCount), "/ 1.189", BookOpen],
                ].map(([label, value, unit, Icon]) => {
                  const I = Icon as typeof Clock3;
                  return (
                    <section className="panel stat-card" key={String(label)}>
                      <I size={20} />
                      <p>{String(label)}</p>
                      <strong>
                        {String(value)}
                        <small>{String(unit)}</small>
                      </strong>
                    </section>
                  );
                })}
              </div>
              <section className="panel pace-panel">
                <div className="pace-heading">
                  <Clock3 size={20} />
                  <h2>{t.paceTitle}</h2>
                </div>
                <p className="pace-status">
                  {pace.personal ? t.personalEstimate : t.defaultEstimate}
                </p>
                <p className="muted">
                  {pace.personal
                    ? t.paceBased
                        .replace("{chapters}", String(pace.chapters))
                        .replace("{time}", clockText(pace.seconds))
                    : t.paceFallback}
                </p>
                <p className="muted">{t.paceHelp}</p>
              </section>
              <section className="panel chart-panel">
                <h2>{t.chartTitle}</h2>
                <p className="muted">
                  {t.measured} · {t.min}
                </p>
                <div className="time-chart">
                  {Array.from({ length: 7 }, (_, i) => {
                    const date = addDays(currentDate, i - 6),
                      sum =
                        state.logs
                          .filter(
                            (l) =>
                              todayFor(l.at, state.config.timezone) === date,
                          )
                          .reduce((s, l) => s + l.seconds, 0) +
                        (state.timer && date === currentDate
                          ? Math.max(0, (now - state.timer.startedAt) / 1000)
                          : 0),
                      max = Math.max(
                        60,
                        ...Array.from({ length: 7 }, (_, j) =>
                          state.logs
                            .filter(
                              (l) =>
                                todayFor(l.at, state.config.timezone) ===
                                addDays(currentDate, j - 6),
                            )
                            .reduce((s, l) => s + l.seconds, 0),
                        ),
                        state.timer
                          ? Math.max(0, (now - state.timer.startedAt) / 1000)
                          : 0,
                      );
                    return (
                      <div className="chart-column" key={date}>
                        <span>{Math.round(sum / 60)}</span>
                        <div className="bar-track">
                          <div
                            className="bar"
                            style={{
                              height: `${Math.max(sum > 0 ? 3 : 0, (sum / max) * 100)}%`,
                            }}
                          />
                        </div>
                        <small>
                          {dateAt(date).toLocaleDateString(locales[lang], {
                            weekday: "short",
                            timeZone: "UTC",
                          })}
                        </small>
                      </div>
                    );
                  })}
                </div>
                {!state.logs.length && !state.timer && (
                  <p className="chart-empty">{t.noTimer}</p>
                )}
              </section>
              <section className="panel history-panel">
                <h2>{t.recent}</h2>
                {timedUnits === 0 ? (
                  <p className="muted">{t.noData}</p>
                ) : (
                  days
                    .filter((d) => daySeconds(state, d.index, now) > 0)
                    .sort((a, b) => b.index - a.index)
                    .slice(0, 10)
                    .map((d) => (
                      <button
                        className="history-row"
                        key={d.index}
                        onClick={() => choose(d.index)}
                      >
                        <span>
                          {readChaptersOnDay(state, d.index).length
                            ? readLabel(readChaptersOnDay(state, d.index))
                            : t.noReadingLogged}
                          <small>
                            {t.day} {d.index + 1} · {fmt(d.date)}
                          </small>
                        </span>
                        <strong>
                          {clockText(daySeconds(state, d.index, now))}
                        </strong>
                      </button>
                    ))
                )}
                <button
                  className="secondary"
                  onClick={() =>
                    downloadFile(
                      csvFile(state, lang),
                      "leseweg-statistik.csv",
                      "text/csv;charset=utf-8",
                    )
                  }
                >
                  <Download size={16} />
                  {t.export}
                </button>
              </section>
            </TabsContent>
            <TabsContent value="settings">
              <div className="page-heading">
                <span className="eyebrow">LESEWEG</span>
                <h1>{t.settings}</h1>
              </div>
              <div className="settings-grid">
                <section className="panel settings-card">
                  <span className="section-icon">
                    <Bell size={22} />
                  </span>
                  <h2>{t.reminders}</h2>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      await saveSettings();
                    }}
                  >
                    <label htmlFor="reminder-time">{t.time}</label>
                    <input
                      id="reminder-time"
                      type="time"
                      required
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                    />
                    <label htmlFor="zone">{t.timezone}</label>
                    <Select value={zone} onValueChange={setZone}>
                      <SelectTrigger id="zone" className="w-full h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from(
                          new Set([
                            zone,
                            "Europe/Berlin",
                            "Europe/Moscow",
                            "Europe/London",
                            "America/New_York",
                            "Asia/Almaty",
                            "UTC",
                          ]),
                        ).map((z) => (
                          <SelectItem value={z} key={z}>
                            {z}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <button className="primary mt-5" disabled={busy}>
                      {busy ? t.saving : t.save}
                    </button>
                  </form>
                  <hr />
                  <PushControls time={state.config.time} timezone={state.config.timezone} lang={lang} />
                  <hr />
                  <h3>{t.calendar}</h3>
                  <p className="muted">{t.calendarSub}</p>
                  <button
                    className="secondary full"
                    disabled={busy || !reminderTime}
                    onClick={async () => {
                      const s = await saveSettings();
                      if (s)
                        downloadFile(
                          calendarFile(s, lang, location.origin),
                          "leseweg.ics",
                          "text/calendar;charset=utf-8",
                        );
                    }}
                  >
                    <Download size={17} />
                    {t.download}
                  </button>
                  <p className="fineprint">{t.calendarNote}</p>
                </section>
                <div className="settings-stack">
                  <BackupControls
                    state={state}
                    lang={lang}
                    theme={theme}
                    busy={busy}
                    onRestore={restored}
                  />
                  <section className="panel settings-card">
                    <h2>{t.language}</h2>
                    <Select
                      value={lang}
                      onValueChange={(v) => setLang(v as Lang)}
                    >
                      <SelectTrigger
                        aria-label={t.language}
                        className="w-full mt-5"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="de">Deutsch</SelectItem>
                        <SelectItem value="ru">Русский</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="fineprint">{t.languageNote}</p>
                    <label>{t.theme}</label>
                    <Select value={theme} onValueChange={setTheme}>
                      <SelectTrigger aria-label={t.theme} className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">{t.light}</SelectItem>
                        <SelectItem value="dark">{t.dark}</SelectItem>
                      </SelectContent>
                    </Select>
                  </section>
                  <InstallControls lang={lang} offline={offlineSupport} />
                  <section className="panel settings-card">
                    <p className="muted">{t.edition}</p>
                    <button
                      className="text-button"
                      onClick={() => setReset(true)}
                    >
                      <RotateCcw size={16} />
                      {t.newPlan}
                    </button>
                    <details className="method">
                      <summary>{t.explain}</summary>
                      <p>{t.method}</p>
                      <a
                        href="https://github.com/midvash/bible-data"
                        target="_blank"
                        rel="noreferrer"
                      >
                        bible-data · Luther 1912
                      </a>
                    </details>
                  </section>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
        <footer>
          <Leaf size={16} />
          <span>{t.footer}</span>
        </footer>
      </main>
      <AlertDialog open={reset} onOpenChange={setReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.replaceTitle}</AlertDialogTitle>
            <AlertDialogDescription>{t.replaceText}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={() => setNewPlan(true)}>
              {t.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={finishing} onOpenChange={setFinishing}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.finishSession}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.finishExplanation} {t.paceFinishHint}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="finish-summary">
            <strong>
              {sessionItems.filter((c) => doneSet[c.id]).length}{" "}
              {t.chaptersChecked}
            </strong>
            <p>
              {remainingChapters} {t.chaptersRemaining}
            </p>
            {remainingChapters === 0 ? (
              <p>{t.completePlan}</p>
            ) : remainingDays > 0 ? (
              <p>
                {remainingDays} {t.daysRemaining} · {t.approx}{" "}
                {estimatedMinutes(
                  remainingWords / remainingDays,
                  finishingPace,
                )}{" "}
                {t.minsDaily}
              </p>
            ) : (
              <p className="warning">{t.noDaysRemaining}</p>
            )}
            {days.length > 0 && (
              <p>
                {t.target}: {fmt(days.at(-1)!.date, true)}
              </p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={async (e) => {
                e.preventDefault();
                await finishSession();
              }}
            >
              {busy ? t.saving : t.finishAndReplan}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent>
          <DialogTitle>{t.editTime}</DialogTitle>
          <DialogDescription>{t.minutesLabel}</DialogDescription>
          <form
            className="mt-0"
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                day &&
                (await mutate({
                  action: "correct",
                  day: day.index,
                  minutes: Number(correctMinutes),
                }))
              )
                setEditing(false);
            }}
          >
            <label htmlFor="correct-time">{t.minutesLabel}</label>
            <input
              id="correct-time"
              type="number"
              min="0"
              max="1440"
              step="0.1"
              required
              value={correctMinutes}
              onChange={(e) => setCorrectMinutes(e.target.value)}
            />
            <button className="primary mt-5" disabled={busy}>
              {t.save}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
function todayFor(at: string, zone: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(at));
}
