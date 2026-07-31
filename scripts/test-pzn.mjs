import { readFileSync } from 'node:fs'
import { isValidPzn, normalizePzn, formatPzn } from '../src/lib/pzn.js'
import { buildShortageIndex } from '../src/lib/pipeline.js'

let failures = 0

function check(label, actual, expected) {
  const ok = actual === expected
  if (!ok) failures += 1
  console.log(`${ok ? '✓' : '✗'} ${label} — got ${JSON.stringify(actual)}`)
}

check('normalize strips PZN- prefix and spaces', normalizePzn('PZN-1234 5678'), '12345678')
check('format groups as 1234 5678', formatPzn('12345678'), '1234 5678')
check('format leaves short input alone', formatPzn('123'), '123')
check('rejects too short', isValidPzn('1234567'), false)
check('rejects non-numeric', isValidPzn('abcdefgh'), false)
check('rejects empty', isValidPzn(''), false)
check('rejects null', isValidPzn(null), false)

// Real PZNs from the live feed, including one with a leading zero.
check('accepts real PZN 00300469', isValidPzn('00300469'), true)
check('accepts real PZN 02532824', isValidPzn('02532824'), true)
check('accepts the same PZN when spaced', isValidPzn('0030 0469'), true)
// Single digit altered — the checksum's whole purpose.
check('rejects a transcription error', isValidPzn('00300468'), false)

// The population check: the algorithm has to hold against the whole feed, not
// a handful of hand-picked examples.
const index = buildShortageIndex(readFileSync(new URL('../.tmp/feed.csv', import.meta.url)))
const pzns = [...new Set(index.records.flatMap((r) => r.pzns))]
const invalid = pzns.filter((p) => !isValidPzn(p))
console.log(`\nfeed PZNs: ${pzns.length}, failing checksum: ${invalid.length} ${JSON.stringify(invalid)}`)

// BfArM's own data contains a bad PZN, so this asserts the rate stays low
// rather than zero — and documents why validation must never block input.
if (invalid.length / pzns.length > 0.01) {
  console.error('FAIL — more than 1% of real PZNs fail the checksum; the algorithm is wrong')
  failures += 1
}

console.log(failures === 0 ? '\nPASS — PZN checks' : `\nFAIL — ${failures} PZN check(s)`)
process.exit(failures === 0 ? 0 : 1)
