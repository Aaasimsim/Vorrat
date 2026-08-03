/**
 * The medication list is Art. 9 GDPR special-category data. It is written to
 * this browser's localStorage and read back here — it is never sent anywhere,
 * there is no account, and no network call in this app carries it. Matching
 * happens on-device against the public shortage list. See brief.md §5.
 */

const MEDICATIONS_KEY = 'vorrat.medications.v1'
const MUTES_KEY = 'vorrat.mutes.v1'
const FEED_CACHE_KEY = 'vorrat.feed.v1'
const ALERTS_KEY = 'vorrat.alerts.v1'

/**
 * Private-mode Safari and blocked-storage settings make localStorage throw on
 * access rather than return null. Storage failure must never take down a health
 * app, so every path here degrades to in-memory behaviour instead.
 */
function readJson(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function loadMedications() {
  const stored = readJson(MEDICATIONS_KEY, [])
  if (!Array.isArray(stored)) return []
  return stored.filter((m) => m && typeof m.id === 'string')
}

export function saveMedications(medications) {
  return writeJson(MEDICATIONS_KEY, medications)
}

export function createMedication({
  query,
  pzn,
  packungsgroesse,
  dosisProTag,
  letzteAbholung,
}) {
  return {
    id: crypto.randomUUID(),
    query: (query ?? '').trim(),
    pzn: (pzn ?? '').replace(/\s/g, '') || null,
    // All three are optional. Absent means we simply do not show a run-out
    // estimate for this medication; it must never block adding one.
    packungsgroesse: packungsgroesse ?? null,
    dosisProTag: dosisProTag ?? null,
    letzteAbholung: letzteAbholung || null,
    addedAt: new Date().toISOString(),
  }
}

/**
 * Mutes are the primary negative signal — muting means the confidence model
 * fired when it should not have (CLAUDE.md, Matching and confidence). Stored
 * per Bearbeitungsnummer so a mute applies to one report, not to the whole
 * medication.
 */
export function loadMutes() {
  const stored = readJson(MUTES_KEY, [])
  return new Set(Array.isArray(stored) ? stored : [])
}

export function saveMutes(mutes) {
  return writeJson(MUTES_KEY, [...mutes])
}

/**
 * What we last told the user about each medication, so we can tell them when it
 * changes. Without this the app can only ever describe the present, and a
 * shortage ending looks exactly like a shortage that was never there.
 *
 * Keyed by medication id, holding the Bearbeitungsnummern the alert was based
 * on. Report numbers are public BfArM identifiers, but they sit beside a
 * medication id here, so this is as sensitive as the medication list itself and
 * stays in the same place: on the device, never transmitted.
 */
export function loadAlertHistory() {
  const stored = readJson(ALERTS_KEY, {})
  return stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {}
}

export function saveAlertHistory(alerts) {
  return writeJson(ALERTS_KEY, alerts)
}

/**
 * Identifies one particular alert by the reports behind it. A dismissal is
 * stored against this rather than against the medication, so dismissing "the
 * shortage is over" today does not silence a different shortage next year.
 */
export function alertSignature(bearbeitungsnummern) {
  return [...bearbeitungsnummern].sort().join('|')
}

/**
 * The public shortage list is cached so the app still shows something useful
 * when BfArM or the network is unavailable. This is public data only — no
 * medication information is in this cache.
 */
export function loadCachedFeed() {
  return readJson(FEED_CACHE_KEY, null)
}

export function saveCachedFeed(feed) {
  return writeJson(FEED_CACHE_KEY, { ...feed, cachedAt: new Date().toISOString() })
}
