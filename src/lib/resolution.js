import { isActiveShortage } from './dates.js'

/**
 * Telling someone a shortage is over.
 *
 * Vorrat only ever delivered bad news and then went quiet. A shortage ended,
 * the record stopped matching, and the card silently became "Keine Meldung" —
 * with nothing on screen to say that anything had changed. An absence is also
 * ambiguous in a way an alert is not: "clear" where an alert used to be is
 * indistinguishable from a failed fetch or an entry that stopped matching.
 *
 * The obvious implementation is wrong and dangerous. "The Bearbeitungsnummer
 * is gone from the feed, therefore the shortage is over" reads as an all-clear,
 * but BfArM does not edit reports in place: it withdraws a report and issues a
 * new number, and the successor carries the *extended* end date. Measured
 * across the snapshots in data/snapshots, over three days exactly one of 515
 * reports disappeared, and it disappeared with an end date two months in the
 * future — it had been renumbered, not resolved. Meanwhile 35 of 515 sat in the
 * feed with an end date already in the past. Disappearance is the rare case and
 * usually means the opposite of what it looks like; expiry is the common one.
 *
 * So each remembered report is classified into one of four outcomes, and only
 * one of them is good news. When we cannot tell, we say we cannot tell. A false
 * all-clear to someone rationing tablets is the worst thing this app could do.
 */

export const ONGOING = 'ongoing'
export const RESOLVED = 'resolved'
export const CONTINUED = 'continued'
export const UNKNOWN = 'unknown'

/**
 * Finds the report that supersedes `bearbeitungsnummer`, if one is in the feed.
 *
 * `Referenzierte Erstmeldung` points backwards, from a new report to the one it
 * replaces, so the successor is found by scanning forward for a record that
 * references us. That works against a single day's feed and needs no archive.
 */
export function findSuccessor(bearbeitungsnummer, records) {
  if (!bearbeitungsnummer) return null
  return records.find((r) => r.referenzierteErstmeldung === bearbeitungsnummer) ?? null
}

/**
 * What happened to one report we previously alerted on.
 *
 * Returns { outcome, record, successor }. `record` is the report as it stands
 * in today's feed where it is still present, so the caller can quote a real end
 * date rather than the one it remembered.
 */
export function classifyReport(bearbeitungsnummer, index, today) {
  const records = index?.records ?? []
  const record = records.find((r) => r.bearbeitungsnummer === bearbeitungsnummer) ?? null

  if (record) {
    return isActiveShortage(record, today)
      ? { outcome: ONGOING, record, successor: null }
      : { outcome: RESOLVED, record, successor: null }
  }

  // Gone from the feed. Renumbered, or genuinely withdrawn — and those mean
  // opposite things to a patient, so the difference is never guessed at.
  const successor = findSuccessor(bearbeitungsnummer, records)
  if (successor) {
    return { outcome: CONTINUED, record: null, successor }
  }

  // Chains can be longer than one link. If the user has not opened the app for
  // a while, the intermediate report may itself have gone before we ever saw
  // it, and then nothing in today's feed references what we remember. That is
  // genuinely unknown, and it is reported as unknown.
  return { outcome: UNKNOWN, record: null, successor: null }
}

/**
 * What happened to a medication as a whole, given the reports it was last
 * alerted on.
 *
 * `alert` is the stored record of the last alert: { bearbeitungsnummern: [] }.
 * Returns null when there is nothing to say, so the caller can render the
 * ordinary status untouched.
 *
 * Any single report still running keeps the medication in its alert state; a
 * shortage does not become good news because a second, unrelated one ended.
 */
export function resolveAlert(alert, index, today) {
  const remembered = alert?.bearbeitungsnummern ?? []
  if (remembered.length === 0) return null

  const reports = remembered.map((bn) => ({ bearbeitungsnummer: bn, ...classifyReport(bn, index, today) }))

  const ongoing = reports.filter((r) => r.outcome === ONGOING)
  const continued = reports.filter((r) => r.outcome === CONTINUED)
  const resolved = reports.filter((r) => r.outcome === RESOLVED)
  const unknown = reports.filter((r) => r.outcome === UNKNOWN)

  // Still running under any number: nothing has changed for the patient, but
  // the successor numbers are handed back so the caller can follow the chain
  // forward. Following it incrementally is what keeps multi-link chains
  // resolvable for someone who opens the app every few weeks.
  if (ongoing.length > 0 || continued.length > 0) {
    return {
      status: ONGOING,
      reports,
      // The renumbered reports replace what we remembered; the ones still
      // present under their original number stay as they are.
      folgenummern: [
        ...ongoing.map((r) => r.bearbeitungsnummer),
        ...continued.map((r) => r.successor.bearbeitungsnummer),
      ],
    }
  }

  // Nothing is running any more, but something left the feed without a
  // successor we can see. Not good news, not bad news, and we say exactly that.
  if (unknown.length > 0) {
    return { status: UNKNOWN, reports, folgenummern: [] }
  }

  return { status: RESOLVED, reports, folgenummern: [], beendetAm: latestEnde(resolved) }
}

function latestEnde(resolved) {
  return resolved
    .map((r) => r.record?.ende)
    .filter(Boolean)
    .sort()
    .at(-1) ?? null
}
