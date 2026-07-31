import { readFileSync } from 'node:fs'
import { buildShortageIndex } from '../src/lib/pipeline.js'
import { emptyBaseline, mergeBaseline } from '../src/lib/baseline.js'
import { matchMedication } from '../src/lib/matching.js'

const raw = readFileSync(new URL('../.tmp/feed.csv', import.meta.url))
const index = buildShortageIndex(raw)

console.log(`records: ${index.recordCount}`)

const withPzns = index.records.filter((r) => r.pzns.length > 0)
const withMultiWirkstoff = index.records.filter((r) => r.wirkstoffe.length > 1)
const futureBeginn = index.records.filter((r) => r.beginn && r.beginn > new Date().toISOString().slice(0, 10))
const verskri = index.records.filter((r) => r.klassifikationStufe === 'verskri')
const withAnmerkung = index.records.filter((r) => r.anmerkung)

console.log(`records with at least one real PZN: ${withPzns.length}`)
console.log(`records with multi-ingredient Wirkstoffe: ${withMultiWirkstoff.length}`)
console.log(`records with future Beginn: ${futureBeginn.length}`)
console.log(`records classified verskri: ${verskri.length}`)
console.log(`records with a manufacturer note (Anm. zum Grund): ${withAnmerkung.length}`)

const baseline = mergeBaseline(emptyBaseline(), index.records)
console.log(`baseline entries (Wirkstoff+Darreichungsform combos): ${Object.keys(baseline.entries).length}`)

// Sanity check against the live L-Thyroxin Henning 150 example from brief.md §2.
const thyroxin = index.records.find((r) => r.produkt === 'L-Thyroxin Henning 150')
console.log('\n--- L-Thyroxin Henning 150 record ---')
console.log(JSON.stringify(thyroxin, null, 2))

console.log('\n--- matching: exact product name (should be high/produkt) ---')
console.log(
  matchMedication({ id: '1', query: 'L-Thyroxin Henning 150', pzn: null }, index, baseline),
)

console.log('\n--- matching: Wirkstoff only (should be elevated or watching) ---')
console.log(
  matchMedication({ id: '2', query: 'Levothyroxin-Natrium', pzn: null }, index, baseline),
)

console.log('\n--- matching: PZN from the record above ---')
if (thyroxin?.pzns[0]) {
  console.log(
    matchMedication({ id: '3', query: '', pzn: thyroxin.pzns[0] }, index, baseline),
  )
}

console.log('\n--- matching: something not in the feed at all (should be clear) ---')
console.log(matchMedication({ id: '4', query: 'Ibuprofen Doliprane Zzz', pzn: null }, index, baseline))

// The brief's canonical false-alarm case: many manufacturers make pantoprazole,
// so one having a production problem must NOT fire an alert.
console.log('\n--- matching: Pantoprazol (must be watching/low, not an alert) ---')
const panto = matchMedication({ id: '5', query: 'Pantoprazol', pzn: null }, index, baseline)
console.log({
  status: panto.status,
  confidence: panto.confidence,
  reason: panto.reason,
  matchCount: panto.matches.length,
  manufacturers: [...new Set(panto.matches.map((m) => m.zulassungsinhaber))],
})
