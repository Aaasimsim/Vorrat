import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { canonicalWirkstoff, wirkstoffMatches } from '../src/lib/wirkstoffNames.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let failures = 0;

function assertMatch(userQuery, feedValue) {
  const matches = wirkstoffMatches(userQuery, feedValue);
  if (!matches) {
    console.error(`❌ FAIL: Expected "${userQuery}" to match "${feedValue}", but got false.`);
    console.error(`   Canonical user: "${canonicalWirkstoff(userQuery)}", feed: "${canonicalWirkstoff(feedValue)}"`);
    failures++;
  } else {
    console.log(`✓ MATCH: "${userQuery}" <-> "${feedValue}"`);
  }
}

function assertNoMatch(userQuery, feedValue) {
  const matches = wirkstoffMatches(userQuery, feedValue);
  if (matches) {
    console.error(`❌ FAIL: Expected "${userQuery}" NOT to match "${feedValue}", but got true.`);
    console.error(`   Canonical user: "${canonicalWirkstoff(userQuery)}", feed: "${canonicalWirkstoff(feedValue)}"`);
    failures++;
  } else {
    console.log(`✓ NO MATCH: "${userQuery}" </-> "${feedValue}"`);
  }
}

console.log('=== TEST 1: Table Assertions (Positive Matches) ===');
assertMatch('Pantoprazol', 'Pantoprazol-Natrium-Sesquihydrat');
assertMatch('Quetiapin', 'Quetiapinfumarat (Ph.Eur.)');
assertMatch('Escitalopram', 'Escitalopramoxalat');
assertMatch('Levothyroxin', 'Levothyroxin-Natrium');
assertMatch('Levothyroxin', 'Levothyroxin-Natrium (Ph.Eur.)');
assertMatch('Levothyroxin', 'Levothyroxin-Natrium x H<2>O');
assertMatch('Metoprolol', 'Metoprololtartrat (Ph.Eur.)');
assertMatch('Metoprolol', 'Metoprololsuccinat (Ph.Eur.)');

console.log('\n=== TEST 2: Regression Guard Assertions (Must NOT Match) ===');
assertNoMatch('Insulin glargin', 'Insulin aspart');
assertNoMatch('Metoprololtartrat', 'Metipranolol');
assertNoMatch('Amlodipin', 'Amiodaron');
assertNoMatch('Levothyroxin-Natrium', 'Liothyronin-Natrium');

console.log('\n=== TEST 3: 273 Observed Names Canonicalization Eyeball & Collapses ===');
const observedPath = path.join(__dirname, '..', 'docs', 'wirkstoff-names-observed.txt');
const rawContent = fs.readFileSync(observedPath, 'utf-8');
const lines = rawContent.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

const canonicalMap = new Map(); // canonicalString -> Array of original names

lines.forEach(name => {
  const c = canonicalWirkstoff(name);
  console.log(`  [ORIGINAL] ${name}`);
  console.log(`  └─> [CANONICAL] "${c}"`);

  if (!canonicalMap.has(c)) {
    canonicalMap.set(c, []);
  }
  canonicalMap.get(c).push(name);
});

console.log('\n=== COLLAPSED GROUPS (Multiple observed names mapping to same canonical form) ===');
let collapseCount = 0;
canonicalMap.forEach((originals, canonical) => {
  if (originals.length > 1) {
    collapseCount++;
    console.log(`\n📌 Canonical: "${canonical}" (${originals.length} variations):`);
    originals.forEach(o => console.log(`   - ${o}`));
  }
});

console.log(`\nTotal observed names processed: ${lines.length}`);
console.log(`Total unique canonical names: ${canonicalMap.size}`);
console.log(`Total collapsed variation groups: ${collapseCount}`);

console.log('\n========================================');
if (failures === 0) {
  console.log('✅ ALL TESTS PASSED SUCCESSFULLY.');
  process.exit(0);
} else {
  console.error(`❌ TEST FAILED WITH ${failures} FAILURE(S).`);
  process.exit(1);
}
