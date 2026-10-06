# Zusammenarbeit an Leseweg

Der Betreiber möchte alle abgeschlossenen Projektänderungen in GitHub halten.
Nach passenden erfolgreichen Prüfungen die Änderungen committen und nach
`origin` pushen. Bei einem blockierten Push den lokalen Stand erhalten und klar
angeben, dass GitHub noch nicht aktualisiert ist. Fremde Änderungen nicht verwerfen.

Quellcode, Tests und öffentliche Konfiguration gehören ins Repository.
Zugangsdaten, private VAPID-Schlüssel, OAuth-Token, persönliche Lesedaten und
Sicherungen dürfen nicht eingecheckt werden. `.secrets/` bleibt ignoriert.

Die Pages-Git-Integration veröffentlicht die Web-App aus `main`. Der Push-Worker
ist ein gesonderter Cloudflare-Dienst; seine Veröffentlichung ist in `README.md`
beschrieben. Eine reine Pages-Veröffentlichung aktualisiert den Worker nicht.
