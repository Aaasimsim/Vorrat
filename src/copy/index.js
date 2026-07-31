import { de } from './de.js'
import { en } from './en.js'

export const COPY = { de, en }

export const LANGUAGES = [
  { code: 'de', label: 'Deutsch' },
  { code: 'en', label: 'English' },
]

export const DEFAULT_LANGUAGE = 'de'

export function isSupported(code) {
  return Object.prototype.hasOwnProperty.call(COPY, code)
}

/**
 * German is the fallback rather than English: these are German patients
 * reading German pharmacy records, and the BfArM text inside the app is
 * German whichever UI language is chosen.
 */
export function detectLanguage(stored, navigatorLanguages = []) {
  if (isSupported(stored)) return stored
  for (const tag of navigatorLanguages) {
    const base = String(tag).toLowerCase().split('-')[0]
    if (isSupported(base)) return base
  }
  return DEFAULT_LANGUAGE
}
