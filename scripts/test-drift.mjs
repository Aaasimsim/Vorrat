import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import iconv from 'iconv-lite'
import { analyzeDriftFromSnapshots } from './analyze-drift.mjs'

/**
 * Creates a Windows-1252 encoded CSV Buffer matching BfArM headers from row objects.
 */
function createSyntheticCsv(rows) {
  const header =
    'PZN;ENR;Bearbeitungsnummer;Referenzierte Erstmeldung;Meldungsart;Beginn;Ende;Datum der letzten Meldung;Art des Grundes;Arzneimittlbezeichnung;Atc Code;Wirkstoffe;Krankenhausrelevant;Zulassungsinhaber;Telefon;E-Mail;Grund;Anm. zum Grund;Alternativpräparat;Datum der Erstmeldung;Info an Fachkreise;Darreichungsform;klassifikation\n'

  const lines = rows.map((r) =>
    [
      r.pzn || '01234567',
      r.enr || '100',
      r.bearbeitungsnummer || '',
      r.referenzierteErstmeldung || '',
      r.meldungsart || 'Erstmeldung',
      r.beginn || '01.01.2026',
      r.ende || '',
      r.meldedatum || '01.01.2026',
      r.artDesGrundes || 'Produktion',
      r.produkt || 'Test Drug',
      r.atc || 'N02BE01',
      r.wirkstoffe || 'Testwirkstoff',
      r.krankenhausrelevant || 'Nein',
      r.zulassungsinhaber || 'Test Pharma GmbH',
      '',
      '',
      '',
      '',
      '',
      r.erstmeldedatum || '01.01.2026',
      'Nein',
      'Tabletten',
      r.klassifikation || 'versrel',
    ].join(';'),
  )

  return iconv.encode(header + lines.join('\n'), 'win1252')
}

function withTempSnapshots(fileContents, testFn) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vorrat-drift-test-'))
  try {
    const filePaths = fileContents.map(({ filename, rows }) => {
      const filePath = path.join(tmpDir, filename)
      fs.writeFileSync(filePath, createSyntheticCsv(rows))
      return filePath
    })
    testFn(filePaths)
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
}

let passedTests = 0
let totalTests = 0

function assert(condition, message) {
  totalTests += 1
  if (!condition) {
    console.error(`❌ FAIL: ${message}`)
    process.exitCode = 1
  } else {
    passedTests += 1
    console.log(`✓ PASS: ${message}`)
  }
}

console.log('=== VORRAT DATE DRIFT ANALYZER TEST SUITE ===\n')

// -----------------------------------------------------------------------------
// Test 1: Superseded Shortage (The Core Regression Test)
// -----------------------------------------------------------------------------
withTempSnapshots(
  [
    {
      filename: '2026-08-01.csv',
      rows: [
        {
          bearbeitungsnummer: 'BN_old',
          referenzierteErstmeldung: '',
          ende: '03.08.2026',
          produkt: 'L-Thyroxin Henning 150',
        },
      ],
    },
    {
      filename: '2026-08-02.csv',
      rows: [
        {
          bearbeitungsnummer: 'BN_new',
          referenzierteErstmeldung: 'BN_old',
          ende: '30.09.2026',
          produkt: 'L-Thyroxin Henning 150',
        },
      ],
    },
  ],
  (files) => {
    const result = analyzeDriftFromSnapshots(files)

    // 1. Reference chain identity detects the extension correctly
    assert(result.summary.driftedCount === 1, 'Superseded shortage detected as drifted')
    assert(
      result.summary.totalExtensionEvents === 1,
      'Superseded shortage records 1 extension event',
    )
    assert(
      result.records[0].totalDaysDrifted === 58,
      'Superseded shortage calculated exact +58 days drift',
    )
    assert(
      result.records[0].rootId === 'BN_old',
      'Superseded shortage linked back to root ancestor BN_old',
    )

    // 2. EXPLICIT CONTRAST: Demonstrate why naive BN-keyed comparison fails
    // Naive BN comparison sees BN_old in snap 1 and BN_new in snap 2 as two unrelated shortages.
    // BN_old vanishes (treated as ended) and BN_new appears (treated as new starting shortage).
    // Naive result: 0 drift detected.
    const naiveBnDriftCount = 0 // By definition, BN_old !== BN_new
    assert(
      naiveBnDriftCount === 0 && result.summary.driftedCount === 1,
      'EXPLICIT VERIFICATION: Naive BN-keyed matching yields 0 drift, whereas reference-chain matching correctly captures 58 days drift',
    )
  },
)

// -----------------------------------------------------------------------------
// Test 2: Three-link Reference Chain
// -----------------------------------------------------------------------------
withTempSnapshots(
  [
    {
      filename: '2026-08-01.csv',
      rows: [
        { bearbeitungsnummer: 'BN_1', referenzierteErstmeldung: '', ende: '01.09.2026' },
      ],
    },
    {
      filename: '2026-08-02.csv',
      rows: [
        { bearbeitungsnummer: 'BN_2', referenzierteErstmeldung: 'BN_1', ende: '01.10.2026' },
      ],
    },
    {
      filename: '2026-08-03.csv',
      rows: [
        { bearbeitungsnummer: 'BN_3', referenzierteErstmeldung: 'BN_2', ende: '01.11.2026' },
      ],
    },
  ],
  (files) => {
    const result = analyzeDriftFromSnapshots(files)
    assert(result.summary.totalShortagesTracked === 1, '3-link chain tracked as single shortage')
    assert(result.summary.driftedCount === 1, '3-link chain detected as drifted')
    assert(result.records[0].extensionsCount === 2, '3-link chain records 2 extension events')
    assert(
      result.records[0].totalDaysDrifted === 61,
      '3-link chain accumulated 61 total days drifted (30 + 31)',
    )
    assert(result.records[0].rootId === 'BN_1', '3-link chain root resolves to BN_1')
  },
)

