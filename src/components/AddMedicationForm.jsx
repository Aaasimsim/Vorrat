import { useId, useState } from 'react'
import { useCopy } from '../lib/language.jsx'
import { parseDecimalInput } from '../lib/format.js'
import { formatPzn, normalizePzn, isValidPzn } from '../lib/pzn.js'
import { suggestNames } from '../lib/vocabulary.js'

const EMPTY_VORRAT = { packungsgroesse: '', dosisProTag: '', letzteAbholung: '' }

export function AddMedicationForm({ onAdd, onCancel, vocabulary }) {
  const t = useCopy()
  const [query, setQuery] = useState('')
  const [pzn, setPzn] = useState('')
  const [fehler, setFehler] = useState(null)
  // Collapsed by default: the only field that must be filled in to get value
  // from this app is the medication name. Everything else earns its place by
  // being offered, not demanded (brief.md §8 on PZN entry).
  const [showVorrat, setShowVorrat] = useState(false)
  const [vorrat, setVorrat] = useState(EMPTY_VORRAT)
  const nameId = useId()
  const nameHelpId = useId()
  const pznId = useId()
  const pznHelpId = useId()
  const fehlerId = useId()
  const pznWarnId = useId()
  const vorratId = useId()
  const vorratHelpId = useId()

  // Offered, never enforced: the feed only contains medications currently in
  // shortage, so most people's medication is legitimately absent from it. A
  // picker that restricted input to this list would lock out the majority.
  const vorschlaege = suggestNames(query, vocabulary)

  const pznDigits = normalizePzn(pzn)
  // Warn only once a full-length PZN has been typed, so the message does not
  // fire at someone mid-entry.
  const pznWarnung = pznDigits.length === 8 && !isValidPzn(pznDigits)
  const packId = useId()
  const dosisId = useId()
  const abholungId = useId()

  function updateVorrat(field, value) {
    setVorrat((current) => ({ ...current, [field]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) {
      setFehler(t.hinzufuegen.fehlerName)
      return
    }
    setFehler(null)
    onAdd({
      query: trimmed,
      pzn: pznDigits,
      packungsgroesse: parseDecimalInput(vorrat.packungsgroesse),
      dosisProTag: parseDecimalInput(vorrat.dosisProTag),
      letzteAbholung: vorrat.letzteAbholung,
    })
    setQuery('')
    setPzn('')
    setVorrat(EMPTY_VORRAT)
    setShowVorrat(false)
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-linie bg-flaeche p-5 sm:p-6">
      <h2 className="text-xl font-semibold text-tinte">{t.hinzufuegen.title}</h2>

      <div className="mt-5">
        <label htmlFor={nameId} className="block text-base font-semibold text-tinte">
          {t.hinzufuegen.nameLabel}
        </label>
        <p id={nameHelpId} className="mt-1 text-base text-tinte-weich">
          {t.hinzufuegen.nameHilfe}
        </p>
        <input
          id={nameId}
          aria-describedby={fehler ? `${nameHelpId} ${fehlerId}` : nameHelpId}
          aria-invalid={fehler ? true : undefined}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            if (fehler) setFehler(null)
          }}
          autoComplete="off"
          className={`mt-2 min-h-12 w-full rounded-md border bg-papier px-3 py-2 text-lg text-tinte ${
            fehler ? 'border-betroffen border-2' : 'border-linie'
          }`}
        />
        {/* Announced rather than only shown — the browser's own validation
            bubble is neither styled nor reliably read out. */}
        <p id={fehlerId} role="alert" className="mt-2 text-base font-semibold text-betroffen">
          {fehler}
        </p>

        {vorschlaege.length > 0 && (
          <div className="mt-3">
            <p className="text-base font-semibold text-tinte">{t.vorschlaege.titel}</p>
            <p className="mt-1 text-base text-tinte-weich">{t.vorschlaege.hilfe}</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {vorschlaege.map((name) => (
                <li key={name}>
                  <button
                    type="button"
                    lang="de"
                    onClick={() => setQuery(name)}
                    className="min-h-12 max-w-full rounded-md border border-linie bg-papier px-3 py-2 text-left text-base text-tinte hover:bg-papier-tief"
                  >
                    {name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-5">
        <label htmlFor={pznId} className="block text-base font-semibold text-tinte">
          {t.hinzufuegen.pznLabel}
        </label>
        <p id={pznHelpId} className="mt-1 text-base text-tinte-weich">
          {t.hinzufuegen.pznHilfe}
        </p>
        <input
          id={pznId}
          aria-describedby={pznWarnung ? `${pznHelpId} ${pznWarnId}` : pznHelpId}
          value={formatPzn(pzn)}
          onChange={(event) => setPzn(event.target.value)}
          inputMode="numeric"
          autoComplete="off"
          maxLength={9}
          className="mt-2 min-h-12 w-full rounded-md border border-linie bg-papier px-3 py-2 text-lg tracking-wide text-tinte"
        />
        {pznDigits.length === 8 && isValidPzn(pznDigits) && (
          <p className="mt-2 text-base font-semibold text-ruhig">
            ✓ Gültige 8-stellige PZN (Prüfziffer bestätigt)
          </p>
        )}
        {pznWarnung && (
          <p id={pznWarnId} className="mt-2 text-base text-tinte-weich">
            {t.hinzufuegen.warnungPzn}
          </p>
        )}

      </div>

      <div className="mt-5 border-t border-linie-zart pt-5">
        <button
          type="button"
          onClick={() => setShowVorrat((open) => !open)}
          aria-expanded={showVorrat}
          aria-controls={vorratId}
          className="min-h-12 text-base font-semibold text-tinte underline underline-offset-4"
        >
          {showVorrat ? t.vorrat.optionalSchliessen : t.vorrat.optionalOeffnen}
        </button>

        {showVorrat && (
          <div id={vorratId} className="mt-4">
            <p id={vorratHelpId} className="text-base text-tinte-weich">
              {t.vorrat.optionalHilfe}
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor={packId} className="block text-base font-semibold text-tinte">
                  {t.vorrat.packungsgroesseLabel}
                </label>
                <input
                  id={packId}
                  aria-describedby={vorratHelpId}
                  value={vorrat.packungsgroesse}
                  onChange={(event) => updateVorrat('packungsgroesse', event.target.value)}
                  inputMode="numeric"
                  autoComplete="off"
                  className="mt-2 min-h-12 w-full rounded-md border border-linie bg-papier px-3 py-2 text-lg text-tinte"
                />
              </div>

              <div>
                <label htmlFor={dosisId} className="block text-base font-semibold text-tinte">
                  {t.vorrat.dosisLabel}
                </label>
                <input
                  id={dosisId}
                  value={vorrat.dosisProTag}
                  onChange={(event) => updateVorrat('dosisProTag', event.target.value)}
                  inputMode="decimal"
                  autoComplete="off"
                  className="mt-2 min-h-12 w-full rounded-md border border-linie bg-papier px-3 py-2 text-lg text-tinte"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor={abholungId} className="block text-base font-semibold text-tinte">
                  {t.vorrat.letzteAbholungLabel}
                </label>
                <input
                  id={abholungId}
                  type="date"
                  value={vorrat.letzteAbholung}
                  onChange={(event) => updateVorrat('letzteAbholung', event.target.value)}
                  className="mt-2 min-h-12 w-full rounded-md border border-linie bg-papier px-3 py-2 text-lg text-tinte"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="submit"
          className="min-h-12 rounded-md bg-aktion px-5 py-2 text-base font-semibold text-aktion-text hover:opacity-90"
        >
          {t.hinzufuegen.speichern}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="min-h-12 rounded-md border border-linie px-5 py-2 text-base font-semibold text-tinte hover:bg-papier-tief"
          >
            {t.hinzufuegen.abbrechen}
          </button>
        )}
      </div>
    </form>
  )
}
