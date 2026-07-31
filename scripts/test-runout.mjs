import { estimateRunOut, compareToShortage } from '../src/lib/runout.js';

let failures = 0;

function assert(description, actual, expected) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr === expectedStr) {
    console.log(`✓ PASS: ${description}`);
  } else {
    console.error(`❌ FAIL: ${description}`);
    console.error(`   Actual:   ${actualStr}`);
    console.error(`   Expected: ${expectedStr}`);
    failures++;
  }
}

console.log('=== TEST SUITE: estimateRunOut & compareToShortage ===\n');

// 1. Normal case
assert(
  'Normal case: 30 tablets, 1/day, pickup 2026-08-01, today 2026-08-01',
  estimateRunOut({ packungsgroesse: 30, dosisProTag: 1, letzteAbholung: '2026-08-01' }, '2026-08-01'),
  { reichtBis: '2026-08-31', tageVerbleibend: 30, unsicher: false }
);

// 2. Fractional daily dose
assert(
  'Fractional dose: 50 tablets, 1.5/day (= 33.33 -> 33 days), pickup 2026-08-01',
  estimateRunOut({ packungsgroesse: 50, dosisProTag: 1.5, letzteAbholung: '2026-08-01' }, '2026-08-01'),
  { reichtBis: '2026-09-03', tageVerbleibend: 33, unsicher: false }
);

assert(
  'Fractional dose: 100 tablets, 0.5/day (= 200 days), pickup 2026-08-01',
  estimateRunOut({ packungsgroesse: 100, dosisProTag: 0.5, letzteAbholung: '2026-08-01' }, '2026-08-01'),
  { reichtBis: '2027-02-17', tageVerbleibend: 200, unsicher: false }
);

// 3. Already run out (negative days remaining)
assert(
  'Already run out: pickup 2026-07-01, 20 days supply, today 2026-08-01 (reichtBis 2026-07-21, -11 days)',
  estimateRunOut({ packungsgroesse: 20, dosisProTag: 1, letzteAbholung: '2026-07-01' }, '2026-08-01'),
  { reichtBis: '2026-07-21', tageVerbleibend: -11, unsicher: false }
);

// 4. Dose of 0 (must not divide by zero)
assert(
  'Dose of 0: invalid input',
  estimateRunOut({ packungsgroesse: 30, dosisProTag: 0, letzteAbholung: '2026-08-01' }, '2026-08-01'),
  { reichtBis: null, tageVerbleibend: null, unsicher: true }
);

// 5. Missing pack size
assert(
  'Missing pack size',
  estimateRunOut({ dosisProTag: 1, letzteAbholung: '2026-08-01' }, '2026-08-01'),
  { reichtBis: null, tageVerbleibend: null, unsicher: true }
);

// 6. Missing pickup date
assert(
  'Missing pickup date',
  estimateRunOut({ packungsgroesse: 30, dosisProTag: 1 }, '2026-08-01'),
  { reichtBis: null, tageVerbleibend: null, unsicher: true }
);

// 7. Pickup date in the future
assert(
  'Pickup in future: pickup 2026-08-10, 10 days supply, today 2026-08-01',
  estimateRunOut({ packungsgroesse: 10, dosisProTag: 1, letzteAbholung: '2026-08-10' }, '2026-08-01'),
  { reichtBis: '2026-08-20', tageVerbleibend: 19, unsicher: false }
);

// 8. Non-numeric junk in numeric fields
assert(
  'Junk string in packungsgroesse',
  estimateRunOut({ packungsgroesse: 'abc', dosisProTag: 1, letzteAbholung: '2026-08-01' }, '2026-08-01'),
  { reichtBis: null, tageVerbleibend: null, unsicher: true }
);

assert(
  'Junk null in dosisProTag',
  estimateRunOut({ packungsgroesse: 30, dosisProTag: null, letzteAbholung: '2026-08-01' }, '2026-08-01'),
  { reichtBis: null, tageVerbleibend: null, unsicher: true }
);

assert(
  'Junk NaN in dosisProTag',
  estimateRunOut({ packungsgroesse: 30, dosisProTag: NaN, letzteAbholung: '2026-08-01' }, '2026-08-01'),
  { reichtBis: null, tageVerbleibend: null, unsicher: true }
);

// 9. compareToShortage tests
assert(
  'compareToShortage vor_engpass: runs out 2026-08-05, shortage starts 2026-08-10',
  compareToShortage({ reichtBis: '2026-08-05' }, '2026-08-10'),
  'vor_engpass'
);

assert(
  'compareToShortage nach_engpass: shortage starts 2026-08-10, runs out 2026-08-20',
  compareToShortage({ reichtBis: '2026-08-20' }, '2026-08-10'),
  'nach_engpass'
);

assert(
  'compareToShortage nach_engpass: shortage starts 2026-08-10, runs out 2026-08-10 (same day)',
  compareToShortage({ reichtBis: '2026-08-10' }, '2026-08-10'),
  'nach_engpass'
);

assert(
  'compareToShortage unbekannt: null runOut',
  compareToShortage(null, '2026-08-10'),
  'unbekannt'
);

assert(
  'compareToShortage unbekannt: missing reichtBis',
  compareToShortage({ reichtBis: null }, '2026-08-10'),
  'unbekannt'
);

assert(
  'compareToShortage unbekannt: missing beginnIso',
  compareToShortage({ reichtBis: '2026-08-20' }, null),
  'unbekannt'
);

console.log('\n========================================');
if (failures === 0) {
  console.log('✅ ALL RUN-OUT TESTS PASSED.');
  process.exit(0);
} else {
  console.error(`❌ ${failures} RUN-OUT TEST(S) FAILED.`);
  process.exit(1);
}
