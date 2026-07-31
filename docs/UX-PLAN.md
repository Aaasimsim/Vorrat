# Vorrat — UI/UX modernisation plan

**Status:** proposal, for review. Nothing here is built.
**Author:** Claude · **For review by:** Gemini, then Asim
**Date:** 31 July 2026

Read `brief.md` §5 and the "Visual direction" section of `CLAUDE.md` first — both are binding and
this plan is written underneath them, not alongside them.

---

## 1. Who we are actually designing for

Every decision below traces back to this. It is not a generic consumer app audience.

- **Older, and often unwell.** Levothyroxine, quetiapine, metoprolol, insulin — the shortage list is
  dominated by chronic medication for people over 60. Presbyopia, tremor, arthritis, cataract, and
  reduced contrast sensitivity are the median case, not the edge case.
- **Frightened when they arrive.** Nobody opens this app idly. They open it because they heard
  something, or because a pharmacy turned them away. Design for someone whose working memory is
  degraded by anxiety.
- **On a phone, one-handed, possibly in a pharmacy queue.**
- **Low digital confidence is common.** Assume no tolerance for hidden gestures, ambiguous icons,
  or anything that looks like it might charge them money or take their data.
- **They may hand the phone to a pharmacist.** The screen is a communication artifact between
  patient and professional, not just a private read. Nothing in the current design accounts for
  this and it is the biggest missed opportunity in the app.

**The design test for every screen:** could a worried 72-year-old, holding a phone at arm's length
in bad light, understand what this means and what happens next, without scrolling and without
asking anyone?

---

## 2. What is working and must not be lost

Listed so a redesign does not casually undo it.

- The **calm register**. No red, no sirens, no urgency theatre. This is correct and rare.
- **Status carried by word + icon shape + colour**, never colour alone.
- **Provenance on every claim** — Bearbeitungsnummer and report date are visible, and the
  manufacturer's note is quoted verbatim rather than paraphrased.
- **The quiet state is written as carefully as the alert.** It is 95% of sessions.
- **Sorting**: affected first, muted last.
- **Privacy stated up front**, in the header, not buried in a footer.

---

## 3. Audit of the current build

Severity: **A** = accessibility defect affecting this audience directly · **B** = comprehension or
trust risk · **C** = polish.

### A1 — Fixed `px` root font size defeats the user's own text setting
`src/index.css` sets `html { font-size: 18px }`. A user who has raised their browser or Android/iOS
default font size to 24px **gets 18px anyway**. We wrote "large default type" into the brief and
then overrode the exact mechanism by which our audience makes type large. This is the single worst
defect in the build.
**Fix:** `font-size: 112.5%` (or `1.125rem`), so the 18px baseline becomes a *floor* that scales
with the user's preference. Then audit for layouts that break at 200% zoom, which WCAG 1.4.4
requires.

### A2 — Border contrast fails WCAG 1.4.11 (measured)
`--color-linie #d9d2c6` on `--color-papier #faf8f4` measures **1.42:1**. Non-text UI components
require **3:1**. Card edges, input outlines, and section rules are the entire structural language of
the design and they are close to invisible to someone with reduced contrast sensitivity — which is
most of this audience.
Text colours all pass and pass well (16.5:1, 9.7:1, 7.1:1, 6.3:1, 7.6:1). The problem is confined to
borders and separators.
**Fix:** darken to roughly `#b4a894` (≈3.1:1) for functional borders — input outlines, card edges,
focus targets — while keeping a lighter tone for purely decorative rules.

### A3 — Text-link tap targets below 44px
"… entfernen" and the mute control are bare underlined text. WCAG 2.5.8 asks for 24×24 minimum,
Apple and Google both say 44–48px, and hand tremor makes this materially harder. Buttons in the
forms are already `min-h-12`; these two were missed.

### A4 — No support for `prefers-contrast`, no dark mode
Older users disproportionately enable high-contrast and dark modes at OS level. We currently ignore
both. Dark mode also matters for a 3am "have I got enough left" check.

### A5 — No form error states
If a required field is empty the browser default fires and nothing is styled, announced, or
explained. There is no `aria-live` region anywhere in the app.

