import { z } from "zod";
import { languageCodes } from "./languages";
import { bookOrders, languageBookOrder } from "./book-order";
import { createPlan, today, scopeChapters, duration, dateAt } from "./planner";
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
  if (state?.ops.includes(op.opId)) return state;
  if (state) state.pace = paceState(state);
  if (state) state = prepareState(state, today(state.config.timezone, now));
  if (op.action === "create") {
    if ((state?.id ?? null) !== op.planId) throw Error("stale");
    // Old callers/configs remain canonical. New setup explicitly opts in.
    if (op.config.bookOrderMode === "auto")
      op.config.bookOrder = languageBookOrder(op.lang);
    try {
      createPlan(op.config, op.previouslyRead);
    } catch {
      throw Error("invalid");
    }
    state = {
      id: crypto.randomUUID(),
      config: op.config,
      lang: op.lang,
      done: {},
      previouslyRead: op.previouslyRead ?? [],
      logs: [],
      timer: null,
      ops: [],
      pace: { samples: [], draft: null },
    };
  } else {
    if (!state || state.id !== op.planId) throw Error("stale");
    const days = createPlan(state.config, state.previouslyRead);
    if ("day" in op && op.day >= days.length) throw Error("invalid");
    const date = today(state.config.timezone, now);
    const currentDay = dayIndex(state.config, date);
    if (op.action === "timer" && state.timer && state.timer.day !== op.day)
      throw Error("timer");
    if (
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
          seconds,
          at: new Date(now).toISOString(),
        });
      state.timer = null;
    }
    if (op.action === "previous") {
      if (state.timer) throw Error("timer");
      const allowed = new Set(scopeChapters(state.config).map((c) => c.id));
      if (op.previouslyRead.some((id) => !allowed.has(id) || state!.done[id]))
        throw Error("invalid");
      state.previouslyRead = op.previouslyRead;
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
      if (state.adaptive!.finished.includes(currentDay))
        throw Error("finished");
      if (op.done) {
        state.done[String(op.chapter)] = date;
        if (state.completionDays) state.completionDays[op.chapter] = currentDay;
      } else {
        if (state.completionDays) delete state.completionDays[op.chapter];
        delete state.done[String(op.chapter)];
        forgetPaceChapter(state, op.chapter);
      }
    }
    if (op.action === "complete") {
      if (state.timer && state.timer.day !== op.day) throw Error("timer");
      if (state.timer?.day === op.day) stop();
      finishPace(state, op.day);
      state.adaptive!.finished = [
        ...new Set([...state.adaptive!.finished, currentDay]),
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
      if (state.timer?.day === op.day) state.timer = null;
      state.logs = state.logs.filter((l) => l.day !== op.day);
      if (op.minutes > 0)
        state.logs.push({
          day: op.day,
          seconds: Math.round(op.minutes * 60),
          at: new Date(now).toISOString(),
        });
      correctPace(state, op.day);
    }
    if (op.action === "settings") {
      state.config.time = op.time;
      state.config.timezone = op.timezone;
    }
    if (
      op.action === "language" ||
      (op.action === "settings" && state.lang !== op.lang) ||
      op.action === "book-order"
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
            ? languageBookOrder(op.lang)
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
