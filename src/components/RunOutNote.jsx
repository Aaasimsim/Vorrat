import { useCopy } from '../lib/language.jsx'
import { estimateRunOut, compareToShortage } from '../lib/runout.js'
import { formatGermanDate } from '../lib/format.js'

/**
 * "Does this shortage start before I run out?" — the question that turns a
 * report into something a patient can act on, and the lead-time measure
 * brief.md §7 calls the one metric that matters.
 *
 * Framed as an estimate throughout. It rests entirely on numbers the user
 * typed and knows nothing about a changed dose or a half-used pack, so it is
 * never stated as fact and never used to grade an alert.
 */
export function RunOutNote({ medication, earliestBeginn }) {
  const t = useCopy()

  const runOut = estimateRunOut({
    packungsgroesse: medication.packungsgroesse,
    dosisProTag: medication.dosisProTag,
    letzteAbholung: medication.letzteAbholung,
  })

  // Nothing entered at all is the normal case, not an error — stay silent
  // rather than nagging someone who skipped an optional field.
  const nothingEntered =
    medication.packungsgroesse == null &&
    medication.dosisProTag == null &&
    !medication.letzteAbholung
  if (nothingEntered) return null

  if (runOut.unsicher || !runOut.reichtBis) {
    return <p className="mt-2 text-base text-tinte-weich">{t.vorrat.unsicher}</p>
  }

  const datum = formatGermanDate(runOut.reichtBis)
  const vergleich = compareToShortage(runOut, earliestBeginn)

  let hauptsatz
  if (runOut.tageVerbleibend < 0) {
    hauptsatz = t.vorrat.aufgebrauchtFn({ datum })
  } else if (vergleich === 'vor_engpass') {
    hauptsatz = t.vorrat.vorEngpassFn({ datum })
  } else if (vergleich === 'nach_engpass') {
    hauptsatz = t.vorrat.nachEngpassFn({ datum })
  } else {
    hauptsatz = t.vorrat.reichtBisFn({ datum })
  }

  return (
    <div className="mt-4 border-t border-linie-zart pt-4">
      <p className="text-base text-tinte">{hauptsatz}</p>
      <p className="mt-2 text-sm text-tinte-weich">{t.vorrat.hinweis}</p>
    </div>
  )
}
