import { useEffect, useMemo, useState } from 'react'
import { useCopy } from './lib/language.jsx'
import { LanguageSwitch } from './components/LanguageSwitch.jsx'
import { useShortageFeed } from './lib/useShortageFeed.js'
import {
  loadMedications,
  saveMedications,
  createMedication,
  loadMutes,
  saveMutes,
} from './lib/storage.js'
import { matchAllMedications } from './lib/matching.js'
import { buildVocabulary } from './lib/vocabulary.js'
import { formatGermanDateTime } from './lib/format.js'
import { MedicationCard } from './components/MedicationCard.jsx'
import { AddMedicationForm } from './components/AddMedicationForm.jsx'

// Order matters: an affected medication should be the first thing on screen.
const STATUS_ORDER = { affected: 0, watching: 1, clear: 2 }

export default function App() {
  const t = useCopy()
  const [medications, setMedications] = useState(() => loadMedications())
  const [mutes, setMutes] = useState(() => loadMutes())
  const [showForm, setShowForm] = useState(false)
  const { status: feedStatus, feed, stale } = useShortageFeed()

  useEffect(() => {
    saveMedications(medications)
  }, [medications])

  useEffect(() => {
    saveMutes(mutes)
  }, [mutes])

  const vocabulary = useMemo(() => (feed ? buildVocabulary(feed) : null), [feed])

  // Matching runs here, in the browser, against the on-device list. Nothing in
  // this computation crosses the network (brief.md §6).
  const matched = useMemo(() => {
    if (!feed) return []
    const results = matchAllMedications(medications, feed, feed.baseline).map(
      ({ medication, result }) => {
        // A medication whose every report has been muted sorts down out of the
        // highlighted band. It is flagged rather than restated as 'watching':
        // the match is still an exact one and BfArM may still call it
        // supply-critical, and the watching copy asserts the opposite of both.
        // Muting suppresses emphasis, never the facts.
        const muted =
          result.matches.length > 0 &&
          result.matches.every((record) => mutes.has(record.bearbeitungsnummer))
        return { medication, result: { ...result, muted } }
      },
    )
    return [...results].sort(
      (a, b) =>
        Number(a.result.muted) - Number(b.result.muted) ||
        STATUS_ORDER[a.result.status] - STATUS_ORDER[b.result.status],
    )
  }, [medications, feed, mutes])

  function handleAdd(input) {
    setMedications((current) => [...current, createMedication(input)])
    setShowForm(false)
  }

  function handleRemove(id) {
    setMedications((current) => current.filter((medication) => medication.id !== id))
  }

  /**
   * A mute is the clearest signal the confidence model fired when it should
   * not have (CLAUDE.md). It suppresses the highlight only — the report stays
   * readable, because hiding a shortage a patient might need is not ours to do.
   */
  function handleToggleMute(bearbeitungsnummer) {
    setMutes((current) => {
      const next = new Set(current)
      if (next.has(bearbeitungsnummer)) next.delete(bearbeitungsnummer)
      else next.add(bearbeitungsnummer)
      return next
    })
  }

  const stand = formatGermanDateTime(feed?.generatedAt)

  return (
    <div className="mx-auto flex min-h-svh max-w-2xl flex-col px-4 py-8 sm:px-6">
      <header>
        {/* Wraps rather than overflows once the user's own text size is large —
            at a 32px browser default the two controls no longer fit beside the
            title on a 360px phone. */}
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
          <h1 className="text-3xl font-bold tracking-tight text-tinte sm:text-4xl">{t.app.name}</h1>
          <LanguageSwitch />
        </div>
        <p className="mt-2 text-lg text-tinte">{t.app.tagline}</p>
        <p className="mt-4 text-base text-tinte-weich">{t.datenschutz.kurz}</p>
      </header>

      <main className="mt-8 flex-1">
        {feedStatus === 'loading' && (
          <p className="text-base text-tinte-weich" role="status">
            {t.laden}
          </p>
        )}

        {feedStatus === 'error' && (
          <p className="rounded-lg border border-linie bg-flaeche p-5 text-base text-tinte" role="status">
            {t.fehler.laden}
          </p>
        )}

        {feedStatus === 'ready' && (
          <>
            {stale && stand && (
              <p className="mb-5 rounded-lg border border-linie bg-papier-tief p-4 text-base text-tinte-weich" role="status">
                {t.fehler.veraltetFn({ datum: stand })}
              </p>
            )}

            {medications.length === 0 ? (
              <section className="rounded-lg border border-linie bg-flaeche p-6 text-center">
                <h2 className="text-xl font-semibold text-tinte">{t.leer.title}</h2>
                <p className="mx-auto mt-3 max-w-md text-base text-tinte">{t.leer.body}</p>
                {!showForm && (
                  <button
                    type="button"
                    onClick={() => setShowForm(true)}
                    className="mt-5 min-h-12 rounded-md bg-aktion px-5 py-2 text-base font-semibold text-aktion-text hover:opacity-90"
                  >
                    {t.leer.cta}
                  </button>
                )}
              </section>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-tinte">{t.nav.meineMedikamente}</h2>
                <ul className="mt-4 space-y-4">
                  {matched.map(({ medication, result }) => (
                    <MedicationCard
                      key={medication.id}
                      medication={medication}
                      result={result}
                      mutes={mutes}
                      onToggleMute={handleToggleMute}
                      onRemove={handleRemove}
                    />
                  ))}
                </ul>
              </>
            )}

            {showForm ? (
              <div className="mt-6">
                <AddMedicationForm onAdd={handleAdd} onCancel={() => setShowForm(false)} vocabulary={vocabulary} />
              </div>
            ) : (
              medications.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="mt-6 min-h-12 w-full rounded-md border border-linie bg-flaeche px-5 py-2 text-base font-semibold text-tinte hover:bg-papier-tief"
                >
                  {t.nav.hinzufuegen}
                </button>
              )
            )}
          </>
        )}
      </main>

      <footer className="mt-10 border-t border-linie-zart pt-6 text-sm text-tinte-weich">
        <h2 className="text-base font-semibold text-tinte">{t.datenschutz.title}</h2>
        <p className="mt-2">{t.datenschutz.lang}</p>
        <p className="mt-4">{t.app.dataSource}</p>
        {stand && <p className="mt-2">{t.aktualisiert.standFn({ datum: stand })}</p>}
      </footer>
    </div>
  )
}
