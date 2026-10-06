import type { ReadingState } from "@/lib/state";
import { bookNames, type Lang } from "@/lib/i18n";
import books from "@/lib/bible-lengths.json";
import { chapterCorrectionText } from "@/lib/chapter-correction-i18n";
export default function ChapterCorrection({
  state,
  lang,
}: {
  state: ReadingState;
  lang: Lang;
}) {
  const correction = state.chapterCorrection;
  if (!correction) return null;
  const t = chapterCorrectionText[lang],
    names = bookNames(lang);
  const label = (ref: string) => {
    const [code, number] = ref.split(" "),
      index = books.findIndex((b) => b.code === code);
    return `${names?.[index] ?? books[index]?.name ?? code} ${number}`;
  };
  return (
    <section className="notice" aria-label={t.title}>
      <strong>{t.title}</strong>
      <p>{t.help}</p>
      <p>{t.times}</p>
      <details>
        <summary>{t.archive}</summary>
        {correction.previouslyRead.length > 0 && (
          <p>
            {t.previous}: {correction.previouslyRead.map(label).join(" · ")}
          </p>
        )}
        {Object.keys(correction.done).length > 0 && (
          <p>
            {t.done}:{" "}
            {Object.entries(correction.done)
              .map(([ref, date]) => `${label(ref)} (${date})`)
              .join(" · ")}
          </p>
        )}
        {correction.samples.length > 0 && (
          <p>
            {t.measurements}: {correction.samples.length}
          </p>
        )}
      </details>
    </section>
  );
}
