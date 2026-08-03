import { useId, useState } from 'react'
import { useCopy } from '../lib/language.jsx'
import { StatusBadge } from './StatusBadge.jsx'

/**
 * Shows the output before asking for the input.
 *
 * A first-time user is asked to type in their medication before they have seen
 * what they get back, and what they get back most of the time is the quiet
 * state. Told in prose, "nothing reported" reads as the app failing to answer.
 * Shown as a card, it reads as an answer, which is what makes the rare loud
 * card credible (CLAUDE.md, Matching and confidence).
 *
 * Collapsed by default, and a disclosure rather than a dialog: the opening
 * screen has to stay short enough to read, but an example is reference material
 * someone reads *beside* the thing it explains. A dialog would cover the page,
 * trap focus, and demand to be dismissed before the user could act on it. The
 * one dialog in this app is the pharmacy handoff, which earns it by needing the
 * whole screen at a counter.
 *
 * Both examples are real records from the feed, verified against the snapshot in
 * data/snapshots/2026-08-03.csv, and carry their real Bearbeitungsnummer and
 * Datum der letzten Meldung. Nothing here is invented: a fabricated report
 * number in a health product would be a fabricated clinical record, however
 * clearly it were labelled.
 *
 * Frozen deliberately rather than pulled from the live feed. These two cards
 * teach the two states, and they should not change shape or disappear because
 * a report expired overnight.
 */
const BEISPIELE = [
  {
    // Low confidence: Micro Labs has filed, five other pantoprazole makers in
    // the same snapshot have not. One manufacturer of many is exactly the case
    // that must not raise an alarm.
    name: 'Pantoprazol 40 mg',
    status: 'watching',
    confidence: 'low',
    bearbeitungsnummer: 'LE2026002791',
    meldedatum: '27.07.2026',
  },
  {
    // High confidence: an exact product match, classified verskri by BfArM.
    name: 'L-Thyroxin Henning 150',
    status: 'affected',
    confidence: 'elevated',
    bearbeitungsnummer: 'LE2026002754',
    meldedatum: '23.07.2026',
  },
]

export function IntroExample() {
  const t = useCopy()
  const [offen, setOffen] = useState(false)
  const panelId = useId()

  return (
    <section className="mt-6">
      <button
        type="button"
        onClick={() => setOffen((open) => !open)}
        aria-expanded={offen}
        aria-controls={panelId}
        className="min-h-12 w-full max-w-full rounded-md border border-linie bg-flaeche px-4 py-2 text-left text-base font-semibold text-tinte hover:bg-papier-tief"
      >
        {offen ? t.einstieg.beispielSchliessen : t.einstieg.beispielOeffnen}
      </button>

      {!offen ? null : (
        <div id={panelId} className="mt-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-md border border-linie px-2 py-0.5 text-sm font-semibold text-tinte-weich">
              {t.einstieg.beispielLabel}
            </span>
            <p className="min-w-0 text-base text-tinte-weich">{t.einstieg.beispielHinweis}</p>
          </div>

          {/* Not a <ul> of MedicationCards: these carry no mute, remove or
              expand control, and a keyboard user should not tab into a
              demonstration. */}
          <div className="mt-4 space-y-4">
            {BEISPIELE.map((beispiel) => (
              <div
                key={beispiel.bearbeitungsnummer}
                className={`rounded-lg border bg-flaeche p-5 sm:p-6 ${
                  beispiel.status === 'affected'
                    ? 'border-linie border-l-4 border-l-betroffen'
                    : 'border-linie'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  {/* The product name is a German BfArM value and stays German
                      in both languages, like every other record field. */}
                  <h3 lang="de" className="min-w-0 bricht-um text-xl font-semibold text-tinte">
                    {beispiel.name}
                  </h3>
                  <StatusBadge status={beispiel.status} statusKey={beispiel.status} />
                </div>

                <p className="mt-4 text-base text-tinte">{t.status[beispiel.status].body}</p>
                <p className="mt-2 text-base text-tinte-weich">
                  {t.confidence[beispiel.confidence]}
                </p>
                <p className="mt-4 border-t border-linie-zart pt-4 text-sm text-tinte-weich">
                  {t.alert.quelleFn({
                    bearbeitungsnummer: beispiel.bearbeitungsnummer,
                    datum: beispiel.meldedatum,
                  })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
