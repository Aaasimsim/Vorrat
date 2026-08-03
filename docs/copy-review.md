# German & English Copy Review (`src/copy/de.js` & `src/copy/en.js`)

**Target Audience:** German and English-speaking patients in Germany (including elderly and chronic patients).  
**Tone & Safety Directives:** Calm, factual, unhurried. No medical recommendations, no alarming language, no exclamation marks. Active voice (*Sie* form in German, plain English).

---

## 0. Pending native-speaker review — added or changed 2026-08-04

**Nothing in this section has been reviewed by a native speaker.** It was written
by a non-native speaker and must not be considered signed off. The master table
in §1 below predates these changes and still shows the previous wording for any
key that appears here; this section wins.

### New: first-open explanation (`einstieg.*`)

| Key | German | English | Note for the reviewer |
| :--- | :--- | :--- | :--- |
| `app.tagline` | `"Erfahren Sie von Engpässen bei Ihren Medikamenten, bevor Sie in der Apotheke stehen."` | `"Find out about shortages in your medications, before you are standing in the pharmacy."` | Replaces the old category label. Names the outcome, avoids opening on "Lieferengpass". |
| `app.seitentitel` | `"Vorrat: Frühwarnung bei Lieferengpässen von Medikamenten"` | `"Vorrat: early warning for medication supply shortages"` | Browser tab and search result only, never on screen. Keeps the searchable term. |
| `einstieg.mechanismus` | `"Hersteller müssen absehbare Lieferengpässe dem BfArM melden, oft Monate im Voraus. Diese Meldungen sind öffentlich. Nur sieht sie fast niemand."` | `"Manufacturers are required to report foreseeable supply shortages to BfArM, often months in advance. Those reports are public. Almost nobody sees them."` | The load-bearing sentence of the whole app. Check "Nur sieht sie fast niemand" reads as natural spoken German rather than translated English. |
| `einstieg.vorrat` | `"Vorrat liest diese Meldungen täglich und sagt Ihnen, wenn eines Ihrer Medikamente betroffen ist. Früh genug, um in Ruhe mit Apotheke oder Praxis zu sprechen."` | `"Vorrat reads those reports every day and tells you when one of your medications is affected. Early enough to talk to your pharmacy or your doctor's practice without rushing."` | *sagt Ihnen*, never *empfiehlt*. Do not let a rewrite turn this into advice. |
| `einstieg.beispielOeffnen` | `"Beispiel ansehen: So sieht eine Meldung aus"` | `"See an example: what a report looks like"` | Deliberately carries meaning on its own, since most readers never open it. |
| `einstieg.beispielSchliessen` | `"Beispiel ausblenden"` | `"Hide the example"` | |
| `einstieg.beispielLabel` | `"Beispiel"` | `"Example"` | |
| `einstieg.beispielHinweis` | `"Zwei echte Meldungen aus der BfArM-Liste. Ihre eigenen Medikamente werden genauso dargestellt."` | `"Two real reports from the BfArM list. Your own medications are shown the same way."` | |
| `leer.body` | `"Fügen Sie ein Medikament hinzu. Wir prüfen sofort und danach täglich."` | `"Add a medication. We check right away, and every day after that."` | "danach täglich" is the point: a standing watch, not a one-off lookup. |
| `hinzufuegen.nameHilfe` | `"Wie auf der Verpackung angegeben, zum Beispiel L-Thyroxin oder Pantoprazol"` | `"As printed on the package, for example L-Thyroxin or Pantoprazol"` | |

### New: telling the user a shortage is over (`entwarnung.*`)

The only good news this app gives. `beendet*` is spoken **only** when the report
is still listed and its end date has passed. `unklar*` covers a report that left
the feed, which usually means BfArM continued it under a new number — so it must
never read as reassurance. A false all-clear is the worst failure this app has.

