import type { Lang } from "./languages";
const de = {
  title: "Kapitelzählung berichtigt",
  help: "Schlachter 2000 hat 4 Kapitel in Joel und 3 in Maleachi. Joel 4 wurde als offen ergänzt. Deine bisherigen Häkchen wurden nach Buch und Kapitel übernommen; ein alter Eintrag für Maleachi 4 bleibt nur im Protokoll unten. Prüfe bei Bedarf deinen früheren Fortschritt in den Planeinstellungen.",
  times:
    "Alle gemessenen Zeiten bleiben gespeichert. Messungen mit betroffenen Kapiteln werden für neue Zeitschätzungen nicht mehr verwendet, weil ihre frühere Zuordnung unsicher ist.",
  archive: "Bisherige Einträge vor der Korrektur",
  previous: "Vor dem Plan gelesen",
  done: "Während des Plans gelesen",
  measurements: "Betroffene Messungen",
};
type Labels = { [K in keyof typeof de]: string };
const ru: Labels = {
  title: "Нумерация глав исправлена",
  help: "В Schlachter 2000 у Иоиля 4 главы, у Малахии — 3. Иоиль 4 добавлен как непрочитанный. Прежние отметки перенесены по книге и номеру главы; старая запись Малахии 4 сохранена только в журнале ниже. При необходимости проверь прежний прогресс в настройках плана.",
  times:
    "Всё измеренное время сохранено. Измерения с затронутыми главами больше не используются для прогнозов, поскольку их прежнее соответствие неточно.",
  archive: "Записи до исправления",
  previous: "Прочитано до плана",
  done: "Прочитано во время плана",
  measurements: "Затронутые измерения",
};
const en: Labels = {
  title: "Chapter numbering corrected",
  help: "Schlachter 2000 has 4 chapters in Joel and 3 in Malachi. Joel 4 has been added as unread. Existing checks were transferred by book and chapter; an old Malachi 4 entry remains only in the record below. Review your earlier progress in plan settings if needed.",
  times:
    "All measured time is preserved. Measurements involving affected chapters no longer train future estimates because their earlier reference mapping is uncertain.",
  archive: "Entries before the correction",
  previous: "Read before the plan",
  done: "Read during the plan",
  measurements: "Affected measurements",
};
const uk: Labels = {
  title: "Нумерацію розділів виправлено",
  help: "У Schlachter 2000 книга Йоїла має 4 розділи, Малахії — 3. Йоїла 4 додано як непрочитаний. Попередні позначки перенесено за книгою та номером розділу; старий запис Малахії 4 збережено лише в журналі нижче. За потреби перевір попередній прогрес у налаштуваннях плану.",
  times:
    "Увесь виміряний час збережено. Вимірювання із зачепленими розділами більше не впливають на прогноз, оскільки їхнє попереднє зіставлення неточне.",
  archive: "Записи до виправлення",
  previous: "Прочитано до плану",
  done: "Прочитано під час плану",
  measurements: "Зачеплені вимірювання",
};
export const chapterCorrectionText: Record<Lang, Labels> = { de, ru, en, uk };
