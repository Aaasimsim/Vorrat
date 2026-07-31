# Vorrat — Public Observatory & Patient Watchlist Strategy

**Status: proposal, partially adopted.** This is a strategy document, not a description of the
software. Read it for the reasoning, not as a guide to what exists.

| Part of this plan | Status |
|---|---|
| Daily snapshot archive + Date Drift analyzer (§6 Phases 1–2) | **Built.** See `scripts/analyze-drift.mjs` and `.github/workflows/daily-snapshot.yml`. |
| Drift keyed on `Bearbeitungsnummer` (§3) | **Rejected — the method does not work.** BfArM withdraws a report and issues a new number rather than editing in place, so 370 of 516 records reference an earlier report and none of those originals remain in the feed. A BN-keyed diff reads an extension as one shortage ending and another beginning. Identity resolves through the `Referenzierte Erstmeldung` chain instead. |
| Public Observatory dashboard (§6 Phase 3) | **Not built.** Deferred until the archive holds enough days for a rate to mean anything. |
| Observatory as the product's front door (§2) | **Rejected.** Vorrat is a patient utility first; a dashboard serves journalists and researchers. The Observatory belongs beside the patient app, never in front of it. |
| Monorepo restructure, `packages/parser` on npm (§4, §6 Phase 4) | **Rejected.** Rewrites every import path and risks a working app for no user-visible gain. |

The architecture in §4 describes the proposed monorepo, which was not adopted — the current
layout is a single Vite app with `scripts/` alongside it.

---

## 1. Executive Summary & Baseline Audit

### Background & Original Vision
**Vorrat** was originally conceived as an early-warning patient application for drug shortages in Germany. Using open data published by the Federal Institute for Drugs and Medical Devices (**BfArM**), Vorrat monitors manufacturer supply notices and alerts patients before their medication becomes unavailable.

### Codebase Audit (What is Already Built)
The core client-side application is **already fully built and operational in this repository**:
* **Data Pipeline:** Converts Windows-1252 (Latin-1) semicolon-delimited BfArM CSV feed, handles multi-ingredient quoted strings, corrects feed typos (`Arzneimittlbezeichnung`), and deduplicates by `Bearbeitungsnummer`.
* **Graded Matching Engine:** Implements a 4-tier confidence model (High PZN/Brand match, Elevated `verskri`, Low "Watching", Clear) to eliminate false alarms without requiring expensive commercial databases (Lauer-Taxe).
* **Clinical Normalization:** Normalizes pharmacopoeial salt forms (e.g., `Pantoprazol` $\leftrightarrow$ `Pantoprazol-Natrium-Sesquihydrat`).
* **Client-Side Fuzzy Search:** Bounded Levenshtein edit-distance engine (`suggestNames` in `src/lib/vocabulary.js`) for German drug brand names, active ingredients, and PZN checksum validation (Modulo 11).
* **Zero-Server Privacy Boundary:** 100% client-side matching (IndexedDB/localStorage). Sensitive health data (GDPR Art. 9) never leaves the user's device.
* **100% Passing Test Suite:** Verified via `npm test` against 8 critical German clinical test cases (L-Thyroxin, Quetiapin, Metoprolol, Sertralin, Atomoxetin, Pantoprazol watching test, etc.).

---

## 2. Strategic Pivot: Public Observatory + Patient Watchlist

### Why the Pivot is Necessary
While the patient app is technically complete, an **App-Only model** faces three critical product limitations:
1. **Silence as Success State:** When a patient's medications are in stock, the app stays silent for months, leading to high churn and forgotten installs.
2. **Backwards Distribution:** Patients do not search for shortage warning tools until *after* they hit an empty box at a pharmacy counter.
3. **The Denominator Gap:** Predicting precise individual risk without market-share data can over-fire on active ingredient matches.

### The Flipped Model
Instead of an App-Only strategy, Vorrat flips the architecture:
* **The Public Observatory (Front Door):** A living, authoritative web dashboard analyzing nationwide German drug shortages, category trends, and manufacturer end-date extensions (**Date Drift**). This creates an organic search & citation engine for health journalists (*Spiegel*, *Apotheken Umschau*, *DAZ*), pharmacists, policy researchers, and patient communities (`/r/de`, Hashimoto, ADHD, Diabetes groups).
* **The Patient Watchlist (Embedded Utility):** The existing zero-server, GDPR-compliant patient warning tool is embedded directly inside the web platform as a personal watchlist feature.

---

## 3. The Novel Data Asset: Manufacturer "Date Drift"

### Core Concept
The BfArM feed includes an estimated shortage end date (`Ende`) for every report. However, manufacturers frequently push these dates back. By archiving daily CSV snapshots and diffing `Bearbeitungsnummer` records over time, Vorrat measures **Date Drift**:

$$\text{Days Extended} = \text{Ende}_{\text{new}} - \text{Ende}_{\text{previous}}$$

### Headline Investigative Metrics
* **Drift Rate (%):** Percentage of shortage reports extended past their initially reported end date.
* **Average Drift Duration:** Mean number of extra days shortages persist beyond initial manufacturer estimates.
* **Date Drift Leaderboard:** Top drug categories and manufacturers with the highest frequency of date extensions.

