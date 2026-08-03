import { useCopy } from '../lib/language.jsx'
import { RESOLVED } from '../lib/resolution.js'
import { formatGermanDate } from '../lib/format.js'

/**
 * The only good news this app has to give, and the honest version of "we cannot
 * tell" beside it.
 *
 * Deliberately not styled as a success banner. Someone reading this was worried
 * enough about a medication to add it, and a burst of green congratulation
 * would be the same urgency theatre in the opposite direction. It is the same
 * calm card as everything else, marked by a rule and a word.
 *
 * Dismissible, because unlike a shortage this is news rather than a standing
 * state — once read, it has done its job.
 */
export function ResolutionNote({ resolution, onDismiss }) {
  const t = useCopy()
  const beendet = resolution.status === RESOLVED

  const datum = beendet ? formatGermanDate(resolution.beendetAm) : null
  const body = beendet
    ? datum
      ? t.entwarnung.beendetFn({ datum })
      : t.entwarnung.beendetOhneDatum
    : t.entwarnung.unklarBody

  return (
    <section
      className={`mt-4 rounded-lg border border-linie bg-papier-tief p-5 ${
        beendet ? 'border-l-4 border-l-ruhig' : ''
      }`}
      role="status"
    >
      <h4 className="text-lg font-semibold text-tinte">
        {beendet ? t.entwarnung.beendetLabel : t.entwarnung.unklarLabel}
      </h4>
      <p className="mt-2 text-base text-tinte">{body}</p>
      <p className="mt-2 text-base text-tinte-weich">
        {beendet ? t.entwarnung.beendetHinweis : t.entwarnung.unklarHinweis}
      </p>

      {/* The report number stays attached even in good news: every statement in
          this app traces to a BfArM record, and "it is over" is a statement. */}
      <ul className="mt-3 space-y-1 text-sm text-tinte-weich">
        {resolution.reports.map((report) => (
          <li key={report.bearbeitungsnummer}>
            {t.entwarnung.quelleFn({ bearbeitungsnummer: report.bearbeitungsnummer })}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onDismiss}
        className="mt-4 min-h-12 rounded-md border border-linie px-4 py-2 text-base font-semibold text-tinte hover:bg-flaeche"
      >
        {t.entwarnung.schliessen}
      </button>
    </section>
  )
}
