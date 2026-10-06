import { z } from "zod";
import { languageCodes } from "./languages";
import { bookOrders } from "./book-order";
import { configSchema, previousSchema } from "./actions";
import {
  isBible52,
  bible52Units,
  bible52ChapterUnit,
  duration,
  dateAt,
  isoDate,
  scopeChapters,
  orderedChapters,
} from "./planner";
import type { ReadingState } from "./state";
import type { Lang } from "./i18n";
import { prepareState } from "./adaptive";

const timestamp = z
  .string()
  .max(40)
  .refine((v) => Number.isFinite(Date.parse(v)));
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (v) => Number.isFinite(dateAt(v).getTime()) && isoDate(dateAt(v)) === v,
  );
const stateSchema = z
  .object({
    id: z.string().uuid(),
    chapterSchema: z.literal(2).optional(),
    chapterCorrection: z
      .object({
        previouslyRead: z
          .array(z.string().regex(/^(JOL [1-3]|MAL [1-4])$/))
          .max(7),
        done: z.record(z.string().regex(/^(JOL [1-3]|MAL [1-4])$/), date),
        samples: z
          .array(
            z
              .object({
                day: z.number().int().min(0).max(3649),
                references: z
                  .array(z.string().regex(/^[1-3A-Z]{3} [1-9]\d{0,2}$/))
                  .max(1189),
                seconds: z
                  .number()
                  .int()
                  .positive()
                  .max(Number.MAX_SAFE_INTEGER),
              })
              .strict(),
          )
          .max(1189),
      })
      .strict()
      .optional(),
    editionReview: z.array(z.string().max(200)).max(10000).optional(),
    sessions: z
      .array(
        z
          .object({
            id: z.string().max(100),
            day: z.number().int().min(0).max(3649),
            date,
            chapters: previousSchema,
            seconds: z.number().int().min(0).max(315576000),
          })
          .strict(),
      )
      .max(100000)
      .optional(),
    config: configSchema,
    lang: z.enum(languageCodes),
    pendingBookOrder: z.enum(bookOrders).optional(),
    previouslyRead: previousSchema.optional(),
    completionDays: z
      .record(
        z
          .string()
          .regex(/^(0|[1-9]\d{0,3})$/)
          .refine((v) => Number(v) < 1189),
        z.number().int().min(0).max(3649),
      )
      .optional(),
    done: z.record(
      z
        .string()
        .regex(/^(0|[1-9]\d{0,3})$/)
        .refine((v) => Number(v) < 1189),
      date,
    ),
    logs: z
      .array(
        z
          .object({
            day: z.number().int().min(0).max(3649),
            seconds: z.number().int().min(0).max(315576000),
            at: timestamp,
            readingDate: date.optional(),
          })
          .strict(),
      )
      .max(100000),
    timer: z.null(),
    ops: z.array(z.string().uuid()).max(20),
    pace: z
      .object({
        samples: z
          .array(
            z
              .object({
                day: z.number().int().min(0).max(3649),
                review: z.enum(["confirmed", "excluded"]).optional(),
                chapters: z
                  .array(z.number().int().min(0).max(1188))
                  .min(1)
                  .max(1189),
                seconds: z
                  .number()
                  .int()
                  .positive()
                  .max(Number.MAX_SAFE_INTEGER),
              })
              .strict(),
          )
          .max(1189),
        draft: z
          .object({
            day: z.number().int().min(0).max(3649),
            before: z.array(z.number().int().min(0).max(1188)).max(1189),
            secondsBefore: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
            manual: z.boolean().optional(),
          })
          .strict()
          .nullable(),
      })
      .strict()
      .optional(),
    adaptive: z
      .object({
        date,
        unplanned: previousSchema.optional(),
        days: z
          .array(z.array(z.number().int().min(0).max(1188)).max(1189))
          .max(3650),
        finished: z.array(z.number().int().min(0).max(3649)).max(3650),
        extra: z.record(
          z.string().regex(/^(0|[1-9]\d{0,3})$/),
          z.array(z.number().int().min(0).max(1188)).max(1189),
        ),
      })
      .strict()
      .optional(),
  })
  .strict();
const schema = z
  .object({
    app: z.literal("leseweg"),
    version: z.union([
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(4),
      z.literal(5),
      z.literal(6),
      z.literal(7),
      z.literal(8),
    ]),
    exportedAt: timestamp,
    theme: z.enum(["light", "dark"]),
    state: stateSchema,
  })
  .strict();
export type Backup = z.infer<typeof schema>;
export const maxBackupBytes = 12 * 1024 * 1024;

