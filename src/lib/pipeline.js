import { decodeShortageCsv, parseShortageCsv } from './csv.js'
import {
  naOrNull,
  isPlaceholderPzn,
  splitList,
  parseGermanDate,
  isJa,
  classifyKlassifikation,
} from './normalize.js'

/**
 * Rows share one Bearbeitungsnummer when the same shortage report lists
 * several pack sizes (PZNs). Collapse those into a single record per report.
 */
function groupByBearbeitungsnummer(rows) {
  const groups = new Map()
  for (const row of rows) {
    const bn = naOrNull(row['Bearbeitungsnummer'])
    if (!bn) continue
    if (!groups.has(bn)) groups.set(bn, [])
    groups.get(bn).push(row)
  }
  return groups
}

function toRecord(bearbeitungsnummer, rows) {
  const first = rows[0]

  const pzns = [
    ...new Set(
      rows
        .map((r) => naOrNull(r['PZN']))
        .filter((pzn) => pzn && !isPlaceholderPzn(pzn)),
    ),
  ]

  const klassifikationRaw = naOrNull(first['klassifikation'])

  return {
    bearbeitungsnummer,
    referenzierteErstmeldung: naOrNull(first['Referenzierte Erstmeldung']),
    meldungsart: naOrNull(first['Meldungsart']),
    pzns,
    wirkstoffe: splitList(first['Wirkstoffe']),
    atc: naOrNull(first['Atc Code']),
    produkt: naOrNull(first['Arzneimittlbezeichnung']),
    darreichungsform: naOrNull(first['Darreichungsform']),
    zulassungsinhaber: naOrNull(first['Zulassungsinhaber']),
    krankenhausrelevant: isJa(first['Krankenhausrelevant']),
    beginn: parseGermanDate(first['Beginn']),
    ende: parseGermanDate(first['Ende']),
    grund: naOrNull(first['Grund']),
    artDesGrundes: naOrNull(first['Art des Grundes']),
    anmerkung: naOrNull(first['Anm. zum Grund']),
    alternativpraeparat: naOrNull(first['Alternativpräparat']),
    klassifikation: klassifikationRaw,
    klassifikationStufe: classifyKlassifikation(klassifikationRaw),
    meldedatum: parseGermanDate(first['Datum der letzten Meldung']),
    erstmeldedatum: parseGermanDate(first['Datum der Erstmeldung']),
  }
}

/**
 * Buffer/ArrayBuffer of the raw BfArM CSV -> { generatedAt, records }.
 * Does not filter on Beginn/Ende — a future Beginn is the entire point of
 * the product, and records with a past Ende are left for the caller (the
 * feed itself sometimes keeps them around after the fact).
 */
export function buildShortageIndex(rawCsv) {
  const text = decodeShortageCsv(rawCsv)
  const rows = parseShortageCsv(text)
  const groups = groupByBearbeitungsnummer(rows)

  const records = [...groups.entries()].map(([bn, group]) => toRecord(bn, group))

  return {
    generatedAt: new Date().toISOString(),
    recordCount: records.length,
    records,
  }
}
