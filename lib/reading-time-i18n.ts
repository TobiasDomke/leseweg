import type { Lang } from "./languages";
const de = {
  title: "Deine Lesezeit bis zum Ziel",
  past: "Bisher insgesamt · inkl. Schätzung",
  unmeasured: "Im Plan ohne Zeitmessung · geschätzt",
  remaining: "Noch benötigte Lesezeit · geschätzt",
  total: "Gesamt bis zum Abschluss · inkl. Schätzung",
  help: "Die Gesamtzeit setzt sich aus bisheriger und verbleibender Lesezeit zusammen. Schätzungen folgen deinem aktuellen Lesetempo und der Textlänge; anfangs gilt ein Startwert. Die Berechnung berücksichtigt Sekunden, die Anzeige ist auf Minuten gerundet.",
  unmeasuredHelp:
    "Für im Plan gelesene Kapitel ohne Zeitmessung wird die Zeit separat geschätzt. Deine gemessene Lesezeit bleibt unverändert.",
  chart: "Stunden:Minuten",
  daily: "pro Tag",
  hours: "Stunden",
  invalidCorrection:
    "Bitte gib ganze Zahlen ein: Minuten und Sekunden von 0 bis 59, insgesamt höchstens 24 Stunden.",
  minutes: "Minuten",
  seconds: "Sekunden",
  correction:
    "Gesamte gemessene Zeit dieser Leseeinheit. Sekunden bleiben erhalten; maximal 24 Stunden.",
};
const en: typeof de = {
  title: "Your reading time through completion",
  past: "Time so far · including estimates",
  unmeasured: "Read without timing · estimated",
  remaining: "Reading time still needed · estimated",
  total: "Total through completion · including estimates",
  help: "The total combines past and remaining reading time. Estimates follow your current reading pace and text length, starting with a default pace. Calculations retain seconds; displayed times are rounded to minutes.",
  unmeasuredHelp:
    "Time for chapters read in the plan without timing is estimated separately. Your recorded reading time is unchanged.",
  chart: "Hours:Minutes",
  daily: "per day",
  hours: "Hours",
  invalidCorrection:
    "Enter whole numbers: minutes and seconds from 0 to 59, with a total of no more than 24 hours.",
  minutes: "Minutes",
  seconds: "Seconds",
  correction:
    "Total recorded time for this reading unit. Seconds are preserved; up to 24 hours.",
};
const ru: typeof de = {
  title: "Время чтения до завершения",
  past: "Потрачено · включая оценку",
  unmeasured: "Прочитано без замера времени · оценка",
  remaining: "Оставшееся время чтения · оценка",
  total: "Всего до завершения · включая оценку",
  help: "Общее время складывается из уже потраченного и оставшегося. Оценки учитывают ваш текущий темп и длину текста; сначала используется начальный темп. При расчёте учитываются секунды, на экране время округляется до минут.",
  unmeasuredHelp:
    "Время для прочитанных в плане глав без замера оценивается отдельно. Записанное время чтения не изменяется.",
  chart: "Часы:Минуты",
  daily: "в день",
  hours: "Часы",
  invalidCorrection:
    "Введите целые числа: минуты и секунды от 0 до 59, суммарно не более 24 часов.",
  minutes: "Минуты",
  seconds: "Секунды",
  correction:
    "Общее записанное время этого раздела плана. Секунды сохраняются; не более 24 часов.",
};
const uk: typeof de = {
  title: "Час читання до завершення",
  past: "Витрачено · включно з оцінкою",
  unmeasured: "Прочитано без вимірювання часу · оцінка",
  remaining: "Час читання, що залишився · оцінка",
  total: "Загалом до завершення · включно з оцінкою",
  help: "Загальний час складається з уже витраченого та часу, що залишився. Оцінки враховують ваш поточний темп і довжину тексту; спочатку використовується початковий темп. Розрахунок враховує секунди, на екрані час округлюється до хвилин.",
  unmeasuredHelp:
    "Час для прочитаних у плані розділів без вимірювання оцінюється окремо. Записаний час читання не змінюється.",
  chart: "Години:Хвилини",
  daily: "на день",
  hours: "Години",
  invalidCorrection:
    "Введіть цілі числа: хвилини й секунди від 0 до 59, загалом не більше 24 годин.",
  minutes: "Хвилини",
  seconds: "Секунди",
  correction:
    "Загальний записаний час цієї частини плану. Секунди зберігаються; не більше 24 годин.",
};
export const readingTimeTranslations = { de, en, ru, uk };
export const readingTimeText = (lang: Lang) => readingTimeTranslations[lang];
