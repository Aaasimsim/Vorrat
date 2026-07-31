# Vorrat — product brief

**Early warning for people whose medication is about to run short.**

Working title. Alternatives: Nachschub, Bestand, Refill Radar.  
Author: Asim Syed · Build target: Claude Code

---

## 1. The problem

In Germany, drug shortages are reported by manufacturers to the BfArM and published openly. Foreseeable shortages are supposed to be reported **up to six months in advance**. The database is public, machine-readable, and updated continuously.

Patients never see it.

A person on levothyroxine, quetiapine, escitalopram or insulin finds out their medication is unavailable when they are standing at a pharmacy counter with an empty box at home. The information that would have let them plan existed months earlier, in a federal database, in a format built for pharmaceutical companies.

**Vorrat closes that gap.** You tell it what you take. It watches the federal shortage feed and tells you before your medication becomes hard to get — with enough lead time to talk to your doctor or pharmacist rather than react in a crisis.

### Why this matters clinically
Supply-driven treatment interruption is a real harm, concentrated in the people least able to absorb it: elderly patients, people on multiple chronic medications, and people on psychiatric or endocrine drugs where abrupt discontinuation is genuinely dangerous. This isn't a convenience product.

### Why nobody has built it
The existing tools that consume this feed are pharmacy- and wholesaler-facing (pharmazie.com, ABDA database, various trade portals). They answer "what do I stock?" Medication apps like MyTherapy answer "did you take your pill?" **Nobody answers "is the thing you depend on about to disappear?"**

---

## 2. Verified data source

**Endpoint:** `https://anwendungen.pharmnet-bund.de/lieferengpassmeldungen/public/csv`  
No auth. No API key. Updated continuously by BfArM.

**Format:** semicolon-delimited CSV, **Windows-1252 / latin-1 encoded** (not UTF-8 — umlauts will corrupt if you assume UTF-8).

**Columns (exact header, including their typo in `Arzneimittlbezeichnung`):**
```
PZN;ENR;Bearbeitungsnummer;Referenzierte Erstmeldung;Meldungsart;Beginn;Ende;
Datum der letzten Meldung;Art des Grundes;Arzneimittlbezeichnung;Atc Code;
Wirkstoffe;Krankenhausrelevant;Zulassungsinhaber;Telefon;E-Mail;Grund;
Anm. zum Grund;Alternativpräparat;Datum der Erstmeldung;Info an Fachkreise;
Darreichungsform;klassifikation
```

**Field notes that matter:**
- `Bearbeitungsnummer` — the shortage report ID. **Multiple rows share one Bearbeitungsnummer**, one per pack size (PZN). Deduplicate on this.
- `PZN` — pack identifier. Placeholder values `99999999` and `00000000` appear; treat as null.
- `Wirkstoffe` — active ingredient(s). Multi-ingredient values are quoted and semicolon-separated *inside* the field (e.g. `"Ezetimib; Simvastatin"`). Your CSV parser must handle quoted fields containing the delimiter.
- `Beginn` / `Ende` — DD.MM.YYYY. **`Beginn` is frequently in the future.** That is the entire product: advance notice.
- `klassifikation` — `versrel` (supply-relevant), `verskri` (supply-critical), or `weder versrel noch verskri`. This is your severity prior.
- `Alternativpräparat` — sometimes names a genuine alternative product. Often `N/A`.
- `Anm. zum Grund` — free text, occasionally contains **manufacturer guidance written for patients**. A live example from the feed: for L-Thyroxin Henning 150, Sanofi wrote that patients should ask their doctor whether the available 100 and 50 strengths could work as an alternative. That is official, sourced, actionable guidance that currently reaches no patient. Surfacing it verbatim (attributed) is one of the highest-value things this product does.

**Current shortages in the live feed** include levothyroxine, quetiapine, escitalopram, sertraline, amitriptyline, gabapentin, pregabalin, atomoxetine, pantoprazole, atorvastatin, metoprolol, propranolol, insulin glargine, and isotretinoin. These are not edge cases — they are among the most-prescribed drugs in the country. The problem is large and current.

---

## 3. The hard problem: signal quality

This is where the product is won or lost, and it's the part worth thinking about like a PM rather than an engineer.

**Naive version:** user enters "Pantoprazol" → any Pantoprazol shortage fires an alert → user gets alarmed weekly about nothing, because twelve manufacturers make pantoprazole and one having a production issue means nothing for supply.

**A false alarm in a health product is worse than no product.** It teaches people to ignore you, and it causes anxiety in exactly the population you're trying to help.

So matching must be graded. Proposed confidence model:

| Signal | Confidence | Treatment |
|---|---|---|
| User's exact PZN in shortage | High | Direct alert |
| User's exact product name (`Arzneimittlbezeichnung`) in shortage | High | Direct alert |
| Most/all distinct `Zulassungsinhaber` for that Wirkstoff+strength in shortage | High | Market-wide alert |
| `klassifikation` = `verskri` on user's Wirkstoff | Elevated | Alert, flagged as supply-critical |
| One of many manufacturers of the Wirkstoff in shortage | Low | Show in a passive "watching" list, no push, no alarm |

