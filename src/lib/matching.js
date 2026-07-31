import { isActiveShortage, todayIso } from './dates.js'
import { knownManufacturerCount } from './baseline.js'
import { wirkstoffMatches } from './wirkstoffNames.js'
import { isKnownName, buildVocabulary } from './vocabulary.js'
import { isValidPzn } from './pzn.js'

/**
 * On the "most/all manufacturers are in shortage" tier from brief.md §3.
 *
 * It is not implemented as an alert trigger, deliberately. Computing it needs
 * a denominator — how many manufacturers supply this ingredient in total —
 * and this feed cannot provide one: it lists only manufacturers who are
 * *currently reporting a shortage*. Measured against a live snapshot, 223 of
 * 266 ingredient markets resolve to exactly one known manufacturer, so the
 * ratio is ~always 100% and pantoprazole (a dozen real manufacturers, three
 * reporting) reads as a total market failure. That is precisely the false
 * alarm brief.md §3 says is worse than shipping nothing.
 *
 * So the market signal is surfaced as context, never as a trigger, and the
 * alert tiers lean on `klassifikation` instead — BfArM's own supply
 * assessment, made with data we do not have. That also satisfies the
 * "surface, don't infer" rule in CLAUDE.md: klassifikation is a record, our
 * market share would only ever be a guess.
 *
 * Fixing this properly needs a real registry of authorised products per
 * ingredient, which is a separate data source and a separate piece of work.
 */

function normalize(value) {
  return (value ?? '').trim().toLowerCase()
}

/**
 * A medication the user tracks: { id, query, pzn }.
 * `query` is whatever they typed — product name or active ingredient.
 * `pzn` is optional, printed on the pack, enables the precise match.
 */
export function matchMedication(medication, index, baseline, options = {}) {
  const { today = todayIso(), vocabulary = buildVocabulary(index) } = options
  const activeRecords = index.records.filter((r) => isActiveShortage(r, today))
  const query = normalize(medication.query)
  const pzn = medication.pzn?.trim() || null

  const pznHits = pzn ? activeRecords.filter((r) => r.pzns.includes(pzn)) : []
  if (pznHits.length > 0) {
    return { status: 'affected', confidence: 'high', reason: 'pzn', matches: pznHits }
  }

  const productHits = activeRecords.filter((r) => normalize(r.produkt) === query && query)
  if (productHits.length > 0) {
    return { status: 'affected', confidence: 'high', reason: 'produkt', matches: productHits }
  }

  // Compared through wirkstoffNames rather than by string equality: the feed
  // stores pharmacopoeial salt forms, so a patient typing "Pantoprazol" would
  // otherwise miss "Pantoprazol-Natrium-Sesquihydrat" and be told they are
  // clear while their medication is in fact in shortage.
  const wirkstoffHits = query
    ? activeRecords.filter((r) => r.wirkstoffe.some((w) => wirkstoffMatches(query, w)))
    : []
  if (wirkstoffHits.length === 0) {
    // `erkannt` separates "we know this name and there is no shortage" from
    // "we could not place this text at all". Both find nothing, and only the
    // first is reassurance — reporting the second as "clear" is the silent
    // false negative brief.md §8 names first.
    return {
      status: 'clear',
      confidence: null,
      reason: null,
      matches: [],
      erkannt: isKnownName(medication.query, vocabulary) || Boolean(pzn && isValidPzn(pzn)),
    }
  }

  // Context only — see the note on the market tier above. `known` is a floor
  // (manufacturers we have observed), never a true market size, and the UI
  // must present it that way.
  const affectedManufacturers = new Set(
    wirkstoffHits.map((r) => r.zulassungsinhaber).filter(Boolean),
  )
  const marketContext = {
    affected: affectedManufacturers.size,
    knownAtLeast: knownManufacturerCount(
      baseline,
      wirkstoffHits[0].wirkstoffe,
      wirkstoffHits[0].darreichungsform,
    ),
  }

  const verskriHits = wirkstoffHits.filter((r) => r.klassifikationStufe === 'verskri')
  if (verskriHits.length > 0) {
    return {
      status: 'affected',
      confidence: 'elevated',
      reason: 'verskri',
      matches: verskriHits,
      marketContext,
    }
  }

  return {
    status: 'watching',
    confidence: 'low',
    reason: 'wirkstoff',
    matches: wirkstoffHits,
    marketContext,
  }
}

export function matchAllMedications(medications, index, baseline, today = todayIso()) {
  // Built once for the whole list rather than per medication — it walks every
  // record in the feed.
  const vocabulary = buildVocabulary(index)
  return medications.map((med) => ({
    medication: med,
    result: matchMedication(med, index, baseline, { today, vocabulary }),
  }))
}