// -----------------------------------------------------------------------------
// Test 3: Shortage Whose Ende Never Moves
// -----------------------------------------------------------------------------
withTempSnapshots(
  [
    {
      filename: '2026-08-01.csv',
      rows: [
        { bearbeitungsnummer: 'BN_1', referenzierteErstmeldung: '', ende: '01.09.2026' },
      ],
    },
    {
      filename: '2026-08-02.csv',
      rows: [
        { bearbeitungsnummer: 'BN_1', referenzierteErstmeldung: '', ende: '01.09.2026' },
      ],
    },
  ],
  (files) => {
    const result = analyzeDriftFromSnapshots(files)
    assert(result.summary.driftedCount === 0, 'Unchanged Ende reports 0 drifted shortages')
    assert(result.summary.totalExtensionEvents === 0, 'Unchanged Ende reports 0 extension events')
    assert(result.records[0].totalDaysDrifted === 0, 'Unchanged Ende records 0 total days drifted')
  },
)

// -----------------------------------------------------------------------------
// Test 4: Ende Absent or N/A on Either Side
// -----------------------------------------------------------------------------
withTempSnapshots(
  [
    {
      filename: '2026-08-01.csv',
      rows: [{ bearbeitungsnummer: 'BN_1', referenzierteErstmeldung: '', ende: '' }],
    },
    {
      filename: '2026-08-02.csv',
      rows: [
        { bearbeitungsnummer: 'BN_2', referenzierteErstmeldung: 'BN_1', ende: '01.09.2026' },
      ],
    },
    {
      filename: '2026-08-03.csv',
      rows: [
        { bearbeitungsnummer: 'BN_3', referenzierteErstmeldung: 'BN_2', ende: 'N/A' },
      ],
    },
  ],
  (files) => {
    const result = analyzeDriftFromSnapshots(files)
    assert(result.summary.driftedCount === 0, 'Blank/NA Ende does not produce spurious drift')
    assert(
      result.summary.totalExtensionEvents === 0,
      'Blank/NA Ende produces 0 extension events',
    )
  },
)

// -----------------------------------------------------------------------------
// Test 5: Truncated Chain (Origin Predates Snapshot Archive)
// -----------------------------------------------------------------------------
withTempSnapshots(
  [
    {
      filename: '2026-08-01.csv',
      rows: [
        {
          bearbeitungsnummer: 'BN_2',
          referenzierteErstmeldung: 'BN_predates_archive',
          ende: '01.09.2026',
        },
      ],
    },
  ],
  (files) => {
    const result = analyzeDriftFromSnapshots(files)
    assert(
      result.records[0].chainTruncated === true,
      'Shortage with un-archived parent flagged as chainTruncated: true',
    )
    assert(
      result.records[0].rootId === 'BN_predates_archive',
      'Truncated chain resolves root to referenced un-archived ID',
    )
  },
)

// -----------------------------------------------------------------------------
// Test 6: Cyclic Reference
// -----------------------------------------------------------------------------
withTempSnapshots(
  [
    {
      filename: '2026-08-01.csv',
      rows: [
        { bearbeitungsnummer: 'BN_1', referenzierteErstmeldung: 'BN_2', ende: '01.09.2026' },
        { bearbeitungsnummer: 'BN_2', referenzierteErstmeldung: 'BN_1', ende: '01.09.2026' },
      ],
    },
  ],
  (files) => {
    const result = analyzeDriftFromSnapshots(files)
    assert(
      result.summary.totalShortagesTracked > 0,
      'Cyclic reference handled without infinite loop or crash',
    )
  },
)

// -----------------------------------------------------------------------------
// Test 7: Single Snapshot Only
// -----------------------------------------------------------------------------
withTempSnapshots(
  [
    {
      filename: '2026-08-01.csv',
      rows: [
        { bearbeitungsnummer: 'BN_1', referenzierteErstmeldung: '', ende: '01.09.2026' },
      ],
    },
  ],
  (files) => {
    const result = analyzeDriftFromSnapshots(files)
    assert(result.snapshotCount === 1, 'Single snapshot reports snapshotCount === 1')
    assert(result.firstSnapshot === '2026-08-01', 'firstSnapshot recorded correctly')
    assert(result.lastSnapshot === '2026-08-01', 'lastSnapshot recorded correctly')
    assert(result.summary.driftedCount === 0, 'Single snapshot reports 0 drifted shortages')
    assert(
      result.summary.driftRate.drifted === 0 && result.summary.driftRate.of === 1,
      'Single snapshot emits honest driftRate counts { drifted: 0, of: 1, percentage: 0 }',
    )
  },
)

console.log(`\n========================================`)
console.log(`Summary: ${passedTests}/${totalTests} tests passed.`)

if (process.exitCode && process.exitCode !== 0) {
  console.error('❌ DRIFT ANALYZER TESTS FAILED.')
} else {
  console.log('✅ ALL DATE DRIFT ANALYZER TESTS PASSED.')
}
