import {
  classifyReport,
  resolveAlert,
  findSuccessor,
  ONGOING,
  RESOLVED,
  CONTINUED,
  UNKNOWN,
} from '../src/lib/resolution.js'

/**
 * The dangerous failure here is a false all-clear: telling someone who has been
 * rationing tablets that their medication is available again when in fact the
 * report was renumbered and the shortage extended. Most of these tests exist to
 * pin that case down.
 */

let passed = 0
const failures = []

function check(label, condition) {
  if (condition) {
    passed += 1
    console.log(`✓ PASS: ${label}`)
  } else {
    failures.push(label)
    console.log(`✗ FAIL: ${label}`)
  }
}

const TODAY = '2026-08-03'

function record(overrides) {
  return {
    bearbeitungsnummer: 'LE0001',
    referenzierteErstmeldung: null,
    ende: null,
    produkt: 'Testpräparat',
    ...overrides,
  }
}

function index(records) {
  return { records }
}

// --- classifyReport ---------------------------------------------------------

check(
  'report still in the feed with no end date is ongoing',
  classifyReport('LE0001', index([record({ ende: null })]), TODAY).outcome === ONGOING,
)

check(
  'report still in the feed ending in the future is ongoing',
  classifyReport('LE0001', index([record({ ende: '2026-12-31' })]), TODAY).outcome === ONGOING,
)

check(
  'report ending today is still ongoing (the end date is inclusive)',
  classifyReport('LE0001', index([record({ ende: TODAY })]), TODAY).outcome === ONGOING,
)

check(
  'report present with an end date in the past is resolved',
  classifyReport('LE0001', index([record({ ende: '2026-07-31' })]), TODAY).outcome === RESOLVED,
)

// The case that matters most. A vanished report whose successor is in the feed
// is an extension, not a resolution.
const renumbered = index([
  record({ bearbeitungsnummer: 'LE0002', referenzierteErstmeldung: 'LE0001', ende: '2026-12-31' }),
])
check(
  'report that vanished but was renumbered is continued, not resolved',
  classifyReport('LE0001', renumbered, TODAY).outcome === CONTINUED,
)
check(
  'continued report hands back the successor record',
  classifyReport('LE0001', renumbered, TODAY).successor.bearbeitungsnummer === 'LE0002',
)

check(
  'report that vanished with no successor is unknown, never resolved',
  classifyReport('LE0001', index([record({ bearbeitungsnummer: 'LE9999' })]), TODAY).outcome ===
    UNKNOWN,
)

check(
  'an empty feed reports unknown rather than resolved',
  classifyReport('LE0001', index([]), TODAY).outcome === UNKNOWN,
)

check('findSuccessor tolerates a null number', findSuccessor(null, []) === null)

// --- resolveAlert -----------------------------------------------------------

check(
  'no remembered reports produces no statement at all',
  resolveAlert({ bearbeitungsnummern: [] }, index([record({})]), TODAY) === null,
)

check('a missing alert record produces no statement', resolveAlert(null, index([]), TODAY) === null)

check(
  'a single expired report is an all-clear',
  resolveAlert({ bearbeitungsnummern: ['LE0001'] }, index([record({ ende: '2026-07-01' })]), TODAY)
    .status === RESOLVED,
)

check(
  'the all-clear carries the date the shortage ended',
  resolveAlert({ bearbeitungsnummern: ['LE0001'] }, index([record({ ende: '2026-07-01' })]), TODAY)
    .beendetAm === '2026-07-01',
)

check(
  'a renumbered report is never an all-clear',
  resolveAlert({ bearbeitungsnummern: ['LE0001'] }, renumbered, TODAY).status === ONGOING,
)

check(
  'a renumbered report hands back the new number so the chain can be followed',
  resolveAlert({ bearbeitungsnummern: ['LE0001'] }, renumbered, TODAY).folgenummern[0] === 'LE0002',
)

// One ended, one still running. A shortage does not become good news because
// an unrelated second one ended.
const mixed = index([
  record({ bearbeitungsnummer: 'LE0001', ende: '2026-07-01' }),
  record({ bearbeitungsnummer: 'LE0002', ende: '2026-12-31' }),
])
check(
  'one ended and one running is not an all-clear',
  resolveAlert({ bearbeitungsnummern: ['LE0001', 'LE0002'] }, mixed, TODAY).status === ONGOING,
)

check(
  'a vanished report with no successor blocks the all-clear',
  resolveAlert(
    { bearbeitungsnummern: ['LE0001', 'LE0002'] },
    index([record({ bearbeitungsnummer: 'LE0001', ende: '2026-07-01' })]),
    TODAY,
  ).status === UNKNOWN,
)

check(
  'all reports expired is an all-clear even across several reports',
  resolveAlert(
    { bearbeitungsnummern: ['LE0001', 'LE0002'] },
    index([
      record({ bearbeitungsnummer: 'LE0001', ende: '2026-07-01' }),
      record({ bearbeitungsnummer: 'LE0002', ende: '2026-07-15' }),
    ]),
    TODAY,
  ).status === RESOLVED,
)

check(
  'the all-clear reports the latest end date across several reports',
  resolveAlert(
    { bearbeitungsnummern: ['LE0001', 'LE0002'] },
    index([
      record({ bearbeitungsnummer: 'LE0001', ende: '2026-07-01' }),
      record({ bearbeitungsnummer: 'LE0002', ende: '2026-07-15' }),
    ]),
    TODAY,
  ).beendetAm === '2026-07-15',
)

// Multi-link chain, walked one step at a time across sessions.
const chain = index([
  record({ bearbeitungsnummer: 'LE0003', referenzierteErstmeldung: 'LE0002', ende: '2027-01-31' }),
])
check(
  'a two-link chain resolves when the intermediate number is what we remember',
  resolveAlert({ bearbeitungsnummern: ['LE0002'] }, chain, TODAY).folgenummern[0] === 'LE0003',
)
check(
  'a chain whose intermediate link was never seen is unknown, not resolved',
  resolveAlert({ bearbeitungsnummern: ['LE0001'] }, chain, TODAY).status === UNKNOWN,
)

// --- real feed sanity -------------------------------------------------------

// Guards the empirical claim the whole design rests on: in the live feed,
// reports sit around after their end date rather than disappearing.
const { readFileSync, existsSync } = await import('node:fs')
const snapshot = 'data/snapshots/2026-08-03.csv'
if (existsSync(snapshot)) {
  const { buildShortageIndex } = await import('../src/lib/pipeline.js')
  const live = buildShortageIndex(readFileSync(snapshot))
  const expired = live.records.filter((r) => r.ende && r.ende < TODAY)
  check(
    `live feed keeps expired reports listed (found ${expired.length})`,
    expired.length > 0,
  )
  check(
    'every expired live report classifies as resolved, not unknown',
    expired.every((r) => classifyReport(r.bearbeitungsnummer, live, TODAY).outcome === RESOLVED),
  )
} else {
  console.log(`(skipped live-feed checks: ${snapshot} not present)`)
}

console.log('\n========================================')
console.log(`Summary: ${passed}/${passed + failures.length} tests passed.`)
if (failures.length > 0) {
  console.error('FAILED:')
  for (const f of failures) console.error(`  - ${f}`)
  process.exit(1)
}
console.log('✅ ALL RESOLUTION TESTS PASSED.')
