export function localDate(timestamp: number, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(timestamp);
  const part = (name: string) => parts.find((p) => p.type === name)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function atLocalTime(date: string, time: string, timezone: string) {
  const desired = Date.parse(`${date}T${time}:00Z`);
  let candidate = desired;
  const seen: number[] = [];
  for (let i = 0; i < 6; i++) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(candidate);
    const part = (name: string) => parts.find((p) => p.type === name)!.value;
    const local = Date.parse(
      `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}:${part("second")}Z`,
    );
    if (local === desired) return candidate;
    seen.push(candidate);
    candidate += desired - local;
    // A time skipped by a daylight-saving change is moved forward by the gap.
    if (seen.includes(candidate))
      return Math.max(candidate, ...seen.slice(seen.indexOf(candidate)));
  }
  return candidate;
}

export function nextReminder(
  after: number,
  time: string,
  timezone: string,
  lastSentDate: string | null = null,
) {
  const date = localDate(after, timezone);
  for (let day = 0; day < 3; day++) {
    const nextDate = new Date(Date.parse(`${date}T12:00:00Z`) + day * 86400000)
      .toISOString()
      .slice(0, 10);
    const due = atLocalTime(nextDate, time, timezone);
    if (due > after && nextDate !== lastSentDate) return due;
  }
  throw new Error("Unable to schedule reminder");
}
