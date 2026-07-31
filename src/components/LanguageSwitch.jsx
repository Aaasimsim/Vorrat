import { LANGUAGES } from '../copy/index.js'
import { useLanguage } from '../lib/language.jsx'

/**
 * Radio-style buttons rather than a <select>: two options, and a visible
 * current state is easier to read at a glance than a collapsed dropdown —
 * which matters for the older users this is built for.
 *
 * Each label is written in its own language, so someone who cannot read the
 * current UI language can still find their way out.
 */
export function LanguageSwitch() {
  const { language, setLanguage } = useLanguage()

  return (
    <div className="flex flex-wrap gap-1" role="group" aria-label="Sprache / Language">
      {LANGUAGES.map(({ code, label }) => {
        const active = code === language
        return (
          <button
            key={code}
            type="button"
            lang={code}
            onClick={() => setLanguage(code)}
            aria-pressed={active}
            className={`min-h-11 rounded-md px-3 py-1.5 text-base font-semibold ${
              active
                ? 'bg-aktion text-aktion-text'
                : 'border border-linie text-tinte-weich hover:bg-papier-tief'
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
