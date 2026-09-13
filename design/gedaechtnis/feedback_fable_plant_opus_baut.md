---
name: feedback-fable-plant-opus-baut
description: "Arbeitsregel von Michael (06.07.2026): Fable plant/orchestriert, alle ausfuehrenden Subagenten laufen auf Opus"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 2135f5db-b185-41ca-95a9-9bd4f9302d40
---

Michael will: Planung, Spezifikationen, Synthese und Endkontrolle im Hauptloop (Fable);
ALLE ausfuehrenden Subagenten (Builder, Integrator, Verify, Fixer, Proof/Screenshots)
mit model: 'opus' spawnen — in Workflows via agent(..., {model: 'opus'}), beim
Agent-Tool via model-Parameter.

**Why:** Session-Limits von Fable wurden mehrfach mitten in Builds gerissen
(Grimlight Slice 1 und 1.5); Ausfuehrung auf Opus schont das Fable-Budget, waehrend
die Qualitaet der Planung/Specs (wo Fable den Unterschied macht) erhalten bleibt.

**How to apply:** In jedem Workflow-Skript bei jedem agent()-Aufruf model: 'opus'
setzen. Fable-Ausnahmen nur nach Ruecksprache (z. B. Art-Juroren), Standard ist
strikt: Fable plant, Opus fuehrt aus. Gilt projektuebergreifend, siehe auch
[[project-grimlight]].

**Ergänzung 09.09.2026 (Kuechenapp):** Michael erlaubt Sonnet für rein mechanische
Schritte (Screenshots, Datenexport, Smoke-Läufe) — Bau, Design, Protokoll, Prüfung bleiben
Opus. Außerdem gewollt: mehrere Workflows parallel starten (Cap = min(16, Kerne−2) je
Workflow, auf dem 2-Kern-Server also 2), Token-Verbrauch dafür akzeptiert; Server-Upgrade
auf 8 Kerne als Option besprochen. Siehe [[project-kuechenapp]].
