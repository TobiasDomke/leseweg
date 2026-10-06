import type { Lang } from "./i18n";
const translations = {
  de: {
    type: "Plan auswählen",
    flexible: "Individueller Leseplan",
    flexibleHelp:
      "Zeitraum und Reihenfolge wählen; die Tagesmenge passt sich deinem Fortschritt an.",
    description: "52 Wochen · 7 feste Abschnitte pro Woche · von Peter Treu",
    fixed:
      "Die Abschnitte, Reihenfolge und deutschen Bibelstellen bleiben wie in der Vorlage – in jeder App-Sprache. Grundlage: Schlachter 2000, alle 66 Bücher und 1.189 Kapitel genau einmal.",
    week: "Woche",
    unit: "Abschnitt",
    wholeWeek: "Ganze Woche als gelesen markieren",
    progress: "Bereits gelesen",
    progressHelp:
      "Hake ganze Wochen ab oder öffne eine Woche und wähle einzelne Bibelstellen. Bereits gelesene Kapitel zählen zum Fortschritt; ihre Lesezeit wird geschätzt.",
    all: "Alle Wochen markieren",
    none: "Auswahl aufheben",
    next: "Zum nächsten offenen Abschnitt",
    saved: "Abschnitt gespeichert",
    save: "Leseeinheit speichern",
    finish:
      "Markiere die tatsächlich gelesenen Kapitel. Ungelesene Kapitel bleiben in diesem Abschnitt; die Vorlage wird nicht neu aufgeteilt.",
    start: "Beginn der ersten Planwoche",
    startHelp:
      "Wenn du schon begonnen hast, trage deinen ursprünglichen Start ein. Du kannst jederzeit jeden offenen Abschnitt lesen, unabhängig vom Kalenderdatum.",
    open: "Beende zuerst deine offene Leseeinheit, bevor du in einem anderen Abschnitt weiterliest.",
    resume: "Zur offenen Leseeinheit",
    minutes: "Gesamte Minuten dieses Abschnitts",
    complete: "gelesen",
    partial: "teilweise gelesen",
    remaining: "Noch offen",
    sections: "Abschnitte",
    original: "Feste Einteilung nach der Vorlage von Peter Treu",
    selectHelp: "Wähle eine Woche, um ihre sieben Bibelstellen zu öffnen.",
  },
  en: {
    type: "Choose a plan",
    flexible: "Personal reading plan",
    flexibleHelp:
      "Choose your duration and order; daily portions adapt to your progress.",
    description: "52 weeks · 7 fixed units per week · by Peter Treu",
    fixed:
      "Units, order and German Bible references stay exactly as in the template, in every app language. Based on Schlachter 2000: all 66 books and 1,189 chapters exactly once.",
    week: "Week",
    unit: "Unit",
    wholeWeek: "Mark the whole week as read",
    progress: "Already read",
    progressHelp:
      "Check entire weeks or expand a week to select individual passages. Previously read chapters count towards progress; their reading time is estimated.",
    all: "Select all weeks",
    none: "Clear selection",
    next: "Next unfinished unit",
    saved: "Unit saved",
    save: "Save reading session",
    finish:
      "Check the chapters you actually read. Unread chapters stay in this unit; the template is not redistributed.",
    start: "Start of the first plan week",
    startHelp:
      "If you have already started, enter your original start date. You can read any unfinished unit at any time, regardless of the calendar date.",
    open: "Finish your open reading session before continuing in another unit.",
    resume: "Return to open session",
    minutes: "Total minutes for this unit",
    complete: "read",
    partial: "partly read",
    remaining: "Unread",
    sections: "units",
    original: "Fixed arrangement from Peter Treu’s template",
    selectHelp: "Open a week to see its seven passages.",
  },
  ru: {
    type: "Выберите план",
    flexible: "Индивидуальный план",
    flexibleHelp:
      "Выберите срок и порядок; объём чтения на день подстраивается под ваш прогресс.",
    description: "52 недели · 7 фиксированных разделов в неделю · Петер Трой",
    fixed:
      "Разделы, порядок и немецкие названия библейских отрывков сохраняются как в оригинале при любом языке приложения. Основа: Schlachter 2000, все 66 книг и 1189 глав ровно по одному разу.",
    week: "Неделя",
    unit: "Раздел",
    wholeWeek: "Отметить всю неделю прочитанной",
    progress: "Уже прочитано",
    progressHelp:
      "Отмечайте целые недели или раскрывайте неделю и выбирайте отдельные отрывки. Прочитанные ранее главы учитываются в прогрессе; время их чтения оценивается приблизительно.",
    all: "Выбрать все недели",
    none: "Снять выбор",
    next: "Следующий непрочитанный раздел",
    saved: "Раздел сохранён",
    save: "Сохранить чтение",
    finish:
      "Отметьте прочитанные главы. Непрочитанные главы остаются в этом разделе; план не перераспределяется.",
    start: "Начало первой недели плана",
    startHelp:
      "Если вы уже начали, укажите первоначальную дату. Любой незавершённый раздел можно читать в любое время независимо от календаря.",
    open: "Завершите открытое чтение, прежде чем переходить к другому разделу.",
    resume: "К открытому чтению",
    minutes: "Всего минут на этот раздел",
    complete: "прочитано",
    partial: "частично прочитано",
    remaining: "Не прочитано",
    sections: "разделов",
    original: "Фиксированное распределение по плану Петера Троя",
    selectHelp: "Откройте неделю, чтобы увидеть её семь отрывков.",
  },
  uk: {
    type: "Виберіть план",
    flexible: "Індивідуальний план",
    flexibleHelp:
      "Виберіть термін і порядок; обсяг щоденного читання пристосовується до вашого прогресу.",
    description: "52 тижні · 7 фіксованих розділів на тиждень · Петер Трой",
    fixed:
      "Розділи, порядок і німецькі назви біблійних уривків залишаються як в оригіналі за будь-якої мови застосунку. Основа: Schlachter 2000, усі 66 книг і 1189 розділів рівно по одному разу.",
    week: "Тиждень",
    unit: "Частина",
    wholeWeek: "Позначити весь тиждень прочитаним",
    progress: "Уже прочитано",
    progressHelp:
      "Позначайте цілі тижні або розгортайте тиждень і вибирайте окремі уривки. Раніше прочитані розділи враховуються в прогресі; час їх читання оцінюється приблизно.",
    all: "Вибрати всі тижні",
    none: "Зняти вибір",
    next: "Наступна непрочитана частина",
    saved: "Частину збережено",
    save: "Зберегти читання",
    finish:
      "Позначте прочитані розділи. Непрочитані розділи залишаються в цій частині; план не перерозподіляється.",
    start: "Початок першого тижня плану",
    startHelp:
      "Якщо ви вже почали, вкажіть початкову дату. Будь-яку незавершену частину можна читати в будь-який час незалежно від календаря.",
    open: "Завершіть відкрите читання, перш ніж переходити до іншої частини.",
    resume: "До відкритого читання",
    minutes: "Усього хвилин на цю частину",
    complete: "прочитано",
    partial: "частково прочитано",
    remaining: "Не прочитано",
    sections: "частин",
    original: "Фіксований розподіл за планом Петера Троя",
    selectHelp: "Відкрийте тиждень, щоб побачити його сім уривків.",
  },
};
export const bible52Text = (lang: Lang) => translations[lang];
export const bible52Position = (index: number, lang: Lang) =>
  `${bible52Text(lang).week} ${Math.floor(index / 7) + 1} · ${bible52Text(lang).unit} ${(index % 7) + 1}/7`;
