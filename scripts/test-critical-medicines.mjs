import { existsSync, readFileSync } from 'node:fs'
import { buildShortageIndex } from '../src/lib/pipeline.js'
import { emptyBaseline, mergeBaseline } from '../src/lib/baseline.js'
import { matchMedication } from '../src/lib/matching.js'
import { formatGermanDate } from '../src/lib/format.js'

console.log('=== CLINICAL USE CASE TEST: CRITICAL MEDICATIONS IN GERMANY ===\n')

/**
 * Both halves of this test are pinned, and they have to be pinned together.
 *
 * The expectations below name real reports. L-Thyroxin Henning 150 was a
 * high-confidence match because Sanofi had an open report against that exact
 * product name, and that report ended on 03.08.2026. Read against the live
 * clock the app correctly stops treating it as an alert, so the assertion
 * failed on 04.08.2026 without a line of application code changing.
 *
 * The feed is therefore a committed snapshot rather than the gitignored
 * .tmp/feed.csv this used to read (which also meant it could not run on a
 * fresh clone), and matchMedication is handed the date that snapshot was
 * taken. Fixed input, fixed clock, fixed expectations.
 *
 * Changing SNAPSHOT means re-verifying every expectation below against it.
 * These are clinical assertions about named products, not portable fixtures.
 */
const SNAPSHOT = 'data/snapshots/2026-07-31.csv'
const REFERENCE_DATE = '2026-07-31'

const snapshotUrl = new URL(`../${SNAPSHOT}`, import.meta.url)
if (!existsSync(snapshotUrl)) {
  console.error(`Missing snapshot ${SNAPSHOT}. It is committed to the repo; check the checkout.`)
  process.exit(1)
}

console.log(`Snapshot: ${SNAPSHOT}, evaluated as at ${REFERENCE_DATE}
`)

const raw = readFileSync(snapshotUrl)
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

  const result = matchMedication(
    { id: String(idx), query: tc.query, pzn: null },
    index,
    baseline,
    { today: REFERENCE_DATE },
  )
  
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
