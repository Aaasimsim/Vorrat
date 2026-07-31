const PLACEHOLDER_PZNS = new Set(['99999999', '00000000'])

/** Field is blank or the feed's literal "N/A" — both mean "not reported". */
export function naOrNull(value) {
  if (value == null) return null
  const trimmed = String(value).trim()
  if (trimmed === '' || trimmed === 'N/A') return null
  return trimmed
}

export function isPlaceholderPzn(pzn) {
  if (pzn == null) return true
  const trimmed = String(pzn).trim()
  return trimmed === '' || PLACEHOLDER_PZNS.has(trimmed)
}

/** "Ezetimib; Simvastatin" -> ["Ezetimib", "Simvastatin"]. Papaparse has already stripped the outer quotes. */
export function splitList(value) {
  const cleaned = naOrNull(value)
  if (!cleaned) return []
  return cleaned
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
}

/** DD.MM.YYYY -> "YYYY-MM-DD". Returns null for missing/unparsable dates rather than throwing. */
export function parseGermanDate(value) {
  const cleaned = naOrNull(value)
  if (!cleaned) return null
  const match = cleaned.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (!match) return null
  const [, day, month, year] = match
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

export function isJa(value) {
  return naOrNull(value)?.toLowerCase() === 'ja'
}

/**
 * Live values seen in the feed: "versrel", "verskri (auch versrel)",
 * "weder versrel noch verskri" — not the bare enum the brief describes, so
 * this checks substrings rather than equality.
 */
export function classifyKlassifikation(value) {
  const cleaned = naOrNull(value) ?? ''
  const lower = cleaned.toLowerCase()
  if (lower.includes('verskri')) return 'verskri'
  if (lower.includes('versrel')) return 'versrel'
  return 'weder'
}
