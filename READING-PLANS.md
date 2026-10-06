# Lesereihenfolgen und früherer Fortschritt

Ab Version 1.7 wählt die Einrichtung unabhängig voneinander den Umfang
(gesamte Bibel, AT, NT), die Reihenfolge und den Zeitraum. Sie verwendet
weiterhin die 66 Bücher und die Kapitelzählung der Schlachter-2000-Bibel:
1.189 Kapitel insgesamt, davon 929 im AT und 260 im NT. Die Oberfläche kann
übersetzt werden, ohne zur abweichenden Psalmzählung anderer Ausgaben zu wechseln.

## Reihenfolgen

- **Biblische Reihenfolge:** jedes Buch fortlaufend in der gedruckten Reihenfolge.
- **Ausgewogen abwechselnd:** vier fortlaufende Stränge (AT-Geschichte/Propheten,
  AT-Weisheit, Evangelien/Apostelgeschichte, NT-Briefe/Offenbarung). Der nächste
  Strang wird nach seinem bisherigen Anteil an der gesamten Wortmenge gewählt.
  Innerhalb jedes Strangs bleibt die Reihenfolge erhalten. Bei AT/NT entfallen
  die nicht zum Umfang gehörenden Stränge. Es werden keine Kapitel wiederholt.
- **Chronologisch & Zusammenhänge:** eine eigene, versionierte Anordnung von
  ganzen Kapitelgruppen entlang der biblischen Geschichte. Die Vorlage steht
  vollständig und überprüfbar in `lib/reading-order.ts`. Sie ist keine
  versgenaue Rekonstruktion und keine Übernahme des 365-Tage-Rasters eines
  fremden Herausgebers. Tagesportionen berechnet Leseweg selbst aus Wortgewichten,
  Restzeit und bereits gelesenen Kapiteln.

Die chronologische Vorlage hält in vielen Fällen größere Buchabschnitte zusammen,
auch wenn ihre Ereignisse zeitlich überlappen. Hiob, einzelne Propheten, Psalmen
und Briefe sind nicht einheitlich datierbar. Nicht einzeln zugeordnete Psalmen
bleiben als undatierte Sammlung zusammen. Chronik-Genealogien sind als Überblick
gekennzeichnet. Die Evangelien stehen nach größeren Lebensphasen nebeneinander.
Historische Einordnungen sind redaktionelle Orientierung, keine Behauptung
historischer Gewissheit. Die App erklärt diese Grenzen direkt bei der Auswahl
und in den Kontextinformationen der Leseeinheit.

### Primärtext-Anker der Erläuterungen

Die Erläuterungen sind eigene Zusammenfassungen; die App enthält keine Bibeltexte.

