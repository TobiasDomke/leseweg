# Leseweg – unabhängige Web-App

Installierbarer Bibelleseplan für eine Papierbibel. Die Anwendung läuft ohne
ChatGPT, ohne Benutzerkonto, ohne Datenbankserver und nach dem ersten vollständigen
Laden auch ohne Internet. Jeder Browser bzw. jede installierte App speichert ihren
eigenen Plan auf dem jeweiligen Gerät.

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
- Statistik, CSV-Export, Deutsch/Russisch/Englisch, heller und dunkler Modus.
- Kalenderexport mit Kapiteln, gewählter Uhrzeit und Zeitzone einschließlich Sommerzeit.
- JSON-Sicherung und Wiederherstellung, auch auf einem anderen Gerät.
- Offlinebetrieb, Startbildschirmsymbol und Updates mit Nutzerbestätigung.

Die Wortzahlen stammen aus der gemeinfreien Lutherbibel 1912
([Datenquelle](https://github.com/midvash/bible-data)). Sie dienen als Näherung
für die Textlängen in Schlachter 2000. Die Anwendung enthält keine Bibeltexte.
Russische Buchnamen ändern die Kapitelzählung nicht; sie richtet sich weiterhin
nach der Schlachter-2000-Papierbibel.

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
API- oder Serverkonfiguration sind erforderlich. `_headers` setzt auf Cloudflare
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
- Direkte tägliche Push-Mitteilungen sind noch nicht implementiert. Eine geschlossene
  iPhone-PWA bietet keine zuverlässige rein lokale Terminbenachrichtigung. Der
  Kalenderexport ist die verfügbare Alternative. Bei Planänderungen alte importierte
  Termine entfernen und den aktualisierten Kalender importieren.
- Keine Analytik, externen Schriftarten oder Datenübertragung für Lesepläne.
  Der Hosting-Anbieter erhält beim Abruf der App die üblichen HTTP-Anfragen.
- Der alte ChatGPT-Lesestand wird nicht automatisch übernommen. Dieses Projekt
  greift bewusst nicht auf die bisherige Datenbank zu.

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

Im Desktop-Browser zusätzlich geprüft: Plan ohne Anmeldung erstellen; Webserver
abschalten; App neu laden; Kapitel abhaken und Timer stoppen; erneut neu laden
und gespeicherte Werte kontrollieren. Der Test ersetzt noch keinen abschließenden
Test in der installierten App auf einem echten iPhone.