Compute the denominator — how many distinct marketing authorization holders supply this Wirkstoff in this dosage form — from the feed itself plus the shortage-free baseline you can infer. This is imperfect; be honest about it in the UI.

**Design the low-confidence state as carefully as the alert.** "We're watching this, no action needed" is most of what the product says most of the time, and it's what makes the rare loud alert credible.

---

## 4. Product scope

### v1 (build this)
1. **Add your medications** — by name or active ingredient. Optionally PZN from the package for precise matching.
2. **Watch list** — quiet status for each medication: clear, watching, or affected.
3. **Alert** — when a high-confidence match fires: what's happening, when it starts, expected end date, the manufacturer's own note if present, and the named alternative product if the feed provides one.
4. **What to do next** — always the same shape: talk to your pharmacist or doctor, here's what to ask, here's the source record.
5. **Optional run-out estimate** — pack size + daily dose + last pickup date → approximate date you run out, so alerts can be framed as "this starts before you run out" vs "after."

### Explicitly not in v1
- No dosing advice, no substitution recommendations, no "take this instead."
- No accounts, no cloud storage of medication lists.
- No interaction checking (different product, different risk profile, don't blur them).
- No German/English toggle initially — build German-first. **This product's users are German patients.** The UI copy needs a native-level review before it goes in front of users. Budget for that.

---

## 5. Safety architecture (non-negotiable)

**Never recommend a switch.** Substitution is a pharmacist's legal responsibility in Germany (Aut-idem, Rabattverträge, Austauschregeln). The product's output is always *start a conversation*, never *take this instead*. Getting this wrong isn't just liability — it's the difference between a product a pharmacist would endorse and one they'd warn patients about.

**Surface, don't infer.** Every clinical-adjacent statement traces to a BfArM record. Show the Bearbeitungsnummer and report date on every alert. If an LLM is used at all, it's for translating bureaucratic German into plain German — never for judgment about therapy. Log the source string next to the rendered string so provenance is auditable.

**Medication data is Art. 9 GDPR special-category data.** Medication lists stay on device (IndexedDB/localStorage). No account. No analytics that touch drug names — if you measure anything, measure "alert fired / alert opened," never *which* drug. Say this plainly in the UI; it's a trust feature, not fine print.

**Don't alarm.** Tone is calm and specific. No red banners, no urgency theatre. The person reading this may be frightened about losing access to a medication they need. Write like a good pharmacist talks: factual, unhurried, clear about what is and isn't known.

**Say what you don't know.** The feed is manufacturer self-reported and incomplete. Local availability varies. State this at the point of the alert, not buried in a footer.

---

## 6. Architecture note (read before building)

The BfArM CSV almost certainly has **no CORS headers**, so a browser can't fetch it directly. Don't discover this three hours in.

Recommended shape:
- **A tiny serverless function** (Vercel edge/cron) fetches the CSV once or twice daily, decodes latin-1, parses, deduplicates by Bearbeitungsnummer, and serves a compact JSON index — probably a few hundred KB.
- **The client** pulls that JSON and does all matching **locally against the on-device medication list**. The user's medications never leave the device.

That split is the whole privacy story and it's clean: public data travels, private data doesn't.

---

## 7. How you'll know it works

Priority order: real users first, then usage data.

**First 20–30 users.** Communities where people have personally been burned by a Lieferengpass: German Hashimoto/thyroid groups (levothyroxine shortages are chronic and well-known), ADHD communities (atomoxetine, methylphenidate), diabetes groups, and epilepsy/psychiatric med communities where discontinuation is genuinely dangerous. These people will tell you within a day whether this is useful.

**The one metric that matters:** did an alert reach someone *before* they hit an empty box, with enough time to act? Everything else is secondary. Instrument that specifically — a single "was this useful / did you already know?" on each alert gives you a precision measure and a lead-time measure in one tap.

**The failure mode to watch:** alert fatigue. If people mute you, the confidence model is too loose. Track mutes as your primary negative signal.

---

## 8. Honest risks

- **Signal quality is genuinely hard.** Wirkstoff-level matching over-fires; PZN-level matching under-fires because most people don't know their PZN. The onboarding has to make PZN entry easy (it's printed on the package and on every Rezept) without making it mandatory.
- **The feed lags reality.** Manufacturers report when they report. Some shortages appear the same week they bite. You cannot promise six months' notice; you can only promise you'll pass on what's known as soon as it's known. Don't oversell in the copy.
- **Language.** German-first UI written by an A2 speaker is a real risk. Get a native speaker to review every string before user testing.
- **Verify nothing like this exists patient-side** before you build. I found pharmacy- and wholesaler-facing tools only, but I did not run an exhaustive German consumer app scan. Spend an hour on this first.

---

## 9. Positioning (for later)

This is a real product first. But it is also, incidentally, a strong professional artifact: a live product, with real users, in regulated German digital health, built on federal open data, with a defensible safety model. That story travels to any health-product or AI-PM conversation in this market.

Build it because the alert should exist. The rest follows.
