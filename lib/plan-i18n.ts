import type { Lang } from "./languages";
const de = {
  workload:
    "Für die verbleibenden Tage sind jetzt ungefähr {minutes} Minuten pro Tag eingeplant.",
  setup: "Dein Plan, dein Einstieg",
  setupHelp: "Wähle, was du lesen möchtest und wo du bereits stehst.",
  stepPlan: "Dein Plan",
  stepProgress: "Bisher gelesen",
  stepTime: "Zeitraum & Vorschau",
  scope: "Was möchtest du lesen?",
  bible: "Gesamte Bibel",
  ot: "Altes Testament",
  nt: "Neues Testament",
  order: "Wie möchtest du lesen?",
  canonical: "Biblische Reihenfolge",
  chronological: "Chronologisch & Zusammenhänge",
  mixed: "Ausgewogen abwechselnd",
  canonicalHelp: "Ein Buch nach dem anderen, in der Reihenfolge deiner Bibel.",
  chronologicalHelp:
    "Entlang der biblischen Geschichte, mit Parallelberichten und passenden Psalmen. Eine Annäherung auf Kapitelebene; nicht alle Texte lassen sich sicher datieren.",
  mixedHelp:
    "Geordnete Lesestränge aus Geschichte, Weisheit, Evangelien und Briefen wechseln sich nach Textmenge ab. Bei einem Teiltestament nur aus den darin enthaltenen Büchern.",
  together: "Zusammenhänge möglichst erhalten",
  togetherHelp:
    "Bekannte Kapitelgruppen bevorzugt gemeinsam lesen. Die Tagesmenge darf dafür etwas schwanken; lange Gruppen verteilen sich auf mehrere Tage.",
  previous: "Vor dem Plan bereits gelesen",
  previousHelp:
    "Markiere ganze Bücher oder einzelne Kapitel. Sie zählen zum Fortschritt und werden nicht erneut eingeplant. Du kannst die Auswahl später in den Einstellungen ändern.",
  previousEditHelp:
    "Hier änderst du nur den Fortschritt vor dem Plan. Bereits in der App abgeschlossene Kapitel bleiben erhalten und sind gesperrt.",
  search: "Buch suchen",
  all: "Alle auswählen",
  none: "Auswahl aufheben",
  wholeBook: "Ganzes Buch",
  from: "Von Kapitel",
  to: "Bis Kapitel",
  mark: "Bereich markieren",
  unmark: "Bereich abwählen",
  duringPlan: "In der App gelesen",
  rangeInvalid: "Bitte gib einen gültigen Kapitelbereich ein.",
  noBooks: "Kein Buch gefunden.",
  selected: "{count} Kapitel vorher gelesen",
  booksChapters: "{books} Bücher · {chapters} Kapitel",
  coverage:
    "Alle {total} Kapitel berücksichtigt · {previous} vorher gelesen · {completed} im Plan gelesen · {remaining} noch offen",
  period: "Die verbleibenden Kapitel lesen in",
  next: "Weiter",
  back: "Zurück",
  allDone:
    "Du hast alle Kapitel dieses Umfangs bereits gelesen. Dein Fortschritt wird als vollständig gespeichert.",
  measured: "Gemessene Lesezeit",
  estimatedPast: "Frühere Lesezeit · geschätzt",
  includingEstimate: "Gesamtzeit inkl. Schätzung",
  pastNote:
    "Die Schätzung berücksichtigt die Textlänge und dein gemessenes Lesetempo, anfangs 180 Wörter pro Minute. Sie wird mit deinem Lesetempo aktualisiert. Sie erzeugt keine Lesetage und beeinflusst deinen Durchschnitt nicht.",
  manage: "Dein Leseplan",
  editPrevious: "Früheren Fortschritt bearbeiten",
  extend: "Zieltermin verlängern",
  endDate: "Neuer letzter Lesetag",
  extendHelp:
    "Deine abgeschlossenen Kapitel und gemessenen Zeiten bleiben erhalten. Nur die offenen Kapitel werden auf die verbleibenden Tage verteilt. Ohne Änderung bleibt dein bisheriger Zieltermin bestehen.",
  stopFirst: "Pausiere zuerst den laufenden Timer.",
  unscheduled:
    "{count} Kapitel sind noch offen. Lies weiter oder verlängere den Zieltermin in den Einstellungen.",
  why: "Warum gehören diese Kapitel zusammen?",
  contextNote:
    "Die Hinweise beziehen sich auf ganze Kapitelgruppen, die mehrere Lesetage umfassen können. Schon gelesene Kapitel werden nicht erneut zur Pflicht.",
  overview:
    "Historischer Überblick: Diese Texte behandeln dieselbe Epoche. Einzelne Kapitel können Rückblicke und Ausblicke enthalten.",
  parallel:
    "Samuel bzw. Könige und Chronik beleuchten dieselben Ereignisse aus unterschiedlichen Blickwinkeln. Ganze Kapitel können darüber hinaus weitere Ereignisse enthalten.",
  psalm51:
    "2. Samuel 11–12 berichtet von David, Bathseba und Nathan. Die Überschrift von Psalm 51 nennt ausdrücklich Nathans Besuch nach diesem Geschehen.",
  psalm3:
    "2. Samuel 15 erzählt von Davids Flucht vor Absalom. Die Überschrift von Psalm 3 nennt ausdrücklich diese Flucht.",
  ark: "2. Samuel 6 und 1. Chronik 13–16 erzählen von der Bundeslade. Das Lied in 1. Chronik 16 enthält Textparallelen zu Psalm 96, 105 und 106; das datiert nicht automatisch die ganzen Psalmen.",
  song18:
    "2. Samuel 22 und Psalm 18 überliefern Davids Danklied in eng verwandter Form.",
  undated:
    "Diese Einordnung dient der Orientierung. Eine genaue zeitliche Zuordnung ist hier unsicher; Sammelbücher und Psalmen können aus unterschiedlichen Zeiten stammen.",
  exile:
    "Diese Texte begleiten den Untergang Jerusalems und das babylonische Exil. Die Ereignisse überlappen sich; die Bücher bleiben in größeren Abschnitten zusammen.",
  return:
    "Diese Texte verbinden die Rückkehr aus dem Exil und den Wiederaufbau mit den dazugehörigen prophetischen Büchern. Die Einordnung einzelner Psalmen bleibt ungefähr.",
  gospels:
    "Die Evangelien werden nach größeren Lebensabschnitten Jesu nebeneinandergestellt. Weil ganze Kapitel erhalten bleiben, ist dies keine versgenaue Chronologie.",
  letters:
    "Die Briefe stehen bei den ungefähren Phasen der frühen Gemeinden und der Reisen des Paulus. Datierungen, besonders einzelner Briefe, sind umstritten.",
};
type PlanTexts = { [K in keyof typeof de]: string };
const en: PlanTexts = {
  workload:
    "The remaining days now have about {minutes} minutes of reading per day.",
  setup: "Your plan, your starting point",
  setupHelp: "Choose what to read and tell us how far you have already come.",
  stepPlan: "Your plan",
  stepProgress: "Already read",
  stepTime: "Time & preview",
  scope: "What would you like to read?",
  bible: "Whole Bible",
  ot: "Old Testament",
  nt: "New Testament",
  order: "How would you like to read?",
  canonical: "Bible order",
  chronological: "Chronology & context",
  mixed: "Balanced alternating readings",
  canonicalHelp: "One book at a time, in the order of your Bible.",
  chronologicalHelp:
    "Follow biblical history with parallel accounts and related psalms. An approximation using whole chapters; not every text can be dated reliably.",
  mixedHelp:
    "Ordered streams of history, wisdom, Gospels and letters alternate by text length. A single-testament plan uses only books in that testament.",
  together: "Prefer connected passages",
  togetherHelp:
    "Keep known chapter groups together where possible. Daily amounts may vary slightly; long groups span several days.",
  previous: "Read before this plan",
  previousHelp:
    "Select entire books or individual chapters. They count toward progress and will not be assigned again. You can change this later in settings.",
  previousEditHelp:
    "Only progress from before the plan is edited here. Chapters completed in the app are preserved and locked.",
  search: "Find a book",
  all: "Select all",
  none: "Clear selection",
  wholeBook: "Whole book",
  from: "From chapter",
  to: "To chapter",
  mark: "Select range",
  unmark: "Clear range",
  duringPlan: "Read in the app",
  rangeInvalid: "Please enter a valid chapter range.",
  noBooks: "No book found.",
  selected: "{count} chapters read previously",
  booksChapters: "{books} books · {chapters} chapters",
  coverage:
    "All {total} chapters accounted for · {previous} previously read · {completed} read in plan · {remaining} remaining",
  period: "Read the remaining chapters in",
  next: "Next",
  back: "Back",
  allDone:
    "You have already read every chapter in this scope. Your progress will be saved as complete.",
  measured: "Measured reading time",
  estimatedPast: "Earlier reading time · estimated",
  includingEstimate: "Total including estimate",
  pastNote:
    "The estimate uses text length and your measured reading pace, initially 180 words per minute. It updates as your pace changes. It does not create reading days or affect your average.",
  manage: "Your reading plan",
  editPrevious: "Edit earlier progress",
  extend: "Extend target date",
  endDate: "New final reading day",
  extendHelp:
    "Completed chapters and measured time are preserved. Only unread chapters are spread across the remaining days. Without a change, your existing target date stays in place.",
  stopFirst: "Pause the running timer first.",
  unscheduled:
    "{count} chapters remain. Continue reading or extend the target date in settings.",
  why: "Why do these chapters belong together?",
  contextNote:
    "These notes describe whole chapter groups, which may span several reading days. Previously read chapters do not become required again.",
  overview:
    "Historical overview: these texts concern the same broad period. Individual chapters may include flashbacks or look ahead.",
  parallel:
    "Samuel or Kings and Chronicles tell related events from different perspectives. Whole chapters may also contain other events.",
  psalm51:
    "2 Samuel 11–12 describes David, Bathsheba and Nathan. The heading of Psalm 51 explicitly mentions Nathan's visit after these events.",
  psalm3:
    "2 Samuel 15 describes David fleeing Absalom. The heading of Psalm 3 explicitly names this flight.",
  ark: "2 Samuel 6 and 1 Chronicles 13–16 describe the ark. The song in 1 Chronicles 16 parallels Psalms 96, 105 and 106; this does not date the entire psalms.",
  song18:
    "2 Samuel 22 and Psalm 18 preserve closely related versions of David's song of thanks.",
  undated:
    "This placement provides orientation. Precise dating is uncertain; collections and psalms can come from different periods.",
  exile:
    "These texts accompany Jerusalem's fall and the Babylonian exile. Events overlap; books are kept in larger sections.",
  return:
    "These texts connect the return from exile and rebuilding with related prophetic books. The placement of individual psalms remains approximate.",
  gospels:
    "The Gospels are placed side by side in broad stages of Jesus' life. Whole chapters are retained, so this is not a verse-by-verse chronology.",
  letters:
    "Letters accompany approximate phases of the early churches and Paul's journeys. Dates, particularly of individual letters, are disputed.",
};
const ru: PlanTexts = {
  workload:
    "На оставшиеся дни запланировано примерно {minutes} минут чтения в день.",
  setup: "Твой план и отправная точка",
  setupHelp: "Выбери, что хочешь читать, и отметь уже прочитанное.",
  stepPlan: "Твой план",
  stepProgress: "Уже прочитано",
  stepTime: "Срок и обзор",
  scope: "Что ты хочешь прочитать?",
  bible: "Вся Библия",
  ot: "Ветхий Завет",
  nt: "Новый Завет",
  order: "В каком порядке читать?",
  canonical: "В порядке книг Библии",
  chronological: "Хронология и контекст",
  mixed: "Сбалансированное чередование",
  canonicalHelp: "Книга за книгой, в порядке твоей Библии.",
  chronologicalHelp:
    "По ходу библейской истории, с параллельными рассказами и связанными псалмами. Приблизительный порядок целых глав: не все тексты можно точно датировать.",
  mixedHelp:
    "История, мудрость, Евангелия и послания чередуются с учётом объёма текста. В плане одного Завета используются только его книги.",
  together: "По возможности сохранять связи",
  togetherHelp:
    "Известные группы глав по возможности читаются вместе. Дневной объём может немного меняться; длинные группы делятся на несколько дней.",
  previous: "Прочитано до начала плана",
  previousHelp:
    "Отмечай целые книги или отдельные главы. Они учитываются в прогрессе и не назначаются повторно. Выбор можно изменить позже в настройках.",
  previousEditHelp:
    "Здесь меняется только прогресс до начала плана. Главы, завершённые в приложении, сохраняются и недоступны для изменения.",
  search: "Найти книгу",
  all: "Выбрать всё",
  none: "Снять выбор",
  wholeBook: "Вся книга",
  from: "С главы",
  to: "До главы",
  mark: "Выбрать диапазон",
  unmark: "Снять диапазон",
  duringPlan: "Прочитано в приложении",
  rangeInvalid: "Введи корректный диапазон глав.",
  noBooks: "Книга не найдена.",
  selected: "Ранее прочитано глав: {count}",
  booksChapters: "Книг: {books} · Глав: {chapters}",
  coverage:
    "Учтены все {total} глав · Ранее прочитано: {previous} · Прочитано по плану: {completed} · Осталось: {remaining}",
  period: "Прочитать оставшиеся главы за",
  next: "Далее",
  back: "Назад",
  allDone:
    "Все главы выбранной части уже прочитаны. Прогресс будет сохранён как завершённый.",
  measured: "Измеренное время чтения",
  estimatedPast: "Прежнее время чтения · оценка",
  includingEstimate: "Всего с учётом оценки",
  pastNote:
    "Оценка учитывает длину текста и твою измеренную скорость чтения, сначала — 180 слов в минуту. Она обновляется со скоростью чтения, не создаёт дней чтения и не влияет на среднюю скорость.",
  manage: "Твой план чтения",
  editPrevious: "Изменить прежний прогресс",
  extend: "Продлить срок",
  endDate: "Новый последний день чтения",
  extendHelp:
    "Прочитанные главы и измеренное время сохраняются. Только непрочитанные главы распределяются по оставшимся дням. Без изменений прежний срок остаётся в силе.",
  stopFirst: "Сначала приостанови таймер.",
  unscheduled:
    "Осталось глав: {count}. Продолжай читать или продли срок в настройках.",
  why: "Как связаны эти главы?",
  contextNote:
    "Пояснения относятся к целым группам глав, которые могут занимать несколько дней. Уже прочитанные главы не становятся обязательными снова.",
  overview:
    "Исторический обзор: тексты относятся к одной эпохе. Отдельные главы могут обращаться к прошлому или будущему.",
  parallel:
    "Книги Царств и Паралипоменон описывают связанные события с разных точек зрения. Целые главы могут включать и другие события.",
  psalm51:
    "2-я Царств 11–12 рассказывает о Давиде, Вирсавии и Нафане. Надписание псалма 51 в нумерации Schlachter прямо упоминает визит Нафана после этих событий.",
  psalm3:
    "2-я Царств 15 описывает бегство Давида от Авессалома. Надписание псалма 3 прямо называет это событие.",
  ark: "2-я Царств 6 и 1-я Паралипоменон 13–16 рассказывают о ковчеге. Песнь в 1-й Паралипоменон 16 имеет параллели с псалмами 96, 105 и 106 по нумерации Schlachter; это не датирует псалмы целиком.",
  song18:
    "2-я Царств 22 и псалом 18 по нумерации Schlachter передают близкие версии благодарственной песни Давида.",
  undated:
    "Это размещение помогает ориентироваться. Точная датировка неясна; сборники и псалмы могут относиться к разным эпохам.",
  exile:
    "Тексты связаны с падением Иерусалима и вавилонским пленом. События пересекаются; книги сохраняются крупными разделами.",
  return:
    "Тексты связывают возвращение из плена и восстановление с пророческими книгами. Размещение отдельных псалмов приблизительно.",
  gospels:
    "Евангелия сопоставляются по основным этапам жизни Иисуса. Главы остаются целыми, поэтому это не точная хронология по стихам.",
  letters:
    "Послания размещены около соответствующих этапов ранних церквей и путешествий Павла. Датировки отдельных посланий спорны.",
};
const uk: PlanTexts = {
  workload:
    "На решту днів заплановано приблизно {minutes} хвилин читання на день.",
  setup: "Твій план і початкова точка",
  setupHelp: "Обери, що хочеш читати, і познач уже прочитане.",
  stepPlan: "Твій план",
  stepProgress: "Уже прочитано",
  stepTime: "Термін і огляд",
  scope: "Що ти хочеш прочитати?",
  bible: "Уся Біблія",
  ot: "Старий Завіт",
  nt: "Новий Завіт",
  order: "У якому порядку читати?",
  canonical: "У порядку книг Біблії",
  chronological: "Хронологія та контекст",
  mixed: "Збалансоване чергування",
  canonicalHelp: "Книга за книгою, у порядку твоєї Біблії.",
  chronologicalHelp:
    "За ходом біблійної історії, з паралельними розповідями та пов’язаними псалмами. Приблизний порядок цілих розділів: не всі тексти можна точно датувати.",
  mixedHelp:
    "Історія, мудрість, Євангелія та послання чергуються з урахуванням обсягу тексту. План одного Завіту містить лише його книги.",
  together: "За можливості зберігати зв’язки",
  togetherHelp:
    "Відомі групи розділів за можливості читаються разом. Денний обсяг може трохи змінюватися; довгі групи розподіляються на кілька днів.",
  previous: "Прочитано до початку плану",
  previousHelp:
    "Позначай цілі книги або окремі розділи. Вони враховуються в прогресі й не призначаються повторно. Вибір можна змінити пізніше в налаштуваннях.",
  previousEditHelp:
    "Тут змінюється лише прогрес до початку плану. Розділи, завершені в застосунку, зберігаються і недоступні для зміни.",
  search: "Знайти книгу",
  all: "Обрати все",
  none: "Скасувати вибір",
  wholeBook: "Уся книга",
  from: "Від розділу",
  to: "До розділу",
  mark: "Обрати діапазон",
  unmark: "Скасувати діапазон",
  duringPlan: "Прочитано в застосунку",
  rangeInvalid: "Введи коректний діапазон розділів.",
  noBooks: "Книгу не знайдено.",
  selected: "Раніше прочитано розділів: {count}",
  booksChapters: "Книг: {books} · Розділів: {chapters}",
  coverage:
    "Ураховано всі {total} розділів · Раніше прочитано: {previous} · Прочитано за планом: {completed} · Залишилося: {remaining}",
  period: "Прочитати решту розділів за",
  next: "Далі",
  back: "Назад",
  allDone:
    "Усі розділи обраної частини вже прочитані. Прогрес буде збережено як завершений.",
  measured: "Виміряний час читання",
  estimatedPast: "Попередній час читання · оцінка",
  includingEstimate: "Усього разом з оцінкою",
  pastNote:
    "Оцінка враховує довжину тексту й твою виміряну швидкість читання, спочатку — 180 слів за хвилину. Вона оновлюється зі швидкістю читання, не створює днів читання й не впливає на середню швидкість.",
  manage: "Твій план читання",
  editPrevious: "Змінити попередній прогрес",
  extend: "Продовжити термін",
  endDate: "Новий останній день читання",
  extendHelp:
    "Прочитані розділи й виміряний час зберігаються. Лише непрочитані розділи розподіляються на решту днів. Без змін попередній термін залишається чинним.",
  stopFirst: "Спочатку призупини таймер.",
  unscheduled:
    "Залишилося розділів: {count}. Продовжуй читати або продовж термін у налаштуваннях.",
  why: "Як пов’язані ці розділи?",
  contextNote:
    "Пояснення стосуються цілих груп розділів, які можуть охоплювати кілька днів. Уже прочитані розділи не стають обов’язковими знову.",
  overview:
    "Історичний огляд: тексти стосуються однієї епохи. Окремі розділи можуть звертатися до минулого або майбутнього.",
  parallel:
    "Книги Самуїла, Царів і Хронік описують пов’язані події з різних поглядів. Цілі розділи можуть містити й інші події.",
  psalm51:
    "2 Самуїла 11–12 розповідає про Давида, Вірсавію та Натана. Надпис псалма 51 за нумерацією Schlachter прямо згадує візит Натана після цих подій.",
  psalm3:
    "2 Самуїла 15 описує втечу Давида від Авесалома. Надпис псалма 3 прямо називає цю подію.",
  ark: "2 Самуїла 6 і 1 Хронік 13–16 розповідають про ковчег. Пісня в 1 Хронік 16 має паралелі з псалмами 96, 105 і 106 за нумерацією Schlachter; це не датує псалми цілком.",
  song18:
    "2 Самуїла 22 і псалом 18 за нумерацією Schlachter передають близькі версії Давидової пісні подяки.",
  undated:
    "Це розміщення допомагає орієнтуватися. Точне датування невідоме; збірки й псалми можуть походити з різних епох.",
  exile:
    "Тексти пов’язані з падінням Єрусалима та вавилонським полоном. Події перетинаються; книги зберігаються великими частинами.",
  return:
    "Тексти пов’язують повернення з полону й відбудову з пророчими книгами. Розміщення окремих псалмів приблизне.",
  gospels:
    "Євангелія зіставляються за основними етапами життя Ісуса. Розділи залишаються цілими, тому це не точна хронологія за віршами.",
  letters:
    "Послання розміщені біля відповідних етапів ранніх церков і подорожей Павла. Датування окремих послань дискусійне.",
};
export const planTranslations = { de, en, ru, uk };
export const planText = (lang: Lang) => planTranslations[lang];
export function fill(value: string, params: Record<string, number | string>) {
  return value.replace(/\{(\w+)\}/g, (_, key: string) =>
    String(params[key] ?? `{${key}}`),
  );
}
