import { useId, useState } from 'react'
import { useCopy } from '../lib/language.jsx'
import { StatusBadge } from './StatusBadge.jsx'
import { ShortageReport } from './ShortageReport.jsx'
import { RunOutNote } from './RunOutNote.jsx'
import { PharmacyView } from './PharmacyView.jsx'
import { ResolutionNote } from './ResolutionNote.jsx'

/**
 * The quiet state is the default and gets the same care as the alert: it is
 * what the user sees almost every time they open the app, and it is what makes
 * the rare loud card credible (CLAUDE.md, Matching and confidence).
 *
 * For high-confidence alerts ('affected'), details are expanded by default
 * so verbatim manufacturer notes and BfArM report numbers are immediately visible.
 */
export function MedicationCard({
  medication,
  result,
  resolution,
  onDismissResolution,
  mutes,
  onToggleMute,
  onRemove,
}) {
  const t = useCopy()
  const { status, confidence, matches, muted, erkannt } = result
  const hasReports = matches.length > 0
  const isAffected = status === 'affected' && !muted

  // High-confidence alerts open by default; quiet/watching cards stay collapsed.
  const [expanded, setExpanded] = useState(isAffected)
  const [activePharmacyRecord, setActivePharmacyRecord] = useState(null)
  const detailsId = useId()

  // A clear result we could not tie to a known name is reported as such rather
  // than as confident all-clear — see the note on status.unbekannt in de.js.
  const statusKey = status === 'clear' && erkannt === false ? 'unbekannt' : status

  // The muted note replaces the status sentence rather than sitting next to
  // it: the status copy describes how loudly we would otherwise be speaking,
  // which is exactly what the user just turned off.
  const statusBody = muted ? t.stumm.hinweis : (t.status[statusKey]?.body ?? t.status.clear.body)

  // Compare against the shortage that starts soonest — that is the one that
  // decides whether the patient's supply outlasts the disruption.
  const earliestBeginn = matches
    .map((record) => record.beginn)
    .filter(Boolean)
    .sort()[0]

  return (
    <>
      <li
        className={`rounded-lg border bg-flaeche p-5 sm:p-6 transition-all ${
          isAffected
            ? 'border-linie border-l-4 border-l-betroffen shadow-sm'
            : 'border-linie'
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-xl font-semibold bricht-um text-tinte">{medication.query}</h3>
            {medication.pzn && (
              <p className="mt-1 text-base text-tinte-weich">PZN {medication.pzn}</p>
            )}
          </div>
          <StatusBadge status={status} statusKey={statusKey} muted={muted} />
        </div>

        <p className="mt-4 text-base text-tinte">{statusBody}</p>

        {confidence && (
          <p className="mt-2 text-base text-tinte-weich">{t.confidence[confidence]}</p>
        )}

        {/* Sits directly under the status it explains. Without it the status
            line above simply changed one day and the user had to notice the
            absence themselves. */}
        {resolution && (
          <ResolutionNote resolution={resolution} onDismiss={onDismissResolution} />
        )}

        <RunOutNote medication={medication} earliestBeginn={earliestBeginn} />

        {hasReports && (
          <>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setExpanded((open) => !open)}
                aria-expanded={expanded}
                aria-controls={detailsId}
                className="min-h-12 max-w-full rounded-md border border-linie px-4 py-2 text-base font-semibold text-tinte hover:bg-papier-tief"
              >
                {expanded ? t.details.ausblenden : t.details.anzeigenFn({ anzahl: matches.length })}
              </button>

              {/* Show at Pharmacy Counter Handoff Button */}
              <button
                type="button"
                onClick={() => setActivePharmacyRecord(matches[0])}
                className="min-h-12 rounded-md bg-aktion px-4 py-2 text-base font-bold text-aktion-text hover:opacity-90 transition-opacity"
              >
                📋 {t.apotheke.buttonLabel}
              </button>
            </div>

            {expanded && (
              <div id={detailsId} className="mt-5 space-y-6">
                {matches.map((record) => (
                  <ShortageReport
                    key={record.bearbeitungsnummer}
                    record={record}
                    muted={mutes.has(record.bearbeitungsnummer)}
                    onToggleMute={onToggleMute}
                  />
                ))}

                <section className="border-t border-linie-zart pt-5">
                  <h4 className="text-lg font-semibold text-tinte">{t.naechsteSchritte.title}</h4>
                  <p className="mt-2 text-base">{t.naechsteSchritte.intro}</p>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-base">
                    {t.naechsteSchritte.punkte.map((punkt) => (
                      <li key={punkt}>{punkt}</li>
                    ))}
                  </ul>
                </section>

                {/* Stated at the alert, never buried in a footer (brief.md §5). */}
                <section className="border-t border-linie-zart pt-5">
                  <h4 className="text-lg font-semibold text-tinte">{t.unsicherheit.title}</h4>
                  <p className="mt-2 text-base text-tinte-weich">{t.unsicherheit.body}</p>
                </section>
              </div>
            )}
          </>
        )}

        <div className="mt-5 border-t border-linie-zart pt-4">
          <button
            type="button"
            onClick={() => onRemove(medication.id)}
            className="min-h-12 text-base text-tinte-weich underline underline-offset-4 hover:text-tinte"
          >
            {t.details.entfernenFn({ name: medication.query })}
          </button>
        </div>
      </li>

      {/* Pharmacy Counter Handoff Modal */}
      {activePharmacyRecord && (
        <PharmacyView
          medication={medication}
          record={activePharmacyRecord}
          onClose={() => setActivePharmacyRecord(null)}
        />
      )}
    </>
  )
}
