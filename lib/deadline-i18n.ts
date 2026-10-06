import type { Lang } from "./languages";
const de = {
  mode: "Wie möchtest du dein Ziel festlegen?",
  duration: "Dauer",
  date: "Festes Zieldatum",
  end: "Bis zu diesem Tag lesen",
  edit: "Zieldatum ändern",
  saved: "Zieldatum und Leseplan aktualisiert.",
  help: "Wähle einen früheren oder späteren Termin. Alle noch ungelesenen Kapitel werden nach Textlänge auf die verbleibenden Tage verteilt. Dein Fortschritt und deine Lesezeiten bleiben erhalten.",
  inclusive: "Der ausgewählte Zieltag zählt als Lesetag mit.",
  bounds:
    "Wähle ein Datum zwischen {min} und {max}. Bereits aufgezeichnete Leseeinheiten bleiben erhalten.",
  preview: "Neue Aufteilung",
  remaining: "{chapters} Kapitel auf {days} verbleibende Tage",
  estimate: "Ungefähr {minutes} Minuten pro Tag",
  pause:
    "Pausiere zuerst den laufenden Timer. Danach kannst du den Termin ändern.",
  today:
    "Für dein neues Ziel werden die noch offenen Kapitel heute eingeplant. Du kannst heute weiterlesen.",
  balanced:
    "Nach ausgelassenen Tagen oder zusätzlichem Lesen verteilt sich der offene Lesestoff neu auf alle verbleibenden Tage bis zu deinem Ziel.",
};
const en: typeof de = {
  mode: "How would you like to set your goal?",
  duration: "Duration",
  date: "Fixed finish date",
  end: "Finish reading by",
  edit: "Change finish date",
  saved: "Finish date and reading plan updated.",
  help: "Choose an earlier or later date. All unread chapters are spread over the remaining days by text length. Your progress and recorded reading time are kept.",
  inclusive: "The selected finish date is included as a reading day.",
  bounds:
    "Choose a date between {min} and {max}. Recorded reading sessions are preserved.",
  preview: "New schedule",
  remaining: "{chapters} chapters over {days} remaining days",
  estimate: "About {minutes} minutes per day",
  pause: "Pause the running timer first. Then you can change the date.",
  today:
    "Your remaining chapters are scheduled for today to meet your new goal. You can continue reading today.",
  balanced:
    "After missed days or extra reading, unread passages are redistributed across all remaining days up to your goal.",
};
const ru: typeof de = {
  mode: "Как вы хотите задать цель?",
  duration: "Продолжительность",
  date: "Точная дата завершения",
  end: "Прочитать до этого дня",
  edit: "Изменить дату завершения",
  saved: "Дата завершения и план обновлены.",
  help: "Выберите более раннюю или позднюю дату. Все непрочитанные главы распределятся по оставшимся дням с учётом длины текста. Прогресс и время чтения сохранятся.",
  inclusive: "Выбранный последний день также входит в план чтения.",
  bounds:
    "Выберите дату между {min} и {max}. Записанные сеансы чтения сохраняются.",
  preview: "Новое распределение",
  remaining: "Осталось {chapters} глав на {days} дней",
  estimate: "Примерно {minutes} минут в день",
  pause: "Сначала приостановите работающий таймер. Затем можно изменить дату.",
  today:
    "Чтобы достичь новой цели, оставшиеся главы запланированы на сегодня. Можно продолжить чтение сегодня.",
  balanced:
    "После пропущенных дней или дополнительного чтения непрочитанные главы перераспределяются по всем оставшимся дням до вашей цели.",
};
const uk: typeof de = {
  mode: "Як ви хочете визначити мету?",
  duration: "Тривалість",
  date: "Точна дата завершення",
  end: "Прочитати до цього дня",
  edit: "Змінити дату завершення",
  saved: "Дату завершення та план оновлено.",
  help: "Виберіть ранішу або пізнішу дату. Усі непрочитані розділи розподіляться на решту днів з урахуванням довжини тексту. Прогрес і час читання збережуться.",
  inclusive: "Вибраний останній день також входить до плану читання.",
  bounds:
    "Виберіть дату між {min} і {max}. Записані сеанси читання зберігаються.",
  preview: "Новий розподіл",
  remaining: "Залишилося {chapters} розділів на {days} днів",
  estimate: "Приблизно {minutes} хвилин на день",
  pause: "Спочатку призупиніть таймер. Потім можна змінити дату.",
  today:
    "Щоб досягти нової мети, решту розділів заплановано на сьогодні. Можна продовжити читання сьогодні.",
  balanced:
    "Після пропущених днів або додаткового читання непрочитані розділи перерозподіляються на всі дні, що залишилися до вашої мети.",
};
export const deadlineTranslations = { de, en, ru, uk };
export const deadlineText = (lang: Lang) => deadlineTranslations[lang];
