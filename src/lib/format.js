/**
 * German writes decimals with a comma, and the dose field's own example says
 * "0,5" — so a user following the instruction literally would otherwise get
 * "estimate incomplete". Normalised here at the input boundary rather than in
 * runout.js, which stays a pure numeric function.
 */
export function parseDecimalInput(value) {
  if (typeof value === 'number') return value
  const cleaned = String(value ?? '').trim().replace(',', '.')
  if (cleaned === '') return null
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : null
}

/** "2026-07-13" -> "13.07.2026". Returns null when there is no date to show. */
export function formatGermanDate(iso) {
  if (!iso) return null
  const [year, month, day] = iso.split('-')
  if (!year || !month || !day) return null
  return `${day}.${month}.${year}`
}

export function formatGermanDateTime(iso) {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
