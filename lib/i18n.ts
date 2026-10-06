import type { Lang } from "./languages";
import { ukrainian, ukrainianBooks } from "./i18n-uk";
export type { Lang } from "./languages";
export { locales } from "./languages";
const rows = {
  tagline: [
    "DEINE ZEIT IM WORT",
    "ТВОЁ ВРЕМЯ СО СЛОВОМ",
    "YOUR TIME IN THE WORD",
  ],
  edition: [
    "Papierbibel · Schlachter 2000",
    "Печатная Библия · Schlachter 2000",
    "Paper Bible · Schlachter 2000",
  ],
  eyebrow: [
    "EIN KAPITEL NACH DEM ANDEREN",
    "ГЛАВА ЗА ГЛАВОЙ",
    "ONE CHAPTER AT A TIME",
  ],
  title: [
    "Dein Weg durch die Bibel.",
    "Твой путь через Библию.",
    "Your journey through the Bible.",
  ],
  subtitle: [
    "Du liest in deiner Bibel. Leseweg begleitet dich.",
    "Ты читаешь свою Библию. Leseweg помогает идти дальше.",
    "You read your Bible. Leseweg keeps you on track.",
  ],
  question: [
    "Wie viel Zeit möchtest du dir nehmen?",
    "Сколько времени ты хочешь себе дать?",
    "How much time would you like?",
  ],
  questionSub: [
    "Du bestimmst das Ziel. Wir teilen die Kapitel ein.",
    "Ты выбираешь цель. Мы распределяем главы.",
    "You set the goal. We work out the daily readings.",
  ],
  wholeBible: [
    "Die ganze Bibel lesen in",
    "Прочитать всю Библию за",
    "Read the whole Bible in",
  ],
  days: ["Tagen", "дней", "days"],
  weeks: ["Wochen", "недель", "weeks"],
  months: ["Monaten", "месяцев", "months"],
  startDate: [
    "Mein erster Lesetag",
    "Первый день чтения",
    "My first reading day",
  ],
  balanced: [
    "Gleichmäßig nach Textlänge",
    "С учётом длины текста",
    "Balanced by text length",
  ],
  balancedSub: [
    "Lange Kapitel bekommen mehr Raum, kurze werden zusammengefasst.",
    "Длинным главам — больше времени, короткие объединяются.",
    "Long chapters get more space. Short ones are grouped together.",
  ],
  create: [
    "Meinen Leseplan erstellen",
    "Создать мой план",
    "Create my reading plan",
  ],
  overview: [
    "DEIN PLAN AUF EINEN BLICK",
    "ТВОЙ ПЛАН В ЦИФРАХ",
    "YOUR PLAN AT A GLANCE",
  ],
  minsDaily: ["Minuten am Tag", "минут в день", "minutes a day"],
  estimate: [
    "geschätzte Lesezeit",
    "примерное время чтения",
    "estimated reading time",
  ],
  personalEstimate: ["Dein Lesetempo", "Твой темп чтения", "Your reading pace"],
  defaultEstimate: ["Startwert", "Начальная оценка", "Initial estimate"],
  paceTitle: [
    "Persönliche Zeitschätzung",
    "Индивидуальный прогноз времени",
    "Personal reading estimates",
  ],
  paceBased: [
    "Grundlage: {chapters} abgeschlossene Kapitel mit {time} gemessener Lesezeit.",
    "В основе: {chapters} завершённых глав и {time} измеренного времени чтения.",
    "Based on {chapters} completed chapters and {time} of measured reading time.",
  ],
  paceFallback: [
    "Noch keine abgeschlossene Messung. Bis dahin gilt der Startwert von 180 Wörtern pro Minute.",
    "Пока нет завершённых замеров. Начальная оценка — 180 слов в минуту.",
    "No completed measurement yet. Estimates start at 180 words per minute.",
  ],
  paceHelp: [
    "Starte den Timer vor dem Lesen, hake die gelesenen Kapitel ab und beende die Einheit. Daraus lernen die Schätzungen für Kapitel und künftige Einheiten — gewichtet nach Textlänge. Pausen zählen nicht mit. Ohne Zeitmessung bleibt dein Lesefortschritt erhalten, das Tempo unverändert.",
    "Запусти таймер перед чтением, отметь прочитанные главы и заверши чтение. Прогноз для глав и будущих чтений обновится с учётом длины текста. Паузы не учитываются. Без замера времени прогресс сохраняется, а оценка темпа не меняется.",
    "Start the timer before reading, check off the chapters you read and finish the reading. Estimates for chapters and future readings then adapt, weighted by text length. Pauses are excluded. Reading without a timer still counts toward progress, but does not change your pace estimate.",
  ],
  paceFinishHint: [
    "Mit einer gemessenen Lesezeit wird auch deine persönliche Zeitschätzung aktualisiert.",
    "Если время измерено, индивидуальный прогноз тоже обновится.",
    "If you measured your reading time, your personal estimates will update too.",
  ],
  booksChapters: [
    "66 Bücher · 1.189 Kapitel",
    "66 книг · 1 189 глав",
    "66 books · 1,189 chapters",
  ],
  dayCount: [
    "Tage für deinen Weg",
    "дней в твоём пути",
    "days on your journey",
  ],
  target: ["Ziel", "Цель", "Finish"],
  beginning: ["So beginnt dein Weg", "Начало твоего пути", "Your first steps"],
  min: ["Min.", "мин.", "min"],
  approx: ["ca.", "около", "about"],
  method: [
    "Die Gewichtung nutzt Wortzahlen der Lutherbibel 1912 als Näherung. Ganze Kapitel bleiben zusammen. Zu Beginn rechnen wir mit 180 Wörtern pro Minute. Nach abgeschlossenen, gemessenen Einheiten richtet sich die Zeitschätzung nach deinem Tempo und der Textlänge.",
    "Вес глав рассчитан приблизительно по числу слов в Библии Лютера 1912. Главы не разделяются. Начальная оценка — 180 слов в минуту. После завершённых чтений с замером времени прогноз учитывает твой темп и длину текста.",
    "Weighting uses word counts from the Luther Bible 1912 as an approximation. Chapters stay whole. Initial estimates assume 180 words per minute. After you finish timed readings, estimates use your own pace and the text length.",
  ],
  localIntro: [
    "Ohne Konto. Dein persönlicher Plan bleibt auf deinem Gerät.",
    "Без аккаунта. Твой личный план остаётся на твоём устройстве.",
    "No account needed. Your personal plan stays on your device.",
  ],
  localData: ["Deine Daten", "Твои данные", "Your data"],
  localDataSub: [
    "Plan und Lesezeiten werden nur in diesem Browser bzw. dieser installierten App gespeichert. Es gibt keine automatische Synchronisierung zwischen Geräten.",
    "План и время чтения хранятся только в этом браузере или установленном приложении. Автоматической синхронизации между устройствами нет.",
    "Your plan and reading times are stored only in this browser or installed app. Devices do not sync automatically.",
  ],
  backupSave: [
    "Sicherung herunterladen",
    "Скачать резервную копию",
    "Download backup",
  ],
  backupLoad: ["Sicherung laden", "Загрузить резервную копию", "Import backup"],
  backupNote: [
    "Sichere regelmäßig eine Kopie. Beim Löschen der Websitedaten oder der App können deine Daten verloren gehen. Mit der Sicherung kannst du sie auch auf ein anderes Gerät übertragen.",
    "Регулярно сохраняй копию. При удалении данных сайта или приложения данные могут исчезнуть. Копия позволяет перенести их на другое устройство.",
    "Keep regular backups. Clearing website data or removing the app can erase your records. You can also use a backup to move them to another device.",
  ],
  backupInvalid: [
    "Diese Datei ist keine gültige Leseweg-Sicherung. Deine bisherigen Daten wurden nicht verändert.",
    "Это не действительная резервная копия Leseweg. Твои данные не изменились.",
    "This is not a valid Leseweg backup. Your existing data has not changed.",
  ],
  backupSaveError: [
    "Die Sicherung konnte nicht gespeichert oder wiederhergestellt werden. Bitte versuche es erneut.",
    "Не удалось сохранить или восстановить резервную копию. Попробуй ещё раз.",
    "The backup could not be saved or restored. Please try again.",
  ],
  backupRestoreTitle: [
    "Sicherung wiederherstellen?",
    "Восстановить резервную копию?",
    "Restore this backup?",
  ],
  backupRestoreText: [
    "Der Plan, die Lesezeiten und der Fortschritt auf diesem Gerät werden durch die Sicherung ersetzt. Ein Timer ist danach pausiert.",
    "План, время чтения и прогресс на этом устройстве будут заменены резервной копией. Таймер будет на паузе.",
    "This replaces the plan, reading times and progress on this device with the backup. The timer will be paused.",
  ],
  backupRestore: ["Wiederherstellen", "Восстановить", "Restore"],
  offlineReady: [
    "Für die Nutzung ohne Internet bereit.",
    "Готово к работе без интернета.",
    "Ready to use without internet.",
  ],
  offlinePreparing: [
    "Die App wird für die Nutzung ohne Internet vorbereitet. Lass sie dafür kurz geöffnet.",
    "Готовим приложение к работе без интернета. Оставь его ненадолго открытым.",
    "Preparing the app for offline use. Keep it open for a moment.",
  ],
  offlineFailed: [
    "Offlinebetrieb konnte noch nicht vorbereitet werden. Öffne die App mit Internetverbindung erneut.",
    "Не удалось подготовить работу без интернета. Открой приложение снова с подключением к сети.",
    "Offline setup did not complete. Reopen the app with an internet connection.",
  ],
  updateAvailable: [
    "Eine neue Version von Leseweg ist verfügbar.",
    "Доступна новая версия Leseweg.",
    "A new version of Leseweg is available.",
  ],
  updateNow: ["Jetzt aktualisieren", "Обновить", "Update now"],
  recommended: [
    "Empfohlene Kapitel",
    "Рекомендуемые главы",
    "Recommended chapters",
  ],
  adaptiveHint: [
    "Hake nur ab, was du wirklich gelesen hast. Du kannst früher aufhören oder weitere Kapitel hinzufügen. Beim Beenden wird der restliche Plan neu berechnet.",
    "Отмечай только прочитанные главы. Можно закончить раньше или добавить ещё главы. После завершения оставшийся план пересчитается.",
    "Only check chapters you actually read. You can stop earlier or add more chapters. Finishing recalculates the remaining plan.",
  ],
  addChapter: [
    "Nächstes Kapitel hinzufügen",
    "Добавить следующую главу",
    "Add next chapter",
  ],
  additional: ["Zusätzlich", "Дополнительно", "Additional"],
  finishSession: [
    "Leseeinheit beenden",
    "Завершить чтение",
    "Finish reading session",
  ],
  finishExplanation: [
    "Nur abgehakte Kapitel zählen als gelesen. Offene Kapitel werden nach Textlänge auf die verbleibenden Tage verteilt. Dein Zieldatum bleibt gleich.",
    "Прочитанными считаются только отмеченные главы. Оставшиеся главы распределятся по длине текста на оставшиеся дни. Дата цели не изменится.",
    "Only checked chapters count as read. Unread chapters are distributed by text length across the remaining days. Your target date stays the same.",
  ],
  finishAndReplan: [
    "Beenden und Plan anpassen",
    "Завершить и обновить план",
    "Finish and update plan",
  ],
  chaptersChecked: [
    "Kapitel als gelesen markiert",
    "глав отмечено прочитанными",
    "chapters marked as read",
  ],
  chaptersRemaining: [
    "Kapitel noch offen",
    "глав осталось",
    "chapters remaining",
  ],
  daysRemaining: [
    "Tage ab morgen",
    "дней начиная с завтра",
    "days from tomorrow",
  ],
  replanned: [
    "Leseeinheit gespeichert. Die Empfehlungen ab morgen sind an deinen Fortschritt angepasst. Dein Zieldatum bleibt bestehen.",
    "Чтение сохранено. Рекомендации с завтрашнего дня обновлены с учётом прогресса. Дата цели не изменилась.",
    "Reading saved. Recommendations from tomorrow reflect your progress. Your target date is unchanged.",
  ],
  sessionSaved: [
    "Deine Leseeinheit ist gespeichert.",
    "Твоё чтение сохранено.",
    "Your reading session is saved.",
  ],
  continueReading: [
    "Heute noch weiterlesen",
    "Продолжить чтение сегодня",
    "Read more today",
  ],
  previewHint: [
    "Das ist eine Empfehlung für diesen Tag. Zusätzliche Kapitel kannst du in deiner heutigen Einheit lesen und abhaken.",
    "Это рекомендация на этот день. Дополнительные главы можно прочитать и отметить в сегодняшнем чтении.",
    "This is a recommendation for that day. Read and check additional chapters in today’s session.",
  ],
  historyHint: [
    "Hier siehst du die tatsächlich gelesenen Kapitel dieses Tages. Offene Kapitel sind bereits im aktuellen Plan berücksichtigt.",
    "Здесь показаны главы, прочитанные в этот день. Непрочитанные главы уже включены в текущий план.",
    "These are the chapters actually read on this day. Unread chapters are already included in the current plan.",
  ],
  backToday: [
    "Zur heutigen Einheit",
    "К сегодняшнему чтению",
    "Go to today’s session",
  ],
  noReadingLogged: [
    "Keine Kapitel erfasst",
    "Нет записанных глав",
    "No chapters recorded",
  ],
  deadlinePassed: [
    "Dein Zieldatum ist überschritten. Die offenen Kapitel bleiben erhalten. Du kannst weiterlesen; das ursprüngliche Ziel lässt sich nicht mehr rechtzeitig erreichen.",
    "Дата цели уже прошла. Непрочитанные главы сохранены. Можно продолжать чтение, но завершить в первоначальный срок уже невозможно.",
    "Your target date has passed. Unread chapters are still available. You can keep reading, but the original deadline can no longer be met.",
  ],
  noDaysRemaining: [
    "Bis zum Zieldatum bleibt kein weiterer Lesetag. Du kannst heute noch weiterlesen; offene Kapitel werden nicht automatisch als gelesen markiert.",
    "До даты цели больше нет дней. Можно продолжить чтение сегодня; непрочитанные главы не будут отмечены автоматически.",
    "There are no more reading days before your target date. You can keep reading today; unread chapters will not be marked automatically.",
  ],
  planChanged: [
    "Der Plan wurde inzwischen geändert. Die aktuelle Empfehlung wurde neu geladen.",
    "План уже изменился. Текущая рекомендация загружена заново.",
    "The plan has changed. The current recommendation has been reloaded.",
  ],
  footer: [
    "Raum für Gottes Wort. Jeden Tag ein Stück.",
    "Место для Божьего Слова. Каждый день понемногу.",
    "Make room for the Word. A little every day.",
  ],
  invalid: [
    "Bitte gib eine gültige Dauer von 1 bis 3.650 Tagen und ein Startdatum an.",
    "Укажи срок от 1 до 3 650 дней и корректную дату начала.",
    "Enter a valid duration of 1 to 3,650 days and a start date.",
  ],
  today: ["Heute", "Сегодня", "Today"],
  plan: ["Leseplan", "План", "Plan"],
  stats: ["Statistik", "Статистика", "Statistics"],
  settings: ["Einstellungen", "Настройки", "Settings"],
  welcome: [
    "Zeit für dein nächstes Kapitel.",
    "Время для следующей главы.",
    "Time for your next chapter.",
  ],
  day: ["Tag", "День", "Day"],
  of: ["von", "из", "of"],
  session: ["DEINE LESEEINHEIT", "ТВОЁ ЧТЕНИЕ", "YOUR READING SESSION"],
  openBible: [
    "Schlag deine Bibel auf und nimm dir einen Moment.",
    "Открой свою Библию и удели ей немного времени.",
    "Open your Bible and take a moment for yourself.",
  ],
  startTimer: ["Timer starten", "Запустить таймер", "Start timer"],
  pause: ["Pausieren", "Пауза", "Pause"],
  resume: ["Fortsetzen", "Продолжить", "Resume"],
  finishTimer: ["Timer stoppen", "Остановить таймер", "Stop timer"],
  timerRunning: [
    "Timer läuft · auch bei gesperrtem Bildschirm",
    "Таймер идёт, даже когда экран заблокирован",
    "Timer running · even when your screen is locked",
  ],
  timerPaused: [
    "Gespeicherte Zeit dieser Leseeinheit",
    "Сохранённое время этого чтения",
    "Saved time for this reading session",
  ],
  read: ["Gelesen", "Прочитано", "Read"],
  markAll: ["Leseeinheit abschließen", "Завершить чтение", "Complete reading"],
  completed: [
    "Geschafft. Gut, dass du dir Zeit genommen hast.",
    "Готово. Хорошо, что ты нашёл время.",
    "Done. A little time well spent.",
  ],
  progress: ["Dein Fortschritt", "Твой прогресс", "Your progress"],
  chapters: ["Kapitel", "глав", "chapters"],
  byText: ["nach Textlänge", "по длине текста", "by text length"],
  totalTime: ["Lesezeit insgesamt", "Общее время чтения", "Total reading time"],
  avgTime: [
    "Pro gemessener Einheit",
    "На измеренное чтение",
    "Per timed session",
  ],
  measured: ["Tatsächlich gemessen", "Реально измерено", "Actually measured"],
  units: [
    "Abgeschlossene Einheiten",
    "Завершённые чтения",
    "Completed readings",
  ],
  upcoming: ["Als Nächstes", "Далее", "Coming up"],
  viewPlan: ["Leseplan ansehen", "Посмотреть план", "View reading plan"],
  rest: ["Zeit zum Nachlesen", "Время наверстать", "Catch-up day"],
  restSub: [
    "Heute sind keine neuen Kapitel eingeplant. Nutze die Zeit zum Nachlesen oder Innehalten.",
    "На сегодня нет новых глав. Можно наверстать пропущенное или поразмышлять.",
    "No new chapters today. Catch up or take a moment to reflect.",
  ],
  overdue: [
    "Offene Leseeinheiten",
    "Незавершённые чтения",
    "Unfinished readings",
  ],
  overdueSub: [
    "Dein Fortschritt bleibt erhalten. Wähle eine offene Einheit und lies in Ruhe weiter.",
    "Прогресс сохранён. Выбери незавершённое чтение и продолжай в своём темпе.",
    "Your progress is safe. Pick an unfinished reading and continue at your own pace.",
  ],
  selected: ["Ausgewählte Leseeinheit", "Выбранное чтение", "Selected reading"],
  previous: ["Zurück", "Назад", "Previous"],
  next: ["Weiter", "Далее", "Next"],
  page: ["Seite", "Страница", "Page"],
  noData: [
    "Deine erste Lesezeit wartet auf dich.",
    "Твоё первое чтение ещё впереди.",
    "Your first reading session is waiting.",
  ],
  chartTitle: ["Deine letzten 7 Tage", "Последние 7 дней", "Your last 7 days"],
  recent: ["Gemessene Leseeinheiten", "Измеренные чтения", "Timed readings"],
  noTimer: [
    "Starte den Timer beim Lesen, damit hier deine Zeiten erscheinen.",
    "Запускай таймер при чтении — здесь появится статистика.",
    "Start the timer while reading to see your times here.",
  ],
  reminders: [
    "Deine tägliche Erinnerung",
    "Ежедневное напоминание",
    "Your daily reminder",
  ],
  time: ["Uhrzeit", "Время", "Time"],
  timezone: ["Zeitzone", "Часовой пояс", "Time zone"],
  save: ["Speichern", "Сохранить", "Save"],
  calendar: [
    "Erinnerungen im Kalender",
    "Напоминания в календаре",
    "Calendar reminders",
  ],
  calendarSub: [
    "Lade deinen Plan mit einem Termin pro Tag und einer Erinnerung zur gewählten Uhrzeit. Die Termine enthalten die Kapitel. Aktiviere Mitteilungen für deinen Kalender.",
    "Скачай план: событие на каждый день с главами и напоминанием в выбранное время. Разреши уведомления для своего календаря.",
    "Download one event per day, including the chapters and a reminder at your chosen time. Enable notifications for your calendar.",
  ],
  download: [
    "Kalenderdatei laden (.ics)",
    "Скачать календарь (.ics)",
    "Download calendar (.ics)",
  ],
  calendarNote: [
    "Der Kalenderexport ist eine Momentaufnahme. Nach einer Anpassung deines Leseplans alte Termine entfernen und die neue Datei importieren. Die Termine ändern sich nicht automatisch.",
    "Экспорт календаря — снимок плана. После пересчёта удали старые события и импортируй новый файл. События не обновляются автоматически.",
    "The calendar export is a snapshot. After your plan changes, remove old events and import a new file. Events do not update automatically.",
  ],
  language: ["Sprache", "Язык", "Language"],
  languageNote: [
    "Die Sprache ändert die Oberfläche und Buchnamen, nicht die Kapitelzählung deiner Schlachter-2000-Papierbibel.",
    "Язык меняет интерфейс и названия книг, но не нумерацию глав печатной Библии Schlachter 2000.",
    "Language changes the interface and book names, not the chapter numbering of your Schlachter 2000 paper Bible.",
  ],
  installTitle: [
    "Installieren & offline nutzen",
    "Установка и работа без интернета",
    "Install & use offline",
  ],
  installLocal: [
    "Einmal vollständig laden, dann auf diesem Gerät weiterlesen. Plan, Kapitel und Lesezeiten bleiben lokal — ohne Konto.",
    "Полностью загрузи приложение один раз и продолжай на этом устройстве. План, главы и время чтения хранятся локально — без аккаунта.",
    "Load the complete app once, then keep reading on this device. Plans, chapters and reading times stay local — no account needed.",
  ],
  installed: ["Als App geöffnet", "Открыто как приложение", "Opened as an app"],
  installAndroid: [
    "Link in Chrome öffnen → Browser-Menü → App installieren oder Zum Startbildschirm hinzufügen. Danach über das neue Symbol öffnen.",
    "Открой ссылку в Chrome → меню браузера → Установить приложение или Добавить на главный экран. Затем открой через новый значок.",
    "Open the link in Chrome → browser menu → Install app or Add to Home screen. Then open it from the new icon.",
  ],
  installDesktop: [
    "In Chrome oder Edge über das Installationssymbol in der Adressleiste installieren. Auf dem Mac in Safari: Ablage → Zum Dock hinzufügen. Die App funktioniert auch im normalen Browser.",
    "В Chrome или Edge нажми значок установки в адресной строке. На Mac в Safari: Файл → Добавить в Dock. Приложение работает и в обычном браузере.",
    "In Chrome or Edge, use the install icon in the address bar. On Mac in Safari: File → Add to Dock. You can also use the app in a normal browser tab.",
  ],
  installThenPlan: [
    "Öffne zuerst die installierte App und erstelle dort deinen Plan. Einen vorhandenen Plan kannst du über eine Sicherung übertragen.",
    "Сначала открой установленное приложение и создай план в нём. Существующий план можно перенести через резервную копию.",
    "Open the installed app first and create your plan there. You can move an existing plan using a backup.",
  ],
  offlineChecking: [
    "Offline-Dateien werden geprüft …",
    "Проверяем офлайн-файлы …",
    "Checking offline files …",
  ],
  checkOffline: [
    "Offline-Speicherung prüfen",
    "Проверить офлайн-хранилище",
    "Check offline storage",
  ],
  storageProtected: [
    "Der Browser hat dauerhaften Speicher gewährt. Manuelles Löschen der App- oder Websitedaten kann deine Daten weiterhin entfernen.",
    "Браузер разрешил постоянное хранение. Ручное удаление приложения или данных сайта всё ещё может удалить твои данные.",
    "The browser granted persistent storage. Manually clearing app or website data can still erase your records.",
  ],
  storageStandard: [
    "Standard-Speicher: Der Browser hat dauerhaften Speicher noch nicht gewährt. Sichere deinen Fortschritt regelmäßig.",
    "Обычное хранилище: браузер пока не разрешил постоянное хранение. Регулярно сохраняй резервную копию.",
    "Standard storage: the browser has not granted persistent storage yet. Back up your progress regularly.",
  ],
  storageUnavailable: [
    "Der Schutz vor automatischer Speicherbereinigung lässt sich in diesem Browser nicht bestätigen. Sichere deinen Fortschritt regelmäßig.",
    "В этом браузере нельзя подтвердить защиту от автоматической очистки. Регулярно сохраняй резервную копию.",
    "Protection against automatic storage cleanup cannot be confirmed in this browser. Back up your progress regularly.",
  ],
  storageChecking: [
    "Speicherschutz wird geprüft …",
    "Проверяем защиту хранилища …",
    "Checking storage protection …",
  ],
  protectStorage: [
    "Dauerhaften Speicher anfragen",
    "Запросить постоянное хранение",
    "Request persistent storage",
  ],
  offlineLimit: [
    "Nach vollständiger Speicherung läuft Leseweg ohne Verbindung zum Anbieter. Für eine Neuinstallation oder gelöschte App-Dateien wird der Link wieder benötigt. Eine dauerhafte Verfügbarkeit auf dem Gerät kann der Browser nicht garantieren.",
    "После полной загрузки Leseweg работает без связи с сервером. Для переустановки или восстановления удалённых файлов снова нужна ссылка. Браузер не гарантирует постоянную доступность на устройстве.",
    "Once fully saved, Leseweg can run without a connection to the host. Reinstalling or restoring deleted app files needs the link again. The browser cannot guarantee permanent availability on your device.",
  ],
  offlineTest: [
    "Zum Testen: Flugmodus einschalten und die App über ihr Symbol neu öffnen. Anschließend wieder online gehen, wenn du möchtest.",
    "Проверка: включи авиарежим и заново открой приложение через его значок. Затем при желании снова подключись к сети.",
    "To test: switch on airplane mode and reopen the app from its icon. Reconnect afterwards whenever you want.",
  ],
  shareApp: ["App-Link weitergeben", "Поделиться ссылкой", "Share app link"],
  shareOnlyApp: [
    "Du teilst nur die App-Adresse, keine Lesedaten.",
    "Передаётся только ссылка на приложение, без данных о чтении.",
    "Only the app address is shared, never your reading data.",
  ],
  linkCopied: [
    "Link kopiert. Du kannst ihn in WhatsApp oder Telegram einfügen.",
    "Ссылка скопирована. Вставь её в WhatsApp или Telegram.",
    "Link copied. Paste it into WhatsApp or Telegram.",
  ],
  shareFailed: [
    "Teilen war nicht möglich. Kopiere die App-Adresse aus der Adressleiste.",
    "Не удалось поделиться. Скопируй адрес приложения из адресной строки.",
    "Sharing was unavailable. Copy the app address from the address bar.",
  ],
  localPreviewLink: [
    "Dies ist eine lokale Vorschau. Zum Weitergeben wird die öffentliche HTTPS-Adresse benötigt.",
    "Это локальный просмотр. Для передачи нужна общедоступная HTTPS-ссылка.",
    "This is a local preview. Sharing requires the public HTTPS address.",
  ],
  install: ["Auf deinem iPhone", "На твоём iPhone", "On your iPhone"],
  installSub: [
    "In Safari öffnen → Teilen → Zum Home-Bildschirm → Als Web-App öffnen.",
    "Открой в Safari → Поделиться → На экран «Домой» → Открывать как веб-приложение.",
    "Open in Safari → Share → Add to Home Screen → Open as Web App.",
  ],
  newPlan: ["Neuen Plan erstellen", "Создать новый план", "Create a new plan"],
  replaceTitle: [
    "Mit einem neuen Plan beginnen?",
    "Начать новый план?",
    "Start a new plan?",
  ],
  replaceText: [
    "Der bisherige Plan wird ersetzt. Lade vorher eine Sicherung herunter, um Fortschritt und Lesezeiten aufzubewahren.",
    "Текущий план будет заменён. Сначала скачай резервную копию, чтобы сохранить прогресс и время чтения.",
    "Your current plan will be replaced. Download a backup first to keep your progress and reading times.",
  ],
  cancel: ["Abbrechen", "Отмена", "Cancel"],
  confirm: ["Neuen Plan starten", "Начать новый план", "Start new plan"],
  export: [
    "Statistik exportieren (.csv)",
    "Экспорт статистики (.csv)",
    "Export statistics (.csv)",
  ],
  saving: ["Wird gespeichert …", "Сохранение …", "Saving …"],
  saved: ["Gespeichert", "Сохранено", "Saved"],
  error: [
    "Die Änderung konnte nicht gespeichert werden. Prüfe den freien Gerätespeicher und versuche es erneut.",
    "Не удалось сохранить изменение. Проверь свободное место на устройстве и попробуй ещё раз.",
    "The change could not be saved. Check your device’s free storage and try again.",
  ],
  loading: [
    "Dein Plan wird geladen …",
    "Загружаем твой план …",
    "Loading your plan …",
  ],
  retry: ["Erneut versuchen", "Попробовать снова", "Try again"],
  offline: [
    "Du bist offline. Dein Plan, Fortschritt und Timer werden auf diesem Gerät gespeichert.",
    "Нет сети. План, прогресс и таймер сохраняются на этом устройстве.",
    "You are offline. Your plan, progress and timer are saved on this device.",
  ],
  busyTimer: [
    "Ein Timer läuft bereits für eine andere Einheit. Stoppe ihn zuerst.",
    "Таймер уже идёт для другого чтения. Сначала останови его.",
    "A timer is already running for another reading. Stop it first.",
  ],
  goTimer: [
    "Zur laufenden Einheit",
    "К текущему чтению",
    "Go to active reading",
  ],
  longDay: [
    "Dieser Zeitraum bedeutet sehr viel Lesezeit pro Tag. Mit mehr Zeit wird der Plan leichter.",
    "При таком сроке придётся много читать каждый день. Более длинный срок облегчит план.",
    "This duration means a lot of reading each day. A longer plan will be easier to follow.",
  ],
  completePlan: [
    "Du hast die ganze Bibel gelesen.",
    "Ты прочитал всю Библию.",
    "You have read the whole Bible.",
  ],
  future: [
    "Dein Plan startet am",
    "Твой план начинается",
    "Your plan starts on",
  ],
  explain: [
    "So wird dein Plan berechnet",
    "Как рассчитывается план",
    "How your plan is calculated",
  ],
  planSub: [
    "Deine Empfehlungen passen sich nach jeder beendeten Leseeinheit an. Vergangene Tage zeigen, was du tatsächlich gelesen hast.",
    "Рекомендации обновляются после каждого завершённого чтения. Прошедшие дни показывают прочитанные главы.",
    "Recommendations adapt after every completed session. Past days show what you actually read.",
  ],
  statsSub: [
    "Dein Weg in Zahlen. Jeder gelesene Abschnitt zählt.",
    "Твой путь в цифрах. Каждая прочитанная глава имеет значение.",
    "Your journey in numbers. Every chapter counts.",
  ],
  timerNote: [
    "Starten, wenn du liest. Pausieren, wenn du eine Pause machst. Die Zeit bleibt beim Schließen der App erhalten.",
    "Запускай, когда читаешь. Ставь на паузу, когда отдыхаешь. Время сохраняется при закрытии приложения.",
    "Start when you read. Pause when you take a break. Your time is kept when the app is closed.",
  ],
  longTimer: [
    "Der Timer läuft seit über 4 Stunden. Falls du ihn vergessen hast, kannst du die Zeit dieser Einheit korrigieren.",
    "Таймер идёт больше 4 часов. Если ты забыл его выключить, можно исправить время этого чтения.",
    "The timer has been running for over 4 hours. If you forgot it, you can correct this session’s time.",
  ],
  editTime: ["Lesezeit korrigieren", "Исправить время", "Correct reading time"],
  minutesLabel: [
    "Gesamte Minuten dieser Einheit",
    "Всего минут этого чтения",
    "Total minutes for this reading",
  ],
  unavailable: [
    "Der Speicher dieses Browsers ist nicht verfügbar. Bitte verwende ein normales Browserfenster und erlaube das Speichern von Websitedaten.",
    "Хранилище браузера недоступно. Открой обычное окно браузера и разреши сохранение данных сайтов.",
    "Browser storage is unavailable. Please use a regular browser window and allow website data to be saved.",
  ],
  privacy: [
    "Auf deinem Gerät · Ohne Konto",
    "На твоём устройстве · Без аккаунта",
    "On your device · No account",
  ],
  timerStopped: [
    "Timer gestoppt. Lesezeit gespeichert.",
    "Таймер остановлен. Время сохранено.",
    "Timer stopped. Reading time saved.",
  ],
  calendarTitle: ["Bibel lesen", "Читать Библию", "Read the Bible"],
  theme: ["Darstellung", "Оформление", "Appearance"],
  light: ["Hell", "Светлая", "Light"],
  dark: ["Dunkel", "Тёмная", "Dark"],
  open: ["Offen", "Не завершено", "To read"],
  finished: ["Erledigt", "Готово", "Done"],
  history: ["Verlauf", "История", "History"],
  onlyInterface: [
    "Die Lesezeit ist eine Schätzung. Abgeschlossene Timer-Messungen passen sie an dein Tempo an.",
    "Время чтения приблизительное. Завершённые замеры таймером адаптируют прогноз к твоему темпу.",
    "Reading time is an estimate. Completed timer measurements adapt it to your pace.",
  ],
} satisfies Record<string, [string, string, string]>;
export type Texts = { [K in keyof typeof rows]: string };
export function text(lang: Lang): Texts {
  if (lang === "uk") return ukrainian;
  const i = { de: 0, ru: 1, en: 2 }[lang];
  return Object.fromEntries(
    Object.entries(rows).map(([k, v]) => [k, v[i]]),
  ) as Texts;
}
const en =
  "Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|1 Samuel|2 Samuel|1 Kings|2 Kings|1 Chronicles|2 Chronicles|Ezra|Nehemiah|Esther|Job|Psalms|Proverbs|Ecclesiastes|Song of Songs|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|1 Corinthians|2 Corinthians|Galatians|Ephesians|Philippians|Colossians|1 Thessalonians|2 Thessalonians|1 Timothy|2 Timothy|Titus|Philemon|Hebrews|James|1 Peter|2 Peter|1 John|2 John|3 John|Jude|Revelation".split(
    "|",
  );
const ru =
  "Бытие|Исход|Левит|Числа|Второзаконие|Иисус Навин|Судьи|Руфь|1 Царств|2 Царств|3 Царств|4 Царств|1 Паралипоменон|2 Паралипоменон|Ездра|Неемия|Есфирь|Иов|Псалмы|Притчи|Екклесиаст|Песнь песней|Исаия|Иеремия|Плач Иеремии|Иезекииль|Даниил|Осия|Иоиль|Амос|Авдий|Иона|Михей|Наум|Аввакум|Софония|Аггей|Захария|Малахия|Матфей|Марк|Лука|Иоанн|Деяния|Римлянам|1 Коринфянам|2 Коринфянам|Галатам|Ефесянам|Филиппийцам|Колоссянам|1 Фессалоникийцам|2 Фессалоникийцам|1 Тимофею|2 Тимофею|Титу|Филимону|Евреям|Иакова|1 Петра|2 Петра|1 Иоанна|2 Иоанна|3 Иоанна|Иуды|Откровение".split(
    "|",
  );
export function bookNames(lang: Lang) {
  if (lang === "uk") return ukrainianBooks;
  return lang === "en" ? en : lang === "ru" ? ru : undefined;
}
