import { sessionsFor, logDate } from "./session-stats";
import { changeEdition } from "./edition-migration";
import { editionIds, editions, languageEdition } from "./editions";
import { z } from "zod";
import { languageCodes } from "./languages";
import { bookOrders, languageBookOrder } from "./book-order";
import {
  isBible52,
  bible52Config,
  bible52Units,
  bible52ChapterUnit,
  createPlan,
  today,
  scopeChapters,
  duration,
  dateAt,
  addDays,
} from "./planner";
import {
  prepareState,
  dayIndex,
  redistribute,
  nextExtraChapter,
  completionDay,
} from "./adaptive";
import type { ReadingState } from "./state";
import {
  paceState,
  startPace,
  finishPace,
  correctPace,
  forgetPaceChapter,
} from "./pace";
export const configSchema = z
  .object({
    template: z.literal("bible52").optional(),
    edition: z.enum(editionIds).optional(),
    scope: z.enum(["bible", "ot", "nt"]).optional(),
    order: z.enum(["canonical", "chronological", "mixed"]).optional(),
    keepTogether: z.boolean().optional(),
    bookOrder: z.enum(bookOrders).optional(),
    bookOrderMode: z.enum(["auto", "manual"]).optional(),
    amount: z.number().int().min(1).max(3650),
    unit: z.enum(["days", "weeks", "months"]),
    start: z.string(),
    time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    timezone: z
      .string()
      .max(100)
      .refine((v) => {
        try {
          new Intl.DateTimeFormat("en", { timeZone: v });
          return true;
        } catch {
          return false;
        }
      }),
  })
  .strict();
export const previousSchema = z
  .array(z.number().int().min(0).max(1188))
  .max(1189)
  .refine((ids) => new Set(ids).size === ids.length);
const requestSchema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("review-pace"),
      index: z.number().int().min(0).max(1188),
      seconds: z.number().int().positive(),
      review: z.enum(["auto", "confirmed", "excluded"]),
      planId: z.string(),
      opId: z.string().uuid(),
    })
    .strict(),
  z
    .object({
      action: z.literal("edition"),
      edition: z.enum(editionIds),
      planId: z.string(),
      opId: z.string().uuid(),
    })
    .strict(),
  z
    .object({
      action: z.literal("review-edition"),
      planId: z.string(),
      opId: z.string().uuid(),
    })
    .strict(),
  z
    .object({
      action: z.literal("language"),
      lang: z.enum(languageCodes),
      planId: z.string(),
      opId: z.string().uuid(),
    })
    .strict(),
  z
    .object({
      action: z.literal("book-order"),
      choice: z.enum(["auto", ...bookOrders]),
      lang: z.enum(languageCodes),
      planId: z.string(),
      opId: z.string().uuid(),
    })
    .strict(),
  z
    .object({
      action: z.literal("previous"),
      previouslyRead: previousSchema,
      planId: z.string(),
      opId: z.string().uuid(),
    })
    .strict(),
  z
    .object({
      action: z.literal("deadline"),
      end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      planId: z.string(),
      opId: z.string().uuid(),
    })
    .strict(),
  z
    .object({
      action: z.enum(["extend", "reopen"]),
      day: z.number().int().min(0).max(3649),
      planId: z.string(),
      opId: z.string().uuid(),
    })
    .strict(),
  z
    .object({
      action: z.literal("create"),
      config: configSchema,
      previouslyRead: previousSchema.optional(),
      lang: z.enum(languageCodes),
      planId: z.string().nullable(),
      opId: z.string().uuid(),
    })
    .strict(),
  z
    .object({
      action: z.literal("chapter"),
      chapter: z.number().int().min(0).max(1188),
      done: z.boolean(),
      planId: z.string(),
      opId: z.string().uuid(),
    })
    .strict(),
  z
    .object({
      action: z.literal("complete"),
      paceChoice: z.enum(["confirmed", "excluded"]).optional(),
      day: z.number().int().min(0).max(3649),
      planId: z.string(),
      opId: z.string().uuid(),
    })
    .strict(),
  z
    .object({
      action: z.literal("timer"),
      mode: z.enum(["start", "pause", "stop"]),
      day: z.number().int().min(0).max(3649),
      planId: z.string(),
      opId: z.string().uuid(),
    })
    .strict(),
  z
    .object({
      action: z.literal("correct"),
      day: z.number().int().min(0).max(3649),
      minutes: z.number().min(0).max(1440),
      planId: z.string(),
      opId: z.string().uuid(),
    })
    .strict(),
  z
    .object({
      action: z.literal("settings"),
      time: configSchema.shape.time,
      timezone: configSchema.shape.timezone,
      lang: z.enum(languageCodes),
      planId: z.string(),
      opId: z.string().uuid(),
    })
    .strict(),
]);

