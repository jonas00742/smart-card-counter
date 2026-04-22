# 📱 App Spezifikation & Requirements

Diese Progressive Web App digitalisiert den kompletten Zähl- und Rechenprozess des analogen Stich-Kartenspiels. Eine detaillierte Erklärung der Spielregeln befindet sich in der [`GameRules.md`](./GameRules.md) Datei.

## 1. 🗂️ Setup & Spielervorbereitung (Vor dem Spiel)

* **Spieler-Pool Verwaltung:**
  * Neue Spieler können per Texteingabe (inkl. "Enter"-Tasten-Support für Schnelleingabe) hinzugefügt werden.
  * **Validierung:** Leere Namen werden ignoriert und Texteingaben automatisch bereinigt (HTML-Sanitization), bevor sie im lokalen Pool gespeichert werden.
  * Bestehende Spieler können über einen Bestätigungsdialog aus dem Pool dauerhaft gelöscht werden.
* **Teilnehmerauswahl:**
  * Aus dem Spieler-Pool können Spieler für das aktuelle Spiel als aktiv markiert werden.
  * Das Spiel erfordert mindestens 2 aktive Spieler (der Start-Button wird vorher deaktiviert).
* **Sitzreihenfolge & Geber:**
  * Die ausgewählten Spieler können per Touch-Drag & Drop exakt in die physische Sitzreihenfolge am Tisch gebracht werden.
  * Ein Spieler kann gezielt als Geber (Dealer) für die erste Runde festgelegt werden. In den darauffolgenden Runden rotiert die Geber-Rolle automatisch zum nächsten Spieler.
* **Spiel-Fortsetzung (Auto-Save Recovery):**
  * Ein laufendes oder versehentlich geschlossenes Spiel wird beim Neustart der App automatisch erkannt und kann an exakt derselben Stelle fortgesetzt werden.

## 2. 📊 Spiel-Tabelle & Rundenverlauf (Während des Spiels)

* **Digitale Spieltabelle:**
  * Die App generiert eine übersichtliche Matrix (Zeilen = 13 Runden, Spalten = Spieler).
  * **Zweizeiliger fixierter Tabellenkopf (Sticky Header):** Beim vertikalen Scrollen bleibt der gesamte Kopfbereich am oberen Rand haften. Er besteht aus der Namenszeile der Spieler und einer nahtlos integrierten, kompakten zweiten Zeile, die permanent die **Ansagen (prognostizierte Stiche)** der aktuellen Spielrunde in kleinen Badges anzeigt, sodass diese jederzeit auf einen Blick ablesbar sind.
  * Die aktuell aktive Runde sowie der aktuelle Geber werden visuell hervorgehoben.
  * Der/die führende(n) Spieler werden in der Kopfzeile mit einem Kronen-Symbol (👑) markiert.
  * **Detail-Status Spalte:** Die "±"-Spalte zeigt nicht nur ein Erfolgssymbol bei korrekter Gesamtansage. Bei Abweichungen wird stattdessen rechts oben die Summe der angesagten Stiche (in schwarz) und rechts unten die Differenz zur Kartenanzahl der Runde (in rot, z.B. "+2") angezeigt, um sofortiges, detailliertes Feedback zu geben.
  * Ein schwebender (sticky) Action-Button führt die Nutzer iterativ durch die Phasen der jeweiligen Runde (Ansage eintragen -> Stiche eintragen -> Nächste Runde).
* **Runden-Logik & Hinweise:**
  * Die App kennt und steuert die exakte Kartenanzahl der 13 Runden (Aufbauend: 1 bis 7 Karten; Abbauend: 6 bis 1 Karte).
  * Anzeige der aktuell zu verteilenden Karten inklusive eines Trend-Pfeils (↑/↓), der anzeigt, ob es in der nächsten Runde mehr oder weniger Karten gibt.
  * **Warn-Anzeige (Vorletzte Runde):** Ein dediziertes visuelles Feedback (Blinken) warnt die Spieler unmittelbar vor dem Start der 13. (und damit letzten) Runde, um den Fokus auf das Finale zu lenken.

## 3. 🎯 Smart Input (Eingabe der Ansagen & Stiche)

* **Intelligentes Eingabe-Menü:**
  * Ein Bottom-Sheet rutscht für die Dateneingabe von unten ins Bild, sodass der Kontext (die Tabelle) im Hintergrund sichtbar bleibt.
  * **No-Keyboard-Ansatz:** Große, dynamisch generierte Zahlen-Buttons (von 0 bis zur maximalen Kartenanzahl der aktuellen Runde) ermöglichen eine schnelle und fehlerfreie Eingabe.
