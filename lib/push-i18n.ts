import type { Lang } from "./i18n";
const messages = {
  de: {
    title: "Push-Erinnerung auf diesem Gerät",
    intro:
      "Leseweg erinnert dich täglich an deine Papierbibel – auch wenn die App geschlossen ist.",
    privacy:
      "Optional: Cloudflare speichert die technische Push-Anmeldung, Uhrzeit, Zeitzone und Sprache. Leseplan, Kapitel und Lesezeiten bleiben auf deinem Gerät. Beim Ausschalten wird die Anmeldung gelöscht.",
    enable: "Erinnerungen aktivieren",
    disable: "Erinnerungen ausschalten",
    test: "Testnachricht senden",
    retry: "Erneut versuchen",
    active: "Tägliche Erinnerung ist aktiv",
    inactive: "Erinnerungen sind ausgeschaltet.",
    next: "Nächste Erinnerung",
    savedTime: "Es gilt die oben gespeicherte Uhrzeit und Zeitzone.",
    checking: "Erinnerungsdienst wird geprüft …",
    updating: "Erinnerungseinstellungen werden übertragen …",
    testSent:
      "Testnachricht an den Push-Dienst übergeben. Prüfe die Mitteilungen auf deinem Gerät.",
    blocked:
      "Mitteilungen sind im Browser oder in den Geräteeinstellungen blockiert. Erlaube sie dort für Leseweg und versuche es erneut.",
    install:
      "Auf dem iPhone/iPad zuerst in Safari zum Home-Bildschirm hinzufügen. Öffne danach Leseweg über das App-Symbol und aktiviere hier die Erinnerungen.",
    unsupported:
      "Dieser Browser unterstützt keine Web-Push-Mitteilungen. Nutze die installierte App oder einen aktuellen unterstützten Browser.",
    notConfigured:
      "Der Erinnerungsdienst ist noch nicht freigeschaltet. Die Kalender-Erinnerung kannst du bereits nutzen.",
    offline:
      "Zum Aktivieren, Ändern und Testen ist Internet nötig. Bereits gespeicherte Erinnerungen bleiben beim Dienst aktiv.",
    pendingDelete:
      "Auf diesem Gerät ausgeschaltet. Der Servereintrag wird beim nächsten Online-Aufruf entfernt.",
    failed:
      "Der Erinnerungsdienst ist gerade nicht erreichbar. Deine letzten bestätigten Einstellungen bleiben erhalten. Versuche es erneut.",
    limited:
      "Bitte warte eine Minute, bevor du erneut eine Nachricht sendest oder Einstellungen speicherst.",
    expired:
      "Diese Push-Anmeldung ist abgelaufen. Schalte Erinnerungen aus und aktiviere sie anschließend erneut.",
    conflict:
      "Für diese Browser-Anmeldung fehlt der lokale Schlüssel. Schalte die Erinnerungen hier aus und aktiviere sie erneut.",
    delivery:
      "Internet und erlaubte Mitteilungen sind erforderlich. Fokusmodus und Geräteeinstellungen können die Zustellung verzögern. Bei vielen gleichzeitigen Erinnerungen wird der Versand auf die nächsten Minuten verteilt.",
    syncingError:
      "Die neue Uhrzeit/Sprache wurde noch nicht an den Dienst übertragen. Bis dahin gelten dort die letzten bestätigten Einstellungen.",
  },
  en: {
    title: "Push reminders on this device",
    intro:
      "Leseweg reminds you to read your paper Bible every day, even when the app is closed.",
    privacy:
      "Optional: Cloudflare stores the technical push subscription, time, time zone and language. Your plan, chapters and reading times stay on your device. Turning reminders off deletes the subscription.",
    enable: "Enable reminders",
    disable: "Turn off reminders",
    test: "Send test notification",
    retry: "Try again",
    active: "Daily reminder is enabled",
    inactive: "Reminders are turned off.",
    next: "Next reminder",
    savedTime: "Uses the time and time zone saved above.",
    checking: "Checking the reminder service…",
    updating: "Updating reminder settings…",
    testSent:
      "Test notification submitted to the push service. Check your device's notifications.",
    blocked:
      "Notifications are blocked in your browser or device settings. Allow them for Leseweg there, then try again.",
    install:
      "On iPhone/iPad, first add Leseweg to the Home Screen using Safari. Open its app icon, then enable reminders here.",
    unsupported:
      "This browser does not support Web Push. Use the installed app or a current supported browser.",
    notConfigured:
      "The reminder service is not enabled yet. You can already use calendar reminders.",
    offline:
      "An internet connection is needed to enable, update or test reminders. Previously saved reminders remain active at the service.",
    pendingDelete:
      "Turned off on this device. The server entry will be removed the next time you open the app online.",
    failed:
      "The reminder service is currently unavailable. Your last confirmed settings remain in effect. Please try again.",
    limited:
      "Please wait a minute before sending another test or saving settings again.",
    expired:
      "This push subscription has expired. Turn reminders off, then enable them again.",
    conflict:
      "The local key for this browser subscription is missing. Turn reminders off here, then enable them again.",
    delivery:
      "Internet and notification permission are required. Focus mode and device settings may delay delivery. Large groups of simultaneous reminders are spread over the next few minutes.",
    syncingError:
      "The new time/language has not reached the service yet. Your last confirmed settings remain in effect until it does.",
  },
  ru: {
    title: "Push-напоминания на этом устройстве",
    intro:
      "Leseweg ежедневно напоминает о чтении бумажной Библии, даже когда приложение закрыто.",
    privacy:
      "По желанию: Cloudflare хранит техническую подписку на уведомления, время, часовой пояс и язык. План, главы и время чтения остаются на устройстве. При отключении подписка удаляется.",
    enable: "Включить напоминания",
    disable: "Отключить напоминания",
    test: "Отправить проверочное уведомление",
    retry: "Попробовать снова",
    active: "Ежедневное напоминание включено",
    inactive: "Напоминания отключены.",
    next: "Следующее напоминание",
    savedTime: "Используются сохранённые выше время и часовой пояс.",
    checking: "Проверяем службу напоминаний…",
    updating: "Обновляем настройки напоминаний…",
    testSent:
      "Проверочное сообщение передано службе push. Проверь уведомления на устройстве.",
    blocked:
      "Уведомления заблокированы в браузере или настройках устройства. Разреши их для Leseweg и повтори попытку.",
    install:
      "На iPhone/iPad сначала добавь Leseweg на экран «Домой» через Safari. Открой приложение с его значка и включи напоминания здесь.",
    unsupported:
      "Этот браузер не поддерживает Web Push. Используй установленное приложение или современный поддерживаемый браузер.",
    notConfigured:
      "Служба напоминаний ещё не включена. Пока можно использовать напоминания календаря.",
    offline:
      "Для включения, изменения и проверки нужен интернет. Уже сохранённые напоминания остаются активными на сервере.",
    pendingDelete:
      "На устройстве отключено. Запись на сервере будет удалена при следующем открытии приложения с интернетом.",
    failed:
      "Служба напоминаний сейчас недоступна. Последние подтверждённые настройки сохраняются. Попробуй снова.",
    limited:
      "Подожди минуту перед следующей проверкой или сохранением настроек.",
    expired:
      "Подписка на уведомления истекла. Отключи напоминания, затем включи их снова.",
    conflict:
      "Локальный ключ этой подписки отсутствует. Отключи напоминания здесь и включи их снова.",
    delivery:
      "Нужны интернет и разрешение на уведомления. Режим фокусирования и настройки устройства могут задерживать доставку. Большое число одновременных напоминаний распределяется на следующие минуты.",
    syncingError:
      "Новое время или язык ещё не переданы серверу. До передачи действуют последние подтверждённые настройки.",
  },
};
export const pushText = (lang: Lang) => messages[lang];
