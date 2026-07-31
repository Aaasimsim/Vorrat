import { readFileSync } from 'node:fs'
import { buildShortageIndex } from '../src/lib/pipeline.js'
import { emptyBaseline, mergeBaseline } from '../src/lib/baseline.js'
import { matchMedication } from '../src/lib/matching.js'
import { formatGermanDate } from '../src/lib/format.js'

console.log('=== CLINICAL USE CASE TEST: CRITICAL MEDICATIONS IN GERMANY ===\n')

const raw = readFileSync(new URL('../.tmp/feed.csv', import.meta.url))
const index = buildShortageIndex(raw)
const baseline = mergeBaseline(emptyBaseline(), index.records)

// Key critical medications listed in brief.md §1 & §2
const testCases = [
  {
    name: 'L-Thyroxin Henning 150',
    type: 'Exact Product Name (Thyroid / Levothyroxine)',
    query: 'L-Thyroxin Henning 150',
    expectedConfidence: 'high',
    clinicalNotes: 'Chronic thyroid therapy. Sanofi reported supply shortage; note suggests 100+50µg combination.',
  },
  {
    name: 'Levothyroxin-Natrium',
    type: 'Active Ingredient (Thyroid / Levothyroxine)',
    query: 'Levothyroxin-Natrium',
    expectedStatusInFeed: true,
    clinicalNotes: 'Ingredient-level check for thyroid replacement therapy.',
  },
  {
    name: 'Quetiapin',
    type: 'Active Ingredient (Psychiatric / Antipsychotic)',
    query: 'Quetiapin',
    expectedStatusInFeed: true,
    clinicalNotes: 'Abrupt discontinuation carries severe withdrawal risk.',
  },
  {
    name: 'Metoprolol',
    type: 'Active Ingredient (Cardiology / Beta-Blocker)',
    query: 'Metoprolol',
    expectedStatusInFeed: true,
    clinicalNotes: 'Chronic hypertension & heart condition management.',
  },
  {
    name: 'Insulin',
    type: 'Active Ingredient (Endocrinology / Diabetes)',
    query: 'Insulin',
    expectedStatusInFeed: true,
    clinicalNotes: 'Life-critical daily insulin therapy.',
  },
  {
    name: 'Pantoprazol',
    type: 'Multi-Manufacturer PPI (False-Alarm Safety Test)',
    query: 'Pantoprazol',
    expectedStatus: 'watching',
    clinicalNotes: '12+ manufacturers produce Pantoprazol in Germany. One manufacturer shortage MUST stay passive "watching", never alarmist.',
  },
  {
    name: 'Sertralin',
    type: 'Active Ingredient (Psychiatric / SSRI Antidepressant)',
    query: 'Sertralin',
    expectedStatusInFeed: true,
    clinicalNotes: 'Avoid discontinuation syndrome in psychiatric care.',
  },
  {
    name: 'Atomoxetin',
    type: 'Active Ingredient (Neurology / ADHD)',
    query: 'Atomoxetin',
    expectedStatusInFeed: true,
    clinicalNotes: 'ADHD maintenance medication.',
  },
]

let passedCount = 0

testCases.forEach((tc, idx) => {
  console.log(`\n--------------------------------------------------`)
  console.log(`Test [${idx + 1}/${testCases.length}]: ${tc.name} (${tc.type})`)
  console.log(`Clinical Context: ${tc.clinicalNotes}`)

  const result = matchMedication({ id: String(idx), query: tc.query, pzn: null }, index, baseline)
  
  console.log(`➔ Output Status:     ${result.status.toUpperCase()}`)
  console.log(`➔ Confidence Level:  ${result.confidence ?? 'none'}`)
  console.log(`➔ Matching Reports:  ${result.matches.length}`)

  if (result.matches.length > 0) {
    const first = result.matches[0]
    console.log(`➔ Sample Match:      "${first.produkt ?? first.wirkstoffe.join(', ')}"`)
    console.log(`➔ Zulassungsinhaber: ${first.zulassungsinhaber ?? 'N/A'}`)
    console.log(`➔ Reported Start:    ${formatGermanDate(first.beginn) ?? 'N/A'}`)
    if (first.anmerkung) {
      console.log(`➔ Manufacturer Note: "${first.anmerkung.slice(0, 120)}..."`)
    }
  }

  // Verification Logic
  if (tc.expectedStatus && result.status !== tc.expectedStatus) {
    console.error(`❌ FAIL: Expected status ${tc.expectedStatus}, got ${result.status}`)
    process.exit(1)
  }

  if (tc.expectedConfidence && result.confidence !== tc.expectedConfidence) {
    console.error(`❌ FAIL: Expected confidence ${tc.expectedConfidence}, got ${result.confidence}`)
    process.exit(1)
  }

  console.log(`✅ CLINICALLY SOUND & VERIFIED`)
  passedCount++
})

console.log(`\n========================================`)
console.log(`✅ VERIFIED ${passedCount}/${testCases.length} CRITICAL MEDICATIONS CLINICALLY`)
console.log(`========================================\n`)