export function parseBackup(raw: string): Backup {
  if (raw.length > maxBackupBytes) throw Error("backup");
  const backup = schema.parse(JSON.parse(raw));
  if (backup.version >= 6 && backup.state.chapterSchema !== 2)
    throw Error("backup");
  const days = duration(backup.state.config);
  const expected = new Set(scopeChapters(backup.state.config).map((c) => c.id));
  const previous = new Set(backup.state.previouslyRead ?? []);
  if (
    [...previous].some((id) => !expected.has(id) || backup.state.done[id]) ||
    Object.keys(backup.state.done).some((id) => !expected.has(Number(id)))
  )
    throw Error("backup");
  if (backup.state.logs.some((log) => log.day >= days)) throw Error("backup");
  if (
    Object.entries(backup.state.completionDays ?? {}).some(
      ([id, day]) => !backup.state.done[id] || day >= days,
    )
  )
    throw Error("backup");
  if (
    backup.state.sessions &&
    (new Set(backup.state.sessions.map((s) => s.id)).size !==
      backup.state.sessions.length ||
      backup.state.sessions.some(
        (s) => s.day >= days || s.chapters.some((id) => !expected.has(id)),
      ))
  )
    throw Error("backup");
  const pace = backup.state.pace;
  if (pace) {
    const ids = pace.samples.flatMap((sample) => sample.chapters);
    if (
      new Set(ids).size !== ids.length ||
      ids.some((id) => !backup.state.done[id]) ||
      pace.samples.some((sample) => sample.day >= days) ||
      (pace.draft &&
        (pace.draft.day >= days ||
          new Set(pace.draft.before).size !== pace.draft.before.length))
    )
      throw Error("backup");
  }
  const adaptive = backup.state.adaptive;
  if (isBible52(backup.state.config)) {
    const s = backup.state;
    if (
      backup.version < 8 ||
      s.chapterSchema !== 2 ||
      !s.sessions ||
      !s.pace ||
      !s.completionDays ||
      s.pendingBookOrder ||
      !adaptive ||
      adaptive.unplanned?.length ||
      Object.keys(adaptive.extra).length ||
      bible52Units.some((u) => {
        const expected = u.chapters
          .filter((c) => !previous.has(c.id))
          .map((c) => c.id);
        return (
          JSON.stringify(adaptive.days[u.index]) !== JSON.stringify(expected)
        );
      }) ||
      Object.keys(s.done).some(
        (id) => s.completionDays?.[id] !== bible52ChapterUnit[Number(id)],
      ) ||
      adaptive.finished.some(
        (day) =>
          !bible52Units[day]?.chapters.every(
            (c) => previous.has(c.id) || s.done[c.id],
          ),
      ) ||
      [...(s.sessions ?? []), ...(s.pace?.samples ?? [])].some((sample) =>
        sample.chapters.some((id) => bible52ChapterUnit[id] !== sample.day),
      )
    )
      throw Error("backup");
  }
  if (adaptive) {
    const ids = adaptive.days.flat();
    const pending = adaptive.unplanned ?? [];
    const scheduled = [...ids, ...pending];
    if (
      scheduled.some((id) => !expected.has(id) || previous.has(id)) ||
      new Set(scheduled).size !== scheduled.length ||
      pending.some((id) => backup.state.done[id]) ||
      Object.values(adaptive.extra)
        .flat()
        .some((id) => !expected.has(id) || previous.has(id))
    )
      throw Error("backup");
    // Version 4 records overdue chapters explicitly. Legacy files can lack that
    // list; their remaining chapters are recovered by redistribution as before.
    if (backup.version >= 4) {
      const accounted = new Set([
        ...previous,
        ...Object.keys(backup.state.done).map(Number),
        ...scheduled,
        ...Object.values(adaptive.extra).flat(),
      ]);
      if (accounted.size !== expected.size) throw Error("backup");
      // A reopened unit can contain a newly unchecked chapter only in extra.
      // Recommendations stay stable until completion, so compare the scheduled
      // subsequence, not that temporarily detached chapter's absolute position.
      const scheduledIds = new Set(scheduled);
      const unread = orderedChapters(backup.state.config)
        .filter((c) => scheduledIds.has(c.id) && !backup.state.done[c.id])
        .map((c) => c.id);
      const assigned = scheduled.filter((id) => !backup.state.done[id]);
      if (
        backup.state.chapterSchema === 2 &&
        unread.some((id, index) => assigned[index] !== id)
      )
        throw Error("backup");
    }
    if (
      adaptive.days.length !== days ||
      ids.length !== new Set(ids).size ||
      adaptive.finished.some((day) => day >= days) ||
      Object.entries(adaptive.extra).some(
        ([day, extra]) =>
          Number(day) >= days || new Set(extra).size !== extra.length,
      )
    )
      throw Error("backup");
  }
  if (backup.state.chapterSchema !== 2)
    backup.state = {
      ...prepareState(
        backup.state,
        backup.state.adaptive?.date ?? backup.state.config.start,
      ),
      timer: null,
    };
  return backup;
}

export function makeBackup(
  state: ReadingState,
  lang: Lang,
  theme: string,
  now = Date.now(),
) {
  const snapshot = structuredClone(
    state.chapterSchema === 2
      ? state
      : prepareState(state, state.adaptive?.date ?? state.config.start),
  );
  // A backup records elapsed time at export, never a timer that keeps running
  // for days until the file is restored on another device.
  if (snapshot.timer) {
    const seconds = Math.max(
      0,
      Math.floor((now - snapshot.timer.startedAt) / 1000),
    );
    if (seconds)
      snapshot.logs.push({
        day: snapshot.timer.day,
        readingDate: new Intl.DateTimeFormat("en-CA", {
          timeZone: snapshot.config.timezone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(snapshot.timer.startedAt),
        seconds,
        at: new Date(now).toISOString(),
      });
  }
  if (snapshot.adaptive) {
    const accounted = new Set([
      ...(snapshot.previouslyRead ?? []),
      ...Object.keys(snapshot.done).map(Number),
      ...snapshot.adaptive.days.flat(),
      ...Object.values(snapshot.adaptive.extra).flat(),
    ]);
    snapshot.adaptive.unplanned = orderedChapters(snapshot.config)
      .filter((c) => !accounted.has(c.id))
      .map((c) => c.id);
  }
  snapshot.timer = null;
  snapshot.ops = [];
  snapshot.lang = lang;
  return JSON.stringify(
    {
      app: "leseweg",
      version: 8,
      exportedAt: new Date(now).toISOString(),
      theme: theme === "dark" ? "dark" : "light",
      state: snapshot,
    },
    null,
    2,
  );
}
