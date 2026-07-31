import { canonicalWirkstoff } from './wirkstoffNames.js'

/**
 * "Most/all manufacturers of this Wirkstoff are in shortage" requires knowing
 * how many manufacturers exist in total — data this feed does not provide
 * (it only lists who is *currently* short). We approximate a denominator by
 * accumulating every Zulassungsinhaber ever observed making a given
 * Wirkstoff + Darreichungsform combination, across repeated pipeline runs.
 *
 * This under-counts manufacturers who have never appeared in a shortage
 * report, and it starts empty. It gets more honest the longer the pipeline
 * runs — it is not, and cannot be, a real market registry. Callers must
 * surface `knownManufacturers` as a floor, not a fact, per brief.md §3.
 */

/**
 * Keyed on the canonical ingredient, not the raw feed string — otherwise
 * Metoprololsuccinat and Metoprololtartrat count as two separate markets and
 * each looks fully depleted when only one manufacturer reports a shortage.
 */
function baselineKey(wirkstoffe, darreichungsform) {
  const wirkstoffKey = [...wirkstoffe]
    .map((w) => canonicalWirkstoff(w))
    .filter(Boolean)
    .sort()
    .join('+')
  return `${wirkstoffKey}::${(darreichungsform ?? '').toLowerCase()}`
}

export function emptyBaseline() {
  return { updatedAt: null, entries: {} }
}

/** Merge today's records into an existing baseline. Pure — returns a new object. */
export function mergeBaseline(baseline, records) {
  const entries = { ...baseline.entries }

  for (const record of records) {
    if (record.wirkstoffe.length === 0 || !record.zulassungsinhaber) continue
    const key = baselineKey(record.wirkstoffe, record.darreichungsform)
    const known = new Set(entries[key] ?? [])
    known.add(record.zulassungsinhaber)
    entries[key] = [...known]
  }

  return { updatedAt: new Date().toISOString(), entries }
}

/** Distinct manufacturers ever seen for this Wirkstoff+Darreichungsform — a lower bound on the true total. */
export function knownManufacturerCount(baseline, wirkstoffe, darreichungsform) {
  const key = baselineKey(wirkstoffe, darreichungsform)
  return baseline.entries[key]?.length ?? 0
}
