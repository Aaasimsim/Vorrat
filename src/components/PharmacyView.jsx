import { useEffect, useId, useRef } from 'react'
import { useCopy } from '../lib/language.jsx'
import { formatGermanDate } from '../lib/format.js'

/**
 * The record, laid out to be held up at a pharmacy counter: large type, the
 * Bearbeitungsnummer prominent, no navigation to get lost in.
 *
 * It carries the same safety text as the inline report and for the same
 * reason. This screen is the one most likely to be read by a pharmacist over
 * the patient's shoulder, so a named alternative shown here without its
 * disclaimer would look most like Vorrat recommending a substitution — the one
 * thing CLAUDE.md says has no exceptions.
 */
export function PharmacyView({ medication, record, onClose }) {
  const t = useCopy()
  const titleId = useId()
  const dialogRef = useRef(null)
  const closeRef = useRef(null)

  const beginn = formatGermanDate(record.beginn)
  const ende = formatGermanDate(record.ende)
  const meldedatum = formatGermanDate(record.meldedatum)

  // Escape closes, focus moves in and is returned on close, and Tab is kept
  // inside the dialog. Without these a keyboard or screen-reader user can end
  // up navigating the page behind the overlay with no way back.
  useEffect(() => {
    const previouslyFocused = document.activeElement
    closeRef.current?.focus()

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key !== 'Tab') return

      const focusable = dialogRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      // Deferred: React commits the unmount after this cleanup runs, so
      // focusing synchronously here lands on an element that is about to be
      // detached and focus falls back to <body>.
      requestAnimationFrame(() => previouslyFocused?.focus?.())
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs sm:p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border-2 border-linie bg-flaeche p-6 shadow-2xl sm:p-8"
      >
        <div className="flex items-start justify-between gap-4 border-b-2 border-linie pb-4">
          <div className="min-w-0">
            <span className="inline-block rounded bg-aktion px-3 py-1 text-xs font-bold tracking-wide text-aktion-text uppercase">
              BfArM Engpassmeldung
            </span>
            <h2
              id={titleId}
              lang="de"
              className="bricht-um mt-2 text-2xl font-extrabold text-tinte sm:text-3xl"
            >
              {record.produkt ?? medication.query}
            </h2>
            {medication.pzn && (
              <p className="mt-1 font-mono text-lg font-bold text-tinte">PZN: {medication.pzn}</p>
            )}
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="min-h-12 shrink-0 rounded-lg border border-linie bg-papier-tief px-4 py-2 text-base font-bold text-tinte hover:bg-papier"
          >
            {t.apotheke.schliessen}
          </button>
        </div>

        <div className="mt-6 space-y-4 text-tinte">
          <div className="grid grid-cols-1 gap-4 rounded-lg border border-linie-zart bg-papier-tief p-4 sm:grid-cols-2">
            <div>
              <span className="block text-xs font-semibold text-tinte-weich uppercase">
                Bearbeitungsnummer
              </span>
              <span className="font-mono text-xl font-bold text-tinte">
                {record.bearbeitungsnummer}
              </span>
            </div>
            <div>
              <span className="block text-xs font-semibold text-tinte-weich uppercase">
                Meldungsdatum
              </span>
              <span className="text-base font-bold text-tinte">{meldedatum ?? '—'}</span>
            </div>
          </div>

          {record.zulassungsinhaber && (
            <div>
              <span className="block text-xs font-semibold text-tinte-weich uppercase">
                Zulassungsinhaber
              </span>
              <span lang="de" className="text-lg font-semibold text-tinte">
                {record.zulassungsinhaber}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 border-t border-linie-zart pt-4 sm:grid-cols-2">
            <div>
              <span className="block text-xs font-semibold text-tinte-weich uppercase">
                Gemeldeter Beginn
              </span>
              <span className="text-base font-semibold text-tinte">{beginn ?? '—'}</span>
            </div>
            <div>
              <span className="block text-xs font-semibold text-tinte-weich uppercase">
                Voraussichtliches Ende
              </span>
              <span className="text-base font-semibold text-tinte">
                {ende ?? t.alert.endeUnbekannt}
              </span>
            </div>
          </div>

          {record.grund && (
            <div className="border-t border-linie-zart pt-4">
              <span className="block text-xs font-semibold text-tinte-weich uppercase">
                Grund der Meldung
              </span>
              <p lang="de" className="mt-1 text-base font-medium text-tinte">
                {record.grund}
              </p>
            </div>
          )}

          {/* Quoted verbatim and attributed — without the source line this reads
              as Vorrat's own clinical guidance rather than the manufacturer's. */}
          {record.anmerkung && (
            <figure className="mt-4 rounded-r-lg border-l-4 border-linie bg-papier-tief p-4">
              <figcaption className="block text-xs font-bold text-tinte uppercase">
                {t.alert.herstellerHinweisLabel}
              </figcaption>
              <blockquote lang="de" className="mt-1 text-base font-semibold text-tinte">
                „{record.anmerkung}“
              </blockquote>
              <p className="mt-2 text-sm text-tinte-weich">{t.alert.herstellerHinweisQuelle}</p>
            </figure>
          )}

          {record.alternativpraeparat && (
            <div className="mt-4 rounded-r-lg border-l-4 border-linie bg-papier-tief p-4">
              <span className="block text-xs font-bold text-tinte-weich uppercase">
                {t.alert.alternativeLabel}
              </span>
              <p lang="de" className="mt-1 text-base font-semibold text-tinte">
                {record.alternativpraeparat}
              </p>
              <p className="mt-2 text-sm text-tinte-weich">{t.alert.alternativeDisclaimer}</p>
            </div>
          )}
        </div>

        <div className="mt-8 border-t-2 border-linie pt-4 text-sm text-tinte-weich">
          <p>{t.apotheke.hinweis}</p>
        </div>
      </div>
    </div>
  )
}