### B1 — Free-text medication entry is the biggest correctness risk in the product
A user types `Panto` or `L-Thyroxin 150` or a brand name we do not match, gets **"Keine Meldung"**,
and is reassured — wrongly. This is a silent false negative, the failure mode `brief.md` §8 names
first, and it is a *UI* problem as much as a matching one. `wirkstoffNames.js` fixed the salt-form
half of it; the typo/brand/partial half is untouched.

### B2 — The screen the copy tells users to show a pharmacist does not exist
`naechsteSchritte.punkte` says *"Zeigen Sie bei Bedarf diese BfArM-Meldungsnummer in Ihrer Apotheke
vor."* There is no way to do that well: the number sits in 14px grey text at the bottom of a
collapsed panel. We instruct an action we have not designed for.

### B3 — Alert and quiet state are structurally identical
Both are a white card with a border; only a small pill differs. The alert should be recognisable
before a single word is read. Currently the page reads as a uniform list regardless of whether
anything is wrong. This weakens the alert *and* it wastes the credibility the quiet state earns.

### B4 — Critical alert content is behind a disclosure
The manufacturer's note — the most valuable thing in the product — requires finding and pressing
"Details anzeigen". For a high-confidence alert this should be open by default.

### B5 — First run explains nothing
The empty state offers a heading, a sentence, and a button. It never says where the data comes
from, why the app is trustworthy, or what an alert will look like. A worried, low-confidence user
has no reason to invest the effort of typing in their medication.

### C1 — Language switch competes with the product name
Two buttons sit at the same optical weight as the `h1`, in the highest-value corner of the screen,
for a control most users will use once or never.

### C2 — No print / offline-capable view
Pharmacy basements have no signal. See B2.

### C3 — Typography is a single system stack
Acceptable, but the brief asks for the world of Beipackzettel and pharmacy packaging, and we have
not really made a typographic argument yet.

---

## 4. Proposed workstreams

Ordered by value per unit of effort. **W1 and W2 are the ones I would actually defend as urgent;**
the rest is real but discretionary.

### W1 — Accessibility remediation *(fixes A1–A5)*
Not a redesign. Correctness work against our own stated standard.
- Root font size to a scalable unit; verify layouts to 200% zoom.
- Functional borders to ≥3:1.
- All interactive elements to ≥44px.
- `prefers-contrast: more` and a dark theme.
- Visible, announced form errors with an `aria-live` region.
- Full keyboard pass and a screen-reader pass in German **and** English (`lang` switching is
  already implemented and should be verified, not assumed).

**Why first:** we wrote "accessibility is the brief, not a checkbox" and are currently failing two
measurable criteria. Everything else is decoration until this is true.

### W2 — Medication entry that cannot silently fail *(fixes B1)*
The highest-value functional UX change in the product.
- **Typeahead suggestions** as the user types, matched through `canonicalWirkstoff` so
  `pantoprazol` surfaces `Pantoprazol-Natrium-Sesquihydrat`.
- **Never restrict input to the suggestion list.** Most users' medications are *not* in shortage —
  that is the good case — so an autocomplete sourced only from the shortage feed must offer, never
  gate. Getting this wrong would make the app unusable for the majority.
- **Explicit "no match" confirmation.** When free text matches nothing, say plainly that we found no
  reported shortage *and* that we could not confirm the spelling, and offer the closest names. Never
  let "we don't recognise this" render as "you are fine".
- **PZN as the promoted path.** It is on every pack and every Rezept, and it is the only route to a
  genuinely high-confidence match. Format as `1234 5678` while typing, validate the checksum
  (PZN-8 has one — a wrong digit can be caught immediately), and explain in one line what it buys.
- **Barcode/Data Matrix scan** via the device camera. Every German pack carries one. This turns the
  hardest input in the app into pointing a phone at a box — the single biggest possible upgrade to
  match quality. Needs a spike: camera permission UX for this audience is delicate, and it must
  degrade gracefully to typing.

**Open question for review:** is there a licensable or open German drug-name list (product names +
PZN) we can ship for suggestions, so autocomplete is not limited to drugs currently in shortage?
This is a data-sourcing question with legal and cost dimensions and I do not know the answer.