* **Ansage-Phase:**
  * Jeder Spieler gibt an, wie viele Stiche er exakt prognostiziert.
* **Ergebnis-Phase (Gemachte Stiche):**
  * **Dynamische Autovervollständigung:** Sobald Stiche eingetragen werden, errechnet die App, ob sich die restlichen fehlenden Stiche der anderen Spieler automatisch logisch ergeben (z.B. wenn nur noch ein Spieler eine Eingabe fehlt).
  * **"Magic Fill" Button:** In Runden, in denen die Summe der Ansagen der Anzahl der Karten entspricht, erscheint ein "Alle lagen richtig" Button, der automatisch für alle Spieler die gemachten Stiche entsprechend ihrer Ansage ausfüllt.
  * **Reset-Button:** Die Eingaben der aktuellen Phase können über einen Button zurückgesetzt werden.
  * **Validierung:** Das System stellt sicher, dass die Eingabe erst bestätigt werden kann, wenn die Summe aller eingetragenen Stiche exakt der Summe der ausgeteilten Karten in dieser Runde entspricht.

## 4. 🧮 Punkte-Engine & Zwischenstand

* **Echtzeit-Punkteberechnung:**
  * Die Auswertung nach jeder Runde basiert auf den offiziellen Spielregeln:
    * *Punktlandung (Erfolg):* Exakt getippt = 5 Bonuspunkte + Anzahl der gemachten Stiche.
    * *Abweichung (Misserfolg):* Danebengetippt = Minuspunkte in Höhe der exakten Differenz zwischen Ansage und tatsächlichen Stichen.
* **Zwischenstand-Anzeige:**
  * Über einen separaten Button kann jederzeit (ohne die Tabelle verlassen zu müssen) das aktuelle Ranking und die genaue Punktzahl aller Spieler bis zur aktuellen Runde als Overlay/Modal eingesehen werden.
  * Bei einem Führungswechsel wird ein kurzer Sound abgespielt.
* **Leaderboard-Medaillen:**
  * Die Platzierungen im Zwischen- und Endstand-Ranking werden mit Medaillen visualisiert (🥇, 🥈, 🥉).
  * Bei 4 oder mehr Spielern erhält der letzte Platz ein "💩"-Emoji.

## 5. ✏️ Korrektur & Edit-Modus

* **Nachträgliche Fehlerbehebung:** Jede bereits abgeschlossene Runden-Zeile kann über einen Editier-Modus im Nachhinein bearbeitet werden (falls Eingabefehler passiert sind).
* **Kaskadierende Neuberechnung:** Werden vergangene Werte (Ansagen oder Stiche) korrigiert, berechnet die App automatisch alle darauffolgenden Runden und den aktuellen Gesamtstand komplett neu durch.

## 6. 🏆 Spielende & Endstand

* **Endstand-Screen:**
  * Nach Abschluss der letzten Eingabe in Runde 13 wird automatisch ein finaler Endstand präsentiert.
  * Visuelle Darstellung der Platzierungen (Podium/Ranking) inklusive der erreichten Gesamtpunktzahlen.
  * Das Podium hebt die ersten drei und den letzten Platz besonders hervor.
* **Neues Spiel (Revanche):**
  * Möglichkeit, direkt aus dem Endstand-Screen ein neues Spiel mit demselben Setup (gleichen Spielern) oder komplett neu zu starten.

## 7. 🚀 Nicht-Funktionale Anforderungen (UX & Tech)

* **Mobile-First / No-Keyboard:** Die Bedienung am Tisch muss blind und einhändig funktionieren. Keine Texteingaben während des Spiels.
* **Offline-First (PWA):** Die App muss nach dem ersten Laden zu 100 % ohne aktive Internetverbindung funktionieren. Assets werden über einen Service Worker gecached.
* **Installierbar:** Die App muss als Standalone-PWA installierbar sein. Der "App installieren"-Button wird intelligent nur dann eingeblendet, wenn das Gerät/Browser dies unterstützt und die App noch nicht installiert ist.
* **State-Management:** Alle Spieler, Setups und jeder getätigte Spielzug werden direkt und persistent im LocalStorage des Browsers gespeichert, um Datenverlust zu verhindern.
* **Sicherheit/UX:** Verhindern von versehentlichen Aktionen durch Bestätigungsdialoge (z.B. beim Löschen von Spielern oder Abbrechen eines laufenden Spiels).
* **Sound-Effekte:** Dezente Sound-Effekte, wie beim Führungswechsel, verbessern das interaktive Erlebnis.
