# Lesereihenfolgen und früherer Fortschritt

Ab Version 1.7 wählt die Einrichtung unabhängig voneinander den Umfang
(gesamte Bibel, AT, NT), die Reihenfolge und den Zeitraum. Sie verwendet
die 66 Bücher der ausgewählten Ausgabe: Schlachter 2000, King James, Synodal
(66 Bücher) oder Iwan Ohijenko (1962). Jedes Profil hat 1.189 Kapitel insgesamt,
davon 929 im AT und 260 im NT; die Nummerierung unterscheidet sich.

## Ausgaben ab 1.9

| Menüsprache bei der Einrichtung | Standardausgabe | Joel | Maleachi | Psalmen |
| --- | --- | --- | --- | --- |
| Deutsch | Schlachter 2000 | 4 | 3 | Hebräische Zählung |
| Englisch | King James Version | 3 | 4 | Hebräische Zählung |
| Russisch | Synodal, protestantische 66-Bücher-Ausgabe | 3 | 4 | Synodal-Zählung |
| Ukrainisch | Iwan Ohijenko, 1962 | 3 | 4 | Hebräische Zählung der geprüften Ausgabe |

Quellen: [Schlachter](https://www.schlachterbibel.de/de/bibel/),
[King James](https://only.bible/bible/kjv/),
[Synodal](https://only.bible/bible/rst66/),
[Ohijenko](https://only.bible/bible/ubio/); geprüft am 6. Oktober 2026.
Die unabhängigen Kapitelzahlen stehen in `lib/schlachter-canon.json` und
`lib/edition-canon.json`. Keine Textabfrage oder Internetverbindung ist zur Planung nötig.

Synodal-Psalm 9 verbindet die hebräischen Psalmen 9–10; 10–112 entsprechen 11–113;
113 verbindet 114–115; 114/115 teilen 116 an Vers 9/10. 116–145 entsprechen 117–146;
146/147 teilen 147 an Vers 11/12. 1–8 und 148–150 behalten ihre Zuordnung.
Primärtextbeispiele: [Psalm 113](https://only.bible/bible/rst66/psa-113/),
[114](https://only.bible/bible/rst66/psa-114/),
[146](https://only.bible/bible/rst66/psa-146/),
[147](https://only.bible/bible/rst66/psa-147/).
Ohijenko verwendet in der geprüften Ausgabe die hebräische Zählung, siehe
[Psalm 22](https://only.bible/bible/ubio/psa-22/). Kyrillische Schrift allein bestimmt
weder Zählung noch Kanon.

Chronologische und zusammenhängende Gruppen werden über diese Inhaltszuordnungen
in das gewählte Profil übertragen. Zusammengeführte Kapitel stehen beim ersten
passenden Kontext und werden nicht doppelt gelesen. Alle Kapitel bleiben vollständig;
der Plan kann keine feinere Verschronologie bieten. Psalm 51 bei Nathan/David wird
im Synodal-Profil als Psalm 50 bezeichnet. Kapitelgrenzen mit gleicher Kapitelzahl
können auf Versebene weiterhin leicht variieren; die App arbeitet auf Kapitelebene.

Gewichte sind Näherungen aus Luther 1912, keine exakten Wortzahlen der Übersetzungen.
Geteilte Psalmen werden anteilig nach Versumfang gewichtet. Alle Einheiten enthalten
jedes offene Kapitel genau einmal. `tests/editions-experience.mjs` ergänzt 432
Profil-/Umfang-/Reihenfolge-/Laufzeit-Kombinationen und 36 adaptive Abläufe mit
Fortschritt, Sicherung und Kapitelprüfung. Umfangreiche Grenzfallprüfungen für die
Schlachter-Grundlage bleiben in `tests/completeness.mjs` bestehen.

Ältere Pläne ohne Editionskennung bleiben auf ihrer bisherigen Grundlage. Ein
Sprachwechsel ändert vorhandene Kapitel-IDs nicht. Beim ausdrücklich bestätigten
Editionswechsel bleiben unveränderte Kapitelreferenzen und vollständig gelesene
Bücher erhalten. Teilweise gelesene Psalmen, Joel oder Maleachi mit anderer Einteilung
werden erneut eingeplant und im Prüfhinweis mit ursprünglicher Ausgabe/Referenz genannt.
Die unveränderte Ausgangslage bleibt lokal unter `before-edition-<Ausgabe>` archiviert.
Messzeit und Einheiten bleiben erhalten; das Tempotraining startet neu. Dies vermeidet
scheinbar vollständige Kapitel, deren Inhalt die alte Nummerierung nicht sicher belegt.

Die folgenden Abschnitte dokumentieren auch die früheren Migrationen. Ihre damals
beschriebenen Einschränkungen zu anderen Ausgaben sind durch die Profile oben ersetzt.

## Unabhängige Vollständigkeitsprüfung und Korrektur in 1.8.1

Am 6. Oktober 2026 wurden die Kapitelüberschriften **aller 66 einzelnen
Buch-Inhaltsverzeichnisse** auf [schlachterbibel.de](https://www.schlachterbibel.de/de/bibel/)
abgeglichen. Die unabhängige Soll-Liste mit Quellenadresse je Buch steht in
`lib/schlachter-canon.json`. Sie wird nicht aus den Wortzahlen oder erzeugten
Plänen hergeleitet. Die App prüft beim Laden jedes Buch und dessen Kapitelzahl
gegen diese Liste; fehlerhafte Bestände verhindern die Planung.

Die bisher importierten Wortzahlen verwendeten bei Joel/Maleachi eine andere
Einteilung. Schlachter hat [Joel 1–4](https://www.schlachterbibel.de/de/bibel/joel/)
und [Maleachi 1–3](https://www.schlachterbibel.de/de/bibel/maleachi/); bis 1.8.0
standen dort Joel 1–3 und Maleachi 1–4. Die unveränderte Summe 1.189 verdeckte
den Fehler. Beide Bücher und die chronologische Vorlage sind berichtigt.
Das alte Gewicht von Joel 2 wird an Vers 27/28 der bisherigen Datenquelle geteilt
(706 + 130 Wörter); deren Joel 3 entspricht Schlachter Joel 4 (545 Wörter).
Die alten Gewichte Maleachi 3/4 werden addiert (686 Wörter). Die Gesamtwortmenge
bleibt erhalten. Es werden weiterhin keine Bibeltexte ausgeliefert.

Die Migration auf `chapterSchema: 2` ordnet sämtliche gespeicherten Kapitel-IDs
anhand der bisherigen **Buch-/Kapitelreferenz** zu: Häkchen, Abschluss-Tage,
Messproben und Tageszuordnungen. Joel 4 wird ausdrücklich als offen eingeplant.
Ein alter Maleachi-4-Haken wird nicht auf Maleachi 3 übertragen; sein ursprünglicher
Eintrag bleibt im sichtbaren Korrekturprotokoll. Auch alte 100%-Pläne erhalten Joel 4
als offen; nach abgelaufener Frist bleibt es in `adaptive.unplanned` verfügbar.

Zeitprotokolle und laufende Timer bleiben erhalten. Messproben mit betroffenen
Kapiteln werden mit alten Referenzen archiviert und nicht mehr zum Tempo-Training
verwendet. Dasselbe gilt für unsichere offene Messpaare. Bei sehr alten Sicherungen
ohne ausdrückliche Messpaare wird bei betroffenen Häkchen kein alter Durchschnitt
rekonstruiert. Unbetroffene ausdrückliche Messproben werden nach Referenz migriert.
Betroffene Nutzer sehen einen Hinweis und ein Protokoll ihrer früheren Einträge.

IndexedDB wird auf Version 2 angehoben. Im selben Schreibvorgang bleibt eine
unveränderte Wiederherstellungskopie unter `before-chapter-schema-2` lokal erhalten.
Alte geöffnete App-Versionen können danach nicht mehr mit ihrer falschen
ID-Zuordnung zurückschreiben; sie müssen aktualisiert werden. Die Migration ist
idempotent. Sicherungen 1–5 werden zunächst validiert, anschließend migriert;
Format 6 verlangt die neue Kapitelkennung und erhält das Korrekturprotokoll.
Die Reihenfolge alter Sicherungen wird neu aufgebaut; fehlende oder doppelte
Zuordnungen werden weiterhin ab Format 4 abgelehnt.

`tests/completeness.mjs` prüft zusätzlich zur bisherigen Testsuite:

- **5.378 Pläne** gegen die unabhängige Soll-Liste: 1.728 Kombinationen aus Umfang,
  Planart, Buchreihenfolge, Gruppierung, Grenzlaufzeiten und Vorfortschritt sowie
  jede Laufzeit von 1 bis 3.650 Tagen mit wechselnden Varianten. Dies ist nicht das
  vollständige kartesische Produkt aller möglichen Eingaben.
- **1.944 Kontrollpunkte in 36 vollständigen Leseverläufen:** mehr/weniger/kein
  Lesen, Sprachwechsel mit Timer, Wiederaufnahme, Fristüberschreitung,
  Verlängerung sowie Sicherung und Wiederherstellung.
- Ablehnung gleich großer fehlerhafter Bestände (Joel fehlt, Maleachi zu viel).
- Migration im verschobenen ID-Bereich, ehemals vollständige Pläne, aktive Timer,
  alte Sicherungen, Wiederherstellungskopie und Schutz vor alten Clients.

Diese Prüfung gilt für die unterstützte 66-Bücher-/Schlachter-Kapitelgrundlage,
nicht für andere Kanones oder noch nicht implementierte Kapitel-/Psalmzählungen.

## Frühere Buchreihenfolge ohne Editionsprofil (Version 1.8)

Neue Pläne passen die Buchreihenfolge automatisch an die Sprache an:
Deutsch/Englisch führen nach Apostelgeschichte die Paulusbriefe beginnend mit
Römer; Russisch/Ukrainisch zuerst die allgemeinen Briefe Jakobus, 1./2. Petrus,
1./2./3. Johannes und Judas, dann Römer bis Hebräer. Offenbarung bleibt zuletzt.
Das AT bleibt in beiden angebotenen Reihenfolgen gleich.

Diese Auswahl ist **keine automatische Bestimmung der Bibelübersetzung**.
Druckausgaben derselben Sprache können verschieden sortiert sein. In Einrichtung
und Einstellungen kann deshalb jede der beiden Reihenfolgen ausdrücklich gewählt
werden; eine manuelle Wahl übersteht weitere Sprachwechsel. Die vollständige Liste
der Bücher ist dort aufklappbar. Die App beschränkt sich weiterhin auf die 66 Bücher
der bisherigen Grundlage. Apokryphen/deuterokanonische Bücher werden nicht ergänzt.
Kapitel-, Psalm- und Verszählung bleiben auf der bisherigen Grundlage; insbesondere
wird die Synodal-Psalmzählung **noch nicht** umgerechnet. Dieser Hinweis steht auch
direkt bei der Auswahl. Eine Reihenfolge darf nicht als vollständiges Editionsprofil
ausgegeben werden.

Verglichene Inhaltsverzeichnisse (abgerufen 6. Oktober 2026):

- [Synodal, 66 Bücher, Bible.by](https://bible.by/syn/): allgemeine Briefe vor Paulus.
- [Ohijenko, Only.Bible](https://only.bible/bible/ubio/): allgemeine Briefe vor Paulus.
- [Synodal, Wordproject](https://www.wordproject.org/bibles/ru/index_en.htm) und
  [Ohijenko, Wordproject](https://www.wordproject.org/bibles/uk/index_en.htm):
  alternative Präsentation mit Paulus zuerst; bestätigt die Notwendigkeit einer
  ausdrücklichen Auswahl statt einer unveränderbaren Zuordnung zur Sprache.

Die Sprache/Reihenfolge wird atomar mit dem Plan gespeichert. Bereits gelesene
Kapitel verwenden weiterhin dieselben IDs; Zeitprotokolle und Trainingsdaten werden
nicht umnummeriert. Nur offene Empfehlungen werden neu verteilt. Läuft der Timer,
wird die gewünschte Reihenfolge als `pendingBookOrder` vorgemerkt und erst nach
Pause/Abschluss übernommen. Ein Wechsel zurück hebt die Vormerkung auf. Die
Vormerkung übersteht Sicherung/Wiederherstellung. Bestehende Pläne bleiben bis
zur bewussten Sprach-/Reihenfolgewahl unverändert. Alle Sprachvarianten arbeiten
offline; die Inhaltsverzeichnisse sind keine Laufzeit-Abhängigkeit.

Die biblische Reihenfolge und die einzelnen Stränge des gemischten Plans folgen
dieser Einstellung. Die chronologische Vorlage behält ihre zeitliche Anordnung.
Kapitelauswahl und Exporte beachten die gespeicherte Buchreihenfolge ebenfalls.
`tests/book-order.mjs` prüft 324 Kombinationen sowie Sprachwechsel mit bestehendem
Fortschritt, laufendem Timer, manueller Wahl, Sicherung und Export.

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
Reihenfolge; ihre Lesedaten werden nicht zurückgesetzt. Sicherungsformat 6 enthält
alle neuen Angaben und prüft auch die vollständige Zuordnung offener Kapitel.
Formate 1–5 bleiben importierbar. Neue Sicherungen sind für ältere App-Versionen
nicht lesbar; für die Wiederherstellung zuerst die App aktualisieren.

`tests/plan-options.mjs` prüft 504 Kombinationen aus Umfang, Reihenfolge,
Gruppierung, Dauer und Vorfortschritt sowie Anpassungen nach Lesen, Pausen,
Korrekturen, Fristverlängerung, vollständigem Vorfortschritt, Sicherungen,
Exporten und Übersetzungen. Bestehende Tests sichern die bisherigen Funktionen ab.