- [2. Samuel 11–12 und Psalm 51](https://www.biblegateway.com/passage/?search=2%20Samuel%2011-12%3B%20Psalm%2051&version=SCH2000):
  Die Psalmüberschrift nennt Nathans Besuch nach Davids Begegnung mit Bathseba.
- [2. Samuel 15 und Psalm 3](https://www.biblegateway.com/passage/?search=2%20Samuel%2015%3B%20Psalm%203&version=SCH2000):
  Die Psalmüberschrift nennt Davids Flucht vor Absalom.
- [2. Samuel 6; 1. Chronik 13–16](https://www.biblegateway.com/passage/?search=2%20Samuel%206%3B%201%20Chronicles%2013-16&version=SCH2000):
  Bundeslade; das Danklied in 1. Chronik 16 hat Textparallelen zu Psalm 96, 105
  und 106. Das bedeutet keine sichere Datierung jedes vollständigen Psalms.
- [2. Samuel 22 und Psalm 18](https://www.biblegateway.com/passage/?search=2%20Samuel%2022%3B%20Psalm%2018&version=SCH2000):
  Parallelfassungen von Davids Danklied.
- [2. Chronik 36 und Esra 1](https://www.biblegateway.com/passage/?search=2%20Chronicles%2036%3B%20Ezra%201&version=SCH2000):
  Übergang vom Exil zum Erlass des Kyrus und zur Rückkehr.

Der im Gespräch genannte [Blue-Letter-Bible-Plan](https://www.blueletterbible.org/assets-v3/pdf/dbrp/1Yr_ChronologicalPlan.pdf)
war eine Vergleichsquelle für den Ansatz. Seine Tagesliste wurde nicht übernommen.

## Tagesportionen und Vollständigkeit

Die Reihenfolge ist unabhängig von der Einteilung in Tage. Der Verteilungsalgorithmus
gewichtet nach Wortzahl, belässt jedes Kapitel ganz und hält das gewählte Enddatum.
„Zusammenhänge möglichst erhalten“ bevorzugt Grenzen bekannter Kapitelgruppen,
sofern die zusätzliche Abweichung vom Tagesziel höchstens 25 % des aktuellen
Tagesziels gegenüber der nächstliegenden Kapitelgrenze beträgt. Lange Gruppen
werden weiterhin geteilt; auch die optimale Kapitelgrenze kann bei einem langen
Einzelkapitel deutlich vom Tagesziel abweichen. Diese Option ist kein vollständiges
Verzeichnis aller exegetischen Sinnabschnitte. Bei mehr Tagen als offenen Kapiteln
gibt es bewusst freie Tage zum Nachlesen.

Vorlagenerstellung, Erstplanung und jede Neuverteilung prüfen exakte Kapitel-IDs.
Für den ausgewählten Umfang gilt:

    vorher gelesen + während des Plans gelesen + noch offen = exakt der Umfang

Die drei Mengen sind disjunkt. Offene Kapitel werden in der gewählten Reihenfolge
zugewiesen. Empfohlene, inzwischen abgehakte Kapitel können während einer laufenden
Einheit noch sichtbar bleiben; bei der Neuverteilung werden sie nicht erneut
zugewiesen. Nach Ablauf des letzten Tages bleiben offene Kapitel ausdrücklich als
`adaptive.unplanned` erhalten. Weiterlesen oder Verlängern bringt sie wieder in
den sichtbaren Plan. Zeitlich zurückliegende Einheiten werden nicht erfunden.

## Zeitmessung, Korrekturen und Sicherungen

`previouslyRead` speichert frühere Kapitel ohne fiktives Lesedatum getrennt von
`done`. Die Kapitel zählen zum Fortschritt, aber nicht zu abgeschlossenen
Leseeinheiten, Tagesdiagrammen oder Trainingsdaten für das Lesetempo. Ihre
historische Zeit wird beim Anzeigen aus Wortmenge × persönlichem Sekunden-pro-Wort-
Wert geschätzt; ohne Messungen gelten 180 Wörter/Minute. Die Schätzung verändert
sich mit späteren Messungen. Gemessene Zeit, geschätzte frühere Zeit und Summe
werden getrennt angezeigt. CSV enthält eine undatierte Zeile für früheren
Fortschritt; Kalenderdateien erzeugen dafür keine Termine.

Die Einstellungen erlauben nachträgliche Korrekturen früherer Kapitel. Tatsächlich
in der App gelesene Kapitel sind dabei gesperrt. Eine Verlängerung ändert nur die
Dauer und die offenen Empfehlungen; Fortschritt, Zeitprotokolle und Lerndaten
bleiben bestehen. Bei einer Verlängerung bleiben auch nach Ablauf gelesene
Kapitel ihrer ursprünglichen gemessenen Einheit zugeordnet (`completionDays`).
Ein laufender Timer muss zunächst pausiert werden.

Bestehende Pläne ohne neue Optionen bleiben vollständige Pläne in biblischer
Reihenfolge; ihre Lesedaten werden nicht zurückgesetzt. Sicherungsformat 4 enthält
alle neuen Angaben und prüft auch die vollständige Zuordnung offener Kapitel.
Formate 1–3 bleiben importierbar. Neue Sicherungen sind für ältere App-Versionen
nicht lesbar; für die Wiederherstellung zuerst die App aktualisieren.

`tests/plan-options.mjs` prüft 504 Kombinationen aus Umfang, Reihenfolge,
Gruppierung, Dauer und Vorfortschritt sowie Anpassungen nach Lesen, Pausen,
Korrekturen, Fristverlängerung, vollständigem Vorfortschritt, Sicherungen,
Exporten und Übersetzungen. Bestehende Tests sichern die bisherigen Funktionen ab.