| Key | German | English | Note for the reviewer |
| :--- | :--- | :--- | :--- |
| `entwarnung.beendetLabel` | `"Engpass beendet"` | `"Shortage ended"` | |
| `entwarnung.beendetFn` | `({ datum }) => "Der gemeldete Lieferengpass ist seit dem ${datum} beendet. Ihr Medikament sollte wieder normal lieferbar sein."` | `({ datum }) => "The reported supply shortage ended on ${datum}. Your medication should be available normally again."` | "sollte" is deliberate hedging: the report ended, local availability is a separate thing we cannot see. |
| `entwarnung.beendetOhneDatum` | `"Der gemeldete Lieferengpass ist beendet. Ihr Medikament sollte wieder normal lieferbar sein."` | `"The reported supply shortage has ended. Your medication should be available normally again."` | |
| `entwarnung.beendetHinweis` | `"Fragen Sie in Ihrer Apotheke nach, ob Ihr Präparat dort wieder vorrätig ist. Wie schnell die Belieferung wieder anläuft, ist von Ort zu Ort verschieden."` | `"Ask your pharmacy whether your product is back in stock. How quickly supply resumes varies from place to place."` | |
| `entwarnung.unklarLabel` | `"Meldung nicht mehr gelistet"` | `"Report no longer listed"` | Must not sound like good news. |
| `entwarnung.unklarBody` | `"Die frühere Meldung steht nicht mehr in der BfArM-Liste. Ob der Engpass beendet ist oder unter einer neuen Nummer weiterläuft, können wir daraus nicht ablesen."` | `"The earlier report is no longer in the BfArM list. We cannot tell from that whether the shortage has ended or is continuing under a new report number."` | The honest "we do not know" state. Keep the uncertainty explicit. |
| `entwarnung.unklarHinweis` | `"Fragen Sie in Ihrer Apotheke nach, ob Ihr Präparat wieder lieferbar ist."` | `"Ask your pharmacy whether your product is available again."` | |
| `entwarnung.quelleFn` | `({ bearbeitungsnummer }) => "Betraf BfArM-Meldung ${bearbeitungsnummer}"` | `({ bearbeitungsnummer }) => "Concerned BfArM report ${bearbeitungsnummer}"` | Good news is a claim too, so it carries its source. |
| `entwarnung.schliessen` | `"Verstanden, Hinweis ausblenden"` | `"Understood, hide this note"` | |

### Changed elsewhere

Em dashes were removed from every user-facing string (`status.unbekannt.body`,
`status.watching.body`, `hinzufuegen.pznLabel`, `vorrat.unsicher`) and replaced
with full stops or commas. Soft hyphens (`­`) were added inside
`status.watching.label` and `status.affected.label` so the two long compounds
break with a visible hyphen on narrow screens; they are invisible otherwise and
should be preserved through any rewrite of those two labels.

---

## 1. Master Copy Table (German & English Parity)

