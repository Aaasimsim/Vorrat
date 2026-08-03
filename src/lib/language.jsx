import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { COPY, DEFAULT_LANGUAGE, detectLanguage, isSupported } from '../copy/index.js'

const LANGUAGE_KEY = 'vorrat.language.v1'

const LanguageContext = createContext(null)

function readStoredLanguage() {
  try {
    return window.localStorage.getItem(LANGUAGE_KEY)
  } catch {
    return null
  }
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() =>
    detectLanguage(readStoredLanguage(), navigator.languages ?? [navigator.language]),
  )

  // Assistive technology picks pronunciation and voice from this attribute, so
  // it has to track the actual UI language rather than stay on the value baked
  // into index.html. The title travels with it — it is what a browser tab, a
  // bookmark, and a shared link all show.
  useEffect(() => {
    const copy = COPY[language] ?? COPY[DEFAULT_LANGUAGE]
    document.documentElement.lang = language
    // Its own string rather than the tagline: the tagline is a full sentence
    // written to be read on screen, and a tab, a bookmark and a search result
    // all truncate it long before it makes sense.
    document.title = copy.app.seitentitel
  }, [language])

  function setLanguage(next) {
    if (!isSupported(next)) return
    setLanguageState(next)
    try {
      window.localStorage.setItem(LANGUAGE_KEY, next)
    } catch {
      // Storage being unavailable costs the user a re-pick next visit; it must
      // not stop them switching language now.
    }
  }

  const value = useMemo(
    () => ({ language, setLanguage, t: COPY[language] ?? COPY[DEFAULT_LANGUAGE] }),
    [language],
  )

  return <LanguageContext value={value}>{children}</LanguageContext>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider')
  return context
}

/** Shorthand for the common case of only needing the strings. */
export function useCopy() {
  return useLanguage().t
}
