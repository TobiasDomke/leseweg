import { z } from "zod";
import { configSchema } from "./actions";
import { duration, dateAt, isoDate } from "./planner";
import type { ReadingState } from "./state";
import type { Lang } from "./i18n";

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
    config: configSchema,
    lang: z.enum(["de", "ru", "en"]),
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
    version: z.union([z.literal(1), z.literal(2), z.literal(3)]),
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
  const days = duration(backup.state.config);
  if (backup.state.logs.some((log) => log.day >= days)) throw Error("backup");
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
  if (adaptive) {
    const ids = adaptive.days.flat();
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
  return backup;
}

export function makeBackup(
  state: ReadingState,
  lang: Lang,
  theme: string,
  now = Date.now(),
) {
  const snapshot = structuredClone(state);
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
        seconds,
        at: new Date(now).toISOString(),
      });
  }
  snapshot.timer = null;
  snapshot.ops = [];
  snapshot.lang = lang;
  return JSON.stringify(
    {
      app: "leseweg",
      version: 3,
      exportedAt: new Date(now).toISOString(),
      theme: theme === "dark" ? "dark" : "light",
      state: snapshot,
    },
    null,
    2,
  );
}