| Key | German String | English String | Confidence / Note |
| :--- | :--- | :--- | :---: |
| `app.name` | `"Vorrat"` | `"Vorrat"` | sicher |
| `app.tagline` | `"Frühwarnung bei Lieferengpässen von Medikamenten"` | `"Early warning for medication supply shortages"` | sicher |
| `app.dataSource` | `"Basiert auf den offiziellen Lieferengpassmeldungen des Bundesinstituts für Arzneimittel und Medizinprodukte (BfArM)."` | `"Based on the official supply shortage reports filed with the German Federal Institute for Drugs and Medical Devices (BfArM)."` | sicher |
| `nav.meineMedikamente` | `"Meine Medikamente"` | `"My medications"` | sicher |
| `nav.hinzufuegen` | `"Medikament hinzufügen"` | `"Add a medication"` | sicher |
| `nav.datenschutz` | `"Datenschutz"` | `"Privacy"` | sicher |
| `laden` | `"Meldungen werden geladen …"` | `"Loading reports …"` | sicher |
| `details.ausblenden` | `"Details ausblenden"` | `"Hide details"` | sicher |
| `details.anzeigenFn` | `({ anzahl }) => Details anzeigen (${anzahl} ...)` | `({ anzahl }) => Show details (${anzahl} ...)` | sicher |
| `details.entfernenFn` | `({ name }) => ${name} entfernen` | `({ name }) => Remove ${name}` | sicher |
| `status.clear.label` | `"Keine Meldung"` | `"Nothing reported"` | sicher |
| `status.clear.body` | `"Für dieses Medikament liegt aktuell keine behördliche Lieferengpassmeldung vor."` | `"No supply shortage has been reported to the authorities for this medication."` | sicher |
| `status.watching.label` | `"In Beobachtung"` | `"Watching"` | sicher |
| `status.watching.body` | `"Eine Lieferengpassmeldung betrifft Ihren Wirkstoff, aber nicht Ihr Präparat direkt. Das BfArM hat sie nicht als versorgungskritisch eingestuft. Sie müssen jetzt nichts tun — wir beobachten das weiter."` | `"A shortage report affects your active ingredient, but not your specific product. BfArM has not classified it as supply-critical. There is nothing for you to do right now — we will keep watching."` | **Updated for accuracy:** Does not claim other manufacturers supply the market, as feed only tracks reported shortages. |
| `status.affected.label` | `"Lieferengpass gemeldet"` | `"Shortage reported"` | sicher |
| `status.affected.body` | `"Für Ihr Medikament liegt eine offizielle Meldung über einen bevorstehenden oder aktiven Lieferengpass vor."` | `"There is an official report of an upcoming or ongoing supply shortage for your medication."` | sicher |
| `confidence.high` | `"Genaue Übereinstimmung mit Ihrem Medikament"` | `"Exact match with your medication"` | sicher |
| `confidence.elevated` | `"Vom BfArM als versorgungskritisch eingestuft"` | `"Classified as supply-critical by BfArM"` | sicher |
| `confidence.low` | `"Betrifft einen von mehreren Herstellern"` | `"Affects one of several manufacturers"` | sicher |
| `alert.title` | `"Information zum Lieferstatus"` | `"Supply status"` | sicher |
| `alert.beginnFn` | `({ datum }) => Gemeldeter Beginn: ...` | `({ datum }) => Reported start: ...` | sicher |
| `alert.endeFn` | `({ datum }) => Voraussichtliches Ende: ...` | `({ datum }) => Expected end: ...` | sicher |
| `alert.endeUnbekannt` | `"Voraussichtliches Ende: Nicht angegeben"` | `"Expected end: not stated"` | sicher |
| `alert.grundLabel` | `"Gemeldeter Grund"` | `"Reported reason"` | sicher |
| `alert.herstellerHinweisLabel` | `"Hinweis des Herstellers"` | `"Note from the manufacturer"` | sicher |
| `alert.herstellerHinweisQuelle` | `"Diese Information stammt direkt aus der Auskunft des Herstellers an das BfArM."` | `"This note was filed with BfArM by the manufacturer and is shown in the original German, exactly as written."` | **Attribution check:** Explicitly informs English users that the note is untranslated German. |
| `alert.alternativeLabel` | `"In der Meldung genanntes Alternativpräparat"` | `"Alternative product named in the report"` | sicher |
| `alert.alternativeDisclaimer` | `"Dieser Hinweis stammt aus der behördlichen Meldung. Die Entscheidung über einen Wechsel oder eine Anpassung trifft ausschließlich Ihr Arzt oder Ihre Apotheke."` | `"This name comes from the official report. Only your doctor or pharmacist can decide whether to change or adjust anything."` | sicher |
| `alert.quelleFn` | `({ bearbeitungsnummer, datum }) => Quelle: ...` | `({ bearbeitungsnummer, datum }) => Source: ...` | sicher |
| `naechsteSchritte.title` | `"Mögliche nächste Schritte"` | `"What you can do next"` | sicher |
| `naechsteSchritte.intro` | `"Besprechen Sie die Versorgungslage frühzeitig bei Ihrem nächsten Besuch in der Apotheke oder Arztpraxis."` | `"Raise it early at your next visit to the pharmacy or your doctor's practice."` | sicher |
| `naechsteSchritte.punkte[0]` | `"Fragen Sie in Ihrer Apotheke, ob Ihr Präparat ausreichend vorrätig ist oder rechtzeitig bestellt werden kann."` | `"Ask your pharmacy whether your product is in stock, or can still be ordered in time."` | sicher |
| `naechsteSchritte.punkte[1]` | `"Erkundigen Sie sich, ob ein wirkstoffgleiches Präparat eines anderen Herstellers verfügbar ist."` | `"Ask whether a product with the same active ingredient from another manufacturer is available."` | sicher |
| `naechsteSchritte.punkte[2]` | `"Falls kein Ersatz vorrätig ist: Sprechen Sie mit Ihrer Arztpraxis über eine rechtzeitige Rezeptanpassung."` | `"If no substitute is in stock, talk to your doctor's practice about adjusting the prescription in good time."` | sicher |
| `naechsteSchritte.punkte[3]` | `"Zeigen Sie bei Bedarf diese BfArM-Meldungsnummer in Ihrer Apotheke vor."` | `"Show your pharmacy this BfArM report number if it helps."` | sicher |
| `unsicherheit.title` | `"Hinweis zur Datenbasis"` | `"About this data"` | sicher |
| `unsicherheit.body` | `"Die Angaben basieren auf den gesetzlichen Selbstauskünften der Hersteller gegenüber dem BfArM. Eine Meldung bedeutet nicht zwingend, dass das Medikament in Ihrer Apotheke vor Ort vergriffen ist. Die tatsächliche Verfügbarkeit kann lokal variieren."` | `"These details come from the reports manufacturers are legally required to file with BfArM. A report does not necessarily mean your local pharmacy has run out. Actual availability varies from place to place."` | sicher |
| `hinzufuegen.title` | `"Medikament hinzufügen"` | `"Add a medication"` | sicher |
| `hinzufuegen.nameLabel` | `"Name des Medikaments oder Wirkstoff"` | `"Medication name or active ingredient"` | sicher |
| `hinzufuegen.nameHilfe` | `"Wie auf der Verpackung angegeben"` | `"As printed on the package"` | sicher |
| `hinzufuegen.pznLabel` | `"Pharmazentralnummer (PZN) — optional"` | `"Pharmazentralnummer (PZN) — optional"` | sicher |
| `hinzufuegen.pznHilfe` | `"Die 8-stellige Nummer finden Sie auf der Packung und auf jedem Rezept. Die Eingabe ist freiwillig und ermöglicht eine genauere Zuordnung."` | `"The 8-digit number on the package and on every prescription. It is optional, and giving it lets us match your exact pack."` | sicher |
| `hinzufuegen.speichern` | `"Medikament speichern"` | `"Save medication"` | sicher |
| `hinzufuegen.abbrechen` | `"Abbrechen"` | `"Cancel"` | sicher |
| `leer.title` | `"Noch keine Medikamente hinterlegt"` | `"No medications added yet"` | sicher |
| `leer.body` | `"Fügen Sie Ihre regelmäßig benötigten Medikamente hinzu. Vorrat vergleicht diese kontinuierlich mit den aktuellen behördlichen Meldungen."` | `"Add the medications you take regularly. Vorrat checks them against the current official reports."` | sicher |
| `leer.cta` | `"Erstes Medikament hinzufügen"` | `"Add your first medication"` | sicher |
| `datenschutz.title` | `"Datenschutz & Privatsphäre"` | `"Privacy"` | sicher |
| `datenschutz.kurz` | `"Ihre Medikamentenliste wird ausschließlich lokal auf Ihrem Gerät gespeichert und niemals übertragen."` | `"Your medication list is stored only on this device and is never transmitted."` | sicher |
| `datenschutz.lang` | `"Es wird kein Benutzerkonto benötigt. Ihre eingegebenen Medikamente bleiben in Ihrem Browser gespeichert und verlassen Ihr Gerät zu keinem Zeitpunkt. Vorrat lädt nur die öffentliche Liste des BfArM herunter und gleicht sie hier auf Ihrem Gerät ab. Wer Zugriff auf dieses Gerät hat, kann die Liste allerdings sehen."` | `"No account is needed. The medications you enter stay in this browser and never leave your device. Vorrat only downloads the public BfArM list and compares it here, on your device. Anyone with access to this device can, however, see the list."` | **Updated for accuracy:** "vollständig geschützt" removed because unencrypted localStorage can be read by anyone with physical/device access. |
| `fehler.laden` | `"Die aktuellen Lieferengpassdaten konnten nicht geladen werden. Bitte überprüfen Sie Ihre Internetverbindung."` | `"The current shortage data could not be loaded. Please check your internet connection."` | sicher |
| `fehler.veraltetFn` | `({ datum }) => Hinweis: Es wird ein gespeicherter Stand...` | `({ datum }) => Showing a saved version from...` | sicher |
| `aktualisiert.standFn` | `({ datum }) => Stand der BfArM-Daten: ...` | `({ datum }) => BfArM data as of ...` | sicher |
| `vorrat.titel` | `"Reichweite & Vorratsschätzung"` | `"Estimated supply & run-out date"` | sicher |
| `vorrat.packungsgroesseLabel` | `"Packungsgröße (Anzahl Tabletten oder Einheiten)"` | `"Pack size (number of tablets or units)"` | sicher |
| `vorrat.dosisLabel` | `"Tägliche Dosis (z. B. 1 oder 0,5)"` | `"Daily dose (e.g. 1 or 0.5)"` | sicher |
| `vorrat.letzteAbholungLabel` | `"Datum der letzten Abholung"` | `"Date of last pickup"` | sicher |
| `vorrat.reichtBisFn` | `({ datum }) => Ihr Vorrat reicht voraussichtlich...` | `({ datum }) => Your supply is estimated to last...` | sicher |
| `vorrat.unsicher` | `"Vorratsschätzung unvollständig — bitte ergänzen Sie Ihre Angaben."` | `"Run-out estimate incomplete — please check your entries."` | sicher |
| `vorrat.vorEngpassFn` | `({ datum }) => Ihr Vorrat endet voraussichtlich am...` | `({ datum }) => Your supply is estimated to end on...` | sicher |
| `vorrat.nachEngpassFn` | `({ datum }) => Der gemeldete Engpass beginnt...` | `({ datum }) => The reported shortage starts before...` | sicher |
| `vorrat.hinweis` | `"Dies ist eine Schätzung basierend auf Ihren eigenen Angaben und berücksichtigt keine Dosisänderungen."` | `"This is an estimate based on your own entries and does not account for changes in dose."` | sicher |