*Shape of the eventual claim — the figures below are placeholders, not results:*
> *"According to Vorrat's analysis of BfArM feed data, **[X]%** of psychiatric medication shortages
> in **[year]** were extended past their original end date, lasting an average of **[N]** days longer
> than initially reported."*

**No such figure exists yet.** Drift is measured from archived daily snapshots and the archive
began on 2026-07-31, so any rate today rests on a single observation. `data/processed/drift.json`
carries `snapshotCount` and the observation window for exactly this reason — do not quote a rate
from it without them.

---

## 4. Architectural & Monorepo Blueprint

```text
vorrat/
├── packages/
│   └── parser/            # Standalone zero-dependency BfArM CSV parser (npm package)
├── scripts/
│   └── analyze-drift.mjs  # CLI tool to process historical CSV snapshots -> metrics.json
├── apps/web/              # React + Vite + Tailwind Web Application
│   ├── src/
│   │   ├── components/
│   │   │   ├── Observatory/  # Tab 1: Nationwide statistics, Date Drift, Search
│   │   │   └── PatientApp/   # Tab 2: Existing Local-First Patient Watchlist
│   │   └── lib/              # Matching engine, vocabulary, feed hook
├── data/
│   ├── snapshots/         # Archived daily CSV downloads (YYYY-MM-DD.csv)
│   └── processed/         # metrics.json output generated by daily workflow
└── .github/workflows/
    └── daily-snapshot.yml # Automated GitHub Action cron (03:00 UTC)
```

---

## 5. Technical Specifications

### Data Source & Schema
* **Endpoint:** `https://anwendungen.pharmnet-bund.de/lieferengpassmeldungen/public/csv`
* **Encoding:** Windows-1252 (Latin-1). Must be converted to UTF-8.
* **Delimiter:** Semicolon `;`
* **Header Quirks:** Includes typo `Arzneimittlbezeichnung`. Multi-ingredient `Wirkstoffe` values are double-quoted with internal semicolons (e.g., `"Ezetimib; Simvastatin"`).
* **Deduplication:** Group multiple PZN rows sharing the same `Bearbeitungsnummer`. Remove placeholder PZNs (`99999999`, `00000000`).

### Graded Confidence Signal Model
| Confidence Level | Trigger Condition | UI & Notification Behavior |
|---|---|---|
| **High** | Exact PZN or exact `Arzneimittlbezeichnung` match | Direct alert: "Specific product/pack affected" |
| **Elevated** | `klassifikation` = `verskri` on user's `Wirkstoff` | Direct alert: "Supply-critical shortage for active ingredient" |
| **Low (Watching)** | Single manufacturer shortage for multi-manufacturer `Wirkstoff` | Passive status: "Watching — alternatives available, no alarm" |
| **Clear** | No active shortage matched | Quiet status: "No shortages reported" |

### Safety & Clinical Non-Negotiables
1. **Never Recommend Medication Switching or Dosing Changes:** Substitution is strictly a pharmacist's legal responsibility in Germany (*Aut-idem* rules). Output must always be: *"Talk to your doctor or pharmacist."*
2. **Provable Sourced Claims:** Every alert must cite the BfArM `Bearbeitungsnummer` and `Datum der letzten Meldung`. Manufacturer notes (`Anm. zum Grund`) must be quoted verbatim.
3. **Calm, High-Contrast UI:** WCAG AA accessible typography, non-alarmist status indicators, zero red sirens.

---

## 6. Phased Execution Roadmap

### Phase 1: Date Drift Analyzer Script (`scripts/analyze-drift.mjs`)
* Implement a Node.js script that reads all `data/snapshots/*.csv` files chronologically.
* Key records by `Bearbeitungsnummer` and track changes to `Ende`.
* Calculate aggregate statistics (`total_unique_shortages`, `reports_with_drift`, `avg_days_drifted`, `top_drifted_shortages`).
* Export compiled structured JSON to `data/processed/metrics.json`.

### Phase 2: Daily GitHub Action Automation (`.github/workflows/daily-snapshot.yml`)
* Create a GitHub Action running on a daily cron (`0 3 * * *`).
* Fetch the latest BfArM CSV feed, save to `data/snapshots/YYYY-MM-DD.csv`.
* Execute `node scripts/analyze-drift.mjs`.
* Commit updated snapshot and `metrics.json` to the repo automatically.

### Phase 3: Public Observatory Dashboard UI (`src/components/Observatory/`)
* Build the Public Observatory front-end view:
  * **Summary KPI Cards:** Total Active Shortages, Supply-Critical Shortages, Date Drift Rate.
  * **Date Drift Leaderboard:** Visual list of shortages extended most frequently.
  * **Search & Filter Bar:** Search shortages by active ingredient (`Wirkstoff`), brand name, ATC category, or manufacturer.
* Integrate tabbed navigation switching between **Public Observatory** and **Meine Medikamente (Patient Watchlist)**.

### Phase 4: Package Modularization & Open-Source Release
* Extract `packages/parser` module for npm publication.
* Polish `README.md` with architectural diagrams, GDPR local-first model explanation, and open data mission statement.