export function applyAction(
  current: ReadingState | null,
  raw: unknown,
  now = Date.now(),
): ReadingState {
  const op = requestSchema.parse(raw);
  let state = current ? structuredClone(current) : null;
  if (state) state = prepareState(state, today(state.config.timezone, now));
  if (state?.ops.includes(op.opId)) return state;
  if (state) state.pace = paceState(state);
  if (op.action === "create") {
    if ((state?.id ?? null) !== op.planId) throw Error("stale");
    if (isBible52(op.config)) op.config = bible52Config(op.config);
    op.config.edition ??= languageEdition(op.lang);
    // Each new plan pins a concrete edition; older stored plans retain their basis.
    if (op.config.bookOrderMode === "auto")
      op.config.bookOrder = op.config.edition
        ? editions[op.config.edition].order
        : languageBookOrder(op.lang);
    try {
      createPlan(op.config, op.previouslyRead);
    } catch {
      throw Error("invalid");
    }
    state = {
      id: crypto.randomUUID(),
      chapterSchema: 2,
      config: op.config,
      lang: op.lang,
      done: {},
      ...(isBible52(op.config) ? { completionDays: {} } : {}),
      previouslyRead: op.previouslyRead ?? [],
      sessions: [],
      logs: [],
      timer: null,
      ops: [],
      pace: { samples: [], draft: null },
    };
  } else {
    if (!state || state.id !== op.planId) throw Error("stale");
    const fixed = isBible52(state.config);
    if (
      fixed &&
      ["edition", "book-order", "deadline", "extend"].includes(op.action)
    )
      throw Error("invalid");
    const openUnit = state.timer?.day ?? state.pace?.draft?.day;
    const requestedUnit =
      op.action === "chapter"
        ? bible52ChapterUnit[op.chapter]
        : "day" in op
          ? op.day
          : undefined;
    if (
      fixed &&
      openUnit !== undefined &&
      (op.action === "previous" ||
        (["chapter", "timer", "complete", "reopen", "correct"].includes(
          op.action,
        ) &&
          requestedUnit !== openUnit))
    )
      throw Error("timer");
    state.sessions = sessionsFor(state);
    const days = createPlan(state.config, state.previouslyRead);
    if ("day" in op && op.day >= days.length) throw Error("invalid");
    const date = today(state.config.timezone, now);
    const currentDay = dayIndex(state.config, date);
    if (op.action === "timer" && state.timer && state.timer.day !== op.day)
      throw Error("timer");
    if (
      !fixed &&
      "day" in op &&
      op.action !== "correct" &&
      op.day !== currentDay &&
      state.timer?.day !== op.day
    )
      throw Error("day");
    function stop() {
      if (!state?.timer) return;
      const seconds = Math.max(
        0,
        Math.floor((now - state.timer.startedAt) / 1000),
      );
      if (seconds)
        state.logs.push({
          day: state.timer.day,
          readingDate: today(state.config.timezone, state.timer.startedAt),
          seconds,
          at: new Date(now).toISOString(),
        });
      state.timer = null;
    }
    if (op.action === "review-pace") {
      const sample = state.pace!.samples[op.index];
      if (!sample || sample.seconds !== op.seconds) throw Error("stale");
      if (op.review === "auto") delete sample.review;
      else sample.review = op.review;
    }
    if (op.action === "edition") {
      if (state.timer) throw Error("timer");
      changeEdition(state, op.edition);
      state = prepareState(state, date);
    }
    if (op.action === "review-edition") delete state.editionReview;
    if (op.action === "previous") {
      if (state.timer) throw Error("timer");
      const allowed = new Set(scopeChapters(state.config).map((c) => c.id));
      if (op.previouslyRead.some((id) => !allowed.has(id) || state!.done[id]))
        throw Error("invalid");
      state.previouslyRead = op.previouslyRead;
      if (fixed) {
        // Confirming prior progress also closes mixed units containing chapters
        // already measured in the app; they need no empty completion session.
        const previous = new Set(op.previouslyRead);
        state.adaptive!.finished = bible52Units
          .filter((u) =>
            u.chapters.every((c) => previous.has(c.id) || state!.done[c.id]),
          )
          .map((u) => u.index);
      }
      redistribute(
        state,
        currentDay + (state.adaptive!.finished.includes(currentDay) ? 1 : 0),
        date,
      );
    }
    if (op.action === "deadline") {
      if (state.timer) throw Error("timer");
      if (op.end < date || op.end < days.at(-1)!.date) throw Error("invalid");
      const config = {
        ...state.config,
        unit: "days" as const,
        amount:
          Math.round(
            (dateAt(op.end).getTime() - dateAt(state.config.start).getTime()) /
              86400000,
          ) + 1,
      };
      if (
        !Number.isFinite(config.amount) ||
        dateAt(op.end).toISOString().slice(0, 10) !== op.end
      )
        throw Error("invalid");
      duration(config);
      state.completionDays = Object.fromEntries(
        Object.keys(state.done).map((id) => [
          id,
          completionDay(state!, Number(id)),
        ]),
      );
      state.config = config;
      const newDay = dayIndex(config, date);
      redistribute(
        state,
        newDay + (state.adaptive!.finished.includes(newDay) ? 1 : 0),
        date,
      );
    }
    if (op.action === "chapter") {
      if (
        state.previouslyRead?.includes(op.chapter) ||
        !scopeChapters(state.config).some((c) => c.id === op.chapter)
      )
        throw Error("invalid");
      if (!fixed && state.adaptive!.finished.includes(currentDay))
        throw Error("finished");
      if (op.done) {
        state.done[String(op.chapter)] = date;
        if (state.completionDays)
          state.completionDays[op.chapter] = fixed
            ? bible52ChapterUnit[op.chapter]
            : currentDay;
      } else {
        if (state.completionDays) delete state.completionDays[op.chapter];
        delete state.done[String(op.chapter)];
        forgetPaceChapter(state, op.chapter);
      }
    }
    if (op.action === "complete") {
      if (state.timer && state.timer.day !== op.day) throw Error("timer");
      if (state.timer?.day === op.day) stop();
      const recorded = new Set(state.sessions!.flatMap((s) => s.chapters));
      const ids = Object.keys(state.done)
        .map(Number)
        .filter(
          (id) =>
            !recorded.has(id) && (!fixed || bible52ChapterUnit[id] === op.day),
        );
      const seconds = Math.max(
        0,
        state.logs
          .filter((l) => l.day === op.day)
          .reduce((n, l) => n + l.seconds, 0) -
          state
            .sessions!.filter((s) => s.day === op.day)
            .reduce((n, s) => n + s.seconds, 0),
      );
      if (
        !state.adaptive!.finished.includes(fixed ? op.day : currentDay) &&
        (ids.length || seconds > 0)
      )
        state.sessions!.push({
          id: op.opId,
          day: op.day,
          date:
            state.logs.filter((l) => l.day === op.day).at(-1)?.readingDate ??
            date,
          chapters: ids,
          seconds,
        });
      finishPace(state, op.day, op.paceChoice);
      if (
        !fixed ||
        bible52Units[op.day].chapters.every(
          (c) => state!.done[c.id] || state!.previouslyRead?.includes(c.id),
        )
      )
        state.adaptive!.finished = [
          ...new Set([
            ...state.adaptive!.finished,
            fixed ? op.day : currentDay,
          ]),
        ];
      redistribute(state, currentDay + 1, date);
    }
    if (op.action === "extend") {
      if (state.adaptive!.finished.includes(op.day)) throw Error("finished");
      const extra = nextExtraChapter(state, op.day);
      if (extra)
        state.adaptive!.extra[op.day] = [
          ...(state.adaptive!.extra[op.day] ?? []),
          extra.id,
        ];
    }
    if (op.action === "reopen") {
      state.adaptive!.finished = state.adaptive!.finished.filter(
        (day) => day !== op.day,
      );
      redistribute(state, currentDay, date);
    }
    if (op.action === "timer") {
      if (state.timer && state.timer.day !== op.day) throw Error("timer");
      if (op.mode === "start" && !state.timer) {
        if (state.adaptive!.finished.includes(op.day)) throw Error("finished");
        startPace(state, op.day);
        state.timer = { day: op.day, startedAt: now };
      }
      if (op.mode !== "start") stop();
    }
    if (op.action === "correct") {
      const active = state.timer?.day === op.day ? state.timer : null;
      if (active) stop();
      const oldLogs = state.logs.filter((l) => l.day === op.day);
      const oldTotal = oldLogs.reduce((n, l) => n + l.seconds, 0);
      const open =
        state.pace?.draft?.day === op.day &&
        !state.adaptive!.finished.includes(op.day);
      const sessions = state.sessions!.filter((s) => s.day === op.day);
      const total = Math.round(op.minutes * 60);
      let assigned = 0;
      sessions.forEach((s, i) => {
        const value =
          i === sessions.length - 1 && !open
            ? total - assigned
            : Math.round(
                total *
                  (oldTotal
                    ? s.seconds / oldTotal
                    : 1 / (sessions.length + (open ? 1 : 0))),
              );
        s.seconds = Math.max(0, Math.min(total - assigned, value));
        assigned += s.seconds;
      });
      const dates = new Map<string, number>();
      for (const log of oldLogs) {
        const date = logDate(state, log);
        dates.set(date, (dates.get(date) ?? 0) + log.seconds);
      }
      if (!dates.size)
        dates.set(
          active
            ? today(state.config.timezone, active.startedAt)
            : fixed
              ? date
              : addDays(state.config.start, op.day),
          0,
        );
      state.logs = state.logs.filter((l) => l.day !== op.day);
      let allocated = 0;
      [...dates].forEach(([readingDate, seconds], i) => {
        const value =
          i === dates.size - 1
            ? total - allocated
            : Math.round(
                total * (oldTotal ? seconds / oldTotal : 1 / dates.size),
              );
        const part = Math.max(0, Math.min(total - allocated, value));
        allocated += part;
        if (part)
          state!.logs.push({
            day: op.day,
            readingDate,
            seconds: part,
            at: new Date(now).toISOString(),
          });
      });
      correctPace(state, op.day);
    }
    if (op.action === "settings") {
      state.config.time = op.time;
      state.config.timezone = op.timezone;
    }
    if (fixed && (op.action === "language" || op.action === "settings"))
      state.lang = op.lang;
    if (
      !fixed &&
      (op.action === "language" ||
        (op.action === "settings" && state.lang !== op.lang) ||
        op.action === "book-order")
    ) {
      state.lang = op.lang;
      if (op.action === "book-order")
        state.config.bookOrderMode = op.choice === "auto" ? "auto" : "manual";
      // Selecting a language opts legacy plans into automatic book order.
      if (!state.config.bookOrderMode) state.config.bookOrderMode = "auto";
      const wanted =
        op.action === "book-order" && op.choice !== "auto"
          ? op.choice
          : state.config.bookOrderMode === "auto"
            ? state.config.edition
              ? editions[state.config.edition].order
              : languageBookOrder(op.lang)
            : (state.pendingBookOrder ?? state.config.bookOrder ?? "western");
      if (wanted !== (state.config.bookOrder ?? "western"))
        state.pendingBookOrder = wanted;
      else {
        delete state.pendingBookOrder;
        state.config.bookOrder = wanted;
      }
    }
  }
  state = prepareState(state, today(state.config.timezone, now));
  state.ops = [...state.ops.slice(-19), op.opId];

  return state;
}
