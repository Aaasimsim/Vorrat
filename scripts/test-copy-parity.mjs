import { de } from '../src/copy/de.js'
import { en } from '../src/copy/en.js'

/**
 * A missing key does not throw — it renders as `undefined` in the UI, or
 * crashes when a *Fn key is called. Either way a patient sees a broken screen
 * on a health product. This catches drift the moment it lands instead.
 */
function walk(value, path, out) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value)) {
      walk(child, path ? `${path}.${key}` : key, out)
    }
    return out
  }
  out.set(path, Array.isArray(value) ? `array:${value.length}` : typeof value)
  return out
}

const deKeys = walk(de, '', new Map())
const enKeys = walk(en, '', new Map())

const failures = []

for (const [key, type] of deKeys) {
  if (!enKeys.has(key)) {
    failures.push(`missing in en.js: ${key}`)
  } else if (enKeys.get(key) !== type) {
    failures.push(`type differs for ${key}: de=${type} en=${enKeys.get(key)}`)
  }
}

for (const key of enKeys.keys()) {
  if (!deKeys.has(key)) failures.push(`missing in de.js: ${key}`)
}

// Every *Fn key is called with the arguments the UI actually passes, because a
// template literal referencing the wrong parameter name silently renders
// "undefined" rather than failing.
const FN_ARGS = {
  'alert.beginnFn': { datum: '13.07.2026' },
  'alert.endeFn': { datum: '03.08.2026' },
  'alert.quelleFn': { bearbeitungsnummer: 'LE2026002754', datum: '23.07.2026' },
  'entwarnung.beendetFn': { datum: '31.07.2026' },
  'entwarnung.quelleFn': { bearbeitungsnummer: 'LE2026002754' },
  'fehler.veraltetFn': { datum: '31.07.2026' },
  'aktualisiert.standFn': { datum: '31.07.2026' },
  'details.entfernenFn': { name: 'L-Thyroxin Henning 150' },
  // Both plural branches, since German and English pluralise differently.
  'details.anzeigenFn': { anzahl: 1 },
  'vorrat.reichtBisFn': { datum: '15.08.2026' },
  'vorrat.vorEngpassFn': { datum: '15.08.2026' },
  'vorrat.nachEngpassFn': { datum: '15.08.2026' },
  'vorrat.aufgebrauchtFn': { datum: '15.08.2026' },
}

const EXTRA_FN_ARGS = {
  'details.anzeigenFn': [{ anzahl: 2 }],
}

for (const [lang, copy] of [['de', de], ['en', en]]) {
  for (const [path, type] of walk(copy, '', new Map())) {
    if (type !== 'function') continue
    const args = FN_ARGS[path]
    if (!args) {
      failures.push(`${lang}.js: ${path} is a function with no test arguments in FN_ARGS`)
      continue
    }
    const fn = path.split('.').reduce((node, key) => node[key], copy)
    for (const callArgs of [args, ...(EXTRA_FN_ARGS[path] ?? [])]) {
      const rendered = fn(callArgs)
      if (typeof rendered !== 'string' || rendered.includes('undefined')) {
        failures.push(`${lang}.js: ${path}(${JSON.stringify(callArgs)}) rendered "${rendered}"`)
      }
    }
  }
}

if (failures.length > 0) {
  console.error('FAIL — copy files are out of sync:')
  for (const failure of failures) console.error(`  - ${failure}`)
  process.exit(1)
}

console.log(`PASS — de.js and en.js agree on ${deKeys.size} keys`)
