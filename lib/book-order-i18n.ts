import type { Lang } from "./languages";

const de = {
  title: "Buchreihenfolge deiner Papierbibel",
  auto: "Automatisch zur Bibelausgabe",
  western: "Nach Apostelgeschichte: Römer",
  eastern: "Nach Apostelgeschichte: Jakobus",
  help: "Deutsch und Englisch: Römer zuerst. Russisch und Ukrainisch: Jakobus zuerst, wie in verbreiteten Synodal- und Ohijenko-Ausgaben. Wähle bei einer anderen Druckausgabe die passende Reihenfolge selbst.",
  applied: "Diese Buchreihenfolge ist eingestellt:",
  preview: "Reihenfolge der Bücher anzeigen",
  planning:
    "Die Buchreihenfolge gilt für fortlaufende Pläne, die Stränge des gemischten Plans und die Kapitelauswahl. Chronologische Pläne behalten ihre geschichtliche Reihenfolge.",
  pending:
    "Die neue Buchreihenfolge wird übernommen, sobald du den laufenden Timer pausierst oder die Leseeinheit beendest. Deine aktuelle Empfehlung bleibt bis dahin bestehen.",
  numbering:
    "Kapitelzählung: Schlachter 2000, 66 Bücher. Abweichende Psalm- und Verszählungen anderer Ausgaben werden noch nicht umgerechnet. Die Auswahl hier ändert nur die Buchreihenfolge.",
};
type Labels = { [K in keyof typeof de]: string };
const ru: Labels = {
  title: "Порядок книг в твоей печатной Библии",
  auto: "Автоматически по переводу",
  western: "После Деяний: Римлянам",
  eastern: "После Деяний: Иакова",
  help: "Немецкий и английский: сначала Римлянам. Русский и украинский: сначала Иакова, как в распространённых изданиях Синодального перевода и перевода Огиенко. Для другого издания выбери подходящий порядок вручную.",
  applied: "Выбранный порядок книг:",
  preview: "Показать порядок книг",
  planning:
    "Этот порядок используется в последовательном плане, внутри потоков смешанного плана и при выборе глав. Хронологический план сохраняет историческую последовательность.",
  pending:
    "Новый порядок применится после паузы таймера или завершения сеанса. До этого текущая рекомендация сохранится.",
  numbering:
    "Нумерация глав: Schlachter 2000, 66 книг. Отличия в нумерации псалмов и стихов других изданий пока не пересчитываются. Здесь меняется только порядок книг.",
};
const en: Labels = {
  title: "Book order in your paper Bible",
  auto: "Follow the Bible edition",
  western: "After Acts: Romans",
  eastern: "After Acts: James",
  help: "German and English: Romans first. Russian and Ukrainian: James first, as in common Synodal and Ohienko editions. Choose the matching order manually if your printed edition differs.",
  applied: "Selected book order:",
  preview: "Show book order",
  planning:
    "Book order applies to sequential plans, the streams in mixed plans and chapter selection. Chronological plans retain their historical sequence.",
  pending:
    "The new book order will apply when you pause the timer or finish the session. Your current recommendation stays in place until then.",
  numbering:
    "Chapter numbering: Schlachter 2000, 66 books. Different psalm and verse numbering in other editions is not converted yet. This setting only changes book order.",
};
const uk: Labels = {
  title: "Порядок книг у твоїй паперовій Біблії",
  auto: "Автоматично за перекладом",
  western: "Після Дій: До Римлян",
  eastern: "Після Дій: Якова",
  help: "Німецька й англійська: спочатку До Римлян. Російська й українська: спочатку Якова, як у поширених виданнях Синодального перекладу та перекладу Огієнка. Для іншого видання обери відповідний порядок вручну.",
  applied: "Обраний порядок книг:",
  preview: "Показати порядок книг",
  planning:
    "Цей порядок діє для послідовного плану, всередині потоків змішаного плану та під час вибору розділів. Хронологічний план зберігає історичну послідовність.",
  pending:
    "Новий порядок буде застосовано після паузи таймера або завершення сеансу. До того поточна рекомендація залишиться незмінною.",
  numbering:
    "Нумерація розділів: Schlachter 2000, 66 книг. Відмінності в нумерації псалмів і віршів інших видань поки не перераховуються. Тут змінюється лише порядок книг.",
};
export const bookOrderTranslations: Record<Lang, Labels> = { de, ru, en, uk };
export const bookOrderText = (lang: Lang) => bookOrderTranslations[lang];
