import { z } from "zod";
import { languageCodes } from "./languages";
import { createPlan, today } from "./planner";
import {
  prepareState,
  dayIndex,
  redistribute,
  nextExtraChapter,
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
const requestSchema = z.discriminatedUnion("action", [
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
    try {
      createPlan(op.config);
    } catch {
      throw Error("invalid");
    }
    state = {
      id: crypto.randomUUID(),
      config: op.config,
      lang: op.lang,
      done: {},
      logs: [],
      timer: null,
      ops: [],
      pace: { samples: [], draft: null },
    };
  } else {
    if (!state || state.id !== op.planId) throw Error("stale");
    const days = createPlan(state.config);
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
    if (op.action === "chapter") {
      if (state.adaptive!.finished.includes(currentDay))
        throw Error("finished");
      if (op.done) state.done[String(op.chapter)] = date;
      else {
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
      state.lang = op.lang;
    }
  }
  state = prepareState(state, today(state.config.timezone, now));
  state.ops = [...state.ops.slice(-19), op.opId];

  return state;
}