---

## 2. Review Debt & Factual Corrections Audit

1. **`status.watching.body`:**
   * **Reason for edit:** The original draft claimed "other manufacturers still supply the drug". The BfArM feed only lists *who reports a shortage*, not market share or baseline suppliers. Stating other suppliers exist is an unverified inference. The current string strictly reports factual feed status ("affects your active ingredient, but not your specific product... BfArM has not classified it as supply-critical").
2. **`datenschutz.lang`:**
   * **Reason for edit:** Removed the phrase "vollständig geschützt" ("completely protected"). In browser `localStorage`, data is stored unencrypted. Anyone with physical access to the device or browser profile can view it. Over-claiming complete security in a health product violates trust requirements. The revised copy clearly notes: *"Wer Zugriff auf dieses Gerät hat, kann die Liste allerdings sehen."* / *"Anyone with access to this device can, however, see the list."*

---

## 3. English Copy Proofread Audit

* **Tone & Register:** The English mirror in `src/copy/en.js` successfully maintains the calm, unhurried, non-alarming tone of `de.js`. It avoids clickbait urgency ("Emergency", "Critical warning!", "Act now!").
* **Advice vs. Information Framing:** `naechsteSchritte.punkte` are framed as questions to ask healthcare professionals ("Ask your pharmacy whether...", "Ask whether a product...", "talk to your doctor's practice...", "Show your pharmacy this BfArM report number..."). The app never positions itself as a clinical authority.
* **Untranslated Note Attribution:** `alert.herstellerHinweisQuelle` explicitly instructs English users: *"This note was filed with BfArM by the manufacturer and is shown in the original German, exactly as written."* This prevents confusion when verbatim German text appears in the English UI mode.
* **German Regulatory Term Translation:**
  * *Lieferengpass* -> "supply shortage" (accurate, clear).
  * *Zulassungsinhaber* -> "manufacturer" (plain English for consumer UX).
  * *versorgungskritisch* -> "supply-critical" (faithful to federal classification).
  * *Aut-idem / Substitution* -> Phrased naturally as "decide whether to change or adjust anything", enforcing that only doctors/pharmacists make therapy decisions.
