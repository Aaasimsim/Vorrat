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
import { IntroExample } from './components/IntroExample.jsx'

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
              <>
                {/* Shown only to someone who has not added anything yet, and
                    dropped once the form is open: by then the explaining is
                    done and the user is doing the one thing it asked for.
                    Nobody who already keeps a list needs to read this again. */}
                {!showForm && (
                  <>
                    {/* Two paragraphs, not three: the tagline already puts the
                        reader at the pharmacy counter, so a scene-setting
                        opener would only paint that picture twice. What is left
                        is why a warning is possible, then what Vorrat does. */}
                    <section className="space-y-4 text-lg leading-relaxed text-tinte">
                      <p>{t.einstieg.mechanismus}</p>
                      <p>{t.einstieg.vorrat}</p>
                    </section>
                    <IntroExample />
                  </>
                )}

                <section className="mt-8 rounded-lg border border-linie bg-flaeche p-6 text-center">
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
                  {/* Sits at the ask rather than in the header: it answers a
                      question the reader only has once they are deciding
                      whether to type a medication in. */}
                  <p className="mx-auto mt-5 max-w-md text-base text-tinte-weich">
                    {t.datenschutz.kurz}
                  </p>
                </section>
              </>
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
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-linie-zart pt-4 text-xs text-tinte-leise">
          <span>
            {t.app.madeByPrefix}
            <a
              href="mailto:asimsyed.de@gmail.com"
              className="underline underline-offset-4 hover:text-tinte transition-colors"
            >
              {t.app.authorName}
            </a>
          </span>
          <a
            href="https://www.linkedin.com/in/asimhsyed/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-sm border border-linie px-3 py-1.5 text-xs font-normal text-tinte-weich hover:text-tinte hover:bg-papier-tief transition-colors"
          >
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
            </svg>
            <span>LinkedIn</span>
          </a>
        </div>
      </footer>
    </div>
  )
}
