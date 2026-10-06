# Leseweg – unabhängige Web-App

Installierbarer Bibelleseplan für eine Papierbibel. Die Anwendung läuft ohne
ChatGPT, ohne Benutzerkonto und nach dem ersten vollständigen Laden auch ohne
Internet. Jeder Browser bzw. jede installierte App speichert ihren eigenen Plan
auf dem jeweiligen Gerät. Optionale Push-Erinnerungen benötigen zusätzlich einen
Erinnerungsdienst und Internet; der Leseplan selbst benötigt keinen Server.

[Web-App öffnen und installieren](https://leseweg.pages.dev/) ·
[Quellcode auf GitHub](https://github.com/TobiasDomke/leseweg)

## Funktionen

- Dauer in Tagen, Wochen oder Kalendermonaten; 66 Bücher und 1.189 Kapitel.
- Gewichtung nach Wortzahl, ohne Kapitel aufzuteilen.
- Dynamische Tagesempfehlungen: weniger oder mehr lesen; erst beim Beenden die
  offenen Kapitel auf die verbleibenden Tage bis zum unveränderten Zieldatum verteilen.
- Zusätzliche Kapitel hinzufügen und nach einer beendeten Einheit am selben Tag weiterlesen.
- Historische Tage zeigen tatsächlich gelesene Kapitel; ausgelassene Tage werden
  beim nächsten Öffnen berücksichtigt. Ein überschrittenes Zieldatum wird angezeigt.
- Kapitel abhaken, Leseeinheiten abschließen, Timer starten/pausieren/stoppen.
- Zeitmessung bleibt nach dem Schließen erhalten; manuelle Zeitkorrektur.
- Persönliche Zeitschätzungen aus abgeschlossenen Messungen, gewichtet nach Textlänge.
- Statistik, CSV-Export, Deutsch/Russisch/Englisch/Ukrainisch, heller und dunkler Modus.
- Kalenderexport mit Kapiteln, gewählter Uhrzeit und Zeitzone einschließlich Sommerzeit.
- JSON-Sicherung und Wiederherstellung, auch auf einem anderen Gerät.
- Offlinebetrieb, Startbildschirmsymbol und Updates mit Nutzerbestätigung.
- Optionale tägliche Push-Erinnerungen mit Zeitzone, Testnachricht und Ausschalter
  pro Gerät, sobald der Betreiber den Erinnerungsdienst eingerichtet hat.

Die Wortzahlen stammen aus der gemeinfreien Lutherbibel 1912
([Datenquelle](https://github.com/midvash/bible-data)). Sie dienen als Näherung
für die Textlängen in Schlachter 2000. Die Anwendung enthält keine Bibeltexte.
Übersetzte Buchnamen ändern die Kapitelzählung nicht; sie richtet sich weiterhin
nach der Schlachter-2000-Papierbibel.

Die Sprache lässt sich oben in der App oder in den Einstellungen wählen.
Ukrainisch (`uk`, „Українська“) umfasst Oberfläche, alle 66 Buchnamen,
Datumsanzeigen, Kalender- und Statistikexport sowie Push-Nachrichten.
Die Auswahl bleibt auf dem Gerät gespeichert und wird in Sicherungen übernommen.
Neue Nutzer mit ukrainischer Browsersprache erhalten automatisch Ukrainisch.

## GitHub und Cloudflare Pages

Dieses Repository enthält den vollständigen Quellcode, lokale Bilder, Kapitelgewichte,
Tests und das Lockfile. Lesedaten werden ausschließlich auf den Geräten der Nutzer
gespeichert und sind kein Teil des Repositorys. Zugangsdaten, Sicherungsdateien,
installierte Pakete und generierte Builds werden nicht versioniert.

Das öffentliche Repository lässt sich ohne Einladung lesen, herunterladen und
forken. Änderungen am Original benötigen Schreibrechte oder einen angenommenen
Pull Request. Ein Repository-Link gewährt keine zusätzlichen Rechte. Die fertige
Web-App kann unabhängig davon jeder ohne GitHub- oder Cloudflare-Konto nutzen.

Für die automatische Veröffentlichung in Cloudflare Pages:

1. **Workers & Pages → Create application → Continue to Pages → Import an existing Git repository** öffnen.
2. GitHub verbinden und Cloudflare Zugriff auf dieses einzelne Repository geben.
3. Das Repository auswählen und folgende Einstellungen verwenden:

| Einstellung | Wert |
| --- | --- |
| Production branch | `main` |
| Framework preset | `None` |
| Root directory | Repository-Hauptverzeichnis (Feld leer lassen) |
| Build command | `npm ci && npm run build && npm test` |
| Build output directory | `dist` |
| Node.js | `24.19.0`, vorgegeben durch `.node-version` |
| Environment variable | `SKIP_DEPENDENCY_INSTALL=1` |

4. **Save and Deploy** wählen. Cloudflare erstellt die App, führt die Tests aus
   und veröffentlicht ausschließlich `dist/`. Die dabei angezeigte HTTPS-Adresse
   ist der Installationslink.

Weitere Commits auf `main` lösen automatisch eine neue Veröffentlichung aus.
Installierte Apps bieten neue Versionen zur Bestätigung an; persönliche Pläne
und Zeiten werden dadurch nicht in Git oder auf Cloudflare gespeichert.

Ein bereits als **Direct Upload** angelegtes Pages-Projekt lässt sich nicht auf
die Git-Integration umstellen. Dafür ein neues Pages-Projekt mit Git-Verbindung
anlegen. Ein bestehendes Upload-Projekt kann unverändert bestehen bleiben.

[Offizielle Git-Anleitung](https://developers.cloudflare.com/pages/get-started/git-integration/),
[Build-Konfiguration](https://developers.cloudflare.com/pages/configuration/build-configuration/),
[Node-Version und Paketinstallation](https://developers.cloudflare.com/pages/configuration/build-image/)
und [Grenzen des kostenlosen Tarifs](https://developers.cloudflare.com/pages/platform/limits/).
Nur der Betreiber benötigt das Hosting-Konto, Leser nicht. Eine eigene Domain
ist optional. Eine spätere Änderung der Adresse ergibt einen anderen
Browserspeicher: Daten vorher sichern und an der neuen Adresse importieren.

## Ohne Git-Integration veröffentlichen

Nach `npm ci && npm run build` den vollständigen Inhalt von `dist/` im Hauptverzeichnis eines beliebigen
statischen HTTPS-Hostings ablegen. Keine Weiterleitung zur ChatGPT-Site und keine
API- oder Serverkonfiguration sind für den Leseplan erforderlich. Der optionale
Push-Dienst wird separat eingerichtet (siehe unten). `_headers` setzt auf Cloudflare
Pages/Netlify Cache- und Sicherheitsheader; andere Anbieter können dieselben
Header über ihre Konfiguration setzen. Service Worker und HTML sollten erneut
validiert werden, Dateien in `assets/` dürfen langfristig gecacht werden.

## Auf dem iPhone

1. Die endgültige HTTPS-Adresse in Safari öffnen.
2. **Teilen → Zum Home-Bildschirm hinzufügen → Als Web-App öffnen**.
3. App vom Home-Bildschirm öffnen. Unter Einstellungen erscheint nach dem Laden
   **Für die Nutzung ohne Internet bereit**.
4. Den persönlichen Plan in der installierten App anlegen bzw. eine Sicherung importieren.

Plan, Fortschritt und Timer funktionieren dann lokal. Die Website muss für neue
Installationen, Updates und das erneute Laden nach gelöschtem Cache erreichbar
bleiben. Ein Download der ZIP-Datei in die iPhone-Dateien-App installiert die PWA
nicht. Auf anderen Geräten ist die Anwendung auch direkt im Browser nutzbar.

## Update 1.1: flexibles Lesen

Die Tageskapitel sind Empfehlungen. Nur angehakte Kapitel gelten als gelesen.
Mit **Nächstes Kapitel hinzufügen** wird zusätzlicher Lesestoff eingeblendet.
**Leseeinheit beenden → Beenden und Plan anpassen** stoppt einen laufenden Timer
und verteilt alle offenen Kapitel neu ab dem Folgetag. Die Gewichtung nach
Textlänge und das ursprünglich gewählte Zieldatum bleiben erhalten. Auch ein
Abschluss ohne ein gelesenes Kapitel ist möglich.

Mit **Heute noch weiterlesen** kann der heutige Tag wieder geöffnet werden.
Bereits gelesene Kapitel und gemessene Zeiten bleiben erhalten. Empfehlungen
verschieben sich während einer offenen Einheit nicht bei jedem Häkchen.
Vergangene Tage sind eine Lesehistorie; zukünftige Tage zeigen Empfehlungen.
Wenn keine weiteren Tage bis zum Ziel bleiben, werden offene Kapitel weiter
aufbewahrt und ausdrücklich angezeigt. Es gibt keine automatische Verlängerung
oder Kennzeichnung ungelesener Kapitel als gelesen.

Bestehende Pläne werden ohne Datenverlust auf das neue Format vorbereitet.
Sicherungen der ersten Version lassen sich weiterhin importieren; neue Sicherungen
verwenden inzwischen Formatversion 3. Kalenderdateien sind Momentaufnahmen und müssen nach
Planänderungen erneut exportiert und importiert werden.

## Update 1.2: persönliche Zeitschätzungen

Timer vor dem Lesen starten, tatsächlich gelesene Kapitel abhaken und die Einheit
beenden. Die App teilt die gesamte gemessene Zeit abgeschlossener Messungen durch
die zugehörige Textlänge. Mit diesem persönlichen Wert schätzt sie die Zeiten für
Kapitel, Tagesempfehlungen, Leseplan, CSV und neu exportierte Kalendertermine.
Längere Texte erhalten damit mehr Gewicht als kürzere. Das Zieldatum bleibt gleich.
Unter **Statistik → Persönliche Zeitschätzung** steht, auf wie vielen Kapiteln und
wie viel gemessener Zeit die Schätzung beruht.

Bis zur ersten passenden Messung gilt der Startwert von 180 Wörtern pro Minute.
Laufende/pausierte Einheiten werden erst beim Abschluss berücksichtigt. Ein neuer
Timer nach einem Abschluss erfasst nur die zusätzlichen Kapitel und die zusätzliche
Zeit. Gelesene Kapitel ohne Messung, Messungen ohne gelesene Kapitel und Messungen
mit null Sekunden verändern die Schätzung nicht. Eine Pause muss mit der
Pausentaste gestartet werden; die App erkennt Unterbrechungen nicht automatisch.

Eine manuelle Zeitkorrektur gilt für die gesamte Leseeinheit des Tages. Bei einem
bereits abgeschlossenen Tag aktualisiert sie die Schätzung sofort; bei einer
offenen Einheit erst nach dem Beenden. Wird ein zuvor gemessenes Kapitel wieder
abgewählt, entfällt die betroffene Messung, da ihre Zeit nicht zuverlässig auf die
übrigen Kapitel aufgeteilt werden kann.

Bereits vorhandene abgeschlossene Tage mit Zeit und gelesenen Kapiteln werden als
Tagesmessungen übernommen. Die älteren App-Versionen speichern keine einzelnen
Messabschnitte, deshalb lässt sich bei diesen alten Tagen nachträglich nicht
unterscheiden, welche Kapitel eventuell ohne Timer gelesen wurden. Lesedaten und
Statistiken bleiben erhalten. Die Textlängen sind weiterhin Näherungswerte für die
Papierbibel; auch persönliche Zeiten sind Schätzungen. Neue Pläne beginnen neu.
Sicherungen enthalten die persönlichen Messungen und unterstützen beim Import
weiterhin die Formate 1 und 2.

## Update 1.3: Installation und geprüfter Offlinebetrieb

Vor dem ersten Plan und unter **Einstellungen → Installieren & offline nutzen**
stehen die Installationsschritte für iPhone/iPad, Android und Computer. Die App
prüft mit ihrem aktiven Service Worker, ob sämtliche Dateien dieser Version im
Offline-Cache vorhanden sind. Ein registrierter Service Worker allein reicht
nicht für die Anzeige „Für die Nutzung ohne Internet bereit“.

Die App zeigt getrennt, ob der Browser dauerhaften Speicher gewährt hat. In einer
installierten App wird dieser Schutz nach erfolgreicher Offlinevorbereitung
angefragt; ein weiterer Versuch ist per Schaltfläche möglich. Die Entscheidung
trifft der Browser. Manuelles Löschen bleibt möglich, auch bei gewährtem Schutz.
Nach einer Installation empfiehlt sich ein echter Test im Flugmodus.

Auf einer öffentlichen HTTPS-Adresse öffnet **App-Link weitergeben** das
Teilen-Menü (z. B. WhatsApp/Telegram). Browser ohne Teilen-Menü kopieren den Link.
Dabei werden weder Lesedaten noch der aktuell ausgewählte Tag übertragen. Die
lokale Vorschau auf dem Mac zeigt ausdrücklich, dass sie kein öffentlicher Link ist.

Der Betreiber-Mac wird nach der Veröffentlichung nicht zum Betrieb benötigt.
Die kostenlose Hosting-Adresse sollte für Neuinstallationen, erneute Downloads
und Updates erhalten bleiben. Bereits vollständig gespeicherte Installationen
können ohne den Host weiterarbeiten, solange der Browser ihre Dateien und Daten
aufbewahrt. Eine unbegrenzte Aufbewahrung ist keine garantierte PWA-Eigenschaft.

## Speicherung und Grenzen

- IndexedDB ist die einzige Quelle für Lesedaten. Schreibvorgänge sind atomar;
  parallele Fenster verlieren keine Kapiteländerungen. BroadcastChannel und
  Sichtbarkeitswechsel aktualisieren die Oberfläche.
- Sprache und Darstellung liegen als Geräteeinstellungen in localStorage.
- Es gibt keine automatische Synchronisierung. Regelmäßig eine Sicherung
  herunterladen, insbesondere vor Gerätewechsel, Löschen der App oder Websitedaten.
- Ein exportierter laufender Timer wird in der Sicherung zum Exportzeitpunkt
  pausiert. In der geöffneten App läuft er weiter.
- Push-Erinnerungen benötigen den optionalen Cloudflare-Dienst sowie die
  Push-Infrastruktur des Browsers. Sie funktionieren nicht vollständig offline.
  Der Kalenderexport bleibt eine separate Möglichkeit. Bei Planänderungen alte
  importierte Termine entfernen und den aktualisierten Kalender importieren.
- Keine Analytik, externen Schriftarten oder Datenübertragung für Lesepläne.
  Der Hosting-Anbieter erhält beim Abruf der App die üblichen HTTP-Anfragen.
- Der alte ChatGPT-Lesestand wird nicht automatisch übernommen. Dieses Projekt
  greift bewusst nicht auf die bisherige Datenbank zu.

## Update 1.4: optionale Push-Erinnerungen

Unter **Einstellungen → Push-Erinnerung auf diesem Gerät** zunächst die Uhrzeit
und Zeitzone speichern, dann **Erinnerungen aktivieren** und die Systemabfrage
bestätigen. Auf iPhone/iPad muss die App vom Home-Bildschirm geöffnet werden.
**Testnachricht senden** prüft die Zustellung; diese Aktion ist einmal pro Minute
möglich. Die Erlaubnis muss auf jedem Gerät separat erteilt werden. Änderungen
der gespeicherten Einstellungen werden beim Öffnen dieses Bereichs und online
an den Dienst übertragen. Bei einem Fehler zeigt die App die zuletzt bestätigte
Uhrzeit an und bietet einen erneuten Versuch.

Testnachrichten fordern beim Push-Anbieter die sofortige Zustellung an
(`Urgency: high`). Der Worker verwendet `redirect: manual`, da Cloudflare
`redirect: error` nicht unterstützt. Antworten mit Weiterleitung gelten als
fehlgeschlagener Versand; Anmeldedaten werden nicht an andere Adressen
weitergeleitet. Bei Versandfehlern stehen in einer vorübergehend geöffneten
Live-Diagnose Status und bereinigte Fehlermeldungen zur Verfügung. Push-Adressen
und Schlüssel werden entfernt; dauerhafte Worker-Anwendungslogs bleiben aus.
Die Zusammenfassungskennung (`Topic`) wird Base64url-codiert, damit Apple sie
auch für tägliche Erinnerungen akzeptiert.

Die Nachricht erinnert allgemein an das Bibellesen. Erst beim Öffnen zeigt die
App die lokal berechneten Kapitel. Der Dienst kennt weder den Plan noch gelesene
Kapitel, Lesezeiten oder den Abschluss des Plans. Erinnerungen laufen täglich
weiter, bis sie auf dem jeweiligen Gerät ausgeschaltet werden.

**Datenspeicherung:** Erst beim Aktivieren speichert Cloudflare D1 die technische
Push-Adresse und ihre Verschlüsselungsparameter, Uhrzeit, Zeitzone, Sprache sowie
Versandstatus. Ein zufälliger geheimer Geräteschlüssel bleibt in localStorage;
der Dienst speichert nur seinen Hash. Er berechtigt ausschließlich zur Verwaltung
dieser einen Anmeldung. Lesesicherungen enthalten diesen Schlüssel nicht, beim
Gerätewechsel werden Erinnerungen separat aktiviert. Die Push-Nachrichten sind
für den jeweiligen Browser verschlüsselt. Cloudflare erhält bei API-Aufrufen die
üblichen Verbindungsdaten; zur Begrenzung von Anfragen wird die IP-Adresse im
Worker gehasht und nicht in D1 gespeichert. Worker-Anwendungslogs sind deaktiviert.

Beim Ausschalten wird zunächst die Browser-Anmeldung aufgehoben und anschließend
der Servereintrag entfernt. Ohne Internet bleibt ein Löschauftrag lokal gespeichert;
er wird beim nächsten Online-Aufruf der Push-Einstellungen nachgeholt. Vom
Push-Anbieter als abgelaufen gemeldete Anmeldungen werden ebenfalls gelöscht.
Vor dem Löschen der App oder ihrer Websitedaten deshalb Erinnerungen ausschalten.

**Betrieb:** Ein Cloudflare Worker prüft minütlich fällige Erinnerungen. Zeitzonen
und Sommerzeit werden berücksichtigt. Doppelte parallele Versandläufe werden
per Datenbankreservierung abgefangen. Vorübergehende Fehler werden begrenzt
wiederholt; stark verspätete Erinnerungen werden übersprungen. Die erste kleine
Ausbaustufe verarbeitet höchstens fünf Anmeldungen pro Minute und akzeptiert
höchstens 1.000 Anmeldungen insgesamt. Größere Gruppen zur gleichen Uhrzeit führen
zu Verzögerungen. Auch Fokusmodus, Verbindung und Betriebssystem beeinflussen die
Zustellung. Es gibt keine Zusage einer sekundengenauen oder garantierten Zustellung.

Die Bereitstellung nutzt Workers und D1 im kostenlosen Tarif. Es wird kein
Bezahlabo angelegt. Bei ausgeschöpften Gratisgrenzen kann der Dienst ausfallen;
der lokale Leseplan funktioniert weiter. Für verlässlich größere Nutzerzahlen
müssen Auslastung und Versandkapazität neu bewertet werden.

### Push-Dienst als Betreiber einrichten

Dieses Repository ist auf `https://leseweg.pages.dev` und den Worker
`https://leseweg-erinnerungen.tobidom01.workers.dev` eingestellt. Die Datenbank
`leseweg-erinnerungen` wurde mit der EU-Jurisdiktion angelegt. Ohne hinterlegte
VAPID-Secrets zeigt die App den Dienst als noch nicht freigeschaltet. Die
folgenden Schritte dokumentieren die Ersteinrichtung und gelten auch für einen
eigenen Fork mit entsprechend ersetzten Adressen und Datenbank-ID:

1. Im Repository `npm ci` ausführen. Mit
   `npx wrangler login --scopes account:read user:read workers_scripts:write d1:write`
   Cloudflares offizielles Werkzeug autorisieren. Diese OAuth-Schreibrechte gelten
   kontoweit für Workers und D1, nicht nur für dieses Projekt.
2. Mit `npx wrangler d1 create leseweg-erinnerungen --jurisdiction eu` eine D1-Datenbank in der EU erstellen.
   Ihre zurückgegebene ID in `worker/wrangler.jsonc` eintragen. Dort auch
   `APP_ORIGIN` auf die endgültige HTTPS-Adresse der App setzen, ohne abschließenden
   Schrägstrich. Danach `npm run push:migrate` ausführen.
3. Einmalig `npm run push:keys` ausführen. Die privaten Schlüssel liegen ausschließlich
   in der ignorierten Datei `.secrets/push-secrets.json`. Diese Datei sicher sichern
   und nie veröffentlichen. Das Skript überschreibt vorhandene Schlüssel nicht.
4. `npm run push:deploy` ausführen. Danach
   `npx wrangler secret bulk .secrets/push-secrets.json --config worker/wrangler.jsonc`
   verwenden, um die Schlüssel als Cloudflare-Secrets zu hinterlegen. Ohne die
   Secrets akzeptiert der Dienst keine neuen Anmeldungen.
5. Die ausgegebene `https://…workers.dev`-Adresse ohne abschließenden Schrägstrich
   in `lib/push-config.ts` als `PUSH_API` eintragen und als zusätzliche erlaubte
   Quelle bei `connect-src` in `public/_headers` aufnehmen. Die Worker-Adresse
   ist öffentlich, die privaten Schlüssel bleiben ausschließlich beim Worker.
6. `npm run build && npm test` ausführen und die Änderungen über Git veröffentlichen.
   Die Pages-Git-Integration aktualisiert die Oberfläche. Spätere Änderungen am
   Worker werden gesondert mit `npm run push:deploy` veröffentlicht; sie werden
   durch den Pages-Build nicht automatisch bereitgestellt.
7. In einer installierten App das Update übernehmen, Mitteilungen aktivieren und
   eine Testnachricht bei geschlossener App prüfen. Danach eine tägliche Erinnerung
   zu einer nahen Uhrzeit testen. Ein echter Gerätetest ist zusätzlich zu den
   automatisierten Tests erforderlich.

Privater VAPID-Schlüssel und Datenbank müssen bei späteren Worker-Updates erhalten
bleiben. Ein Schlüsselwechsel erfordert neue Browser-Anmeldungen. Wer den Dienst
abschaltet oder löscht, beendet die Push-Erinnerungen; bereits gespeicherte lokale
Lesepläne und Kalendertermine bleiben davon unabhängig.

[Web Push auf Apple-Geräten](https://webkit.org/blog/16535/meet-declarative-web-push/),
[Cloudflare-Cron](https://developers.cloudflare.com/workers/configuration/cron-triggers/)
und [Workers-Grenzen](https://developers.cloudflare.com/workers/platform/limits/).

## Entwicklung

Getestet mit Node.js 24.19.0 (siehe `.node-version`); mindestens Node.js 22.13.
Paketversionen sind im Lockfile festgelegt.

```sh
npm ci
npm run dev
npm run build
npm test
npm run preview
```

`dev` dient der Entwicklung. Der Service Worker wird nur beim Produktionsbuild
erzeugt, damit Entwicklungsdateien nicht versehentlich offline gespeichert werden.
`preview` stellt diesen Build auf `http://127.0.0.1:5174` bereit. Auf dem iPhone
braucht die veröffentlichte App HTTPS.

`scripts/build-offline.mjs` erzeugt einen Service Worker mit einer vollständigen
Liste der gebauten Dateien und einer aus deren Inhalt berechneten Version.
Fehlgeschlagene Downloads verhindern die Aktivierung einer unvollständigen
Offlineversion. Updates werden erst nach Bestätigung übernommen.
Die Startseite wird unter ihrer endgültigen Adresse `/` gespeichert, da Cloudflare
`/index.html` dorthin weiterleitet. Auch Änderungen am Service Worker und an seiner
Dateiliste ändern die Cache-Version.
Nur die fehlerhafte erste Pages-Installation mit einer zwischengespeicherten
Weiterleitung wird automatisch repariert: Sie konnte die Update-Schaltfläche
nicht mehr öffnen. Lesedaten bleiben dabei unverändert. Reguläre spätere Updates
warten weiterhin auf die Bestätigung in der App.

## Prüfung

Automatisierte Tests prüfen Kapitelabdeckung, Gewichtung, Monatsgrenzen,
Sommerzeit, Exporte, flexible Leseumfänge einschließlich null Kapiteln,
vollständige Neuzuordnung offener Kapitel, ausgelassene Tage, Ablauf des Zieldatums,
Übernahme bestehender Pläne, gleichzeitige Schreibvorgänge, persistierte Timer,
fehlgeschlagene Schreibvorgänge, Sicherungsvalidierung und Offline-Dateien.
Zusätzlich: persönliche Gewichtung, mehrere Einheiten am selben Tag, Pausen,
fehlende Messungen, Zeitkorrekturen, Mitternacht, Übernahme alter Messungen und
personalisierte Exportzeiten.

Die Push-Tests verwenden eine echte lokale SQLite-Datenbank und prüfen Geräteisolation,
Anmeldungen, Eingabevalidierung, erlaubte Push-Anbieter, Ratenbegrenzung, Zeitzonen,
Sommerzeit, parallelen Versand, Wiederholungen, abgelaufene Anmeldungen und Löschen.
Ein unabhängiger Test entschlüsselt die tatsächlich erzeugte Web-Push-Nachricht
und prüft den Inhalt; Service-Worker-Tests prüfen Anzeige und Öffnen der App.
Ein Cloudflare-Dry-Run prüft zusätzlich das Worker-Paket und seine Bindings.

Im Desktop-Browser zusätzlich geprüft: Plan ohne Anmeldung erstellen; Webserver
abschalten; App neu laden; Kapitel abhaken und Timer stoppen; erneut neu laden
und gespeicherte Werte kontrollieren. Der Test ersetzt noch keinen abschließenden
Test in der installierten App auf einem echten iPhone.
