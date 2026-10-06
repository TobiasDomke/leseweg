import type { Lang } from "./languages";
const de = {
  legacyEdition:
    "Dein bisheriger Plan verwendet die frühere Schlachter-Kapitelgrundlage. Prüfe unter Einstellungen die Bibelausgabe deiner Papierbibel.",
  paceUse: "Für die Zeitschätzung",
  automatic: "Automatisch prüfen",
  confirmed: "Bestätigt verwenden",
  excludedChoice: "Nicht verwenden",
  dailyMeasured: "Gespeicherte Zeit dieses Lesetages",
  install: "Zuerst Leseweg installieren",
  installHelp:
    "Dein Bibelleseplan, Timer und Fortschritt – als App auf deinem Gerät. Öffne Leseweg nach der Installation über das App-Symbol.",
  installButton: "App installieren",
  openIcon: "Öffne jetzt Leseweg über das App-Symbol.",
  installFailed: "Bitte nutze die Installationsanleitung für dein Gerät.",
  apple:
    "Öffne diesen Link in Safari. Tippe auf Teilen → Zum Home-Bildschirm. Aktiviere „Als Web-App öffnen“, falls angezeigt, und tippe auf Hinzufügen.",
  android:
    "Öffne diesen Link in Chrome. Wähle im Menü „App installieren“ oder „Zum Startbildschirm hinzufügen“.",
  desktop:
    "In Chrome oder Edge: Installationssymbol in der Adressleiste. Auf dem Mac auch in Safari: Ablage → Zum Dock hinzufügen. Falls dein Browser keine Installation anbietet, öffne den Link in einem dieser Browser.",
  browserData:
    "Du hast hier bereits Lesedaten. Exportiere sie vor der Installation. Falls sie in der installierten App fehlen, kannst du die Sicherung dort einlesen.",
  more: "Weitere Optionen",
  edition: "Deine Bibelausgabe",
  editionHelp:
    "Diese Ausgabe bestimmt Kapitelnummern und Psalmzuordnung. Ein Wechsel der Menüsprache verändert einen bestehenden Plan nicht. Alle vier Ausgaben umfassen hier 66 Bücher; zusätzliche Bücher orthodoxer oder katholischer Bibeln sind nicht enthalten.",
  switchEdition: "Bibelausgabe ändern",
  switchHelp:
    "Die Lesezeit bleibt erhalten. Vollständig gelesene Bücher werden übernommen. Teilweise gelesene Psalmen, Joel oder Maleachi mit anderer Einteilung musst du erneut prüfen; sie werden vorsichtshalber wieder eingeplant. Die persönliche Zeitschätzung lernt danach neu. Exportiere vorher eine Sicherung.",
  reviewEdition:
    "Bitte prüfe diese früheren Kapitel in deiner Papierbibel und markiere sie unter „Vorher schon gelesen“, soweit sie vollständig gelesen sind:",
  reviewed: "Geprüft",
  learning: "Schätzung lernt dein Lesetempo",
  paceHelp:
    "Die Schätzung nähert sich deinem Tempo schrittweise an. Nach mindestens fünf passenden Messungen und ausreichend Text verwendet sie deinen persönlichen Durchschnitt.",
  outlier:
    "Diese Messung ist ungewöhnlich kurz oder lang. Sie bleibt in deiner Lesezeit gespeichert. Für die Prognose wird sie nur verwendet, wenn du sie bestätigst.",
  confirmPace: "Die gemessene Zeit stimmt und soll die Prognose beeinflussen.",
  excluded: "Auffällige oder ausgeschlossene Messungen",
  lastExport: "Letzter Export gestartet",
  neverExport: "Noch keine Sicherung exportiert.",
  backupReminder:
    "Sichere deinen Fortschritt regelmäßig als Datei. Deine Lesedaten sind nur auf diesem Gerät gespeichert.",
  backupLater: "In einer Woche erinnern",
  backupGo: "Zur Sicherung",
  backupCaution: "Prüfe, ob die Datei im Download-Ordner gespeichert wurde.",
  finish: "Lesen beenden",
  advanced: "Details und Optionen",
  approxWeights:
    "Die Gewichtung verwendet angenäherte Textlängen. Es werden keine Bibeltexte gespeichert.",
  legacySessions:
    "Ältere Einheiten sind teilweise aus Tagessummen rekonstruiert.",
};
type Copy = typeof de;
const en: Copy = {
  legacyEdition:
    "Your existing plan uses the earlier Schlachter chapter structure. Check your printed Bible edition in Settings.",
  paceUse: "Use for estimates",
  automatic: "Check automatically",
  confirmed: "Confirmed",
  excludedChoice: "Exclude",
  dailyMeasured: "Saved time for this reading day",
  install: "Install Leseweg first",
  installHelp:
    "Your Bible plan, timer and progress – as an app on your device. After installation, open Leseweg using its app icon.",
  installButton: "Install app",
  openIcon: "Now open Leseweg using its app icon.",
  installFailed: "Please follow the installation instructions for your device.",
  apple:
    "Open this link in Safari. Tap Share → Add to Home Screen. Enable “Open as Web App” if shown, then tap Add.",
  android:
    "Open this link in Chrome. From the menu choose “Install app” or “Add to Home screen”.",
  desktop:
    "In Chrome or Edge, use the install icon in the address bar. On Mac, Safari also offers File → Add to Dock. If your browser has no installation option, open the link in one of these browsers.",
  browserData:
    "You already have reading data here. Export it before installing. If it is missing in the installed app, import the backup there.",
  more: "More options",
  edition: "Your Bible edition",
  editionHelp:
    "This edition determines chapter and Psalm numbering. Changing the interface language does not change an existing plan. These four editions cover 66 books; additional Orthodox or Catholic books are not included.",
  switchEdition: "Change Bible edition",
  switchHelp:
    "Reading time is retained. Fully read books are carried over. Partly read Psalms, Joel or Malachi with different divisions must be checked again and are scheduled again as a precaution. Your personal estimate will learn afresh. Export a backup first.",
  reviewEdition:
    "Check these earlier chapters in your printed Bible and mark them under “Previously read” if fully read:",
  reviewed: "Reviewed",
  learning: "Learning your reading pace",
  paceHelp:
    "The estimate gradually adapts to your pace. After at least five suitable measurements and enough text, it uses your personal average.",
  outlier:
    "This measurement is unusually short or long. It stays in your recorded reading time, but only affects estimates if you confirm it.",
  confirmPace: "The measured time is correct and should affect estimates.",
  excluded: "Unusual or excluded measurements",
  lastExport: "Last export started",
  neverExport: "No backup exported yet.",
  backupReminder:
    "Back up your progress regularly to a file. Your reading data is stored only on this device.",
  backupLater: "Remind me in a week",
  backupGo: "Open backups",
  backupCaution: "Check that the file was saved in your Downloads folder.",
  finish: "Finish reading",
  advanced: "Details and options",
  approxWeights:
    "Weighting uses approximate text lengths. No Bible text is stored.",
  legacySessions: "Some older sessions are reconstructed from daily totals.",
};
const ru: Copy = {
  legacyEdition:
    "Ваш прежний план использует старую нумерацию глав Schlachter. Проверьте перевод вашей бумажной Библии в настройках.",
  paceUse: "Для прогноза времени",
  automatic: "Проверять автоматически",
  confirmed: "Подтверждено",
  excludedChoice: "Не использовать",
  dailyMeasured: "Сохранённое время за этот день",
  install: "Сначала установите Leseweg",
  installHelp:
    "План чтения Библии, таймер и прогресс — в приложении на вашем устройстве. После установки откройте Leseweg через значок приложения.",
  installButton: "Установить приложение",
  openIcon: "Теперь откройте Leseweg через значок приложения.",
  installFailed: "Следуйте инструкции по установке для вашего устройства.",
  apple:
    "Откройте ссылку в Safari. Нажмите «Поделиться» → «На экран Домой». Включите «Открывать как веб-приложение», если этот пункт доступен, и нажмите «Добавить».",
  android:
    "Откройте ссылку в Chrome. В меню выберите «Установить приложение» или «Добавить на главный экран».",
  desktop:
    "В Chrome или Edge используйте значок установки в адресной строке. На Mac в Safari: Файл → Добавить в Dock. Если установка недоступна, откройте ссылку в одном из этих браузеров.",
  browserData:
    "Здесь уже есть ваши данные. Экспортируйте их перед установкой. Если в установленном приложении их не будет, импортируйте туда резервную копию.",
  more: "Другие возможности",
  edition: "Ваш перевод Библии",
  editionHelp:
    "Перевод определяет нумерацию глав и псалмов. Смена языка интерфейса не меняет существующий план. Все четыре издания здесь содержат 66 книг; дополнительные книги православных и католических Библий не включены.",
  switchEdition: "Изменить перевод",
  switchHelp:
    "Время чтения сохраняется. Полностью прочитанные книги переносятся. Частично прочитанные Псалмы, Иоиль или Малахия с другим делением требуют повторной проверки и пока включаются в план. Оценка времени начнёт обучение заново. Сначала экспортируйте резервную копию.",
  reviewEdition:
    "Сверьте эти главы с вашей бумажной Библией и отметьте их в разделе «Уже прочитано», если прочитали полностью:",
  reviewed: "Проверено",
  learning: "Изучаем ваш темп чтения",
  paceHelp:
    "Оценка постепенно подстраивается под вас. После как минимум пяти подходящих замеров и достаточного объёма текста используется ваш средний темп.",
  outlier:
    "Это измерение необычно короткое или длинное. Время сохраняется в статистике, но влияет на прогноз только после подтверждения.",
  confirmPace: "Время измерено верно и должно влиять на прогноз.",
  excluded: "Необычные или исключённые измерения",
  lastExport: "Последний экспорт начат",
  neverExport: "Резервная копия ещё не экспортирована.",
  backupReminder:
    "Регулярно сохраняйте прогресс в файл. Данные чтения хранятся только на этом устройстве.",
  backupLater: "Напомнить через неделю",
  backupGo: "К резервным копиям",
  backupCaution: "Проверьте, что файл сохранился в папке загрузок.",
  finish: "Завершить чтение",
  advanced: "Подробности и настройки",
  approxWeights:
    "Распределение учитывает приблизительную длину текста. Текст Библии не сохраняется.",
  legacySessions: "Некоторые старые сеансы восстановлены по дневным итогам.",
};
const uk: Copy = {
  legacyEdition:
    "Ваш попередній план використовує стару нумерацію розділів Schlachter. Перевірте переклад вашої паперової Біблії в налаштуваннях.",
  paceUse: "Для прогнозу часу",
  automatic: "Перевіряти автоматично",
  confirmed: "Підтверджено",
  excludedChoice: "Не використовувати",
  dailyMeasured: "Збережений час за цей день",
  install: "Спочатку встановіть Leseweg",
  installHelp:
    "План читання Біблії, таймер і поступ — у застосунку на вашому пристрої. Після встановлення відкрийте Leseweg через значок застосунку.",
  installButton: "Встановити застосунок",
  openIcon: "Тепер відкрийте Leseweg через значок застосунку.",
  installFailed:
    "Скористайтеся інструкцією зі встановлення для вашого пристрою.",
  apple:
    "Відкрийте посилання в Safari. Натисніть «Поширити» → «На початковий екран». Увімкніть «Відкривати як вебзастосунок», якщо цей пункт є, і натисніть «Додати».",
  android:
    "Відкрийте посилання в Chrome. У меню виберіть «Встановити застосунок» або «Додати на головний екран».",
  desktop:
    "У Chrome або Edge скористайтеся значком встановлення в адресному рядку. На Mac у Safari: Файл → Додати в Dock. Якщо встановлення недоступне, відкрийте посилання в одному з цих браузерів.",
  browserData:
    "Тут уже є ваші дані. Експортуйте їх перед встановленням. Якщо у встановленому застосунку їх немає, імпортуйте туди резервну копію.",
  more: "Інші можливості",
  edition: "Ваш переклад Біблії",
  editionHelp:
    "Переклад визначає нумерацію розділів і псалмів. Зміна мови інтерфейсу не змінює чинний план. Усі чотири видання тут містять 66 книг; додаткові книги православних чи католицьких Біблій не включені.",
  switchEdition: "Змінити переклад",
  switchHelp:
    "Час читання зберігається. Повністю прочитані книги переносяться. Частково прочитані Псалми, Йоіл чи Малахія з іншим поділом потребують повторної перевірки й поки включаються до плану. Оцінка часу навчатиметься заново. Спочатку експортуйте резервну копію.",
  reviewEdition:
    "Звірте ці розділи з паперовою Біблією та позначте їх у розділі «Уже прочитано», якщо прочитали повністю:",
  reviewed: "Перевірено",
  learning: "Вивчаємо ваш темп читання",
  paceHelp:
    "Оцінка поступово підлаштовується під вас. Після щонайменше п’яти відповідних вимірювань і достатнього обсягу тексту використовується ваш середній темп.",
  outlier:
    "Це вимірювання незвично коротке або довге. Час залишається у статистиці, але впливає на прогноз лише після підтвердження.",
  confirmPace: "Час виміряно правильно й має впливати на прогноз.",
  excluded: "Незвичні або виключені вимірювання",
  lastExport: "Останній експорт розпочато",
  neverExport: "Резервну копію ще не експортовано.",
  backupReminder:
    "Регулярно зберігайте поступ у файл. Дані читання зберігаються лише на цьому пристрої.",
  backupLater: "Нагадати за тиждень",
  backupGo: "До резервних копій",
  backupCaution: "Перевірте, що файл збережено в папці завантажень.",
  finish: "Завершити читання",
  advanced: "Подробиці та налаштування",
  approxWeights:
    "Розподіл враховує приблизну довжину тексту. Текст Біблії не зберігається.",
  legacySessions: "Деякі старі сеанси відновлено за денними підсумками.",
};
export const experienceText = (lang: Lang): Copy => ({ de, en, ru, uk })[lang];
