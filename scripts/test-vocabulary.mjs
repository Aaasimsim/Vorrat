import { readFileSync } from 'node:fs'
import { buildShortageIndex } from '../src/lib/pipeline.js'
import { buildVocabulary, isKnownName, suggestNames } from '../src/lib/vocabulary.js'
import { emptyBaseline, mergeBaseline } from '../src/lib/baseline.js'
import { matchMedication } from '../src/lib/matching.js'

let failures = 0
function check(label, actual, expected) {
  const ok = actual === expected
  if (!ok) failures += 1
  console.log(`${ok ? '✓' : '✗'} ${label} — got ${JSON.stringify(actual)}`)
}

const index = buildShortageIndex(readFileSync(new URL('../.tmp/feed.csv', import.meta.url)))
const vocabulary = buildVocabulary(index)
const baseline = mergeBaseline(emptyBaseline(), index.records)

console.log(
  `vocabulary: ${vocabulary.wirkstoffe.size} ingredients, ${vocabulary.produkte.size} products\n`,
)

console.log('--- recognition ---')
check('recognises a plain ingredient name', isKnownName('Pantoprazol', vocabulary), true)
check('recognises it through the salt form', isKnownName('Levothyroxin', vocabulary), true)
check('recognises an exact product name', isKnownName('L-Thyroxin Henning 150', vocabulary), true)
check('is case-insensitive', isKnownName('pantoprazol', vocabulary), true)
check('rejects a typo', isKnownName('Pantoprazl', vocabulary), false)
check('rejects invented text', isKnownName('Zzzblah', vocabulary), false)
check('rejects empty input', isKnownName('', vocabulary), false)

console.log('\n--- suggestions ---')
const typo = suggestNames('Pantoprazl', vocabulary)
check('a typo surfaces the real ingredient', typo.some((n) => /Pantoprazol/i.test(n)), true)
const partial = suggestNames('Levo', vocabulary)
check('a partial name surfaces matches', partial.length > 0, true)
check('very short input suggests nothing', suggestNames('Le', vocabulary).length, 0)
check('unrelated text suggests nothing', suggestNames('Zzzqqqxyz', vocabulary).length, 0)
console.log(`  "Pantoprazl" -> ${JSON.stringify(typo.slice(0, 3))}`)
console.log(`  "Levo"       -> ${JSON.stringify(partial.slice(0, 3))}`)

console.log('\n--- the distinction that matters ---')
// A real medication with no shortage vs text we could not place. Both find
// nothing; only the first is grounds for reassurance.
const known = matchMedication({ id: '1', query: 'Pantoprazol', pzn: null }, index, baseline, {
  vocabulary,
})
const unknown = matchMedication({ id: '2', query: 'Zzzblah', pzn: null }, index, baseline, {
  vocabulary,
})
check('unplaceable text is flagged unrecognised', unknown.status === 'clear' && unknown.erkannt, false)
check('a known name in shortage is not clear', known.status !== 'clear', true)

// A medication that is genuinely fine: recognised, no active report.
const endedOnly = index.records.find((r) => r.ende && r.ende < new Date().toISOString().slice(0, 10))
if (endedOnly) {
  const res = matchMedication(
    { id: '3', query: endedOnly.produkt, pzn: null },
    index,
    baseline,
    { vocabulary },
  )
  console.log(
    `  ended-shortage product "${endedOnly.produkt}" -> status=${res.status} erkannt=${res.erkannt}`,
  )
  check('a name we know stays recognised after its shortage ends', res.erkannt, true)
}

// A valid PZN counts as recognition even when the name is unfamiliar.
const pznOnly = matchMedication(
  { id: '4', query: 'Hausmarke XY', pzn: '00300469' },
  index,
  baseline,
  { vocabulary },
)
check('a valid PZN counts as recognition', pznOnly.erkannt !== false, true)

console.log(failures === 0 ? '\nPASS — vocabulary checks' : `\nFAIL — ${failures} check(s)`)
process.exit(failures === 0 ? 0 : 1)
