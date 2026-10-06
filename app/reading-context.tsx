import {
  historicalGroups,
  passage,
  type Chapter,
  type Config,
} from "@/lib/planner";
import { bookNames, type Lang } from "@/lib/i18n";
import { planText } from "@/lib/plan-i18n";
export default function ReadingContext({
  config,
  items,
  lang,
}: {
  config: Config;
  items: Chapter[];
  lang: Lang;
}) {
  if (config.order !== "chronological") return null;
  const ids = new Set(items.map((c) => c.id));
  const groups = historicalGroups.filter(
    (group) => group.kind && group.chapters.some((c) => ids.has(c.id)),
  );
  if (!groups.length) return null;
  const p = planText(lang),
    names = bookNames(lang);
  return (
    <details className="reading-context">
      <summary>{p.why}</summary>
      {groups.map((group) => (
        <div key={group.id}>
          <strong>{passage(group.chapters, names)}</strong>
          <p>{p[group.kind!]}</p>
        </div>
      ))}
      <p className="fineprint">{p.contextNote}</p>
    </details>
  );
}