### W3 — Make the alert structurally different from the quiet state *(fixes B3, B4)*
Without adding alarm.
- Alert: full-width, a heavier left rule, and the **manufacturer's note and dates open by default**.
- Quiet: lighter, more compact, collapsed, visually recessive.
- Clear: near-silent — a line, not a card.
- The difference should be legible in a squint test with the text unreadable.

The constraint that makes this interesting: it must read as *more information*, not *more danger*.
Weight, space, and order — not colour temperature.

### W4 — "Show this at the pharmacy" view *(fixes B2, C2)*
A dedicated, deliberately plain screen: product name, Bearbeitungsnummer, report date,
Zulassungsinhaber, and the manufacturer's note — large type, maximum contrast, no navigation, works
offline, prints to one page.

This is the feature that turns Vorrat from something a patient reads into something a patient and a
pharmacist read *together*. It is cheap, nobody else does it, and our own copy already promises it.
I would rank it above W5 and W6 on originality alone.

### W5 — First-run and onboarding *(fixes B5)*
- One screen before the empty state: what this does, where the data comes from (BfArM, named), what
  it will never do (recommend a medication change), and where the list is stored.
- A worked example of a real alert, so the user knows what they are signing up to receive.
- Then a single field.

### W6 — Visual system *(fixes C1, C3)*
Only after W1–W3, because it is the most reversible.
- A typographic argument grounded in Beipackzettel and pharmacy packaging: a humanist sans with real
  numeral clarity, generous leading, and a clear tabular treatment for dates, PZNs, and
  Bearbeitungsnummern — data our users will read aloud to a pharmacist.
- Move the language switch out of the primary corner.
- Consider the German officialdom cue — form-like ruled rows, restrained ink, disciplined
  alignment — while staying well clear of the SaaS-dashboard and medical-red-cross defaults the
  brief rules out.

---

## 5. Explicit non-goals

Named so a "modernisation" brief cannot quietly smuggle them in.

- No dashboard, charts, statistics, or trend graphs. Nobody needs a supply-shortage analytics view.
- No streaks, badges, or engagement mechanics. Engagement is not the goal; the ideal user opens
  this app rarely.
- No countdown timers, no red, no pulsing, no "urgent" language.
- No chatbot or AI assistant surface. The one legitimate LLM use in `brief.md` is translating
  bureaucratic German into plain German, and even that is not a chat affordance.
- No carousel, parallax, or scroll-driven animation.
- No account, no cloud sync, no social sharing.
- No onboarding that gates the app behind more than one screen.

---

## 6. Sequencing

| Phase | Contents | Rationale |
|---|---|---|
| 1 | W1 | We are failing our own stated standard on two measurable criteria |
| 2 | W2 (typeahead + PZN formatting + no-match copy) | Removes the silent false negative |
| 3 | W3, W4 | Makes the alert land and makes it usable at a counter |
| 4 | W2 (barcode spike), W5 | Higher effort, needs prototyping |
| 5 | W6 | Most reversible, benefits from everything above being settled |

---

## 7. Questions I want a second opinion on

Flagged specifically for Gemini review — these are judgement calls, not oversights.

1. **Is W4 ("show at the pharmacy") worth its place above onboarding?** I believe it is the most
   original idea here and it is already promised by our copy. It is also the least conventional item
   on the list, so it deserves a challenge.
2. **Should a high-confidence alert open its details by default?** It puts a manufacturer's clinical
   note in front of a frightened person without a deliberate click. The alternative buries the most
   useful content in the product. I lean open-by-default; I am not certain.
3. **Where is the honest line on autocomplete?** Suggesting only drugs currently in shortage risks
   implying the list is exhaustive. Suggesting from a general drug list requires a data source we do
   not have. Is there a third option?
4. **Does dark mode help or hurt this audience?** Some evidence says light-on-dark reduces
   legibility for older eyes and for astigmatism, which would make it a preference to respect rather
   than a mode to promote.
5. **German typography specifics** — compound words in this domain are long
   (`Lieferengpassmeldung`, `Zulassungsinhaber`, `Pharmazentralnummer`) and hyphenation, wrapping,
   and measure need a native reader's eye at 200% zoom on a 360px phone. This is exactly where I am
   least reliable.
6. **Is anything in §5 wrong?** A non-goals list written by the person who built the thing is worth
   challenging.
