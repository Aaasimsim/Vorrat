# CLAUDE.md — Vorrat

Early-warning app for German drug shortages. Patients enter their medications; the app watches the BfArM shortage feed and warns them before supply is disrupted. Read BRIEF.md first.

## Stack
- Vite + React + Tailwind. German-language UI.
- Serverless function for the data fetch (Vercel). Everything else client-side.
- No TypeScript unless it earns its place. No state library — this is small.

## Non-negotiables

**Never recommend switching medication or dosing.** Output is always "talk to your pharmacist or doctor," plus what to ask. Substitution is a pharmacist's legal call in Germany. This rule has no exceptions.

**Every clinical-adjacent claim traces to a BfArM record.** Show Bearbeitungsnummer + `Datum der letzten Meldung` on every alert. Manufacturer notes are quoted verbatim and attributed, never paraphrased into advice.

**Medication lists never leave the device.** IndexedDB or localStorage. No account. No analytics containing drug names — event names only ("alert_shown", "alert_muted"), never payloads.

**Calm tone.** No red, no sirens, no countdown timers. The reader may be frightened. Factual, unhurried, specific.

## Data pipeline

**Source:** `https://anwendungen.pharmnet-bund.de/lieferengpassmeldungen/public/csv`

Serverless function, runs on a daily cron:
1. Fetch CSV. **Decode as `latin1` / `windows-1252`.** Assuming UTF-8 corrupts every umlaut.
2. Parse: **semicolon-delimited, with quoted fields that themselves contain semicolons** (multi-ingredient `Wirkstoffe` values like `"Ezetimib; Simvastatin"`). Use a real CSV parser, not `split(';')`.
3. Header row has a typo — the field is `Arzneimittlbezeichnung`, not `Arzneimittelbezeichnung`. Match it exactly.
4. Deduplicate: many rows share one `Bearbeitungsnummer` (one row per pack size). Collapse to one record per Bearbeitungsnummer, keeping the array of PZNs.
5. Drop placeholder PZNs `99999999` and `00000000`.
6. Parse `Beginn` / `Ende` from DD.MM.YYYY. **`Beginn` is often in the future — this is the point of the product, not a bug.** Do not filter future-dated records out.
7. Emit compact JSON: one entry per Bearbeitungsnummer with pzns[], wirkstoffe[], atc, produkt, darreichungsform, zulassungsinhaber, beginn, ende, grund, anmerkung, alternativpraeparat, klassifikation, meldedatum.
8. Cache it. The client fetches this JSON, never the CSV.

Client does all matching locally against the on-device medication list.

## Matching and confidence

Do not fire an alert on every Wirkstoff match — twelve manufacturers make pantoprazole and one having a production problem means nothing. Graded confidence:

- **High** — user's exact PZN matches, or exact `Arzneimittlbezeichnung` matches, or most/all distinct `Zulassungsinhaber` for that Wirkstoff + dosage form are in shortage.
- **Elevated** — `klassifikation` is `verskri` (supply-critical) on the user's Wirkstoff.
- **Low** — one of several manufacturers of that Wirkstoff. Passive "wir beobachten das" state. **No push, no alarm.**

Build the low-confidence quiet state with as much care as the alert. It is what the user sees 95% of the time and it is what makes the loud alert credible.

Track mutes as the primary negative signal — muting means the confidence model is too loose.

## Build order

Data pipeline and matching logic first, with real feed data. Then the quiet/watching state. Then the alert. Then onboarding. Polish last.

The edge cases *are* the product here: missing fields, `N/A` values everywhere, multi-ingredient drugs, future start dates, shortages that ended, duplicate reports referencing an earlier `Referenzierte Erstmeldung`. Code defensively on every field access — assume anything can be absent or `N/A`.

## Visual direction

Read the frontend-design skill before styling and make a real design plan first.

Direction to work from, not a template: this is a **German patient-facing health utility for people who are worried**. The subject's world is pharmacy packaging, Beipackzettel typography, the beige-and-white officialdom of the German health system — and the product's job is to make that world legible and calm. Avoid the SaaS-dashboard look and avoid medical-red-cross clichés. Avoid the warm-cream + terracotta default entirely.

Requirements that are not negotiable:
- **WCAG AA minimum, and design for older eyes.** Large default type, generous line height, high contrast, big tap targets. Many users are elderly or unwell. Accessibility is the brief, not a checkbox.
- Status must be legible without relying on colour alone.
- Responsive to mobile first — most people will check this on a phone.
- Respect `prefers-reduced-motion`. Minimal animation generally; this is not a product that should feel playful.

## Copy

German-first. Plain German, not bureaucratic German — the whole point is translating officialese into something a worried person can act on. Active voice. Say what happens next.

**Flag every user-facing string for native-speaker review.** Do not ship German copy written by an A2 speaker to real users; collect the strings in one file to make that review easy.

Never write copy that implies the app knows what the user should do medically. The verbs are *inform*, *show*, *warn* — never *recommend* or *advise*.

## Definition of done
See BRIEF.md §4. Pipeline + graded matching + quiet state + one credible alert, working against live BfArM data, before anything else.
