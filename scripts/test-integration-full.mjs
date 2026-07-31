import { readFileSync } from 'node:fs'
import { buildShortageIndex } from '../src/lib/pipeline.js'
import { emptyBaseline, mergeBaseline } from '../src/lib/baseline.js'
import { matchMedication } from '../src/lib/matching.js'
import { canonicalWirkstoff, wirkstoffMatches } from '../src/lib/wirkstoffNames.js'
import { isValidPzn, normalizePzn, formatPzn } from '../src/lib/pzn.js'
import { estimateRunOut, compareToShortage } from '../src/lib/runout.js'
import { de } from '../src/copy/de.js'
import { en } from '../src/copy/en.js'

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`)
    process.exit(1)
  }
  console.log(`✓ PASS: ${message}`)
}

console.log('=== VORRAT COMPREHENSIVE INTEGRATION & E2E TEST SUITE ===\n')

// 1. DATA PIPELINE & CSV PARSING
console.log('--- 1. Data Pipeline & Feed Parsing ---')
const raw = readFileSync(new URL('../.tmp/feed.csv', import.meta.url))
const index = buildShortageIndex(raw)
assert(index.recordCount > 0, `Parsed ${index.recordCount} shortage records from BfArM feed`)

const baseline = mergeBaseline(emptyBaseline(), index.records)
assert(Object.keys(baseline.entries).length > 0, `Built baseline with ${Object.keys(baseline.entries).length} ingredient/dosage entries`)

// 2. MATCHING TIER ACCURACY
console.log('\n--- 2. Matching Engine & Graded Confidence Model ---')

// High / PZN Match
const recordWithPzn = index.records.find((r) => r.pzns.length > 0)
if (recordWithPzn) {
  const pznMatch = matchMedication({ id: 't1', query: '', pzn: recordWithPzn.pzns[0] }, index, baseline)
  assert(pznMatch.status === 'affected' && pznMatch.confidence === 'high' && pznMatch.reason === 'pzn',
    `PZN match triggers High confidence alert (${recordWithPzn.pzns[0]})`)
}

// High / Exact Product Match
const recordWithProd = index.records.find((r) => r.produkt)
if (recordWithProd) {
  const prodMatch = matchMedication({ id: 't2', query: recordWithProd.produkt, pzn: null }, index, baseline)
  assert(prodMatch.status === 'affected' && prodMatch.confidence === 'high' && prodMatch.reason === 'produkt',
    `Exact product name triggers High confidence alert ("${recordWithProd.produkt}")`)
}

// Elevated / verskri Match
const verskriRecord = index.records.find((r) => r.klassifikationStufe === 'verskri' && r.wirkstoffe.length > 0)
if (verskriRecord) {
  const verskriMatch = matchMedication({ id: 't3', query: verskriRecord.wirkstoffe[0], pzn: null }, index, baseline)
  assert(verskriMatch.status === 'affected' && verskriMatch.confidence === 'elevated',
    `Supply-critical (verskri) classification triggers Elevated alert for ${verskriRecord.wirkstoffe[0]}`)
}

// Low / Passive Watching (Pantoprazol safety test)
const pantoMatch = matchMedication({ id: 't4', query: 'Pantoprazol', pzn: null }, index, baseline)
assert(pantoMatch.status === 'watching' && pantoMatch.confidence === 'low',
  'Multi-manufacturer ingredient (Pantoprazol) triggers passive Watching status (no false alarm)')

// Clear Match
const clearMatch = matchMedication({ id: 't5', query: 'InventedNonExistentMedicationXYZ', pzn: null }, index, baseline)
assert(clearMatch.status === 'clear' && clearMatch.matches.length === 0,
  'Unmatched medication returns Clear status')

// 3. SALT-FORM RECONCILIATION
console.log('\n--- 3. Pharmacopoeial Salt-Form Normalization ---')
assert(canonicalWirkstoff('Pantoprazol-Natrium-Sesquihydrat') === 'pantoprazol', 'Pantoprazol salt form canonicalized correctly')
assert(canonicalWirkstoff('Levothyroxin-Natrium (Ph.Eur.)') === 'levothyroxin', 'Levothyroxin salt form canonicalized correctly')
assert(wirkstoffMatches('Pantoprazol', 'Pantoprazol-Natrium-Sesquihydrat'), 'User typing "Pantoprazol" matches feed salt form')

// 4. PZN MODULO-11 CHECKSUM VALIDATION
console.log('\n--- 4. PZN Modulo-11 Checksum Validation ---')
assert(isValidPzn('00300469') === true, 'Valid PZN-8 passes checksum (00300469)')
assert(isValidPzn('02532824') === true, 'Valid PZN-8 passes checksum (02532824)')
assert(isValidPzn('11111111') === false, 'Invalid transcription PZN-8 fails checksum (11111111)')
assert(formatPzn('12345678') === '1234 5678', 'Format PZN adds space divider correctly')

// 5. RUN-OUT SUPPLY CALCULATIONS
console.log('\n--- 5. Run-Out Supply Estimator & Date Math ---')
const runOutResult = estimateRunOut({
  packungsgroesse: 30,
  dosisProTag: 1,
  letzteAbholung: '2026-08-01',
  today: '2026-08-01',
})
assert(runOutResult.reichtBis === '2026-08-31', `Supply estimate date calculated correctly (${runOutResult.reichtBis})`)

const compBefore = compareToShortage({ reichtBis: '2026-08-05' }, '2026-08-10')
assert(compBefore === 'vor_engpass', 'Supply ends before shortage starts -> vor_engpass')

const compAfter = compareToShortage({ reichtBis: '2026-08-20' }, '2026-08-10')
assert(compAfter === 'nach_engpass', 'Shortage starts before supply ends -> nach_engpass')

// 6. BI-LINGUAL COPY PARITY & PHARMACY HANDOFF KEYS
console.log('\n--- 6. Bi-Lingual Copy Parity & UI Keys ---')
function getKeys(obj, prefix = '') {
  let keys = []
  for (const [k, v] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${k}` : k
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      keys = keys.concat(getKeys(v, full))
    } else {
      keys.push(full)
    }
  }
  return keys
}

const deKeys = getKeys(de).sort()
const enKeys = getKeys(en).sort()
assert(JSON.stringify(deKeys) === JSON.stringify(enKeys), `German (de.js) and English (en.js) agree 100% on all ${deKeys.length} copy keys`)
assert(de.apotheke && en.apotheke, 'Pharmacy counter handoff copy keys present in both languages')

console.log('\n========================================')
console.log('✅ ALL INTEGRATION & E2E TESTS PASSED SUCCESSFULLY!')
console.log('========================================\n')
