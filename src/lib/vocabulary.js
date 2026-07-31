import { canonicalWirkstoff } from './wirkstoffNames.js'

/**
 * The names we can recognise, drawn from the shortage feed.
 *
 * The hard limit worth stating plainly: this feed lists only medications that
 * are *currently reported in shortage*. So a drug that is perfectly available
 * and a drug whose name we misread look identical to us — both are simply
 * absent. We can therefore confirm "we know this name", but never "this name
 * is a real medication". The UI has to be honest about that gap rather than
 * render silence as reassurance (brief.md §8).
 *
 * Ended shortages are included: their names are still names we know.
 */
export function buildVocabulary(index) {
  const wirkstoffe = new Map()
  const produkte = new Map()

  for (const record of index.records ?? []) {
    for (const name of record.wirkstoffe ?? []) {
      const key = canonicalWirkstoff(name)
      if (key && !wirkstoffe.has(key)) wirkstoffe.set(key, name)
    }
    if (record.produkt) {
      const key = record.produkt.trim().toLowerCase()
      if (!produkte.has(key)) produkte.set(key, record.produkt)
    }
  }

  return { wirkstoffe, produkte }
}

/** Did the user's text resolve to a name this feed uses? */
export function isKnownName(query, vocabulary) {
  const trimmed = (query ?? '').trim()
  if (!trimmed || !vocabulary) return false
  if (vocabulary.produkte.has(trimmed.toLowerCase())) return true
  const canonical = canonicalWirkstoff(trimmed)
  return Boolean(canonical) && vocabulary.wirkstoffe.has(canonical)
}

/** Bounded Levenshtein — returns Infinity as soon as it exceeds `max`. */
function editDistance(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return Infinity
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i]
    let rowMin = i
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost)
      if (current[j] < rowMin) rowMin = current[j]
    }
    if (rowMin > max) return Infinity
    previous = current
  }
  return previous[b.length]
}

/**
 * Names to offer the user, ranked: prefix matches first (they are typing),
 * then substring, then near-misses by edit distance so a typo still surfaces
 * the right drug.
 */
export function suggestNames(query, vocabulary, limit = 6) {
  const trimmed = (query ?? '').trim().toLowerCase()
  if (trimmed.length < 3 || !vocabulary) return []

  const candidates = [...vocabulary.wirkstoffe.values(), ...vocabulary.produkte.values()]
  const tolerance = trimmed.length <= 6 ? 1 : 2
  const scored = []

  for (const name of candidates) {
    const lower = name.toLowerCase()
    if (lower === trimmed) continue

    let rank
    if (lower.startsWith(trimmed)) rank = 0
    else if (lower.includes(trimmed)) rank = 1
    else {
      const distance = editDistance(trimmed, canonicalWirkstoff(name) || lower, tolerance)
      if (distance === Infinity) continue
      rank = 2 + distance
    }
    scored.push({ name, rank, length: name.length })
  }

  scored.sort((a, b) => a.rank - b.rank || a.length - b.length || a.name.localeCompare(b.name, 'de'))
  return scored.slice(0, limit).map((entry) => entry.name)
}
