"use client";
import { useInstallation } from "@/lib/installation";
import InstallGate from "./install-gate";
import EditionControl from "./edition-control";
import { editionName } from "@/lib/editions";
import { experienceText } from "@/lib/experience-i18n";
import { sessionsFor, dailySeconds } from "@/lib/session-stats";
import { useBackupStatus, recordBackup } from "@/lib/backup-status";
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
  languageCodes,
  languageLabels,
  isLanguage,
  browserLanguage,
} from "@/lib/languages";
import {
  isBible52,
  bible52Units,
  createPlan,
  chaptersFor,
  type Chapter,
  scopeChapters,
  today,
  dateAt,
  addDays,
  passage,
  clockText,
  type Config,
} from "@/lib/planner";
import { daySeconds, type ReadingState } from "@/lib/state";
import { readingPace, estimatedSeconds, sampleNeedsReview } from "@/lib/pace";
import {
  readingTime,
  readingTimeClock,
  readingTimeSummary,
} from "@/lib/reading-time";
import { readingTimeText } from "@/lib/reading-time-i18n";
import ReadingTimeOverview from "./reading-time-overview";
import { applyAction } from "@/lib/actions";
import { calendarFile, csvFile, downloadFile } from "@/lib/exports";
import Bible52Weeks from "./bible52-weeks";
import { bible52Text, bible52Position } from "@/lib/bible52-i18n";
import PlannerForm from "./planner-form";
import TimeCorrectionDialog from "./time-correction-dialog";
import DeadlineDialog from "./deadline-dialog";
import { deadlineText } from "@/lib/deadline-i18n";
import PlanManagement from "./plan-management";
import ReadingContext from "./reading-context";
import BookOrderControl from "./book-order-control";
import ChapterCorrection from "./chapter-correction";
import { bookOrderText } from "@/lib/book-order-i18n";
import { planText, fill } from "@/lib/plan-i18n";
import { readState, changeState } from "@/lib/local-storage";
import { useOffline } from "@/lib/offline";
import BackupControls from "./backup-controls";
import InstallControls from "./install-controls";
import PushControls from "./push-controls";
import {
  bible52CurrentUnit,
  prepareState,
  readingPlan,
  dayIndex,
  sessionChapters,
  nextExtraChapter,
  readChaptersOnDay,
} from "@/lib/adaptive";
type Status = "loading" | "ready" | "error";
export default function Leseweg({
  previewInstalled = false,
  previewTab = "today",
}: { previewInstalled?: boolean; previewTab?: string } = {}) {
  const [lang, setLang] = useState<Lang>("de"),
    [theme, setTheme] = useState("light"),
    [state, setState] = useState<ReadingState | null>(null),
    [status, setStatus] = useState<Status>("loading"),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [tab, setTab] = useState(import.meta.env.DEV ? previewTab : "today"),
    [selected, setSelected] = useState<number | null>(null),
    [page, setPage] = useState(0),
    [now, setNow] = useState(Date.now()),
    [offline, setOffline] = useState(false),
    [reset, setReset] = useState(false),
    [newPlan, setNewPlan] = useState(false),
    [changingDeadline, setChangingDeadline] = useState(false),
    [editing, setEditing] = useState(false),
    [finishing, setFinishing] = useState(false),
    [correctSeconds, setCorrectSeconds] = useState(0),
    [reminderTime, setReminderTime] = useState("07:30"),
    [zone, setZone] = useState("Europe/Berlin");
  const offlineSupport = useOffline();
  const installState = useInstallation();
  const installation = {
    ...installState,
    standalone:
      installState.standalone || (import.meta.env.DEV && previewInstalled),
  };
  const e = experienceText(lang);
  const backupHistory = useBackupStatus(state?.id ?? null);
  const [confirmPace, setConfirmPace] = useState(false);
  const chapterInventory = chaptersFor(state?.config);
  const sessions = state ? sessionsFor(state) : [];
  const chartValues = state ? dailySeconds(state, now) : {};
  const backupDue =
    !!state &&
    (sessions.length >= 3 ||
      (Object.keys(state.done).length > 0 &&
        now - dateAt(state.config.start).getTime() > 7 * 86400000)) &&
    now - Math.max(backupHistory.exported, backupHistory.snoozed) >
      7 * 86400000;
  const fixed = !!state && isBible52(state.config),
    f = bible52Text(lang);
  const p = planText(lang),
    deadline = deadlineText(lang);
  const t = text(lang),
    names = bookNames(fixed ? "de" : lang),
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
      if (data.state?.config.bookOrderMode) setLang(data.state.lang);
      if (data.state && !silent) {
        setReminderTime(data.state.config.time);
        setZone(data.state.config.timezone);
        try {
          if (
            !data.state.config.bookOrderMode &&
            !localStorage.getItem("leseweg-lang")
          )
            setLang(data.state.lang);
        } catch {}
      }
    } catch {
      if (!silent) setStatus("error");
    }
  }, []);
  useEffect(() => {
    try {
      const l = localStorage.getItem("leseweg-lang");
      if (isLanguage(l)) setLang(l);
      else setLang(browserLanguage(navigator.language));
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
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute(
        "content",
        getComputedStyle(document.documentElement)
          .getPropertyValue("--theme-color")
          .trim(),
      );
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
  const changeLanguage = async (value: Lang) => {
    if (value === lang || pending.current) return;
    if (!state || !installation.standalone) {
      setLang(value);
      return;
    }
    const updated = await mutate({ action: "language", lang: value });
    if (updated) setLang(updated.lang);
  };
  const planState = useMemo(
    () => (state ? prepareState(state, currentDate) : null),
    [state, currentDate],
  );
  const days = useMemo(
    () => (planState ? readingPlan(planState, currentDate) : []),
    [planState, currentDate],
  );
  const pace = useMemo(() => readingPace(state), [state]);
  const timeText = readingTimeText(lang);
  const estimate = (words: number) =>
    readingTime(estimatedSeconds(words, pace), lang);
  const timeSummary = state ? readingTimeSummary(state, now, pace) : null;
  const dateIndex = planState
    ? fixed
      ? bible52CurrentUnit(planState)
      : dayIndex(planState.config, currentDate)
    : 0;
  const scoped = scopeChapters(state?.config ?? {});
  const totalWords = scoped.reduce((sum, c) => sum + c.words, 0);
  const priorIds = state?.previouslyRead ?? [];
  const day =
      days[
        Math.max(
          0,
          Math.min(days.length - 1, selected ?? state?.timer?.day ?? dateIndex),
        )
      ],
    doneSet: Record<string, string> = {
      ...Object.fromEntries(priorIds.map((id) => [id, "previous"])),
      ...state?.done,
    },
    doneCount = Object.keys(doneSet).length,
    readWords = scoped
      .filter((c) => doneSet[c.id])
      .reduce((s, c) => s + c.words, 0),
    percent = Math.round((readWords / totalWords) * 1000) / 10,
    totalSeconds = timeSummary?.measuredSeconds ?? 0;
  const completedUnits = sessions.length;
  const timedSessions = sessions.filter((s) => s.seconds > 0);
  const timedUnits = timedSessions.length;
  const averageSession = timedUnits
    ? timedSessions.reduce((n, s) => n + s.seconds, 0) / timedUnits
    : 0;
  const fmt = (date: string, long = false) =>
    dateAt(date).toLocaleDateString(locales[lang], {
      timeZone: "UTC",
      day: "numeric",
      month: long ? "long" : "short",
      ...(long ? { year: "numeric" } : {}),
    });
  const readLabel = (items: Chapter[]) => passage(items, names) || t.rest;
  const choose = (index: number) => {
    setSelected(index);
    setTab("today");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const saveConfig = async (config: Config, previouslyRead: number[]) => {
    const s = await mutate({ action: "create", config, previouslyRead, lang });
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
    canRead = fixed
      ? (state?.timer?.day ?? state?.pace?.draft?.day ?? day?.index) ===
        day?.index
      : day?.index === dateIndex || running,
    sessionItems =
      planState && day ? sessionChapters(planState, day.index) : [],
    extraIds = new Set(planState?.adaptive?.extra[day?.index] ?? []),
    nextExtra =
      planState && day ? nextExtraChapter(planState, day.index) : undefined,
    remainingWords = totalWords - readWords,
    remainingDays = Math.max(0, days.length - dateIndex - 1),
    remainingChapters = scoped.length - doneCount;
  const sessionSeconds =
    canRead && !dayDone && state && day
      ? Math.max(
          0,
          seconds -
            (state.pace?.draft?.day === day.index
              ? state.pace.draft.secondsBefore
              : sessions
                  .filter((s) => s.day === day.index)
                  .reduce((n, s) => n + s.seconds, 0)),
        )
      : seconds;
  const finishingPace = useMemo(() => {
    if (!state || !day || !finishing) return pace;
    try {
      // Preview the exact same calculation that saving will commit.
      return readingPace(
        applyAction(
          state,
          {
            action: "complete",
            paceChoice: confirmPace ? "confirmed" : undefined,
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
  }, [state, day?.index, finishing, now, pace, confirmPace]);
  const draft = state?.pace?.draft;
  const pendingSample =
    state && draft
      ? {
          day: draft.day,
          chapters: Object.keys(state.done)
            .map(Number)
            .filter((id) => !draft.before.includes(id)),
          seconds: Math.max(
            0,
            daySeconds(state, draft.day, now) - draft.secondsBefore,
          ),
        }
      : null;
  const unusual = !!(
    state &&
    pendingSample &&
    sampleNeedsReview(pendingSample, state, pace.secondsPerWord)
  );
  const openFinish = async () => {
    if (!day) return;
    if (
      running &&
      !(await mutate({ action: "timer", mode: "pause", day: day.index }))
    )
      return;
    setConfirmPace(false);
    setFinishing(true);
  };
  const finishSession = async () => {
    if (
      day &&
      (await mutate({
        action: "complete",
        day: day.index,
        ...(unusual
          ? { paceChoice: confirmPace ? "confirmed" : "excluded" }
          : {}),
      }))
    ) {
      setFinishing(false);
      setMessage(fixed ? "saved" : "replanned");
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
    if (!context?.registerTool || !installation.standalone) return;
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
                    chaptersRead:
                      Object.keys(s.done).length +
                      (s.previouslyRead?.length ?? 0),
                    previouslyRead: s.previouslyRead?.length ?? 0,
                    chaptersInScope: scopeChapters(s.config).length,
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
  }, [installation.standalone]);
  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/">
          <span className="brand-mark">
            <BookOpen size={22} />
          </span>
          Leseweg<span className="brand-caption">{t.tagline}</span>
        </a>
        <Select
          value={lang}
          disabled={busy || status !== "ready"}
          onValueChange={(v) => void changeLanguage(v as Lang)}
        >
          <SelectTrigger aria-label={t.language} className="language-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {languageCodes.map((code) => (
              <SelectItem key={code} value={code}>
                {languageLabels[code]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </header>
      <main className="workspace">
        {installation.standalone && state && (
          <ChapterCorrection state={state} lang={lang} />
        )}
        {installation.standalone && state?.pendingBookOrder && (
          <p className="notice" role="status">
            {bookOrderText(lang).pending}
          </p>
        )}
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
              ? fixed
                ? f.open
                : t.busyTimer
              : error === "changed"
                ? t.planChanged
                : t.error}
            {error === "timer" &&
              (state?.timer || (fixed && state?.pace?.draft)) && (
                <button
                  className="text-button"
                  onClick={() =>
                    choose(
                      state?.timer?.day ?? state?.pace?.draft?.day ?? dateIndex,
                    )
                  }
                >
                  {t.goTimer}
                </button>
              )}
          </p>
        )}
        {message && (
          <p className="notice" role="status">
            {message === "deadline"
              ? deadline.saved
              : message === "saved"
                ? t.saved
                : message === "replanned"
                  ? t.replanned +
                    (remainingDays > 0 && remainingChapters > 0
                      ? " " +
                        fill(p.workload, {
                          time: estimate(remainingWords / remainingDays),
                        })
                      : "")
                  : t.timerStopped}
          </p>
        )}
        {status === "loading" ? (
          <div className="screen-message" role="status">
            {t.loading}
          </div>
        ) : !installation.standalone ? (
          <InstallGate
            lang={lang}
            state={state}
            theme={theme}
            installation={installation}
            offline={offlineSupport}
          />
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
            <PlannerForm
              key={lang}
              lang={lang}
              onSave={saveConfig}
              busy={busy}
            />
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
              {!state.config.edition && lang !== "de" && (
                <div className="notice">
                  <p>{e.legacyEdition}</p>
                  <button
                    className="secondary"
                    onClick={() => setTab("settings")}
                  >
                    {t.settings}
                  </button>
                </div>
              )}
              {backupDue && (
                <div className="notice backup-reminder">
                  <p>{e.backupReminder}</p>
                  <div className="backup-actions">
                    <button
                      className="secondary"
                      onClick={() => setTab("settings")}
                    >
                      {e.backupGo}
                    </button>
                    <button
                      className="text-button"
                      onClick={() => recordBackup(state.id, "snoozed")}
                    >
                      {e.backupLater}
                    </button>
                  </div>
                </div>
              )}
              {!!state.editionReview?.length && (
                <div className="warning">
                  <p>{e.reviewEdition}</p>
                  <button
                    className="secondary"
                    onClick={() => setTab("settings")}
                  >
                    {t.settings}
                  </button>
                </div>
              )}
              <div className="page-heading dashboard-heading">
                <div>
                  <span className="eyebrow">{fmt(currentDate, true)}</span>
                  <h1>
                    {doneCount === scoped.length ? t.completePlan : t.welcome}
                  </h1>
                  <p>
                    {editionName(state?.config ?? {})} ·{" "}
                    {fixed
                      ? "Bibelleseplan 52"
                      : p[state.config.scope ?? "bible"]}
                  </p>
                </div>
                {fixed ? (
                  <div className="goal-chip bible52-goal">
                    <CalendarDays size={16} />
                    {f.description}
                  </div>
                ) : (
                  <button
                    type="button"
                    className="goal-chip goal-edit"
                    disabled={busy}
                    aria-label={`${deadline.edit}: ${fmt(days.at(-1)!.date, true)}`}
                    onClick={() => setChangingDeadline(true)}
                  >
                    <CalendarDays size={16} />
                    {t.target} · {fmt(days.at(-1)!.date, true)}
                    <Pencil size={14} />
                  </button>
                )}
              </div>
              {!fixed && days[0].date > currentDate && (
                <p className="notice">
                  {t.future} {fmt(days[0].date, true)}.
                </p>
              )}
              {!fixed &&
                remainingChapters > 0 &&
                currentDate > days.at(-1)!.date && (
                  <p className="warning">{t.deadlinePassed}</p>
                )}
              {!!planState?.adaptive?.unplanned?.length && (
                <p className="warning">
                  {fill(p.unscheduled, {
                    count: planState.adaptive.unplanned.length,
                  })}
                </p>
              )}
              {!canRead && (
                <div className="catchup-bar">
                  <span>
                    {fixed
                      ? f.open
                      : day.date < currentDate
                        ? t.historyHint
                        : t.previewHint}
                  </span>
                  <button
                    className="secondary"
                    onClick={() => choose(dateIndex)}
                  >
                    {fixed ? f.resume : t.backToday}
                  </button>
                </div>
              )}
              <div className="reading-grid">
                <section className="panel reading-card">
                  <div className="session-heading">
                    <span className="eyebrow">
                      {fixed
                        ? "Bibelleseplan 52"
                        : dayDone || day.date < currentDate
                          ? t.read
                          : t.recommended}
                    </span>
                    <span className="day-pill">
                      {fixed
                        ? bible52Position(day.index, lang)
                        : `${t.day} ${day.index + 1} / ${days.length}`}
                    </span>
                  </div>
                  <h2>
                    {fixed
                      ? bible52Units[day.index].label
                      : day.date < currentDate && !day.chapters.length
                        ? t.noReadingLogged
                        : readLabel(day.chapters)}
                  </h2>
                  <div className="session-meta">
                    <span>
                      <CalendarDays size={15} />
                      {fixed ? f.original : fmt(day.date)}
                    </span>
                    {day.words > 0 && (
                      <span>
                        <Clock3 size={15} />
                        {t.approx} {estimate(day.words)} ·{" "}
                        {pace.personal
                          ? t.personalEstimate
                          : pace.learning
                            ? e.learning
                            : t.defaultEstimate}
                      </span>
                    )}
                  </div>
                  <ReadingContext
                    config={state.config}
                    items={sessionItems}
                    lang={lang}
                  />
                  <p className="muted session-intro">
                    {fixed
                      ? dayDone
                        ? f.saved
                        : f.finish
                      : dayDone
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
                            {clockText(sessionSeconds)}
                          </span>
                          <span className="timer-caption">
                            {running
                              ? t.timerRunning
                              : canRead && !dayDone
                                ? t.timerPaused
                                : e.dailyMeasured}
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
                                  : sessionSeconds > 0
                                    ? t.resume
                                    : t.startTimer}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      {state.timer && !running && (
                        <button
                          className="text-button"
                          onClick={() =>
                            choose(
                              state?.timer?.day ??
                                state?.pace?.draft?.day ??
                                dateIndex,
                            )
                          }
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
                              disabled={
                                busy ||
                                !canRead ||
                                (fixed ? priorIds.includes(c.id) : dayDone)
                              }
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
                              {t.approx} {estimate(c.words)}
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
                            onClick={() => void openFinish()}
                          >
                            <Check size={18} />
                            {e.finish}
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
                            fixed
                              ? choose(dateIndex)
                              : mutate({ action: "reopen", day: day.index })
                          }
                        >
                          <BookOpen size={17} />
                          {fixed ? f.next : t.continueReading}
                        </button>
                      )}
                      <button
                        className="text-button edit-time"
                        disabled={
                          busy ||
                          (fixed &&
                            (!canRead ||
                              sessionItems.every((c) =>
                                priorIds.includes(c.id),
                              )))
                        }
                        onClick={() => {
                          setCorrectSeconds(seconds);
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
                      {doneCount.toLocaleString(locales[lang])} /{" "}
                      {scoped.length.toLocaleString(locales[lang])} {t.chapters}
                      <small>{t.byText}</small>
                    </p>
                    <div className="compact-stat">
                      <Clock3 size={19} />
                      <span>{p.measured}</span>
                      <strong>{readingTime(totalSeconds, lang)}</strong>
                    </div>
                  </section>
                  <section className="panel next-card">
                    <span className="eyebrow">{t.upcoming}</span>
                    {days
                      .filter(
                        (d) =>
                          d.index > day.index &&
                          (!fixed ||
                            !planState?.adaptive?.finished.includes(d.index)),
                      )
                      .slice(0, 3)
                      .map((d) => (
                        <button
                          className="upcoming-row"
                          key={d.index}
                          onClick={() => choose(d.index)}
                        >
                          <span className="date-square">
                            <b>
                              {fixed
                                ? Math.floor(d.index / 7) + 1
                                : dateAt(d.date).getUTCDate()}
                            </b>
                            <small>
                              {fixed
                                ? f.week
                                : dateAt(d.date).toLocaleDateString(
                                    locales[lang],
                                    {
                                      month: "short",
                                      timeZone: "UTC",
                                    },
                                  )}
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
                                ? `${t.approx} ${estimate(d.words)}`
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
                {fixed ? (
                  <span className="eyebrow">
                    {t.target}: {fmt(days.at(-1)!.date, true)}
                  </span>
                ) : (
                  <button
                    className="text-button goal-link"
                    disabled={busy}
                    onClick={() => setChangingDeadline(true)}
                    aria-label={`${deadline.edit}: ${fmt(days.at(-1)!.date, true)}`}
                  >
                    {t.target}: {fmt(days.at(-1)!.date, true)}
                    <Pencil size={14} />
                  </button>
                )}

                <h1>{t.plan}</h1>
                <p>
                  {fixed
                    ? "Bibelleseplan 52"
                    : `${p[state.config.scope ?? "bible"]} · ${p[state.config.order ?? "canonical"]}`}
                </p>
                <p>{fixed ? f.fixed : t.planSub}</p>
                <p className="local-note">
                  {fill(p.coverage, {
                    total: scoped.length,
                    previous: priorIds.length,
                    completed: Object.keys(state.done).length,
                    remaining: remainingChapters,
                  })}
                </p>
              </div>
              {fixed ? (
                <section className="panel bible52-plan">
                  <Bible52Weeks
                    value={Object.keys(doneSet).map(Number)}
                    lang={lang}
                    current={dateIndex}
                    onChoose={choose}
                  />
                </section>
              ) : (
                <>
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
                            {d.words ? `${estimate(d.words)}` : "–"}
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
                </>
              )}
              <details className="method">
                <summary>{t.explain}</summary>
                <p>{e.approxWeights}</p>
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
              {(!state.sessions ||
                sessions.some((s) => s.id.startsWith("legacy-"))) && (
                <p className="fineprint">{e.legacySessions}</p>
              )}
              <div className="stats-grid">
                {[
                  [p.measured, readingTime(totalSeconds, lang), "", Clock3],
                  [
                    t.avgTime,
                    timedUnits ? readingTime(averageSession, lang) : "–",
                    "",
                    BarChart3,
                  ],
                  [t.units, String(completedUnits), "", CircleCheck],
                  [
                    t.chapters,
                    String(doneCount),
                    `/ ${scoped.length.toLocaleString(locales[lang])}`,
                    BookOpen,
                  ],
                ].map(([label, value, unit, Icon]) => {
                  const I = Icon as typeof Clock3;
                  return (
                    <section className="panel stat-card" key={String(label)}>
                      <I size={20} />
                      <p>{String(label)}</p>
                      <strong
                        className={
                          label === p.measured || label === t.avgTime
                            ? "duration-value"
                            : undefined
                        }
                      >
                        {String(value)}
                        <small>{String(unit)}</small>
                      </strong>
                    </section>
                  );
                })}
              </div>
              {timeSummary && (
                <ReadingTimeOverview summary={timeSummary} lang={lang} />
              )}
              <section className="panel pace-panel">
                <div className="pace-heading">
                  <Clock3 size={20} />
                  <h2>{t.paceTitle}</h2>
                </div>
                <p className="pace-status">
                  {pace.personal
                    ? t.personalEstimate
                    : pace.learning
                      ? e.learning
                      : t.defaultEstimate}
                </p>
                <p className="muted">
                  {pace.personal || pace.learning
                    ? t.paceBased
                        .replace("{chapters}", String(pace.chapters))
                        .replace("{time}", readingTime(pace.seconds, lang))
                    : t.paceFallback}
                </p>
                <p className="muted">{e.paceHelp}</p>
                {pace.excluded > 0 && (
                  <p className="notice">
                    {e.excluded}: {pace.excluded}
                  </p>
                )}
                <details className="method">
                  <summary>{e.advanced}</summary>
                  {state.pace?.samples.map((sample, index) => (
                    <div className="pace-sample" key={index}>
                      <p>
                        {fixed
                          ? bible52Position(sample.day, lang)
                          : fmt(addDays(state.config.start, sample.day))}{" "}
                        · {sample.chapters.length} {t.chapters} ·{" "}
                        {readingTime(sample.seconds, lang)}
                      </p>
                      <label>
                        {e.paceUse}
                        <select
                          value={sample.review ?? "auto"}
                          disabled={busy}
                          onChange={(ev) =>
                            void mutate({
                              action: "review-pace",
                              index,
                              seconds: sample.seconds,
                              review: ev.target.value,
                            })
                          }
                        >
                          <option value="auto">{e.automatic}</option>
                          <option value="confirmed">{e.confirmed}</option>
                          <option value="excluded">{e.excludedChoice}</option>
                        </select>
                      </label>
                    </div>
                  ))}
                </details>
              </section>
              <section className="panel chart-panel">
                <h2>{t.chartTitle}</h2>
                <p className="muted">
                  {t.measured} · {timeText.chart}
                </p>
                <div className="time-chart">
                  {Array.from({ length: 7 }, (_, i) => {
                    const date = addDays(currentDate, i - 6),
                      sum = chartValues[date] ?? 0,
                      max = Math.max(
                        60,
                        ...Array.from(
                          { length: 7 },
                          (_, j) =>
                            chartValues[addDays(currentDate, j - 6)] ?? 0,
                        ),
                      );
                    return (
                      <div
                        className="chart-column"
                        key={date}
                        title={`${fmt(date)} · ${readingTime(sum, lang)}`}
                        aria-label={`${fmt(date)} · ${readingTime(sum, lang)}`}
                      >
                        <span>{readingTimeClock(sum)}</span>
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
                  [...timedSessions]
                    .reverse()
                    .slice(0, 10)
                    .map((d) => (
                      <button
                        className="history-row"
                        key={d.id}
                        onClick={() => choose(d.day)}
                      >
                        <span>
                          {d.chapters.length
                            ? readLabel(
                                d.chapters.map((id) => chapterInventory[id]),
                              )
                            : t.noReadingLogged}
                          <small>
                            {fixed
                              ? bible52Position(d.day, lang)
                              : `${t.day} ${d.day + 1}`}{" "}
                            · {fmt(d.date)}
                          </small>
                        </span>
                        <strong>{readingTime(d.seconds, lang)}</strong>
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
                  <PushControls
                    time={state.config.time}
                    timezone={state.config.timezone}
                    lang={lang}
                  />
                  <hr />
                  <details className="method">
                    <summary>{t.calendar}</summary>
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
                  </details>
                </section>
                <div className="settings-stack">
                  {fixed ? (
                    <section className="panel settings-card">
                      <h2>Bibelleseplan 52</h2>
                      <p>{f.description}</p>
                      <p className="muted">{f.fixed}</p>
                    </section>
                  ) : (
                    <EditionControl
                      state={state}
                      lang={lang}
                      busy={busy}
                      onChange={(edition) =>
                        mutate({ action: "edition", edition })
                      }
                      onReviewed={() =>
                        void mutate({ action: "review-edition" })
                      }
                    />
                  )}
                  <PlanManagement
                    onEditDeadline={() => setChangingDeadline(true)}
                    state={state}
                    lang={lang}
                    busy={busy}
                    mutate={mutate}
                  />
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
                      disabled={busy}
                      onValueChange={(v) => void changeLanguage(v as Lang)}
                    >
                      <SelectTrigger
                        aria-label={t.language}
                        className="w-full mt-5"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {languageCodes.map((code) => (
                          <SelectItem key={code} value={code}>
                            {languageLabels[code]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="fineprint">
                      {fixed ? f.fixed : e.editionHelp}
                    </p>
                    {!fixed && (
                      <details className="method">
                        <summary>{e.advanced}</summary>
                        <BookOrderControl
                          config={state.config}
                          lang={lang}
                          disabled={busy}
                          pending={state.pendingBookOrder}
                          onChange={(choice) =>
                            void mutate({ action: "book-order", choice, lang })
                          }
                        />
                      </details>
                    )}
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
                  <details className="panel settings-card">
                    <summary>{t.installTitle}</summary>
                    <InstallControls
                      lang={lang}
                      offline={offlineSupport}
                      busy={busy}
                    />
                  </details>
                  <section className="panel settings-card">
                    <p className="muted">{editionName(state?.config ?? {})}</p>
                    <button
                      className="text-button"
                      onClick={() => setReset(true)}
                    >
                      <RotateCcw size={16} />
                      {t.newPlan}
                    </button>
                    <details className="method">
                      <summary>{t.explain}</summary>
                      <p>{e.approxWeights}</p>
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
      {changingDeadline && state && !fixed && (
        <DeadlineDialog
          state={state}
          lang={lang}
          busy={busy}
          onClose={() => setChangingDeadline(false)}
          onSave={async (end) => {
            const updated = await mutate({ action: "deadline", end });
            if (updated) {
              setSelected(null);
              setPage(
                Math.floor(
                  dayIndex(updated.config, today(updated.config.timezone)) / 14,
                ),
              );
              setMessage("deadline");
            }
            return updated;
          }}
        />
      )}
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
            <AlertDialogTitle>{e.finish}</AlertDialogTitle>
            <AlertDialogDescription>
              {fixed ? f.finish : t.finishExplanation}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {unusual && (
            <div className="warning">
              <p>{e.outlier}</p>
              <label className="together-choice">
                <input
                  type="checkbox"
                  checked={confirmPace}
                  onChange={(ev) => setConfirmPace(ev.target.checked)}
                />
                <span>{e.confirmPace}</span>
              </label>
            </div>
          )}
          <div className="chapter-checklist finish-checklist">
            {sessionItems.map((c) => (
              <label className="chapter-row" key={c.id}>
                <Checkbox
                  checked={!!doneSet[c.id]}
                  disabled={busy || (fixed && priorIds.includes(c.id))}
                  onCheckedChange={(v) =>
                    void mutate({
                      action: "chapter",
                      chapter: c.id,
                      done: v === true,
                    })
                  }
                />
                <span>{readLabel([c])}</span>
              </label>
            ))}
          </div>
          <button
            className="text-button"
            disabled={busy}
            onClick={() => {
              setFinishing(false);
              setCorrectSeconds(seconds);
              setEditing(true);
            }}
          >
            <Pencil size={16} />
            {t.editTime}
          </button>
          <div className="finish-summary">
            <strong>
              {sessionItems.filter((c) => doneSet[c.id]).length}{" "}
              {t.chaptersChecked}
            </strong>
            <p>
              {remainingChapters} {t.chaptersRemaining}
            </p>
            {fixed ? (
              <p>{f.original}</p>
            ) : remainingChapters === 0 ? (
              <p>{t.completePlan}</p>
            ) : remainingDays > 0 ? (
              <p>
                {remainingDays} {t.daysRemaining} · {t.approx}{" "}
                {readingTime(
                  estimatedSeconds(
                    remainingWords / remainingDays,
                    finishingPace,
                  ),
                  lang,
                )}{" "}
                {timeText.daily}
              </p>
            ) : (
              <p className="warning">{t.noDaysRemaining}</p>
            )}
            {!fixed && days.length > 0 && (
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
              {busy ? t.saving : fixed ? f.save : t.finishAndReplan}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {editing && (
        <TimeCorrectionDialog
          seconds={correctSeconds}
          lang={lang}
          busy={busy}
          onClose={() => setEditing(false)}
          onSave={async (value) =>
            day &&
            mutate({ action: "correct", day: day.index, minutes: value / 60 })
          }
        />
      )}
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
