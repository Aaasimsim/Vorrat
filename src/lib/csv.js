import Papa from 'papaparse'
import iconv from 'iconv-lite'

/**
 * BfArM's feed is Windows-1252, not UTF-8 — decoding as UTF-8 corrupts every umlaut.
 * `input` may be a Node Buffer (serverless fetch) or an ArrayBuffer (browser fetch).
 */
export function decodeShortageCsv(input) {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input)
  return iconv.decode(buffer, 'win1252')
}

/**
 * Wirkstoffe values are quoted and semicolon-delimited *inside* the field
 * (e.g. "Ezetimib; Simvastatin"), so a naive split(';') breaks ~7% of rows.
 */
export function parseShortageCsv(csvText) {
  const { data, errors } = Papa.parse(csvText, {
    header: true,
    delimiter: ';',
    skipEmptyLines: true,
  })

  const fatal = errors.filter((e) => e.type !== 'FieldMismatch')
  if (fatal.length > 0) {
    throw new Error(`CSV parse error: ${fatal[0].message} (row ${fatal[0].row})`)
  }

  return data
}
