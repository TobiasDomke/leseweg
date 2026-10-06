import { readingTime, type readingTimeSummary } from "@/lib/reading-time";
import { readingTimeText } from "@/lib/reading-time-i18n";
import { planText } from "@/lib/plan-i18n";
import { text, type Lang } from "@/lib/i18n";

export default function ReadingTimeOverview({
  summary,
  lang,
}: {
  summary: ReturnType<typeof readingTimeSummary>;
  lang: Lang;
}) {
  const t = readingTimeText(lang),
    p = planText(lang);
  return (
    <section className="panel reading-time-overview">
      <h2>{t.title}</h2>
      <dl>
        <div>
          <dt>{p.estimatedPast}</dt>
          <dd>{readingTime(summary.previousSeconds, lang)}</dd>
        </div>
        {summary.unmeasuredChapters > 0 && (
          <div>
            <dt>{t.unmeasured}</dt>
            <dd>{readingTime(summary.unmeasuredSeconds, lang)}</dd>
          </div>
        )}
        <div className="time-subtotal">
          <dt>{t.past}</dt>
          <dd>{readingTime(summary.pastSeconds, lang)}</dd>
        </div>
        <div>
          <dt>
            {t.remaining}
            <small>
              {summary.remainingChapters} {text(lang).chaptersRemaining}
            </small>
          </dt>
          <dd>{readingTime(summary.remainingSeconds, lang)}</dd>
        </div>
        <div className="time-total">
          <dt>{t.total}</dt>
          <dd>{readingTime(summary.totalSeconds, lang)}</dd>
        </div>
      </dl>
      <p className="fineprint">{t.help}</p>
      {summary.unmeasuredChapters > 0 && (
        <p className="fineprint">{t.unmeasuredHelp}</p>
      )}
    </section>
  );
}
