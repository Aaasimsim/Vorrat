import { readFileSync, writeFileSync } from 'node:fs'
import iconv from 'iconv-lite'

/**
 * Removes the E-Mail and Telefon columns from a BfArM snapshot before it is
 * archived.
 *
 * The feed carries direct contact details for named individuals at
 * manufacturers (firstname.lastname@company). It is public federal data, but
 * committing it daily would bake those people's contact details into a public
 * git history permanently and turn the archive into a scrape target. Vorrat
 * reads neither column, so keeping them buys nothing — and dropping them is
 * the same data-minimisation posture the app already takes with medication
 * lists.
 *
 * Everything else is preserved byte-for-byte in Windows-1252, so the archive
 * still parses with the same pipeline and drift stays reproducible.
 */
const DROP_COLUMNS = ['E-Mail', 'Telefon']

/**
 * Quote-aware split on the delimiter. A naive `split(';')` breaks the ~7% of
 * rows whose Wirkstoffe field is a quoted multi-ingredient value containing
 * semicolons ("Ezetimib; Simvastatin") — and skipping those rows instead would
 * preserve exactly the contact details this script exists to remove.
 */
function splitRow(line) {
  const fields = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (char === '"') {
      // A doubled quote inside a quoted field is an escaped literal quote.
      if (inQuotes && line[i + 1] === '"') {
        current += '""'
        i += 1
      } else {
        inQuotes = !inQuotes
        current += char
      }
    } else if (char === ';' && !inQuotes) {
      fields.push(current)
      current = ''
    } else {
      current += char
    }
  }
  fields.push(current)
  return fields
}

export function stripContactColumns(buffer) {
  const text = iconv.decode(buffer, 'win1252')
  const eol = text.includes('\r\n') ? '\r\n' : '\n'
  const lines = text.split(/\r?\n/)
  if (lines.length === 0) return buffer

  const header = splitRow(lines[0])
  const dropIndexes = DROP_COLUMNS.map((name) => header.indexOf(name)).filter((i) => i >= 0)
  if (dropIndexes.length === 0) return buffer

  let skipped = 0
  const out = lines.map((line) => {
    if (line === '') return line
    const fields = splitRow(line)
    // A row that still does not match the header shape is genuinely
    // unparseable. Drop it rather than pass it through: passing it through is
    // how contact details survived the first version of this script.
    if (fields.length !== header.length) {
      skipped += 1
      return null
    }
    return fields.filter((_, i) => !dropIndexes.includes(i)).join(';')
  })

  if (skipped > 0) console.warn(`warning: dropped ${skipped} unparseable row(s)`)
  return iconv.encode(out.filter((line) => line !== null).join(eol), 'win1252')
}

const invokedDirectly = process.argv[1]?.endsWith('strip-contacts.mjs')
if (invokedDirectly) {
  const target = process.argv[2]
  if (!target) {
    console.error('usage: node scripts/strip-contacts.mjs <snapshot.csv>')
    process.exit(1)
  }
  const before = readFileSync(target)
  const after = stripContactColumns(before)
  writeFileSync(target, after)
  console.log(
    `stripped ${DROP_COLUMNS.join(', ')} from ${target} (${before.length} -> ${after.length} bytes)`,
  )
}
