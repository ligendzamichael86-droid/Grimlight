# Grimlight aufs Handy holen

Für Michael. Dauert beim ersten Mal etwa fünf Minuten, danach unter einer Minute.

Voraussetzung: **Android 5.1 oder neuer**. Der Server muss laufen, während du
tippst (siehe ganz unten, "Falls die Seite nicht kommt").

---

## Schritt für Schritt

**1. Am Handy den Browser öffnen** (Chrome) und diese Adresse eingeben:

```
https://code.srv1457801.hstgr.cloud/proxy/8125/app-debug.apk
```

**2. Einloggen.**
Es kommt dieselbe Login-Seite wie am PC. Nimm **dasselbe Passwort, mit dem du
dich auch an dieser Code-Oberfläche anmeldest**. Es ist genau das Passwort, das
du kennst, du musst nichts nachschlagen und nichts ändern.

> Falls dir irgendwo ein Passwort aus einer Datei `config.yaml` begegnet:
> das ist ein altes, totes Passwort und funktioniert nicht. Wir kennen dein
> echtes Passwort nicht und fragen auch nicht danach.

**3. Herunterladen.**
Nach dem Login startet der Download der Datei `app-debug.apk` (rund 4 MB).
Sie landet im Ordner **Downloads**, am Gerät unter
`/storage/emulated/0/Download/app-debug.apk`.

**4. Datei antippen.**
Entweder direkt in der Download-Leiste von Chrome oder später in der
Dateien-App unter "Downloads".

**5. Einmalig "unbekannte Quellen" erlauben.**
Android fragt, ob es Apps aus dieser Quelle installieren darf. Erlauben.
Diese Frage kommt nur beim ersten Mal.

**6. Installieren und spielen.**
Danach liegt **Grimlight** mit dem Fackel-Symbol in deiner App-Liste. Die App
startet immer im Querformat.

---

## Was Android unterwegs noch fragt

Android schützt sich gegen Apps aus dem Netz. Diese Meldungen sind normal:

| Meldung | Was du tust |
|---|---|
| "Dieser Dateityp kann dein Gerät schädigen" | Auf **Trotzdem laden** tippen |
| "Unsichere App blockiert" (Play Protect) | Auf **Trotzdem installieren** tippen |
| "Aus dieser Quelle installieren?" | **Erlauben** |

Grund: die App ist mit dem Standard-Testzertifikat von Android signiert und
kommt nicht aus dem Play Store. Das ist bei selbstgebauten Apps immer so.

---

## Drei Dinge, die du wissen solltest

**Die Zurück-Taste beendet das Spiel nicht.**
Sie öffnet die Pause. Dabei wird automatisch gespeichert. Zum Beenden zweimal
zurück oder die App wegwischen.

**App-Spielstand und Browser-Spielstand sind zwei getrennte Stände.**
Das Spiel im Browser (Port 8123) und die App speichern an verschiedenen Orten.
Wenn du in der App weit kommst und danach den Browser aufmachst, steht dort
dein alter Browser-Stand, nicht der aus der App. Das ist kein Fehler, das ist
technisch nicht anders möglich: Android gibt der App eine eigene Adresse
(`https://localhost`), und Spielstände hängen immer an der Adresse.

**Nach jedem neuen Bau musst du neu installieren.**
Wir bauen ein neues APK, du lädst es über dieselbe Adresse und tippst es an.
Android ersetzt die alte Version. **Dein Spielstand bleibt dabei erhalten**,
solange du die App nicht vorher deinstallierst.

---

## Falls die Seite nicht kommt

Der Auslieferungs-Server läuft nur, solange wir ihn gestartet haben. Sag
kurz Bescheid, dann starten wir ihn wieder. Für uns intern:

```sh
# starten (läuft weiter, auch wenn die Shell endet)
nohup python3 tools/serve_apk.py > .tmp/serve_apk_8125.log 2>&1 &
echo $! > .tmp/serve_apk_8125.pid

# prüfen
curl -sI http://127.0.0.1:8125/app-debug.apk

# stoppen
kill "$(cat .tmp/serve_apk_8125.pid)"
```

Port 8125 ist der Auslieferungs-Port. Port 8123 (dein Dev-Server im Browser)
bleibt davon unberührt und läuft weiter.
